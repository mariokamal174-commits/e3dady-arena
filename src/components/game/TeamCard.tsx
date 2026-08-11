import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Team } from "@/game/types";
import { AnimatedScore } from "./AnimatedScore";

export type TeamStatus = "idle" | "turn" | "waiting" | "eliminated" | "can-steal" | "buzzing";

const STATUS_LABEL: Record<TeamStatus, string> = {
  idle: "READY",
  turn: "YOUR TURN",
  waiting: "WAITING",
  eliminated: "OUT",
  "can-steal": "CAN STEAL",
  buzzing: "ANSWERING",
};

interface Props {
  team: Team;
  status: TeamStatus;
  bump?: number;
  rank?: number;
  onClick?: () => void;
  compact?: boolean;
  hideScore?: boolean;
}

export function TeamCard({ team, status, bump, rank, onClick, compact, hideScore }: Props) {
  const highlight = status === "turn" || status === "buzzing";
  const dim = status === "eliminated";
  const clickable = Boolean(onClick);

  return (
    <motion.button
      type="button"
      layout
      disabled={!clickable}
      onClick={onClick}
      {...(clickable ? { whileHover: { scale: 1.03, y: -4 }, whileTap: { scale: 0.97 } } : {})}
      animate={highlight ? { scale: 1.02 } : { scale: 1 }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl px-4 py-4 text-left transition-opacity",
        compact ? "min-w-0" : "min-w-[190px]",
        dim && "opacity-40 saturate-0",
        clickable && "cursor-pointer",
      )}
      style={{
        borderColor: highlight || status === "can-steal" ? team.color : undefined,
        boxShadow: highlight
          ? `0 0 0 2px ${team.color}, 0 24px 60px -22px ${team.color}`
          : status === "can-steal"
            ? `0 0 0 1px ${team.color}`
            : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: `radial-gradient(120% 90% at 0% 0%, ${team.color}, transparent 60%)` }}
      />
      {highlight && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(120deg, transparent, ${team.color}55, transparent)` }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl text-2xl"
          style={{ backgroundColor: `${team.color}25`, boxShadow: `inset 0 0 0 1px ${team.color}66` }}
        >
          {team.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-wide uppercase">{team.name}</p>
          <p className="text-[10px] font-semibold tracking-[0.18em]" style={{ color: team.color }}>
            {STATUS_LABEL[status]}
            {typeof rank === "number" && !hideScore ? ` · #${rank}` : ""}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-end justify-between">
        {hideScore ? (
          <span className="font-display text-3xl leading-none font-extrabold tracking-widest text-muted-foreground">
            ••
          </span>
        ) : (
          <AnimatedScore
            value={team.score}
            className="font-display text-3xl leading-none font-extrabold tabular-nums"
          />
        )}
        <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">PTS</span>
      </div>

      <AnimatePresence>
        {bump && !hideScore ? (
          <motion.span
            key={`${team.id}-${bump}-${team.score}`}
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: -26, scale: 1.15 }}
            exit={{ opacity: 0, y: -48 }}
            transition={{ duration: 1.1 }}
            className="absolute right-4 bottom-4 font-display text-2xl font-black"
            style={{ color: bump > 0 ? "var(--success)" : "var(--destructive)" }}
          >
            {bump > 0 ? `+${bump}` : bump}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
