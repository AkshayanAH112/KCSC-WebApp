import TeamView from "@/components/landing/live/TeamView";
import LivePageShell, { liveMetadata } from "@/components/landing/live/LivePageShell";
import { teamTitle } from "@/lib/cricket/meta";

type Props = { params: Promise<{ id: string }> };

// The name in the title and breadcrumb is read from the DB per request (and is
// null for anything not public); the page body is fetched client-side.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return liveMetadata(`/live/team/${id}`, await teamTitle(id));
}

export default async function TeamViewPage({ params }: Props) {
  const { id } = await params;
  const name = await teamTitle(id);
  return (
    <LivePageShell path={`/live/team/${id}`} current={name ?? "—"}>
      <TeamView id={id} />
    </LivePageShell>
  );
}
