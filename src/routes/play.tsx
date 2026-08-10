import { createFileRoute } from "@tanstack/react-router";
import { GameProvider } from "@/game/store";
import { GameBoard } from "@/components/game/GameBoard";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Live Game Board — Quiz Arena" },
      {
        name: "description",
        content:
          "Run the live quiz: turn-based questions, 20-second timer, steal mode, speed rounds and animated scoring.",
      },
      { property: "og:title", content: "Live Game Board — Quiz Arena" },
      {
        property: "og:description",
        content: "Turn-based questions, steal mode, speed rounds and animated scoring on the big screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  return (
    <GameProvider>
      <GameBoard />
    </GameProvider>
  );
}
