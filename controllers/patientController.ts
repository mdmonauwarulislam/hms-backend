import type { Response, NextFunction } from "express"
import PatientEnrollment from "../models/PatientEnrollment"
import Doctor from "../models/Doctor"
import { AppError } from "../utils/appError"
import { type AuthRequest, UserRole } from "../types"

// Create a new patient enrollment
export const createPatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, age, gender, doctorId, hospitalId, dateOfAdmission } = req.body

    // If user is a doctor, they can only add patients to themselves
    if (req.user?.role === UserRole.DOCTOR) {
      // Find the doctor profile for the current user
      const doctor = await Doctor.findOne({ userId: req.user.id })

      if (!doctor) {
        return next(new AppError("Doctor profile not found", 404))
      }

      // Override doctorId and hospitalId with the doctor's info
      req.body.doctorId = doctor._id
      req.body.hospitalId = doctor.hospitalId
    }

    // Check if hospital ID matches user's hospital (for Hospital Admin)
    if (req.user?.role === UserRole.HOSPITAL_ADMIN && req.user.hospitalId?.toString() !== hospitalId) {
      return next(new AppError("You can only add patients to your hospital", 403))
    }

    // Create patient enrollment
    const patient = await PatientEnrollment.create({
      name,
      age,
      gender,
      doctorId: req.body.doctorId || doctorId,
      hospitalId: req.body.hospitalId || hospitalId,
      dateOfAdmission: dateOfAdmission || new Date(),
    })

    res.status(201).json({
      success: true,
      data: patient,
    })
  } catch (error) {
    next(error)
  }
}

// Get all patients (filtered by hospital and/or doctor)
export const getPatients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query: any = {}

    // Filter by hospital ID for Hospital Admin
    if (req.user?.role === UserRole.HOSPITAL_ADMIN && req.user.hospitalId) {
      query.hospitalId = req.user.hospitalId
    }

    // Filter by doctor ID for Doctor
    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor) {
        return next(new AppError("Doctor profile not found", 404))
      }
      query.doctorId = doctor._id
    }

    // Additional filters for Super Admin
    if (req.user?.role === UserRole.SUPER_ADMIN) {
      if (req.query.hospitalId) {
        query.hospitalId = req.query.hospitalId
      }
      if (req.query.doctorId) {
        query.doctorId = req.query.doctorId
      }
    }

    const patients = await PatientEnrollment.find(query)

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    })
  } catch (error) {
    next(error)
  }
}

// Get a single patient by ID
export const getPatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.id

    const patient = await PatientEnrollment.findById(patientId)

    if (!patient) {
      return next(new AppError("Patient not found", 404))
    }

    // Check if user has access to this patient
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== patient.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to view this patient", 403))
    }

    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor || doctor._id.toString() !== patient.doctorId.toString()) {
        return next(new AppError("Unauthorized to view this patient", 403))
      }
    }

    res.status(200).json({
      success: true,
      data: patient,
    })
  } catch (error) {
    next(error)
  }
}

// Update a patient
export const updatePatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.id
    const { name, age, gender, dateOfAdmission } = req.body

    // Find patient first to check access
    const patient = await PatientEnrollment.findById(patientId)

    if (!patient) {
      return next(new AppError("Patient not found", 404))
    }

    // Check if user has access to this patient
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== patient.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to update this patient", 403))
    }

    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor || doctor._id.toString() !== patient.doctorId.toString()) {
        return next(new AppError("Unauthorized to update this patient", 403))
      }
    }

    // Update patient
    const updatedPatient = await PatientEnrollment.findByIdAndUpdate(
      patientId,
      { name, age, gender, dateOfAdmission },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      data: updatedPatient,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a patient
export const deletePatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.id

    // Find patient first to check access
    const patient = await PatientEnrollment.findById(patientId)

    if (!patient) {
      return next(new AppError("Patient not found", 404))
    }

    // Check if user has access to this patient
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== patient.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to delete this patient", 403))
    }

    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor || doctor._id.toString() !== patient.doctorId.toString()) {
        return next(new AppError("Unauthorized to delete this patient", 403))
      }
    }

    // Delete patient
    await PatientEnrollment.findByIdAndDelete(patientId)

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}
