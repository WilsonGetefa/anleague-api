African Nations League Simulator
A web interface to simulate a football tournament for African nations, with team sign-ups, squad management, bracket, match simulation/play, and public views.
Setup Locally

# African Nations League
- **Deployed URL**: https://anleague-api.onrender.com
- **Admin Login**: Username: admin, Password: admin123
- **Database**: MongoDB Atlas, `anleague` database
  - **Note**: Team creation successful for Algeria.
  - **Note**: Enhanced `/teams` page with styling matching header color (#333333).
  - **Note**: Resolved duplicate index warning.
- **Frontend Pages**:
  - `GET /`: Home page
  - `GET /teams`: View all teams
  - `GET /bracket`: Tournament bracket
  - `GET /rankings`: Goal scorers leaderboard
  - `GET /login`: Login form
  - `GET /signup`: Signup form
  - `GET /match/:id`: Match details
  - `GET /dashboard`: Representative landing page
  - `GET /admin/dashboard`: Admin landing page
- **Backend Endpoints**:
  - `POST /auth/signup`, `POST /auth/login`, `GET /auth/logout`: Authentication
  - `POST /teams/autofill`: Create team
  - `GET /teams`: View teams
  - `POST /admin/start`, `/admin/simulate`, `/admin/play`, `/admin/restart`: Tournament management
- **Demo**:
  1. Sign up at `/signup` (e.g., `wilson_G`, `Algeria`, `representative`).
  2. Login at `/login` (redirects to `/dashboard`).
  3. Create team via `/teams/autofill` on `/dashboard`.
  4. Create 7 more teams for other countries.
  5. Login as admin, start tournament with `/admin/start`.
  6. View teams at `/teams`, bracket at `/bracket`, rankings at `/rankings`.
  7. Logout via `/auth/logout`.
- **Troubleshooting**:
  - If tournament issues: Check `db.tournaments` and `db.matches`.
  - If display issues: Share browser output.
  - If errors: Share Render logs.

Clone the repo: git clone <your-repo-url>
Install dependencies: npm install
Create .env file with:MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/anleague?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=sk-your-openai-key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
PORT=3000


Run: npm run dev (or npm start for production)
Access: http://localhost:3000

Deploy to Render

Push code to a GitHub repo.
Sign up at render.com, create a Web Service.
Connect your GitHub repo, set:
Runtime: Node
Build Command: npm install
Start Command: node app.js
Environment Variables: Add from .env


Deploy and access at <your-app>.onrender.com.

Admin Credentials

Username: admin
Password: admin123
Create via MongoDB shell or signup endpoint.

Features

Sign up as a representative, add team (manual or autofill with mock real-life data).
Admin: Start tournament (8 teams), simulate/play matches, reset.
Public: View bracket, match summaries, goal scorer rankings.

Notes

MongoDB Atlas for DB.
OpenAI for match commentary.
Nodemailer for email notifications.
