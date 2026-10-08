# Backend API Routes

Base URL: `http://localhost:3000`

Global middleware:
- `express.json()` — all `POST` / `PATCH` / `PUT` bodies are JSON.
- CORS allows `http://localhost:5173` and `http://127.0.0.1:5173`.
- Health check: `GET http://localhost:3000/` → `200 { message: "Server is running." }`

Auth:
- All `/api/organization/*` and `/api/board/*` routes use `authmiddleware`.
- Required header: `Authorization: Bearer <JWT_TOKEN>`
- Token is JWT signed with `JWT_SECRET`, payload `{ userId: number }`, `expiresIn: "7d"`.
- Missing/invalid token → `401 { message: "Token Missing.." | "Token Missing..." | "Invalid token or expired token." }`
- `userId` is injected as `req.userId` and used for membership checks.

---

## 1. Auth — `http://localhost:3000/api/auth` (PUBLIC, no token)

### 1.1 POST `http://localhost:3000/api/auth/signup`
Create a new user.

Request body (JSON):
```json
{
  "username": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, plain text, bcrypt-hashed server-side)"
}
```

Success:
- `201`
```json
{
  "message": "Signup successful",
  "user": { "id": 1, "email": "a@b.com" }
}
```

Errors:
- `400 { message: "Username, email and password are required" }`
- `409 { message: "User already exists" }` (email already taken / Prisma `P2002`)
- `500 { message: "Error..!!" }`

Frontend usage: `apps/Frontend/src/Pages/Signup.tsx:22`

---

### 1.2 POST `http://localhost:3000/api/auth/signin`
Login, returns JWT.

Request body (JSON):
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

Success:
- `200`
```json
{
  "message": "Signin successful",
  "user": { "id": 1, "username": "...", "email": "a@b.com" },
  "token": "<JWT 7d>"
}
```

Errors:
- `400 { message: "Email and password are required" }`
- `401 { message: "Invalid email or password" }` (user not found OR password mismatch)
- `500 { message: "Error..!!" }`

Frontend usage: `apps/Frontend/src/Pages/Signin.tsx:21`
Store `token` and send as `Authorization: Bearer <token>` on all routes below.

---

## 2. Organization — `http://localhost:3000/api/organization` (PROTECTED)

### 2.1 POST `http://localhost:3000/api/organization/create`
Create org + auto-create `ADMIN` membership for caller.

Headers: `Authorization: Bearer <token>`

Request body (JSON):
```json
{
  "orgName": "string (required, used as Organization.name, must be unique globally)",
  "description": "string (required in practice, saved as Organization.description)"
}
```

Success:
- `201`
```json
{
  "message": "Organization Created Successfully..",
  "organization": { "id": 1, "name": "...", "description": "..." },
  "membership": { "id": 1, "userId": 1, "organizationId": 1, "role": "ADMIN" }
}
```

Errors:
- `401 { message: "Unauthorized" }` (no userId)
- `409 { message: "Organization ALready exist" }` (name already taken)
- `500 { message: "Internal server Error" }`

Frontend usage: `apps/Frontend/src/Pages/Dashboard.tsx:97`

---

### 2.2 GET `http://localhost:3000/api/organization/get-organizations`
List all orgs current user belongs to.

Headers: `Authorization: Bearer <token>`
No params / body.

Success:
- `200`
```json
{
  "message": "Organizations fetched successfully",
  "organizations": [
    { "id": 1, "name": "...", "description": "...", "role": "ADMIN | MEMBER" }
  ]
}
```

Errors:
- `401 { message: "Unauthorized" }`
- `500 { message: "Internal server Error" }`

Frontend usage: `apps/Frontend/src/Pages/Dashboard.tsx:48`

---

### 2.3 GET `http://localhost:3000/api/organization/get-organization/:orgId`
Get single org (must be member).

Full URL example: `http://localhost:3000/api/organization/get-organization/1`

Headers: `Authorization: Bearer <token>`
Path param: `orgId: number (integer, required)`

Success:
- `200`
```json
{
  "message": "Organization fetched successfully",
  "organization": { "id": 1, "name": "...", "description": "...", "role": "ADMIN | MEMBER" }
}
```

Errors:
- `400 { message: "Invalid organization ID" }` (non-integer)
- `400 { message: "Organization ID is required" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "You are not a member of this organization" }`
- `500 { message: "Internal server Error" }`

---

### 2.4 POST `http://localhost:3000/api/organization/:orgId/add-member`
Add existing user to org. Caller must be `ADMIN`.

Full URL example: `http://localhost:3000/api/organization/1/add-member`

Headers: `Authorization: Bearer <token>`
Path param: `orgId: number (integer)`
Request body (JSON):
```json
{
  "email": "string (required, must belong to existing User)",
  "role": "\"ADMIN\" | \"MEMBER\" (required)"
}
```

