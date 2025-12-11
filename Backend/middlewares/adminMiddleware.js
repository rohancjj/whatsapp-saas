export default function adminMiddleware(req, res, next) {
  if (!req.user) {
    console.error("❌ Admin middleware: No user found in request");
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if user role is "admin"
  const isAdmin = req.user.role === "admin";

  if (!isAdmin) {
    console.error("❌ Admin middleware: Access denied", {
      userId: req.user.id,
      role: req.user.role,
      expected: "admin"
    });
    return res.status(403).json({ 
      message: "Admin access required",
      currentRole: req.user.role 
    });
  }

  // Debug log (remove in production)
  console.log("✅ Admin middleware: Access granted", {
    userId: req.user.id,
    role: req.user.role
  });

  next();
}