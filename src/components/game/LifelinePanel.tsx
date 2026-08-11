import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { LIFELINES } from "@/game/types";

export function LifelinePanel() {
  const { state, dispatch, activeTeam, turnTeam } = useGame();
  const team = activeTeam ?? turnTeam;
  const used = team ? (state.lifelinesUsed[team.id] ?? []) : [];

  return (
    <div className="glass rounded-3xl px-5 py-4">
      <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
        وسائل المساعدة {team ? `· ${team.name}` : ""}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LIFELINES.map((l) => {
          const isUsed = used.includes(l.kind);
          return (
            <Button
              key={l.kind}
              size="sm"
              variant="secondary"
              disabled={!team || isUsed}
              className="h-auto flex-col gap-1 rounded-2xl py-3 text-xs font-bold"
              onClick={() => team && dispatch({ type: "LIFELINE", kind: l.kind, teamId: team.id })}
            >
              <span className="text-xl">{l.icon}</span>
              <span className={isUsed ? "line-through opacity-60" : ""}>{l.label}</span>
            </Button>
          );
        })}
      </div>
      {state.lifelineNotice ? (
        <motion.p
          key={state.lifelineNotice}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl bg-warning/15 px-3 py-2 text-center text-sm font-bold text-warning"
        >
          {state.lifelineNotice}
        </motion.p>
      ) : null}
    </div>
  );
}
