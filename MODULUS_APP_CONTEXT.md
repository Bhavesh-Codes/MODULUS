# MODULUS — App Context for AI Agent

> This file is your primary reference for everything MODULUS is, does, and how it is built.
> Read this entire file before writing any code. Every decision you make must align with what is described here.

---

## 1. What Is MODULUS?

MODULUS is a student-focused collaborative learning platform. It solves a very specific problem: college students currently juggle WhatsApp for communication, Google Drive for files, Notion for notes, Discord for voice, and Zoom for video — all at the same time. MODULUS replaces all of them for academic use.

It unifies four core workflows into one product:

1. **Personal Vault** — every student's private file storage. The single source of truth for every file on the platform.
2. **Community Collaboration** — course or study group spaces with shared resources, task tracking, and discussion threads.
3. **Study Circles** — ephemeral real-time rooms with voice, video, screen share, and a shared whiteboard.
4. **Focus Dashboard** — Pomodoro timer, session logging, community leaderboard, and personal analytics.

---

## 2. Technology Stack

Use exactly these technologies. Do not substitute anything.

| Layer | Technology |
|---|---|
| Framework | Next.js 14 with App Router |
| Database | Supabase (PostgreSQL with Row Level Security) |
| Auth | Supabase Auth — email/password + Google OAuth 2.0 |
| File Storage | Cloudflare R2 via AWS SDK (`@aws-sdk/client-s3`) |
| WebSocket | Socket.io on a separate Node.js server (`server.js`) |
| WebRTC | Browser-native `RTCPeerConnection` |
| Whiteboard | `@excalidraw/excalidraw` React component |
| TURN Server | Open Relay by Metered (`openrelay.metered.ca`) |
| UI Components | shadcn/ui (Radix UI primitives + Tailwind CSS) |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Server State | TanStack Query (React Query) |
| Client State | Zustand |
| Charts | Recharts |
| Language | TypeScript throughout |

### Critical Architecture Note — Socket.io

Next.js Route Handlers are stateless. They cannot hold Socket.io rooms in memory. Therefore Socket.io runs as a **completely separate** Node.js process in a file called `server.js` at the root of the project. In production, Next.js deploys to Vercel and the Socket.io server deploys independently to Railway or Render. The frontend connects to Socket.io via the `NEXT_PUBLIC_SOCKET_URL` environment variable.

---

## 3. User Roles

### System Level
- **Admin** — One account only. Cannot be created via signup. Has god-mode access to all content. Can force-delete anything.

### Community Level
- **Owner** — The user who creates a Community. Can promote/demote Curators, ban/kick members, edit Community settings.
- **Curator** — Promoted by Owner. Can approve join requests, moderate threads, create/organise Community Vault folders, approve tasks.
- **Peer** — Standard member. Can share files, participate in all features, start/join Study Circles, use Focus Dashboard.

---

## 4. Authentication & Onboarding

- Email/password registration with Supabase Auth. Requires name, email, password (minimum 8 characters).
- Google OAuth 2.0 via Supabase Auth. Google users skip email verification.
- Email verification required for email/password users before account is active. Resend option available.
- Password reset via Supabase email link. Expires after 1 hour.
- Sessions managed via `@supabase/ssr` — reads and writes auth cookies correctly across Server Components, Route Handlers, and Middleware.
- After first login, show a **Profile Setup Wizard** (skippable at any step): profile picture, college/university, stream, course and year, interest tags.
- Profile is editable at any time in Settings.

---

## 5. The Personal Vault — Core Logic

**The Personal Vault is the ONLY storage layer on the platform.** Every single file lives in the owner's Vault. Communities do not own files. They hold references to Vault items only.

When a user uploads a file inside a Community, the file saves to their Personal Vault first, then auto-shares to that Community simultaneously.

### What Can Be Stored
- Files: PDF, PNG, JPG, JPEG, DOC, DOCX — max 20 MB per file
- Rich Text Notes — created in a text editor inside the app
- Links — saved URLs with a title

### Quota
- Max 500 MB total per user
- Quota is checked on the client before upload starts (UX feedback) and enforced hard on the server (rejected if exceeded)
- Quota only tracks files the user owns, not files saved by others

### Organisation
- Folders and sub-folders: create, rename, delete
- Hashtags (`#tags`) assignable to any file or note
- Vault Search: searches filename, note heading, and tags — returns only the current user's items

### Sharing Rules
- All content is private by default
- Owner explicitly shares a file to a Community — it then becomes visible to all Community members
- One file can be shared to multiple Communities simultaneously — one R2 object, multiple DB references
- Editing a note auto-updates the version visible in all Communities it is shared to (no version history, just latest state)
- **Unshare**: removes from a specific Community without deleting from Vault
- **Delete**: removes from all Communities. The R2 object is only deleted if no other user has saved an independent copy.

### Save to Vault (from Community)
When a Community member saves another member's file to their own Vault:
- A **full independent copy** is created in R2 under the saver's ownership
- Counts against the saver's 500 MB quota
- Completely unaffected if the original owner later deletes their copy

