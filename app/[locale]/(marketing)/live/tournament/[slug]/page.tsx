import TournamentView from "@/components/landing/live/TournamentView";
import LivePageShell, { liveMetadata } from "@/components/landing/live/LivePageShell";
import { tournamentTitle } from "@/lib/cricket/meta";

type Props = { params: Promise<{ slug: string }> };

// The name in the title and breadcrumb is read from the DB per request (and is
// null for anything not public); the page body is fetched client-side.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return liveMetadata(`/live/tournament/${slug}`, await tournamentTitle(slug));
}

export default async function TournamentViewPage({ params }: Props) {
  const { slug } = await params;
  const name = await tournamentTitle(slug);
  return (
    <LivePageShell path={`/live/tournament/${slug}`} current={name ?? "—"}>
      <TournamentView slug={slug} />
    </LivePageShell>
  );
}
