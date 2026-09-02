import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ClipboardPaste, Copy, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameProvider, useGame } from "@/game/store";
import { TEAM_ICONS, TEAM_PALETTE } from "@/game/demo";
import { QuestionCard } from "@/components/game/QuestionCard";
import type { PenaltyMode, Question, QuestionType, Team } from "@/game/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Quiz Arena" },
      {
        name: "description",
        content:
          "Create, edit, duplicate and reorder quiz questions, choose question types and manage teams for your live quiz.",
      },
      { property: "og:title", content: "Admin Dashboard — Quiz Arena" },
      {
        property: "og:description",
        content: "Manage questions, question types, points, timers and teams for your live quiz game.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <GameProvider>
      <Admin />
    </GameProvider>
  );
}

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "steal", label: "Steal" },
  { value: "speed", label: "⚡ Speed" },
  { value: "oral", label: "🗣️ Oral" },
];

function emptyQuestion(points: number): Question {
  return {
    id: crypto.randomUUID(),
    type: "normal",
    text: "",
    choices: ["", "", "", ""],
    correctIndex: 0,
    points,
  };
}

function parseBulkQuestions(input: string, defaultPoints: number): Question[] {
  const markdownBlocks = input
    .replace(/\r/g, "")
    .split(/(?=^\s*\*\*\s*\d+[.)]\s*)/m)
    .map((block) => block.trim())
    .filter((block) => /^\*\*\s*\d+[.)]\s*/.test(block));

  if (markdownBlocks.length) {
    return markdownBlocks
      .map((block) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const questionText = (lines[0] ?? "")
          .replace(/^\*\*\s*\d+[.)]\s*/, "")
          .replace(/\*\*\s*$/, "")
          .trim();
        const choices = lines
          .filter((line) => /^[A-Dأبجد][).:-]\s*/i.test(line))
          .slice(0, 4)
          .map((line) => line.replace(/^[A-Dأبجد][).:-]\s*/i, "").trim());
        const answerLine = lines.find((line) => /✅|^(answer|الإجابة)\s*:/i.test(line));
        const answerMatch =
          answerLine?.match(/✅[^A-Dأبجد]*([A-Dأبجد])/i)?.[1] ??
          answerLine?.match(/^(?:answer|الإجابة)\s*:\s*([A-Dأبجد])/i)?.[1];
        const answerIndex = ["A", "B", "C", "D", "أ", "ب", "ج", "د"].indexOf(
          answerMatch?.toUpperCase() ?? "A",
        );

        return {
          id: crypto.randomUUID(),
          type: "normal" as const,
          text: questionText,
          choices: [...choices, "", "", "", ""].slice(0, 4),
          correctIndex: answerIndex >= 0 ? answerIndex % 4 : 0,
          points: defaultPoints,
        };
      })
      .filter((question) => question.text && question.choices.some(Boolean));
  }

  const numberedBlocks: string[][] = [];
  let currentBlock: string[] = [];
  for (const rawLine of input.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("###")) continue;
    if (/^\d+[.)]\s+/.test(line)) {
      if (currentBlock.length) numberedBlocks.push(currentBlock);
      currentBlock = [line];
    } else if (currentBlock.length) {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length) numberedBlocks.push(currentBlock);

  if (numberedBlocks.length) {
    return numberedBlocks
      .map((lines) => {
        const text = (lines[0] ?? "").replace(/^\d+[.)]\s+/, "").trim();
        const choices = lines
          .filter((line) => /^[A-Dأبجد][).:-]\s*/i.test(line))
          .slice(0, 4)
          .map((line) => line.replace(/^[A-Dأبجد][).:-]\s*/i, "").trim());
        const answerLine = lines.find((line) => /^(answer|الإجابة)\s*:/i.test(line));
        const answer = answerLine?.match(/:\s*([A-Dأبجد])/i)?.[1]?.toUpperCase() ?? "A";
        const answerIndex = ["A", "B", "C", "D", "أ", "ب", "ج", "د"].indexOf(answer);
        return {
          id: crypto.randomUUID(),
          type: "normal" as const,
          text,
          choices: [...choices, "", "", "", ""].slice(0, 4),
          correctIndex: answerIndex >= 0 ? answerIndex % 4 : 0,
          points: defaultPoints,
        };
      })
      .filter((question) => question.text && question.choices.filter(Boolean).length === 4);
  }

  try {
    const parsed = JSON.parse(input) as Array<Record<string, unknown>>;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: crypto.randomUUID(),
        type: ["normal", "steal", "speed", "oral"].includes(String(item["type"]))
          ? (item["type"] as QuestionType)
          : "normal",
        text: String(item["text"] ?? item["question"] ?? ""),
        choices: Array.isArray(item["choices"])
          ? (item["choices"] as unknown[]).slice(0, 4).map(String).concat(["", "", "", ""]).slice(0, 4)
          : ["", "", "", ""],
        correctIndex: typeof item["correctIndex"] === "number" ? item["correctIndex"] : 0,
        points: typeof item["points"] === "number" ? item["points"] : defaultPoints,
        ...(item["explanation"] ? { explanation: String(item["explanation"]) } : {}),
      }));

    }
  } catch {
    // Fall through to the plain-text format.
  }

  return input
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length >= 5)
    .map((lines) => {
      const answerLine = lines.find((line) => /^(answer|الإجابة)\s*:/i.test(line));
      const typeLine = lines.find((line) => /^(type|النوع)\s*:/i.test(line));
      const pointsLine = lines.find((line) => /^(points|النقاط)\s*:/i.test(line));
      const choices = lines
        .slice(1)
        .filter((line) => !/^(answer|الإجابة|type|النوع|points|النقاط)\s*:/i.test(line))
        .slice(0, 4)
        .map((line) => line.replace(/^[A-Dأبج د][).:-]\s*/i, "").trim());
      const answer = answerLine?.split(":").slice(1).join(":").trim().toUpperCase() ?? "A";
      const answerIndex = ["A", "B", "C", "D", "أ", "ب", "ج", "د"].indexOf(answer);
      const rawType = typeLine?.split(":").slice(1).join(":").trim().toLowerCase();
      const type = ["normal", "steal", "speed", "oral"].includes(rawType ?? "")
        ? (rawType as QuestionType)
        : "normal";
      return {
        id: crypto.randomUUID(),
        text: lines[0] ?? "",
        choices: [...choices, "", "", "", ""].slice(0, 4),
        correctIndex: answerIndex >= 0 ? answerIndex % 4 : 0,
        points: Number(pointsLine?.split(":").pop()) || defaultPoints,
        type,
      };
    });
}

