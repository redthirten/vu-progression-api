import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Custom level config
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        success: 2,
        info: 3,
        debug: 4,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        success: 'green',
        info: 'blue',
        debug: 'gray',
    }
};
winston.addColors(customLevels.colors);

// Ensure /logs directory exists
const logDir = path.resolve('./logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Console transport (with color)
const consoleTransport = new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => {
            const level = info.level.toUpperCase(); // uppercase first
            return `[${info.timestamp}] ${level}: ${info.message}`;
        }),
        winston.format.colorize({ all: true }) // color the whole line after formatting
    )
});

// Daily rotate transport (no color)
const dailyRotateTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'api-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxFiles: '14d', // keep 14 days of logs
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    )
});

const logger = winston.createLogger({
    levels: customLevels.levels,
    transports: [consoleTransport, dailyRotateTransport]
});

export default logger;
