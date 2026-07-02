const MAX_RETRIES = 5;

export async function withBackoff<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('429') ||
        message.includes('Too Many') ||
        message.includes('fetch failed') ||
        message.includes('ECONNRESET');
      if (!retryable || attempt >= MAX_RETRIES) throw error;
      const delayMs = 1_000 * 2 ** attempt;
      console.warn(`${label}: transient failure, retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
