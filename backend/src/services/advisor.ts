import { GoogleGenerativeAI } from '@google/generative-ai';

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Copy .env.example to .env.');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export interface AdvisorRequest {
  scenarioType: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  question: string;
}

/**
 * The advisor is deliberately NOT allowed to compute anything. It is
 * only ever given the pre-computed input/result from our own
 * calculation engine and instructed to reason over those numbers in
 * plain language. This is the core architecture decision from Phase 1:
 * math happens in one place (calculations.ts), and the AI only
 * explains what that engine already produced.
 *
 * Uses Google's Gemini API (free tier, no billing required) rather
 * than a paid API — a deliberate choice for a portfolio project where
 * demo traffic shouldn't cost real money.
 */
const SYSTEM_PROMPT = `You are the AI advisor inside Vriddhi, a personal finance
planning tool. You help users understand a financial scenario they've
already calculated using Vriddhi's own calculation engine.

STRICT RULES — follow these exactly:
1. You are given the exact inputs and the exact computed results for
   the user's scenario. Treat these numbers as ground truth. Do not
   recompute, re-derive, second-guess, or "sanity check" them with
   your own math. Reference them directly.
2. If the user asks you to change an input and tell them the new
   result, explain that they should adjust the slider/field in the
   calculator to see the updated numbers live, rather than estimating
   a new figure yourself.
3. Never invent numbers that are not present in the provided data.
4. Keep answers short — 2 to 4 sentences. This is a compact advisor
   panel, not a long-form chat.
5. Use a warm, plain-language tone. Avoid jargon; when you must use a
   financial term, briefly explain it in context.
6. If the question is unrelated to this financial scenario, gently
   redirect to what you can help with here.
7. You are not a licensed financial advisor. For anything resembling
   personalized investment or legal advice, note that briefly and
   suggest consulting a professional, without being preachy about it.`;

export async function askAdvisor(req: AdvisorRequest): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
    systemInstruction: SYSTEM_PROMPT,
  });

  const contextBlock = JSON.stringify(
    { scenarioType: req.scenarioType, input: req.input, result: req.result },
    null,
    2,
  );

  const prompt = `Here is the user's current scenario (already computed by Vriddhi's calculation engine — do not recompute):\n\n${contextBlock}\n\nUser's question: ${req.question}`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();

  return text || "I couldn't come up with an answer for that. Try rephrasing your question.";
}
