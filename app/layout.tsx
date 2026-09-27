import './globals.css';
import { ReactNode } from 'react';
import { Inter, Montserrat } from 'next/font/google';
import TopNav from './components/TopNav';
import HungarianUi from './components/HungarianUi';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  style: ['italic'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://engine.vallalhatatlan.online'),
  title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
  description: 'Bedobod a karaktered. Adsz neki egy helyet, egy kamerát és egy stílust. Aztán generálunk egy valóságot, amit utólag nehéz megmagyarázni.',
  openGraph: {
    type: 'website',
    locale: 'hu_HU',
    siteName: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    description: 'Bedobod a karaktered. Adsz neki egy helyet, egy kamerát és egy stílust. Aztán generálunk egy valóságot, amit utólag nehéz megmagyarázni.',
    url: 'https://engine.vallalhatatlan.online/',
    images: [
      {
        url: '/api/og?variant=landing&character=malac.jpg&v=10',
        width: 1200,
        height: 630,
        alt: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    description: 'Karakteralapú képgenerálás saját karakterekből, saját jelenetekből.',
    images: ['/api/og?variant=landing&character=malac.jpg&v=10'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <body className={`${inter.variable} ${montserrat.variable} min-h-screen bg-black text-gray-100`}>
        <TopNav />
        <HungarianUi />
        {children}
      </body>
    </html>
  );
}
