import express from "express";
import logger from '#utils/logger.js';
import db from "#db";


// Base router for all /servers routes
export const serversRouter = express.Router();

/**
 * @api {get} /servers Count Servers
 * @apiDescription Returns server count.
 * @apiName GetServers
 * @apiGroup Servers
 * @apiVersion 0.1.2
 * 
 * @apiSuccess {Number} count Number of registered VU servers
 * @apiError (Error 500) {String} error Database error
 */
serversRouter.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM authorized_servers"
        );
        res.json(rows[0]);
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});