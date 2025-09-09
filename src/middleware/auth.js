import db from "#db";
import logger from '#utils/logger.js';


// Middleware to check if client is an authorized server
export const authCheck = async (req, res, next) => {
    const token = req.header("X-API-TOKEN");
    const serverGuid = req.header("X-SERVER-GUID");
    if (!token || !serverGuid) {
        return res.status(401).json({ error: "Missing required auth headers" });
    }
    const serverGuidSimple = serverGuid.replace(/-/g, "").toLowerCase();
    
    try {
        const [rows] = await db.query(
            "SELECT owner_name, server_guid, enabled FROM authorized_servers WHERE token = ?",
            [token]
        );
        if (rows.length === 0) { // Token not in authorized_servers table
            logger.warn(`Rejected query from ${req.ip} with token:\n\t${token}`);
            return res.status(403).json({ error: "Invalid API token" });
        }
        if (rows[0].enabled !== 1) { // Token is disabled
            logger.warn(`Rejected query from ${rows[0].owner_name} with disabled token:\n\t${token}`);
            return res.status(403).json({ error: "Disabled API token" });
        }
        if (rows[0].server_guid !== serverGuidSimple) {
            logger.warn(`Rejected query from server (${serverGuidSimple}) with mismatching token:\n\t${token}`);
            return res.status(403).json({ error: "API token not authorized for use with this server" });
        }
        req.ownerName = rows[0].owner_name;
        req.serverGUID = rows[0].server_guid;
        next();
    } catch (err) {
        logger.error("Auth middleware error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}