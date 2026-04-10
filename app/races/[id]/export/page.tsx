import type { Metadata } from 'next';
import { RaceExportRouteClient } from './RaceExportRouteClient';

export const metadata: Metadata = {
  title: 'Fiche course · Export',
  description: 'Fiche course FuelOS imprimable ou enregistrable en PDF',
  robots: { index: false, follow: true },
};

export default async function RaceExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RaceExportRouteClient raceId={id} />;
}
