const GRADIENTS = [
  "linear-gradient(135deg, #117a8b, #0a4552)",
  "linear-gradient(135deg, #ffb238, #e8483a)",
  "linear-gradient(135deg, #7bc8a4, #117a8b)",
  "linear-gradient(135deg, #9ed8f0, #1b3a6b)",
  "linear-gradient(135deg, #f7a072, #7a3e65)",
];

// The same destination name always maps to the same gradient
export function gradientFor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysBetween(startIso: string, endIso: string): number {
  const ms =
    new Date(endIso + "T00:00:00").getTime() -
    new Date(startIso + "T00:00:00").getTime();
  return Math.round(ms / 86400000) + 1;
}