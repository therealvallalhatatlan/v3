import HomePageClient from './HomePageClient';

export const metadata = {
  title: 'Vállalhatatlan Illusztrációs Motor | Karakterekből jelenetek',
  description: 'Karakteralapú képgenerálás saját karakterekből, saját jelenetekből. Film-noir, VHS és visszafogott analóg vizuális világ.',
  alternates: {
    canonical: 'https://engine.vallalhatatlan.online/',
  },
  openGraph: {
    type: 'website',
    locale: 'hu_HU',
    siteName: 'Vállalhatatlan Illusztrációs Motor',
    title: 'Vállalhatatlan Illusztrációs Motor',
    description: 'Karakterekből jelenetek. Karakterhű képgenerálás film-noir, VHS és analóg hangulattal.',
    url: 'https://engine.vallalhatatlan.online/',
    images: [
      {
        url: '/opengraph-image?v=2',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Vállalhatatlan Illusztrációs Motor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vállalhatatlan Illusztrációs Motor',
    description: 'Karakterekből jelenetek. Karakterhű képgenerálás analóg, noir és VHS hangulattal.',
    images: ['/opengraph-image?v=2'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