Success:
- `201`
```json
{
  "id": 2,
  "username": "...",
  "email": "newmember@mail.com",
  "role": "MEMBER"
}
```
Note: `id` here is `newMembership.userId` (not membership id).

Errors:
- `400 { message: "Invalid organization ID" }`
- `400 { message: "Invalid role" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "You are not a member of this organization" }`
- `403 { message: "You are not authorized to add members to this organization" }` (non-ADMIN)
- `404 { message: "User not found" }`
- `409 { message: "User is already a member of this organization" }`
- `500 { message: "Internal server Error" }`

Frontend usage: `apps/Frontend/src/Pages/Setting.tsx:77`

---

### 2.5 GET `http://localhost:3000/api/organization/:orgId/getMembers`
List all members of org. Caller must be member.

Full URL example: `http://localhost:3000/api/organization/1/getMembers`

Headers: `Authorization: Bearer <token>`
Path param: `orgId: number (integer)`

Success:
- `200`
```json
{
  "message": "members fetched Successfully..",
  "membership": [
    { "id": 1, "username": "...", "email": "a@b.com", "role": "ADMIN | MEMBER" }
  ]
}
```
Note: key is singular `membership` but holds an array; `id` is `user.id`.

Errors:
- `400 { message: "Invalid organization ID" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "You are not the member of the Organization" }`

Frontend usage: `apps/Frontend/src/Pages/Setting.tsx:53`

---

### 2.6 PATCH `http://localhost:3000/api/organization/:orgId`
Update org name/description. Caller must be `ADMIN`. At least one field required.

Full URL example: `http://localhost:3000/api/organization/1`

Headers: `Authorization: Bearer <token>`
Path param: `orgId: number (integer)`
Request body (JSON):
```json
{
  "orgName": "string (optional, saved as Organization.name)",
  "description": "string (optional)"
}
```

Success:
- `200`
```json
{
  "message": "Organization updated Successfully..",
  "organization": { "id": 1, "name": "...", "description": "..." }
}
```

Errors:
- `400 { message: "Invalid orgId" }`
- `400 { message: "Atleast one Field is Requied" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "You are not the member of the Organization" }`
- `403 { message: "You are not allowedto modify the Organization" }`
- `404 { message: "Org Not Found" }`
- `500 { message: "Internal server Error" }`

---

## 3. Board / Section / Issue — `http://localhost:3000/api/board` (PROTECTED)

### 3.1 POST `http://localhost:3000/api/board/:orgId/board`
Create board in org. Caller must be `ADMIN`.

Full URL example: `http://localhost:3000/api/board/1/board`

Headers: `Authorization: Bearer <token>`
Path param: `orgId: number (integer)`
Request body (JSON):
```json
{ "title": "string (required)" }
```

Success:
- `201`
```json
{
  "message": "Board created successfully",
  "board": { "id": 1, "title": "...", "organizationId": 1 }
}
```

Errors:
- `400 { message: "Invalid organization ID" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "Forbidden" }` (not a member)
- `403 { message: "You do not have permission to create a board in this organization" }` (non-ADMIN)
- `404 { message: "Organization not found" }`
- `409 { message: "A board with this title already exists in this organization" }`
- `500 { message: "Internal server Error" }`

Frontend usage: `apps/Frontend/src/Pages/Dashboard.tsx:127`

---

### 3.2 GET `http://localhost:3000/api/board/:orgId/boards`
List all boards in org. Caller must be member.

Full URL example: `http://localhost:3000/api/board/1/boards`

Headers: `Authorization: Bearer <token>`
Path param: `orgId: number (integer)`

Success:
- `200`
```json
{
  "message": "Boards retrieved successfully",
  "boards": [{ "id": 1, "title": "...", "organizationId": 1 }]
}
```

Errors:
- `400 { message: "Invalid organization ID" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "Forbidden" }`
- `404 { message: "Organization not found" }`
- `500 { message: "Internal server Error" }`

Frontend usage: `apps/Frontend/src/Pages/Dashboard.tsx:71`

---

### 3.3 GET `http://localhost:3000/api/board?orgId=${orgId}&boardId=${boardId}`
Get single board by query params. Caller must be member of `orgId`, board must belong to that org.

Full URL example: `http://localhost:3000/api/board?orgId=1&boardId=5`

Headers: `Authorization: Bearer <token>`
Query params:
- `orgId: number (integer, required)`
- `boardId: number (integer, required)`

Success:
- `200`
```json
{
  "message": "Board retrieved successfully",
  "board": { "id": 5, "title": "...", "organizationId": 1 }
}
```

