# Lakes Area Aviation

Website for Lakes Area Aviation, LLC: accelerated flight training at Little Falls, MN (KLXL),
Fort Lupton, CO (18V) and Cottonwood, AZ (P52).

Built with [Astro](https://astro.build) as a static site, with two small serverless routes on Vercel.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm test          # unit tests: scroll engine, traffic pattern rules, estimator, program prices
npm run build     # static pages + Vercel functions in .vercel/output
```

## Deploy (Netlify or Vercel)

Netlify: import the repo; `netlify.toml` sets the build. Add the variables from `.env.example` under Site configuration > Environment variables.

Vercel:

1. Import this repository in Vercel. The Astro preset is detected; no settings to change.
2. Add the environment variables from `.env.example` (Project Settings > Environment Variables).
   Until `RESEND_API_KEY` is set, the form shows a message asking visitors to call 318-347-9004.
3. Point the domain at Vercel when ready.

## Where things live

| Path | What |
| --- | --- |
| `src/data/site.ts` | Phone, airports, navigation, rates, fleet, team, testimonials |
| `src/data/programs.ts` | Every program: days, published price, cost lines, requirements |
| `src/lib/journey-scroll.ts` | The homepage scroll journey: pure geometry, unit-tested |
| `src/lib/pattern.ts` | Traffic-pattern model: runway in use from wind, spacing, one aircraft on final or the runway at a time |
| `src/lib/fields.ts` | Runway geometry for each airport, mapped onto the USGS aerials |
| `src/pages/api/metar.ts` | Live METAR proxy (aviationweather.gov), cached at the edge for five minutes |
| `src/pages/api/lead.ts` | Training-plan form: sends the lead by email through Resend |

## Rules this site keeps

- Photos of aircraft, instruments, people and runways are real and unaltered. Airport aerials are USGS imagery.
- Traffic on the aerials is simulated but follows real pattern rules: runway chosen by headwind, published
  pattern direction, never two aircraft landing at once, no runway incursions.
- Scrolling is native. The page never captures, delays or reverses input; it only finishes a crossfade
  you left halfway, by at most half a crossfade.
- Prices and timelines are the school's published figures.

## Licenses

Andada Pro and Montserrat are under the SIL Open Font License 1.1.
