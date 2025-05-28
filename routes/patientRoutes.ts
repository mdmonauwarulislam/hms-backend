import express from "express"
import { createPatient, getPatients, getPatient, updatePatient, deletePatient } from "../controllers/patientController"
import { authenticate, isDoctor } from "../middleware/auth"

const router = express.Router()

// Protect all routes
router.use(authenticate)

// All authenticated users can access these routes
// Access control is handled in the controllers
router.post("/", isDoctor, createPatient)
router.get("/", isDoctor, getPatients)
router.get("/:id", isDoctor, getPatient)
router.put("/:id", isDoctor, updatePatient)
router.delete("/:id", isDoctor, deletePatient)

export default router
