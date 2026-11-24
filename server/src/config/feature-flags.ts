// ============================================================
// UNO ULTRA Server — Feature Flags (D2: Gemini off by default)
// ============================================================

function parseBoolFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export interface FeatureFlags {
  readonly ENABLE_GEMINI_BOTS: boolean;
  readonly GEMINI_API_KEY: string;
  readonly GEMINI_MODEL: string;
  readonly GEMINI_TIMEOUT_MS: number;
  readonly ENABLE_UDP_TELEMETRY: boolean;
  readonly ENABLE_VOICE_RELAY: boolean;
  readonly ENABLE_TOURNAMENTS: boolean;
  readonly ENABLE_CUSTOM_RULES: boolean;
}

export function getFeatureFlags(envSource: NodeJS.ProcessEnv = process.env): FeatureFlags {
  return {
    ENABLE_GEMINI_BOTS: parseBoolFlag(envSource['ENABLE_GEMINI_BOTS'], false),
    GEMINI_API_KEY: envSource['GEMINI_API_KEY'] ?? '',
    GEMINI_MODEL: envSource['GEMINI_MODEL'] ?? 'gemini-2.5-flash',
    GEMINI_TIMEOUT_MS: Number(envSource['GEMINI_TIMEOUT_MS'] ?? 1500),
    ENABLE_UDP_TELEMETRY: parseBoolFlag(envSource['ENABLE_UDP_TELEMETRY'], true),
    ENABLE_VOICE_RELAY: parseBoolFlag(envSource['ENABLE_VOICE_RELAY'], true),
    ENABLE_TOURNAMENTS: parseBoolFlag(envSource['ENABLE_TOURNAMENTS'], true),
    ENABLE_CUSTOM_RULES: parseBoolFlag(envSource['ENABLE_CUSTOM_RULES'], true),
  };
}

export const featureFlags = getFeatureFlags();
