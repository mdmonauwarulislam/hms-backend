import type { Response, NextFunction } from "express"
import Prescription from "../models/Prescription"
import PatientEnrollment from "../models/PatientEnrollment"
import Doctor from "../models/Doctor"
import { AppError } from "../utils/appError"
import { type AuthRequest, UserRole } from "../types"

// Create a new prescription
export const createPrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientEnrollmentId, medication, dosage, instructions } = req.body

    // Check if patient exists
    const patient = await PatientEnrollment.findById(patientEnrollmentId)
    if (!patient) {
      return next(new AppError("Patient not found", 404))
    }

    let doctorId
    const hospitalId = patient.hospitalId

    // If user is a doctor, they can only add prescriptions for their patients
    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })

      if (!doctor) {
        return next(new AppError("Doctor profile not found", 404))
      }

      doctorId = doctor._id

      // Check if the patient belongs to this doctor
      if (patient.doctorId.toString() !== doctor._id.toString()) {
        return next(new AppError("You can only add prescriptions for your patients", 403))
      }
    } else {
      // For Super Admin or Hospital Admin, doctorId should be provided
      doctorId = req.body.doctorId

      if (!doctorId) {
        return next(new AppError("Doctor ID is required", 400))
      }
    }

    // Check if hospital ID matches user's hospital (for Hospital Admin)
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== patient.hospitalId.toString()
    ) {
      return next(new AppError("You can only add prescriptions for patients in your hospital", 403))
    }

    // Create prescription
    const prescription = await Prescription.create({
      patientEnrollmentId,
      medication,
      dosage,
      instructions,
      doctorId,
      hospitalId,
    })

    res.status(201).json({
      success: true,
      data: prescription,
    })
  } catch (error) {
    next(error)
  }
}

// Get all prescriptions (filtered by hospital, doctor, and/or patient)
export const getPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    // Additional filters for all roles
    if (req.query.patientId) {
      query.patientEnrollmentId = req.query.patientId
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

    const prescriptions = await Prescription.find(query)

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    })
  } catch (error) {
    next(error)
  }
}

// Get a single prescription by ID
export const getPrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = req.params.id

    const prescription = await Prescription.findById(prescriptionId)

    if (!prescription) {
      return next(new AppError("Prescription not found", 404))
    }

    // Check if user has access to this prescription
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== prescription.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to view this prescription", 403))
    }

    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor || doctor._id.toString() !== prescription.doctorId.toString()) {
        return next(new AppError("Unauthorized to view this prescription", 403))
      }
    }

    res.status(200).json({
      success: true,
      data: prescription,
    })
  } catch (error) {
    next(error)
  }
}

// Update a prescription
export const updatePrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = req.params.id
    const { medication, dosage, instructions } = req.body

    // Find prescription first to check access
    const prescription = await Prescription.findById(prescriptionId)

    if (!prescription) {
      return next(new AppError("Prescription not found", 404))
    }

    // Check if user has access to this prescription
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== prescription.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to update this prescription", 403))
    }

    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor || doctor._id.toString() !== prescription.doctorId.toString()) {
        return next(new AppError("Unauthorized to update this prescription", 403))
      }
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { medication, dosage, instructions },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      data: updatedPrescription,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a prescription
export const deletePrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = req.params.id

    // Find prescription first to check access
    const prescription = await Prescription.findById(prescriptionId)

    if (!prescription) {
      return next(new AppError("Prescription not found", 404))
    }

    // Check if user has access to this prescription
    if (
      req.user?.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId?.toString() !== prescription.hospitalId.toString()
    ) {
      return next(new AppError("Unauthorized to delete this prescription", 403))
    }

    if (req.user?.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: req.user.id })
      if (!doctor || doctor._id.toString() !== prescription.doctorId.toString()) {
        return next(new AppError("Unauthorized to delete this prescription", 403))
      }
    }

    // Delete prescription
    await Prescription.findByIdAndDelete(prescriptionId)

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}
