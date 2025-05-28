import mongoose, { Schema } from "mongoose"
import bcrypt from "bcryptjs"
import { type IUser, UserRole, type UserDocument } from "../types"

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: "Hospital",
      required: function(this: UserDocument) {
        return this.role === UserRole.HOSPITAL_ADMIN || this.role === UserRole.DOCTOR
      },
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
UserSchema.pre<UserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model<UserDocument>("User", UserSchema)
