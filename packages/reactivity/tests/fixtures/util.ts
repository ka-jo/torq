export function flushMicrotasks(): Promise<void> {
	// Wait for the next event loop tick to ensure all microtasks have been flushed
	return new Promise((resolve) => setTimeout(resolve, 0));
}
