import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif, IBM_Plex_Mono, Noto_Nastaliq_Urdu } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});
const urdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
});

export const metadata: Metadata = {
  title: 'Themis | Structured witness interviews',
  description:
    'Themis conducts recorded victim and witness interviews for investigators using the NICHD protocol. Every question is screened before it is asked.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${display.variable} ${mono.variable} ${urdu.variable} font-sans bg-paper min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
