import { useState } from "react";
import { BookOpen, Check, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { Scoreboard } from "./Scoreboard";
import { GameControls } from "./GameControls";
import { FullscreenButton } from "./FullscreenButton";

export function ChapterBoard({ spectator }: { spectator: boolean }) {
  const { state, dispatch } = useGame();
  const [chapter, setChapter] = useState<number | null>(null);
  const team = state.teams[(state.chapterTurn ?? 0) % Math.max(1, state.teams.length)];
  const used = state.chapterUsedIds ?? [];
  const questions = state.questions.filter((q) => q.chapter === chapter);
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-bold text-accent">وضع الإصحاحات · رسالة يعقوب</p>
          <h1 className="mt-2 text-3xl font-black">{team?.icon} دور {team?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{used.length} / {state.questions.length} سؤال مستخدم</span>
          <FullscreenButton />
          {!spectator && <GameControls />}
          {!spectator && <Button asChild variant="outline"><Link to="/">الإعدادات</Link></Button>}
        </div>
      </header>
      <section className="py-8">
        <h2 className="mb-5 text-2xl font-bold">اختار الإصحاح</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => {
            const remaining = state.questions.filter((q) => q.chapter === n && !used.includes(q.id)).length;
            return <Button key={n} variant={chapter === n ? "default" : "secondary"}
              className="h-28 flex-col gap-2 rounded-lg" disabled={remaining === 0}
              onClick={() => setChapter(n)}>
              <BookOpen className="size-6" />
              <span className="text-lg">الإصحاح {n}</span>
              <span className="text-xs">{remaining === 0 ? "مكتمل" : `${remaining} سؤال متاح`}</span>
            </Button>;
          })}
        </div>
        {chapter !== null && <div className="mt-8">
          <h3 className="mb-4 text-xl font-bold">أسئلة الإصحاح {chapter}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {questions.map((q, i) => <Button key={q.id} variant="outline"
              aria-label={`سؤال ${i + 1} من الإصحاح ${chapter} — ${q.points} درجات`}
              disabled={spectator || used.includes(q.id)}
              className="h-24 flex-col gap-2 rounded-lg border-accent/30"
              onClick={() => dispatch({ type: "PICK_CHAPTER_QUESTION", questionId: q.id })}>
              <span className="flex items-center gap-2">{used.includes(q.id) && <Check className="size-4" />}سؤال {i + 1}</span>
              <span className="text-xl font-black text-accent">{used.includes(q.id) ? "اتاخد" : `${q.points} درجات`}</span>
            </Button>)}
          </div>
        </div>}
        {spectator && <p className="mt-6 text-muted-foreground">في انتظار اختيار المقدم…</p>}
      </section>
      <Scoreboard state={state} />
    </main>
  );
}