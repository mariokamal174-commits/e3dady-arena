import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { demoQuestions, demoSettings, demoTeams } from "./demo";
import { playSound, setSoundEnabled, unlockAudio } from "./audio";
import type { GameSettings, GameState, Question, Team } from "./types";

const STORAGE_KEY = "quiz-arena-state-v1";

export const initialState: GameState = {
  settings: demoSettings,
  teams: demoTeams,
  questions: demoQuestions,
  phase: "idle",
  currentIndex: 0,
  turnTeamId: null,
  activeTeamId: null,
  attemptedTeamIds: [],
  timeLeft: 0,
  running: false,
  scored: false,
  revealed: false,
  selectedChoice: null,
  feedback: null,
  history: [],
  scoreBumps: {},
};

export type Action =
  | { type: "HYDRATE"; state: GameState }
  | { type: "SET_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "SET_TEAMS"; teams: Team[] }
  | { type: "SET_QUESTIONS"; questions: Question[] }
  | { type: "START_GAME" }
  | { type: "LOAD_QUESTION"; index: number }
  | { type: "TICK" }
  | { type: "EXPIRE" }
  | { type: "ANSWER"; choice: number }
  | { type: "CLAIM"; teamId: string }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "RESTART_QUESTION" }
  | { type: "SKIP" }
  | { type: "REVEAL" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ADJUST"; teamId: string; delta: number }
  | { type: "RESET_SCORES" }
  | { type: "END_GAME" }
  | { type: "BACK_TO_SETUP" }
  | { type: "CLEAR_FEEDBACK" };

function currentQuestion(state: GameState): Question | undefined {
  return state.questions[state.currentIndex];
}

function loadQuestion(state: GameState, index: number): GameState {
  const question = state.questions[index];
  if (!question) return { ...state, phase: "over", running: false, feedback: null };
  const isSpeed = question.type === "speed";
  const turnTeam = state.teams[index % Math.max(1, state.teams.length)];
  return {
    ...state,
    currentIndex: index,
    phase: isSpeed ? "speed-open" : "question",
    turnTeamId: isSpeed ? null : (turnTeam?.id ?? null),
    activeTeamId: isSpeed ? null : (turnTeam?.id ?? null),
    attemptedTeamIds: [],
    timeLeft: isSpeed ? state.settings.speedTimer : (question.timer ?? state.settings.defaultTimer),
    running: true,
    scored: false,
    revealed: false,
    selectedChoice: null,
    feedback: isSpeed ? { kind: "speed" } : null,
    scoreBumps: {},
  };
}

function award(state: GameState, teamId: string, points: number): GameState {
  const question = currentQuestion(state);
  return {
    ...state,
    teams: state.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + points } : t)),
    scoreBumps: { ...state.scoreBumps, [teamId]: points },
    scored: true,
    revealed: true,
    running: false,
    phase: "reveal",
    feedback: { kind: "correct", points, teamId },
    history: question
      ? [
          ...state.history.filter((h) => h.questionId !== question.id),
          { questionId: question.id, winnerTeamId: teamId, points },
        ]
      : state.history,
  };
}

