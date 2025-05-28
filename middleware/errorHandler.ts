import type { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/appError"

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500
  let message = "Internal Server Error"
  let errors: any = {}

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    errors = err.errors
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400
    message = "Validation Error"
    errors = (err as any).errors
  }

  // Handle Mongoose duplicate key errors
  if ((err as any).code === 11000) {
    statusCode = 400
    message = "Duplicate field value"
    const field = Object.keys((err as any).keyValue)[0]
    errors = { [field]: `${field} already exists` }
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Invalid token"
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Token expired"
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
}
