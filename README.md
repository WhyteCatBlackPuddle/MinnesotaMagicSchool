# Boundary Waters Academy

Small Express/PostgreSQL app for the Boundary Waters Academy project.

## Project layout

- `api/` Vercel serverless entry point.
- `src/` Express app and shared database client.
- `public/` browser UI assets served by Express.
- `database/` SQL schema and database-owned files.
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
