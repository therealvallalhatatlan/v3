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
        url: '/og?variant=landing&eyebrow=V3%20%2F%20IMAGE%20GENERATOR&title=V%C3%81LLALHATATLAN%20ILLUSZTR%C3%81CI%C3%93S%20MOTOR&subtitle=Karakterekb%C5%91l%20jelenetek.%20Karakterh%C5%B1%20k%C3%A9pgener%C3%A1l%C3%A1s%20anal%C3%B3g%2C%20noir%20%C3%A9s%20VHS%20hangulattal.&v=5',
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
    images: ['/og?variant=landing&eyebrow=V3%20%2F%20IMAGE%20GENERATOR&title=V%C3%81LLALHATATLAN%20ILLUSZTR%C3%81CI%C3%93S%20MOTOR&subtitle=Karakterekb%C5%91l%20jelenetek.%20Karakterh%C5%B1%20k%C3%A9pgener%C3%A1l%C3%A1s%20anal%C3%B3g%2C%20noir%20%C3%A9s%20VHS%20hangulattal.&v=5'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
