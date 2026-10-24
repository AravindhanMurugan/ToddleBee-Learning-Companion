import type { Language } from "./toddlebee-content";

const AGENTICORG_BASE_URL = "https://agenticorg.hackathon.pinelabs.com";
const AGENTICORG_AGENT_ID = "cc4b8af0-e16d-49f9-ac5d-a08a937f5fb3";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_EXPLANATION_LENGTH = 1_200;

type AgenticOrgFailure = {
  ok: false;
  reason: "missing_api_key" | "http_error" | "invalid_response" | "request_error";
  status?: number;
};

type AgenticOrgSuccess = {
  ok: true;
  explanation: string;
};

type AgenticOrgResult = AgenticOrgFailure | AgenticOrgSuccess;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textFromOutput(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return null;

  for (const key of [
    "explanation",
    "text",
    "answer",
    "content",
    "raw_output",
  ]) {
    if (typeof value[key] === "string") return value[key];
  }
  return null;
}

const sectionTopics: Record<string, string> = {
  "fraction-whole": "fractions as equal parts of one whole",
  "pizza-fourths": "one fourth as one of four equal pieces",
  "numerator-denominator": "what the numerator and denominator mean",
  "equivalent-fractions": "why one half and two fourths are equal",
  "everyday-challenge": "sharing equal parts and recognizing two fourths as one half",
};

export async function requestAgenticOrgExplanation(input: {
  language: Language;
  sectionId: string;
  referenceExplanation: string;
}): Promise<AgenticOrgResult> {
  const apiKey = process.env.AGENTICORG_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "missing_api_key" };

  const languageName = input.language === "ta" ? "Tamil" : "English";
  const topic = sectionTopics[input.sectionId];
  if (!topic) return { ok: false, reason: "invalid_response" };

  const task = [
    "Write an alternative explanation for a Grade 4 fractions lesson for a child aged 8–12.",
    `Explain only this topic: ${topic}.`,
    `Write in ${languageName}. Use 2–4 short, accurate sentences and a warm, encouraging tone.`,
    "Keep it focused on mathematics. Do not ask for or include personal information, links, or unrelated topics.",
    `Reference explanation: ${input.referenceExplanation}`,
  ].join("\n");

  try {
    const response = await fetch(
      `${AGENTICORG_BASE_URL}/api/v1/agents/${AGENTICORG_AGENT_ID}/run`,
      {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "process",
          inputs: { task },
          context: {},
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      return { ok: false, reason: "http_error", status: response.status };
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload)) return { ok: false, reason: "invalid_response" };

    const status =
      typeof payload.status === "string" ? payload.status.toLowerCase() : "";
    if (["failed", "error", "cancelled", "canceled", "rejected"].includes(status)) {
      return { ok: false, reason: "invalid_response" };
    }

    const rawExplanation =
      textFromOutput(payload.explanation) ?? textFromOutput(payload.output);
    if (!rawExplanation) return { ok: false, reason: "invalid_response" };

    const explanation = rawExplanation
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!explanation || explanation.length > MAX_EXPLANATION_LENGTH) {
      return { ok: false, reason: "invalid_response" };
    }

    return { ok: true, explanation };
  } catch {
    return { ok: false, reason: "request_error" };
  }
}
