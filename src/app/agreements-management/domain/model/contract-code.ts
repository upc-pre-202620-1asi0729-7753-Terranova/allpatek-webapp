/**
 * Short label for a contract. The stored id stays the same; this is only what people see.
 */
export function contractCode(
  agreement: { id: string; createdAt: string },
  agreements: readonly { id: string; createdAt: string }[],
): string {
  const ordered = [...agreements].sort(
    (left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  );
  const index = ordered.findIndex((item) => item.id === agreement.id);
  const year = /^\d{4}/.test(agreement.createdAt) ? agreement.createdAt.slice(0, 4) : String(new Date().getFullYear());
  const number = String((index >= 0 ? index : ordered.length) + 1).padStart(4, '0');
  return `CTR-${year}-${number}`;
}
