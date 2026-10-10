import { redirect } from "next/navigation";

// The match list lives on the cricket hub. This route exists only so the
// "Matches" crumb above a match page (/admin/cricket/matches/[id]) leads somewhere.
export default function MatchesIndexPage() {
  redirect("/admin/cricket");
}
