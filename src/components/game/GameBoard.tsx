import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { playSound } from "@/game/audio";
import { CountdownTimer } from "./CountdownTimer";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { GameControls } from "./GameControls";
import { LifelinePanel } from "./LifelinePanel";
import { QuestionCard } from "./QuestionCard";
import { Scoreboard } from "./Scoreboard";
import { SpeedQuestion } from "./SpeedQuestion";
import { StealMode } from "./StealMode";
import { WinnerScreen } from "./WinnerScreen";

const PHASE_BADGE: Record<string, { label: string; className: string }> = {
  question: { label: "IN PLAY", className: "bg-accent/20 text-accent" },
  "steal-select": { label: "STEAL MODE", className: "bg-destructive/20 text-destructive" },
  "steal-answer": { label: "STEAL ANSWER", className: "bg-destructive/20 text-destructive" },
  "speed-open": { label: "SPEED ROUND", className: "bg-warning/20 text-warning" },
  "speed-answer": { label: "BUZZED IN", className: "bg-warning/20 text-warning" },
  reveal: { label: "ANSWER REVEALED", className: "bg-success/20 text-success" },
  over: { label: "GAME OVER", className: "bg-primary/20 text-primary" },
  idle: { label: "READY", className: "bg-white/10 text-muted-foreground" },
};

