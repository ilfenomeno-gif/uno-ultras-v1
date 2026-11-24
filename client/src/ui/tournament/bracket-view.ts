// ============================================================
// UNO ULTRA Client — Two-Wing UT32 Tournament Bracket Renderer
// ============================================================

export interface UiBracketSlot {
  matchIndex: number;
  wing: 'left' | 'right' | 'final';
  round: number;
  playerA: string | null;
  playerB: string | null;
  winner: string | null;
}

export function renderBracketView(slots: readonly UiBracketSlot[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tournament-bracket';

  const makeWing = (title: string, wingSlots: readonly UiBracketSlot[]): HTMLElement => {
    const col = document.createElement('section');
    col.className = 'bracket-wing glass-panel';
    const h4 = document.createElement('h4');
    h4.textContent = title;
    col.appendChild(h4);

    for (const s of wingSlots) {
      const card = document.createElement('div');
      card.className = 'bracket-match';

      const slotA = document.createElement('div');
      slotA.className = `bracket-slot${s.winner && s.winner === s.playerA ? ' winner' : ''}`;
      slotA.textContent = s.playerA ?? 'TBD';

      const vs = document.createElement('div');
      vs.className = 'bracket-vs';
      vs.textContent = 'VS';

      const slotB = document.createElement('div');
      slotB.className = `bracket-slot${s.winner && s.winner === s.playerB ? ' winner' : ''}`;
      slotB.textContent = s.playerB ?? 'TBD';

      card.append(slotA, vs, slotB);
      col.appendChild(card);
    }
    return col;
  };

  const left = slots.filter((s) => s.wing === 'left');
  const final = slots.filter((s) => s.wing === 'final');
  const right = slots.filter((s) => s.wing === 'right');

  container.append(
    makeWing('Ala Sinistra', left),
    makeWing('Finalissima', final),
    makeWing('Ala Destra', right),
  );
  return container;
}
