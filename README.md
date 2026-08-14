# 📸 FlexGram - Instagram-style Social Media App

FlexGram is an Instagram-style social media application where users can upload photos, like posts, and manage their content.

---

## 🎯 What Does This Project Do?

**In simple terms:**
- Users can log in
- Users can create posts with photos
- Users can like other posts
- Users can edit/delete their own posts
- Admin can manage any post

---

## 🔧 Technology Stack

```
Frontend:  EJS (HTML + Embedded JavaScript)
Backend:   Node.js + Express.js
Database:  MongoDB (for post data)
Storage:   AWS S3 (for images) ✨ [Recently updated]
```

---

## 📁 Folder Structure

```
FlexGram/
│
├── index.js                  ← Main application file (all logic here)
├── package.json              ← All dependencies/packages
├── .env                      ← Secret keys (AWS, MongoDB)
├── .env.example              ← .env file reference
│
├── public/
│   └── uploads/              ← Local fallback folder (images now from AWS S3)
│
├── views/ (All pages shown to users)
│   ├── index.ejs             ← Main feed (all posts displayed here)
│   ├── login.ejs             ← Login page
│   ├── new.ejs               ← Create new post page
│   ├── edit.ejs              ← Edit post page
│   └── show.ejs              ← Individual post details
│
├── MIGRATION_SUMMARY.md      ← What changed
└── AWS_S3_MIGRATION.md       ← AWS S3 setup guide

```

---

## 🚀 Setup Instructions (Get Started in 5 Minutes)

### Step 1: Navigate to Project
```bash
cd "C:\Users\91700\OneDrive\Desktop\MERN CODE\FlexGram"
```

### Step 2: Install Dependencies
```bash
npm install
```
✅ Already completed!

### Step 3: Create and Configure .env File

Copy from `.env.example` and create `.env`:

```bash
# MongoDB (for database)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flexgram

# AWS S3 (for images) - Get these from AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Server
PORT=8080
SESSION_SECRET=flexgram-secret-key
```

### Step 4: Set Up AWS Account
If you don't have AWS:
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Create S3 bucket: `flexgram-uploads`
3. Create IAM user with S3 access
4. Get Access Key and Secret Key

👉 **Detailed guide:** See `AWS_S3_MIGRATION.md`

### Step 5: Start the Server
```bash
npm start
```

Server will run at: http://localhost:8080

---

## 💻 How It Works

### User Flow:

```
1. Open http://localhost:8080
   ↓
2. Login page appears
   ├─ Enter Username
   ├─ Enter Password
   └─ Click Login
   ↓
3. Main Feed opens (all posts visible)
   ├─ Click "Create Post" button
   ├─ Write Caption
   ├─ Upload Photo
   └─ Click Share
   ↓
4. Photo uploaded to AWS S3 📸
   Database stores post details
   ↓
5. Your post appears in Feed
   ├─ Click Like button
   ├─ Edit post
   └─ Delete post (only your own)
```

---

## 🔑 Admin Account

```
Username: amaanhussain786_
Password: admin@123
```

**Admin Privileges:**
- Edit/delete any post
- View all posts
- Full management access

---

## 📊 Database Schema

### Post Data Structure:
```javascript
{
  username: "user123",                    // Who created the post
  caption: "Nice sunset! 🌅",             // Post description
  image: "/s3-file/uploads/abc123-xyz",  // AWS S3 image path
  likes: 42,                              // Number of likes
  likedBy: ["user1", "user2"],           // Users who liked
  comments: [],                           // Comments (future feature)
  timestamp: 2024-01-15T10:30:00        // Post creation time
}
```

---

## 🔄 What Changed? (GridFS → AWS S3)

### Before (MongoDB GridFS):
```
Photo → Server → MongoDB GridFS → Stored in Database
        ❌ Slow
        ❌ Expensive
        ❌ Limited capacity
```

### Now (AWS S3):
```
Photo → Server → AWS S3 → Cloud Storage
        ✅ Fast
        ✅ Cost-effective
        ✅ Unlimited storage
```

### Files That Changed:
1. **index.js** - Three main changes:
   - Replaced GridFS with S3 client
   - Updated upload function
   - Updated delete function
   - Changed image serving route

2. **package.json** - Added new dependency:
   ```javascript
   "@aws-sdk/client-s3": "^3.374.0"  // AWS S3 SDK
   ```

**Detailed info:** See `MIGRATION_SUMMARY.md`

---

## 📝 File Details

### 🎯 index.js - The Core File

**This file contains 6 main sections:**

#### 1️⃣ Imports & Configuration
```javascript
const express = require("express");
const mongoose = require("mongoose");
const { S3Client, ... } = require("@aws-sdk/client-s3");  // AWS S3

const PORT = 8080;
const MONGO_URI = "...";  // Database
const S3_BUCKET_NAME = "flexgram-uploads";  // AWS
```

#### 2️⃣ Post Schema (How data is stored)
```javascript
const postSchema = new mongoose.Schema({
  username: String,
  caption: String,
  image: String,        // AWS S3 path
  likes: Number,
  likedBy: [String],
  comments: [String],
  timestamp: Date
});
```

#### 3️⃣ Helper Functions
- `validateLogin()` - Check login credentials
- `canManagePost()` - Check if user can edit/delete
- `uploadImageToS3()` - Upload photo to AWS S3
- `deleteStoredImage()` - Delete photo from S3

