// Training programs as Lakes Area Aviation publishes them. Line items carry hours and rates so the
// arithmetic is checked in programs.test.ts against each published "as low as" figure.

export type LineItem = { label: string; hours?: number; rate?: number; amount: number; note?: string };
export type Course = {
  name: string;
  timeline: string;
  /** Published "as low as" figure. */
  asLowAs: number;
  items: LineItem[];
  requirements: string[];
};
export type Program = {
  slug: string;
  name: string;
  /** What you can do once you hold it, in a few words. */
  outcome: string;
  summary: string;
  photo: string;
  aircraft: string;
  courses: Course[];
  notes: string[];
  steps?: { name: string; cost: string; text: string }[];
};

const hrs = (label: string, hours: number, rate: number): LineItem => ({ label, hours, rate, amount: hours * rate });

export const PROGRAMS: Program[] = [
  {
    slug: 'private-pilot', name: 'Private Pilot', outcome: 'Your first certificate',
    summary: 'The foundation for every rating that follows, flown and studied in one concentrated block.',
    photo: 'runway', aircraft: 'Cessna 172',
    courses: [{
      name: 'Accelerated Private Pilot', timeline: 'As little as 21 days', asLowAs: 9600,
      items: [
        hrs('Cessna 172 rental', 40, 175),
        hrs('Dual flight instruction', 30, 60),
        hrs('One-on-one ground school', 10, 60),
        { label: 'Ground-school course (ASA $129, Sporty’s $200 or King Schools $219)', amount: 129 },
        { label: 'FAA medical, estimate', amount: 100 },
      ],
      requirements: [
        'An FAA medical certificate before your first solo.',
        'The written test passed before the practical test.',
        'The required flight and ground training, signed off by your instructor.',
      ],
    }],
    notes: ['You can start training before your medical and written test are done.', 'Examiner fees are additional. Aircraft rental is subject to tax.'],
  },
  {
    slug: 'instrument-rating', name: 'Instrument Rating', outcome: 'Fly in the clouds',
    summary: 'Learn to fly safely by reference to instruments, with simulator time built into the plan.',
    photo: 'instrument', aircraft: 'Cessna 172',
    courses: [{
      name: 'Accelerated Instrument Rating', timeline: '10 to 14 days', asLowAs: 8300,
      items: [
        { label: 'Course fee', amount: 500 },
        hrs('Cessna 172 rental', 30, 175),
        hrs('Flight instruction', 15, 60),
        hrs('Ground instruction', 10, 60),
        { ...hrs('Simulator, instructor included', 10, 105) },
      ],
      requirements: [
        'A Private Pilot certificate.',
        'The written test done before you arrive, which the school recommends.',
        '40 to 50 hours of total flight time, per the school’s career-path outline.',
      ],
    }],
    notes: ['Examiner fees are additional and can change. Aircraft rental is subject to tax.'],
  },
  {
    slug: 'commercial-single-engine', name: 'Commercial Single-Engine', outcome: 'Get paid to fly',
    summary: 'Bring your flying to commercial standards with concentrated maneuvers, ground work and checkride preparation.',
    photo: 'commercial', aircraft: 'Cessna 172',
    courses: [{
      name: 'Commercial Single-Engine Land', timeline: '5 to 7 days', asLowAs: 4625,
      items: [
        { label: 'Course fee', amount: 500 },
        hrs('Cessna 172 rental', 15, 175),
        hrs('Flight instruction', 15, 60),
        hrs('Ground instruction', 10, 60),
      ],
      requirements: ['The flight-hour totals required for the checkride.', 'The commercial written test passed before the checkride.'],
    }],
    notes: ['This prices the concentrated course itself, not the time-building needed to become eligible.', 'Examiner fees are additional. Aircraft rental is subject to tax.'],
  },
  {
    slug: 'commercial-multi-engine', name: 'Commercial Multi-Engine', outcome: 'Fly twins commercially',
    summary: 'Commercial multi-engine privileges, trained in the school’s Piper Apache.',
    photo: 'apache', aircraft: 'Piper Apache N4383P',
    courses: [{
      name: 'Commercial Multi-Engine Land', timeline: '3 to 4 days', asLowAs: 5300,
      items: [
        { label: 'Course fee', amount: 500 },
        hrs('Piper Apache rental', 10, 375),
        hrs('Multi-engine instruction', 10, 75),
        hrs('Ground school', 4, 75),
      ],
      requirements: ['Training is scheduled in two-hour blocks.', 'Each two-hour block has a 1.6-hour instructor minimum; unused flight time can go to ground school.'],
    }],
    notes: ['Examiner fees are additional. Aircraft rental is subject to tax.'],
  },
  {
    slug: 'cfi-cfii', name: 'CFI and CFII', outcome: 'Teach, and build hours',
    summary: 'Earn your flight-instructor certificate, add instrument-instructor privileges, or do both back to back.',
    photo: 'instructor', aircraft: 'Cessna 172',
    courses: [
      {
        name: 'Certified Flight Instructor (CFI)', timeline: '7 to 10 days', asLowAs: 5125,
        items: [
          { label: 'Course fee', amount: 1000 },
          hrs('Ground instruction', 10, 60),
          hrs('Cessna 172 rental', 15, 175),
          hrs('Flight instruction', 15, 60),
        ],
        requirements: ['Lessons are planned in two-hour blocks.', 'Arrive ready for concentrated ground, flight, oral and checkride preparation.'],
      },
      {
        name: 'Instrument Instructor add-on (CFII)', timeline: '5 to 7 days', asLowAs: 3150,
        items: [
          { label: 'Course fee', amount: 500 },
          hrs('Cessna 172 rental', 10, 175),
          hrs('Flight instruction', 10, 60),
          hrs('Ground instruction', 5, 60),
        ],
        requirements: ['Built as an add-on to your flight-instructor certificate.', 'Concentrated ground, flight, oral and checkride preparation.'],
      },
    ],
    notes: ['Each checkride is about a one-hour oral and a one-hour flight.', 'Andrew Cashen finished his CFI training and checkride in 10 days, then CFII in 12. Individual timelines vary.', 'Examiner fees are additional. Aircraft rental is subject to tax.'],
  },
  {
    slug: 'mei', name: 'Multi-Engine Instructor', outcome: 'Teach in twins',
    summary: 'Add multi-engine instructor privileges in the Piper Apache in a short, concentrated course.',
    photo: 'apache', aircraft: 'Piper Apache N4383P',
    courses: [{
      name: 'Multi-Engine Instructor (MEI)', timeline: '3 to 4 days', asLowAs: 4475,
      items: [
        { label: 'Course fee', amount: 500 },
        hrs('Piper Apache rental', 8, 375),
        hrs('Flight instruction', 8, 75),
        hrs('Ground instruction', 4, 75),
      ],
      requirements: ['15 hours of pilot-in-command time in multi-engine airplanes.'],
    }],
    notes: ['Examiner fees are additional. Aircraft rental is subject to tax.'],
  },
  {
    slug: 'zero-to-hero', name: 'Zero to Hero', outcome: 'No experience to professional pilot',
    summary: 'The full path the school publishes, from your first lesson to the airline flight deck.',
    photo: 'airline', aircraft: 'Cessna 172 and Piper Apache',
    courses: [{
      name: 'Complete career path', timeline: 'Built around your starting point', asLowAs: 40000,
      items: [
        { label: 'Private Pilot', amount: 10000 },
        { label: 'Instrument Rating', amount: 9000 },
        { label: 'Time and experience building', amount: 9600 },
        { label: 'Commercial Pilot', amount: 5000 },
        { label: 'Flight Instructor', amount: 5000 },
        { label: 'Airline Transport Pilot', amount: 0, note: 'Employer-paid' },
      ],
      requirements: ['Order and cost change with your experience, pace and any added ratings.', 'Most pilots need 1,500 total hours before the Airline Transport Pilot stage.'],
    }],
    steps: [
      { name: 'Private Pilot', cost: 'About $10,000', text: 'Student-pilot paperwork, medical, written test, flight and ground training, instructor sign-off and the practical exam.' },
      { name: 'Instrument Rating', cost: 'About $9,000', text: 'Starts after your private certificate: the written test and the required instrument flight experience.' },
      { name: 'Time building', cost: 'About $9,600', text: 'Build experience toward commercial eligibility. Sharing eligible flight time with another pilot keeps the cost down.' },
      { name: 'Commercial Pilot', cost: 'About $5,000', text: 'Roughly 10 to 20 hours of focused flight training, plus the written and practical tests.' },
      { name: 'Flight Instructor', cost: 'About $5,000', text: 'Learn to teach, and use instructing to build professional flight time.' },
      { name: 'Airline Transport Pilot', cost: 'Employer-paid', text: 'The final stage, once you have built the required professional experience.' },
    ],
    notes: ['The school says to expect close to $40,000 for flight training, ground training, checkrides and related costs.', 'These are planning estimates, not fixed prices.'],
  },
];

export const programBySlug = (slug: string) => PROGRAMS.find((p) => p.slug === slug);
export const itemsTotal = (c: Course) => c.items.reduce((s, i) => s + i.amount, 0);
