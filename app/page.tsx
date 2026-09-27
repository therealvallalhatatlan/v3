import HomePageClient from './HomePageClient';

export const metadata = {
  title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
  description: 'Bedobod a karaktered. Adsz neki egy helyet, egy kamerát és egy stílust. Aztán generálunk egy valóságot, amit utólag nehéz megmagyarázni.',
  alternates: {
    canonical: 'https://engine.vallalhatatlan.online/',
  },
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
        type: 'image/png',
        alt: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    description: 'Bedobod a karaktered. Adsz neki egy helyet, egy kamerát és egy stílust. Aztán generálunk egy valóságot, amit utólag nehéz megmagyarázni.',
    images: ['/api/og?variant=landing&character=malac.jpg&v=10'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
