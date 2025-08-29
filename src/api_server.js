/**
* VU Progression API
* Copyright (C) 2025  David Wolfe (Red-Thirten)
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
import db from "#db";
import { errorHandler } from "#middleware/errorHandler.js";
import { rootRouter } from "#routes/index.js";
import { authRouter } from "#routes/auth.js";
import { playersRouter } from "#routes/players.js";


const app = express();

// Global middleware
app.use(express.json());

// Routes
app.use("/", rootRouter);
app.use("/auth", authRouter);
app.use("/players", playersRouter);

// Error handler middleware (must be last)
app.use(errorHandler);


// Start server
console.log("Starting API service...")
if (process.env.TRUSTED_PROXIES) { // Trust proxies if defined
    console.log(`Trusting proxies: ${process.env.TRUSTED_PROXIES}`);
    app.set("trust proxy", process.env.TRUSTED_PROXIES);
}
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});

// Cleanup on shutdown
const shutdown = async () => {
    console.log("Shutting down...");
    await db.end(); // Close all MySQL connections
    server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);   // Ctrl+C
process.on("SIGTERM", shutdown);  // Docker / systemd