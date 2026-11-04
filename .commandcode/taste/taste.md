# Taste

## Code organization

- Prefers consolidating related code into a single file rather than splitting it across many small files (e.g. a sample/demo feature with types, helpers, and several components all in one file). Confidence: 0.7
- Prefers centralizing shared contracts and helpers (typed event definitions, a typed send wrapper) over inline per-call duplication, and expects the pattern applied consistently across every file — "use wsSend just like in Board.tsx ... to all files where socket.send with stringy is used". Confidence: 0.7
