import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Keep this strictly isolated to the server, do not export it to the client
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API router
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example Roblox OAuth endpoint (placeholder layout)
  apiRouter.get("/auth/roblox/url", (req, res) => {
    const clientId = process.env.ROBLOX_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || ('http://localhost:' + PORT)}/api/auth/roblox/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: "Missing ROBLOX_CLIENT_ID" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile',
    });

    const url = `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;
    res.json({ url });
  });

  // Roblox OAuth Callback
  apiRouter.get("/auth/roblox/callback", async (req, res) => {
    // This is where you would exchange the code for the token,
    // fetch the Roblox User ID, and mint a Supabase token or session.
    // For now we will return a script that handles popup messaging.
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication complete. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
