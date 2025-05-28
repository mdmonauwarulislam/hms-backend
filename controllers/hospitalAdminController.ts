import type { Response, NextFunction } from "express"
import User from "../models/User"
import Hospital from "../models/Hospital"
import Doctor from "../models/Doctor"
import PatientEnrollment from "../models/PatientEnrollment"
import Prescription from "../models/Prescription"
import { AppError } from "../utils/appError"
import { type AuthRequest, UserRole } from "../types"

// Get hospital details for hospital admin
export const getMyHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.hospitalId) {
      return next(new AppError("No hospital assigned to this admin", 400))
    }

    // Get hospital details
    const hospital = await Hospital.findById(req.user.hospitalId)
    if (!hospital) {
      return next(new AppError("Hospital not found", 404))
    }

    // Get hospital statistics
    const [doctorsCount, patientsCount, prescriptionsCount] = await Promise.all([
      Doctor.countDocuments({ hospitalId: req.user.hospitalId }),
      PatientEnrollment.countDocuments({ hospitalId: req.user.hospitalId }),
      Prescription.countDocuments({ hospitalId: req.user.hospitalId }),
    ])

    // Get recent doctors
    const recentDoctors = await Doctor.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 }).limit(5)

    // Get recent patients
    const recentPatients = await PatientEnrollment.find({ hospitalId: req.user.hospitalId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("doctorId", "name specialization")

    res.status(200).json({
      success: true,
      data: {
        hospital,
        statistics: {
          doctors: doctorsCount,
          patients: patientsCount,
          prescriptions: prescriptionsCount,
        },
        recentDoctors,
        recentPatients,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get all hospital admins (Super Admin only)
export const getHospitalAdmins = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospitalAdmins = await User.find({ role: UserRole.HOSPITAL_ADMIN })
      .select("-password")
      .populate("hospitalId", "name address")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: hospitalAdmins.length,
      data: hospitalAdmins,
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

    // Check if hospital already has an admin
    const existingAdmin = await User.findOne({
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId,
    })
    if (existingAdmin) {
      return next(new AppError("This hospital already has an admin", 400))
    }

    // Create hospital admin
    const user = await User.create({
      name,
      email,
      password,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId,
    })

    // Populate hospital details
    await user.populate("hospitalId", "name address")

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      createdAt: user.createdAt,
    }

    res.status(201).json({
      success: true,
      data: userResponse,
    })
  } catch (error) {
    next(error)
  }
}

// Update hospital admin
export const updateHospitalAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, email, hospitalId } = req.body

    // Find the hospital admin
    const admin = await User.findOne({ _id: id, role: UserRole.HOSPITAL_ADMIN })
    if (!admin) {
      return next(new AppError("Hospital admin not found", 404))
    }

    // If changing hospital, verify new hospital exists
    if (hospitalId && hospitalId !== admin.hospitalId?.toString()) {
      const hospital = await Hospital.findById(hospitalId)
      if (!hospital) {
        return next(new AppError("Hospital not found", 404))
      }

      // Check if new hospital already has an admin
      const existingAdmin = await User.findOne({
        role: UserRole.HOSPITAL_ADMIN,
        hospitalId,
        _id: { $ne: id },
      })
      if (existingAdmin) {
        return next(new AppError("This hospital already has an admin", 400))
      }
    }

    // Update admin
    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      { name, email, hospitalId },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate("hospitalId", "name address")

    res.status(200).json({
      success: true,
      data: updatedAdmin,
    })
  } catch (error) {
    next(error)
  }
}

// Delete hospital admin
export const deleteHospitalAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const admin = await User.findOneAndDelete({ _id: id, role: UserRole.HOSPITAL_ADMIN })
    if (!admin) {
      return next(new AppError("Hospital admin not found", 404))
    }

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}
