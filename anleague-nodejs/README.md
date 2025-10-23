African Nations League Simulator
A web interface to simulate a football tournament for African nations, with team sign-ups, squad management, bracket, match simulation/play, and public views.
Setup Locally

# African Nations League
- **Deployed URL**: https://anleague-api.onrender.com
- **Admin Login**: Username: admin, Password: admin123
- **Database**: MongoDB Atlas, `anleague` database. Collaborators (`ammarcanani@gmail.com`, `elsje.scott@uct.ac.za`) invited with read/write access (pending acceptance as of 10/23/25).
- **Demo**: 7 teams pre-loaded (Nigeria, Angola, Cape Verde, South Africa, Mali, Côte d'Ivoire, DR Congo). Add 8th team (e.g., Egypt) via `/auth/signup` and `/teams/create` or `/teams/autofill`.
- **Test Instructions**:
  1. Visit `/` for home page.
  2. Signup: `POST /auth/signup`
  3. Autofill teams: `POST /teams/autofill`
  4. Start tournament: `POST /admin/start`
  5. Simulate/play matches: `POST /admin/simulate`, `/admin/play`
  6. View bracket/rankings: `GET /bracket`, `/rankings`

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
