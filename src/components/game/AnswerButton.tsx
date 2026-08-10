import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface Props {
  index: number;
  text: string;
  disabled?: boolean;
  state: "default" | "correct" | "wrong" | "muted";
  accent?: string;
  onClick?: () => void;
}

export function AnswerButton({ index, text, disabled, state, accent, onClick }: Props) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      {...(disabled ? {} : { whileHover: { scale: 1.02, y: -3 }, whileTap: { scale: 0.97 } })}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group glass relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-5 text-left",
        "transition-colors",
        state === "correct" && "border-success bg-success/20",
        state === "wrong" && "border-destructive bg-destructive/20 animate-shake",
        state === "muted" && "opacity-45",
        !disabled && "hover:border-accent cursor-pointer",
        disabled && state === "default" && "opacity-70",
      )}
      style={
        accent && state === "default" && !disabled ? { boxShadow: `inset 0 0 0 1px ${accent}33` } : {}
      }
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl font-display text-xl font-black",
          state === "correct"
            ? "bg-success text-success-foreground"
            : state === "wrong"
              ? "bg-destructive text-destructive-foreground"
              : "bg-white/10",
        )}
        style={accent && state === "default" ? { backgroundColor: `${accent}33` } : {}}
      >
        {LETTERS[index]}
      </span>
      <span className="text-xl font-semibold text-balance md:text-2xl">{text}</span>
    </motion.button>
  );
}
