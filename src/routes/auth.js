import express from "express";
import logger from '#utils/logger.js';
import { authCheck } from "#middleware/auth.js";


export const authRouter = express.Router();

/**
 * @api {get} /auth/check Check
 * @apiDescription Allows client to check if they are an authorized server.
 * @apiName GetCheck
 * @apiGroup Auth
 * @apiVersion 0.1.1
 * 
 * @apiUse authCheck
 * 
 * @apiSuccess {Boolean} success Auth check passed
 */
authRouter.get("/check", authCheck, (req, res) => {
    logger.success(`${req.ownerName} (${req.serverGUID}) authenticated with the API`);
    res.json({ success: true });
});