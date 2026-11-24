// ============================================================
// UNO ULTRA Client — Opponents Panel
// ============================================================

export interface OpponentSummary {
  id: string;
  username: string;
  cardCount: number;
  isBot: boolean;
  isCurrent: boolean;
  hasCalledUno: boolean;
  isConnected: boolean;
}

export function renderOpponents(
  container: HTMLElement,
  players: readonly OpponentSummary[],
  myId: string
): void {
  container.innerHTML = '';

  const opponents = players.filter((p) => p.id !== myId);
  for (const p of opponents) {
    const el = document.createElement('div');
    el.className = 'opponent';
    if (p.isCurrent) el.classList.add('is-current');
    if (!p.isConnected && !p.isBot) el.classList.add('is-offline');

    const nameEl = document.createElement('div');
    nameEl.className = 'opponent__name';
    nameEl.textContent = p.username;

    if (p.isBot) {
      const botTag = document.createElement('span');
      botTag.className = 'opponent__tag';
      botTag.textContent = 'BOT';
      nameEl.appendChild(botTag);
    }

    const countEl = document.createElement('div');
    countEl.className = 'opponent__count';
    countEl.textContent = `🂠 ${p.cardCount} ${p.cardCount === 1 ? 'carta' : 'carte'}`;

    el.append(nameEl, countEl);

    if (p.hasCalledUno) {
      const unoTag = document.createElement('div');
      unoTag.className = 'opponent__uno';
      unoTag.textContent = 'UNO!';
      el.appendChild(unoTag);
    }

    container.appendChild(el);
  }
}
