const mongoose = require("mongoose");

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

module.exports = mongoose.model("Post", postSchema);