---

## 6. Communities

Communities are collaborative spaces. They reference files from member Vaults. They do not store files themselves.

### Types
- **Public** — anyone can join immediately
- **Private** — searchable, but requires a join request that must be approved by Owner or Curator

### Limits
- Maximum 250 members per Community
- Join is blocked beyond the cap
- Owner is notified when membership reaches 200 (80% warning)

### Community Vault (Shared Resources)
- Members share files from their Personal Vault to the Community
- Direct upload inside Community auto-saves to uploader's Vault and shares to Community simultaneously
- Community Search: searches shared files by filename, heading, or tags — returns only files shared to this Community
- Any member can view and download any shared file
- Save to My Vault: creates a full independent copy in R2 for the saver
- Community Folders: Owner/Curator organises shared files into Community-specific folders — completely independent of any member's Personal Vault folder structure
- Moving a file within Community folders has zero effect on any member's Personal Vault

### Collaborative Tasks
- **Common Tasks**: Owner/Curator creates tasks visible to all members
- **Peer Suggestions**: A suggested task stays Pending until Owner/Curator approves it
- **Completion**: Each member checks a checkbox to mark it done for themselves. A progress bar shows the community-wide completion percentage.
- **Drill-Down View**: Shows which members completed the task. Members can opt out of appearing in this list via per-community privacy settings.

### Discussion Threads
- Post types: plain text, question/doubt, image attachment
- Threaded replies to any depth
- Upvote / Downvote on threads and replies
- Thread author controls: Lock (no new replies, marked Closed), Delete (permanent), Mark Solution (highlights a specific reply)
- Owner/Curator can delete any thread or comment for moderation

### Focus Dashboard
- **Pomodoro Timer**: 25-minute work / 5-minute break. Visual countdown. Auto-cycles.
- **Standard Stopwatch**: start, pause, reset
- User must select a Label/Subject before starting any session
- Session duration is logged on completion or manual stop
- **Community Leaderboard**: members ranked by total hours focused within this Community
- **Personal Analytics**: daily and weekly bar/line charts of study hours by subject label — powered by Recharts

---

## 7. Study Circles (Real-Time)

Study Circles are ephemeral real-time rooms inside a Community. Everything is wiped when the last participant leaves. There is no recovery.

**Tech used**: Excalidraw (whiteboard) + Socket.io (signalling + sync + chat) + WebRTC (media) + Open Relay TURN

### Lifecycle
- Any Community member can start a Circle. It appears as 'Live' immediately in the Community.
- Maximum 5 participants. The 6th person attempting to join gets a 'Room Full' error.
- When the last participant leaves: Socket.io room is destroyed, all text chat is wiped from memory, Circle record is deleted from Supabase.
- On Socket.io server restart: any Circles with no active room are deleted from the database (orphan cleanup).

### Communication
- **Voice**: WebRTC audio with per-user mute toggle
- **Video**: WebRTC camera stream, off by default, per-user toggle
- **Screen Share**: WebRTC `getDisplayMedia`. Only one active screen share at a time.
- **Text Chat**: Socket.io broadcast to the room. No persistence. Wiped on close.

### Shared Whiteboard
- Excalidraw React component embedded in the Circle room
- Real-time sync via Socket.io delta events from the `onChange` callback
- All Excalidraw native tools available: pen, shapes, text, eraser, colour picker, undo/redo
- **Snapshot**: `exportToBlob()` → upload PNG to R2 → VaultItem created in the user's Personal Vault. Multiple snapshots per session are allowed.

### WebRTC & TURN
- Full-mesh topology. 5 users = 10 peer connections. No SFU needed.
- Signalling (offer/answer/ICE candidates) relayed through the Socket.io room keyed by Circle ID
- Open Relay TURN configured as ICE server. Direct connection is attempted first; TURN is the automatic fallback for strict NAT networks.

### Socket.io Events

| Event | Direction | Purpose |
|---|---|---|
| `circle:join` | Client → Server | Join a Circle room |
| `circle:leave` | Client → Server | Leave; triggers cleanup if last participant |
| `rtc:offer` | Client ↔ Client via Server | WebRTC offer relay |
| `rtc:answer` | Client ↔ Client via Server | WebRTC answer relay |
| `rtc:ice` | Client ↔ Client via Server | ICE candidate relay |
| `circle:chat` | Client → Room | Text chat broadcast |
| `whiteboard:delta` | Client → Room | Excalidraw scene delta sync |
| `circle:participant-update` | Server → Room | Participant count update |

---

## 8. System Administration

- Single Admin account — cannot be created via signup or promotion
- Global Dashboard: view all Communities (Public and Private)
- God Mode: access any file, thread, or Community regardless of privacy settings
- Force-delete any entity: User, Community, File, Thread, Comment

---

## 9. What Is Explicitly NOT In This App

Do not build any of the following. They are out of scope:

