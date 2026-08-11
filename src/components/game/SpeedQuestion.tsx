import { motion } from "motion/react";
import type { Team } from "@/game/types";
import { TeamCard } from "./TeamCard";
import { useGame } from "@/game/store";

export function SpeedQuestion({
  teams,
  attempted,
  onBuzz,
}: {
  teams: Team[];
  attempted: string[];
  onBuzz: (teamId: string) => void;
}) {
  const { adminUnlocked } = useGame();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
      style={{ boxShadow: "0 0 0 1px var(--warning), 0 30px 70px -40px var(--warning)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <motion.h3
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="font-display text-2xl font-black tracking-tight text-warning"
        >
          ⚡ SPEED ROUND — FIRST TEAM TO BUZZ WINS!
        </motion.h3>
        <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
          PRESS 1–4 OR TAP A TEAM TO BUZZ
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((team, i) => {
          const out = attempted.includes(team.id);
          return (
            <div key={team.id} className="relative">
              <span className="absolute -top-2 -left-2 z-10 grid size-6 place-items-center rounded-full bg-warning text-xs font-black text-warning-foreground">
                {i + 1}
              </span>
              <TeamCard
                team={team}
                status={out ? "eliminated" : "can-steal"}
                {...(out ? {} : { onClick: () => onBuzz(team.id) })}
                compact
                hideScore={!adminUnlocked}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
