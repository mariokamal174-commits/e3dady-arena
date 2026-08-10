import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { burstConfetti } from "@/game/confetti";
import type { Feedback, Team } from "@/game/types";

export function FeedbackOverlay({
  feedback,
  teams,
  animations,
}: {
  feedback: Feedback;
  teams: Team[];
  animations: boolean;
}) {
  const team = feedback && "teamId" in feedback ? teams.find((t) => t.id === feedback.teamId) : undefined;

  useEffect(() => {
    if (animations && feedback?.kind === "correct") burstConfetti(team ? [team.color] : undefined);
  }, [feedback, animations, team]);

  return (
    <AnimatePresence>
      {feedback ? (
        <motion.div
          key={feedback.kind + (team?.id ?? "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center backdrop-blur-[2px]"
        >
          {feedback.kind === "correct" && (
            <motion.div
              initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="glass rounded-[2.5rem] px-16 py-12 text-center"
              style={{ boxShadow: `0 0 0 2px ${team?.color ?? "var(--success)"}` }}
            >
              <div className="font-display text-7xl font-black text-success md:text-8xl">🎉 CORRECT!</div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-4 font-display text-5xl font-black"
                style={{ color: team?.color }}
              >
                {team?.icon} {team?.name} +{feedback.points} POINTS
              </motion.div>
            </motion.div>
          )}

          {feedback.kind === "wrong" && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass animate-shake rounded-[2.5rem] border-destructive px-16 py-12 text-center"
              style={{ boxShadow: "0 0 0 2px var(--destructive)" }}
            >
              <div className="font-display text-7xl font-black text-destructive md:text-8xl">
                ❌ WRONG ANSWER
              </div>
              <p className="mt-3 text-2xl font-semibold text-muted-foreground">
                {team ? `${team.icon} ${team.name} is out of this question` : ""}
              </p>
            </motion.div>
          )}

          {feedback.kind === "timeup" && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.7, 1.06, 1], opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-[2.5rem] px-16 py-12 text-center"
              style={{ boxShadow: "0 0 0 2px var(--warning)" }}
            >
              <div className="font-display text-7xl font-black text-warning md:text-8xl">⏰ TIME'S UP!</div>
              <p className="mt-3 text-2xl font-semibold text-destructive">🚨 STEAL MODE ACTIVATED</p>
            </motion.div>
          )}

          {feedback.kind === "speed" && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              className="glass rounded-[2.5rem] px-16 py-12 text-center"
              style={{ boxShadow: "0 0 0 2px var(--warning)" }}
            >
              <div className="font-display text-7xl font-black text-warning md:text-8xl">⚡ SPEED ROUND!</div>
              <p className="mt-3 text-2xl font-semibold">FIRST TEAM TO ANSWER WINS!</p>
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
