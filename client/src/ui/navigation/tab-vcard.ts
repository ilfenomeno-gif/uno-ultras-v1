// ============================================================
// UNO ULTRA Client — V-Card Tab & Visual 7 Mini-Games Table UI
// ============================================================

import {
  MINI_GAME_ENGINES,
  validatePresetForPlayers,
  VARIANT_PRESETS,
  type AnyMiniGameMode,
  type MatchVariant,
} from '@uno/shared';
import { getEconomySnapshot } from '../../state/inventory-store.js';
import { openModal } from '../components/modal.js';

const SUIT_GLYPHS: Readonly<Record<string, string>> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  coppe: '🏆',
  denari: '🪙',
  spade: '⚔',
  bastoni: '🪵',
};

function renderPlayingCardEl(raw: Record<string, unknown>): HTMLElement {
  const cardEl = document.createElement('div');
  const suit = String(raw['suit'] ?? '');
  const isRed = suit === 'hearts' || suit === 'diamonds' || suit === 'coppe' || suit === 'denari';
  cardEl.className = `mg-card${isRed ? ' is-red' : ''}`;

  if (typeof raw['spec'] === 'object' && raw['spec'] !== null) {
    const spec = raw['spec'] as Record<string, unknown>;
    const cat = String(spec['category'] ?? '');
    const title = document.createElement('strong');
    title.textContent =
      cat === 'distance'
        ? `${String(spec['km'] ?? '')} km`
        : String(spec['hazard'] ?? spec['remedy'] ?? spec['safety'] ?? cat).replace(/_/g, ' ');
    const sub = document.createElement('small');
    sub.textContent = cat.toUpperCase();
    cardEl.append(title, sub);
    return cardEl;
  }

  const rankNum = Number(raw['rank'] ?? 0);
  const rankLabel =
    rankNum === 1 ? 'A' : rankNum === 11 ? 'J' : rankNum === 12 ? 'Q' : rankNum === 13 ? 'K' : String(rankNum);
  const top = document.createElement('span');
  top.className = 'mg-card-rank';
  top.textContent = rankLabel;
  const glyph = document.createElement('span');
  glyph.className = 'mg-card-suit';
  glyph.textContent = SUIT_GLYPHS[suit] ?? suit.slice(0, 2);
  cardEl.append(top, glyph);
  return cardEl;
}

function renderCardStrip(title: string, cards: readonly Record<string, unknown>[]): HTMLElement {
  const sec = document.createElement('div');
  sec.className = 'mg-zone';
  const lbl = document.createElement('div');
  lbl.className = 'mg-zone-label';
  lbl.textContent = title;
  const row = document.createElement('div');
  row.className = 'mg-cards-row';
  if (cards.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'mg-empty';
    empty.textContent = 'Nessuna carta';
    row.appendChild(empty);
  } else {
    for (const c of cards) {
      row.appendChild(renderPlayingCardEl(c));
    }
  }
  sec.append(lbl, row);
  return sec;
}

export function createVCardView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const snap = getEconomySnapshot();
  const header = document.createElement('div');
  header.className = 'tab-status-bar glass-panel';
  const hLeft = document.createElement('div');
  const hTitle = document.createElement('strong');
  hTitle.textContent = 'PORTAFOGLIO V-CARD & THE LAB';
  hLeft.appendChild(hTitle);
  const pills = document.createElement('div');
  pills.className = 'wallet-pills';
  const b1 = document.createElement('span');
  b1.className = 'ultra-badge ultra-badge--gold';
  b1.textContent = `${snap.vcard} V-Card`;
  const b2 = document.createElement('span');
  b2.className = 'ultra-badge ultra-badge--info';
  b2.textContent = `${snap.tournamentCredits} Crediti Torneo`;
  pills.append(b1, b2);
  header.append(hLeft, pills);

  const labCard = document.createElement('div');
  labCard.className = 'ultra-card glass-panel';
  const labH3 = document.createElement('h3');
  labH3.textContent = 'The Lab — Simulatore Regole & Varianti (Blitz / Chaos / Team 2v2 / Custom)';
  const labP = document.createElement('p');
  labP.textContent = 'Seleziona un preset per verificare parametri e vincoli giocatori.';
  const select = document.createElement('select');
  select.className = 'launcher-select';
  (['standard', 'blitz', 'chaos', 'team', 'custom'] as const).forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v.toUpperCase();
    select.appendChild(opt);
  });

  const labOut = document.createElement('pre');
  labOut.className = 'lab-json-preview';
  const syncLabPreview = (): void => {
    const variant = select.value as MatchVariant;
    const preset = VARIANT_PRESETS[variant];
    const check = validatePresetForPlayers(preset, 4);
    labOut.textContent = JSON.stringify({ valid: check.ok, preset }, null, 2);
  };
  select.addEventListener('change', syncLabPreview);
  syncLabPreview();
  labCard.append(labH3, labP, select, labOut);

  const miniTitle = document.createElement('h3');
  miniTitle.textContent = 'Arcade 7 Mini-Games — Tavoli Visuali';
  const miniGrid = document.createElement('div');
  miniGrid.className = 'shop-grid';

  (Object.keys(MINI_GAME_ENGINES) as AnyMiniGameMode[]).forEach((modeKey) => {
    const engine = MINI_GAME_ENGINES[modeKey];
    const card = document.createElement('article');
    card.className = 'ultra-card glass-panel';
    const h4 = document.createElement('h4');
    h4.textContent = engine.label;
    const p = document.createElement('p');
    p.textContent = `${engine.minPlayers}–${engine.maxPlayers} giocatori · Tavolo visuale interattivo`;
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'ultra-btn ultra-btn--primary';
    playBtn.textContent = 'Apri Tavolo';
    playBtn.addEventListener('click', () => openMiniGameSandboxModal(modeKey));
    card.append(h4, p, playBtn);
    miniGrid.appendChild(card);
  });

  root.append(header, labCard, miniTitle, miniGrid);
  return root;
}

