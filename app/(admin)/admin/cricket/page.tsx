"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { cricketApi, type AdminTeam, type AdminTournament } from "@/components/cricket/api";
import { MatchesPanel, type AdminMatchCard } from "@/components/cricket/matches-panel";
import { TeamsPanel } from "@/components/cricket/teams-panel";
import { TournamentsPanel } from "@/components/cricket/tournaments-panel";

type Tab = "matches" | "tournaments" | "teams";

const TABS: { key: Tab; label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "tournaments", label: "Tournaments" },
  { key: "teams", label: "Teams" },
];

export default function CricketPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("matches");
  const [matches, setMatches] = useState<AdminMatchCard[]>([]);
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // One refresh for all three lists: a new team changes what the match form
  // offers, and a deleted match changes what a team is allowed to do. Panels
  // call refresh() after a write, which just re-runs the effect below.
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    Promise.all([
      cricketApi<{ matches: AdminMatchCard[] }>("/api/cricket/matches"),
      cricketApi<{ tournaments: AdminTournament[] }>("/api/cricket/tournaments"),
      cricketApi<{ teams: AdminTeam[] }>("/api/cricket/teams"),
    ])
      .then(([m, t, tm]) => {
        if (!active) return;
        setMatches(m.matches);
        setTournaments(t.tournaments);
        setTeams(tm.teams);
        setError(null);
      })
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  if (!userLoading && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
        <ShieldAlert size={40} className="text-muted-foreground opacity-50" aria-hidden />
        <p className="text-muted-foreground">Cricket scoring is managed by admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-foreground">Cricket Scoring</h1>
          <p className="text-muted-foreground">
            Score matches ball by ball. Everything scored here appears on the public Live Scores page.
          </p>
        </div>
        <a
          href="/en/live"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ExternalLink size={16} aria-hidden /> Public live page
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:inline-grid sm:w-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : tab === "matches" ? (
        <MatchesPanel matches={matches} teams={teams} tournaments={tournaments} onChanged={refresh} />
      ) : tab === "tournaments" ? (
        <TournamentsPanel tournaments={tournaments} teams={teams} onChanged={refresh} />
      ) : (
        <TeamsPanel teams={teams} onChanged={refresh} />
      )}
    </div>
  );
}
