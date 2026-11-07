import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
const output = join(process.cwd(), "out");
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name),
      ),
    )
  ).flat();
}
const files = (await walk(output))
  .filter(
    (p) =>
      /\.(html|js|css|png|svg|webmanifest|woff2?|txt)$/.test(p) &&
      !p.endsWith("/sw.js"),
  )
  .sort();
const hash = createHash("sha256");
for (const path of files) hash.update(await readFile(path));
const version = hash.digest("hex").slice(0, 16);
const urls = files.map((p) => "/" + relative(output, p).split("\\").join("/"));
urls.push("/");
const source = `/* Generated from the complete static export. Do not edit. */
const CACHE='compagnon-${version}';
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('compagnon-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match('/')).then(cached=>cached||fetch(event.request)));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    return fetch(event.request);
  }));
});
`;
await writeFile(join(output, "sw.js"), source);
console.log(
  `Offline worker generated: ${urls.length} assets, version ${version}`,
);
