import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { winnerConfetti } from "@/game/confetti";
import { useGame } from "@/game/store";
import { AnimatedScore } from "./AnimatedScore";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHT = [220, 160, 120];
const ORDER = [1, 0, 2];

export function WinnerScreen() {
  const { ranked, dispatch, state } = useGame();
  const winner = ranked[0];

  useEffect(() => {
    if (state.settings.animations) winnerConfetti(ranked.slice(0, 3).map((t) => t.color));
  }, [state.settings.animations, ranked]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-12">
      <motion.h1
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="font-display text-6xl font-black tracking-tight md:text-8xl"
      >
        🏆 <span className="text-gradient">GAME OVER</span>
      </motion.h1>

      {winner ? (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="font-display text-3xl font-black md:text-5xl"
          style={{ color: winner.color }}
        >
          {winner.icon} {winner.name} WINS!
        </motion.p>
      ) : null}

      <div className="flex w-full items-end justify-center gap-4 md:gap-8">
        {ORDER.map((rankIndex) => {
          const team = ranked[rankIndex];
          if (!team) return null;
          return (
            <motion.div
              key={team.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: PODIUM_HEIGHT[rankIndex] ?? 120, opacity: 1 }}
              transition={{ delay: 0.3 + rankIndex * 0.15, type: "spring", stiffness: 120, damping: 18 }}
              className="glass relative flex w-32 flex-col items-center justify-start overflow-hidden rounded-t-3xl px-3 pt-4 md:w-52"
              style={{ boxShadow: `0 0 0 1px ${team.color}, 0 -20px 60px -40px ${team.color}` }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{ background: `linear-gradient(180deg, ${team.color}, transparent 70%)` }}
              />
              <span className="relative text-4xl">{MEDALS[rankIndex]}</span>
              <span className="relative mt-2 text-center text-sm font-bold tracking-wide uppercase">
                {team.icon} {team.name}
              </span>
              <AnimatedScore
                value={team.score}
                className="relative mt-1 font-display text-3xl font-black tabular-nums"
              />
            </motion.div>
          );
        })}
      </div>

      <div className="glass w-full max-w-2xl rounded-3xl p-5">
        <p className="mb-3 text-xs font-bold tracking-[0.25em] text-muted-foreground">FINAL STANDINGS</p>
        <div className="grid gap-2">
          {ranked.map((team, i) => (
            <div key={team.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2">
              <span className="w-6 font-black tabular-nums">{i + 1}</span>
              <span className="text-xl">{team.icon}</span>
              <span className="flex-1 font-semibold">{team.name}</span>
              <span className="font-display text-xl font-black tabular-nums" style={{ color: team.color }}>
                {team.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          size="lg"
          className="rounded-full px-8 text-base font-bold"
          onClick={() => {
            dispatch({ type: "RESET_SCORES" });
            dispatch({ type: "START_GAME" });
          }}
        >
          PLAY AGAIN
        </Button>
        <Button asChild size="lg" variant="secondary" className="rounded-full px-8 text-base font-bold">
          <Link to="/admin">BACK TO DASHBOARD</Link>
        </Button>
      </div>
    </div>
  );
}
