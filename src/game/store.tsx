import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { demoQuestions, demoSettings, demoTeams } from "./demo";
import { playSound, setSoundEnabled, setVolume, unlockAudio } from "./audio";
import type { GameSettings, GameState, LifelineKind, Question, Team } from "./types";

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
  questionStarted: false,
  scored: false,
  revealed: false,
  selectedChoice: null,
  feedback: null,
  history: [],
  scoreBumps: {},
  choicesHidden: false,
  scoresHidden: true,
  removedChoices: [],
  lifelinesUsed: {},
  lifelineNotice: null,
};

export type Action =
  | { type: "HYDRATE"; state: GameState }
  | { type: "REMOTE"; state: GameState }
  | { type: "SET_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "SET_TEAMS"; teams: Team[] }
  | { type: "SET_QUESTIONS"; questions: Question[] }
  | { type: "START_GAME" }
  | { type: "LOAD_QUESTION"; index: number }
  | { type: "TICK" }
  | { type: "EXPIRE" }
  | { type: "ANSWER"; choice: number }
  | { type: "ORAL_SELECT"; teamId: string }
  | { type: "ORAL_RESULT"; teamId: string; correct: boolean }
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
  | { type: "CLEAR_FEEDBACK" }
  | { type: "TOGGLE_CHOICES" }
  | { type: "TOGGLE_SCORES" }
  | { type: "LIFELINE"; kind: LifelineKind; teamId: string }
  | { type: "CLEAR_LIFELINE_NOTICE" };

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
    running: false,
    questionStarted: false,
    scored: false,
    revealed: false,
    selectedChoice: null,
    feedback: isSpeed ? { kind: "speed" } : null,
    scoreBumps: {},
    choicesHidden: false,
    removedChoices: [],
    lifelineNotice: null,
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

  // Wrong-answer penalty
  const penalty = state.settings.penalty ?? "none";
  const loss = penalty === "half" ? Math.round((question?.points ?? 0) / 2) : 0;
  const penalized: GameState = loss
    ? {
        ...state,
        teams: state.teams.map((t) => (t.id === teamId ? { ...t, score: t.score - loss } : t)),
        scoreBumps: { ...state.scoreBumps, [teamId]: -loss },
      }
    : state;

  const base = { ...penalized, attemptedTeamIds: attempted, selectedChoice: null, activeTeamId: null };

  if (penalty === "pass") {
    // Turn passes immediately — no steal, no buzz back in.
    return { ...base, phase: "reveal", revealed: true, running: false, feedback: { kind: "wrong", teamId } };
  }

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
      return { ...action.state, questionStarted: action.state.questionStarted ?? true };
    case "REMOTE":
      return { ...state, ...action.state, questionStarted: action.state.questionStarted ?? true };
    case "SET_SETTINGS": {
      const nextSettings = { ...state.settings, ...action.settings };
      // Keep existing questions in sync when the default point values change,
      // so questions that still use the old default follow the new one.
      const oldDefault = state.settings.defaultPoints;
      const oldSpeed = state.settings.speedPoints;
      const questions = state.questions.map((q) => {
        if (q.type === "speed" && oldSpeed !== nextSettings.speedPoints && q.points === oldSpeed) {
          return { ...q, points: nextSettings.speedPoints };
        }
        if (q.type !== "speed" && oldDefault !== nextSettings.defaultPoints && q.points === oldDefault) {
          return { ...q, points: nextSettings.defaultPoints };
        }
        return q;
      });
      return { ...state, settings: nextSettings, questions };
    }

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
        if (question?.type === "oral") {
          return {
            ...state,
            running: false,
            phase: "reveal",
            revealed: true,
            feedback: { kind: "timeup" },
          };
        }
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
    case "ORAL_SELECT": {
      const q = currentQuestion(state);
      if (!q || q.type !== "oral") return state;
      if (state.attemptedTeamIds.includes(action.teamId)) return state;
      return {
        ...state,
        phase: state.phase === "steal-select" ? "steal-answer" : state.phase,
        activeTeamId: action.teamId,
        running: false,
        feedback: null,
      };
    }
    case "ORAL_RESULT": {
      const question = currentQuestion(state);
      if (!question || question.type !== "oral") return state;
      if (action.correct) {
        const points =
          state.phase === "steal-answer"
            ? (state.settings.stealPoints ?? question.points)
            : question.points;
        return award({ ...state, activeTeamId: action.teamId, running: false }, action.teamId, points);
      }
      return afterWrong({ ...state, activeTeamId: action.teamId, running: false }, action.teamId);
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
        ? { ...state, running: true, questionStarted: true }
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
    case "TOGGLE_CHOICES":
      return { ...state, choicesHidden: !state.choicesHidden };
    case "TOGGLE_SCORES":
      return { ...state, scoresHidden: !state.scoresHidden };
    case "CLEAR_LIFELINE_NOTICE":
      return { ...state, lifelineNotice: null };
    case "LIFELINE": {
      const used = state.lifelinesUsed[action.teamId] ?? [];
      if (used.includes(action.kind)) return state;
      const team = state.teams.find((t) => t.id === action.teamId);
      const question = currentQuestion(state);
      const base: GameState = {
        ...state,
        lifelinesUsed: { ...state.lifelinesUsed, [action.teamId]: [...used, action.kind] },
      };
      if (action.kind === "time") {
        return {
          ...base,
          timeLeft: state.timeLeft + 20,
          running: true,
          lifelineNotice: `⏱️ +20 ثانية لفريق ${team?.name ?? ""}`,
        };
      }
      if (action.kind === "friend") {
        return {
          ...base,
          running: false,
          lifelineNotice: `📞 استعانة بصديق — ${team?.name ?? ""} · الوقت متوقف`,
        };
      }
      if (action.kind === "fifty") {
        if (!question) return state;
        const wrong = question.choices
          .map((_, i) => i)
          .filter((i) => i !== question.correctIndex && !state.removedChoices.includes(i))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        return {
          ...base,
          removedChoices: [...state.removedChoices, ...wrong],
          lifelineNotice: `✂️ حذف إجابتين لفريق ${team?.name ?? ""}`,
        };
      }
      // swap: replace the current question with a later unused one
      const swapWith = state.questions.findIndex((q, i) => i > state.currentIndex && q.type === (question?.type ?? q.type));
      const target = swapWith >= 0 ? swapWith : state.currentIndex + 1;
      if (!state.questions[target]) return { ...base, lifelineNotice: "🔄 لا يوجد سؤال بديل" };
      const questions = [...state.questions];
      const a = questions[state.currentIndex]!;
      const b = questions[target]!;
      questions[state.currentIndex] = b;
      questions[target] = a;
      return {
        ...loadQuestion({ ...base, questions }, state.currentIndex),
        lifelinesUsed: base.lifelinesUsed,
        lifelineNotice: `🔄 تم تغيير السؤال لفريق ${team?.name ?? ""}`,
      };
    }
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
  adminUnlocked: boolean;
  setAdminUnlocked: (v: boolean) => void;
}

const GameContext = createContext<Ctx | null>(null);

function loadPersisted(pathname = "/"): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed.teams || !parsed.questions || !parsed.settings) return null;

    const base = {
      ...initialState,
      settings: { ...initialState.settings, ...parsed.settings },
      teams: parsed.teams,
      questions: parsed.questions,
    };

    if (pathname === "/watch") return null;

    if (pathname !== "/play") {
      return {
        ...base,
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
        choicesHidden: false,
        scoresHidden: true,
        removedChoices: [],
        lifelinesUsed: {},
        lifelineNotice: null,
      };
    }

    return {
      ...base,
      ...parsed,
      settings: { ...initialState.settings, ...parsed.settings },
      teams: parsed.teams,
      questions: parsed.questions,
    };
  } catch {
    return null;
  }
}

