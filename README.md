# Smart Job Recommendation Web App

A full-stack job portal with personalized recommendations, role-based workflows, and animated modern UI.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + role-based middleware

## Architecture

```text
backend/
  src/
    config/
      db.js
    controllers/
      authController.js
      userController.js
      jobController.js
      companyController.js
      adminController.js
      recommendationController.js
    middleware/
      authMiddleware.js
      errorMiddleware.js
    models/
      User.js
      Company.js
      Job.js
      UserAction.js
      Application.js
    routes/
      authRoutes.js
      userRoutes.js
      jobRoutes.js
      companyRoutes.js
      adminRoutes.js
      recommendationRoutes.js
    services/
      recommendationEngine.js
    data/
      seed.js
    app.js
    server.js
frontend/
  src/
    components/
      AppShell.jsx
      FilterBar.jsx
      JobCard.jsx
      Loader.jsx
      Navbar.jsx
      PageTransition.jsx
      ProtectedRoute.jsx
      UserOnboardingGuard.jsx
      StatCard.jsx
    context/
      AuthContext.jsx
      ThemeContext.jsx
    hooks/
      useDebounce.js
    pages/
      LoginPage.jsx
      SignupPage.jsx
      OnboardingPage.jsx
      JobFeedPage.jsx
      JobDetailsPage.jsx
      ProfilePage.jsx
      CompanyDashboardPage.jsx
      CompanyProfilePage.jsx
      ManageJobsPage.jsx
      AdminPanelPage.jsx
      UnauthorizedPage.jsx
      NotFoundPage.jsx
    services/
      api.js
    styles/
      index.css
    utils/
      format.js
      roleHome.js
    App.jsx
    main.jsx
```

## Core Features

1. Authentication
- Signup/Login using JWT
- Password hashing via `bcryptjs`
- Role-based access (`USER`, `COMPANY`, `ADMIN`)

2. User Features
- Profile management (skills, interests, experience, category, location)
- One-time onboarding for new users (job type, preferred location, salary expectation, interests)
- Job feed with filters and search
- Save/apply actions
- Activity tracking (`view`, `save`, `apply`)
- Recommendation feed with human-readable reason

3. Company Features
- Company profile management
- Certificate upload with OCR/document analysis
- Authenticity scoring based on document/profile/registry matches
- Optional external registry validation via OpenCorporates
- Post, edit, delete jobs
- View company dashboard counters
- View applicants per job

4. Admin Features
- View all users, companies, jobs
- Review company verification submissions with OCR and registry results
- Delete users and jobs

## Recommendation Engine

Implemented in `backend/src/services/recommendationEngine.js`.

Hybrid score:

```text
FinalScore =
  (SkillMatchScore * 0.5) +
  (BehaviorScore * 0.3) +
  (SimilarUserScore * 0.2)
```

- Content-based (`SkillMatchScore`): skill overlap plus preference matching (category, location, job type, salary).
- Behavior-based (`BehaviorScore`): weighted signals from user actions:
  - `view = +1`
  - `save = +3`
  - `apply = +5`
- Collaborative (`SimilarUserScore`): jobs applied by other users with overlapping skills.

Endpoint:

- `GET /api/recommendations/:userId`

Response includes:
- top 10 jobs sorted by score
- per-component score breakdown
- `reason` explanation string

## Environment Variables

### Backend (`backend/.env`)

Use `backend/.env.example` as template:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_job_reco
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
OCR_LANGUAGE=eng
TESSERACT_LANG_PATH=
COMPANY_REGISTRY_PROVIDER=
OPENCORPORATES_API_TOKEN=
```

### Frontend (`frontend/.env`)

Use `frontend/.env.example` as template:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Setup and Run

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

3. Start backend:
```bash
cd ../backend
npm run dev
```

4. Seed database (optional but recommended):
```bash
npm run seed
```

5. Start frontend:
```bash
cd ../frontend
npm run dev
```

## Seeded Accounts

After `npm run seed`:

- Admin: `admin@smartjobs.dev` / `admin123`
- Company: `hr@nexalabs.com` / `company123`
- Company: `talent@orbitsystems.com` / `company123`
- Company: `jobs@vertexdynamics.com` / `company123`
- User: `arya@example.com` / `user12345`
- User: `ravi@example.com` / `user12345`
- User: `mina@example.com` / `user12345`
- User: `sara@example.com` / `user12345`

Seed now inserts **50 jobs** across different domains (Frontend, Backend, Fullstack, Data Science, DevOps, Mobile, Cybersecurity, Product Management, Design, QA).

## Example API Calls

### Auth

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arya@example.com","password":"user12345"}'
```

### Create Job (COMPANY)

```bash
curl -X POST http://localhost:5000/api/company/jobs \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"React Engineer",
    "description":"Build frontends",
    "requiredSkills":["react","javascript"],
    "category":"Frontend",
    "location":"Remote",
    "type":"remote"
  }'
```

### Get Recommendations

```bash
curl http://localhost:5000/api/recommendations/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Apply to Job

```bash
curl -X POST http://localhost:5000/api/jobs/<JOB_ID>/apply \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## UI Screenshot Descriptions (Textual)

1. Login screen
- Frosted-glass auth card over a gradient mesh background with animated card entrance.

2. User job feed
- Top hero panel + recommended jobs section + responsive animated job card grid with hover lift.

3. Company dashboard
- Counter cards (jobs/applications), recent applications stream, and top-viewed jobs panel.

4. Admin panel
- Data tables for users, companies, and jobs with moderation action buttons.

5. Profile page
- Editable user preference form plus activity metrics and application timeline.

## Notes

- Role constraints are enforced both on frontend route guards and backend middleware.
- Recommendation explanations are generated based on dominant signal (skills, behavior, or similar users).
- Current collaborative filter is intentionally lightweight and logic-based (no heavy ML).
