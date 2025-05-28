import type { Response, NextFunction } from "express"
import Hospital from "../models/Hospital"
import { AppError } from "../utils/appError"
import { type AuthRequest, UserRole } from "../types"

// Create a new hospital (Super Admin only)
export const createHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, phone, email, website, licenseNumber,
    establishedYear,
    bedCapacity,
    emergencyContact,
    description } = req.body

    const hospital = await Hospital.create({
      name,
      address,
      phone,
      email,
      website,
      licenseNumber,
      establishedYear,
      bedCapacity,
      emergencyContact,
      description,
      createdBy: req.user?.id,
    })

    res.status(201).json({
      success: true,
      data: hospital,
    })
  } catch (error) {
    next(error)
  }
}

// Get all hospitals (Super Admin) or user's hospital (Hospital Admin)
export const getHospitals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let hospitals

    if (req.user?.role === UserRole.SUPER_ADMIN) {
      // Super Admin can see all hospitals
      hospitals = await Hospital.find()
    } else if (req.user?.role === UserRole.HOSPITAL_ADMIN && req.user.hospitalId) {
      // Hospital Admin can only see their hospital
      hospitals = await Hospital.find({ _id: req.user.hospitalId })
    }
      else if (req.user?.role === UserRole.DOCTOR && req.user.hospitalId) {
        // Hospital Admin can only see their hospital
        hospitals = await Hospital.find({ _id: req.user.hospitalId })
    } 
    else {
      return next(new AppError("Unauthorized to view hospitals", 403))
    }

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    })
  } catch (error) {
    next(error)
  }
}

// Get a single hospital by ID
export const getHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.params.id

    // Check if user has access to this hospital
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.hospitalId?.toString() !== hospitalId) {
      return next(new AppError("Unauthorized to view this hospital", 403))
    }

    const hospital = await Hospital.findById(hospitalId)

    if (!hospital) {
      return next(new AppError("Hospital not found", 404))
    }

    res.status(200).json({
      success: true,
      data: hospital,
    })
  } catch (error) {
    next(error)
  }
}

// Update a hospital (Super Admin only)
export const updateHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.params.id
    const { name, address } = req.body

    const hospital = await Hospital.findByIdAndUpdate(hospitalId, { name, address }, { new: true, runValidators: true })

    if (!hospital) {
      return next(new AppError("Hospital not found", 404))
    }

    res.status(200).json({
      success: true,
      data: hospital,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a hospital (Super Admin only)
export const deleteHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.params.id

    const hospital = await Hospital.findByIdAndDelete(hospitalId)

    if (!hospital) {
      return next(new AppError("Hospital not found", 404))
    }

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}
