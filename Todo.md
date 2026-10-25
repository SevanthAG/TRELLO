# TRELLO — Realtime (WebSocket) Build Plan

> START HERE → Phase 0. Do the phases in order. Don't move on until that phase's
> "Checkpoint" passes.

## Decisions (locked)

- Library: **pure `ws`** (not socket.io) — to learn the mechanics.
- Runs **inside `apps/Backend`** (same process, same port 3000). No second app, no Redis.
- **HTTP stays the write path.** Sockets only push notifications out.
  (Frontend still calls the normal API to create/update; WebSocket just tells other tabs.)

## Event contract (write this down before any code)

- Message shape: `{ type, boardId, payload }`
- Event types: `section:created`, `section:updated`, `issue:created`, `issue:updated`
- Both frontend and backend must agree on these exact strings.

---

## Phase 0 — Prep

- [ ] Delete the empty `apps/WebSocket` folder (not used anymore).
- [ ] In `apps/Backend`: add `ws` dependency + `@types/ws` (dev).
- [ ] Put the event contract types in one shared file so both sides import the same shape.
- [ ] **Checkpoint:** dependencies installed, `ws` importable.

## Phase 1 — Attach `ws` to the existing server

- [ ] `src/index.ts`: keep the server object that `app.listen(...)` returns (right now it's thrown away).
- [ ] Create `src/websock



et.ts` that takes that server and attaches `ws` to it.
- [ ] Call it from `index.ts` after the server starts listening.
- **Direction:** browser → server (connect only). No frontend calls yet.
- **Checkpoint:** a raw socket can connect (browser console / `wscat`) and the server logs it.

## Phase 2 — Auth at the upgrade (BEFORE accepting the socket)

- [ ] In the connection handler, read the token from the **query string** (`?token=...`) — headers can't be set by the browser socket API.
- [ ] Verify the JWT → get `userId`.
- [ ] Check that `userId` is a **member of that board's org** (reuse your membership logic).
- [ ] Reject the handshake (401) if either check fails. Never accept first, check later.
- **Direction:** frontend sends `boardId` + `token` when it connects, e.g. connect to `?boardId=<id>&token=<JWT>`.
- **Checkpoint:** missing/bad token → refused. Valid + member → accepted.

## Phase 3 — Rooms (one room per board)

- [ ] Keep an in-memory `Map<boardId, Set<socket>>`.
- [ ] On connect → add the socket to that board's set.
- [ ] On `close` → remove the socket (forget this and you leak dead sockets).
- [ ] On incoming `message` → parse the raw string yourself (`ws` gives you a string/Buffer, not JSON).
- **Direction:** frontend joins a room implicitly by connecting with its `boardId`.
- **Checkpoint:** two tabs on the same board land in the same room; closing one removes it.

## Phase 4 — Broadcast + hook into the HTTP routes

- [ ] Write one helper `broadcast(boardId, event)` → loop the room, check `readyState === OPEN`, then `send`.
- [ ] `section.route.ts`: after a successful `prisma.section.create` → `broadcast` `section:created`.
- [ ] `section.route.ts` PATCH: after update → `broadcast` `section:updated`.
- [ ] `issue.route.ts`: after create / update → `broadcast` `issue:created` / `issue:updated`.
- **Direction:** frontend → backend stays on **HTTP** (unchanged). Backend → frontend goes over the **socket**.
- **Checkpoint:** create a section in tab A → tab B sees it without refreshing.

## Phase 5 — Frontend wiring (`Board.tsx`)

- [ ] On mount: open the socket with `boardId` + `token`; store it in a `useRef`.
- [ ] On unmount: close the socket (cleanup in the effect).
- [ ] On message: `switch` on `type`, update the matching `section` / `issue` state.
- [ ] Echo guard: ignore events you caused (tag the sender, or skip the sender on the server).
- [ ] Reconnect: when the socket reopens, re-fetch the board over HTTP (you missed events).
- [ ] Move the WS URL to a `VITE_WS_URL` env var.
- **Checkpoint:** two tabs stay in sync for create + update, with **no duplicates**.

---

## Traps to remember

- Authorize during the handshake, not after it.
- Always remove the socket from its room on `close`.
- The sender receives its own broadcast → duplicates, because you already add locally after the HTTP response.
- Check `readyState` before every `send`.
- Reconnect = missed events = stale state → always re-fetch.

## After realtime works (later, not now)

- Heartbeat: ping/pong interval to drop silently-dead sockets.
- Presence: "who's viewing this board" — same room mechanism.
- Scaling note: in-memory rooms only work for ONE backend process. Multiple instances → need Redis. Defer.
