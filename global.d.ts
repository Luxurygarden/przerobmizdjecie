/**
 * The AI Studio host injects this object when the app runs inside its sandbox.
 * It is absent everywhere else, so every access must be guarded.
 */
interface AiStudioBridge {
  hasSelectedApiKey?: () => Promise<boolean>;
  openSelectKey?: () => Promise<void>;
}

interface Window {
  aistudio?: AiStudioBridge;
}
