import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { runInNewContext } from "node:vm";
const code = await readFile(new URL("../out/sw.js", import.meta.url), "utf8");
function worker() {
  const handlers = {},
    calls = { added: [], deleted: [], skip: 0, claimed: 0, network: 0 };
  const cache = {
    addAll: async (paths) => {
      calls.added = paths;
    },
    match: async (request) => {
      const path =
        typeof request === "string" ? request : new URL(request.url).pathname;
      return path === "/"
        ? { body: "cached app" }
        : path.includes("_next/")
          ? { body: "cached chunk" }
          : null;
    },
  };
  const self = {
    location: { origin: "https://example.test" },
    clients: {
      claim: async () => {
        calls.claimed++;
      },
    },
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
    skipWaiting: () => {
      calls.skip++;
    },
  };
  runInNewContext(code, {
    self,
    URL,
    caches: {
      open: async () => cache,
      keys: async () => ["compagnon-obsolete", "unrelated-cache"],
      delete: async (key) => {
        calls.deleted.push(key);
      },
    },
    fetch: async () => {
      calls.network++;
      throw new Error("offline");
    },
  });
  async function lifecycle(name) {
    let pending;
    handlers[name]({
      waitUntil: (p) => {
        pending = p;
      },
    });
    await pending;
  }
  async function request(path, mode = "navigate", method = "GET") {
    let response;
    handlers.fetch({
      request: { url: path, mode, method },
      respondWith: (p) => {
        response = p;
      },
    });
    return response ? await response : null;
  }
  return { calls, handlers, lifecycle, request };
}
test("precache includes every referenced local asset and install does not interrupt a game", async () => {
  const w = worker();
  await w.lifecycle("install");
  assert.ok(w.calls.added.includes("/"));
  assert.ok(w.calls.added.includes("/manifest.webmanifest"));
  assert.ok(
    w.calls.added.some(
      (p) => p.includes("/_next/static/") && p.endsWith(".js"),
    ),
  );
  assert.ok(!w.calls.added.includes("/sw.js"));
  assert.equal(w.calls.skip, 0);
  for (const path of w.calls.added)
    await access(
      new URL(
        "../out/" + (path === "/" ? "index.html" : path.slice(1)),
        import.meta.url,
      ),
    );
});
test("offline reloads and chunks use the current cache without a network call", async () => {
  const w = worker();
  assert.equal((await w.request("https://example.test/")).body, "cached app");
  assert.equal(
    (await w.request("https://example.test/?installed=true")).body,
    "cached app",
  );
  assert.equal(
    (await w.request("https://example.test/_next/static/app.js", "cors")).body,
    "cached chunk",
  );
  assert.equal(w.calls.network, 0);
});
test("activation removes only old app caches and updates require an explicit message", async () => {
  const w = worker();
  await w.lifecycle("activate");
  assert.deepEqual(w.calls.deleted, ["compagnon-obsolete"]);
  assert.equal(w.calls.claimed, 1);
  assert.equal(w.calls.skip, 0);
  w.handlers.message({ data: { type: "SKIP_WAITING" } });
  assert.equal(w.calls.skip, 1);
});
test("the worker leaves third party and non-GET requests untouched", async () => {
  const w = worker();
  assert.equal(await w.request("https://another.test/"), null);
  assert.equal(await w.request("https://example.test/", "cors", "POST"), null);
  assert.equal(w.calls.network, 0);
});
