import { getLogger } from "./logger";

const pino = getLogger();

/**
 * Simple logger wrapper that accepts different formats
 */
export const logger = {
  info: (message: string, context?: any) => {
    if (context) {
      pino.info(context, message);
    } else {
      pino.info(message);
    }
  },
  error: (message: string, error?: any) => {
    if (error) {
      pino.error({ err: error }, message);
    } else {
      pino.error(message);
    }
  },
  warn: (message: string, context?: any) => {
    if (context) {
      pino.warn(context, message);
    } else {
      pino.warn(message);
    }
  },
  debug: (message: string, context?: any) => {
    if (context) {
      pino.debug(context, message);
    } else {
      pino.debug(message);
    }
  }
};