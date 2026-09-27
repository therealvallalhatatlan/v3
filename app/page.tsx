import HomePageClient from './HomePageClient';

export const metadata = {
  title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
  description: 'Karakteralapú képgenerálás saját karakterekből, saját jelenetekből. Film-noir, VHS és visszafogott analóg vizuális világ.',
  alternates: {
    canonical: 'https://engine.vallalhatatlan.online/',
  },
  openGraph: {
    type: 'website',
    locale: 'hu_HU',
    siteName: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    title: 'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    description: 'Karakterekből jelenetek. Karakterhű képgenerálás film-noir, VHS és analóg hangulattal.',
    url: 'https://engine.vallalhatatlan.online/',
    images: [
      {
        url: '/api/og?variant=landing&character=character.png&v=8',
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
    description: 'Karakterekből jelenetek. Karakterhű képgenerálás analóg, noir és VHS hangulattal.',
    images: ['/api/og?variant=landing&character=character.png&v=8'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
