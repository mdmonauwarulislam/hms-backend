import mongoose, { Schema, type Document } from "mongoose"
import type { IPrescription } from "../types"

const PrescriptionSchema: Schema = new Schema(
  {
    patientEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "PatientEnrollment",
      required: true,
    },
    medication: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      required: true,
      trim: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model<IPrescription & Document>("Prescription", PrescriptionSchema)
