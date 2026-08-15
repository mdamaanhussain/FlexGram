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
    isAdmin: username === "amaanhussain786_"
  };
}

function validateLogin(username, password) {
  if (!username) return { valid: false, error: "Username is required" };
  if (!password) return { valid: false, error: "Password is required" };

  if (username === "amaanhussain786_" && password !== "admin@123") {
    return { valid: false, error: "Invalid admin password" };
  }

  if (username !== "amaanhussain786_" && password.length < 4) {
    return { valid: false, error: "Password must be at least 4 characters" };
  }

  return { valid: true, user: buildSessionUser(username) };
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

module.exports = {
  isAdminUser,
  canManagePost,
  buildSessionUser,
  validateLogin,
  requireAuth
};
