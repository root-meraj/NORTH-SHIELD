# Northshield

Terrain intelligence and safe routing for India's North Eastern Region.

Predicts where a corridor will fail — landslide, flood, washout — then moves
drivers and supply convoys off it before it does. Built for the MDoNER problem
statement at Smart India Hackathon.

## Judges' quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and press **Watch the 60-second demo**.
It drives itself. Press Escape to stop.

## What it does

| | |
|---|---|
| `/` | Live operations picture: open incidents, ranked corridors, convoys in transit |
| `/map` | Plan a route. See the shortest one, see the recommended one, see the terrain profile with the exposed sections marked |
| `/report` | Photograph a blockage. The model classifies it, the phone supplies the position, drivers within 30 km are warned |
| `/predictions` | Drive the risk model by hand. Set rainfall and slope saturation, watch corridor scores move |
| `/sos` | Hold two seconds. Position goes to the nearest team, over satellite if the tower is down |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Leaflet ·
Zustand · Recharts · Geist + Bricolage Grotesque

## Connecting the model

The app runs entirely on mock data by default so a demo can never fail on a
network. To go live, set `NEXT_PUBLIC_API_URL` in `.env.local` and point it at
the model server. Every call lives in `lib/api.ts` — nothing else in the app
calls `fetch`. Endpoint shapes are in `lib/types.ts`.

## Design notes

The palette is drawn from geological survey sheets: wet slate ground, contour
lines in muted jade, and signal orange — the colour of survey markers and
hazard tape — used exactly once per view for the action that matters.

Two elements carry the identity: the contour field behind the hero, and the
elevation strip on the map. Danger in the North East is not a dot on a flat
map; it is a slope at an altitude, and the interface says so.

## Scripts

```bash
npm run dev        # development
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```
