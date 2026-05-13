import { Request, Response } from "express";
import { db } from "../config/db";

export const getEventPayments = async (req: Request, res: Response) => {
  try {
    const result = await db.query<any>(`
      SELECT 
        id,
        event_code,
        amount,
        currency,
        payment_status,
        payment_type,
        customer_email,
        created_at
      FROM event_payments
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};