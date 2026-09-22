/** First token for greetings — skips leading filler like "Portal" in legacy contact names. */
export function welcomeFirstName(fullName) {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'there';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const skip = new Set(['portal', 'customer', 'user', 'test', 'audit']);
  if (skip.has(parts[0].toLowerCase()) && parts.length > 1) return parts[1];
  return parts[0];
}
