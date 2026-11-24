// ============================================================
// UNO ULTRA — Colyseus schema for a room player
// ============================================================

import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") username: string = "";
  /** Conteggio pubblico carte residue (la mano NON e mai nello state). */
  @type("number") cardCount: number = 0;
  @type("boolean") isBot: boolean = false;
  @type("boolean") isConnected: boolean = true;
  /** "AGGR" | "CONS" | "STRAT" | "" se umano. */
  @type("string") aiProfile: string = "";
  /** true se il giocatore ha premuto "UNO!" in questo turno. */
  @type("boolean") hasCalledUno: boolean = false;
  /** Cosmetici equipaggiati (id pubblici). */
  @type("string") avatarId: string = "avatar_default";
  @type("string") frameId: string = "frame_default";
  @type("string") cardBackId: string = "back_default";
  @type("string") titleId: string = "";
  /** Squadra per modalita Team 2v2 ('A' | 'B' | ''). */
  @type("string") teamId: string = "";
}