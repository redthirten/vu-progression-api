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
            `CREATE TABLE IF NOT EXISTS servers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_name TINYTEXT NOT NULL,
                owner_contact TINYTEXT DEFAULT NULL,
                created_on DATE DEFAULT CURRENT_DATE,
                last_auth_check DATETIME DEFAULT NULL,
                last_ip VARCHAR(45) DEFAULT NULL,
                server_guid CHAR(32) NOT NULL UNIQUE,
                token CHAR(64) NOT NULL UNIQUE,
                authorized BOOLEAN NOT NULL DEFAULT TRUE
            )`
        );
        await pool.query(
            `CREATE TABLE IF NOT EXISTS players (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name TINYTEXT NOT NULL,
                guid TINYTEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_server_id INT DEFAULT NULL
            )`
        );
        await pool.query(
            `CREATE TABLE IF NOT EXISTS player_progression (
                player_id INT PRIMARY KEY,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
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
                vehicle_progression TEXT NOT NULL DEFAULT '',
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
            )`
        );
        await pool.query(
            `CREATE TABLE IF NOT EXISTS player_save_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player_id INT NOT NULL,
                server_id INT,
                saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
                vehicle_progression TEXT NOT NULL DEFAULT '',
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
                FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL
            )`
        );
    } catch (err) {
        logger.error("Failed to initialize DB tables:", err);
        process.exit(1); // stop app if DB can't be initialized
    }
};

initDB();