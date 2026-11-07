// Single source of truth for every fact on the site: prices, timelines, fleet, rates, airports.
// Facts come from Lakes Area Aviation's published pages; keep wording here plain and verifiable.

export const SITE = {
  name: 'Lakes Area Aviation',
  legalName: 'Lakes Area Aviation, LLC',
  phone: '318-347-9004',
  phoneHref: 'tel:+13183479004',
  locations: [
    { code: 'KLXL', city: 'Little Falls', state: 'MN', stateName: 'Minnesota', airport: 'Little Falls/Morrison County Airport', street: '13129 Airport Rd', zip: '56345', field: 'KLXL' as const },
    { code: '18V', city: 'Fort Lupton', state: 'CO', stateName: 'Colorado', airport: 'Platte Valley Airpark', street: '7507 Co Rd 39', zip: '80621', field: '18V' as const },
    { code: 'P52', city: 'Cottonwood', state: 'AZ', stateName: 'Arizona', airport: 'Cottonwood Municipal Airport', street: '1001 W Mingus Avenue', zip: '86326', field: 'P52' as const },
  ],
  secondaryNav: [
    { label: 'Locations', href: '/locations' },
    { label: 'Intro flights', href: '/introductory-flights' },
    { label: 'Scenic flights', href: '/scenic-flights' },
    { label: 'New students', href: '/new-students' },
    { label: 'Team', href: '/team' },
  ],
} as const;
export type Location = (typeof SITE.locations)[number];

export const NAV = [
  { label: 'Programs', href: '/programs' },
  { label: 'Services', href: '/services' },
  { label: 'Fleet', href: '/fleet' },
  { label: 'Rates', href: '/rates' },
  { label: 'Students', href: '/students' },
  { label: 'About', href: '/about' },
] as const;

export const FOOTER = [
  { title: 'Training', links: [
    { label: 'All programs', href: '/programs' },
    { label: 'Zero to Hero', href: '/programs/zero-to-hero' },
    { label: 'Accelerated training', href: '/accelerated-training' },
    { label: 'Local training', href: '/local-training' },
    { label: 'Specialized training', href: '/specialized-training' },
  ] },
  { title: 'Fly with us', links: [
    { label: 'Intro flight, $100', href: '/introductory-flights' },
    { label: 'Scenic flights', href: '/scenic-flights' },
    { label: 'Fleet', href: '/fleet' },
    { label: 'Rates', href: '/rates' },
    { label: 'Locations', href: '/locations' },
  ] },
  { title: 'School', links: [
    { label: 'About', href: '/about' },
    { label: 'Team', href: '/team' },
    { label: 'Students', href: '/students' },
    { label: 'Student stories', href: '/student-success' },
    { label: 'Build my training plan', href: '/contact' },
  ] },
] as const;

export const RATES = {
  instruction: [
    { label: 'Primary flight and ground instruction', rate: 60 },
    { label: 'Instrument flight and ground instruction', rate: 60 },
    { label: 'Commercial flight and ground instruction', rate: 60 },
    { label: 'Multi-engine flight and ground instruction', rate: 75 },
    { label: 'Instruction in your own aircraft', rate: 70 },
  ],
  aircraft: [
    { type: 'Cessna 172', names: 'Blue, Robin or Phoenix', regular: 185, prepay: 175 },
    { type: 'Cessna 172I / 172K', names: 'Hawk or Cardinal', regular: 185, prepay: 175 },
    { type: 'Piper Apache PA-23-160', names: 'N4383P', regular: 395, prepay: 375 },
    { type: 'Piper Comanche PA-24-250', names: 'Chief', regular: 265, prepay: 245 },
    { type: 'Cessna 150', names: 'Elliott', regular: 125, prepay: 115 },
    { type: 'Taylorcraft BC-12D', names: 'Tweety', regular: 135, prepay: 125 },
  ],
  other: [
    { label: 'Introductory flight', price: '$100' },
    { label: 'Scenic flight, up to three people', price: '$129 per hour' },
    { label: 'Student housing', price: '$30 per night' },
    { label: 'Student car, for housing residents', price: '$20 per day' },
  ],
  prepayRule: 'The prepay rate applies automatically when your account holds $500 or more at the time of billing.',
  wetNote: 'All aircraft rates are wet: fuel and insurance are included. State tax is additional.',
} as const;

export const TRAVEL = { housingPerNight: 30, carPerDay: 20 } as const;

