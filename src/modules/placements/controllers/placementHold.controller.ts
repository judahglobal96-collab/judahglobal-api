import { Request, Response } from "express";
import {
  createPlacementHoldSession,
  getPlacementHoldSession,
  releasePlacementHoldSession,
} from "../services/placementHold.service";

function getAuthenticatedUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.id || null;
}

export async function createPlacementHoldSessionController(
  req: Request,
  res: Response
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { eventId, orgId, windows } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!Array.isArray(windows) || windows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one placement window is required.",
      });
    }

    const result = await createPlacementHoldSession({
      eventId: eventId ? String(eventId) : null,
      orgId: orgId ? String(orgId) : null,
      userId: String(userId),
      windows,
    });

    return res.status(201).json({
      success: true,
      message: "Placement hold created successfully.",
      hold: result,
    });
  } catch (error: any) {
    console.error("createPlacementHoldSessionController error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to create placement hold session.",
    });
  }
}

export async function getPlacementHoldSessionController(
  req: Request,
  res: Response
) {
  try {
    const { holdSessionId } = req.params;

    if (!holdSessionId) {
      return res.status(400).json({
        success: false,
        message: "holdSessionId is required.",
      });
    }

    const result = await getPlacementHoldSession(String(holdSessionId));

    return res.status(200).json({
      success: true,
      hold: result,
    });
  } catch (error: any) {
    console.error("getPlacementHoldSessionController error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to load placement hold session.",
    });
  }
}

export async function releasePlacementHoldSessionController(
  req: Request,
  res: Response
) {
  try {
    const { holdSessionId } = req.params;

    if (!holdSessionId) {
      return res.status(400).json({
        success: false,
        message: "holdSessionId is required.",
      });
    }

    const result = await releasePlacementHoldSession(String(holdSessionId));

    return res.status(200).json({
      success: true,
      message: "Placement hold released successfully.",
      hold: result,
    });
  } catch (error: any) {
    console.error("releasePlacementHoldSessionController error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to release placement hold session.",
    });
  }
}