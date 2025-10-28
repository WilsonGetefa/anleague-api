# African Nations League (ANL) Application

Welcome to the African Nations League (ANL) application! This is a web-based platform built with Node.js and Express to simulate and manage a tournament featuring African national football teams. Users can view brackets, rankings, and team details, while administrators have the ability to start, simulate, and advance the tournament.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features
- **Tournament Management**: Start, simulate, and advance a tournament with quarterfinals, semifinals, and final stages.
- **User Authentication**: Login and signup functionality with admin and user roles.
- **Admin Dashboard**: Exclusive access for admins to control tournament stages, simulate matches, and restart tournaments.
- **Bracket View**: Display the current tournament bracket with team names, scores, and statuses.
- **Rankings**: View top goal scorers across all matches, including historical data.
- **Team Management**: View and manage team information.
- **Historical Data**: Archive completed tournaments and display past champions.

## Prerequisites
- Node.js (v18.20.8 or later)
- MongoDB (local instance or remote connection via URI)
- npm (Node Package Manager)
- Git (for version control)

## Installation
1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/anleague-nodejs.git
   cd anleague-nodejs
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```
     PORT=3000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     ```
   - Replace `your_mongodb_connection_string` with your MongoDB URI (e.g., `mongodb://localhost:27017/anleague`) and `your_jwt_secret_key` with a secure random string.

4. **Initialize the Database**
   - Ensure MongoDB is running locally or remotely.
   - The application will create the `anleague` database and collections (`Tournament`, `Match`, `PastTournament`, `Team`, etc.) on first run.

## Usage
1. **Start the Application**
   ```bash
   npm start
   ```
   - The server will run on `http://localhost:3000` (or the port specified in `.env`).

2. **Access the Application**
   - Open a web browser and navigate to `http://localhost:3000`.
   - Use the navigation bar to explore Home, Bracket, Rankings, and Teams pages.
   - Log in or sign up to access user-specific features (e.g., Dashboard for users, Admin Dashboard for admins).

3. **Admin Actions**
   - Log in with an admin account (e.g., username: `wilson_W`, role: `admin`).
   - Visit `/admin/dashboard` to:
     - Start a new tournament.
     - Simulate matches.
     - Advance to the next stage.
     - Restart the tournament (archives the current one and clears non-completed data).

## API Endpoints
- **Public Routes**
  - `GET /` - Home page with current tournament status and past champions.
  - `GET /bracket` - View the current tournament bracket.
  - `GET /rankings` - Display top goal scorers (supports JSON format with `?format=json`).
  - `GET /teams` - View team information.

- **Auth Routes** (handled by `/auth` router)
  - `GET /login` - Login page.
  - `POST /login` - Authenticate user.
  - `GET /signup` - Signup page.
  - `POST /signup` - Register new user.
  - `GET /logout` - Log out user.

- **Admin Routes** (requires admin role)
  - `GET /admin/dashboard` - Admin dashboard.
  - `POST /admin/start` - Start a new tournament.
  - `POST /admin/simulate` - Simulate pending matches.
  - `POST /admin/advance` - Advance to the next tournament stage.
  - `POST /admin/restart` - Restart the tournament and archive the current one.
  - `POST /admin/edit-match` - Update match scores (to be implemented).

## Development
### Running in Development Mode
```bash
npm run dev
```
- Uses `nodemon` to automatically restart the server on file changes (install `nodemon` globally or add it as a dev dependency).

### Directory Structure
- `anleague_app.js` - Main application file.
- `routes/` - Route handlers (e.g., `auth.js`, `admin.js`, `public.js`, `index.js`).
- `models/` - Mongoose schemas (e.g., `tournament.js`, `match.js`, `pastTournament.js`, `team.js`).
- `views/` - EJS templates (e.g., `index.ejs`, `admin_dashboard.ejs`).
- `public/` - Static files (e.g., `css/styles.css`, `images/caf.png`).
- `.env` - Environment variables.

### Adding Features
- Fork the repository.
- Create a new branch: `git checkout -b feature-name`.
- Implement your changes and commit: `git commit -m "Add feature-name"`.
- Push to the branch: `git push origin feature-name`.
- Submit a pull request.

## Contributing
1. **Fork the Repository**
   - Create your own copy of the project.

2. **Create a Feature Branch**
   - Work on new features or bug fixes in a separate branch.

3. **Submit a Pull Request**
   - Provide a clear description of your changes and why they are needed.

4. **Code Standards**
   - Follow JavaScript/ESLint conventions.
   - Write comments for complex logic.
   - Test changes thoroughly.

5. **Issues**
   - Report bugs or suggest features via GitHub Issues.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
- **Author**: [Your Name]
- **Email**: your.email@example.com
- **GitHub**: [https://github.com/yourusername](https://github.com/yourusername)
- **Created**: October 27, 2025
