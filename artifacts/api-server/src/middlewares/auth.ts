import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "rukhsty-secret-dev-key";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    (req as Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: JwtPayload }).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}

export function requireAnyOfficerOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: JwtPayload }).user;
  const officerRoles = [
    "ADMIN",
    "TRAINING_CENTER_OFFICER",
    "MEDICAL_CENTER_OFFICER",
    "THEORY_EXAM_OFFICER",
    "PRACTICAL_EXAM_OFFICER",
    "DVLD_OFFICER",
  ];
  if (!user || !officerRoles.includes(user.role)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}
