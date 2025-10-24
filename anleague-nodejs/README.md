African Nations League Simulator
A web interface to simulate a football tournament for African nations, with team sign-ups, squad management, bracket, match simulation/play, and public views.
Setup Locally

# African Nations League
- **Deployed URL**: https://anleague-api.onrender.com
- **Admin Login**: Username: admin, Password: admin123
- **Database**: MongoDB Atlas, `anleague` database
  - **User Data**: Stored in `anleague.users` via `/auth/signup`. Fields: `username`, `password` (hashed), `email`, `country`, `role`.
  - **Note**: Removed unintended `test` collection created during development.
  - Collaborators (`ammarcanani@gmail.com`, `elsje.scott@uct.ac.za`) invited (pending as of 10/23/25).
- **Frontend Pages**:
  - `GET /`: Home page (default landing after login)
  - `GET /bracket`: Tournament bracket
  - `GET /rankings`: Goal scorers leaderboard
  - `GET /login`: Login form
  - `GET /signup`: Signup form
  - `GET /match/:id`: Match details
- **Backend Endpoints**:
  - `POST /auth/signup`, `POST /auth/login`: User authentication
  - `POST /teams/autofill`, `POST /teams/create`: Team creation
  - `POST /admin/start`, `/admin/simulate`, `/admin/play`: Tournament management
- **Demo**:
  1. Sign up (e.g., `rep_egypt3`) at `/signup` (saves to `anleague.users`).
  2. Login at `/login` (lands on `/`).
  3. Create team via `/teams/autofill`.
  4. Start tournament with `/admin/start`.
  5. View bracket at `/bracket`.
- **Troubleshooting**:
  - If `test` collection reappears: Check codebase for `Test` model or `db.test` inserts; drop via `db.test.drop()`.
  - If signup fails with “Username or email already exists”: Verify `anleague.users` for duplicates; use unique credentials.

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