export const TESTIMONIALS = [
  { quote: 'They helped me complete CFI training and checkride in 10 days, in mid January! I went back up a couple months later and finished CFI-I in a total of 12 days!', name: 'Andrew Cashen', detail: 'Accelerated CFI and CFII' },
  { quote: 'There were plenty of options for housing, transportation, and excellent service. I finished my rating and would highly recommend checking them out!', name: 'Brian Pinkney', detail: 'Private pilot' },
  { quote: 'The instruction is top-quality, delivered by experienced and supportive instructors. The entire staff is warm and welcoming.', name: 'Kevin Bounda', detail: 'Commercial single- and multi-engine' },
] as const;

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

export const TEAM = [
  { name: 'Jacob Heffron', role: 'Owner', ratings: 'CFI, CFII, MEI' },
  { name: 'Justin Buchli', ratings: 'CFI, CFII' },
  { name: 'Mary Trittin', ratings: 'CFI, CFII' },
  { name: 'Ron Kresha', ratings: 'CFI, CFII, MEI' },
  { name: 'Payton Meyer', ratings: 'CFI' },
  { name: 'Layne Bradley', ratings: 'CFI' },
  { name: 'Nate Hawkins', ratings: 'CFI, CFII, MEI' },
  { name: 'Bailey Schommer', ratings: 'CFI, CFII, MEI' },
  { name: 'Austin Bryant', ratings: 'CFI, CFII' },
  { name: 'John Holthaus', ratings: 'Helicopter CFI' },
] as const;

export const FSP_SIGNUP = 'https://app.flightschedulepro.com/Account/Signup/144777';

export const SPECIALIZED = {
  kodiak: { initial: '3 to 4 days', recurrent: '1 to 2 days' },
  endorsements: ['Tailwheel', 'Complex', 'High performance', 'High altitude', 'Spin training'],
  courses: [
    { name: 'Mountain flying', where: 'Fort Lupton' },
    { name: 'Light aerobatics', where: 'Little Falls' },
    { name: 'Ski plane', where: 'Little Falls' },
    { name: 'Cirrus transition', where: 'Little Falls' },
  ],
} as const;

export type Aircraft = { reg: string; name: string; nickname?: string; role: 'Trainer' | 'Twin' | 'Tailwheel'; use: string; regular?: number; prepay?: number; specs: Record<string, string> };
// Fleet as published by the school. Years and equipment from the school's aircraft pages and the FAA registry.
export const FLEET: Aircraft[] = [
  { reg: 'N8570B', name: 'Cessna 172', nickname: 'Phoenix', role: 'Trainer', use: 'Private, instrument and commercial training', regular: 185, prepay: 175, specs: { Year: '1957', Horsepower: '145', Flight: 'IFR', Seats: '4', GPS: 'Garmin 430, G5', Equipment: 'ADS-B out, Mode C transponder' } },
  { reg: 'N4383P', name: 'Piper Apache PA-23-160', role: 'Twin', use: 'Multi-engine training', regular: 395, prepay: 375, specs: { Year: '1960', Engines: '2 × Lycoming O-320', Seats: '4' } },
  { reg: 'N46201', name: 'Cessna 172I', nickname: 'Cardinal', role: 'Trainer', use: 'Private, instrument and commercial training', regular: 185, prepay: 175, specs: { Year: '1968', Horsepower: '150', Engine: 'Lycoming O-320', Seats: '4' } },
  { reg: 'N6717A', name: 'Cessna 172', nickname: 'Blue', role: 'Trainer', use: 'Private, instrument and commercial training', regular: 185, prepay: 175, specs: { Year: '1956', Horsepower: '145', Flight: 'VFR', Seats: '4', GPS: 'GPSMap 496', Equipment: 'ADS-B out, Mode C transponder' } },
  { reg: 'N7108G', name: 'Cessna 172K', nickname: 'Hawk', role: 'Trainer', use: 'Private, instrument and commercial training', regular: 185, prepay: 175, specs: { Year: '1970', Horsepower: '150', Flight: 'IFR', Seats: '4', GPS: 'Garmin 375, G5', Equipment: 'ADS-B out and in, Mode C transponder' } },
  { reg: 'N6641F', name: 'Cessna 150', nickname: 'Elliott', role: 'Trainer', use: 'Primary training and time building', regular: 125, prepay: 115, specs: { Year: '1966', Horsepower: '100', Flight: 'VFR', Seats: '2', GPS: 'GPSMap 496', Equipment: 'Stratus' } },
  { reg: 'N96150', name: 'Taylorcraft BC-12D', nickname: 'Tweety', role: 'Tailwheel', use: 'Tailwheel training', regular: 135, prepay: 125, specs: { Year: '1946', Horsepower: '100', Flight: 'VFR', Seats: '2' } },
  { reg: 'N11059', name: 'Champion 7ECA Citabria', role: 'Tailwheel', use: 'Tailwheel and specialized training', specs: { Year: '1965', Seats: '2' } },
];
