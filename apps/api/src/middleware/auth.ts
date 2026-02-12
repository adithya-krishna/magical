import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "../auth";

export type UserRole =
  | "super_admin"
  | "admin"
  | "staff"
  | "teacher"
  | "student";

export type AuthUser = {
  id: string;
  role: UserRole;
};

export async function withAuthContext(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (session?.user?.isActive === false) {
      next();
      return;
    }

    if (session?.user?.role) {
      req.user = { id: session.user.id, role: session.user.role as UserRole };
    }
  } catch {
    req.user = undefined;
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
