"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventPayments = void 0;
const db_1 = require("../config/db");
const getEventPayments = async (req, res) => {
    try {
        const result = await db_1.db.query(`
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
    }
    catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};
exports.getEventPayments = getEventPayments;
