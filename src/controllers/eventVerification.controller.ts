import { Request, Response } from "express";
import {
  createEventVerification,
  verifyEventVerification,
} from "../services/eventVerification.service";

  type Params = {
  eventId: string;
};

export const sendEventOTP = async (
  req: Request<Params>,
  res: Response
) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        error: "eventId is required",
      });
    }

    const result = await createEventVerification(eventId);

    console.log("Judah Global OTP email:", {
      to: result.email,
      otp: result.otp,
      eventId: result.eventId,
      expiresAt: result.expiresAt,
    });

    return res.json({
      success: true,
      message: "OTP sent",
      dev_otp: result.otp,
    });
  } catch (error) {
    console.error("sendEventOTP error:", error);
  
    const message =
      error instanceof Error ? error.message : "Failed to send OTP";

    if (
      message === "Sponsor not found for this event" ||
      message === "Sponsor contact email is missing"
    ) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({
      error: message,
    });
  }
};

export const verifyEventOTP = async (req: Request, res: Response) => {
  try {
    const { eventId, submissionId, code } = req.body;
    const resolvedEventId = eventId || submissionId;

    if (!resolvedEventId || !code) {
      return res.status(400).json({
        error: "eventId/submissionId and code are required",
      });
    }

    await verifyEventVerification(resolvedEventId, code);

    return res.json({
      success: true,
      verified: true,
      message: "Email verified. Event submitted for review.",
    });
  } catch (error) {
    console.error("verifyEventOTP error:", error);

    const message =
      error instanceof Error ? error.message : "OTP verification failed";

    if (message === "Invalid or expired OTP") {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({
      error: message,
    });
  }
};