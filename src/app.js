const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const methodOverride = require("method-override");

const { MONGO_URI, PORT, SESSION_SECRET, UPLOADS_DIR } = require("./config/appConfig");
const Post = require("./models/Post");
const postRoutes = require("./routes/postRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.get("/", (req, res) => res.redirect("/posts"));
app.use(postRoutes);

async function seedDefaultPosts() {
  const totalPosts = await Post.countDocuments();
  if (totalPosts > 0) return;

  const defaultPosts = [
    {
      username: "amaanhussain786_",
      caption: "Enjoying the sunset 🌅 #nature",
      image: "/uploads/sunset.jpg",
      likes: 42,
      likedBy: ["user1", "user2"],
      comments: [],
      timestamp: new Date()
    },
    {
      username: "haniauwuwu_",
      caption: "Queen lies here !!",
      image: "/uploads/hania.jpeg",
      likes: 42,
      likedBy: ["user3", "user4"],
      comments: [],
      timestamp: new Date()
    },
    {
      username: "dure4u",
      caption: "Exploring new places ✈️ #travel",
      image: "/uploads/travel.jpg",
      likes: 89,
      likedBy: ["user5", "user6"],
      comments: [],
      timestamp: new Date()
    }
  ];

  await Post.insertMany(defaultPosts);
}

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    await seedDefaultPosts();

    app.listen(PORT, () => {
      console.log(`Instagram clone running on http://localhost:${PORT}`);
      console.log(`Test image paths at http://localhost:${PORT}/test-images`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

module.exports = { app, startServer };
