import { createFileRoute } from "@tanstack/react-router";
import { GameProvider } from "@/game/store";
import { GameBoard } from "@/components/game/GameBoard";

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Spectator View — Quiz Arena" },
      {
        name: "description",
        content:
          "Watch the live quiz in real time: current question, countdown, teams and scores — view only, no controls.",
      },
      { property: "og:title", content: "Spectator View — Quiz Arena" },
      {
        property: "og:description",
        content: "Follow the live quiz in real time from any device — questions, timer and scores, view only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  return (
    <GameProvider>
      <GameBoard spectator />
    </GameProvider>
  );
}
