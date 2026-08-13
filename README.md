# FlexGram

FlexGram is a simple Instagram-style social media app built with Node.js, Express, MongoDB, and EJS. It supports user login, photo uploads, likes, post management, and admin access.

## Project Purpose
This project is designed to behave like a lightweight social media app where:
- users can log in
- logged-in users can upload their own posts
- users can like posts
- users can edit/delete only their own posts
- admin can manage any post
- uploaded images are stored in MongoDB GridFS so the data persists across refreshes

## Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- GridFS for image storage
- EJS templates
- Tailwind CSS via CDN
- Express Session for login state
- Multer for file upload handling

## Folder Structure

```text
FlexGram/
├── index.js                 # Main server + routes + MongoDB logic
├── package.json             # Project dependencies and scripts
├── .env                     # Environment variables (Mongo URI, PORT)
├── README.md                # Project documentation
├── public/
│   └── uploads/            # Local fallback folder for uploaded/static files
├── views/
│   ├── index.ejs            # Main feed page with posts and auth UI
│   ├── login.ejs            # Login page
│   ├── new.ejs              # Create new post page
│   ├── edit.ejs             # Edit existing post page
│   └── show.ejs             # Individual post detail page
└── node_modules/            # Installed dependencies
```

## Files and What They Do

### index.js
This is the main app file. It handles:
- Express app setup
- MongoDB connection
- Mongoose schema for posts
- login/logout session logic
- GridFS image upload and deletion
- route handling for posts and authentication
- default sample post seeding
- server startup

Important sections inside this file:

1. Constants and config
   - `PORT`
   - `MONGO_URI`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `UPLOADS_DIR`

2. Post model
   - username
   - caption
   - image
   - likes
   - likedBy
   - comments
   - timestamp

3. Auth helpers
   - `buildSessionUser()`
   - `validateLogin()`
   - `requireAuth()`
   - `canManagePost()`

4. Upload and storage functions
   - `uploadImageToGridFS(file)`
   - `deleteStoredImage(imageUrl)`
   - `getGridFSBucket()`

5. Routes
   - `/login` and `/logout`
   - `/posts`
   - `/posts/new`
   - `/posts/:id`
   - `/posts/:id/edit`
   - `/posts/:id/like`
   - `/posts/:id?_method=DELETE`

6. Server startup
   - `mongoose.connect(MONGO_URI)`
   - `seedDefaultPosts()`
   - `app.listen(PORT)`

### views/index.ejs
This is the main Instagram-like feed page.

It includes:
- background video
- username display on top-right
- logout button
- create post button
- all posts in a feed
- like button
- delete icon for owner/admin
- post image + caption + likes

If you want to change the feed UI, this is the main file to edit.

### views/login.ejs
This is the login screen.

It contains:
- username input
- password input
- admin credentials display
- login form submission

Change admin credentials here or modify the login styling in this file.

### views/new.ejs
This page allows a logged-in user to create a new post.

It contains:
- caption textarea
- image upload field
- posting as current session user
- cancel/share buttons

### views/edit.ejs
This page allows the owner/admin to edit the caption of an existing post.

Important points:
- uses `post._id` instead of older `post.id`
- updates through the `PATCH` route
- the route is defined in `index.js` as `/posts/:id` with method override

### views/show.ejs
This page shows an individual post in detail.

It includes:
- image preview
- username
- caption
- likes
- edit and delete buttons for allowed users

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

