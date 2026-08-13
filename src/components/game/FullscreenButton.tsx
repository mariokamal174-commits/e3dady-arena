import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FullscreenButton({ className = "" }: { className?: string }) {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };

  // F key toggles fullscreen anywhere on the board
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key.toLowerCase() === "f") toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Button
      variant="secondary"
      size="sm"
      className={`gap-2 rounded-full ${className}`}
      onClick={toggle}
      aria-label={isFull ? "Exit fullscreen" : "Enter fullscreen"}
      title="Fullscreen (F)"
    >
      {isFull ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      {isFull ? "خروج" : "ملء الشاشة"}
    </Button>
  );
}
