import { TeamCard, type TeamStatus } from "./TeamCard";
import type { GameState, Team } from "@/game/types";
import { useGame } from "@/game/store";

export function Scoreboard({ state }: { state: GameState }) {
  const { adminUnlocked, dispatch, question } = useGame();
  const ranked = [...state.teams].sort((a, b) => b.score - a.score);
  const rankOf = (team: Team) => ranked.findIndex((t) => t.id === team.id) + 1;
  const isOralQuestion =
    (state.phase === "question" || state.phase === "steal-select") && question?.type === "oral";

  const statusOf = (team: Team): TeamStatus => {
    const attempted = state.attemptedTeamIds.includes(team.id);
    switch (state.phase) {
      case "question":
        if (isOralQuestion) return state.activeTeamId === team.id ? "buzzing" : "waiting";
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
          hideScore={!adminUnlocked}
          {...(isOralQuestion
            ? { onClick: () => dispatch({ type: "ORAL_SELECT", teamId: team.id }) }
            : {})}
          {...(state.scoreBumps[team.id] ? { bump: state.scoreBumps[team.id] } : {})}
        />
      ))}
    </div>
  );
}
