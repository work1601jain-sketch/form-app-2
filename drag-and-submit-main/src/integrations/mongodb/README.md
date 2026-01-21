MongoDB Integration (Compass & Atlas Data API)

Setup summary
- Install MongoDB Compass to browse your Atlas cluster locally.
- Create a MongoDB Atlas project and cluster.
- Enable the Data API for your App and create an API Key.
- Create a database (default `formsdb`) with collections `forms` and `form_submissions`.
- Add the following Vite env variables (e.g. in `.env`):

VITE_MONGODB_DATA_API_URL="https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1"
VITE_MONGODB_DATA_API_KEY="<your-data-api-key>"
VITE_MONGODB_DATA_SOURCE="Cluster0"
VITE_MONGODB_DATABASE="formsdb"

Notes
- This frontend uses the Atlas Data API via `src/integrations/mongodb/client.ts`.
- For production you should proxy requests through a backend instead of exposing a Data API key in the browser.
- Use MongoDB Compass to inspect documents and indexes while migrating data from Supabase/Postgres.

Local MongoDB / Compass
- To run locally with MongoDB Compass (default port 27017) use the provided backend proxy:

  1. Start a local MongoDB server (or run via Docker):

	  docker run -d --name mongo -p 27017:27017 mongo:6

  2. Install and open MongoDB Compass and connect to `mongodb://127.0.0.1:27017`.

  3. Start the small Express backend included at `server/` which the frontend will call when
	  `VITE_MONGODB_DATA_API_URL` and `VITE_MONGODB_DATA_API_KEY` are NOT set.

	  cd server
	  npm install
	  npm start

  4. The server defaults to connecting to `mongodb://127.0.0.1:27017` and uses database `formsdb`.
	  You can customize these in `server/.env`.

  5. Run the frontend from the inner project folder and it will automatically use the local backend:

	  cd ..\
	  npm run dev

Notes
- This setup is intended for local development and testing. In production, proxy requests through a secure backend and do not expose database credentials in client-side env files.

