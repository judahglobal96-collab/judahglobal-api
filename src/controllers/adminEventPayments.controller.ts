import { Request, Response } from "express";
import { db } from "../config/db";

export const getEventPayments = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await db.query(`
      SELECT
        c.id AS campaign_id,
        c.campaign_name,
        c.organization_name,

        i.id AS item_id,
        i.placement_type,
        i.quantity,
        i.status,
        i.region_code,
        i.placement_date,
        i.created_at

      FROM ad_campaign_items i
      INNER JOIN ad_campaigns c
        ON c.id = i.campaign_id

      ORDER BY i.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching campaign purchases:", error);

    res.status(500).json({
      error: "Failed to fetch campaign purchases",
    });
  }
};