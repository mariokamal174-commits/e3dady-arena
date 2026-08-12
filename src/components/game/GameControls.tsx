import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useGame } from "@/game/store";

export function GameControls() {
  const { state, dispatch, adminUnlocked } = useGame();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2 rounded-full">
          <Settings2 className="size-4" /> Controls
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Operator Controls</SheetTitle>
          <SheetDescription>Run the game live. Shortcuts work anywhere on the board.</SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 px-4 pb-8">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => dispatch({ type: "PREV" })}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button onClick={() => dispatch({ type: "NEXT" })}>
              Next <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: state.running ? "PAUSE" : "RESUME" })}
            >
              {state.running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {state.running ? "Pause" : "Resume"}
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "RESTART_QUESTION" })}>
              <RotateCcw className="size-4" /> Restart Q
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "SKIP" })}>
              <SkipForward className="size-4" /> Skip
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "REVEAL" })}>
              <Eye className="size-4" /> Reveal
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "TOGGLE_CHOICES" })}>
              {state.choicesHidden ? "إظهار الاختيارات" : "إخفاء الاختيارات"}
            </Button>
          </div>

          <div className="mt-2 rounded-2xl border border-border p-3">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-muted-foreground">MANUAL SCORING</p>
            <div className="grid gap-2">
              {state.teams.map((team) => (
                <div key={team.id} className="flex items-center gap-2">
                  <span className="w-8 text-lg">{team.icon}</span>
                  <span className="flex-1 truncate text-sm font-semibold">{team.name}</span>
                  <span className="w-10 text-right font-bold tabular-nums">{team.score}</span>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => dispatch({ type: "ADJUST", teamId: team.id, delta: -5 })}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => dispatch({ type: "ADJUST", teamId: team.id, delta: 5 })}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => dispatch({ type: "RESET_SCORES" })}>
              Reset scores
            </Button>
            <Button variant="destructive" onClick={() => dispatch({ type: "END_GAME" })}>
              <Square className="size-4" /> End game
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "SET_SETTINGS", settings: { sound: !state.settings.sound } })}
            >
              {state.settings.sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              Sound {state.settings.sound ? "on" : "off"}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({ type: "SET_SETTINGS", settings: { animations: !state.settings.animations } })
              }
            >
              Animations {state.settings.animations ? "on" : "off"}
            </Button>
            <Button asChild variant="secondary" className="col-span-2">
              <Link to="/admin">Open admin panel</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border p-3 text-xs text-muted-foreground">
            <p className="mb-2 font-bold tracking-[0.2em] text-foreground">SHORTCUTS</p>
            <p>Space — pause / resume</p>
            <p>N — next question · P — previous</p>
            <p>R — restart question · A — reveal answer</p>
            <p>H — hide/show choices</p>
            <p>1–4 — pick team (steal / speed) or pick answer A–D while answering</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
