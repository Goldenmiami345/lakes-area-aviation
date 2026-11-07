// Every photo on the site. All are real Lakes Area Aviation photos or public-domain USGS aerials;
// nothing here is AI-altered except where noted (phone crops extend real photos with fill at the edges).
import type { ImageMetadata } from 'astro';
import hero from '../assets/photos/hero-ramp.webp';
import heroTall from '../assets/photos/hero-ramp-tall.webp';
import clouds from '../assets/photos/clouds.webp';
import cloudsPhone from '../assets/photos/clouds-phone.webp';
import runway from '../assets/photos/runway.webp';
import runwayPhone from '../assets/photos/runway-phone.webp';
import instrument from '../assets/photos/instrument.webp';
import instrumentPhone from '../assets/photos/instrument-phone.webp';
import commercial from '../assets/photos/commercial.webp';
import commercialPhone from '../assets/photos/commercial-phone.webp';
import instructor from '../assets/photos/instructor.webp';
import instructorPhone from '../assets/photos/instructor-phone.webp';
import airline from '../assets/photos/airline.webp';
import apache from '../assets/photos/apache.webp';
import klxl from '../assets/aerials/klxl.webp';
import klxlPhone from '../assets/aerials/klxl-phone.webp';
import fl from '../assets/aerials/18v.webp';
import flPhone from '../assets/aerials/18v-phone.webp';
import cw from '../assets/aerials/p52.webp';
import cwPhone from '../assets/aerials/p52-phone.webp';

export const PHOTOS = {
  hero: { src: hero, alt: 'Lakes Area Aviation Cessna N6717A and Piper Apache on the ramp at sunset' },
  heroTall: { src: heroTall, alt: 'Lakes Area Aviation Cessna N6717A and Piper Apache on the ramp at sunset' },
  clouds: { src: clouds, phone: cloudsPhone, alt: 'Sunrise over a sea of clouds, seen past a high wing' },
  runway: { src: runway, phone: runwayPhone, alt: 'Little Falls airport from the air: runway 13/31 crossing runway 18/36' },
  instrument: { src: instrument, phone: instrumentPhone, alt: 'A Lakes Area Aviation instrument panel in cloud' },
  commercial: { src: commercial, phone: commercialPhone, alt: 'Lakes Area Aviation airplanes on the ramp at sunset' },
  instructor: { src: instructor, phone: instructorPhone, alt: 'An instructor and student inspecting a training airplane before a flight' },
  airline: { src: airline, alt: 'An airline flight deck at night on final approach over city lights' },
  apache: { src: apache, alt: 'Lakes Area Aviation Piper Apache N4383P on the ramp' },
} as const satisfies Record<string, { src: ImageMetadata; phone?: ImageMetadata; alt: string }>;
export type PhotoKey = keyof typeof PHOTOS;

export const AERIALS = {
  KLXL: { src: klxl, phone: klxlPhone, alt: 'USGS aerial of Little Falls/Morrison County Airport with runways 13/31 and 18/36' },
  '18V': { src: fl, phone: flPhone, alt: 'USGS aerial of Platte Valley Airpark, its runway, hangars and the surrounding farm fields' },
  P52: { src: cw, phone: cwPhone, alt: 'USGS aerial of Cottonwood Municipal Airport, runway 14/32 and the Verde Valley' },
} as const;
