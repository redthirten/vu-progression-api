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
 * @apiVersion 0.1.3
 * 
 * @apiSuccess {Number} count Number of players saved in the DB
 * @apiError (Error 500) {String} error Database error
 */
playersRouter.get("/", async (req, res) => {
    try {
        const [[count]] = await db.query(
            "SELECT COUNT(*) AS count FROM players"
        );
        res.json(count);
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
        [[req.player]] = await db.query(
            "SELECT * FROM players WHERE guid = ?",
            [req.params.guid]
        );
        next();
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

// Sub-routes under /players/:guid

/**
 * @api {get} /players/:guid Get Player Info
 * @apiDescription Returns basic player info.
 * @apiName GetPlayer
 * @apiGroup Players
 * @apiVersion 0.1.3
 * 
 * @apiUse authCheck
 * @apiUse guid
 * 
 * @apiSuccess {Number} id Player's API ID
 * @apiSuccess {String} name r_PlayerName
 * @apiSuccess {String} guid r_PlayerGuid
 * @apiSuccess {Datetime} created_at Datetime the player was added to the DB
 * @apiSuccess {Number} last_server_id Server API ID the player last played on
 * 
 * @apiSuccess (Success 204) null Player GUID doesn't exist in DB
 */
playerRouter.get("/", (req, res) => {
    // Check for non-existent player
    if (!req.player) {
        logger.info(`${req.ownerName} (${req.serverID}) requested non-existent player info for GUID: ${req.params.guid}`);
        return res.status(204).json({}); // No Content
    }

    logger.info(`${req.ownerName} (${req.serverID}) requested player info for: ${req.player.name}`);
    res.json(req.player);
});

/**
 * @api {get} /players/:guid/progression Get Player Progression
 * @apiDescription Returns player progression data.
 * @apiName GetPlayerProgression
 * @apiGroup Players
 * @apiVersion 0.1.3
 * 
 * @apiUse authCheck
 * @apiUse guid
 * 
 * @apiSuccess {Datetime} last_updated The last datetime the player's data was updated
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
 * @apiExample {curl} Example usage:
 * curl -X GET localhost:3000/players/[player_guid]/progression \
 *  -H "X-API-TOKEN: [token]" \
 *  -H "X-SERVER-GUID: [server_guid]"
 */
playerRouter.get("/progression", async (req, res) => {
    // Check for non-existent player
    if (!req.player) {
        logger.info(`${req.ownerName} (${req.serverID}) requested non-existent player progression for GUID: ${req.params.guid}`);
        return res.status(204).json({}); // No Content
    }

    try {
        const [[progData] = [{}]] = await db.query(
            "SELECT * FROM player_progression WHERE player_id = ?",
            [req.player.id]
        );

        logger.info(`${req.ownerName} (${req.serverID}) requested player progression for: ${req.player.name}`);
        res.json(progData);
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

/**
 * @api {post} /players/:guid/progression Set Player Progression
 * @apiDescription
 * Updates player progression data (if newer than existing data) and last played server ID.
 * Creates a new player if one does not exist yet for the given GUID.
 * Creates a new save log.
 * @apiName PostPlayerProgression
 * @apiGroup Players
 * @apiVersion 0.1.3
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
 * 
 * @apiExample {curl} Example usage:
 * curl -X POST localhost:3000/players/[player_guid]/progression \
 *     -H "Content-Type: application/json" \
 *     -H "X-API-TOKEN: [token]" \
 *     -H "X-SERVER-GUID: [server_guid]" \
 *     -d '{
 *             "name": "Test",
 *             "kills": 1,
 *             "deaths": 2,
 *             "total_level": 3,
 *             "total_xp": 4,
 *             "assault_level": 5,
 *             "assault_xp": 6,
 *             "engineer_level": 7,
 *             "engineer_xp": 8,
 *             "support_level": 9,
 *             "support_xp": 10,
 *             "recon_level": 11,
 *             "recon_xp": 12,
 *             "weapon_progression": "M16A4,5",
 *             "vehicle_progression": "Jets,101"
 *         }'
 */
playerRouter.post("/progression", async (req, res) => {
    if (!req.body || (!req.player && !req.body.name)) {
        return res.status(400).json({ error: "Missing body JSON data" });
    }

    const saveLogSQL = `
        INSERT INTO player_save_log
        SET
            player_id = ?,
            server_id = ?,
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
    `;
    
    try {
        if (req.player) { // Player exists -- Update
            // Get current progression data
            const [[curProgData]] = await db.query(
                "SELECT * FROM player_progression WHERE player_id = ?",
                [req.player.id]
            );
            // Check for outdated data
            if (curProgData.total_xp > req.body.total_xp) {
                logger.warn(`${req.ownerName} (${req.serverID}) tried updating ${req.player.name} with old data. Skipping.`);
                return res.status(400).json({ error: "Outdated data" });
            }
            // Check for sus score increase
            const totalXpGained = req.body.total_xp - curProgData.total_xp;
            if (totalXpGained >= process.env.XP_WARN_AT) {
                logger.warn(`${req.ownerName} (${req.serverID}) is adding ${totalXpGained} total XP to: ${req.player.name}`);
            }
            // Update last server ID
            await db.query(
                "UPDATE players SET last_server_id = ? WHERE id = ?",
                [req.serverID, req.player.id]
            );
            // Update player progression data
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
                WHERE player_id = ?
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
                    req.player.id
                ]
            );

            // Add new save log
            await db.query(
                saveLogSQL,
                [
                    req.player.id,
                    req.serverID,
                    req.body.kills - curProgData.kills,
                    req.body.deaths - curProgData.deaths,
                    req.body.total_level - curProgData.total_level,
                    req.body.total_xp - curProgData.total_xp,
                    req.body.assault_level - curProgData.assault_level,
                    req.body.assault_xp - curProgData.assault_xp,
                    req.body.engineer_level - curProgData.engineer_level,
                    req.body.engineer_xp - curProgData.engineer_xp,
                    req.body.support_level - curProgData.support_level,
                    req.body.support_xp - curProgData.support_xp,
                    req.body.recon_level - curProgData.recon_level,
                    req.body.recon_xp - curProgData.recon_xp,
                    req.body.weapon_progression,
                    req.body.vehicle_progression
                ]
            );

            logger.info(`${req.ownerName} (${req.serverID}) updated player progression for: ${req.player.name}`);
            res.json({
                success: true,
                newPlayer: false
            });
        }
        else { // New player -- Add
            // Add new player info
            const [result] = await db.query(
                "INSERT INTO players SET name = ?, guid = ?, last_server_id = ?",
                [req.body.name, req.params.guid, req.serverID]
            );
            // Add player progression data
            const sql = `
                INSERT INTO player_progression
                SET
                    player_id = ?,
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
            `;
            let vars = [
                result.insertId,
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
            ];
            await db.query(sql, vars);
            
            // Add save log
            vars.splice(1, 0, req.serverID);
            await db.query(saveLogSQL, vars);

            logger.info(`${req.ownerName} (${req.serverID}) added player progression for: ${req.body.name}`);
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