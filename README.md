# PFA Fullstack Application (Node.js + Angular)

This repository contains a professional starter fullstack application using Node.js/Express for the backend and Angular for the frontend, designed to use MongoDB Atlas in production.

What's included (initial):
- Backend: Express, Mongoose, JWT auth (register/login), Task resource CRUD
- Dockerfile for backend and a `docker-compose.yml` for local development (uses Atlas for DB)
- `backend/.env.example` with required variables

Quick start (backend):

1. Copy environment file:

   - Create `backend/.env` from `.env.example` and fill in your MongoDB Atlas URI and `JWT_SECRET`.

2. Install and run locally:

   ```powershell
   cd backend; npm install; npm run dev
   ```

3. Or run with Docker (requires env vars set):

   ```powershell
   docker compose up --build
   ```

Frontend: an Angular app scaffold will be added next. For fast progress I scaffolded a complete backend first so you can verify API and Atlas connection.

Deployment notes:
- Use MongoDB Atlas and set `MONGO_URI` in your server environment.
- Build the Angular app for production and serve using Nginx, and point your domain `https://www.nacer-dev.me/` to your server IP. Use Certbot to obtain TLS certs.

Next steps:
- Create Angular frontend with auth and Task CRUD UI (done: scaffold and basic components)
- Add Nginx Dockerfile and production multi-stage builds (done)
- Add CI workflow and tests

Quick production deploy (recommended)

1. Create a `.env.prod` (or export env vars) containing at least:

   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret

2. Build and start production containers:

   ```powershell
   # from repository root
   docker compose -f docker-compose.prod.yml up --build -d
   ```

3. Point your domain `https://www.nacer-dev.me/` to the server running the containers (A record to server IP). Then run Certbot on the host to obtain certificates (or use a reverse proxy that handles TLS). The `docker-compose.prod.yml` serves the frontend on port 80; you should place an additional reverse proxy in front for TLS termination or run Certbot + Nginx on the host and proxy to the container.

Notes about domain & TLS
- For simplicity I recommend using a small VPS (Ubuntu) and running `docker compose` there. Use Certbot to request certificates and configure host-level Nginx to proxy to the container's port 80, or adjust the frontend container to serve TLS directly using certs mounted into it (more advanced).

If you want, I can now:
- add a small host-level deployment guide for Ubuntu + Certbot + Docker (step-by-step),
- or add GitHub Actions to build the images and push them to Docker Hub / GitHub Container Registry and then deploy.

If this initial backend looks good, I will continue immediately with the Angular frontend scaffolding and deployment files.
