import './globals.css';
import { ReactNode } from 'react';
import { Montserrat } from 'next/font/google';
import TopNav from './components/TopNav';
import HungarianUi from './components/HungarianUi';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  style: ['italic'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'Vállalhatatlan Illusztrációs Motor',
  description: 'Karakteralapú képgeneráló motor',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <body className={`${montserrat.variable} min-h-screen bg-black text-gray-100`}>
        <TopNav />
        <HungarianUi />
        {children}
      </body>
    </html>
  );
}
