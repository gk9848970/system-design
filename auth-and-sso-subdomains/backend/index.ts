import express, {
  type Request,
  type Response,
  type CookieOptions,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const ALLOWED = new Set([
  "http://trade.lvh.me:5173",
  "http://portfolio.lvh.me:5173",
  "http://admin.lvh.me:5173",
]);

const SESSION_COOKIE = "session";
const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  domain: "lvh.me", // Host
  sameSite: "lax", // Cross-site top-level navigation attaches cookies, But not on background fetches
  secure: false, // For local development, In Prod we will have https so can flip to true
  path: "/", // Route path
  maxAge: 1000 * 60 * 4, // 4 mins
};

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      const isOriginAllowed = !!origin && ALLOWED.has(origin);
      callback(null, isOriginAllowed);
    },
    credentials: true,
  }),
);

app.post("/login", (req: Request, res: Response) => {
  const email = req.body.email as string | undefined;

  res.cookie(SESSION_COOKIE, email, SESSION_COOKIE_OPTIONS);
  res.json({ ok: true, user: { email } });
});

app.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);
  return res.json({ ok: true });
});

app.post("/refresh", (req: Request, res: Response) => {
  const email = req.cookies[SESSION_COOKIE] as string | undefined;
  if (!email) {
    return res.status(401).json({ error: "no session to refresh" });
  }
  res.cookie(SESSION_COOKIE, email, SESSION_COOKIE_OPTIONS);
  return res.json({ ok: true });
});

app.get("/me", (req: Request, res: Response) => {
  const email = req.cookies[SESSION_COOKIE] as string | undefined;
  if (email) {
    res.json({ user: { email } });
  } else {
    res.status(401).json({ error: "not authenticated" });
  }
});

app.listen(4000, () => console.log("auth server on http://api.lvh.me:4000"));
