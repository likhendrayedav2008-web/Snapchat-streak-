require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SnapchatStrategy = require("passport-snapchat").Strategy;
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

const required = [
  "APP_BASE_URL",
  "SESSION_SECRET",
  "SNAPCHAT_CLIENT_ID",
  "SNAPCHAT_CLIENT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

if (isProduction) app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 4
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new SnapchatStrategy({
  clientID: process.env.SNAPCHAT_CLIENT_ID,
  clientSecret: process.env.SNAPCHAT_CLIENT_SECRET,
  callbackURL: `${process.env.APP_BASE_URL}/auth/snapchat/callback`,
  profileFields: ["id", "displayName"]
}, (accessToken, refreshToken, profile, done) => {
  // Never store Snapchat passwords or OAuth tokens in the database.
  done(null, {
    id: String(profile.id),
    displayName: profile.displayName || null
  });
}));

app.get("/auth/snapchat", passport.authenticate("snapchat", {
  scope: ["user.display_name"]
}));

app.get("/auth/snapchat/callback",
  passport.authenticate("snapchat", { failureRedirect: "/?login=failed" }),
  async (req, res) => {
    const event = {
      provider: "snapchat",
      provider_user_id: req.user.id,
      display_name: req.user.displayName,
      status: "success",
      logged_in_at: new Date().toISOString()
    };

    const { error } = await supabase.from("login_events").insert(event);
    if (error) {
      console.error("Supabase insert failed:", error.message);
      return res.redirect("/?login=success&log=failed");
    }
    return res.redirect("/?login=success");
  }
);

app.get("/api/session", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    user: {
      displayName: req.user.displayName,
      provider: "snapchat"
    }
  });
});

app.post("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect("/"));
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`App listening on port ${port}`));
