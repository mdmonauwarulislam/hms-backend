import express from "express"
import { createDoctor, getDoctors, getDoctor, updateDoctor, deleteDoctor } from "../controllers/doctorController"
import { authenticate, isHospitalAdmin } from "../middleware/auth"

const router = express.Router()

// Protect all routes
router.use(authenticate)

// Super Admin and Hospital Admin routes
router.post("/", isHospitalAdmin, createDoctor)
router.get("/", isHospitalAdmin, getDoctors)
router.get("/:id", isHospitalAdmin, getDoctor)
router.put("/:id", isHospitalAdmin, updateDoctor)
router.delete("/:id", isHospitalAdmin, deleteDoctor)

export default router
