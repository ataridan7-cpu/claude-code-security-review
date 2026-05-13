import { useState, useCallback, useRef } from 'react';

interface UseClaudeStreamResult {
  text: string;
  isStreaming: boolean;
  error: string | null;
  stream: (generator: AsyncGenerator<string>) => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for consuming an AsyncGenerator<string> from ClaudeService.
 * Each ClaudeService method returns a generator — pass it directly to stream().
 *
 * Example:
 *   const { text, isStreaming, stream } = useClaudeStream();
 *   await stream(ClaudeService.streamDailyInsight(summary, goals, moods));
 */
export function useClaudeStream(): UseClaudeStreamResult {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setText('');
    setError(null);
    setIsStreaming(false);
    abortRef.current = false;
  }, []);

  const stream = useCallback(async (generator: AsyncGenerator<string>) => {
    abortRef.current = false;
    setText('');
    setError(null);
    setIsStreaming(true);

    try {
      for await (const chunk of generator) {
        if (abortRef.current) break;
        setText((prev) => prev + chunk);
      }
    } catch (e: unknown) {
      if (!abortRef.current) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { text, isStreaming, error, stream, reset };
}

/**
 * Tracks streaming into an external setter (useful for Zustand store integration).
 */
export function useClaudeStreamToStore(
  onChunk: (chunk: string) => void,
  onStart: () => void,
  onEnd: () => void
) {
  const stream = useCallback(
    async (generator: AsyncGenerator<string>) => {
      onStart();
      try {
        for await (const chunk of generator) {
          onChunk(chunk);
        }
      } catch {
        // ignore — caller can check store state
      } finally {
        onEnd();
      }
    },
    [onChunk, onStart, onEnd]
  );

  return { stream };
}
