import express from "express";
import logger from '#utils/logger.js';
import db from "#db";
import { authCheck } from "#middleware/auth.js";


// Base router for all /rounds routes
export const roundsRouter = express.Router();

/**
 * @api {post} /rounds New Round
 * @apiDescription Creates a new server round for the calling server
 * @apiName PostRound
 * @apiGroup Rounds
 * @apiVersion 0.1.4
 * 
 * @apiUse authCheck
 * 
 * @apiHeader (Content) {String} Content-Type `application/json`
 * 
 * @apiBody {String} server_name The name of the server
 * @apiBody {String} gamemode The name of the gamemode
 * @apiBody {String} map The name of the map
 * 
 * @apiSuccess {Number} id New round's API ID
 * 
 * @apiError (Error 500) {String} error Database error
 */
roundsRouter.post("/", authCheck, async (req, res) => {
    try {
        const sql = `
            INSERT INTO server_round_log
            SET
                server_id = ?,
                server_name = ?,
                gamemode = ?,
                map = ?
        `;
        const [result] = await db.query(
            sql,
            [
                req.serverID,
                req.body.server_name,
                req.body.gamemode,
                req.body.map
            ]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});


// Sub-router for a specific round
const roundRouter = express.Router({ mergeParams: true });

/**
 * @apiDefine roundID Middleware for /rounds/:id
 * Request data added:
 * - {Object} req.round Round from 'server_round_log' table
 * 
 * @apiParam {Number} id Round API ID
 * @apiError (Error 404) {String} error Round not found
 * @apiError (Error 500) {String} error Database error
 */
roundRouter.use(async (req, res, next) => {
    try {
        [[req.round]] = await db.query(
            "SELECT * FROM server_round_log WHERE id = ?",
            [req.params.id]
        );
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }

    // Check for non-existent round
    if (!req.round) {
        logger.debug(`${req.ownerName} (${req.serverID}) requested non-existent round with ID: ${req.params.id}`);
        return res.status(404)
    }

    next();
});

// Sub-routes under /rounds/:id

/**
 * @api {patch} /rounds/:id Finalize Round
 * @apiDescription To be called when a round is finished and final round data needs to be patched in.
 * Should only be called by the server that created the round, and can only be called once per round.
 * @apiName PatchRound
 * @apiGroup Rounds
 * @apiVersion 0.1.4
 * 
 * @apiUse authCheck
 * @apiUse roundID
 * 
 * @apiHeader (Content) {String} Content-Type `application/json`
 * 
 * @apiBody {Number} num_players The number of connected players when the round ended
 * @apiBody {Number} winning_team_id The winning TeamID
 * @apiBody {Number} duration The duration of the round in seconds
 * 
 * @apiSuccess {Boolean} success Round was successfully finalized
 * 
 * @apiError (Error 401) {String} error You cannot finalize a round you did not create
 * @apiError (Error 423) {String} error Round has already been finalized
 * @apiError (Error 500) {String} error Database error
 */
roundRouter.patch("/", async (req, res) => {
    // Check if server created round
    if (req.serverID !== req.round.server_id) {
        return res.status(401).json(
            { error: "You cannot finalize a round you did not create" }
        );
    }
    // Check if round has already been finalized
    if (req.round.saved_at != null) {
        return res.status(423).json(
            { error: "Round has already been finalized" }
        );
    }

    try {
        const sql = `
            UPDATE server_round_log
            SET
                num_players = ?,
                winning_team_id = ?,
                duration = ?
            WHERE id = ?
        `;
        await db.query(
            sql,
            [
                req.body.num_players,
                req.body.winning_team_id,
                req.body.duration,
                req.round.id
            ]
        );
        res.json({ success: true });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

/**
 * @apiIgnore Not finished method
 * @api {get} /rounds/:id Get Round
 * @apiDescription Returns round data for the given round API ID
 * @apiName GetRound
 * @apiGroup Rounds
 * @apiVersion 0.1.4
 * 
 * @apiUse authCheck
 * @apiUse roundID
 */
// roundRouter.get("/", async (req, res) => {
//     try {
//         const sql = `
//             SELECT

//             FROM server_round_log AS srl
//             JOIN servers
//                 ON srl.server_id = servers.id
//             WHERE srl.id = ?
//         `;
//     } catch (err) {
//         logger.error(err);
//         return res.status(500).json({ error: "Database error" });
//     }
// });


// Mount the roundRouter under /:id
roundsRouter.use("/:id", authCheck, roundRouter);