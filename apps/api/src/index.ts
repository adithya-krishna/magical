import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { config } from "./config";
import { withAuthContext } from "./middleware/auth";
import { apiRouter } from "./routes";

const app = express();

app.use(
  cors({
    origin: [config.webUrl, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  })
);
app.all("/api/auth/sign-up", (_req, res) => {
  res.status(403).json({ error: "Sign up is disabled" });
});
app.all("/api/auth/sign-up/*", (_req, res) => {
  res.status(403).json({ error: "Sign up is disabled" });
});
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());
app.use(withAuthContext);

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", apiRouter);

const port = config.port;

app.listen(port, () => {
  console.log(`[api] listening on ${port}`);
});
