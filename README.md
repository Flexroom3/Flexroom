# FlexRoom

FlexRoom is a full-stack academic platform for **students** and **evaluators (instructors)**: class sections, assessments (`document`, `code`, `bubble`), file submissions stored in SQL Server, **autograding** for code assessments, **similarity / plagiarism** analysis, and dashboards with progress visualization.

This file describes the **`main`** branch (the default branch on GitHub) and maps **all other published remote branches** so you can see what is already folded into `main` versus what still needs a merge or cherry-pick.

**Canonical remote:** `https://github.com/Flexroom3/Flexroom`  
**Product / schema notes:** [`project-context.md`](project-context.md)  
**Formal use cases (source document):** [`UseCases.pdf`](UseCases.pdf) — seventeen numbered scenarios below are summarized from that PDF so contributors can trace behaviour to requirements without opening the file every time.

---

## Use cases ([`UseCases.pdf`](UseCases.pdf))

The PDF defines **17** use cases (identifiers **UC-01** through **UC-17**). The table lists each identifier, title, main actors, stated priority, and how the current **`main`** codebase relates (implemented surface, data model only, or still aspirational).

| ID | Name (from PDF) | Actors | Priority | Relation to `main` |
|----|-----------------|--------|----------|-------------------|
| UC-01 | Upload Assessment | Evaluator | High | [`POST /api/grading/assessments`](routes/gradingRoutes.js) persists assessments; full “upload assessment” UI flow in the PDF is only partly reflected in dashboards and related screens—see also divergent branch `feature/evaluator-assignment-create` for a dedicated creation wizard. |
| UC-02 | Add Rubric | Evaluator | Medium | [`Rubrics`](db/schema.sql) table and [`server/rubric/Rubric.js`](server/rubric/Rubric.js); end-to-end “add rubric” UX may still need wiring to match every step in the PDF. |
| UC-03 | Add Deadline | Evaluator | Medium | `Assessment.dueDate` in [`db/schema.sql`](db/schema.sql) and assessment create/update paths; calendar integration for “adds deadline to calendar” is a product extension. |
| UC-04 | Upload Key | Evaluator | Low | `SolutionKey` / `SolutionKeyName` on `Assessment` ([`db/schema.sql`](db/schema.sql)); visibility rules “after deadline only” are specified in the PDF and should be enforced in API/UI when implemented. |
| UC-05 | Evaluate Documents | Evaluator | High | Document-type assessments and submissions exist; in-app marking workflow should align with rubric and grade storage ([`Grades`](db/schema.sql)). |
| UC-06 | Display Feedback | Evaluator, System | Low | Autograde writes `Feedback` on [`Grades`](db/schema.sql); student-visible feedback surfaces live under [`/student`](client/src/App.js) and related components as implemented. |
| UC-07 | Upload Code File | Student | High | [`POST /api/grading/submissions`](routes/gradingRoutes.js) accepts multipart uploads; PDF requires **C++** and deadline checks—enforce file type and dates in UI/API as needed. |
| UC-08 | Upload Document | Student | High | Same submission endpoint; PDF specifies **PDF** uploads and drag/drop or file-picker UX—implement in the client to match (see topic branch `feature/evaluator-assignment-create` for a dropzone-heavy pattern). |
| UC-09 | Enrol in course | Student | Medium | [`POST /api/users/join-class`](routes/userRoutes.js) joins by class code and updates `CourseClass.numStudents`. |
| UC-10 | Self evaluate code | Student | Low | Depends on post-deadline access to rubric, test cases, and key; backend pieces include [`TestCases`](db/schema.sql), autograde, and solution key fields—compose into a dedicated “self evaluation” UI per PDF. |
| UC-11 | Self evaluate document | Student | Low | PDF body describes student comparing a **PDF** solution to key and rubric after deadline; treat as student-facing feature to implement alongside UC-10. |
| UC-12 | Sign up | Evaluator, Student | High | [`/signup`](client/src/App.js) → [`Signup.jsx`](client/src/components/auth/Signup.jsx); schema enforces **@gmail.com** pattern and password length in [`db/schema.sql`](db/schema.sql) / [`project-context.md`](project-context.md). |
| UC-13 | Generate course | Evaluator | High | [`GET /api/users/generate-code`](routes/userRoutes.js) returns a code for evaluators; full “course + TA codes” lifecycle in the PDF may need extra tables/API beyond current `CourseClass` usage. |
| UC-14 | Login verification | System, User | High | [`POST /api/users/login`](routes/userRoutes.js) and [`Login.jsx`](client/src/components/auth/Login.jsx) via [`AuthService`](server/singleton/AuthService.js). |
| UC-15 | Evaluate code | System (evaluator configures) | High | [`POST /api/grading/autograde`](routes/gradingRoutes.js), [`server/testCase/TestCase.js`](server/testCase/TestCase.js), rubric “correctness” and manual sections as described in the PDF. |
| UC-16 | Display charts | System | Medium | [`ProgressGraph`](client/src/components/ProgressGraph.jsx) and **Recharts** under evaluator/student routes; PDF lists chart types and metrics—extend queries/UI to match each option. |
| UC-17 | Detect plagiarism | System | High | [`POST /api/grading/plagiarism/run`](routes/gradingRoutes.js) and [`MatchResults`](server/plagiarism/MatchResults.js) / [`db/schema.sql`](db/schema.sql); PDF allows evaluator-defined **minimum flag %**—today’s service compares peers on the same assessment (align thresholds with product spec). |

