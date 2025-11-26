const admin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès interdit" });
  }
  next();
};

module.exports = admin;
