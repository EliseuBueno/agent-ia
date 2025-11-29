import { config } from "../configs/config";

type LogLevel = typeof config.logger.levels[number];
type LogContext = Record<string, any> | Error | undefined;

const logger = {
  debug: (msg: string, context?: LogContext) =>
    console.log(`\x1b[90m🐞 ${msg}\x1b[0m`, context || ""),
  info: (msg: string, context?: LogContext) =>
    console.log(`\x1b[36mℹ️  ${msg}\x1b[0m`, context || ""),
  success: (msg: string, context?: LogContext) =>
    console.log(`\x1b[32m✅ ${msg}\x1b[0m`, context || ""),
  warn: (msg: string, context?: LogContext) =>
    console.warn(`\x1b[33m⚠️  ${msg}\x1b[0m`, context || ""),
  error: (msg: string, context?: LogContext) =>
    console.error(`\x1b[31m❌ ${msg}\x1b[0m`, context || ""),
};

function createLogMethod(level: LogLevel) {
  return (message: string, context?: LogContext) => {
    const logMethod = getLoggerMethod(level);
    logMethod(message, context);
  };
}

function getLoggerMethod(level: LogLevel) {
  switch (level) {
    case "debug": return logger.debug;
    case "info": return logger.info;
    case "success": return logger.success;
    case "warn": return logger.warn;
    case "error": return logger.error;
    default: return console.log;
  }
}

export const sendLog = {
  debug: createLogMethod("debug"),
  info: createLogMethod("info"),
  success: createLogMethod("success"),
  warn: createLogMethod("warn"),
  error: createLogMethod("error"),
};