- Notifications of any kind — no in-app, no email, no push
- Flashcard decks
- Mobile native apps (responsive web only)
- Direct messaging between users
- AI features (summarisation, recommendations, etc.)
- Payments or premium tiers

---

## 10. Data Model

| Entity | Key Fields | Notes |
|---|---|---|
| User | id, name, email, password_hash, google_id, profile_pic, college, stream, course, year, tags[], storage_used_bytes | google_id nullable. storage_used_bytes updated on every upload/delete/save-copy. |
| Community | id, name, description, banner_url, type, owner_id, member_count | member_count cached, capped at 250 |
| CommunityMember | community_id, user_id, role (owner/curator/peer), joined_at | Junction table |
| File | id, owner_id, r2_object_key, filename, mime_type, size_bytes, created_at | One DB record per unique R2 object |
| VaultItem | id, file_id (nullable), owner_id, item_type (file/note/link), note_content, is_private, folder_id, tags[], created_at | file_id null for rich text notes |
| CommunityVaultItem | id, vault_item_id, community_id, community_folder_id, shared_by, shared_at | Reference only — deleting this does not touch VaultItem or File |
| Folder | id, owner_id, name, parent_id, scope (vault/community), community_id | Unified folder table |
| Task | id, community_id, title, status (pending/active), created_by, created_at | pending = Peer suggestion, active = approved |
| TaskCompletion | task_id, user_id, completed_at, show_in_drilldown (bool) | show_in_drilldown is per-user opt-in/out |
| Thread | id, community_id, author_id, content, post_type, is_locked, solution_reply_id, created_at | solution_reply_id FK to Reply |
| Reply | id, thread_id, author_id, parent_reply_id, content, created_at | parent_reply_id nullable for top-level replies |
| Vote | id, user_id, target_type (thread/reply), target_id, value (+1/-1) | Upsert on change |
| FocusSession | id, user_id, community_id, label, duration_seconds, timer_type (pomodoro/stopwatch), started_at | Powers leaderboard and analytics |
| StudyCircle | id, community_id, started_by, started_at, participant_count | Deleted when participant_count = 0 |
| JoinRequest | id, community_id, user_id, status (pending/approved/rejected), reviewed_by, created_at | Deleted after resolution |

---

## 11. API Surface

All REST endpoints are Next.js Route Handlers. Auth via Supabase JWT. Socket.io events are handled on the separate Node.js server.

| Group | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | POST /register, POST /login, GET /google, POST /logout, POST /reset-password |
| Users | `/api/users` | GET /me, PATCH /me, GET /me/quota |
| Vault | `/api/vault` | POST /items, GET /items, PATCH /items/:id, DELETE /items/:id, POST /folders, GET /folders |
| Share | `/api/vault/items/:id/share` | POST (share), DELETE /:communityId (unshare) |
| Communities | `/api/communities` | POST /, GET /, GET /:id, PATCH /:id, DELETE /:id |
| Members | `/api/communities/:id/members` | GET /, POST /join-request, PATCH /join-requests/:reqId, DELETE /:userId, PATCH /:userId/role |
| Community Vault | `/api/communities/:id/vault` | GET /items, POST /upload, POST /save/:itemId, POST /folders, PATCH /items/:itemId/folder |
| Tasks | `/api/communities/:id/tasks` | GET /, POST /, PATCH /:taskId, POST /:taskId/complete, DELETE /:taskId/complete |
| Threads | `/api/communities/:id/threads` | GET /, POST /, GET /:threadId, DELETE /:threadId, PATCH /:threadId |
| Replies | `/api/threads/:id/replies` | GET /, POST /, DELETE /:replyId |
| Votes | `/api/votes` | POST / (upsert) |
| Focus | `/api/communities/:id/focus` | POST /sessions, GET /leaderboard, GET /me/analytics |
| Circles | `/api/communities/:id/circles` | GET /, POST /, DELETE /:circleId |
| Admin | `/api/admin` | GET /communities, DELETE /entities/:type/:id |

---

## 12. Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_ENDPOINT` | R2 S3-compatible endpoint URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |
| `CLIENT_URL` | Next.js app URL (used by Socket.io server for CORS) |

---

## 13. Build Order Reference

Follow this order strictly. Do not skip phases.

- **Phase 1** — Supabase setup, Next.js scaffold, Auth (email + Google), R2 setup, Profile Wizard
- **Phase 2** — Personal Vault (upload, notes, links, folders, tags, search, quota)
- **Phase 3** — Communities, roles, join requests, Community Vault, community folders, member management
- **Phase 4** — Tasks and Discussion Threads
- **Phase 5** — Focus Dashboard (timers, session logging, leaderboard, Recharts analytics)
- **Phase 6** — Study Circles (Socket.io, WebRTC, voice/video/screen share, Excalidraw, snapshots, TURN)
- **Phase 7** — Admin dashboard, mobile responsiveness, empty/error/loading states, deploy
