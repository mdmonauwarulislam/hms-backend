import mongoose, { Schema, type Document } from "mongoose"
import type { IHospital } from "../types"

const HospitalSchema: Schema = new Schema(
    {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        address: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        website: {
          type: String,
        },
        licenseNumber: {
          type: String,
          required: true,
          unique: true,
        },
        establishedYear: {
          type: Number,
          required: true,
        },
        bedCapacity: {
          type: Number,
          required: true,
        },
        emergencyContact: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        role: {
          type: String,
          enum: ["HOSPITAL"],
          default: "HOSPITAL",
        },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
      {
        timestamps: true,
      }
)

export default mongoose.model<IHospital & Document>("Hospital", HospitalSchema)
