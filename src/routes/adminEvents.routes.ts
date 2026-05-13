import { Router } from "express";
import {
  getPendingEvents,
  getApprovedEvents,
  getApprovedEventsByOrgUuid,
  getRejectedEvents,
  getAdminEventById,
  approveEvent,
  rejectEvent,
  getEventLogs,
  waiveEventPayment,
  updateFeaturedStatus,
  getEventPaidPromos,
  getAdminSupportLookup,
} from "../controllers/adminEvents.controller";

const router = Router();

router.get("/events/pending", getPendingEvents);
router.get("/events/rejected", getRejectedEvents);
router.get("/approved-events", getApprovedEvents);
router.get("/org/:orgUuid/approved-events", getApprovedEventsByOrgUuid);

router.get("/events/:eventId", getAdminEventById);
router.get("/events/:eventId/logs", getEventLogs);

router.get("/events/:eventId/paid-promos", getEventPaidPromos);

router.patch("/events/:eventId/approve", approveEvent);
router.get("/support-lookup", getAdminSupportLookup);
router.patch("/events/:eventId/featured", updateFeaturedStatus);
router.patch("/events/:eventId/reject", rejectEvent);
router.patch("/events/:eventId/waive-payment", waiveEventPayment);

export default router;