export function openMiniGameSandboxModal(mode: AnyMiniGameMode): void {
  const engine = MINI_GAME_ENGINES[mode];
  const players = Array.from({ length: Math.max(2, engine.minPlayers) }, (_, idx) =>
    idx === 0 ? 'Tu' : `Bot_${idx}`,
  );
  let state = engine.createInitialState(`local_${mode}`, players, Date.now());

  const body = document.createElement('div');
  body.className = 'mg-table';

  const paint = (): void => {
    const view = engine.getPublicView(state, 'Tu');
    const legal = engine.getLegalActions(state, 'Tu') as Array<{ type: string; [k: string]: unknown }>;
    body.innerHTML = '';

    // Status & scoreboard header
    const topBar = document.createElement('div');
    topBar.className = 'mg-status-bar';
    const phaseTxt = document.createElement('strong');
    phaseTxt.textContent =
      state.phase === 'finished'
        ? `Terminata · Vincitore: ${state.winnerId ?? 'Nessuno'}`
        : `Turno: ${String(view['currentPlayerId'] ?? '—')}`;
    const scoreTxt = document.createElement('span');
    const scoresObj = (view['scores'] ?? view['distances'] ?? view['chips'] ?? {}) as Record<
      string,
      number
    >;
    scoreTxt.textContent = Object.entries(scoresObj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
    topBar.append(phaseTxt, scoreTxt);
    body.appendChild(topBar);

    // Table / Dealer / Community / Distance zones
    if (Array.isArray(view['dealerCards'])) {
      body.appendChild(
        renderCardStrip(
          `Banco (nascoste: ${String(view['dealerHiddenCount'] ?? 0)})`,
          view['dealerCards'] as Record<string, unknown>[],
        ),
      );
    }
    if (Array.isArray(view['communityCards'])) {
      body.appendChild(
        renderCardStrip(
          `Community · Piatto: ${String(view['pot'] ?? 0)}`,
          view['communityCards'] as Record<string, unknown>[],
        ),
      );
    }
    if (Array.isArray(view['tableCards'])) {
      body.appendChild(renderCardStrip('Carte sul Tavolo', view['tableCards'] as Record<string, unknown>[]));
    }
    if (view['topDiscard']) {
      body.appendChild(renderCardStrip('Scarti', [view['topDiscard'] as Record<string, unknown>]));
    }
    if (view['distances']) {
      const distBox = document.createElement('div');
      distBox.className = 'mg-zone';
      const distMap = view['distances'] as Record<string, number>;
      for (const [pid, km] of Object.entries(distMap)) {
        const line = document.createElement('div');
        line.className = 'mg-distance-row';
        const lbl = document.createElement('span');
        lbl.textContent = `${pid}: ${km}/1000 km`;
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${Math.min(100, Math.round((km / 1000) * 100))}%`;
        bar.appendChild(fill);
        line.append(lbl, bar);
        distBox.appendChild(line);
      }
      body.appendChild(distBox);
    }

    // Player hand
    const myCards = (view['myHand'] ?? view['myHoleCards'] ?? []) as Record<string, unknown>[];
    body.appendChild(renderCardStrip('La Tua Mano', myCards));

    // Action bar
    const bar = document.createElement('div');
    bar.className = 'battle-actions';
    if (state.phase === 'finished') {
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'ultra-btn ultra-btn--primary';
      resetBtn.textContent = 'Nuova Mano';
      resetBtn.addEventListener('click', () => {
        state = engine.createInitialState(`local_${mode}`, players, Date.now());
        paint();
      });
      bar.appendChild(resetBtn);
    } else if (legal.length === 0) {
      const botBtn = document.createElement('button');
      botBtn.type = 'button';
      botBtn.className = 'ultra-btn ultra-btn--secondary';
      botBtn.textContent = 'Avanza Turno Bot';
      botBtn.addEventListener('click', () => {
        const cur = state.playerOrder[state.currentTurnIndex];
        if (cur) {
          const botActs = engine.getLegalActions(state, cur);
          if (botActs.length > 0) state = engine.applyAction(state, cur, botActs[0]);
        }
        paint();
      });
      bar.appendChild(botBtn);
    } else {
      for (const act of legal.slice(0, 6)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ultra-btn ultra-btn--primary';
        btn.textContent = act.cardId ? `${act.type} (${String(act.cardId)})` : act.type;
        btn.addEventListener('click', () => {
          state = engine.applyAction(state, 'Tu', act);
          while (state.phase === 'playing' && state.playerOrder[state.currentTurnIndex] !== 'Tu') {
            const cur = state.playerOrder[state.currentTurnIndex];
            if (!cur) break;
            const botActs = engine.getLegalActions(state, cur);
            if (botActs.length === 0) break;
            state = engine.applyAction(state, cur, botActs[0]);
          }
          paint();
        });
        bar.appendChild(btn);
      }
    }
    body.appendChild(bar);
  };

  paint();
  openModal({ title: engine.label, body });
}
