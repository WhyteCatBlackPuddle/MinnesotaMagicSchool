# Boundary Waters Academy

Small Express/PostgreSQL app for the Boundary Waters Academy project.

Boundary Waters Academy is now being developed as an episodic narrated audio serial, influenced by radio drama, supported by this app as an interactive world bible and creative workbench. See `docs/series-bible.md` for the current creative foundation.

## Project layout

- `api/` Vercel serverless entry point.
- `src/` Express app and shared database client.
- `public/` browser UI assets served by Express.
- `client/` Vite/React source for the integrated 3D Living Map.
- `database/` SQL schema and database-owned files.
- `docs/` creative foundation, series bible notes, and worldbuilding documents.
- `scripts/` local maintenance, seeding, and CLI scripts.

## Common commands

```sh
npm install
npm start
npm run setup
npm run seed
npm run seed:locations
npm run seed:faculty
npm run view
npm run cli
```

The app reads `DATABASE_URL` from `.env` at the project root. For compatibility with older checkouts, `src/db.js` also falls back to `db/.env` if it exists.

## Existing application

The Express application and current browser UI remain the primary app. From the project root:

```sh
npm install
npm start
```

The server listens on port `3456` by default, serves `public/`, and exposes the existing PostgreSQL-backed APIs under `/api`.

## Living Map prototype

The Living Map keeps its React source isolated in `client/`, but is now surfaced through the existing application's **Living Map** tab. It reads academy location descriptions from the existing `/api/locations` endpoint and falls back to local map copy when the API is unavailable.

For local development, run Express and Vite in separate terminals:

```sh
cd client
npm install
npm run dev
```

Vite proxies `/api` calls to Express on port `3456` and serves the map at `http://localhost:5173/living-map/`. To build the integrated map into `public/living-map/` and serve it from Express:

```sh
npm run build:living-map
npm start
```

The three demonstration conditions are controlled JSON-shaped objects in `client/src/scenes/sceneStates.js`. `LivingMap.jsx` interprets their limited time, weather, lighting, activity, and effect vocabulary. Those hardcoded objects can later be replaced by API responses without allowing generated Three.js code.
