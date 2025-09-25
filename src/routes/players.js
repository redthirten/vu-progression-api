import express from "express";
import logger from '#utils/logger.js';
import db from "#db";
import { authCheck } from "#middleware/auth.js";


// Base router for all /players routes
export const playersRouter = express.Router();

/**
 * @api {get} /players Count Players
 * @apiDescription Returns player count.
 * @apiName GetPlayers
 * @apiGroup Players
 * @apiVersion 0.1.1
 * 
 * @apiSuccess {Number} count Number of players saved in the DB
 * @apiError (Error 500) {String} error Database error
 */
playersRouter.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM player_progression"
        );
        res.json(rows[0]);
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});


// Sub-router for a specific player
const playerRouter = express.Router({ mergeParams: true });

/**
 * @apiDefine guid Middleware for /players/:guid
 * 
 * @apiParam {String} guid Player GUID (uppercase w/ dashes)
 * @apiError (Error 500) {String} error Database error
 */
playerRouter.use(async (req, res, next) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM player_progression WHERE guid = ?",
            [req.params.guid]
        );
        req.player = rows[0];
        next();
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

// Sub-routes under /players/:guid

/**
 * @api {get} /players/:guid Get Player
 * @apiDescription Returns player progression data.
 * @apiName GetPlayer
 * @apiGroup Players
 * @apiVersion 0.1.1
 * 
 * @apiUse authCheck
 * @apiUse guid
 * 
 * @apiSuccess {String} name r_PlayerName
 * @apiSuccess {String} guid r_PlayerGuid
 * @apiSuccess {Number} kills r_Kills
 * @apiSuccess {Number} deaths r_Deaths
 * @apiSuccess {Number} total_level r_PlayerLevel
 * @apiSuccess {Number} total_xp r_PlayerCurrentXP
 * @apiSuccess {Number} assault_level r_AssaultLevel
 * @apiSuccess {Number} assault_xp r_AssaultCurrentXP
 * @apiSuccess {Number} engineer_level r_EngineerLevel
 * @apiSuccess {Number} engineer_xp r_EngineerCurrentXP
 * @apiSuccess {Number} support_level r_SupportLevel
 * @apiSuccess {Number} support_xp r_SupportCurrentXP
 * @apiSuccess {Number} recon_level r_ReconLevel
 * @apiSuccess {Number} recon_xp r_ReconCurrentXP
 * @apiSuccess {String} weapon_progression r_WeaponProgressList
 * @apiSuccess {String} vehicle_progression r_VehicleProgressList
 * 
 * @apiSuccess (Success 204) null Player GUID doesn't exist in DB
 * 
 * @apiExample {curl} Example usage:
 * curl -X POST localhost:3000/players/[guid] \
 *  -H "X-API-TOKEN: [token]" \
 *  -H "X-SERVER-GUID: [server_guid]"
 */
// Note: This can be expanded in the future to be `/players/:guid/progression` if other sub-routes are needed
playerRouter.get("/", (req, res) => {
    if (!req.player) {
        logger.info(`${req.ownerName} (${req.serverGUID}) requested non-existent player progression for GUID: ${req.params.guid}`);
        return res.status(204).json({}); // No Content
    }
    
    logger.info(`${req.ownerName} (${req.serverGUID}) requested player progression for: ${req.player.name}`);
    res.json(req.player);
});

