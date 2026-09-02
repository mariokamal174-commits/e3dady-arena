import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt) return new Response("Missing prompt", { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-image-2",
            prompt,
            quality: "low",
          }),
        });

        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }

        const data = (await upstream.json()) as any;
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) {
          return new Response(JSON.stringify({ error: "no image returned" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ b64 }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
