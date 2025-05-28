import express from "express"
import {
  createPrescription,
  getPrescriptions,
  getPrescription,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescriptionController"
import { authenticate, isDoctor } from "../middleware/auth"

const router = express.Router()

// Protect all routes
router.use(authenticate)

// All authenticated users can access these routes
// Access control is handled in the controllers
router.post("/", isDoctor, createPrescription)
router.get("/", isDoctor, getPrescriptions)
router.get("/:id", isDoctor, getPrescription)
router.put("/:id", isDoctor, updatePrescription)
router.delete("/:id", isDoctor, deletePrescription)

export default router
