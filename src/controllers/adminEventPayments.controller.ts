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
    p.campaign_id,

    es.event_code AS campaign_code,
    es.title AS campaign_name,
    oa.organization_name,
    oa.org_uuid AS organization_uuid,

    p.payment_status,
    p.payment_provider,
    p.amount_cents AS amount,
    p.currency,
    p.checkout_session_id AS stripe_session_id,
    p.customer_email,
    p.created_at

  FROM event_payments p
  LEFT JOIN event_submissions es
    ON es.id = p.event_id
  LEFT JOIN organization_accounts oa
    ON oa.org_uuid = es.org_uuid

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