// Custom query sanitization middleware factories

import logger from '#utils/logger.js';
/**
* Express middleware that sanitizes specified query keys by parsing their mapped values as integers,
* applying a default value if missing or NaN, and clamping them between optional min and max values.
* The query keys are added as req keys (with the same name) mapped to their new, sanitized values.
*
* @param {Object<string, {default: number, min?: number, max?: number}>} config
*   An object mapping query keys to their sanitization rules
* @returns {import('express').RequestHandler} An Express middleware function
*/
export function sanitizeIntQueries(config) {
    return (req, res, next) => {
        for (const [key, rules] of Object.entries(config)) {
            let out = parseInt(req.query[key], 10);
            
            // Use default if parse failed
            out = Number.isNaN(out) ? rules.default : out;
            
            // Clamp between min and max
            if (typeof rules.min === 'number') {
                out = Math.max(rules.min, out);
            }
            if (typeof rules.max === 'number') {
                out = Math.min(rules.max, out);
            }
            
            req[key] = out;
        }
        
        next();
    };
}