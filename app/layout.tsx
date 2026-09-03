import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Gemini Character Generator',
  description: 'Underground character-based image generation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
