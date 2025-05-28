import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { errorHandler } from "./middleware/errorHandler"
import authRoutes from "./routes/authRoutes"
import hospitalRoutes from "./routes/hospitalRoutes"
import doctorRoutes from "./routes/doctorRoutes"
import patientRoutes from "./routes/patientRoutes"
import prescriptionRoutes from "./routes/prescriptionRoutes"
import hospitalAdminRoutes from "./routes/hospitalAdminRoutes"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://hms-frontend-nine.vercel.app",
    credentials: true,
  }),
)
app.use(helmet())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("✅ Connected to MongoDB")
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })

// Routes
app.use("/auth", authRoutes)
app.use("/hospitals", hospitalRoutes)
app.use("/doctors", doctorRoutes)
app.use("/patients", patientRoutes)
app.use("/prescriptions", prescriptionRoutes)
app.use("/hospital-admins", hospitalAdminRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Hospital Management API is running",
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`)
})

export default app
