import type { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { type AuthRequest, type JwtPayload, UserRole } from "../types"
import { AppError } from "../utils/appError"

// Verify JWT token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return next(new AppError("Authentication required", 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    req.user = {
      id: decoded.id,
      role: decoded.role,
      hospitalId: decoded.hospitalId,
    }

    next()
  } catch (error) {
    next(new AppError("Invalid token", 401))
  }
}

// Check if user is Super Admin
export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    return next(new AppError("Access denied: Super Admin privileges required", 403))
  }
  next()
}

// Check if user is Hospital Admin
export const isHospitalAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.HOSPITAL_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
    return next(new AppError("Access denied: Hospital Admin privileges required", 403))
  }
  next()
}

// Check if user is Doctor
export const isDoctor = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (
    req.user?.role !== UserRole.DOCTOR &&
    req.user?.role !== UserRole.HOSPITAL_ADMIN &&
    req.user?.role !== UserRole.SUPER_ADMIN
  ) {
    return next(new AppError("Access denied: Doctor privileges required", 403))
  }
  next()
}
