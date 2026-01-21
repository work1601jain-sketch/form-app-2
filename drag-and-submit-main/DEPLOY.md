Deployment instructions

1) Build and run locally (production-like):

```bash
# build frontend
npm ci
npm run build

# start backend (it will serve the built frontend from /dist)
cd server
npm ci
node index.js
```

Open http://localhost:3001

2) Docker (recommended for single-host deployment):

```bash
# build image
docker build -t drag-and-submit:latest .

# run (map port and provide envs via .env file or -e flags)
docker run -p 3001:3001 --env-file .env -d drag-and-submit:latest
```

3) Vercel / Serverless

This repo ships a separate Express server in `/server` which is not currently in Vercel Serverless function format. You can either:

- Deploy the frontend to Vercel and the backend to a separate provider (Railway, Render, Heroku, etc.), then set `VITE_BACKEND_URL` to the backend URL.
- Or convert the Express routes into Vercel Serverless functions under `/api`.

If you want, I can convert the server into Vercel functions for you.
