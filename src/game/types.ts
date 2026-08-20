export type QuestionType = "normal" | "steal" | "speed" | "oral";

export interface Question {
  id: string;
  text: string;
  choices: string[];
  correctIndex: number;
  points: number;
  type: QuestionType;
  explanation?: string;
  imageUrl?: string;
  soundUrl?: string;
  timer?: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  icon: string;
  score: number;
  members?: Member[];
}

export interface Member {
  id: string;
  name: string;
  photoUrl?: string;
}

export interface GameSettings {
  title: string;
  defaultTimer: number;
  stealTimer: number;
  speedTimer: number;
  defaultPoints: number;
  stealPoints: number;
  speedPoints: number;
  sound: boolean;
  animations: boolean;
}

export type Phase =
  | "idle"
  | "question"
  | "steal-select"
  | "steal-answer"
  | "speed-open"
  | "speed-answer"
  | "reveal"
  | "over";

export type Feedback =
  | { kind: "correct"; points: number; teamId: string; answererId?: string }
  | { kind: "wrong"; teamId: string }
  | { kind: "timeup" }
  | { kind: "steal" }
  | { kind: "speed" }
  | null;

export type LifelineKind = "friend" | "time" | "fifty" | "swap";

export const LIFELINES: { kind: LifelineKind; label: string; icon: string }[] = [
  { kind: "friend", label: "استعانة بصديق", icon: "📞" },
  { kind: "time", label: "+20 ثانية", icon: "⏱️" },
  { kind: "fifty", label: "حذف إجابتين", icon: "✂️" },
  { kind: "swap", label: "تغيير السؤال", icon: "🔄" },
];

export interface HistoryEntry {
  questionId: string;
  winnerTeamId: string | null;
  points: number;
}

export interface GameState {
  settings: GameSettings;
  teams: Team[];
  lastAnswerer?: { teamId: string; memberId?: string };
  questions: Question[];
  phase: Phase;
  currentIndex: number;
  turnTeamId: string | null;
  activeTeamId: string | null;
  attemptedTeamIds: string[];
  timeLeft: number;
  running: boolean;
  scored: boolean;
  revealed: boolean;
  selectedChoice: number | null;
  feedback: Feedback;
  history: HistoryEntry[];
  scoreBumps: Record<string, number>;
  choicesHidden: boolean;
  scoresHidden: boolean;
  removedChoices: number[];
  lifelinesUsed: Record<string, LifelineKind[]>;
  lifelineNotice: string | null;
}
