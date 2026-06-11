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
    es.title AS campaign_name,
    es.payment_amount_cents AS amount,
    es.payment_currency AS currency,
    p.payment_status,
    p.payment_provider,
    p.checkout_session_id AS stripe_session_id,
    COALESCE(p.customer_email, sp.contact_email) AS customer_email,
    p.created_at

  FROM event_payments p
  LEFT JOIN event_submissions es
    ON es.id = p.event_id
  LEFT JOIN event_sponsors sp
    ON sp.event_id = es.id

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