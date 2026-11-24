// ============================================================
// UNO ULTRA Server — Abstract Colyseus BaseRoom
// ============================================================

import { Room, type Client } from 'colyseus';
import { logger } from '../../config/logger.js';

export abstract class BaseRoom<TState extends object = object> extends Room<TState> {
  protected logInfo(msg: string, extra?: Record<string, unknown>): void {
    logger.info({ roomId: this.roomId, roomName: this.roomName, ...extra }, msg);
  }

  protected logWarn(msg: string, extra?: Record<string, unknown>): void {
    logger.warn({ roomId: this.roomId, roomName: this.roomName, ...extra }, msg);
  }

  protected logError(msg: string, err: unknown, extra?: Record<string, unknown>): void {
    logger.error({ roomId: this.roomId, roomName: this.roomName, err, ...extra }, msg);
  }

  protected sendSafe(client: Client, type: string, message: unknown): void {
    try {
      client.send(type, message);
    } catch (err) {
      this.logWarn('Failed to send message to client', {
        sessionId: client.sessionId,
        type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
