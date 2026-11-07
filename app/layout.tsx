import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Compagnon — Compteur de vies Magic', description: 'Vos vies, votre partie. Un compteur Magic simple, face à face et hors ligne.', applicationName: 'Compagnon', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Compagnon' }, icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f3f2ee' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>; }