function afterWrong(state: GameState, teamId: string): GameState {
  const question = currentQuestion(state);
  const attempted = state.attemptedTeamIds.includes(teamId)
    ? state.attemptedTeamIds
    : [...state.attemptedTeamIds, teamId];
  const remaining = state.teams.filter((t) => !attempted.includes(t.id));
  const base = { ...state, attemptedTeamIds: attempted, selectedChoice: null, activeTeamId: null };

  if (remaining.length === 0) {
    return { ...base, phase: "reveal", revealed: true, running: false, feedback: { kind: "wrong", teamId } };
  }
  if (question?.type === "speed") {
    return { ...base, phase: "speed-open", running: true, feedback: { kind: "wrong", teamId } };
  }
  return {
    ...base,
    phase: "steal-select",
    running: false,
    timeLeft: state.settings.stealTimer,
    feedback: { kind: "wrong", teamId },
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "SET_TEAMS":
      return { ...state, teams: action.teams };
    case "SET_QUESTIONS":
      return { ...state, questions: action.questions };
    case "START_GAME":
      return loadQuestion(
        { ...state, history: [], teams: state.teams.map((t) => ({ ...t })) },
        0,
      );
    case "LOAD_QUESTION":
      return loadQuestion(state, action.index);
    case "TICK": {
      if (!state.running || state.timeLeft <= 0) return state;
      return { ...state, timeLeft: state.timeLeft - 1 };
    }
    case "EXPIRE": {
      const question = currentQuestion(state);
      if (state.phase === "question") {
        return {
          ...state,
          running: false,
          phase: "steal-select",
          attemptedTeamIds: state.turnTeamId ? [state.turnTeamId] : [],
          activeTeamId: null,
          timeLeft: state.settings.stealTimer,
          feedback: { kind: "timeup" },
        };
      }
      if (state.phase === "steal-answer" && state.activeTeamId) {
        return afterWrong(state, state.activeTeamId);
      }
      if (state.phase === "speed-answer" && state.activeTeamId) {
        return afterWrong(state, state.activeTeamId);
      }
      if (state.phase === "speed-open") {
        return { ...state, running: false, phase: "reveal", revealed: true, feedback: { kind: "timeup" } };
      }
      void question;
      return { ...state, running: false };
    }
    case "ANSWER": {
      const question = currentQuestion(state);
      if (!question || state.scored) return state;
      const teamId = state.activeTeamId;
      if (!teamId) return state;
      const answerable =
        state.phase === "question" || state.phase === "steal-answer" || state.phase === "speed-answer";
      if (!answerable || !state.running) return state;

      const correct = action.choice === question.correctIndex;
      const withChoice = { ...state, selectedChoice: action.choice };
      if (!correct) return afterWrong(withChoice, teamId);

      const points =
        state.phase === "steal-answer"
          ? (state.settings.stealPoints ?? question.points)
          : question.points;
      return award(withChoice, teamId, points);
    }
    case "CLAIM": {
      if (state.attemptedTeamIds.includes(action.teamId)) return state;
      if (state.phase === "steal-select") {
        return {
          ...state,
          phase: "steal-answer",
          activeTeamId: action.teamId,
          timeLeft: state.settings.stealTimer,
          running: true,
          feedback: null,
        };
      }
      if (state.phase === "speed-open") {
        return {
          ...state,
          phase: "speed-answer",
          activeTeamId: action.teamId,
          timeLeft: Math.max(5, Math.round(state.settings.speedTimer / 2)),
          running: true,
          feedback: null,
        };
      }
      return state;
    }
    case "NEXT": {
      const next = state.currentIndex + 1;
      if (next >= state.questions.length) {
        return { ...state, phase: "over", running: false, feedback: null };
      }
      return loadQuestion(state, next);
    }
    case "PREV":
      return loadQuestion(state, Math.max(0, state.currentIndex - 1));
    case "RESTART_QUESTION":
      return loadQuestion(state, state.currentIndex);
    case "SKIP": {
      const next = state.currentIndex + 1;
      if (next >= state.questions.length) return { ...state, phase: "over", running: false };
      return loadQuestion(state, next);
    }
    case "REVEAL":
      return { ...state, revealed: true, running: false, phase: "reveal", feedback: null };
    case "PAUSE":
      return { ...state, running: false };
    case "RESUME":
      return state.timeLeft > 0 && state.phase !== "reveal" && state.phase !== "over"
        ? { ...state, running: true }
        : state;
    case "ADJUST":
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, score: t.score + action.delta } : t,
        ),
        scoreBumps: { ...state.scoreBumps, [action.teamId]: action.delta },
      };
    case "RESET_SCORES":
      return { ...state, teams: state.teams.map((t) => ({ ...t, score: 0 })), scoreBumps: {} };
    case "END_GAME":
      return { ...state, phase: "over", running: false, feedback: null };
    case "BACK_TO_SETUP":
      return { ...state, phase: "idle", running: false, feedback: null, scoreBumps: {} };
    case "CLEAR_FEEDBACK":
      return { ...state, feedback: null };
    default:
      return state;
  }
}

interface Ctx {
  state: GameState;
  dispatch: (action: Action) => void;
  activeTeam: Team | null;
  turnTeam: Team | null;
  question: Question | undefined;
  ranked: Team[];
}

const GameContext = createContext<Ctx | null>(null);

function loadPersisted(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed.teams || !parsed.questions || !parsed.settings) return null;
    return {
      ...initialState,
      settings: { ...initialState.settings, ...parsed.settings },
      teams: parsed.teams,
      questions: parsed.questions,
    };
  } catch {
    return null;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) dispatch({ type: "HYDRATE", state: persisted });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings: state.settings, teams: state.teams, questions: state.questions }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [state.settings, state.teams, state.questions]);

  useEffect(() => {
    setSoundEnabled(state.settings.sound);
  }, [state.settings.sound]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Countdown loop
  useEffect(() => {
    if (!state.running) return;
    if (state.timeLeft <= 0) {
      dispatch({ type: "EXPIRE" });
      return;
    }
    const id = window.setTimeout(() => {
      if (state.timeLeft <= 5) playSound("urgent");
      else playSound("tick");
      dispatch({ type: "TICK" });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [state.running, state.timeLeft]);

  // Sound + auto-clear for feedback
  const lastFeedback = useRef<string>("");
  useEffect(() => {
    const fb = state.feedback;
    if (!fb) {
      lastFeedback.current = "";
      return;
    }
    const key = JSON.stringify(fb);
    if (key !== lastFeedback.current) {
      lastFeedback.current = key;
      if (fb.kind === "correct") playSound("correct");
      if (fb.kind === "wrong") playSound("wrong");
      if (fb.kind === "timeup") playSound("timeup");
      if (fb.kind === "speed") playSound("speed");
    }
    if (fb.kind === "wrong" || fb.kind === "timeup" || fb.kind === "speed") {
      const id = window.setTimeout(() => dispatch({ type: "CLEAR_FEEDBACK" }), 1800);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [state.feedback]);

  useEffect(() => {
    if (state.phase === "over") playSound("winner");
  }, [state.phase]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      activeTeam: state.teams.find((t) => t.id === state.activeTeamId) ?? null,
      turnTeam: state.teams.find((t) => t.id === state.turnTeamId) ?? null,
      question: state.questions[state.currentIndex],
      ranked: [...state.teams].sort((a, b) => b.score - a.score),
    }),
    [state],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
