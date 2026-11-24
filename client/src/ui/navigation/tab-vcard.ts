// ============================================================
// UNO ULTRA Client — V-Card Tab (Wallet, Economy, The Lab & Mini-Game Simulator)
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

export function createVCardView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const snap = getEconomySnapshot();
  const header = document.createElement('div');
  header.className = 'tab-status-bar glass-panel';
  header.innerHTML = `
    <div><strong>PORTAFOGLIO V-CARD & THE LAB</strong></div>
    <div class="wallet-pills">
      <span class="ultra-badge ultra-badge--gold">${snap.vcard} V-Card</span>
      <span class="ultra-badge ultra-badge--info">${snap.tournamentCredits} Crediti Torneo</span>
    </div>
  `;

  const labCard = document.createElement('div');
  labCard.className = 'ultra-card glass-panel';
  labCard.innerHTML = `
    <h3>The Lab — Simulatore Regole & Varianti (Blitz / Chaos / Team 2v2 / Custom)</h3>
    <p>Seleziona un preset, personalizza timeout o stackingCap e valida prima del lancio.</p>
  `;

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
    const check = validatePresetForPlayers(preset, variant === 'team' ? 4 : 4);
    labOut.textContent = JSON.stringify({ valid: check.ok, preset }, null, 2);
  };
  select.addEventListener('change', syncLabPreview);
  syncLabPreview();
  labCard.append(select, labOut);

  // Quick interactive testbench for all 7 mini-game engines in @uno/shared
  const miniTitle = document.createElement('h3');
  miniTitle.textContent = 'Arcade 7 Mini-Games — Tavoli Istantanei';
  const miniGrid = document.createElement('div');
  miniGrid.className = 'shop-grid';

  (Object.keys(MINI_GAME_ENGINES) as AnyMiniGameMode[]).forEach((modeKey) => {
    const engine = MINI_GAME_ENGINES[modeKey];
    const card = document.createElement('article');
    card.className = 'ultra-card glass-panel';
    card.innerHTML = `
      <h4>${engine.label}</h4>
      <p>${engine.minPlayers}–${engine.maxPlayers} giocatori · Motore deterministico condiviso</p>
    `;
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'ultra-btn ultra-btn--primary';
    playBtn.textContent = 'Gioca Tavolo Locale';
    playBtn.addEventListener('click', () => {
      openMiniGameSandboxModal(modeKey);
    });
    card.appendChild(playBtn);
    miniGrid.appendChild(card);
  });

  root.append(header, labCard, miniTitle, miniGrid);
  return root;
}

export function openMiniGameSandboxModal(mode: AnyMiniGameMode): void {
   
  const engine = MINI_GAME_ENGINES[mode] as any;
  const players = Array.from({ length: Math.max(2, engine.minPlayers) }, (_, idx) =>
    idx === 0 ? 'Tu' : `Bot_${idx}`,
  );
  let state = engine.createInitialState(`local_${mode}`, players, Date.now());

  const body = document.createElement('div');
  body.className = 'minigame-sandbox';

  const paint = (): void => {
    const view = engine.getPublicView(state, 'Tu');
    const legal = engine.getLegalActions(state, 'Tu') as Array<{ type: string; [k: string]: unknown }>;
    body.innerHTML = `<pre class="lab-json-preview">${JSON.stringify(view, null, 2)}</pre>`;

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
        const botActs = engine.getLegalActions(state, cur);
        if (botActs.length > 0) {
          state = engine.applyAction(state, cur, botActs[0]);
        }
        paint();
      });
      bar.appendChild(botBtn);
    } else {
      for (const act of legal.slice(0, 5)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ultra-btn ultra-btn--primary';
        btn.textContent = act.cardId ? `${act.type} (${String(act.cardId)})` : act.type;
        btn.addEventListener('click', () => {
          state = engine.applyAction(state, 'Tu', act);
          while (state.phase === 'playing' && state.playerOrder[state.currentTurnIndex] !== 'Tu') {
            const cur = state.playerOrder[state.currentTurnIndex];
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
