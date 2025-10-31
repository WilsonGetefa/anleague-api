# African Nations League (ANL) Application

Welcome to the **African Nations League (ANL)** — a fully interactive, immersive web platform for simulating and experiencing African national football tournaments. Built with **Node.js, Express, MongoDB, and EJS**, ANL delivers real-time match simulation, live commentary, audio narration, goal celebrations, and a dynamic tournament experience.

---

## Table of Contents
- [New Features (v2.0)](#new-features-v20)
- [Core Features](#core-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Audio & Immersive Experience](#audio--immersive-experience)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## New Features (v2.0)

| Feature | Description |
|--------|-------------|
| **Live Audio Commentary** | Full match commentary read aloud using browser **Text-to-Speech (TTS)** |
| **Goal Celebration Sound** | Realistic **goal cheer SFX** plays for every goal scored |
| **Auto-Play & Voice Selection** | Toggle auto-play, choose from **100+ system voices** |
| **Staggered Goal Animations** | Goals appear in chronological order with **fade-in + sound** |
| **Audio Unlock System** | One-click unlock ensures **100% compatibility** with Chrome, Safari, Firefox |
| **Live Goal Sync** | Player goals in **Teams page** now **update instantly** from match results |
| **Performance Optimized** | Goal aggregation uses **single MongoDB query** — loads in **< 200ms** |

> **All audio features require one user click** (browser policy) — handled gracefully.

---

## Core Features

- **Tournament Management**: Start, simulate, and advance through **quarterfinals → semifinals → final**
- **User Authentication**: Secure login/signup with **JWT**, role-based access (`user`, `admin`)
- **Admin Dashboard**: Full control — simulate, advance, restart, archive
- **Interactive Bracket**: Real-time scores, status badges, clickable match links
- **Live Rankings**: Top goal scorers updated **after every match**
- **Team Management**: Full squad view with **ratings, positions, captain, live goals**
- **Historical Archive**: Completed tournaments saved in `pasttournaments` with winners
- **Responsive Design**: Mobile-first UI with **smooth hover effects, grid layouts**

---

## Prerequisites

| Tool | Version |
|------|--------|
| Node.js | `v18.20.8+` |
| MongoDB | Local or Atlas (`mongodb://...`) |
| npm | `9+` |
| Git | Latest |

---

## Installation

```bash
git clone https://github.com/yourusername/anleague-nodejs.git
cd anleague-nodejs
npm install
```

### `.env` Configuration

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/anleague
JWT_SECRET=your_very_secure_jwt_secret_2025
```

### Start MongoDB

```bash
mongod
```

### Run the App

```bash
npm start
# or
npm run dev   # with nodemon
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Usage

### Public Users
- View **Bracket**, **Rankings**, **Teams**
- Watch **live match simulation**
- **Hear commentary + goal sounds**

### Logged-In Users
- Access **Dashboard**
- Create/manage your team (autofill available)

### Admin (`wilson_W`)
- Go to **/admin/dashboard**
- **Start Tournament** → **Simulate Matches** → **Advance Stage** → **Restart**

---

## Audio & Immersive Experience

### How to Use Audio

1. Open any **completed match** (`/match/:id`)
2. Click **"Unlock Sound & Commentary"** (one-time)
3. **Goal sounds play** in order
4. **Commentary auto-plays** (toggleable)
5. Use **Play / Pause / Replay / Voice Select**

### File Structure

```
public/
└── sfx/
    └── goal.mp3    ← Download from freesound.org
```

> **Pro Tip**: Use a 3–5 second crowd cheer for best effect.

---

## API Endpoints

### Public
| Route | Description |
|------|-------------|
| `GET /` | Home + past champions |
| `GET /bracket` | Tournament bracket |
| `GET /rankings` | Live goal scorers |
| `GET /teams` | All teams with **live goals** |
| `GET /match/:id` | Match details + **audio** |

### Auth
| Route | Description |
|------|-------------|
| `GET/POST /login` | Login |
| `GET/POST /signup` | Register |
| `GET /logout` | Logout |

### Admin Only
| Route | Description |
|------|-------------|
| `GET /admin/dashboard` | Admin panel |
| `POST /admin/start` | Begin tournament |
| `POST /admin/simulate` | Run pending matches |
| `POST /admin/advance` | Next stage |
| `POST /admin/restart` | Archive & reset |

---

## Development

### Project Structure

```
anleague-nodejs/
├── models/           ← Mongoose schemas
├── routes/           ← Express routers
├── views/            ← EJS templates
├── public/
│   ├── css/
│   ├── js/
│   └── sfx/          ← goal.mp3
├── middleware/       ← auth, ownsTeam
├── anleague_app.js   ← Main server
└── .env
```

### Key Models

```js
// models/match.js
goal_scorers: [
  { player_name: String, minute: Number, team: String }
]
```

```js
// models/team.js
squad: [
  { name, ratings: {GK,DF,MD,AT}, goals: Number, ... }
]
```

---

### Performance Tips

- **Index goal scorers**:
  ```js
  db.matches.createIndex({ "goal_scorers.player_name": 1 })
  ```
- **Cache goal counts** (optional Redis)

---

## Contributing

1. **Fork** the repo
2. Create branch: `feature/audio-enhancements`
3. Commit: `git commit -m "Add TTS + goal SFX"`
4. Push & **Pull Request**

### Code Style
- ESLint-ready
- Use `async/await`
- Comment complex logic
- Test all new routes

---

## License

[MIT License](LICENSE) — Free to use, modify, and distribute.

---

## Contact

- **Author**: [Your Name]
- **Email**: your.email@example.com
- **GitHub**: [https://github.com/yourusername](https://github.com/yourusername)
- **Version**: `2.0.0` — Audio-Enhanced
- **Released**: **October 30, 2025**

---

> **"Feel the roar of the crowd. Hear every goal. Live the African Nations League."**

---

**Ready for the next level?**  
Let me know:  
- `Auto-simulate entire tournament with live audio`  
- `Add confetti on final whistle`  
- `Export match highlights as GIF`

Just say: **“Auto-simulate with audio”**