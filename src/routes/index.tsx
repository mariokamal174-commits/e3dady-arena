import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Archive, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { GameProvider, useGame } from "@/game/store";
import { TEAM_ICONS, TEAM_PALETTE } from "@/game/demo";
import type { Team, Member } from "@/game/types";
import { supabase } from "@/integrations/supabase/client";

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
  const { state, dispatch, adminUnlocked, setAdminUnlocked } = useGame();
  const [adminPass, setAdminPass] = useState("");
  const navigate = useNavigate();
  const { settings, teams, questions } = state;
  const [editingMembersFor, setEditingMembersFor] = useState<string | null>(null);
  const [localMembers, setLocalMembers] = useState<Member[]>([]);

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

  const formatArchiveDate = (value: string) =>
    new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <>
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
                <Button
                  size="sm"
                  variant="default"
                  className="h-11 rounded-xl px-4 font-bold shadow-sm"
                  onClick={() => {
                    setEditingMembersFor(team.id);
                    setLocalMembers(team.members ? team.members.map((m) => ({ ...m })) : []);
                  }}
                >
                  <Pencil className="size-4" /> Edit members
                </Button>
                {adminUnlocked ? (
                  <>
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
                  </>
                ) : (
                  <span className="h-11 w-24 flex items-center justify-center rounded-xl bg-white/5 text-center font-bold text-muted-foreground">
                    ••
                  </span>
                )}
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
            <div className="mt-3 rounded-2xl bg-white/5 p-3">
              {adminUnlocked ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Admin mode active</span>
                  <Button size="sm" variant="secondary" onClick={() => setAdminUnlocked(false)}>
                    Lock
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Admin password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (adminPass === "a3dady") setAdminUnlocked(true);
                      else alert("Incorrect admin password");
                    }}
                  >
                    Unlock
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto mt-5 w-full max-w-6xl px-5 pb-10">
        <div className="glass rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-black">Score archive</h2>
              <p className="mt-1 text-sm text-muted-foreground">Save finished scores and restore them whenever you need.</p>
            </div>
            <Button
              variant="secondary"
              className="rounded-full"
              disabled={!teams.some((team) => team.score !== 0)}
              onClick={() => dispatch({ type: "ARCHIVE_SCORES" })}
            >
              <Archive className="size-4" /> Archive current scores
            </Button>
          </div>
          {state.scoreArchives.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {state.scoreArchives.map((archive) => (
                <div key={archive.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                  <span className="flex-1 font-semibold">{formatArchiveDate(archive.createdAt)}</span>
                  <span className="text-sm text-muted-foreground">
                    {archive.teams.map((team) => `${team.name}: ${team.score}`).join(" · ")}
                  </span>
                  <Button size="sm" variant="ghost" className="rounded-full" onClick={() => dispatch({ type: "RESTORE_SCORES", archiveId: archive.id })}>
                    <RotateCcw className="size-4" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No archived scores yet.</p>
          )}
        </div>
      </section>
      </main>
      <MembersDialog
        teamId={editingMembersFor}
        members={localMembers}
        onClose={() => { setEditingMembersFor(null); setLocalMembers([]); }}
        onSave={(m) => dispatch({ type: "SET_TEAMS", teams: teams.map((t) => (t.id === editingMembersFor ? { ...t, members: m } : t)) })}
      />
    </>
  );
}

// Render MembersDialog from GameSetup via DOM injection
export function MembersDialogHost(props: { teamId: string | null; members: Member[]; onClose: () => void; onSave: (m: Member[]) => void; }) {
  return <MembersDialog teamId={props.teamId} members={props.members} onClose={props.onClose} onSave={props.onSave} />;
}

// Members editor dialog placed outside component for clarity
function MembersDialog({ teamId, members, onClose, onSave }: { teamId: string | null; members: Member[]; onClose: () => void; onSave: (m: Member[]) => void; }) {
  const [local, setLocal] = useState<Member[]>(members || []);

  // sync when props change
  useEffect(() => setLocal(members || []), [members]);

  const uploadPhoto = async (file: File, teamId: string) => {
    try {
      const path = `avatars/${teamId}/${crypto.randomUUID()}-${file.name}`;
      const { data, error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const publicUrl = supabase.storage.from("avatars").getPublicUrl(data.path).data.publicUrl;
      return publicUrl;
    } catch (e) {
      console.error(e);
      window.alert("فشل رفع الصورة. تأكد من إعداد الـ storage bucket 'avatars'.");
      return undefined;
    }
  };

  return (
    <Dialog open={Boolean(teamId)} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit members</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            {local.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2">
                <input
                  placeholder="Member name"
                  value={m.name}
                  onChange={(e) => setLocal(local.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                  className="h-10 rounded-xl bg-white/5 flex-1 px-3"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !teamId) return;
                    const url = await uploadPhoto(file, teamId);
                    if (url) {
                      setLocal((current) =>
                        current.map((member, index) => (index === i ? { ...member, photoUrl: url } : member)),
                      );
                    }
                  }}
                />
                {m.photoUrl ? (
                  <img
                    src={m.photoUrl}
                    alt={m.name || "Member photo"}
                    className="size-10 rounded-full object-cover"
                  />
                ) : null}
                <button type="button" onClick={() => setLocal(local.filter((_, idx) => idx !== i))} className="text-destructive">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocal([...local, { id: crypto.randomUUID(), name: "" }])}>Add member</Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(local); onClose(); }}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
