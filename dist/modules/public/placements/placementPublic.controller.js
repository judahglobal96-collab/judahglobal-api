"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlacementsBySurfaceController = getPlacementsBySurfaceController;
exports.getHomepagePlacementsController = getHomepagePlacementsController;
exports.getDiscoveryPlacementsController = getDiscoveryPlacementsController;
exports.getPlacementBySurfaceAndCodeController = getPlacementBySurfaceAndCodeController;
const db_1 = require("../../../config/db");
function normalizeDateOnly(value) {
    if (!value) {
        return new Date().toISOString().slice(0, 10);
    }
    const trimmed = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        throw new Error(`Invalid date format "${value}". Expected YYYY-MM-DD.`);
    }
    return trimmed;
}
function mapPlacementRow(row) {
    return {
        publicationId: row.publication_id,
        reservationId: row.reservation_id,
        eventId: row.event_id,
        title: row.display_title,
        subtitle: row.display_subtitle,
        imageUrl: row.display_image_url,
        ctaLabel: row.display_cta_label,
        ctaUrl: row.display_cta_url,
        slotNumber: row.slot_number,
        priorityScore: Number(row.priority_score || 0),
        windowStartDate: row.window_start_date,
        windowEndDate: row.window_end_date,
        publicationStatus: row.publication_status,
        sourceEventTitle: row.source_event_title,
        sourceSponsorName: row.source_sponsor_name,
    };
}
function groupPlacements(rows) {
    const groups = new Map();
    for (const row of rows) {
        if (!groups.has(row.placement_code)) {
            groups.set(row.placement_code, {
                placementCode: row.placement_code,
                items: [],
            });
        }
        groups.get(row.placement_code).items.push(mapPlacementRow(row));
    }
    return Array.from(groups.values());
}
async function getPublicPlacementsBySurface(params) {
    const asOfDate = normalizeDateOnly(params.asOfDate);
    const values = [params.surfaceCode, asOfDate];
    let placementCodeFilterSql = "";
    if (params.placementCode) {
        values.push(params.placementCode);
        placementCodeFilterSql = `AND ppb.placement_code = $3`;
    }
    const result = await db_1.db.query(`
    SELECT
      ppb.id AS publication_id,
      ppb.reservation_id,
      ppb.event_id,
      ppb.placement_product_id,
      ppb.surface_id,
      ps.code AS surface_code,
      ps.name AS surface_name,
      ppb.placement_code,
      ppb.display_title,
      ppb.display_subtitle,
      ppb.display_image_url,
      ppb.display_cta_label,
      ppb.display_cta_url,
      ppb.window_start_date::text,
      ppb.window_end_date::text,
      ppb.publication_status,
      ppb.approval_status,
      ppb.slot_number,
      COALESCE(ppb.priority_score, 0) AS priority_score,
      ppb.source_event_title,
      ppb.source_sponsor_name
    FROM placement_publications ppb
    INNER JOIN placement_surfaces ps
      ON ps.id = ppb.surface_id
    WHERE ps.code = $1
      AND ppb.approval_status = 'approved'
      AND ppb.publication_status IN ('scheduled', 'active')
      AND $2::date BETWEEN ppb.window_start_date AND ppb.window_end_date
      ${placementCodeFilterSql}
    ORDER BY
      ppb.placement_code ASC,
      ppb.slot_number ASC NULLS LAST,
      ppb.priority_score DESC,
      ppb.created_at ASC
    `, values);
    return {
        surfaceCode: params.surfaceCode,
        asOfDate,
        count: result.rows.length,
        placements: groupPlacements(result.rows),
    };
}
async function getPlacementsBySurfaceController(req, res) {
    try {
        const surfaceCode = String(req.params.surfaceCode || "").trim();
        const asOfDate = typeof req.query.as_of_date === "string" ? req.query.as_of_date : undefined;
        const placementCode = typeof req.query.placement_code === "string"
            ? req.query.placement_code
            : undefined;
        if (!surfaceCode) {
            return res.status(400).json({
                success: false,
                message: "surfaceCode is required.",
            });
        }
        const result = await getPublicPlacementsBySurface({
            surfaceCode,
            asOfDate,
            placementCode,
        });
        return res.status(200).json({
            success: true,
            surfaceCode: result.surfaceCode,
            asOfDate: result.asOfDate,
            count: result.count,
            placements: result.placements,
        });
    }
    catch (error) {
        console.error("getPlacementsBySurfaceController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to load placements by surface.",
        });
    }
}
async function getHomepagePlacementsController(req, res) {
    try {
        const asOfDate = typeof req.query.as_of_date === "string" ? req.query.as_of_date : undefined;
        const [websiteHomepage, appHomepage] = await Promise.all([
            getPublicPlacementsBySurface({
                surfaceCode: "website_homepage",
                asOfDate,
            }),
            getPublicPlacementsBySurface({
                surfaceCode: "app_homepage",
                asOfDate,
            }),
        ]);
        return res.status(200).json({
            success: true,
            asOfDate: websiteHomepage.asOfDate,
            surfaces: {
                website_homepage: {
                    count: websiteHomepage.count,
                    placements: websiteHomepage.placements,
                },
                app_homepage: {
                    count: appHomepage.count,
                    placements: appHomepage.placements,
                },
            },
        });
    }
    catch (error) {
        console.error("getHomepagePlacementsController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to load homepage placements.",
        });
    }
}
async function getDiscoveryPlacementsController(req, res) {
    try {
        const asOfDate = typeof req.query.as_of_date === "string" ? req.query.as_of_date : undefined;
        const result = await getPublicPlacementsBySurface({
            surfaceCode: "event_discovery",
            asOfDate,
        });
        return res.status(200).json({
            success: true,
            surfaceCode: result.surfaceCode,
            asOfDate: result.asOfDate,
            count: result.count,
            placements: result.placements,
        });
    }
    catch (error) {
        console.error("getDiscoveryPlacementsController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to load discovery placements.",
        });
    }
}
async function getPlacementBySurfaceAndCodeController(req, res) {
    try {
        const surfaceCode = String(req.params.surfaceCode || "").trim();
        const placementCode = String(req.params.placementCode || "").trim();
        const asOfDate = typeof req.query.as_of_date === "string" ? req.query.as_of_date : undefined;
        if (!surfaceCode || !placementCode) {
            return res.status(400).json({
                success: false,
                message: "surfaceCode and placementCode are required.",
            });
        }
        const result = await getPublicPlacementsBySurface({
            surfaceCode,
            placementCode,
            asOfDate,
        });
        return res.status(200).json({
            success: true,
            surfaceCode: result.surfaceCode,
            placementCode,
            asOfDate: result.asOfDate,
            count: result.count,
            placements: result.placements,
        });
    }
    catch (error) {
        console.error("getPlacementBySurfaceAndCodeController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to load placement by surface and code.",
        });
    }
}
exports.default = {
    getPlacementsBySurfaceController,
    getHomepagePlacementsController,
    getDiscoveryPlacementsController,
    getPlacementBySurfaceAndCodeController,
};