Errors:
- `400 { message: "Invalid board ID" }`
- `400 { message: "Invalid organization ID" }`
- `401 { message: "Unauthorized" }`
- `403 { message: "Forbidden" }`
- `404 { message: "Organization not found" }`
- `404 { message: "Board not found" }`
- `500 { message: "Internal server Error" }`

Frontend usage: `apps/Frontend/src/Pages/Board.tsx:23`

---

### 3.4 POST `http://localhost:3000/api/board/:boardId/sections`
Create section (list/column) on board. Caller must be `ADMIN` of board's org.

Full URL example: `http://localhost:3000/api/board/5/sections`

Headers: `Authorization: Bearer <token>`
Path param: `boardId: number (integer)`
Request body (JSON):
```json
{ "title": "string (required)" }
```

Success:
- `201`
```json
{
  "message": "Section Created Successfully",
  "section": { "id": 1, "title": "...", "boardId": 5 }
}
```

Errors:
- `401 { message: "Unauthorized" }`
- `400 { message: "Invalid board ID" }`
- `404 { message: "Board Not exist" }`
- `403 { message: "You are not member of Organization" }`
- `403 { message: "You are not allowed" }` (non-ADMIN)
- (catch only `console.log`, no 500 returned — request hangs on unexpected error)

---

### 3.5 GET `http://localhost:3000/api/board/:boardId/sections`
List sections for board. Caller must be member of board's org.

Full URL example: `http://localhost:3000/api/board/5/sections`

Headers: `Authorization: Bearer <token>`
Path param: `boardId: number (integer)`

Success:
- `200`
```json
{
  "message": "Board Fethed",
  "sections": [{ "id": 1, "title": "...", "boardId": 5 }]
}
```

Errors:
- `401 { message: "Unauthorized" }`
- `400 { message: "Invalid board ID" }`
- `404 { message: "Board Not exist" }`
- `403 { message: "You are not member of Organization" }`
- `500 { message: "Internal server Error" }`

---

### 3.6 POST `http://localhost:3000/api/board/:boardId/sections/:sectionId/issue`
Create issue/card in section. Caller must be member of board's org (any role).

Full URL example: `http://localhost:3000/api/board/5/sections/2/issue`

Headers: `Authorization: Bearer <token>`
Path params: `boardId: number`, `sectionId: number (must belong to boardId)`
Request body (JSON):
```json
{
  "title": "string (required)",
  "description": "string (required)"
}
```

Success:
- `201`
```json
{
  "message": "Issue Created Succsfully",
  "Issue": { "id": 1, "title": "...", "description": "...", "sectionId": 2 }
}
```
Note: key is capital `Issue`.

Errors:
- `401 { message: "Unauthorized" }`
- `400 { message: "Invalid board ID or sectionId" }`
- `404 { message: "Board Not exist" }`
- `403 { message: "Section Not Found" }` (section not in this board — uses 403, not 404)
- `403 { message: "You are not member of Organization" }`
- `500 { message: "Internal server Error" }`

---

### 3.7 GET `http://localhost:3000/api/board/:boardId/sections/:sectionId/issues`
List issues in section. Caller must be member.

Full URL example: `http://localhost:3000/api/board/5/sections/2/issues`

Headers: `Authorization: Bearer <token>`
Path params: `boardId: number`, `sectionId: number`

Success:
- `200`
```json
{
  "message": "Issue fetched Succsfully",
  "Issue": [{ "id": 1, "title": "...", "description": "...", "sectionId": 2 }]
}
```
Note: key is capital `Issue` (array).

Errors: same as 3.6 (`401` / `400 Invalid board ID or sectionId` / `404 Board Not exist` / `403 Section Not Found` / `403 You are not member...` / `500`).

---

### 3.8 GET `http://localhost:3000/api/board/:boardId/sections/:sectionId/issue/:issueId`
Get single issue. Caller must be member.

Full URL example: `http://localhost:3000/api/board/5/sections/2/issue/10`

Headers: `Authorization: Bearer <token>`
Path params: `boardId: number`, `sectionId: number`, `issueId: number (must belong to sectionId)`

Success:
- `200`
```json
{
  "message": "issue fetched successfully",
  "issue": { "id": 10, "title": "...", "description": "...", "sectionId": 2 }
}
```
Note: key here is lowercase `issue` (unlike 3.6/3.7).

Errors:
- `401 { message: "Unauthorized" }`
- `400 { message: "Invalid board ID or sectionId" }` (also for bad issueId)
- `404 { message: "Board Not exist" }`
- `403 { message: "Section Not Found" }`
- `403 { message: "Issue Not Found" }`
- `403 { message: "You are not member of Organization" }`
- `500 { message: "Internal server Error" }`

---

### 3.9 PUT `http://localhost:3000/api/board/:boardId`
Rename board. Caller must be `ADMIN`.

Full URL example: `http://localhost:3000/api/board/5`

