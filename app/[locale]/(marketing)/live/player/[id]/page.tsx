import PlayerView from "@/components/landing/live/PlayerView";
import LivePageShell, { liveMetadata } from "@/components/landing/live/LivePageShell";
import { playerTitle } from "@/lib/cricket/meta";

type Props = { params: Promise<{ id: string }> };

// The name in the title and breadcrumb is read from the DB per request (and is
// null for anything not public); the page body is fetched client-side.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return liveMetadata(`/live/player/${id}`, await playerTitle(id));
}

export default async function PlayerViewPage({ params }: Props) {
  const { id } = await params;
  const name = await playerTitle(id);
  return (
    <LivePageShell path={`/live/player/${id}`} current={name ?? "—"}>
      <PlayerView id={id} />
    </LivePageShell>
  );
}