**Cross-cutting themes from the PDF:** evaluator must be **logged in** before class/assessment actions; students need account + enrolment + valid deadline to submit; **alternate flows** cover invalid data, missing entities, late deletion, and connectivity failures—when adding endpoints, return clear HTTP errors and messages consistent with those branches.

---

## Tech stack (`main`)

| Area | Technology |
|------|----------------|
| Frontend | [Create React App](client/), React 19, React Router 7, Bootstrap 5, CSS Modules, Recharts, Lucide / React Icons |
| Backend | Node.js (CommonJS), Express 5, `mssql`, `multer`, `dotenv`, `express-rate-limit`, `pdf-parse`, `string-similarity`, `uuid` |
| Database | Microsoft SQL Server (`FlexroomDB`; DDL and seed data in [`db/schema.sql`](db/schema.sql)) |
| Dev workflow | `concurrently` runs API and client together (`npm run dev` at repo root) |

---

## Repository layout (`main`)

| Path | Role |
|------|------|
| [`index.js`](index.js) | Express app entry (port **5000**), sample `/api/message` endpoint, mounts routers |
| [`dbconfig.js`](dbconfig.js) | SQL Server connection from environment variables |
| [`routes/gradingRoutes.js`](routes/gradingRoutes.js) | Assessments, submissions, autograde, plagiarism, student notification polling |
| [`routes/userRoutes.js`](routes/userRoutes.js) | Login, join class, evaluator class code generator |
| [`server/`](server/) | Domain logic: assessments (factory), rubric, test cases, solution keys, plagiarism engine, DB singleton, auth singleton, observer notifications |
| [`client/`](client/) | React SPA (public UI, dashboards, flexroom prototypes, auth screens) |
| [`db/schema.sql`](db/schema.sql) | Tables, constraints, and sample inserts |
| [`project-context.md`](project-context.md) | Intended domain model, business rules, design-pattern checklist |

---

## Frontend (`client/src`)

### Routes ([`App.js`](client/src/App.js))

| Path | Purpose |
|------|---------|
| `/` | Landing page |
| `/login`, `/signup` | Authentication screens |
| `/progress` | Standalone progress graph |
| `/change-password`, `/upload-picture` | Account-related flows |
| `/flexroom/student`, `/flexroom/evaluator` | Fixed-size “flexroom” layouts inside a scaled frame |
| `/student`, `/student/settings`, `/student/calendar` | Student shell (`DashboardLayout`) |
| `/evaluator`, `/evaluator/people`, `/evaluator/progress/:studentId` | Evaluator shell and nested views |

### Notable UI modules

- **Shell:** `DashboardLayout`, `Sidebar`, `Topbar`, role-specific dashboards (`StudentDashboard`, `EvaluatorDashboard`).
- **Pages:** `CalendarPage`, `PeoplePage`, `SettingsPage`, `ChangePassword`, `UploadPicture`.
- **Legacy / demo views:** `components/flexroom/*`, `ProgressGraph` (also used under evaluator progress route).

---

## Backend API (`main`)

Base URL for local development is typically `http://localhost:5000` (see [`index.js`](index.js)).

### Users — `/api/users` ([`userRoutes.js`](routes/userRoutes.js))

| Method | Path | Summary |
|--------|------|---------|
| POST | `/login` | Email/password login via `AuthService` |
| POST | `/join-class` | Student joins a class by numeric `classCode` (updates `CourseClass.numStudents`) |
| GET | `/generate-code` | Evaluator-only: suggests a 6-digit class code |

### Grading & assessments — `/api/grading` ([`gradingRoutes.js`](routes/gradingRoutes.js))

| Method | Path | Summary |
|--------|------|---------|
| GET | `/health` | Health check; lists design patterns used in-module |
| POST | `/assessments` | Create assessment row in SQL |
| GET | `/assessments/:id` | Assessment details (via `AssessmentFactory`) |
| POST | `/submissions` | Multipart upload; stores file in `Submissions.FileContent` |
| POST | `/autograde` | Runs test-case pipeline, writes `Grades`, notifies observer |
| POST | `/plagiarism/run` | Compares one submission to peers on the same assignment |
| GET | `/students/:studentId/notifications` | Poll observer notifications after autograde |

