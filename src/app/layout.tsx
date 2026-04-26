import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Nav from '@/app/ui/nav';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'FRC Auto Scout',
  description: 'FRC autonomous scouting — track time to middle zone per robot',
};

export const viewport: Viewport = {
  themeColor: '#0d111b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} style={{ colorScheme: 'dark' }}>
      <body className="bg-[#0d111b] text-[#ededed] min-h-screen antialiased">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