function Admin() {
  const { state, dispatch } = useGame();
  const [editing, setEditing] = useState<Question | null>(null);
  const [preview, setPreview] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoCategories, setAutoCategories] = useState<string[]>([]);
  const [autoCount, setAutoCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Question[] | null>(null);
  const [withImages, setWithImages] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const questions = state.questions;
  const setQuestions = (next: Question[]) => dispatch({ type: "SET_QUESTIONS", questions: next });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...questions];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    setQuestions(next);
  };

  const saveQuestion = () => {
    if (!editing) return;
    const exists = questions.some((q) => q.id === editing.id);
    setQuestions(exists ? questions.map((q) => (q.id === editing.id ? editing : q)) : [...questions, editing]);
    setEditing(null);
    setPreview(false);
  };

  const updateTeam = (id: string, patch: Partial<Team>) =>
    dispatch({ type: "SET_TEAMS", teams: state.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight">
            <span className="text-gradient">Admin Dashboard</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Everything is saved locally on this device.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" className="rounded-full">
            <Link to="/">Setup</Link>
          </Button>
          <Button asChild className="rounded-full font-bold">
            <Link to="/play">Go to game board</Link>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="questions" className="mt-8">
        <TabsList className="rounded-full bg-white/5 p-1">
          <TabsTrigger value="questions" className="rounded-full px-5">
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="rounded-full px-5">
            Teams ({state.teams.length})
          </TabsTrigger>
          <TabsTrigger value="show" className="rounded-full px-5">
            Show
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-5 space-y-3">
          <div className="flex gap-2">
            <Button
              className="rounded-full font-bold"
              onClick={() => setEditing(emptyQuestion(state.settings.defaultPoints))}
            >
              <Plus className="size-4" /> New question
            </Button>
            <Button
              className="rounded-full font-bold"
              variant="secondary"
              onClick={() => setAutoOpen(true)}
            >
              توليد أسئلة آليًا
            </Button>
            <Button className="rounded-full font-bold" variant="secondary" onClick={() => setPasteOpen(true)}>
              <ClipboardPaste className="size-4" /> Paste questions
            </Button>
          </div>

          {questions.map((q, i) => (
            <div key={q.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
              <span className="font-display w-8 text-lg font-black tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span
                className="rounded-full px-3 py-1 text-[10px] font-black tracking-[0.15em]"
                style={{
                  backgroundColor:
                    q.type === "speed"
                      ? "#facc1522"
                      : q.type === "steal"
                        ? "#f43f5e22"
                        : q.type === "oral"
                          ? "#a78bfa22"
                          : "#38bdf822",
                  color:
                    q.type === "speed"
                      ? "#facc15"
                      : q.type === "steal"
                        ? "#f43f5e"
                        : q.type === "oral"
                          ? "#a78bfa"
                          : "#38bdf8",
                }}
              >
                {q.type.toUpperCase()}
              </span>
              <span className="min-w-40 flex-1 truncate font-semibold">{q.text || "Untitled question"}</span>
              <span className="text-sm font-bold text-primary">{q.points} pts</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)}>
                  <ArrowDown className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing({ ...q })}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setQuestions([
                      ...questions.slice(0, i + 1),
                      { ...q, id: crypto.randomUUID() },
                      ...questions.slice(i + 1),
                    ])
                  }
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuestions(questions.filter((x) => x.id !== q.id))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Auto-generate dialog */}
        <Dialog open={autoOpen} onOpenChange={(open) => setAutoOpen(open)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Autogenerate Questions</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">اختر التصنيفات وعدد الأسئلة المراد توليدها بواسطة الذكاء الاصطناعي (Arabic output).</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>التصنيفات</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { key: "دينية (مسيحية)", label: "دينية (مسيحية)" },
                      { key: "عام", label: "عام" },
                      { key: "ألغاز", label: "ألغاز" },
                      { key: "رياضة", label: "رياضة" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() =>
                          setAutoCategories((prev) =>
                            prev.includes(c.key) ? prev.filter((x) => x !== c.key) : [...prev, c.key],
                          )
                        }
                        className={`rounded-full px-4 py-2 ${autoCategories.includes(c.key) ? "bg-primary text-primary-foreground" : "bg-white/5"}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>عدد الأسئلة</Label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={autoCount}
                    onChange={(e) => setAutoCount(Number(e.target.value || 0))}
                    className="h-11 rounded-xl bg-white/5"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={withImages}
                  onChange={(e) => setWithImages(e.target.checked)}
                />
                ولّد صورة توضيحية لكل سؤال بالذكاء الاصطناعي (أبطأ)
              </label>

              <div className="flex items-center justify-end gap-2">
                {genStatus ? <span className="text-sm text-muted-foreground">{genStatus}</span> : null}
                <Button variant="secondary" onClick={() => setAutoOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  disabled={generating}
                  onClick={async () => {
                    setGenerating(true);
                    setGenerated(null);
                    setGenStatus("جارٍ توليد الأسئلة…");
                    try {
                      const categories = autoCategories.length ? autoCategories : ["عام"];
                      const total = Math.min(60, Math.max(1, autoCount || 10));
                      const batchSize = 10;
                      const out: Question[] = [];

                      for (let i = 0; i < Math.ceil(total / batchSize); i++) {
                        const want = Math.min(batchSize, total - i * batchSize);
                        setGenStatus(`جارٍ توليد الأسئلة… (${out.length}/${total})`);
                        const res = await fetch("/api/generate-questions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            count: want,
                            categories,
                            withImages,
                            defaultPoints: state.settings.defaultPoints,
                          }),
                        });
                        if (!res.ok) {
                          const msg = await res.text();
                          throw new Error(msg || `HTTP ${res.status}`);
                        }
                        const data = (await res.json()) as { questions: any[] };
                        for (const q of data.questions ?? []) {
                          out.push({
                            id: crypto.randomUUID(),
                            text: String(q.text ?? q.question ?? ""),
                            choices: Array.isArray(q.choices)
                              ? q.choices.slice(0, 4).map(String).concat(["", "", "", ""]).slice(0, 4)
                              : ["", "", "", ""],
                            correctIndex: Number.isFinite(q.correctIndex) ? Number(q.correctIndex) : 0,
                            type: ["normal", "steal", "speed", "oral"].includes(q.type)
                              ? q.type
                              : "normal",
                            points: Number(q.points) || state.settings.defaultPoints,
                            ...(q.explanation ? { explanation: String(q.explanation) } : {}),
                            ...(withImages && q.imagePrompt ? { imagePrompt: String(q.imagePrompt) } : {}),
                          } as Question & { imagePrompt?: string });
                        }
                      }

                      if (withImages) {
                        for (let i = 0; i < out.length; i++) {
                          const q = out[i] as Question & { imagePrompt?: string };
                          const prompt = q.imagePrompt || q.text;
                          if (!prompt) continue;
                          setGenStatus(`جارٍ توليد الصور… (${i + 1}/${out.length})`);
                          try {
                            const res = await fetch("/api/generate-image", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ prompt }),
                            });
                            if (!res.ok) continue;
                            const { b64 } = (await res.json()) as { b64: string };
                            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
                            const path = `ai/${crypto.randomUUID()}.png`;
                            const { error } = await supabase.storage
                              .from("question-images")
                              .upload(path, bytes, { contentType: "image/png", upsert: false });
                            if (error) continue;
                            const { data: signed } = await supabase.storage
                              .from("question-images")
                              .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
                            if (signed?.signedUrl) q.imageUrl = signed.signedUrl;
                          } catch (err) {
                            console.error("image gen failed", err);
                          }
                          delete q.imagePrompt;
                        }
                      }

                      setGenerated(out);
                      setGenStatus(null);
                    } catch (e) {
                      console.error(e);
                      setGenStatus(null);
                      toast.error("فشل توليد الأسئلة — حاول تاني.");
                    } finally {
                      setGenerating(false);
                    }
                  }}
                >
                  {generating ? "جارٍ التوليد…" : "Generate"}
                </Button>
              </div>


              {generated && (
                <div className="space-y-3">
                  <h3 className="font-bold">Preview ({generated.length})</h3>
                  <div className="grid gap-2">
                    {generated.slice(0, 20).map((g, i) => (
                      <div key={g.id} className="rounded-2xl bg-white/5 p-3">
                        <div className="font-semibold">{i + 1}. {g.text}</div>
                        <div className="text-sm text-muted-foreground">{g.choices.join(" · ")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setGenerated(null)}>Close preview</Button>
                    <Button onClick={() => { setQuestions([...questions, ...(generated ?? [])]); setGenerated(null); setAutoOpen(false); }}>
                      Add to bank
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Paste questions</DialogTitle>
            </DialogHeader>
            <Textarea
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              placeholder={'Question?\nChoice A\nChoice B\nChoice C\nChoice D\nAnswer: B\n\nNext question...'}
              className="min-h-72 rounded-xl bg-white/5 font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPasteOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  const imported = parseBulkQuestions(pasteText, state.settings.defaultPoints);
                  if (!imported.length) {
                    toast.error("لم يتم العثور على أسئلة صالحة");
                    return;
                  }
                  setQuestions([...questions, ...imported]);
                  setPasteText("");
                  setPasteOpen(false);
                  toast.success(`تمت إضافة ${imported.length} أسئلة`);
                }}
              >
                Add questions
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <TabsContent value="teams" className="mt-5 space-y-3">
          <Button
            className="rounded-full font-bold"
            onClick={() =>
              dispatch({
                type: "SET_TEAMS",
                teams: [
                  ...state.teams,
                  {
                    id: crypto.randomUUID(),
                    name: `Team ${state.teams.length + 1}`,
                    color: TEAM_PALETTE[state.teams.length % TEAM_PALETTE.length]!,
                    icon: TEAM_ICONS[state.teams.length % TEAM_ICONS.length]!,
                    score: 0,
                  },
                ],
              })
            }
          >
            <Plus className="size-4" /> Add team
          </Button>

          {state.teams.map((team) => (
            <div key={team.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
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
                className="h-11 min-w-40 flex-1 rounded-xl bg-white/5 font-semibold"
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
                  dispatch({ type: "SET_TEAMS", teams: state.teams.filter((t) => t.id !== team.id) })
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="show" className="mt-5 grid gap-4 md:grid-cols-2">
          <SpectatorPanel />
          <div className="glass space-y-6 rounded-2xl p-5">
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] text-muted-foreground">SOUND VOLUME</p>
              <div className="mt-4 flex items-center gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    dispatch({ type: "SET_SETTINGS", settings: { sound: !state.settings.sound } })
                  }
                >
                  {state.settings.sound ? "🔊 On" : "🔇 Muted"}
                </Button>
                <Slider
                  className="flex-1"
                  min={0}
                  max={100}
                  step={5}
                  value={[Math.round((state.settings.volume ?? 0.8) * 100)]}
                  onValueChange={([v]) =>
                    dispatch({ type: "SET_SETTINGS", settings: { volume: (v ?? 0) / 100 } })
                  }
                />
                <span className="w-12 text-right font-bold tabular-nums">
                  {Math.round((state.settings.volume ?? 0.8) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black tracking-[0.22em] text-muted-foreground">
                عقوبة الإجابة الغلط
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    { value: "none", label: "بدون عقوبة" },
                    { value: "half", label: "خصم نصف النقاط" },
                    { value: "pass", label: "تمرير الدور فورًا" },
                  ] as { value: PenaltyMode; label: string }[]
                ).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={(state.settings.penalty ?? "none") === opt.value ? "default" : "secondary"}
                    className="rounded-full"
                    onClick={() => dispatch({ type: "SET_SETTINGS", settings: { penalty: opt.value } })}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                خصم نصف النقاط: الفريق يخسر نص نقاط السؤال ويفضل باب السرقة مفتوح. تمرير الدور: السؤال
                يتقفل فورًا من غير سرقة.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setPreview(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Question editor</DialogTitle>
          </DialogHeader>

          {editing ? (
            preview ? (
              <div className="space-y-4">
                <QuestionCard
                  question={editing}
                  questionNumber={1}
                  total={questions.length}
                  selected={null}
                  revealed
                  canAnswer={false}
                  onAnswer={() => {}}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setPreview(false)}>
                    Back to editing
                  </Button>
                  <Button onClick={saveQuestion}>Save question</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {TYPES.map((t) => (
                    <Button
                      key={t.value}
                      variant={editing.type === t.value ? "default" : "secondary"}
                      className="rounded-full"
                      onClick={() => setEditing({ ...editing, type: t.value })}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label>Question</Label>
                  <Textarea
                    value={editing.text}
                    onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    className="min-h-20 rounded-xl bg-white/5 text-lg"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {editing.choices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, correctIndex: i })}
                        className={`grid size-10 shrink-0 place-items-center rounded-xl font-black ${
                          editing.correctIndex === i ? "bg-success text-success-foreground" : "bg-white/10"
                        }`}
                      >
                        {["A", "B", "C", "D"][i]}
                      </button>
                      <Input
                        value={choice}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            choices: editing.choices.map((c, ci) => (ci === i ? e.target.value : c)),
                          })
                        }
                        className="h-11 rounded-xl bg-white/5"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a letter to mark the correct answer (currently{" "}
                  {["A", "B", "C", "D"][editing.correctIndex]}).
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={editing.points}
                      onChange={(e) => setEditing({ ...editing, points: Number(e.target.value) || 0 })}
                      className="h-11 rounded-xl bg-white/5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Timer (seconds, optional)</Label>
                    <Input
                      type="number"
                      value={editing.timer ?? ""}
                      placeholder={String(state.settings.defaultTimer)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const next = { ...editing };
                        if (raw === "") delete next.timer;
                        else next.timer = Number(raw);
                        setEditing(next);
                      }}
                      className="h-11 rounded-xl bg-white/5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>صورة السؤال (اختياري)</Label>
                    <Input
                      value={editing.imageUrl ?? ""}
                      placeholder="الصق لينك أو ارفع صورة"
                      onChange={(e) => {
                        const next = { ...editing };
                        if (!e.target.value) delete next.imageUrl;
                        else next.imageUrl = e.target.value;
                        setEditing(next);
                      }}
                      className="h-11 rounded-xl bg-white/5"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        id="question-image-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          setUploading(true);
                          try {
                            const ext = file.name.split(".").pop() || "jpg";
                            const path = `${crypto.randomUUID()}.${ext}`;
                            const { error } = await supabase.storage
                              .from("question-images")
                              .upload(path, file, { contentType: file.type, upsert: false });
                            if (error) throw error;
                            const { data, error: signErr } = await supabase.storage
                              .from("question-images")
                              .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
                            if (signErr || !data) throw signErr ?? new Error("no url");
                            setEditing((prev) => (prev ? { ...prev, imageUrl: data.signedUrl } : prev));
                            toast.success("تم رفع الصورة");
                          } catch (err) {
                            toast.error("فشل رفع الصورة");
                            console.error(err);
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full"
                        disabled={uploading}
                        onClick={() => document.getElementById("question-image-file")?.click()}
                      >
                        <ImagePlus className="size-4" />
                        {uploading ? "جاري الرفع..." : "ارفع صورة من الجهاز"}
                      </Button>
                      {editing.imageUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => {
                            const next = { ...editing };
                            delete next.imageUrl;
                            setEditing(next);
                          }}
                        >
                          حذف
                        </Button>
                      ) : null}
                    </div>
                    {editing.imageUrl ? (
                      <img
                        src={editing.imageUrl}
                        alt="معاينة صورة السؤال"
                        className="max-h-40 w-auto max-w-full rounded-xl object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sound URL (optional)</Label>
                    <Input
                      value={editing.soundUrl ?? ""}
                      onChange={(e) => {
                        const next = { ...editing };
                        if (!e.target.value) delete next.soundUrl;
                        else next.soundUrl = e.target.value;
                        setEditing(next);
                      }}
                      className="h-11 rounded-xl bg-white/5"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Explanation (optional)</Label>
                  <Textarea
                    value={editing.explanation ?? ""}
                    onChange={(e) => {
                      const next = { ...editing };
                      if (!e.target.value) delete next.explanation;
                      else next.explanation = e.target.value;
                      setEditing(next);
                    }}
                    className="rounded-xl bg-white/5"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setPreview(true)}>
                    Preview
                  </Button>
                  <Button onClick={saveQuestion}>Save question</Button>
                </div>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}


function SpectatorPanel() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = origin ? `${origin}/watch` : "";

  return (
    <div className="glass flex flex-col items-center gap-4 rounded-2xl p-5 text-center">
      <p className="text-[10px] font-black tracking-[0.22em] text-muted-foreground">شاشة الجمهور</p>
      <div className="rounded-2xl bg-white p-3">
        {url ? <QRCodeSVG value={url} size={168} includeMargin={false} /> : <div className="size-[168px]" />}
      </div>
      <p className="text-sm text-muted-foreground">امسح الكود عشان تتابع اللعبة بدون تحكم</p>
      <code className="break-all rounded-full bg-white/10 px-3 py-1 text-xs">{url || "/watch"}</code>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={() => void navigator.clipboard.writeText(url)}
        >
          نسخ اللينك
        </Button>
        <Button asChild className="rounded-full">
          <a href="/watch" target="_blank" rel="noreferrer">
            فتح المشاهدة
          </a>
        </Button>
      </div>
    </div>
  );
}
