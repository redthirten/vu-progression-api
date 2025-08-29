import express from "express";
import logger from '#utils/logger.js';
import { authCheck } from "#middleware/auth.js";


export const authRouter = express.Router();

/*
* GET /auth/check
* Description: Allows client to check if they are an authorized server
*/
authRouter.get("/check", authCheck, (req, res) => {
    logger.success(`${req.ownerName} (${req.serverGUID}) authenticated with the API`);
    res.json({ success: true });
});