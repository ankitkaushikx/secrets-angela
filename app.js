import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
// import ejs from "ejs";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

// ?------------------------------------------------MIDDLEWARES----///////////////////////////////////

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// ?------------------------------------------------CONNECTIONS----/////////////////////////////////////////////////////////////////
app.use(
  session({
    secret: "ankit kaushik.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
const uri = "mongodb://127.0.0.1/students";

mongoose.connect(uri);

// ? SCHEMA READY
const ListSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
});

ListSchema.plugin(passportLocalMongoose);
const List = new mongoose.model("list", ListSchema);
ListSchema.plugin(passportLocalMongoose);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
ListSchema.plugin(findOrCreate);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        console.log(profile);
        // Try to find a user with the Google ID in the database
        const existingUser = await List.findOne({ googleid: profile.id });

        if (existingUser) {
          // If user exists, return the user
          return cb(null, existingUser);
        } else {
          // If user doesn't exist, create a new user
          const newUser = new List({
            // Adjust as needed
            googleId: profile.id,
            username: profile.displayName,
            // Add other fields as needed
          });

          // Save the new user to the database
          await newUser.save();

          // Return the newly created user
          return cb(null, newUser);
        }
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

// !---------------------------------------------------ROUTES---///////////////////////////////////////////////////////////////////
app.get("/", async (req, res) => {
  try {
    res.render("home"); // Assuming you have an "index.ejs" file in your "views" folder
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.log(err);
    } else res.redirect("/");
  });
});
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), function (req, res) {
  res.redirect("/secrets");
});

app.post("/register", async (req, res) => {
  // Use the List model directly for registration
  List.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.redirect("/register");
    }

    // Authenticate the registered user and redirect to secrets
    passport.authenticate("local")(req, res, function () {
      res.redirect("/secrets");
    });
  });
});

app.post("/login", async (req, res) => {
  const list = new List({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(list, function (err) {
    if (err) {
      console.log(err);
      redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

// ?----------------------------------------------------------ENDOFIT-----///////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SERVER STARTED AT ${PORT}`);
});
