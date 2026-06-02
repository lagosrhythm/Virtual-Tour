# Lagos Rhythm

An immersive virtual tour platform for exploring Lagos, Nigeria through live guided experiences, recommended tours, and request-driven programming.

## Features

- Live tour page with offline and active broadcast states.
- WebSocket-backed live status and viewer count updates at `/api/live`.
- API-backed recommended tours at `/api/recommended-tours`.
- Request-a-tour and newsletter submission endpoints.
- Searchable catalog of virtual Lagos experiences.
- Responsive React and Tailwind CSS interface.

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS 4
- Vite
- Express
- Motion
- Lucide React

## Project Structure

```text
src/
  components/          Reusable UI components
  data/                Shared seed data used by client and server
  hooks/               Client state and API hooks
  lib/                 API client and utility helpers
  constants.ts         Catalog and chat data
  types.ts             Shared TypeScript types
server.ts             Express API, static server, and WebSocket gateway
```

## Development

```bash
npm install
npm run dev
```

To run the local API/static server directly during integration work:

```bash
npm run dev:api
```

The Vite dev server also provides lightweight `/api/*` middleware for local UI work, so `npm run dev` can load recommended tours and submit forms without returning the HTML app shell.

## Production

```bash
npm run build
npm run start
```

The production build creates:

- `dist/` for the client app.
- `server.js` for the Express API and static server.

## Environment

Copy `.env.example` and configure the live tour settings for your deployment.

Key settings:

- `PORT`: production server port.
- `LIVE_TOUR_ACTIVE`: set to `true` when a tour is broadcasting.
- `LIVE_TOUR_VIEWERS`: baseline viewer count.
- `LIVE_TOUR_TITLE`, `LIVE_TOUR_DESCRIPTION`, `LIVE_TOUR_HOST`: active tour metadata.
- `VITE_TOUR_STATUS_WS_URL`: optional external WebSocket gateway. If omitted, the frontend uses `/api/live`.

## API

- `GET /api/health`
- `GET /api/recommended-tours`
- `GET /api/tour-status`
- `POST /api/tour-requests`
- `POST /api/newsletter`
- `WS /api/live`

Request bodies:

```json
{ "destination": "Food markets", "email": "you@example.com" }
```

```json
{ "email": "you@example.com" }
```

## License

Apache-2.0
