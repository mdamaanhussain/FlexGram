const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const multer = require("multer");
const session = require("express-session");
const methodOverride = require("method-override");
const { GridFSBucket, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/flexgram";
const ADMIN_USERNAME = "amaanhussain786_";
const ADMIN_PASSWORD = "admin@123";
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");
const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const postSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    caption: { type: String, required: true },
    image: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    comments: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

const Post = mongoose.model("Post", postSchema);

function isAdminUser(user) {
  return Boolean(user && user.isAdmin);
}

function canManagePost(user, post) {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  return post.username === user.username;
}

function buildSessionUser(username) {
  return {
    username,
    isAdmin: username === ADMIN_USERNAME
  };
}

function validateLogin(username, password) {
  if (!username) return { valid: false, error: "Username is required" };
  if (!password) return { valid: false, error: "Password is required" };

  if (username === ADMIN_USERNAME && password !== ADMIN_PASSWORD) {
    return { valid: false, error: "Invalid admin password" };
  }

  if (username !== ADMIN_USERNAME && password.length < 4) {
    return { valid: false, error: "Password must be at least 4 characters" };
  }

  return { valid: true, user: buildSessionUser(username) };
}

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

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const extname = ALLOWED_IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase());
    const mimetype = ALLOWED_IMAGE_TYPES.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }

    cb("Error: Images only!");
  }
});

function getGridFSBucket() {
  return new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
}

async function uploadImageToGridFS(file) {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB is not connected");
  }

  const bucket = getGridFSBucket();
  const fileId = new ObjectId();

  await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStreamWithId(fileId, file.originalname, {
      contentType: file.mimetype,
      metadata: { uploadedAt: new Date() }
    });

    uploadStream.on("finish", resolve);
    uploadStream.on("error", reject);
    uploadStream.end(file.buffer);
  });

  return `/files/${fileId.toString()}`;
}

async function deleteStoredImage(imageUrl) {
  if (!imageUrl) return;

  if (imageUrl.startsWith("/files/")) {
    const fileId = imageUrl.split("/files/")[1];
    if (!ObjectId.isValid(fileId) || !mongoose.connection.db) return;

    try {
      const bucket = getGridFSBucket();
      await bucket.delete(new ObjectId(fileId));
    } catch (err) {
      console.error("GridFS delete error:", err.message);
    }
    return;
  }

  if (imageUrl.startsWith("/uploads/")) {
    const fileName = imageUrl.replace("/uploads/", "");
    const filePath = path.join(UPLOADS_DIR, fileName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Local file delete error:", err.message);
    }
  }
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "flexgram-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.get("/", (req, res) => res.redirect("/posts"));

app.get("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).send("Invalid image id");
    }

    const bucket = getGridFSBucket();
    const file = await bucket.find({ _id: new ObjectId(fileId) }).next();

    if (!file) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", file.contentType || "application/octet-stream");
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

    downloadStream.on("error", () => res.status(404).send("Image not found"));
    downloadStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading image from MongoDB");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/posts");
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();
  const result = validateLogin(username, password);

  if (!result.valid) {
    return res.status(400).render("login", { error: result.error });
  }

  req.session.user = result.user;
  res.redirect("/posts");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/posts", async (req, res) => {
  const posts = await Post.find().sort({ timestamp: -1 }).lean();
  res.render("index", { posts, user: req.session.user || null });
});

app.get("/posts/new", requireAuth, (req, res) => {
  res.render("new", { user: req.session.user });
});

app.post("/posts", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      throw new Error("No image uploaded");
    }

    const imagePath = await uploadImageToGridFS(req.file);

    await Post.create({
      username: req.session.user.username,
      caption,
      image: imagePath,
      likes: 0,
      likedBy: [],
      comments: [],
      timestamp: new Date()
    });

    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

app.get("/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");

  res.render("show", { post, user: req.session.user || null });
});

app.get("/posts/:id/edit", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");
  if (!canManagePost(req.session.user, post)) {
    return res.status(403).send("You are not allowed to edit this post");
  }

  res.render("edit", { post, user: req.session.user });
});

app.patch("/posts/:id", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");
  if (!canManagePost(req.session.user, post)) {
    return res.status(403).send("You are not allowed to edit this post");
  }

  if (req.body.caption) {
    post.caption = req.body.caption;
    await post.save();
  }

  res.redirect(`/posts/${post._id}`);
});

app.delete("/posts/:id", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");
  if (!canManagePost(req.session.user, post)) {
    return res.status(403).send("You are not allowed to delete this post");
  }

  await deleteStoredImage(post.image);
  await Post.findByIdAndDelete(req.params.id);
  res.redirect("/posts");
});

app.post("/posts/:id/like", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");

  const currentUser = req.session.user.username;

  if (!post.likedBy.includes(currentUser)) {
    post.likedBy.push(currentUser);
    post.likes = post.likedBy.length;
    await post.save();
  }

  res.redirect("/posts");
});

app.get("/test-images", (req, res) => {
  res.send(`
    <h1>Image Path Test</h1>
    <img src="/uploads/sunset.jpg" width="300">
    <img src="/uploads/travel.jpg" width="300">
    <p>If these images display, your static files are configured correctly</p>
  `);
});

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

startServer();
