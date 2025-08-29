import express from "express";
import { createRequire } from "module";

// Get basic app info
const require = createRequire(import.meta.url);
const {
    name: appName,
    version: appVer,
    description: appDesc,
    repository: appRepo
} = require("#package");
console.log(`VU Progression API (v${appVer})`);


export const rootRouter = express.Router();

/*
* GET /
* Description: Returns basic API info
*/
rootRouter.get("/", (req, res) => {
    res.json({
        name: appName,
        description: appDesc,
        version: appVer,
        github: appRepo.url
    });
});