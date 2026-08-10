import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function CountdownTimer({
  timeLeft,
  total,
  running,
  label,
}: {
  timeLeft: number;
  total: number;
  running: boolean;
  label?: string;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  const urgent = timeLeft <= 5 && timeLeft > 0;
  const size = 132;
  const r = 56;
  const c = 2 * Math.PI * r;
  const color = timeLeft === 0 ? "var(--destructive)" : urgent ? "var(--destructive)" : "var(--accent)";

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={urgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        className="relative grid place-items-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} className="stroke-white/10" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={10}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span
            className={cn(
              "font-display text-5xl font-black tabular-nums",
              urgent && "text-destructive",
              !running && timeLeft > 0 && "opacity-50",
            )}
          >
            {timeLeft}
          </span>
        </div>
      </motion.div>
      <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
        {label ?? (running ? "Seconds left" : "Paused")}
      </span>
    </div>
  );
}
