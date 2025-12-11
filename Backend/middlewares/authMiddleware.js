import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; 

  if (!authHeader) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1]; 

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user data from token
    // Support both 'role' field and 'isAdmin' field for flexibility
    req.user = {
      id: data.id || data.userId,
      role: data.role || "user",
      isAdmin: data.role === "admin" || data.isAdmin === true,
      ...data
    };
    
    // Debug log (remove in production)
    console.log("✅ Auth middleware - User:", {
      id: req.user.id,
      role: req.user.role,
      isAdmin: req.user.isAdmin
    });
    
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
}