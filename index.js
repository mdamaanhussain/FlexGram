const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');
const multer = require('multer');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Middleware setup
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(uploadsDir)); // Explicit static route for uploads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Sample data with Instagram-like posts
let posts = [
  { 
    id: uuidv4(), 
    username: "amaanhussain786_", 
    caption: "Enjoying the sunset 🌅 #nature", 
    image: "/uploads/sunset.jpg",
    likes: 42,
    comments: [],
    timestamp: new Date()
  },
  { 
    id: uuidv4(), 
    username: "haniauwuwu_", 
    caption: "Just Kidding !!", 
    image: "/uploads/hania.jpeg",
    likes: 42,
    comments: [],
    timestamp: new Date()
  },
  { 
    id: uuidv4(), 
    username: "dure4u", 
    caption: "Exploring new places ✈️ #travel", 
    image: "/uploads/travel.jpg",
    likes: 89,
    comments: [],
    timestamp: new Date()
  }
];

// Routes
app.get("/", (req, res) => res.redirect("/posts"));

app.get("/posts", (req, res) => res.render("index", { posts }));

app.get("/posts/new", (req, res) => res.render("new"));

app.post("/posts", upload.single('image'), (req, res) => {
  try {
    const { username, caption } = req.body;
    if (!req.file) {
      throw new Error('No image uploaded');
    }
    
    const imagePath = '/uploads/' + req.file.filename;
    
    posts.push({ 
      id: uuidv4(), 
      username, 
      caption, 
      image: imagePath,
      likes: 0,
      comments: [],
      timestamp: new Date()
    });
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

app.get("/posts/:id", (req, res) => {
  const post = posts.find(p => req.params.id === p.id);
  if (!post) return res.status(404).send("Post not found");
  res.render("show", { post });
});

app.get("/posts/:id/edit", (req, res) => {
  const post = posts.find(p => req.params.id === p.id);
  if (!post) return res.status(404).send("Post not found");
  res.render("edit", { post });
});

app.patch("/posts/:id", (req, res) => {
  const post = posts.find(p => req.params.id === p.id);
  if (!post) return res.status(404).send("Post not found");
  
  if (req.body.caption) post.caption = req.body.caption;
  res.redirect(`/posts/${post.id}`);
});

app.delete("/posts/:id", (req, res) => {
  posts = posts.filter(p => p.id !== req.params.id);
  res.redirect("/posts");
});

// Test route to verify image serving
app.get('/test-images', (req, res) => {
  res.send(`
    <h1>Image Path Test</h1>
    <img src="/uploads/sunset.jpg" width="300">
    <img src="/uploads/travel.jpg" width="300">
    <p>If these images display, your static files are configured correctly</p>
  `);
});

app.listen(port, () => {
  console.log(`Instagram clone running on http://localhost:${port}`);
  console.log(`Test image paths at http://localhost:${port}/test-images`);
});