# African Nations League (ANL) Application

Welcome to the **African Nations League (ANL)** — a **full-featured, production-ready web application** that simulates a **realistic African football tournament** with **8 national teams**, **real player names**, **goal scorers**, **match commentary**, **historical archives**, and **admin controls**.

Built with **Node.js, Express, MongoDB, and EJS**, this app is **ready for deployment** on platforms like **Render**, **Railway**, or **Vercel**.

---

## Features

| Feature | Description |
|-------|-----------|
| **Real Player Names** | Goals attributed to real players like **Yahia Fofana**, **Victor Osimhen**, **Franck Kessié** |
| **Tournament Simulation** | Auto-simulate matches with random scores and commentary |
| **Bracket View** | Live bracket with quarterfinals, semifinals, and final |
| **Top Scorers Rankings** | All-time and per-tournament goal leaderboards |
| **Past Tournaments Archive** | View winners, runners-up, and full match history |
| **Admin Dashboard** | Full control: simulate, advance, restart, archive |
| **JWT Authentication** | Secure login with `httpOnly` cookies |
| **Responsive Design** | Works on mobile and desktop |
| **CLI Scripts** | Full test suite for seeding, simulating, and resetting |

---

## Prerequisites

| Tool | Version |
|------|--------|
| **Node.js** | `v18.20.8` or later |
| **MongoDB** | Local or Atlas (`MONGO_URI`) |
| **npm** | `v9+` |
| **Git** | For version control |

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/anleague-nodejs.git
cd anleague-nodejs

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
```

### `.env` Configuration

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/anleague
JWT_SECRET=your-super-secret-jwt-key-here-12345
NODE_ENV=development
```

> Use a **strong, random** `JWT_SECRET` (e.g., from [djecrety.ir](https://djecrety.ir))

---

## Usage

### Start the App

```bash
npm start
# or for development with auto-restart
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

### Default Admin Account

| Username | Password | Role |
|---------|----------|------|
| `wilson_W` | `admin123` | `admin` |

> Change this immediately in production!

---

## Admin Actions (via Dashboard)

| Button | Action |
|-------|-------|
| **Start Tournament** | Creates bracket with 8 teams |
| **Simulate Matches** | Auto-plays all pending matches |
| **Advance Stage** | Move from quarterfinals to semifinals to final |
| **Restart Tournament** | Archives current + starts fresh |

---

## API Endpoints

### Public Routes

| Route | Method | Description |
|------|--------|-----------|
| `GET /` | | Home page with status |
| `GET /bracket` | | Live tournament bracket |
| `GET /rankings` | | Top goal scorers |
| `GET /rankings?format=json` | | JSON API for rankings |
| `GET /teams` | | All team squads |

### Auth Routes

| Route | Method | Description |
|------|--------|-----------|
| `GET /login` | | Login page |
| `POST /login` | | Authenticate |
| `GET /signup` | | Register |
| `POST /signup` | | Create user |
| `GET /logout` | | Clear session |

### Admin Routes (Protected)

| Route | Method | Description |
|------|--------|-----------|
| `GET /admin/dashboard` | | Admin panel |
| `POST /admin/start` | | Start new tournament |
| `POST /admin/simulate` | | Simulate pending matches |
| `POST /admin/advance` | | Advance to next stage |
| `POST /admin/restart` | | Archive & restart |

---

## CLI Scripts (`scripts/`)

Run with `node scripts/<name>.js`

| Script | Purpose |
|-------|--------|
| `reset.js` | Delete all matches, tournaments, past |
| `seedTeams.js` | Add 8 teams with full squads |
| `seedTournament.js` | Create bracket + matches |
| `startTournament.js` | Set status to `quarterfinals` |
| `simulateAll.js` | Auto-run all stages |
| `advanceStage.js` | Move to next stage |
| `restartTournament.js` | Archive + clear current |

### Example Flow

```bash
node scripts/reset.js
node scripts/seedTeams.js
node scripts/seedTournament.js
node scripts/startTournament.js
node scripts/simulateAll.js
```

---

## Development

### Project Structure

```
anleague-nodejs/
├── models/           # Mongoose schemas
├── routes/           # Express routers
├── views/            # EJS templates
├── public/           # CSS, images, JS
├── middleware/       # JWT auth
├── controllers       # players
├── anleague_app.js   # Entry point
└── package.json
```

### Add New Feature

```bash
git checkout -b feature/player-photos
# code...
git commit -m "Add player photos to rankings"
git push origin feature/player-photos
```

---

## Contributing

1. **Fork** the repo
2. **Create** a branch: `git checkout -b fix/bug-name`
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

### Code Style
- Use **ESLint** (add later)
- **Comment** complex logic
- **Test** all changes

---

## Deployment

### Deploy to **Render** (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. New **Web Service**
4. Connect GitHub repo
5. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add env vars: `MONGO_URI`, `JWT_SECRET`, `PORT`

Done! Your app is live.

---

## Security

- JWT stored in `httpOnly` cookie
- Passwords hashed with `bcrypt`
- Input validation in routes
- Admin-only routes protected

---

## License

```
MIT License
```

See [LICENSE](LICENSE) for full text.

---

## Contact

- **Author**: Wilson W
- **Email**: wilson@example.com
- **GitHub**: [github.com/yourusername](https://github.com/yourusername)
- **Created**: October 27, 2025
- **Version**: 1.0.0

---

> **"Simulate the passion. Celebrate the champions."**  
> — African Nations League

---

**Ready to deploy?**  
Run `npm start` and watch **Victor Osimhen score hat-tricks**!

Let me know when you go live — I’ll share it with the world!