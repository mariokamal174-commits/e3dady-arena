import { createFileRoute } from "@tanstack/react-router";

type Body = {
  count?: number;
  categories?: string[];
  withImages?: boolean;
  defaultPoints?: number;
  /** Map of how many questions to generate for each type. */
  distribution?: Record<string, number>;
  avoid?: string[];
};

const VALID_TYPES = ["normal", "steal", "speed", "oral"] as const;

type QuestionType = (typeof VALID_TYPES)[number];

function buildSchema(type: QuestionType, withImages: boolean): string {
  const base = `{"text":string, "type":"${type}", "points":number, "explanation":string`;
  const image = withImages ? ", \"imagePrompt\": وصف إنجليزي قصير لصورة توضيحية مناسبة للسؤال" : "";
  if (type === "oral") {
    return `${base}, "answer":string${image}}`;
  }
  return `${base}, "choices":[4 نصوص], "correctIndex":0-3${image}}`;
}

export const Route = createFileRoute("/api/generate-questions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const {
          count = 10,
          categories = [],
          withImages = false,
          defaultPoints = 20,
          distribution = {},
          avoid = [],
        } = (await request.json()) as Body;

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const cats = categories.length ? categories.join("، ") : "معلومات عامة";
        const avoidList = avoid.slice(-120);

        // Build explicit distribution. If none provided, fall back to all normal.
        const requestedTotal = Math.min(60, Math.max(1, Math.floor(count)));
        const normalizedDist: Record<QuestionType, number> = {
          normal: 0,
          steal: 0,
          speed: 0,
          oral: 0,
        };

        let distSum = 0;
        for (const [type, n] of Object.entries(distribution)) {
          if (VALID_TYPES.includes(type as QuestionType) && typeof n === "number" && n > 0) {
            normalizedDist[type as QuestionType] = Math.max(0, Math.floor(n));
            distSum += normalizedDist[type as QuestionType];
          }
        }

        // If distribution is empty or doesn't sum to anything, make everything normal.
        if (distSum === 0) {
          normalizedDist.normal = requestedTotal;
          distSum = requestedTotal;
        }

        // Clamp to requested total by trimming the largest bucket(s).
        while (distSum > requestedTotal) {
          const largest = (Object.keys(normalizedDist) as QuestionType[]).reduce((a, b) =>
            normalizedDist[a] >= normalizedDist[b] ? a : b,
          );
          normalizedDist[largest]--;
          distSum--;
        }

        const typeEntries = (Object.entries(normalizedDist) as [QuestionType, number][]).filter(
          ([, n]) => n > 0,
        );

        const systemParts = [
          "أنت مولّد أسئلة مسابقات باللغة العربية. أخرج JSON فقط بدون أي شرح.",
          `ولّد ${requestedTotal} سؤال اختيار من متعدد أو سؤال شفوي عن: ${cats}.`,
          "الصيغة: مصفوفة JSON، كل عنصر حسب نوعه:",
          ...typeEntries.map(([type, n]) => `- ${n} سؤال من نوع "${type}": ${buildSchema(type, withImages)}`),
          `اجعل points = ${defaultPoints} افتراضياً. لا تكرر الأسئلة إطلاقاً، واجعل كل سؤال مختلف تماماً في الموضوع والصياغة.`,
          avoidList.length
            ? `ممنوع تماماً توليد أي سؤال مطابق أو مشابه لهذه الأسئلة:\n- ${avoidList.join("\n- ")}`
            : "",
          `تنويع إجباري: استخدم بذرة عشوائية ${Math.random().toString(36).slice(2)} لاختيار مواضيع فرعية مختلفة.`,
        ];

        const system = systemParts.filter(Boolean).join("\n");

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
          if (m && m[1]) {
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

        return new Response(JSON.stringify({ questions: list, distribution: normalizedDist }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