export function GameBoard() {
  const { state, dispatch, question, activeTeam, turnTeam } = useGame();

  const answering =
    state.phase === "question" || state.phase === "steal-answer" || state.phase === "speed-answer";
  const canAnswer = answering && state.running && !state.scored;

  const totalTime =
    state.phase === "question"
      ? (question?.timer ?? state.settings.defaultTimer)
      : state.phase === "speed-open"
        ? state.settings.speedTimer
        : state.phase === "speed-answer"
          ? Math.max(5, Math.round(state.settings.speedTimer / 2))
          : state.settings.stealTimer;

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === " ") {
        e.preventDefault();
        dispatch({ type: state.running ? "PAUSE" : "RESUME" });
      } else if (key === "n") dispatch({ type: "NEXT" });
      else if (key === "p") dispatch({ type: "PREV" });
      else if (key === "r") dispatch({ type: "RESTART_QUESTION" });
      else if (key === "a") dispatch({ type: "REVEAL" });
      else if (key === "h") dispatch({ type: "TOGGLE_CHOICES" });
      else if (key === "s") dispatch({ type: "TOGGLE_SCORES" });
      else if (["1", "2", "3", "4"].includes(key)) {
        const idx = Number(key) - 1;
        if (state.phase === "steal-select" || state.phase === "speed-open") {
          const team = state.teams[idx];
          if (team && !state.attemptedTeamIds.includes(team.id)) {
            playSound("buzz");
            dispatch({ type: "CLAIM", teamId: team.id });
          }
        } else if (canAnswer) {
          dispatch({ type: "ANSWER", choice: idx });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, state.running, state.phase, state.teams, state.attemptedTeamIds, canAnswer]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    const id = window.setTimeout(() => {
      started.current = true;
      dispatch({ type: "START_GAME" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [dispatch]);

  if (state.phase === "over") return <WinnerScreen />;

  if (!question) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="glass rounded-3xl p-10">
          <h1 className="font-display text-3xl font-black">No questions yet</h1>
          <p className="mt-2 text-muted-foreground">Add questions in the admin panel to start playing.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/admin">Go to admin</Link>
          </Button>
        </div>
      </div>
    );
  }

  const badge = PHASE_BADGE[state.phase] ?? PHASE_BADGE["idle"]!;
  const spotlightTeam = activeTeam ?? turnTeam;

  return (
    <div className="min-h-screen px-4 py-5 md:px-8">
      <FeedbackOverlay feedback={state.feedback} teams={state.teams} animations={state.settings.animations} />

      <header className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-black tracking-tight md:text-3xl">
            <span className="text-gradient">{state.settings.title}</span>
          </h1>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black tracking-[0.2em] ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">QUESTION</p>
            <p className="font-display text-xl font-black tabular-nums">
              {state.currentIndex + 1} / {state.questions.length}
            </p>
          </div>
          {spotlightTeam ? (
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
                {state.phase === "question" ? "CURRENT TURN" : "ANSWERING"}
              </p>
              <p className="font-display text-xl font-black" style={{ color: spotlightTeam.color }}>
                {spotlightTeam.icon} {spotlightTeam.name}
                {state.scoresHidden ? "" : ` · ${spotlightTeam.score}`}
              </p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">OPEN TO</p>
              <p className="font-display text-xl font-black text-warning">ALL TEAMS</p>
            </div>
          )}
          <GameControls />
        </div>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={question.id + state.phase}
              question={question}
              questionNumber={state.currentIndex + 1}
              total={state.questions.length}
              selected={state.selectedChoice}
              revealed={state.revealed}
              canAnswer={canAnswer}
              choicesHidden={state.choicesHidden}
              removedChoices={state.removedChoices}
              {...(spotlightTeam ? { accent: spotlightTeam.color } : {})}
              onAnswer={(i) => dispatch({ type: "ANSWER", choice: i })}
            />
          </AnimatePresence>

          <AnimatePresence>
            {(state.phase === "steal-select" || state.phase === "steal-answer") && (
              <StealMode
                key="steal"
                teams={state.teams}
                attempted={state.attemptedTeamIds}
                onClaim={(teamId) => {
                  playSound("buzz");
                  dispatch({ type: "CLAIM", teamId });
                }}
              />
            )}
            {(state.phase === "speed-open" || state.phase === "speed-answer") && (
              <SpeedQuestion
                key="speed"
                teams={state.teams}
                attempted={state.attemptedTeamIds}
                onBuzz={(teamId) => {
                  playSound("buzz");
                  dispatch({ type: "CLAIM", teamId });
                }}
              />
            )}
          </AnimatePresence>

          {state.phase === "reveal" ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-5"
            >
              <p className="font-display text-2xl font-black text-success">
                ✅ Correct answer: {question.choices[question.correctIndex]}
              </p>
              <Button size="lg" className="rounded-full px-8 font-bold" onClick={() => dispatch({ type: "NEXT" })}>
                Next question →
              </Button>
            </motion.div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="glass flex flex-col items-center gap-3 rounded-3xl px-5 py-6">
            <CountdownTimer
              timeLeft={state.timeLeft}
              total={totalTime}
              running={state.running}
              label={
                state.phase === "steal-select"
                  ? "Waiting for a steal"
                  : state.phase === "speed-open"
                    ? "Buzz in!"
                    : state.running
                      ? "Seconds left"
                      : "Paused"
              }
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => dispatch({ type: state.running ? "PAUSE" : "RESUME" })}
              >
                {state.running ? "Pause" : "Resume"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => dispatch({ type: "REVEAL" })}
              >
                Reveal
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => dispatch({ type: "TOGGLE_CHOICES" })}
              >
                {state.choicesHidden ? "إظهار الاختيارات" : "إخفاء الاختيارات"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => dispatch({ type: "TOGGLE_SCORES" })}
              >
                {state.scoresHidden ? "إظهار الدرجات" : "إخفاء الدرجات"}
              </Button>
            </div>
          </div>

          <LifelinePanel />

          <div className="glass rounded-3xl px-5 py-4 text-sm">
            <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">WHAT HAPPENS NEXT</p>
            <p className="mt-2 font-semibold">
              {state.phase === "question" &&
                `${turnTeam?.name ?? "The team"} answers alone. Time out or a wrong answer opens STEAL MODE.`}
              {state.phase === "steal-select" && "Any team that has not attempted can steal for reduced points."}
              {state.phase === "steal-answer" && `${activeTeam?.name} is stealing — one attempt only.`}
              {state.phase === "speed-open" && "All teams compete. First buzz locks the others out."}
              {state.phase === "speed-answer" && `${activeTeam?.name} buzzed in — others are locked.`}
              {state.phase === "reveal" && "Answer revealed. Move on to the next question."}
            </p>
            {state.attemptedTeamIds.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Already attempted:{" "}
                {state.attemptedTeamIds
                  .map((id) => state.teams.find((t) => t.id === id)?.name)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="mt-5">
        <Scoreboard state={state} />
      </div>
    </div>
  );
}
