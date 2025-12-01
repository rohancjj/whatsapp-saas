import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // ✔ correct spelling

  if (!authHeader)
    return res.status(401).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1]; // ✔ extract token

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data; // ✔ now adminMiddleware gets role
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
