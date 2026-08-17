const express = require("express");
const multer = require("multer");
const path = require("path");
const Post = require("../models/Post");
const { requireAuth, validateLogin, canManagePost } = require("../middleware/auth");
const { uploadImageToS3, deleteStoredImage, getS3File } = require("../services/storageService");
const { ALLOWED_IMAGE_TYPES } = require("../config/appConfig");

const router = express.Router();

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

router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/posts");
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();
  const result = validateLogin(username, password);

  if (!result.valid) {
    return res.status(400).render("login", { error: result.error });
  }

  req.session.user = result.user;
  res.redirect("/posts");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

router.get("/posts", async (req, res) => {
  const posts = await Post.find().sort({ timestamp: -1 }).lean();
  res.render("index", { posts, user: req.session.user || null });
});

router.get("/posts/new", requireAuth, (req, res) => {
  res.render("new", { user: req.session.user });
});

router.post("/posts", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      throw new Error("No image uploaded");
    }

    const imagePath = await uploadImageToS3(req.file);

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

router.get("/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");

  res.render("show", { post, user: req.session.user || null });
});

router.get("/posts/:id/edit", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");
  if (!canManagePost(req.session.user, post)) {
    return res.status(403).send("You are not allowed to edit this post");
  }

  res.render("edit", { post, user: req.session.user });
});

router.patch("/posts/:id", requireAuth, async (req, res) => {
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

router.delete("/posts/:id", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");
  if (!canManagePost(req.session.user, post)) {
    return res.status(403).send("You are not allowed to delete this post");
  }

  await deleteStoredImage(post.image);
  await Post.findByIdAndDelete(req.params.id);
  res.redirect("/posts");
});

router.post("/posts/:id/like", requireAuth, async (req, res) => {
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

router.get("/s3-file/*fileKey", async (req, res) => {
  const fileKey = Array.isArray(req.params.fileKey)
    ? req.params.fileKey.join("/")
    : req.params.fileKey;

  console.log("S3 KEY:", fileKey);

  await getS3File(fileKey, res);
});

router.get("/test-images", (req, res) => {
  res.send(`
    <h1>Image Path Test</h1>
    <img src="/uploads/sunset.jpg" width="300">
    <img src="/uploads/travel.jpg" width="300">
    <p>If these images display, your static files are configured correctly</p>
  `);
});

module.exports = router;
