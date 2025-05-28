import type { Response, NextFunction } from "express"
import Doctor from "../models/Doctor"
import User from "../models/User"
import { AppError } from "../utils/appError"
import { type AuthRequest, UserRole } from "../types"

// Create a new doctor (Super Admin or Hospital Admin)
export const createDoctor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, specialization, hospitalId, password } = req.body

    // Check if hospital ID is provided
    if (!hospitalId) {
      return next(new AppError("Hospital ID is required", 400))
    }

    // Check if user has access to this hospital
    if (req.user?.role === UserRole.HOSPITAL_ADMIN && req.user.hospitalId?.toString() !== hospitalId) {
      return next(new AppError("You can only add doctors to your hospital", 403))
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User already exists with this email", 400))
    }

    // Create user account for doctor
    const user = await User.create({
      name,
      email,
      password,
      role: UserRole.DOCTOR,
      hospitalId,
    })

    // Create doctor profile
    const doctor = await Doctor.create({
      name,
      email,
      specialization,
      hospitalId,
      userId: user._id,
    })

    res.status(201).json({
      success: true,
      data: doctor,
    })
  } catch (error) {
    next(error)
  }
}

// Get all doctors (filtered by hospital for Hospital Admin)
export const getDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let query = {}

    // Filter by hospital ID for Hospital Admin
    if (req.user?.role === UserRole.HOSPITAL_ADMIN && req.user.hospitalId) {
      query = { hospitalId: req.user.hospitalId }
    }

    if (req.user?.role === UserRole.HOSPITAL && req.user.hospitalId) {
        query = { hospitalId: req.user.hospitalId }
      }

      if (req.user?.role === UserRole.DOCTOR && req.user.hospitalId) {
        query = { hospitalId: req.user.hospitalId }
      }

    // Filter by hospital ID if provided in query (for Super Admin)
    if (req.user?.role === UserRole.SUPER_ADMIN && req.query.hospitalId) {
      query = { hospitalId: req.query.hospitalId }
    }

    const doctors = await Doctor.find(query)
    console.log(doctors)

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    })
  } catch (error) {
    next(error)
  }
}

// Get a single doctor by ID
export const getDoctor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id

    const doctor = await Doctor.findById(doctorId).populate("hospitalId", "name");
    


    if (!doctor) {
      return next(new AppError("Doctor not found", 404))
    }

    // Check if user has access to this doctor's hospital
    if (
      req.user?.role === UserRole.HOSPITAL &&
      req.user.hospitalId?.toString() !== doctor.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to view this doctor", 403))
    }

    res.status(200).json({
      success: true,
      data: doctor,
    })
  } catch (error) {
    next(error)
  }
}

// Update a doctor
export const updateDoctor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id
    const { name, specialization } = req.body

    // Find doctor first to check hospital access
    const doctor = await Doctor.findById(doctorId)

    if (!doctor) {
      return next(new AppError("Doctor not found", 404))
    }

    // Check if user has access to this doctor's hospital
    if (
      req.user?.role === UserRole.HOSPITAL &&
      req.user.hospitalId?.toString() !== doctor.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to update this doctor", 403))
    }

    // Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { name, specialization },
      { new: true, runValidators: true },
    )

    // Also update the user name if it exists
    await User.findByIdAndUpdate(doctor.userId, { name }, { new: true })

    res.status(200).json({
      success: true,
      data: updatedDoctor,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a doctor
export const deleteDoctor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id

    // Find doctor first to check hospital access
    const doctor = await Doctor.findById(doctorId)

    if (!doctor) {
      return next(new AppError("Doctor not found", 404))
    }

    // Check if user has access to this doctor's hospital
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== doctor.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to delete this doctor", 403))
    }

    // Delete doctor
    await Doctor.findByIdAndDelete(doctorId)

    // Also delete the user account
    await User.findByIdAndDelete(doctor.userId)

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}
