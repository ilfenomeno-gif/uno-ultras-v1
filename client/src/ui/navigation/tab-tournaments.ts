// ============================================================
// UNO ULTRA Client — Tornei Tab (UT32, GP, Classico, Pentathlon, SSL + Crates)
// ============================================================

import { TOURNAMENT_PRESETS } from '@uno/shared';
import {
  createTournament,
  fetchTournaments,
  joinTournament,
} from '../../net/tcp/rest-client.js';
import { renderBracketView, type UiBracketSlot } from '../tournament/bracket-view.js';
import { createTournamentShopPanel } from '../tournament/tournament-shop.js';

export function createTournamentsView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const header = document.createElement('div');
  header.className = 'tab-status-bar glass-panel';
  header.innerHTML = '<strong>TORNEI UFFICIALI & CASSE PREMIO</strong> — Tabelloni a 2 Ali Simmetriche';

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback';

  const presetsGrid = document.createElement('div');
  presetsGrid.className = 'shop-grid';

  const bracketHost = document.createElement('div');
  const demoSlots: UiBracketSlot[] = [
    { matchIndex: 0, wing: 'left', round: 1, playerA: 'Nova_Strike', playerB: 'Tu', winner: null },
    { matchIndex: 1, wing: 'right', round: 1, playerA: 'Vega_Prime', playerB: 'Zenith_SSL', winner: null },
    { matchIndex: 2, wing: 'final', round: 2, playerA: null, playerB: null, winner: null },
  ];
  bracketHost.appendChild(renderBracketView(demoSlots));

  for (const preset of TOURNAMENT_PRESETS) {
    const card = document.createElement('article');
    card.className = 'ultra-card glass-panel';
    card.innerHTML = `
      <div class="card-top-row">
        <span class="ultra-badge ultra-badge--info">${preset.maxPlayers} GIOCATORI</span>
        <span class="ultra-badge ultra-badge--gold">PREMIO ${preset.prizeFirstVCard} V-Card</span>
      </div>
      <h3>${preset.title}</h3>
      <p>${preset.description}</p>
      <small>Ingresso: ${preset.entryFeeVCard === 0 ? 'Gratuito' : `${preset.entryFeeVCard} V-Card`} · Min MMR: ${preset.minMMR}</small>
    `;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ultra-btn ultra-btn--primary';
    btn.textContent = 'Apri / Iscriviti';
    btn.addEventListener('click', async () => {
      try {
        const created = await createTournament(preset.kind);
        const tid = String(created.tournament['id'] ?? '');
        if (tid) {
          const joined = await joinTournament(tid);
          bracketHost.innerHTML = '';
          bracketHost.appendChild(renderBracketView(joined.bracket as UiBracketSlot[]));
          feedback.textContent = `Iscritto a ${preset.title}! Partecipanti: ${joined.participantCount}`;
        }
      } catch (err) {
        feedback.textContent = err instanceof Error ? err.message : `Anteprima bracket ${preset.title} aggiornata`;
      }
    });
    card.appendChild(btn);
    presetsGrid.appendChild(card);
  }

  const shopTitle = document.createElement('h3');
  shopTitle.textContent = 'Shop Casse Torneo';
  const shopPanel = createTournamentShopPanel((msg) => {
    feedback.textContent = msg;
  });

  void fetchTournaments()
    .then((res) => {
      const first = res.tournaments[0];
      const bracketData = first?.['bracket_data'] as { slots?: UiBracketSlot[] } | undefined;
      if (bracketData?.slots && bracketData.slots.length > 0) {
        bracketHost.innerHTML = '';
        bracketHost.appendChild(renderBracketView(bracketData.slots));
      }
    })
    .catch(() => {});

  root.append(header, feedback, presetsGrid, bracketHost, shopTitle, shopPanel);
  return root;
}
