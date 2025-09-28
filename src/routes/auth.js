import express from "express";
import logger from '#utils/logger.js';
import db from "#db";
import { authCheck } from "#middleware/auth.js";


export const authRouter = express.Router();

/**
 * @api {get} /auth/check Check
 * @apiDescription Allows client to check if they are an authorized server.
 * @apiName GetCheck
 * @apiGroup Auth
 * @apiVersion 0.1.3
 * 
 * @apiUse authCheck
 * 
 * @apiSuccess {Boolean} success Auth check passed
 */
authRouter.get("/check", authCheck, (req, res) => {
    logger.success(`${req.ownerName} (${req.serverID}) authenticated with the API`);
    res.json({ success: true });
    
    // Bookkeeping: Update last_auth_check datetime in DB
    db.query(
        "UPDATE servers SET last_auth_check = NOW() WHERE id = ?",
        [req.serverID]
    ).catch(err => {
        logger.error("Database error:", err);
    });
});