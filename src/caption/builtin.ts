// Chrome's built-in Prompt API (Gemini Nano) when the browser ships it.
// Nothing leaves the device; when it is absent the templates are the answer.
interface LanguageModelSession { prompt(input: string): Promise<string>; destroy?: () => void }
interface LanguageModelStatic {
  availability?: () => Promise<string>;
  create: (opts?: Record<string, unknown>) => Promise<LanguageModelSession>;
}

function api(): LanguageModelStatic | null {
  const g = globalThis as { LanguageModel?: LanguageModelStatic };
  return g.LanguageModel && typeof g.LanguageModel.create === 'function' ? g.LanguageModel : null;
}

export function hasBuiltinModel(): boolean {
  return api() !== null;
}

export async function tryBuiltinModel(prompt: string, timeoutMs: number): Promise<string | null> {
  const lm = api();
  if (!lm) return null;
  let session: LanguageModelSession | undefined;
  const work = (async () => {
    if (lm.availability) {
      const a = await lm.availability();
      if (a !== 'available' && a !== 'readily') return null;
    }
    session = await lm.create();
    const text = await session.prompt(prompt);
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  })();
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  try {
    return await Promise.race([work, timeout]);
  } catch {
    return null;
  } finally {
    session?.destroy?.();
  }
}
