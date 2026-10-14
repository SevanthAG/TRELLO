# Board Socket.IO service

The Socket.IO service authenticates connections with the same JWT as the API and authorizes board room membership against the database. Board operations use persisted data; clients do not supply an identity.

## Board events

| Request          | Successful room broadcast | Policy                                                                                                                             |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `issue:move`     | `issue:moved`             | A member can move an issue only between sections on the issue's existing board. The expected source section is checked atomically. |
| `issue:delete`   | `issue:deleted`           | A member can delete an issue on a board they belong to.                                                                            |
| `section:delete` | `section:deleted`         | Only an organization admin can delete a section, and only when it has no issues. Issues are never cascade-deleted.                 |

Mutation requests require an acknowledgement callback. Successful database writes are broadcast to the board room and acknowledged with the persisted result. Rejected operations are returned in the acknowledgement and are not broadcast.

## Run locally

Install dependencies:

```bash
bun install
```

Run:

```bash
bun run dev
```
