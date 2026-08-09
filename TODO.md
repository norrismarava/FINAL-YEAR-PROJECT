# TODO - WaitLess Profile & Settings with Avatar

## Step 1 (Frontend)
- [x] Create `src/pages/settings.jsx` and `src/pages/profile.jsx`.
- [x] Implement profile form (details) with debounced real-time save.
- [x] Implement avatar upload with client-side crop/resize (canvas-based).
- [x] Wire UI to backend endpoints (GET /api/auth/me, POST /api/profile, POST /api/profile/avatar).

## Step 2 (Backend)
- [x] Add persistence fields to staff user records (profile details + avatar reference).
- [x] Implement endpoints:
  - `GET /api/auth/me` includes avatar/profile
  - `POST /api/profile` saves details
  - `POST /api/profile/avatar` saves uploaded cropped image
- [x] Persist avatar files under `backend/data/avatars/`.

## Step 3 (Dashboard)
- [x] Update dashboard “User tab” to show avatar from `/api/auth/me` (DashboardLayout uses resolveProfileImageUrl).

## Step 4 (Wiring)
- [x] Ensure React Router routes exist for `/settings` and profile page.


## Step 5 (Testing)
- Start backend + frontend.
- Verify save + avatar upload + crop + dashboard avatar update.

