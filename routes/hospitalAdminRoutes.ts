import express from "express"
import {
  getMyHospital,
  getHospitalAdmins,
  createHospitalAdmin,
  updateHospitalAdmin,
  deleteHospitalAdmin,
} from "../controllers/hospitalAdminController"
import { authenticate, isSuperAdmin, isHospitalAdmin } from "../middleware/auth"

const router = express.Router()

// Protect all routes
router.use(authenticate)

// Hospital Admin routes
router.get("/my-hospital", isHospitalAdmin, getMyHospital)

// Super Admin only routes
router.get("/", isSuperAdmin, getHospitalAdmins)
router.post("/", isSuperAdmin, createHospitalAdmin)
router.put("/:id", isSuperAdmin, updateHospitalAdmin)
router.delete("/:id", isSuperAdmin, deleteHospitalAdmin)

export default router
