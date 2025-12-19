const MIN_MOD_VERSION = {
    Major: 3,
    Minor: 0,
    Patch: 0
};

import express from "express";
import logger from '#utils/logger.js';
import { createRequire } from "module";


// Get basic app info
const require = createRequire(import.meta.url);
const {
    name: appName,
    version: appVer,
    description: appDesc,
    repository: appRepo
} = require("#package");
logger.debug(`VU Progression API (v${appVer})`);

// Get XP multiplier env var, if set
const XP_MULT = parseFloat(process.env.XP_MULT) || 1.0;
logger.debug(`XP multiplier set to ${XP_MULT}`);


export const rootRouter = express.Router();

/**
 * @api {get} / Root
 * @apiDescription Returns basic API info.
 * @apiName GetInfo
 * @apiGroup Index
 * @apiVersion 0.1.2
 * 
 * @apiSuccess {String} name API Name
 * @apiSuccess {String} description API description
 * @apiSuccess {String} version API version
 * @apiSuccess {String} github API Github URL
 * @apiSuccess {Object} minModVerSupported Minimum vu-progression mod version supported by API
 * @apiSuccess {Number} minModVerSupported.Major Major revision
 * @apiSuccess {Number} minModVerSupported.Minor Minor revision
 * @apiSuccess {Number} minModVerSupported.Patch Patch revision
 * @apiSuccess {Number} xpMultiplier XP multiplier connected servers should use
 */
rootRouter.get("/", (req, res) => {
    res.json({
        name: appName,
        description: appDesc,
        version: appVer,
        github: appRepo.url,
        minModVerSupported: MIN_MOD_VERSION,
        xpMultiplier: XP_MULT
    });
});