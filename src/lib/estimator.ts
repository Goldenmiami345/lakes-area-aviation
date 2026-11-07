// Training-plan estimator. Pure: given the ratings a pilot holds and the ones they want, returns the
// published minimum days and prices, unmet prerequisites, travel costs and a contingency.

export type RatingId = 'ppl' | 'ir' | 'csel' | 'cmel' | 'cfi' | 'cfii' | 'mei';
export type Rating = { id: RatingId; name: string; days: number; price: number; slug: string; requires: RatingId[][] };

// requires: every inner list is "any one of"; all inner lists must be met (FAA 14 CFR part 61).
export const RATINGS: Rating[] = [
  { id: 'ppl', name: 'Private Pilot', days: 21, price: 9600, slug: 'private-pilot', requires: [] },
  { id: 'ir', name: 'Instrument Rating', days: 10, price: 8300, slug: 'instrument-rating', requires: [['ppl']] },
  { id: 'csel', name: 'Commercial Single-Engine', days: 5, price: 4625, slug: 'commercial-single-engine', requires: [['ppl']] },
  { id: 'cmel', name: 'Commercial Multi-Engine', days: 3, price: 5300, slug: 'commercial-multi-engine', requires: [['ppl']] },
  { id: 'cfi', name: 'Flight Instructor (CFI)', days: 7, price: 5125, slug: 'cfi-cfii', requires: [['csel', 'cmel'], ['ir']] },
  { id: 'cfii', name: 'Instrument Instructor (CFII)', days: 5, price: 3150, slug: 'cfi-cfii', requires: [['cfi'], ['ir']] },
  { id: 'mei', name: 'Multi-Engine Instructor (MEI)', days: 3, price: 4475, slug: 'mei', requires: [['cfi'], ['cmel']] },
];
export const byId = (id: RatingId) => RATINGS.find((r) => r.id === id)!;

export const CONTINGENCY = 0.2;
export type Plan = { held: RatingId[]; want: RatingId[]; housing: boolean; car: boolean; housingPerNight: number; carPerDay: number };
export type Estimate = {
  ratings: Rating[];
  days: number;
  training: number;
  housing: number;
  car: number;
  contingency: number;
  total: number;
  missing: { rating: Rating; needs: string[] }[];
};

export function estimate(p: Plan): Estimate {
  const held = new Set(p.held);
  const want = RATINGS.filter((r) => p.want.includes(r.id) && !held.has(r.id));
  const have = new Set<RatingId>([...held, ...want.map((r) => r.id)]);
  const missing = want
    .map((r) => ({ rating: r, needs: r.requires.filter((anyOf) => !anyOf.some((id) => have.has(id))).map((anyOf) => anyOf.map((id) => byId(id).name).join(' or ')) }))
    .filter((m) => m.needs.length > 0);
  const days = want.reduce((s, r) => s + r.days, 0);
  const training = want.reduce((s, r) => s + r.price, 0);
  const housing = p.housing ? days * p.housingPerNight : 0;
  const car = p.housing && p.car ? days * p.carPerDay : 0;
  const contingency = Math.round((training + housing + car) * CONTINGENCY);
  return { ratings: want, days, training, housing, car, contingency, total: training + housing + car + contingency, missing };
}
