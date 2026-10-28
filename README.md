# Blood Donor Directory and Emergency Request System

BloodLink is a beginner-friendly full-stack web application for a college project. It lets willing donors register with explicit directory consent, lets visitors search the donor directory by blood group and city, and lets a requester publish an urgent blood requirement.

## 1. Problem statement

During a blood requirement, families may struggle to find a willing donor quickly. BloodLink provides a searchable directory and a public list of emergency requests to help people coordinate. It does not verify donor eligibility, guarantee availability, or replace a hospital blood bank or emergency services.

## 2. Objectives

- Make donor discovery easier using blood group and city filters.
- Collect donor registrations only with explicit consent to show contact details.
- Publish emergency requests with hospital, contact, units, and needed-by time.
- Persist information in Supabase PostgreSQL through an Express API.
- Demonstrate HTML, CSS, Vanilla JavaScript, Node.js, Express, PostgreSQL, and Git.

## 3. Users and MVP features

**Visitors/requesters:** browse willing donors, search by blood group/city, and post an emergency request.

**Donors:** register their name, blood group, city, phone and optional email; select current availability; consent to public listing.

**MVP limitations:** no accounts, administrator dashboard, edit/delete workflow, automatic SMS/email, verification, or donation eligibility checks. Public donor phone numbers and request contact details are visible. Only use real data with informed consent. For a production system, add verified authentication, record ownership, moderation, abuse prevention, deletion/unlisting, and a privacy review.

## 4. Technology stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js 20+ and Express
- Database: Supabase PostgreSQL
- Necessary npm packages: `express`, `@supabase/supabase-js`, `dotenv`, `helmet`, `cors`, `express-rate-limit`
- Version control: Git and GitHub

## 5. Folder structure

```text
blood-donor-directory-and-emergency-request-system/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── donors.js
│   │   └── requests.js
│   ├── middleware/
│   │   └── validation.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install:
- Visual Studio Code: https://code.visualstudio.com/
- Node.js LTS (includes npm): https://nodejs.org/
- Git: https://git-scm.com/
- A free Supabase account: https://supabase.com/

Verify installations in a new VS Code terminal:
```bash
node --version
npm --version
git --version
```
Use Node.js 20 or newer.

## 7. Supabase setup

1. Sign in to Supabase and create a new project.
2. Choose a project name and a strong database password; keep the password private.
3. Wait until the database is ready.
4. Open **SQL Editor** in the Supabase dashboard.
5. Open `database/schema.sql` from this project, copy all its contents into the SQL Editor, and run it.
6. Open **Table Editor** and confirm `donors` and `emergency_requests` exist.
7. Open **Project Settings → API** (the dashboard labels may vary). Copy the project URL and the server-side secret key. Use a secret/server key only on the backend; never use it in browser code or GitHub.

The SQL enables Row Level Security (RLS) and intentionally creates no browser-facing policies. The Express server performs database operations with a server-side key after validating requests. Do not expose that key.

## 8. Configure environment variables

From the project root, copy `backend/.env.example` to `backend/.env` (on Windows PowerShell):
```powershell
Copy-Item backend/.env.example backend/.env
```
Edit `backend/.env` and replace placeholders:
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SIDE_SECRET_KEY
```
Use your own values. These example strings are not real credentials. `.env` is private local configuration and is ignored by Git; `.env.example` documents the required names and is safe to commit.

## 9. Install and run

Open a terminal in the project root, then:
```bash
cd backend
npm install
npm run check
npm start
```
Expected output:
```text
BloodLink running at http://localhost:3000
```
Keep the terminal running and open http://localhost:3000 in your browser. Do not open `index.html` directly, because the app uses the Express API.

Check server health at http://localhost:3000/api/health. `databaseConfigured` should be `true` after setting the URL and key. This health check confirms configuration is present, not that a real database query succeeded. To verify the connection, load the donor list or submit a test registration.

## 10. Architecture

1. Browser loads HTML, CSS and JavaScript served from `frontend/`.
2. Frontend `fetch()` calls `/api/donors` and `/api/requests`.
3. Express routes validate all submitted data on the server.
4. `@supabase/supabase-js` sends queries to Supabase PostgreSQL using a server-only key.
5. PostgreSQL constraints enforce valid blood groups, unique donor phone numbers, valid unit counts, and request statuses.

## 11. API endpoints

All endpoints return JSON. Public endpoints are rate-limited; there is no user login in this MVP.

