// backend/routes/index.js
import express from "express";

// Import all route modules
import AuthRoutes from "./authRoutes.js";
import OrganizationRoutes from "./organizationRoutes.js";
import DepartmentRoutes from "./departmentRoutes.js";
import UserRoutes from "./userRoutes.js";
import TaskRoutes from "./taskRoutes.js";
import VendorRoutes from "./vendorRoutes.js";
import MaterialRoutes from "./materialRoutes.js";
import NotificationRoutes from "./notificationRoutes.js";
import AttachmentRoutes from "./attachmentRoutes.js";

const router = express.Router();

// Authentication routes
router.use("/auth", AuthRoutes);
router.use("/organizations", OrganizationRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/users", UserRoutes);
router.use("/tasks", TaskRoutes);
router.use("/vendors", VendorRoutes);
router.use("/materials", MaterialRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/attachments", AttachmentRoutes);

export default router;
