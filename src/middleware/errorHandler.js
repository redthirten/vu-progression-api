import logger from '#utils/logger.js';


// Catches any uncaught server errors and returns a vague 500 error when running in prod
// Prevents a full HTML stacktrace being returned for security reasons
export function errorHandler(err, req, res, next) {
    logger.error(err.stack);
    
    res.status(500).json({
        error:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error."
    });
}