// ============================================================
// UNO ULTRA — Colyseus schema for a single card (public state)
// ============================================================

import { Schema, type } from "@colyseus/schema";
import type { UnoCard } from "../types/card.js";
import type { UnoColor, UnoCardKind, UnoNumericValue } from "../constants/cards.js";

export class CardSchema extends Schema {
  @type("string") id: string = "";
  @type("string") color: string = "wild";
  @type("string") kind: string = "number";
  /** -1 quando la carta non e numerica (skip, reverse, draw, wild). */
  @type("number") value: number = -1;

  static fromCard(card: UnoCard): CardSchema {
    const s = new CardSchema();
    s.id = card.id;
    s.color = card.color;
    s.kind = card.kind;
    s.value = card.kind === "number" ? (card.value ?? -1) : -1;
    return s;
  }

  toCard(): UnoCard {
    if (this.kind === "number" && this.value >= 0) {
      return {
        id: this.id,
        color: this.color as UnoColor | "wild",
        kind: "number",
        value: this.value as UnoNumericValue,
      };
    }
    return {
      id: this.id,
      color: this.color as UnoColor | "wild",
      kind: this.kind as Exclude<UnoCardKind, "number">,
    };
  }
}