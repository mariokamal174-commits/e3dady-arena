import confetti from "canvas-confetti";

export function burstConfetti(colors?: string[]) {
  const palette = colors?.length ? colors : ["#38bdf8", "#f43f5e", "#4ade80", "#facc15", "#a78bfa"];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.62 }, colors: palette });
  window.setTimeout(
    () => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: palette }),
    140,
  );
  window.setTimeout(
    () => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: palette }),
    240,
  );
}

export function winnerConfetti(colors?: string[]) {
  const end = Date.now() + 2500;
  const palette = colors?.length ? colors : ["#facc15", "#38bdf8", "#f43f5e", "#4ade80"];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors: palette });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors: palette });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
