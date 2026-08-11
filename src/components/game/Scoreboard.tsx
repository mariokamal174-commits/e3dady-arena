import { TeamCard, type TeamStatus } from "./TeamCard";
import type { GameState, Team } from "@/game/types";

export function Scoreboard({ state }: { state: GameState }) {
  const ranked = [...state.teams].sort((a, b) => b.score - a.score);
  const rankOf = (team: Team) => ranked.findIndex((t) => t.id === team.id) + 1;

  const statusOf = (team: Team): TeamStatus => {
    const attempted = state.attemptedTeamIds.includes(team.id);
    switch (state.phase) {
      case "question":
        return state.turnTeamId === team.id ? "turn" : "waiting";
      case "steal-select":
        return attempted ? "eliminated" : "can-steal";
      case "speed-open":
        return attempted ? "eliminated" : "can-steal";
      case "steal-answer":
      case "speed-answer":
        return state.activeTeamId === team.id ? "buzzing" : attempted ? "eliminated" : "waiting";
      default:
        return "idle";
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {state.teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          status={statusOf(team)}
          rank={rankOf(team)}
          hideScore={state.scoresHidden}
          {...(state.scoreBumps[team.id] ? { bump: state.scoreBumps[team.id] } : {})}
        />
      ))}
    </div>
  );
}
