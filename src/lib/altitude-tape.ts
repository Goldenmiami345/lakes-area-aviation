// Altitude tape for the Zero-to-Hero journey: a PFD-style vertical scale. Pure geometry.

/** Pixels of tape per 1,000 ft. */
export const PX_PER_KFT = 28;

/** Tape translation (px) that puts `alt` at the tape's reference line. */
export const tapeOffset = (alt: number) => (alt / 1000) * PX_PER_KFT;

/** Tick marks from 0 to `max` ft: a major tick every 5,000 ft, minor every 1,000 ft. */
export function ticks(max: number) {
  const out: { alt: number; major: boolean; y: number }[] = [];
  for (let a = 0; a <= max; a += 1000) out.push({ alt: a, major: a % 5000 === 0, y: -(a / 1000) * PX_PER_KFT });
  return out;
}

/** Readout text: thousands in large digits, hundreds small (like a real drum readout). */
export function readout(alt: number) {
  const a = Math.max(0, Math.round(alt / 20) * 20);
  return { thousands: Math.floor(a / 1000).toLocaleString('en-US'), hundreds: String(a % 1000).padStart(3, '0') };
}
