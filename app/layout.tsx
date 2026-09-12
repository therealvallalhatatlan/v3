import './globals.css';
import { ReactNode } from 'react';
import TopNav from './components/TopNav';

export const metadata = {
  title: 'Vállalhatatlan Illusztrációs Motor',
  description: 'Underground character-based image generation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <body className="min-h-screen bg-black text-gray-100">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
