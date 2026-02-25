import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // get the token from cookie
    if (!token) return res.status(401).json({ message: "Unauthenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");

    // attach user info to request for later use
    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user; // now you can use req.user in controllers
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Unauthenticated" });
  }
};

export default authMiddleware;
