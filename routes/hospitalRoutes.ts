import express from "express"
import {
  createHospital,
  getHospitals,
  getHospital,
  updateHospital,
  deleteHospital,
} from "../controllers/hospitalController"
import { authenticate, isSuperAdmin, isHospitalAdmin } from "../middleware/auth"

const router = express.Router()

// Protect all routes
router.use(authenticate)

// Super Admin only routes
router.post("/", isSuperAdmin, createHospital)
router.put("/:id", isSuperAdmin, updateHospital)
router.delete("/:id", isSuperAdmin, deleteHospital)

// Super Admin and Hospital Admin routes
router.get("/", isHospitalAdmin, getHospitals)
router.get("/:id", isHospitalAdmin, getHospital)

export default router
