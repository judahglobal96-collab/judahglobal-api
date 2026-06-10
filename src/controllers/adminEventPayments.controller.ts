import { Request, Response } from "express";
import { db } from "../config/db";

export const getEventPayments = async (
  req: Request,
  res: Response
) => {
  try {

  const result = await db.query(`
    SELECT
      p.id,
      p.event_id,
      p.payment_status,
      p.payment_provider,
      p.amount_cents,
      p.currency,
      p.checkout_session_id,
      p.customer_email,
      p.created_at
    FROM event_payments p
    ORDER BY p.created_at DESC
  `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching campaign purchases:", error);

    res.status(500).json({
      error: "Failed to fetch campaign purchases",
    });
  }
};