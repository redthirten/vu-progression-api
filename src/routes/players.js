import express from "express";
import logger from '#utils/logger.js';
import db from "#db";
import { authCheck } from "#middleware/auth.js";


// Base router for all /players routes
export const playersRouter = express.Router();

/*
* GET /players
* Description: Returns player count
*/
playersRouter.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM player_progression"
        );
        res.json(rows);
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});


// Sub-router for a specific player
const playerRouter = express.Router({ mergeParams: true });

// Middleware for /players/:guid
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

/*
* GET /players/:guid/
* Description: [Req. Auth] Returns player progression data
* Note: This can be expanded in the future to be `/players/:guid/progression` if other sub-routes are needed
* Response:
*   - 200 OK: All player data.
*   - 204 No Content: Player GUID doesn't exist in DB
*/
playerRouter.get("/", (req, res) => {
    if (!req.player) {
        logger.info(`${req.ownerName} (${req.serverGUID}) requested non-existent player progression for GUID: ${req.params.guid}`);
        return res.status(204).json({}); // No Content
    }
    
    logger.info(`${req.ownerName} (${req.serverGUID}) requested player progression for: ${req.player.name}`);
    res.json(req.player);
});

/*
* POST /players/:guid/
* Description: [Req. Auth] Updates player progression data (if new), or inserts new player if missing
* Response:
*   - 200 OK: Success
*   - 400 Bad Request: Missing or outdated data
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