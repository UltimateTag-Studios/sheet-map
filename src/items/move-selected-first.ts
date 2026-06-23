/** Puts the selected list item first; leaves order unchanged when nothing is selected. */
export function moveSelectedFirst<T>(
  items: readonly T[],
  selectedId: string | null | undefined,
  getId: (item: T) => string,
): T[] {
  if (!selectedId) {
    return [...items];
  }

  const selected: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    if (getId(item) === selectedId) {
      selected.push(item);
    } else {
      rest.push(item);
    }
  }

  return [...selected, ...rest];
}