Headers: `Authorization: Bearer <token>`
Path param: `boardId: number`
Request body (JSON):
```json
{ "title": "string (required)" }
```

Success:
- `200`
```json
{
  "message": "board Updated",
  "board": { "id": 5, "title": "new title", "organizationId": 1 }
}
```

Errors:
- `401 { message: "Unauthorized" }`
- `400 { message: "Invalid board ID" }`
- `404 { message: "Board Not Found" }`
- `403 { message: "You are not member of Organization" }`
- `403 { message: "You are not allowed to modify" }`
- `500 { message: "Internal server Error" }`

---

### 3.10 PUT `http://localhost:3000/api/board/:boardId/sections/:sectionId`
Rename section. Caller must be `ADMIN`.

Intended full URL: `http://localhost:3000/api/board/5/sections/2`

> BUG in `apps/Backend/src/routes/boards.route.ts:654`: defined as `boardRoute.put(':boardId/sections/:sectionId', ...)` — missing leading `/`. Express may not match `/api/board/5/sections/2` as intended. Fix to `'/:boardId/sections/:sectionId'`.

Headers: `Authorization: Bearer <token>`
Path params: `boardId: number`, `sectionId: number (must belong to boardId)`
Request body (JSON):
```json
{ "title": "string (required)" }
```

Success (if route matched):
- `200`
```json
{
  "message": "Section Updated",
  "sections": { "id": 2, "title": "new title", "boardId": 5 }
}
```
Note: key is plural `sections` but holds single object.

Errors:
- `401 { message: "Unauthorized" }`
- `400 { message: "Invalid board ID or SectionId" }`
- `404 { message: "Section Not exist" }`
- `404 { message: "Board Not exist" }`
- `403 { message: "You are not member of Organization" }`
- `403 { message: "You are not allowedto modify the Organization" }`
- `500 { message: "Internal server Error" }`

---

## Quick reference table

| Method | Full URL | Takes | Returns |
|---|---|---|---|
| POST | `http://localhost:3000/api/auth/signup` | body `{username,email,password}` | `201 {message,user{id,email}}` |
| POST | `http://localhost:3000/api/auth/signin` | body `{email,password}` | `200 {message,user{id,username,email},token}` |
| POST | `http://localhost:3000/api/organization/create` | header token + body `{orgName,description}` | `201 {message,organization,membership}` |
| GET | `http://localhost:3000/api/organization/get-organizations` | header token | `200 {message,organizations[{id,name,description,role}]}` |
| GET | `http://localhost:3000/api/organization/get-organization/:orgId` | header token + param `orgId` | `200 {message,organization{id,name,description,role}}` |
| POST | `http://localhost:3000/api/organization/:orgId/add-member` | header token + param `orgId` + body `{email,role}` | `201 {id,username,email,role}` |
| GET | `http://localhost:3000/api/organization/:orgId/getMembers` | header token + param `orgId` | `200 {message,membership[{id,username,email,role}]}` |
| PATCH | `http://localhost:3000/api/organization/:orgId` | header token + param `orgId` + body `{orgName?,description?}` | `200 {message,organization}` |
| POST | `http://localhost:3000/api/board/:orgId/board` | header token + param `orgId` + body `{title}` | `201 {message,board}` |
| GET | `http://localhost:3000/api/board/:orgId/boards` | header token + param `orgId` | `200 {message,boards[]}` |
| GET | `http://localhost:3000/api/board?orgId=1&boardId=5` | header token + query `orgId,boardId` | `200 {message,board}` |
| POST | `http://localhost:3000/api/board/:boardId/sections` | header token + param `boardId` + body `{title}` | `201 {message,section}` |
| GET | `http://localhost:3000/api/board/:boardId/sections` | header token + param `boardId` | `200 {message,sections[]}` |
| POST | `http://localhost:3000/api/board/:boardId/sections/:sectionId/issue` | header token + params + body `{title,description}` | `201 {message,Issue}` |
| GET | `http://localhost:3000/api/board/:boardId/sections/:sectionId/issues` | header token + params | `200 {message,Issue[]}` |
| GET | `http://localhost:3000/api/board/:boardId/sections/:sectionId/issue/:issueId` | header token + params | `200 {message,issue}` |
| PUT | `http://localhost:3000/api/board/:boardId` | header token + param `boardId` + body `{title}` | `200 {message,board}` |
| PUT | `http://localhost:3000/api/board/:boardId/sections/:sectionId` | header token + params + body `{title}` | `200 {message,sections}` (route has missing-slash bug) |

Source files:
- `apps/Backend/src/index.ts` (mounts + base)
- `apps/Backend/src/routes/auth.route.ts`
- `apps/Backend/src/routes/organization.route.ts`
- `apps/Backend/src/routes/boards.route.ts`
- `apps/Backend/src/middleware/authmidleware.ts`
