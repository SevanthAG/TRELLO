# TRELLO Board Application - Todo Roadmap

> Stack: Turborepo + Bun | Backend: Express 5 + Prisma 7 + Postgres | Frontend: Vite + React 19 + Tailwind 4 + shadcn

## ✅ Already Done
- [x] Signup / Signin (bcrypt + JWT 7d, localStorage token)
- [x] Create Organization (transaction creates Organization + ADMIN Membership)
- [x] List my Organizations / Get one Organization (with membership check)
- [x] Add Member to Organization by email (ADMIN-only, MEMBER role)
- [x] Create Board (ADMIN-only, duplicate title check per-org)
- [x] List Boards by Org / Get Board by ID
- [x] JWT auth middleware (`Bearer <token>` -> `req.userId`)

## 🐛 Fix Existing Bugs / Tech Debt (Do First)
- [ ] Fix `apps/Frontend/src/Pages/Board.tsx` - empty axios.get(``), empty useEffect, implement real fetch `GET /api/board/:orgId/board/:boardId`
- [ ] Fix `Dashboard.tsx:265` relative navigate `organization/...` -> `/organization/:id/board/:boardId`
- [ ] Fix `App.tsx` routes missing leading `/` for `organization/:orgId/board/:boardId` and `organization/:orgId/settings`
- [ ] Add `/` route + ProtectedRoute guard (redirect to /signin if no token, redirect to /dashboard if logged in)
- [ ] `Setting.tsx` - implement member list UI (currently only renders `<p>Members Of organization</p>`)
- [ ] Replace hardcoded `http://localhost:3000` with `VITE_API_URL` env + axios instance with auth interceptor
- [ ] Add loading / error / empty states for Dashboard, Board, Settings pages
- [ ] Migrate primary keys Int autoincrement -> UUID (Google UUID) for User, Organization, Membership, Board, Issue
- [ ] Add `@@unique([userId, organizationId])` on Membership to prevent duplicate joins
- [ ] Add `createdAt / updatedAt` to all Prisma models
- [ ] Add input validation (zod) on all Backend routes + consistent error response shape

## 🔐 Auth & User Profile
- [ ] `GET /api/auth/me` - get current user
- [ ] Logout (clear token) + persist session handling
- [ ] Refresh tokens / shorter access token expiry
- [ ] Password reset (forgot / reset via email)
- [ ] Change password + update profile (username, avatar)
- [ ] OAuth - Google login
- [ ] Backend validation + rate-limit on auth routes

## 🏢 Organizations & Members
- [ ] `GET /api/organization/:orgId/members` - list members (needed for Settings page)
- [ ] Remove member / Leave organization / Change role (ADMIN <-> MEMBER)
- [ ] Update / Delete organization (ADMIN-only)
- [ ] Invite by link / invite by email (nodemailer)
- [ ] Organization settings page - member table with role badges, remove/promote actions
- [ ] Search organizations, recent organizations

## 📋 Boards - Core (make functional)
- [ ] Update Board (rename title, description, background/cover color)
- [ ] Delete / Archive Board
- [ ] Board detail API with nested include: `board -> lists -> cards (+ labels, assignees, comments count)`
- [ ] Starred / Favorite boards, Recent boards, Search + filter boards
- [ ] Board visibility (private / workspace-visible / public)
- [ ] Board members (separate from org members) - add/remove
- [ ] Build real `Board.tsx` Kanban layout - header, lists horizontal scroll, add-list input

## 📝 Lists (Columns) - Missing, High Priority
- [ ] Prisma model: `List { id, title, position Float, boardId, cards[] }`
- [ ] `POST /api/board/:boardId/lists` - create list
- [ ] `PATCH /api/lists/:listId` - rename list
- [ ] `DELETE /api/lists/:listId` - delete / archive list
- [ ] `PATCH /api/board/:boardId/lists/reorder` - reorder lists (drag-drop persist)
- [ ] Frontend: List column component + Add List + rename inline + delete menu + horizontal scroll

## 🃏 Cards (Issues) - Missing, High Priority
- [ ] Promote `Issue` -> `Card` model: `{ id, title, description, position, listId, boardId, assigneeIds, labels, dueDate, completed, archived, createdAt }`
- [ ] `POST /api/lists/:listId/cards` - create card
- [ ] `GET /api/lists/:listId/cards` - list cards ordered by position
- [ ] `PATCH /api/cards/:cardId` - edit title/description/due date/move list
- [ ] `DELETE /api/cards/:cardId` - delete / archive / restore card
- [ ] `PATCH /api/cards/reorder` - drag-drop cards within + across lists
- [ ] Card detail modal - open on click, edit description, assign members, set due date
- [ ] Assign/unassign card members (`CardMember` join table)
- [ ] Frontend drag-and-drop with `@dnd-kit/core` or `hello-pangea-dnd`
- [ ] Card counts, empty-list placeholder, quick-add card UX

## 🏷️ Trello Power Features
- [ ] Labels/Tags: `Label { id, name, color, boardId }` + `CardLabel` join + filter by label
- [ ] Checklists: `Checklist { id, title, cardId }` + `CheckItem { id, text, done, position }` + progress bar
- [ ] Comments / Activity: `Comment { id, text, cardId, userId }` + `Activity { action, userId, boardId/cardId }` feed
- [ ] Due dates: date picker, overdue / due-soon badges, reminders
- [ ] Attachments: upload via multer/S3 (or local), preview + delete on cards
- [ ] Cover images / colors on cards
- [ ] @mentions in comments, markdown in descriptions

## 🎨 UI/UX Polish
- [ ] Global Navbar (org switcher, search, user avatar menu) + Sidebar
- [ ] Shadcn domain components: `BoardCard`, `ListColumn`, `CardModal`, `MemberAvatar`, `LabelBadge`
- [ ] Toasts on every mutation (already have Toaster - wire it up)
- [ ] Optimistic updates with `@tanstack/react-query` + `react-hook-form + zod` for forms
- [ ] Keyboard shortcuts (N new card, / search, Esc close modal)
- [ ] Dark mode, responsive mobile layout, board background images

## ⚡ Realtime / Collaboration
- [ ] WebSocket (`socket.io`) - live board updates when teammate moves/creates cards
- [ ] Presence - who is viewing board now
- [ ] Notifications - assigned to card, mentioned, due soon

## 🧪 Quality / DevOps
- [ ] Backend tests (vitest/jest) for auth, org, board, list, card routes
- [ ] Frontend component tests
- [ ] Seed script + demo data (demo org + board + lists + cards)
- [ ] README.md rewrite (remove create-turbo stub, document setup, env, API table)
- [ ] Docker compose for Postgres + CI (lint/typecheck/build/test)
- [ ] Pagination + search indexes for boards/cards, debounce search input

## 💡 Suggested Build Order
1. Fixes + UUID migration + validation
2. Members list + Board detail API + real Board page shell
3. Lists CRUD + Cards CRUD + reorder
4. Drag-drop UI + Card modal
5. Labels, checklists, comments, due dates
6. Polish, realtime, tests
