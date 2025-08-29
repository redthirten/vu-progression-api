import logger from '#utils/logger.js';


export function errorHandler(err, req, res, next) {
    logger.error(err.stack);
    
    res.status(500).json({
        error:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error."
    });
}