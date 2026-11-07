import type { Field } from './pattern';

// Runway ends: FAA NASR end coordinates projected (Web Mercator) into each 1500 px USGS NAIP aerial,
// which is centred on the runway midpoint. Pattern offsets are sized to stay inside the aerial.
const ftPerPx = (a: { x: number; y: number }, b: { x: number; y: number }, runwayFt: number) => runwayFt / Math.hypot(b.x - a.x, b.y - a.y);
const field = (f: Omit<Field, 'downwindFt' | 'extensionFt'> & { downwindPx: number; extensionPx: number }): Field => {
  const k = ftPerPx(f.a, f.b, f.runwayFt);
  const { downwindPx, extensionPx, ...rest } = f;
  return { ...rest, downwindFt: downwindPx * k, extensionFt: extensionPx * k };
};

export const FIELDS = {
  KLXL: field({
    ident: 'KLXL', name: 'Little Falls', elevationFt: 1123, tpaAglFt: 1000, runwayFt: 4010,
    ends: [{ name: '13', trueHeading: 131, side: 'left' }, { name: '31', trueHeading: 311, side: 'left' }], calmRunway: '13',
    a: { x: 595, y: 617 }, b: { x: 905, y: 883 }, downwindPx: 126, extensionPx: 65,
    aircraft: ['N4383P', 'N8570B', 'N46201'], wxStation: 'KLXL',
  }),
  '18V': field({
    ident: '18V', name: 'Fort Lupton', elevationFt: 4965, tpaAglFt: 1000, runwayFt: 4100,
    ends: [{ name: '15', trueHeading: 165, side: 'left' }, { name: '33', trueHeading: 345, side: 'left' }], calmRunway: '15',
    a: { x: 687, y: 506 }, b: { x: 813, y: 994 }, downwindPx: 202, extensionPx: 101,
    aircraft: ['N7108G', 'N6641F', 'N11059'], wxStation: 'KDEN',
  }),
  P52: field({
    ident: 'P52', name: 'Cottonwood', elevationFt: 3560, tpaAglFt: 800, runwayFt: 4250,
    ends: [{ name: '14', trueHeading: 156, side: 'left' }, { name: '32', trueHeading: 336, side: 'right' }], calmRunway: '32',
    a: { x: 650, y: 529 }, b: { x: 850, y: 971 }, downwindPx: 166, extensionPx: 83,
    aircraft: ['N8570B', 'N11059', 'N6717A'], wxStation: 'KSEZ',
  }),
} as const satisfies Record<string, Field>;
export type FieldId = keyof typeof FIELDS;
