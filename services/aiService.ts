import { supabase } from './supabaseClient';

const FUNCTION_NAME = 'ai-proxy';

const callProxy = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body });

  if (error) {
    const context = (error as any).context;
    const parsed = typeof context?.json === 'function' ? await context.json().catch(() => null) : null;
    const code = parsed?.error;
    if (code === 'INSUFFICIENT_CREDITS') throw new Error('INSUFFICIENT_CREDITS');
    if (code === 'UNAUTHORIZED') throw new Error('UNAUTHORIZED');
    throw new Error(parsed?.message || error.message || 'REQUEST_FAILED');
  }

  return data;
};

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const data = await callProxy({ action: 'analyze', imageBase64: base64Image, mimeType });
  return data.analysis as string;
};

export const generateTransformedImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const data = await callProxy({ action: 'generate', imageBase64: base64Image, mimeType, prompt });
  return data.resultImage as string;
};