| Method | Path | Purpose | Body / query | Success |
|---|---|---|---|---|
| GET | `/api/health` | Check server and config | None | `200 { status, databaseConfigured }` |
| GET | `/api/donors` | List consented donors | Optional `bloodGroup`, `city` query | `200 { donors, total }` |
| POST | `/api/donors` | Register donor | `fullName`, `bloodGroup`, `city`, `area`, `phone`, optional `email`, boolean `available`, boolean `consent: true` | `201 { donor }` |
| GET | `/api/requests` | List open requests | None | `200 { requests, total }` |
| POST | `/api/requests` | Create emergency request | `requesterName`, `bloodGroup`, `unitsNeeded`, `city`, `hospital`, `phone`, future `neededBy`, optional `details` | `201 { request }` |

Common errors: `400` invalid input, `409` duplicate donor phone, `404` unknown API path, `429` rate limit exceeded, `503` missing database configuration, `500` unexpected server/database failure. The backend avoids returning raw database errors.

### Example API requests

```bash
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/donors?bloodGroup=O%2B&city=Hyderabad"
curl http://localhost:3000/api/requests
```

To create a donor with PowerShell or another REST client, send JSON:
```json
{
  "fullName": "Demo Donor",
  "bloodGroup": "O+",
  "city": "Hyderabad",
  "area": "Secunderabad",
  "phone": "+91 90000 00000",
  "email": "",
  "available": true,
  "consent": true
}
```
Use fake data for demonstrations unless you have informed consent to use real details.

## 12. Test checklist

1. Open the homepage; donor and request sections should load.
2. Submit a donor with all required fields and consent checked; it should appear in the directory.
3. Search by a valid blood group and city; matching donors should appear.
4. Submit without consent; the backend should reject the registration.
5. Submit the same phone twice; the second attempt should return a duplicate error.
6. Submit an emergency request with a future date; it should appear in Recent blood requests.
7. Submit a past date, invalid blood group, invalid phone, or units outside 1–20; the backend should reject it.
8. Leave required fields blank; browser validation should prevent submission.
9. Temporarily use an invalid Supabase key; database actions should show a friendly error and server logs should contain diagnostic details.
10. Resize the browser to mobile width; navigation, forms, and cards should stack without horizontal scrolling.
11. Open `/api/health`; verify the JSON status. Remember that config presence alone is not a full database connectivity test.

## 13. Troubleshooting

- **`npm` is not recognized:** install Node.js LTS and reopen VS Code/terminal.
- **`Cannot find module`:** run `npm install` inside `backend/`.
- **`Database is not configured yet`:** check `backend/.env`, variable names, and restart the server after editing.
- **Database error or blank list:** verify the SQL ran successfully and the Supabase URL/key belong to the same project.
- **Port already in use:** set another `PORT` in `.env`, such as `3001`, then restart.
- **Browser shows a 404:** start the app with `npm start` from `backend/` and visit `http://localhost:3000`, not the HTML file directly.
- **No donors appear:** the database may be empty. Register a clearly labelled demo donor, or use test data in a development database.

## 14. Security and privacy notes

- Never put `SUPABASE_SECRET_KEY` in frontend files, screenshots, public issues, or GitHub.
- Public listings reveal phone numbers and requester contact details. The donor form requires consent, but the MVP does not yet provide a self-service unlisting or deletion workflow.
- Use fictional test data for classroom demonstrations.
- This student MVP has no authentication, admin moderation, or ownership controls. Do not deploy it with real sensitive data without adding these controls and reviewing applicable privacy requirements.
- The application is not a medical service. Donor eligibility and blood compatibility must be assessed by qualified healthcare staff.

## 15. Git and GitHub

Create a new empty repository on https://github.com/ (do not add a README there if this project already has one). From the project root:
```bash
git init
git status
git add .
git status
git commit -m "Build BloodLink project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL. Check the second `git status` output before committing and confirm `backend/.env` is not listed. `.gitignore` does not remove secrets already committed. If a key is exposed, rotate it immediately and remove it from repository history as appropriate.

## 16. Future improvements

- Supabase Auth and role-based admin dashboard.
- Donor account verification and self-service unlisting/deletion.
- Moderation, abuse reporting, request expiry and fulfillment status updates.
- Email/SMS notifications through an approved provider.
- Tests using a dedicated test database.
- Deployment with HTTPS, backups, monitoring, and a privacy/security review.

## 17. Final verification checklist

- [ ] Supabase SQL ran and both tables exist.
- [ ] Local `.env` contains real project values and is not committed.
- [ ] `npm run check` passes.
- [ ] `/api/health` returns JSON.
- [ ] Donor registration and donor search work against Supabase.
- [ ] Emergency request creation and listing work against Supabase.
- [ ] Mobile layout has been checked.
- [ ] Git status confirms no secrets are staged.
