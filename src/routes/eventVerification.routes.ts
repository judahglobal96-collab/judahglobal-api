import { Router } from "express";
import {
  sendEventOTP,
  verifyEventOTP,
} from "../controllers/eventVerification.controller";

const router = Router();

router.post("/:eventId/send-otp", sendEventOTP);
router.post("/verify-otp", verifyEventOTP);

export default router;