const ROOM_ID = "main";

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // admin unlocked flag persisted in localStorage
  const [adminUnlockedState, setAdminUnlockedState] = useState(false);
  useEffect(() => {
    try {
      setAdminUnlockedState(window.localStorage.getItem("quiz-admin-unlocked") === "true");
    } catch {}
  }, []);
  const adminUnlocked = adminUnlockedState;
  const setAdminUnlocked = useCallback((v: boolean) => {
    try {
      window.localStorage.setItem("quiz-admin-unlocked", v ? "true" : "false");
    } catch {}
    setAdminUnlockedState(v);
  }, []);
  const hydrated = useRef(false);
  const clientId = useRef<string>(Math.random().toString(36).slice(2));
  const shouldPush = useRef(false);
  const remoteReady = useRef(false);

  const dispatchSync = useCallback((action: Action) => {
    if (action.type !== "TICK" && action.type !== "HYDRATE" && action.type !== "REMOTE") {
      shouldPush.current = true;
    }
    dispatch(action);
  }, []);

  const pushState = useCallback(async (nextState: GameState) => {
    try {
      await supabase
        .from("game_rooms")
        .upsert({
          id: ROOM_ID,
          state: nextState as never,
          sender: clientId.current,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error("[game sync] failed to push state", error);
    }
  }, []);

  // Load shared room + subscribe to live updates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("game_rooms").select("state").eq("id", ROOM_ID).maybeSingle();
      const remote = data?.state as Partial<GameState> | undefined;
      if (!cancelled && remote && remote.teams && remote.questions) {
        dispatch({ type: "REMOTE", state: remote as GameState });
      }
      remoteReady.current = true;
    })();

    const channel = supabase
      .channel("game-room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${ROOM_ID}` },
        (payload) => {
          const row = payload.new as { sender?: string; state?: Partial<GameState> } | null;
          if (!row || row.sender === clientId.current) return;
          if (row.state && row.state.teams && row.state.questions) {
            dispatch({ type: "REMOTE", state: row.state as GameState });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Push local changes to everyone else
  useEffect(() => {
    if (!shouldPush.current || !remoteReady.current) return;
    shouldPush.current = false;
    void pushState(state);
  }, [state, pushState, remoteReady.current]);

  useEffect(() => {
    if (hydrated.current) return;
    const persisted = loadPersisted(typeof window !== "undefined" ? window.location.pathname : "/");
    if (persisted) dispatch({ type: "HYDRATE", state: persisted });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  useEffect(() => {
    setSoundEnabled(state.settings.sound);
  }, [state.settings.sound]);

  useEffect(() => {
    setVolume(state.settings.volume ?? 1);
  }, [state.settings.volume]);

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
    if (typeof window === "undefined" || window.location.pathname !== "/play" || !state.running) return;
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
      dispatch: dispatchSync,
      activeTeam: state.teams.find((t) => t.id === state.activeTeamId) ?? null,
      turnTeam: state.teams.find((t) => t.id === state.turnTeamId) ?? null,
      question: state.questions[state.currentIndex],
      ranked: [...state.teams].sort((a, b) => b.score - a.score),
      adminUnlocked: adminUnlocked,
      setAdminUnlocked,
    }),
    [state, dispatchSync, adminUnlocked, setAdminUnlocked],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
