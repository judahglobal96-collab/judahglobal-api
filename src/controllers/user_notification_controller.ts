import { Request, Response } from "express";
import {db} from "../config/db";

type AuthRequest = Request & {
  user?: {
    id?: string;
    userId?: string;
  };
};

const NOTIFICATION_DAYS = ["wednesday", "saturday"];
const NOTIFICATION_TIME = "18:00:00";
const MAX_EVENT_CARDS = 3;

function getUserId(req: AuthRequest): string | undefined {
  return req.user?.id || req.user?.userId;
}

/**
 * GET USER NOTIFICATION PREFERENCES
 */
export async function getUserNotificationPreferences(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await db.query(
      `SELECT * FROM user_notification_preferences WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      return res.json({ preferences: result.rows[0] });
    }

    // Auto-create preferences from platform_users
    const user = await db.query(
      `SELECT id, city, state_region FROM platform_users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const created = await db.query(
      `
      INSERT INTO user_notification_preferences (
        user_id,
        email_enabled,
        new_events_enabled,
        preferred_city,
        preferred_state_region,
        notification_days,
        notification_time,
        max_event_cards,
        created_at,
        updated_at
      )
      VALUES ($1, TRUE, TRUE, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
      `,
      [
        userId,
        user.rows[0].city,
        user.rows[0].state_region,
        NOTIFICATION_DAYS,
        NOTIFICATION_TIME,
        MAX_EVENT_CARDS,
      ]
    );

    return res.status(201).json({ preferences: created.rows[0] });
  } catch (err) {
    console.error("Get notification prefs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * UPDATE USER NOTIFICATION PREFERENCES
 */
export async function updateUserNotificationPreferences(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      email_enabled,
      new_events_enabled,
      preferred_city,
      preferred_state_region,
    } = req.body;

    const updated = await db.query(
      `
      INSERT INTO user_notification_preferences (
        user_id,
        email_enabled,
        new_events_enabled,
        preferred_city,
        preferred_state_region,
        notification_days,
        notification_time,
        max_event_cards,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        email_enabled = COALESCE(EXCLUDED.email_enabled, user_notification_preferences.email_enabled),
        new_events_enabled = COALESCE(EXCLUDED.new_events_enabled, user_notification_preferences.new_events_enabled),
        preferred_city = COALESCE(EXCLUDED.preferred_city, user_notification_preferences.preferred_city),
        preferred_state_region = COALESCE(EXCLUDED.preferred_state_region, user_notification_preferences.preferred_state_region),
        notification_days = $6,
        notification_time = $7,
        max_event_cards = $8,
        updated_at = NOW()
      RETURNING *
      `,
      [
        userId,
        email_enabled ?? true,
        new_events_enabled ?? true,
        preferred_city,
        preferred_state_region,
        NOTIFICATION_DAYS,
        NOTIFICATION_TIME,
        MAX_EVENT_CARDS,
      ]
    );

    return res.json({
      message: "Preferences updated",
      preferences: updated.rows[0],
    });
  } catch (err) {
    console.error("Update prefs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * UNSUBSCRIBE (from email footer)
 */
export async function unsubscribeNotifications(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updated = await db.query(
      `
      UPDATE user_notification_preferences
      SET email_enabled = FALSE,
          new_events_enabled = FALSE,
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
      `,
      [userId]
    );

    return res.json({
      message: "Unsubscribed from Judah Global emails",
      preferences: updated.rows[0],
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * RESUBSCRIBE
 */
export async function resubscribeNotifications(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updated = await db.query(
      `
      UPDATE user_notification_preferences
      SET email_enabled = TRUE,
          new_events_enabled = TRUE,
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
      `,
      [userId]
    );

    return res.json({
      message: "Resubscribed to Judah Global emails",
      preferences: updated.rows[0],
    });
  } catch (err) {
    console.error("Resubscribe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}