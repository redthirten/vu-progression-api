import express from "express";
import logger from '#utils/logger.js';
import { createRequire } from "module";

const MIN_MOD_VERSION = {
    Major: 2,
    Minor: 1,
    Patch: 1
};
const XP_MULT = parseFloat(process.env.XP_MULT) || 1.0;
logger.debug(`XP multiplier set to ${XP_MULT}`);

// Get basic app info
const require = createRequire(import.meta.url);
const {
    name: appName,
    version: appVer,
    description: appDesc,
    repository: appRepo
} = require("#package");
logger.debug(`VU Progression API (v${appVer})`);


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
        minModVerSupported: {
            Major: MIN_MOD_VERSION.Major,
            Minor: MIN_MOD_VERSION.Minor,
            Patch: MIN_MOD_VERSION.Patch
        },
        xpMultiplier: XP_MULT
    });
});