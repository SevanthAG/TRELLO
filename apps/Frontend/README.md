# Blockboard frontend

The frontend is a React 19, TypeScript, and Vite application. It uses React Router for client-side routes, Axios for the Express API, and Socket.IO for board sections and issue updates.

## Run locally

Start each service in its own terminal:

```sh
cd apps/Backend
bun run dev
```

```sh
cd apps/socket
bun run dev
```

```sh
cd apps/Frontend
bun run dev
```

The frontend defaults to `http://localhost:3000/api` for HTTP requests and `http://localhost:8080` for Socket.IO. Override either endpoint with `VITE_API_URL` (including the `/api` prefix) or `VITE_SOCKET_URL` in the frontend environment when needed.

## Existing product scope

Sign-up and sign-in use the backend's `/api/auth` routes. Authenticated workspace screens use the existing organization, membership, and board endpoints. Sections and issues load and update through the socket service. Issues can be moved within their board, and issue/empty-section deletion is synchronized through Socket.IO. Section deletion is admin-only and requires the section to be empty; existing issues must be moved or deleted first. The backend does not expose issue statuses or member removal, so the interface does not offer those actions.

## Checks

```sh
bun run build
bun run lint
```
