import { createFileRoute } from "@tanstack/react-router";

type Body = {
  count?: number;
  categories?: string[];
  withImages?: boolean;
  defaultPoints?: number;
};

export const Route = createFileRoute("/api/generate-questions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { count = 10, categories = [], withImages = false, defaultPoints = 20 } =
          (await request.json()) as Body;

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const want = Math.min(20, Math.max(1, Math.floor(count)));
        const cats = categories.length ? categories.join("، ") : "معلومات عامة";

        const system = [
          "أنت مولّد أسئلة مسابقات باللغة العربية. أخرج JSON فقط بدون أي شرح.",
          `ولّد ${want} سؤال اختيار من متعدد عن: ${cats}.`,
          "الصيغة: مصفوفة JSON، كل عنصر: {\"text\":string, \"choices\":[4 نصوص], \"correctIndex\":0-3, \"type\":\"normal\"|\"steal\"|\"speed\"|\"oral\", \"points\":number, \"explanation\":string" +
            (withImages ? ", \"imagePrompt\": وصف إنجليزي قصير لصورة توضيحية مناسبة للسؤال" : "") +
            "}",
          `اجعل points = ${defaultPoints} افتراضياً. لا تكرر الأسئلة.`,
        ].join("\n");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.7-flash",
            messages: [
              { role: "system", content: system },
              { role: "user", content: "أعطني مصفوفة JSON فقط." },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          return new Response(await res.text(), { status: res.status });
        }

        const data = (await res.json()) as any;
        const text: string = data?.choices?.[0]?.message?.content ?? "";
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          const m = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
          if (m) {
            try {
              parsed = JSON.parse(m[1]);
            } catch {
              parsed = null;
            }
          }
        }
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.questions)
            ? parsed.questions
            : Array.isArray(parsed?.data)
              ? parsed.data
              : [];

        if (!list.length) {
          return new Response(JSON.stringify({ error: "تعذر تحليل رد الذكاء الاصطناعي" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ questions: list }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
