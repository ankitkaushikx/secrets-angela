import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import ejs from "ejs";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
// ?------------------------------------------------MIDDLEWARES----///////////////////////////////////

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
});

ListSchema.plugin(passportLocalMongoose);
const List = new mongoose.model("list", ListSchema);
ListSchema.plugin(passportLocalMongoose);

passport.use(List.createStrategy());

passport.serializeUser(List.serializeUser());
passport.deserializeUser(List.deserializeUser());

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
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.post("/register", async (req, res) => {
  List.register({ username: req.body.username }, req.body.password, function (err, list) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", async (req, res) => {});

// ?----------------------------------------------------------ENDOFIT-----///////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SERVER STARTED AT ${PORT}`);
});
