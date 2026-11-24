// ============================================================
// UNO ULTRA — Colyseus schema for the authoritative room state
// ============================================================
// Le mani dei giocatori NON sono qui: vengono inviate privatamente
// al singolo client per impedire ispezione delle carte avversarie.

import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { CardSchema } from "./card-schema.js";
import { PlayerState } from "./player-state.js";

export class UnoRoomState extends Schema {
  @type("string") matchId: string = "";
  @type("string") hostId: string = "";
  /** "lobby" | "dealing" | "playing" | "finished". */
  @type("string") phase: string = "lobby";

  @type(["string"]) turnOrder = new ArraySchema<string>();
  @type("number") currentTurnIndex: number = 0;
  /** 1 = orario, -1 = antiorario. */
  @type("number") direction: number = 1;

  @type(CardSchema) topCard = new CardSchema();
  /** true solo quando topCard e effettivamente valorizzata. */
  @type("boolean") hasTopCard: boolean = false;
  /** Colore attivo corrente (dopo wild). Stringa vuota se non impostato. */
  @type("string") activeColor: string = "";

  @type("number") pendingDrawCount: number = 0;
  @type("string") winnerId: string = "";

  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}