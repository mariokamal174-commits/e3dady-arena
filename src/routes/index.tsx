import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GameProvider, useGame } from "@/game/store";
import { TEAM_ICONS, TEAM_PALETTE } from "@/game/demo";
import type { Team } from "@/game/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quiz Arena — Live Team Quiz Game Show" },
      {
        name: "description",
        content:
          "Set up teams, timers and points, then run a projector-ready live quiz with steal mode, speed rounds, confetti and sound effects.",
      },
      { property: "og:title", content: "Quiz Arena — Live Team Quiz Game Show" },
      {
        property: "og:description",
        content: "Set up teams, timers and points, then run a projector-ready live quiz with steal mode, speed rounds, confetti and sound effects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  return (
    <GameProvider>
      <GameSetup />
    </GameProvider>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="h-11 rounded-xl bg-white/5 text-lg font-bold"
      />
    </div>
  );
}

function GameSetup() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { settings, teams, questions } = state;

  const updateTeam = (id: string, patch: Partial<Team>) =>
    dispatch({ type: "SET_TEAMS", teams: teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const addTeam = () =>
    dispatch({
      type: "SET_TEAMS",
      teams: [
        ...teams,
        {
          id: crypto.randomUUID(),
          name: `Team ${teams.length + 1}`,
          color: TEAM_PALETTE[teams.length % TEAM_PALETTE.length]!,
          icon: TEAM_ICONS[teams.length % TEAM_ICONS.length]!,
          score: 0,
        },
      ],
    });

  const start = () => {
    dispatch({ type: "START_GAME" });
    void navigate({ to: "/play" });
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 md:py-16">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-black tracking-[0.3em]">
          LIVE TEAM QUIZ SHOW
        </span>
        <h1 className="mt-5 font-display text-5xl font-black tracking-tight text-balance md:text-7xl">
          <span className="text-gradient">QUIZ ARENA</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
          Turn-based questions, 20-second countdowns, steal mode, speed rounds, confetti and sound —
          built for the big screen.
        </p>
      </motion.header>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black">Teams</h2>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={addTeam}>
              <Plus className="size-4" /> Add team
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3"
                style={{ boxShadow: `inset 0 0 0 1px ${team.color}44` }}
              >
                <select
                  value={team.icon}
                  onChange={(e) => updateTeam(team.id, { icon: e.target.value })}
                  className="h-11 w-16 rounded-xl bg-white/10 text-center text-2xl outline-none"
                >
                  {TEAM_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <Input
                  value={team.name}
                  onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                  className="h-11 flex-1 rounded-xl bg-white/5 font-semibold"
                />
                <div className="flex gap-1">
                  {TEAM_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Set color ${color}`}
                      onClick={() => updateTeam(team.id, { color })}
                      className="size-6 rounded-full transition-transform hover:scale-125"
                      style={{
                        backgroundColor: color,
                        outline: team.color === color ? "2px solid white" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <Input
                  type="number"
                  value={team.score}
                  onChange={(e) => updateTeam(team.id, { score: Number(e.target.value) || 0 })}
                  className="h-11 w-24 rounded-xl bg-white/5 text-center font-bold"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    dispatch({ type: "SET_TEAMS", teams: teams.filter((t) => t.id !== team.id) })
                  }
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="glass space-y-5 rounded-3xl p-6">
          <h2 className="font-display text-2xl font-black">Game settings</h2>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">GAME TITLE</Label>
            <Input
              value={settings.title}
              onChange={(e) => dispatch({ type: "SET_SETTINGS", settings: { title: e.target.value } })}
              className="h-11 rounded-xl bg-white/5 text-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label="TIMER"
              value={settings.defaultTimer}
              onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { defaultTimer: v } })}
              min={5}
            />
            <NumberField
              label="STEAL TIMER"
              value={settings.stealTimer}
              onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { stealTimer: v } })}
              min={5}
            />
            <NumberField
              label="SPEED TIMER"
              value={settings.speedTimer}
              onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { speedTimer: v } })}
              min={5}
            />
            <NumberField
              label="POINTS"
              value={settings.defaultPoints}
              onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { defaultPoints: v } })}
            />
            <NumberField
              label="STEAL PTS"
              value={settings.stealPoints}
              onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { stealPoints: v } })}
            />
            <NumberField
              label="SPEED PTS"
              value={settings.speedPoints}
              onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { speedPoints: v } })}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <span className="font-semibold">Sound effects</span>
            <Switch
              checked={settings.sound}
              onCheckedChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { sound: v } })}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <span className="font-semibold">Animations &amp; confetti</span>
            <Switch
              checked={settings.animations}
              onCheckedChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { animations: v } })}
            />
          </div>

          <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{questions.length} questions</span> loaded ·{" "}
            {questions.filter((q) => q.type === "speed").length} speed ·{" "}
            {questions.filter((q) => q.type === "steal").length} steal
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <Button
              size="lg"
              onClick={start}
              className="h-14 rounded-2xl font-display text-xl font-black tracking-wide"
            >
              START GAME 🚀
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-2xl font-bold">
              <Link to="/admin">Manage questions &amp; teams</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
