import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"
import Doctor from "../models/Doctor"
import Hospital from "../models/Hospital"
import { AppError } from "../utils/appError"
import { type AuthRequest, UserRole } from "../types"

// Generate JWT token
const generateToken = (id: string, role: UserRole, hospitalId?: string) => {
  return jwt.sign({ id, role, hospitalId }, process.env.JWT_SECRET as string, { expiresIn: "1d" })
}

// Register a new user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, hospitalId } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User already exists with this email", 400))
    }

    // Validate hospital ID for hospital admin and doctor
    if ((role === UserRole.HOSPITAL_ADMIN || role === UserRole.DOCTOR) && !hospitalId) {
      return next(new AppError("Hospital ID is required for this role", 400))
    }

    // Verify hospital exists if hospitalId is provided
    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId)
      if (!hospital) {
        return next(new AppError("Hospital not found", 404))
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      hospitalId: role === UserRole.SUPER_ADMIN ? undefined : hospitalId,
    })

    // If the user is a doctor, create a doctor profile
    if (role === UserRole.DOCTOR) {
      const { specialization } = req.body
      if (!specialization) {
        return next(new AppError("Specialization is required for doctors", 400))
      }

      await Doctor.create({
        name,
        email,
        specialization,
        hospitalId,
        userId: user._id,
      })
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role, user.hospitalId?.toString())

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    }

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    })
  } catch (error) {
    next(error)
  }
}

// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return next(new AppError("Invalid credentials", 401))
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(new AppError("Invalid credentials", 401))
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role, user.hospitalId?.toString())

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    }

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    })
  } catch (error) {
    next(error)
  }
}

// Get current user with hospital details
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id).select("-password").populate("hospitalId", "name address")

    if (!user) {
      return next(new AppError("User not found", 404))
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}

// Create hospital admin (Super Admin only)
export const createHospitalAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, hospitalId } = req.body

    // Verify hospital exists
    const hospital = await Hospital.findById(hospitalId)
    if (!hospital) {
      return next(new AppError("Hospital not found", 404))
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User already exists with this email", 400))
    }

    // Create hospital admin
    const user = await User.create({
      name,
      email,
      password,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId,
    })

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    }

    res.status(201).json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    next(error)
  }
}
