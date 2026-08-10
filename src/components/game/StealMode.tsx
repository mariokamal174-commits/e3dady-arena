import { motion } from "motion/react";
import type { Team } from "@/game/types";
import { TeamCard } from "./TeamCard";

export function StealMode({
  teams,
  attempted,
  onClaim,
}: {
  teams: Team[];
  attempted: string[];
  onClaim: (teamId: string) => void;
}) {
  const eligible = teams.filter((t) => !attempted.includes(t.id));
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl border-destructive/50 p-6"
      style={{ boxShadow: "0 0 0 1px var(--destructive), 0 30px 70px -40px var(--destructive)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-2xl font-black tracking-tight text-destructive">
          🚨 STEAL MODE — Other teams can answer!
        </h3>
        <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
          PICK THE TEAM THAT BUZZED
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((team) => {
          const out = attempted.includes(team.id);
          return (
            <TeamCard
              key={team.id}
              team={team}
              status={out ? "eliminated" : "can-steal"}
              {...(out ? {} : { onClick: () => onClaim(team.id) })}
              compact
            />
          );
        })}
      </div>
      {eligible.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-muted-foreground">
          Every team has attempted — reveal the answer to continue.
        </p>
      ) : null}
    </motion.div>
  );
}
