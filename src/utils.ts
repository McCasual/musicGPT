const durationRegex = /^(\d+)([smhd])$/;

const unitToMs: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMs(input: string): number {
  const match = durationRegex.exec(input.trim());
  if (!match) {
    throw new Error(
      `Invalid duration value "${input}". Expected format like 10m, 7d, 30s, 1h.`,
    );
  }

  const value = Number(match[1]);
  const unit = match[2];
  return value * unitToMs[unit];
}
