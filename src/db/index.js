import mysql from "mysql2/promise";
import logger from '#utils/logger.js';


// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
export default pool;

const initDB = async () => {
    logger.debug(`Logging into database at '${process.env.DB_HOST + ":" + (process.env.DB_PORT || 3306)}'...`)
    // Ensure tables exist
    try {
        await pool.query(
            `CREATE TABLE IF NOT EXISTS player_progression (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name TINYTEXT NOT NULL,
                guid TINYTEXT NOT NULL UNIQUE,
                kills INT NOT NULL DEFAULT 0,
                deaths INT NOT NULL DEFAULT 0,
                total_level INT NOT NULL DEFAULT 0,
                total_xp INT NOT NULL DEFAULT 0,
                assault_level INT NOT NULL DEFAULT 0,
                assault_xp INT NOT NULL DEFAULT 0,
                engineer_level INT NOT NULL DEFAULT 0,
                engineer_xp INT NOT NULL DEFAULT 0,
                support_level INT NOT NULL DEFAULT 0,
                support_xp INT NOT NULL DEFAULT 0,
                recon_level INT NOT NULL DEFAULT 0,
                recon_xp INT NOT NULL DEFAULT 0,
                weapon_progression TEXT NOT NULL DEFAULT '',
                vehicle_progression TEXT NOT NULL DEFAULT ''
            )`
        );
        await pool.query(
            `CREATE TABLE IF NOT EXISTS authorized_servers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_name TINYTEXT NOT NULL,
                owner_contact TINYTEXT DEFAULT NULL,
                server_guid CHAR(32) NOT NULL,
                token CHAR(64) NOT NULL,
                enabled BOOLEAN NOT NULL DEFAULT TRUE
            )`
        );
    } catch (err) {
        logger.error("Failed to initialize DB tables:", err);
        process.exit(1); // stop app if DB can't be initialized
    }
};

initDB();