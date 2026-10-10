import MatchCenter from "@/components/landing/live/MatchCenter";
import LivePageShell, { liveMetadata } from "@/components/landing/live/LivePageShell";
import { matchTitle } from "@/lib/cricket/meta";

type Props = { params: Promise<{ id: string }> };

// The name in the title and breadcrumb is read from the DB per request (and is
// null for anything not public); the page body is fetched client-side.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return liveMetadata(`/live/match/${id}`, await matchTitle(id));
}

export default async function MatchCenterPage({ params }: Props) {
  const { id } = await params;
  const name = await matchTitle(id);
  return (
    <LivePageShell path={`/live/match/${id}`} current={name ?? "—"}>
      <MatchCenter id={id} />
    </LivePageShell>
  );
}
