// Require Body Data middleware factory

/**
* Express middleware that validates the presence and non-nullish values of specified keys in `req.body`.
* If `req.body` is missing, or any required key is absent, null, or undefined, the request is rejected
* with a 400 Bad Request response and a descriptive JSON error message.
*
* @param {...string} keys
*   The list of required body keys to validate
* @returns {import('express').RequestHandler}
*   An Express middleware function
*/
export function requireBodyData(...keys) {
    /**
     * @apiDefine requireBodyData
     * @apiError (Error 400) {String} error Missing or invalid body JSON data
     */
    return (req, res, next) => {
        const error = "Missing or invalid body JSON data";

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error });
        }
        
        const missing = [];
        const nullish = [];
        
        for (const key of keys) {
            if (!(key in req.body)) {
                missing.push(key);
            } else if (req.body[key] == null) {
                nullish.push(key);
            }
        }
        
        if (missing.length || nullish.length) {
            return res.status(400).json({
                error,
                missing: missing.length ? missing : undefined,
                nullValues: nullish.length ? nullish : undefined,
            });
        }
        
        next();
    };
}