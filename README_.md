> African Nations League (ANL) Application

Welcome to the African Nations League (ANL) — a fullfeatured, productionready web application that simulates a realistic African football tournament with 8 national teams, real player names, goal scorers, match commentary, historical archives, and admin controls.

Built with Node.js, Express, MongoDB, and EJS, this app is ready for deployment on platforms like Render, Railway, or Vercel.



> Features

 Feature | Description 

 Real Player Names:  Goals attributed to real players like Yahia Fofana, Victor Osimhen, Franck Kessié 
 Tournament Simulation:  Autosimulate matches with random scores and commentary 
 Bracket View:  Live bracket with quarterfinals, semifinals, and final 
 Top Scorers Rankings:  Alltime and pertournament goal leaderboards 
 Past Tournaments Archive:  View winners, runnersup, and full match history 
 Admin Dashboard  Full control: simulate, advance, restart, archive 
 JWT Authentication:  Secure login with httpOnly cookies 
 Responsive Design:  Works on mobile and desktop 
 CLI Scripts : Full test suite for seeding, simulating, and resetting 



> Prerequisites

 Tool  Version 
 Node.js  v18.20.8 or later 
 MongoDB  Local or Atlas (MONGO_URI) 
 npm  v9+ 
 Git  For version control 



> Installation

bash
 1. Clone the repo
git clone https://github.com/yourusername/anleaguenodejs.git
cd anleaguenodejs

 2. Install dependencies
npm install

 3. Create .env file
cp .env.example .env


 .env Configuration

> env
PORT=3000
MONGO_URI=mongodb://localhost:27017/anleague
JWT_SECRET=yoursupersecretjwtkeyhere12345
NODE_ENV=development

> Usage

 Start the App

bash
npm start
 or for development with autorestart
npm run dev

> Visit: [http://localhost:3000](http://localhost:3000)


> Default Admin Account

 Username  Password  Role 
 wilson_W  W1!$0n$&  admin
**You can can create your own admin account**
## Create your representative account and team of your choice##
> Change this immediately in production!

 Admin Actions (via Dashboard)

 Button  Action 

`Start Tournament:  Creates bracket with 8 teams (choose randomly 8 teams)`
`Simulate Matches: Autoplays all pending matches`
`Advance Stage:  Move from quarterfinals to semifinals to final`
`Restart Tournament:  Archives current + starts fresh`

> Representative
Create account and access his own team and edit player name

 API Endpoints

 Public Routes

 Route  Method  Description 

 GET /   Home page with status 
 GET /bracket   Live tournament bracket 
 GET /rankings   Top goal scorers 
 GET /rankings?format=json   JSON API for rankings 
 GET /teams   All team squads 

 Auth Routes

 Route  Method  Description 

 GET /login   Login page 
 POST /login   Authenticate 
 GET /signup   Register 
 POST /signup   Create user 
 GET /logout   Clear session 

 Admin Routes (Protected)

 Route  Method  Description 

 GET /admin/dashboard   Admin panel 
 POST /admin/start   Start new tournament 
 POST /admin/simulate   Simulate pending matches 
 POST /admin/advance   Advance to next stage 
 POST /admin/restart   Archive & restart 

 CLI Scripts (scripts/)

Run with node scripts/<name>.js

 Development

 Project Structure


anleaguenodejs/
├── models/            Mongoose schemas
├── routes/            Express routers
├── views/             EJS templates
├── public/            CSS, images, JS
├── middleware/        JWT auth
├── controllers        players
├── anleague_app.js    Entry point
└── package.json

 Code Style
 Use ESLint (add later)
 Comment complex logic
 Test all changes

 Deployment

 Deploy to Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. New Web Service
4. Connect GitHub repo
5. Set:
    Build Command: npm install
    Start Command: npm start
    Add env vars: MONGO_URI, JWT_SECRET, PORT

 Security

 JWT stored in httpOnly cookie
 Passwords hashed with bcrypt
 Input validation in routes
 Adminonly routes protected

 License

UCT License

 Contact

 Author: Wilson W
 Email: willsonsisimi@gmail.com
 GitHub: [github.com/yourusername](https://github.com/yourusername)
 Created: October 27, 2025
 Version: 1.0.0
 
> — African Nations League

**if teams are less than 8 teams, the tournaments won't start you need 8 or more**

**Request for mongoldb has beeen send to** `ammarcanani@gmail.com`
**Request for mongoldb has beeen send to** `elsje.scott@uct.ac.za`