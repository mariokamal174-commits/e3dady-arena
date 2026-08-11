import { motion } from "motion/react";
import { AnswerButton } from "./AnswerButton";
import type { Question } from "@/game/types";

interface Props {
  question: Question;
  questionNumber: number;
  total: number;
  selected: number | null;
  revealed: boolean;
  canAnswer: boolean;
  choicesHidden?: boolean;
  removedChoices?: number[];
  accent?: string;
  onAnswer: (index: number) => void;
}

const TYPE_LABEL: Record<Question["type"], string> = {
  normal: "NORMAL QUESTION",
  steal: "STEAL QUESTION",
  speed: "⚡ SPEED QUESTION",
};

export function QuestionCard({
  question,
  questionNumber,
  total,
  selected,
  revealed,
  canAnswer,
  choicesHidden,
  removedChoices = [],
  accent,
  onAnswer,
}: Props) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -20 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="glass stage-glow relative w-full overflow-hidden rounded-3xl p-6 md:p-10"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-[var(--gradient-primary)] opacity-20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.22em]">
          Q{questionNumber} / {total}
        </span>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.22em]"
          style={{ backgroundColor: `${accent ?? "#38bdf8"}22`, color: accent ?? "#38bdf8" }}
        >
          {TYPE_LABEL[question.type]}
        </span>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-primary">
          {question.points} PTS
        </span>
      </div>

      {question.imageUrl ? (
        <img
          src={question.imageUrl}
          alt=""
          className="mt-6 max-h-56 w-full rounded-2xl object-cover"
          loading="lazy"
        />
      ) : null}

      <h2 className="relative mt-6 text-3xl leading-tight font-extrabold text-balance md:text-5xl">
        {question.text}
      </h2>

      {choicesHidden ? (
        <div className="relative mt-8 grid place-items-center rounded-2xl border border-dashed border-white/20 bg-white/5 py-14">
          <p className="font-display text-2xl font-black tracking-[0.2em] text-muted-foreground">
            الاختيارات مخفية
          </p>
        </div>
      ) : (
      <div className="relative mt-8 grid gap-4 md:grid-cols-2">
        {question.choices.map((choice, i) => {
          if (removedChoices.includes(i)) {
            return (
              <div
                key={`${question.id}-removed-${i}`}
                className="rounded-2xl border border-dashed border-white/15 bg-white/5 opacity-40"
              />
            );
          }
          const isCorrect = i === question.correctIndex;
          const state = revealed
            ? isCorrect
              ? "correct"
              : selected === i
                ? "wrong"
                : "muted"
            : selected === i
              ? "wrong"
              : "default";
          return (
            <AnswerButton
              key={`${question.id}-${i}`}
              index={i}
              text={choice}
              state={state}
              disabled={!canAnswer}
              {...(accent ? { accent } : {})}
              onClick={() => onAnswer(i)}
            />
          );
        })}
      </div>
      )}

      {revealed && question.explanation ? (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-base text-accent-foreground/90"
        >
          <span className="font-bold text-accent">Why: </span>
          {question.explanation}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