### Other

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/message` | Demo endpoint; reads `Settings.welcomeMessage` when DB is available |

---

## Server modules (`server/`)

| Module area | Files (indicative) | Responsibility |
|-------------|-------------------|----------------|
| Assessment | `Assessment.js`, `AssessmentFactory.js` | Typed assessments and factory construction |
| Grading / rubric / tests | `rubric/Rubric.js`, `testCase/TestCase.js`, `grading/GradingRegistry.js` | Rubric and automated test execution |
| Solution keys | `solutionKey/SolutionKey.js`, `SolutionKeyStates.js` | Solution key handling |
| Plagiarism | `plagiarism/MatchResults.js` | Pairwise similarity over submission bodies |
| Code execution | `codeRunner/CodeExecutionService.js` | Execution support for code assessments |
| Infrastructure | `singleton/ConnectionManager.js`, `singleton/AuthService.js` | Shared DB pool and auth helpers |
| Observer | `observer/DashboardNotifier.js` | Student dashboard notifications after grading events |

The grading router’s `/health` response documents patterns such as **Factory**, **Composite**, **State**, **Template**, **Observer**, and **Singleton** as implemented in this codebase.

---

## Database (`db/schema.sql`)

Tables and concepts on **`main`** include (among others):

- **Users**, **StudentProfiles**, **EvaluatorProfiles**
- **Submissions** (`VARBINARY(MAX)` file storage), **MatchResults** (similarity; auto-flag when similarity exceeds 30%)
- **CourseClass**, **Assessment** (types: `document` | `code` | `bubble`)
- **TestCases**, **Grades**, **Rubrics**
- **Assessment** extensions: `SolutionKey`, `SolutionKeyName` (via `ALTER TABLE`)

**Schema note:** `CourseClass` references a **`Course`** table. The checked-in script expects `Course` to exist before `CourseClass` is created; if your database build fails, add a `CREATE TABLE Course` block consistent with [`project-context.md`](project-context.md) or adjust FKs to match your deployment.

---

## Environment variables

| Variable | Used by |
|----------|---------|
| `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`, `DB_PORT` | [`dbconfig.js`](dbconfig.js) |
| JWT / auth-related secrets | `AuthService` and protected user routes (configure as implemented in [`server/singleton/AuthService.js`](server/singleton/AuthService.js)) |

The React app has no mandatory `REACT_APP_*` variables for basic routing; add API base URLs if you point the UI at a non-default host.

---

## Running locally

**Install and run API + client together:**

```bash
npm install
cd client && npm install && cd ..
npm run dev
```

- API: `http://localhost:5000`
- Client: `http://localhost:3000` (CRA default)

**Backend only:** `npm start`  
**Client only:** `cd client && npm start`

---

## Git branches (remote `origin`)

`main` is the integration line that GitHub shows by default. Other branches are topic lines; some are **fully merged into `main`**, others **diverged** (different commits on both sides—open a PR or rebase before merging).

### Branches whose history is already contained in `main`

These tips are ancestors of current `main` (work is represented on `main`; branch may still exist for reference):

- `origin/Upload-Assessment` — upload assignment UI fixes  
- `origin/assessments-backend` — schema + grading API enhancements  
- `origin/login-backend` — user routes / management  
- `origin/landing-pages` — landing layout and styles  
- `origin/make-assignment-eval-frontend` — evaluator assignment UI thread  
- `origin/uploading-frontend` — layout fixes for uploads  
- `origin/feature/dashboard-layout` — dashboard layout and class cards  
- `origin/feature/student-dashboard` — student dashboard UI  
- `origin/feature/evaluator-sidebar` — progress graph and people page updates  
- `origin/feature-visualize-progress` — `ProgressGraph` implementation  
- `origin/changes-to-visualize-progress` — settings icons, branding, course section labels  
- `origin/settings-page` — settings / upload picture flows  
- `origin/using-components-top&sidebar` — top bar + sidebar integration with progress  
- `origin/alert-autofix-1` — rate limiting / scanning hardening  

### Branches that diverged from `main` (need explicit reconciliation)

| Branch | What it was for (from tip commits / diffs) | Notes |
|--------|---------------------------------------------|--------|
| `origin/feature/evaluator-assignment-create` | Document/code **assignment creation wizard** (`AssignmentCreateForm`, create pages), `client/src/api/assignmentsApi.js`, embedded **`courseClasses-Backend`** under `client/src/components/` | Forked **before** the consolidated `routes/` + `server/` backend on `main`; merging requires resolving large deletes vs current `main`. |
| `origin/assignmentUpload-backend` | **`courseClasses-Backend`** slice (course/class API) | Same family as above; diverged. |
| `origin/final-fixes` | Evaluator **settings connection** and related UI tweaks | Small diff vs an older base; re-apply on `main` if still needed. |
| `origin/dependabot/*` | Dependency bumps (client/npm ecosystem) | Open Dependabot PRs or cherry-pick onto `main` as needed. |

### Local-only branches

Your clone may also have local branches (for example `Upload-Assessment`, `assignmentUpload-backend`, `uploadWorkPages`) that track or mirror the remotes above—use `git branch -vv` to see upstreams.

---

## Contributing

1. Branch from **`main`**, keep changes focused, open a PR into `main`.  
2. After merging, **`README.md` at the repository root** is what GitHub renders on the repo home page—keep it updated when you add major routes, tables, or env vars.

---

## License

See [`package.json`](package.json) (`license` field: **ISC**).
