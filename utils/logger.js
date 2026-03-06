const winston = require("winston");
require("winston-daily-rotate-file");

const logFormat = winston.format.printf((info) => {
    const { level, message, timestamp, stack, ...meta } = info;

    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";

    return `${timestamp} [${level.toUpperCase()}]: ${stack || message} ${metaString}`;
});

const logger = winston.createLogger({
    level: "info",

    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),   // IMPORTANT
        logFormat
    ),

    transports: [

        new winston.transports.DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            level: "error",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        new winston.transports.DailyRotateFile({
            filename: "logs/combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

module.exports = logger;