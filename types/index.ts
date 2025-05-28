import type { Request } from "express"
import type { Document, Types } from "mongoose"

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  HOSPITAL = "HOSPITAL"
  HOSPITAL_ADMIN = "HOSPITAL_ADMIN",
  DOCTOR = "DOCTOR",
}

export interface IUser {
  email: string
  password: string
  role: UserRole
  hospitalId?: Types.ObjectId
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface UserDocument extends Document, IUser {
  _id: Types.ObjectId
  comparePassword(candidatePassword: string): Promise<boolean>
}

export interface IHospital {
  _id: string
  name: string
  address: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IDoctor {
  _id: string
  name: string
  email: string
  specialization: string
  hospitalId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface IPatientEnrollment {
  _id: string
  name: string
  age: number
  gender: string
  doctorId: string
  hospitalId: string
  dateOfAdmission: Date
  createdAt: Date
  updatedAt: Date
}

export interface IPrescription {
  _id: string
  patientEnrollmentId: string
  medication: string
  dosage: string
  instructions: string
  doctorId: string
  hospitalId: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: UserRole
    hospitalId?: string
  }
}

export interface JwtPayload {
  id: string
  role: UserRole
  hospitalId?: string
}
