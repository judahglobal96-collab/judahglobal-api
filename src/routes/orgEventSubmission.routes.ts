import { Router } from "express";
import { submitEventForReview } from "../controllers/orgEventSubmission.controller";

const router = Router();

router.post("/submit-for-review", submitEventForReview);

export default router;