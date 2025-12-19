/**
* VU Progression API
* Copyright (C) 2026  David Wolfe (Red-Thirten)
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published
* by the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
* 
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import 'dotenv/config';
import express from 'express';
import logger from '#utils/logger.js';
import db from "#db";
import { errorHandler } from "#middleware/errorHandler.js";
import { rootRouter } from "#routes/index.js";
import { authRouter } from "#routes/auth.js";
import { playersRouter } from "#routes/players.js";
import { serversRouter } from "#routes/servers.js";
import { roundsRouter } from "#routes/rounds.js";


const app = express();

// Global middleware
app.use(express.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    next(err);
});

// Routes
app.use("/", rootRouter);
app.use("/auth", authRouter);
app.use("/players", playersRouter);
app.use("/servers", serversRouter);
app.use("/rounds", roundsRouter);

// Error handler middleware (must be last)
app.use(errorHandler);


// Start server
logger.debug("Starting API HTTP server...")
if (process.env.TRUSTED_PROXIES) { // Trust proxies if defined
    logger.debug(`Trusting proxies: ${process.env.TRUSTED_PROXIES}`);
    app.set("trust proxy", process.env.TRUSTED_PROXIES);
}
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.success(`API running on port ${PORT}`);
});

// Cleanup on shutdown
const shutdown = async () => {
    logger.debug("Shutting down API...");
    await db.end(); // Close all MySQL connections
    server.close(() => {
        logger.success("API HTTP server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);   // Ctrl+C
process.on("SIGTERM", shutdown);  // Docker / systemd