/**
 * Global counter for generating unique ref IDs across all ref types.
 * @internal
 */
let nextRefId = 1;

/**
 * Generates the next unique ref ID.
 * @internal
 */
export function getNextRefId(): number {
	return nextRefId++;
}
