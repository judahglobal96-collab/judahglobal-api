import type { Request, Response } from "express";
import { db } from "../config/db";

export async function getDiscoveryEvents(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();
    const city = String(req.query.city || "").trim();
    const country = String(req.query.country || "").trim();
    const category = String(req.query.category || "").trim();
    const featured = String(req.query.featured || "").trim();
    const startDate = String(req.query.start_date || "").trim();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: any[] = [];

    if (q) {
      values.push(q);
      whereClauses.push(`search_document @@ plainto_tsquery('english', $${values.length})`);
    }

    if (city) {
      values.push(city);
      whereClauses.push(`LOWER(city) = LOWER($${values.length})`);
    }

    if (country) {
      values.push(country);
      whereClauses.push(`LOWER(country) = LOWER($${values.length})`);
    }

    if (category) {
      values.push(category);
      whereClauses.push(`LOWER(category_key) = LOWER($${values.length})`);
    }

    if (featured === "true") {
      whereClauses.push(`is_featured = true`);
    }

    if (startDate) {
      values.push(startDate);
      whereClauses.push(`starts_at_utc >= $${values.length}::timestamp`);
    } else {
      whereClauses.push(`starts_at_utc >= NOW()`);
    }

    const whereSQL =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const rankSQL = q
      ? `ts_rank(search_document, plainto_tsquery('english', $1))`
      : `0`;

    const dataQuery = `
      SELECT
        event_id,
        event_code,
        title,
        short_description,
        city,
        state_region,
        country,
        category_key AS category,
        sponsor_name,
        is_featured,
        starts_at_utc,
        ends_at_utc,
        timezone,
        ${rankSQL} AS rank
      FROM event_discovery_index
      ${whereSQL}
      ORDER BY
        is_featured DESC,
        ${q ? "rank DESC," : ""}
        starts_at_utc ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM event_discovery_index
      ${whereSQL}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, values),
      db.query(countQuery, values),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      total_pages: totalPages,
      results: dataResult.rows,
    });
  } catch (error) {
    console.error("GET /discovery/events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch discovery events",
    });
  }
}