#### 4️⃣ Routes (Available URLs)
```
GET  /login              → Show login page
POST /login              → Verify login
POST /logout             → Logout user

GET  /posts              → Show all posts feed
GET  /posts/new          → New post creation page
POST /posts              → Create and save post

GET  /posts/:id          → Show individual post
GET  /posts/:id/edit     → Edit post page
PATCH /posts/:id         → Update post
DELETE /posts/:id        → Delete post

POST /posts/:id/like     → Add like to post
GET  /s3-file/*          → Serve image from AWS S3
```

#### 5️⃣ Middleware (Processing functions)
```javascript
app.use(session(...))    // Remember login state
app.use(express.static(...))  // Serve static files
app.use(multer(...))     // Handle file uploads
```

#### 6️⃣ Server Startup
```javascript
mongoose.connect(MONGO_URI)  // Connect to database
app.listen(PORT)            // Start server on port 8080
```

---

### 🎨 Views (User Interface Pages)

#### `login.ejs` - First Login Page
```html
<form method="POST" action="/login">
  <input type="text" name="username" placeholder="Username">
  <input type="password" name="password" placeholder="Password">
  <button>Login</button>
</form>
```
**What happens:** Sends username/password to `/login` POST route

---

#### `index.ejs` - Main Instagram Feed
Displays all posts with:
- Post images from AWS S3
- Username and caption
- Like button with count
- Edit/Delete buttons (for owner/admin)
- Create new post button

---

#### `new.ejs` - Create New Post
Form to:
- Write caption
- Upload image (jpg, png, gif, webp)
- Submit new post

**Flow:**
1. User selects image
2. Writes caption
3. Form submits
4. `uploadImageToS3()` uploads to AWS S3
5. Post details saved in MongoDB
6. Post appears in feed

---

#### `edit.ejs` - Edit Post Caption
Allows owner/admin to update post caption

---

#### `show.ejs` - Post Details
Shows individual post with full details

---

## 🛠️ Common Commands

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Install dependencies
npm install

# Fix security vulnerabilities
npm audit fix
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Cannot find module '@aws-sdk/client-s3'"
**Solution:**
```bash
npm install
```

### Issue: "MONGO_URI not found in .env"
**Solution:**
Add to `.env`:
```
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/flexgram
```

### Issue: "Images not uploading / AWS S3 error"
**Solution:**
1. Verify AWS credentials
2. Check S3 bucket exists
3. Verify IAM policy

👉 See: `AWS_S3_MIGRATION.md`

---

## 📚 For More Information:

1. **AWS Setup:** See `AWS_S3_MIGRATION.md`
2. **What Changed:** See `MIGRATION_SUMMARY.md`
3. **Troubleshooting:** See `TROUBLESHOOTING.md`
4. **Quick Start:** See `QUICK_START.md`

---

## ✅ Project Status

- ✅ Database: MongoDB (Working)
- ✅ Image Storage: AWS S3 (Configured)
- ✅ Authentication: Session-based (Working)
- ✅ All Routes: Implemented
- ✅ Ready for: **Deployment** 🚀

---

**Happy Coding! 💻✨**

## .env File
The `.env` file stores the environment-specific configuration.

Typical contents:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/flexgram
PORT=8080
SESSION_SECRET=flexgram-secret-key
```

### What to change here
- MongoDB URI for Atlas/local DB
- server port if needed
- session secret for security

If `.env` is missing or invalid, the app may fail to connect to MongoDB.

## Database Notes
This project uses MongoDB and GridFS for uploaded images.

Why it is used:
- local file storage can disappear on restart or deployment
- GridFS stores files in MongoDB and keeps them persistent
- uploads are served through `/files/:fileId`

## Authentication Rules
Current rules implemented in `index.js`:

- admin username: `amaanhussain786_`
- admin password: `admin@123`
- non-admin users can log in with any username and password length >= 4
- admin can delete any post
- only the owner or admin can edit/delete their post
- likes are tracked using `likedBy` to prevent duplicate likes

## Customization Guide

### If you want to change the login behavior
Edit:
- `index.js` → `validateLogin()`
- `views/login.ejs` → form and login page styles

### If you want to change the post UI
Edit:
- `views/index.ejs` → main feed layout
- `views/new.ejs` → create post screen
- `views/show.ejs` → detailed post view

### If you want to change rules for edit/delete permissions
Edit:
- `index.js` → `canManagePost()`

### If you want to change upload logic
Edit:
- `index.js` → `uploadImageToGridFS()`
- `index.js` → `deleteStoredImage()`

### If you want to change default sample posts
Edit:
- `index.js` → `seedDefaultPosts()`

### If you want to change database connection or port
Edit:
- `.env`
- or top constants in `index.js`

## Run the Project
From the project root:

```bash
npm install
npm run dev 
```

Then open:

```text
http://localhost:8080/posts
```

## Notes for Future Maintenance
- Keep all route logic centralized in `index.js` for now.
- If you add more features, prefer creating small helper functions instead of inline logic.
- Use EJS templates for UI and keep logic minimal in templates.
- For styling changes, prefer Tailwind classes already used in the templates.
- Any new file upload features should respect the current GridFS storage pattern.

## Summary
This project is a simple social media clone with:
- MongoDB-backed posts
- image upload support
- authentication
- admin/user permission rules
- responsive feed UI
- easy-to-edit EJS templates

It is structured so that future changes are manageable without having to inspect every file blindly.

