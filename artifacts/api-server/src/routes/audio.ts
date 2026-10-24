import { ReplitConnectors } from "@replit/connectors-sdk";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListNarrationVoicesResponse,
  SpeakExplanationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
const voiceCacheMs = 5 * 60 * 1000;
let voiceCache: { expiresAt: number; voices: VoiceRecord[] } | undefined;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

type VoiceRecord = {
  voice_id: string;
  name: string;
  description?: string;
  labels?: Record<string, string>;
};

function fail(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function hasChildFriendlyMetadata(voice: VoiceRecord): boolean {
  const labels = voice.labels ?? {};
  const descriptiveText = [
    voice.name,
    voice.description ?? "",
    ...Object.values(labels),
  ]
    .join(" ")
    .toLowerCase();
  return (
    labels.age?.toLowerCase() === "young" ||
    /\b(child|children|kid|young|gentle|friendly|warm|bright)\b/.test(
      descriptiveText,
    )
  );
}

function configuredVoiceIds(): Set<string> {
  return new Set(
    [process.env.ELEVENLABS_VOICE_ID, process.env.ELEVENLABS_TAMIL_VOICE_ID].filter(
      (id): id is string => Boolean(id?.trim()),
    ),
  );
}

function voiceLanguage(voice: VoiceRecord): "en" | "ta" | "unsupported" {
  if (voice.voice_id === process.env.ELEVENLABS_TAMIL_VOICE_ID) return "ta";
  if (voice.voice_id === process.env.ELEVENLABS_VOICE_ID) return "en";
  const label = voice.labels?.language?.toLowerCase() ?? "";
  if (!label) return "en";
  if (label === "ta" || label.startsWith("ta-") || label.includes("tamil")) return "ta";
  if (label === "en" || label.startsWith("en-") || label.includes("english")) return "en";
  return "unsupported";
}

function supportsLanguage(voice: VoiceRecord, language: "en" | "ta"): boolean {
  return voiceLanguage(voice) === language;
}

type ElevenLabsRequestOptions = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

function requestElevenLabs(
  path: string,
  init?: ElevenLabsRequestOptions,
): Promise<globalThis.Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    return fetch(`https://api.elevenlabs.io${path}`, {
      ...init,
      headers: {
        ...(init?.headers as Record<string, string> | undefined),
        "xi-api-key": apiKey,
      },
    });
  }
  return connectors.proxy("elevenlabs", path, init);
}

async function getVoices(): Promise<VoiceRecord[]> {
  if (voiceCache && voiceCache.expiresAt > Date.now()) {
    return voiceCache.voices;
  }
  const response = await requestElevenLabs("/v1/voices?show_legacy=true", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs voice lookup failed (${response.status})`);
  }
  const payload = (await response.json()) as { voices?: VoiceRecord[] };
  const voices = Array.isArray(payload.voices) ? payload.voices : [];
  voiceCache = { voices, expiresAt: Date.now() + voiceCacheMs };
  return voices;
}

function checkRequestLimit(req: Request): boolean {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt > 60_000) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}

router.get("/audio/voices", async (req, res): Promise<void> => {
  try {
    const voices = await getVoices();
    const configured = configuredVoiceIds();
    const childFriendly = voices.filter(
      (voice) =>
        hasChildFriendlyMetadata(voice) || configured.has(voice.voice_id),
    );
    const response = {
      available: childFriendly.length > 0,
      provider: childFriendly.length > 0 ? "elevenlabs" : "browser_fallback",
      voices: childFriendly.map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        language: voiceLanguage(voice),
        childFriendly: true,
      })),
      message:
        childFriendly.length > 0
          ? "Showing ElevenLabs voices with child-friendly cues in their voice details."
          : "No voice with clear child-friendly details is available. Use a suitable browser voice or readable lesson text.",
    };
    res.json(ListNarrationVoicesResponse.parse(response));
  } catch (error) {
    req.log.warn(
      { err: error instanceof Error ? error.message : "unknown" },
      "ElevenLabs voice lookup unavailable",
    );
    res.json(
      ListNarrationVoicesResponse.parse({
        available: false,
        provider: "browser_fallback",
        voices: [],
        message:
          "ElevenLabs is not reachable right now. Update the existing Replit ElevenLabs connection to enable narration.",
      }),
    );
  }
});

router.post("/audio/speak", async (req, res): Promise<void> => {
  const body = SpeakExplanationBody.safeParse(req.body);
  if (!body.success) {
    fail(res, body.error.message);
    return;
  }
  if (!checkRequestLimit(req)) {
    res.status(429).json({ error: "Please wait a moment before requesting more narration." });
    return;
  }
  try {
    const voices = await getVoices();
    const configured = configuredVoiceIds();
    const childFriendly = voices.filter(
      (voice) =>
        hasChildFriendlyMetadata(voice) || configured.has(voice.voice_id),
    );
    const languageVoices = childFriendly.filter((voice) =>
      supportsLanguage(voice, body.data.language as "en" | "ta"),
    );
    const languageVoiceId =
      body.data.language === "ta"
        ? process.env.ELEVENLABS_TAMIL_VOICE_ID
        : process.env.ELEVENLABS_VOICE_ID;
    const selected =
      languageVoices.find((voice) => voice.voice_id === body.data.voiceId) ??
      languageVoices.find((voice) => voice.voice_id === languageVoiceId) ??
      languageVoices[0];
    if (!selected) {
      res.status(503).json({
        error:
          "No verified child-friendly ElevenLabs voice is available. Use browser speech or read the explanation.",
      });
      return;
    }

    const response = await requestElevenLabs(
      `/v1/text-to-speech/${encodeURIComponent(selected.voice_id)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body.data.text,
          model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.2,
            speed: 0.92,
          },
        }),
      },
    );
    if (!response.ok) {
      req.log.warn(
        { status: response.status },
        "ElevenLabs narration request failed",
      );
      res.status(503).json({
        error: "ElevenLabs could not create this narration. The lesson text is still available.",
      });
      return;
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    req.log.warn(
      { err: error instanceof Error ? error.message : "unknown" },
      "ElevenLabs narration unavailable",
    );
    res.status(503).json({
      error: "ElevenLabs is not reachable. The lesson text is still available.",
    });
  }
});

export default router;