/**
 * @api {post} /players/:guid Update Player
 * @apiDescription Updates player progression data (if new), or inserts new player if missing.
 * @apiName PostPlayer
 * @apiGroup Players
 * @apiVersion 0.1.1
 * 
 * @apiUse authCheck
 * @apiUse guid
 * 
 * @apiHeader (Content) {String} Content-Type `application/json`
 * 
 * @apiBody {String} name r_PlayerName
 * @apiBody {Number} kills r_Kills
 * @apiBody {Number} deaths r_Deaths
 * @apiBody {Number} total_level r_PlayerLevel
 * @apiBody {Number} total_xp r_PlayerCurrentXP
 * @apiBody {Number} assault_level r_AssaultLevel
 * @apiBody {Number} assault_xp r_AssaultCurrentXP
 * @apiBody {Number} engineer_level r_EngineerLevel
 * @apiBody {Number} engineer_xp r_EngineerCurrentXP
 * @apiBody {Number} support_level r_SupportLevel
 * @apiBody {Number} support_xp r_SupportCurrentXP
 * @apiBody {Number} recon_level r_ReconLevel
 * @apiBody {Number} recon_xp r_ReconCurrentXP
 * @apiBody {String} weapon_progression r_WeaponProgressList
 * @apiBody {String} vehicle_progression r_VehicleProgressList
 * 
 * @apiSuccess {Boolean} success Player data was successfully updated
 * @apiSuccess {Boolean} newPlayer Data was added to the DB as a new player
 * 
 * @apiError (Error 400) {String} error Missing or outdated body JSON data
 */
playerRouter.post("/", async (req, res) => {
    if (!req.body || !req.body.name) {
        return res.status(400).json({ error: "Missing body JSON data" });
    }
    
    const existingPlayer = req.player;
    try {
        if (existingPlayer) {
            // Check for outdated data
            if (existingPlayer.total_xp > req.body.total_xp) {
                logger.warn(`${req.ownerName} (${req.serverGUID}) tried updating ${existingPlayer.name} with old data. Skipping.`);
                return res.status(400).json({ error: "Outdated data" });
            }
            // TODO: Check for sus score increase
            const sql = `
                UPDATE player_progression
                SET
                    kills = ?,
                    deaths = ?,
                    total_level = ?,
                    total_xp = ?,
                    assault_level = ?,
                    assault_xp = ?,
                    engineer_level = ?,
                    engineer_xp = ?,
                    support_level = ?,
                    support_xp = ?,
                    recon_level = ?,
                    recon_xp = ?,
                    weapon_progression = ?,
                    vehicle_progression = ?
                WHERE guid = ?
            `;
            await db.query(
                sql,
                [
                    req.body.kills,
                    req.body.deaths,
                    req.body.total_level,
                    req.body.total_xp,
                    req.body.assault_level,
                    req.body.assault_xp,
                    req.body.engineer_level,
                    req.body.engineer_xp,
                    req.body.support_level,
                    req.body.support_xp,
                    req.body.recon_level,
                    req.body.recon_xp,
                    req.body.weapon_progression,
                    req.body.vehicle_progression,
                    req.params.guid
                ]
            );
            logger.info(`${req.ownerName} (${req.serverGUID}) updated player progression for: ${existingPlayer.name}`);
            res.json({
                success: true,
                newPlayer: false
            });
        } else {
            const sql = `
                INSERT INTO player_progression (
                    name,
                    guid,
                    kills,
                    deaths,
                    total_level,
                    total_xp,
                    assault_level,
                    assault_xp,
                    engineer_level,
                    engineer_xp,
                    support_level,
                    support_xp,
                    recon_level,
                    recon_xp,
                    weapon_progression,
                    vehicle_progression
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(
                sql,
                [
                    req.body.name,
                    req.params.guid,
                    req.body.kills,
                    req.body.deaths,
                    req.body.total_level,
                    req.body.total_xp,
                    req.body.assault_level,
                    req.body.assault_xp,
                    req.body.engineer_level,
                    req.body.engineer_xp,
                    req.body.support_level,
                    req.body.support_xp,
                    req.body.recon_level,
                    req.body.recon_xp,
                    req.body.weapon_progression,
                    req.body.vehicle_progression
                ]
            );
            logger.info(`${req.ownerName} (${req.serverGUID}) added player progression for: ${req.body.name}`);
            res.json({
                success: true,
                newPlayer: true
            });
        }
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


// Mount the playerRouter under /:guid
playersRouter.use("/:guid", authCheck, playerRouter);