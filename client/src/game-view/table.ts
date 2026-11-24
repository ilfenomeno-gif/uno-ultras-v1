// ============================================================
// UNO ULTRA Client — Playable UNO Table View (ASTRALIS v3 A11y)
// ============================================================

import type { Room } from 'colyseus.js';
import {
  UNO_COLORS,
  type MatchEndedMessage,
  type RankTier,
  type UnoCard,
  type UnoCardKind,
  type UnoColor,
  type UnoNumericValue,
  type UnoRoomState,
} from '@uno/shared';
import { announce, purgeOnClose } from '../core/aria-live.js';
import { playEarcon } from '../core/audio-earcons.js';
import {
  computeSafeLoopIndex,
  hasBlockedModifier,
  resolveCardShortcutIndex,
} from '../core/keyboard-nav.js';
import { colyseus } from '../net/connection-manager.js';
import { getProfile, patchProfile } from '../state/profile-store.js';
import {
  loadSettings,
  subscribeSettings,
  type ClientSettings,
} from '../ui/shell/settings-modal.js';
import { formatCardSpeechLabel, formatColorLabel } from './card-format.js';
import { renderHand } from './hand.js';
import { renderDiscardPile } from './discard-pile.js';
import { renderOpponents, type OpponentSummary } from './opponent-panel.js';
import { renderActionHints } from './action-hints.js';

export interface GameViewOptions {
  room: Room<UnoRoomState>;
  onExit: () => Promise<void> | void;
}

function extractTopCard(state: UnoRoomState): UnoCard | null {
  if (!state.hasTopCard || !state.topCard || !state.topCard.id) {
    return null;
  }
  const raw = state.topCard;
  const color = raw.color as UnoColor | 'wild';
  const kind = raw.kind as UnoCardKind;
  if (kind === 'number') {
    return {
      id: raw.id,
      color,
      kind: 'number',
      value: raw.value as UnoNumericValue,
    };
  }
  return {
    id: raw.id,
    color,
    kind,
  };
}

function parseActiveColor(value: string): UnoColor | null {
  if ((UNO_COLORS as readonly string[]).includes(value)) {
    return value as UnoColor;
  }
  return null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function mountGameView(container: HTMLElement, opts: GameViewOptions): () => void {
  const { room } = opts;
  const myId = getProfile()?.id ?? room.sessionId;

  const root = document.createElement('section');
  root.className = 'game-view';
  root.setAttribute('aria-label', 'Tavolo UNO ULTRA');
  root.innerHTML = `
    <div class="game-view__header">
      <button class="game-view__exit" type="button">ESCI</button>
      <div class="game-view__status" data-role="status">Connessione al tavolo…</div>
      <div class="game-view__room-id" data-role="room-id"></div>
    </div>
    <div class="game-view__opponents" data-role="opponents"></div>
    <div class="game-view__table">
      <div class="game-view__discard" data-role="discard"></div>
    </div>
    <div class="game-view__hints" data-role="hints"></div>
    <div class="game-view__hand" data-role="hand" role="region" aria-label="La tua mano di carte"></div>

    <div class="game-overlay" data-role="lobby-overlay" hidden>
      <div class="game-modal glass-panel" role="dialog" aria-modal="true" aria-label="Sala d'Attesa UNO">
        <h2>Sala d'Attesa UNO</h2>
        <p data-role="lobby-count">Giocatori connessi: 1</p>
        <button type="button" class="launcher-play-btn" data-action="start-bots" hidden>
          AVVIA CON BOT
        </button>
      </div>
    </div>

    <div class="game-overlay" data-role="wild-overlay" hidden>
      <div class="game-modal glass-panel" role="dialog" aria-modal="true" aria-label="Scegli il Colore">
        <h2>Scegli il Colore</h2>
        <div class="wild-color-grid" data-role="wild-grid"></div>
        <button type="button" class="hint-btn" data-action="cancel-wild">ANNULLA</button>
      </div>
    </div>

    <div class="game-overlay" data-role="ended-overlay" hidden>
      <div class="game-modal glass-panel" role="dialog" aria-modal="true" aria-label="Partita Terminata">
        <h2 data-role="ended-title">Partita Terminata</h2>
        <p data-role="ended-winner"></p>
        <div class="scores-list" data-role="scores-list"></div>
        <div class="mcp-rewards-box" data-role="mcp-rewards" hidden></div>
        <div data-role="rematch-status" style="font-size:0.85rem;margin:0.4rem 0;"></div>
        <div class="battle-actions" style="justify-content:center;margin-top:0.6rem;">
          <button type="button" class="launcher-play-btn" data-action="rematch">
            RIVINCITA (1-TAP)
          </button>
          <button type="button" class="hint-btn" data-action="back-lobby">
            TORNA IN LOBBY
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(root);

  const statusEl = root.querySelector<HTMLElement>('[data-role="status"]')!;
  const roomIdEl = root.querySelector<HTMLElement>('[data-role="room-id"]')!;
  const opponentsEl = root.querySelector<HTMLElement>('[data-role="opponents"]')!;
  const discardEl = root.querySelector<HTMLElement>('[data-role="discard"]')!;
  const hintsEl = root.querySelector<HTMLElement>('[data-role="hints"]')!;
  const handEl = root.querySelector<HTMLElement>('[data-role="hand"]')!;
  const lobbyOverlay = root.querySelector<HTMLElement>('[data-role="lobby-overlay"]')!;
  const lobbyCountEl = root.querySelector<HTMLElement>('[data-role="lobby-count"]')!;
  const startBotsBtn = root.querySelector<HTMLButtonElement>('[data-action="start-bots"]')!;
  const wildOverlay = root.querySelector<HTMLElement>('[data-role="wild-overlay"]')!;
  const wildGrid = root.querySelector<HTMLElement>('[data-role="wild-grid"]')!;
  const cancelWildBtn = root.querySelector<HTMLButtonElement>('[data-action="cancel-wild"]')!;
  const endedOverlay = root.querySelector<HTMLElement>('[data-role="ended-overlay"]')!;
  const endedTitleEl = root.querySelector<HTMLElement>('[data-role="ended-title"]')!;
  const endedWinnerEl = root.querySelector<HTMLElement>('[data-role="ended-winner"]')!;
  const scoresListEl = root.querySelector<HTMLElement>('[data-role="scores-list"]')!;
  const mcpRewardsEl = root.querySelector<HTMLElement>('[data-role="mcp-rewards"]')!;
  const rematchStatusEl = root.querySelector<HTMLElement>('[data-role="rematch-status"]')!;
  const rematchBtn = root.querySelector<HTMLButtonElement>('[data-action="rematch"]')!;
  const backLobbyBtn = root.querySelector<HTMLButtonElement>('[data-action="back-lobby"]')!;
  const exitBtn = root.querySelector<HTMLButtonElement>('.game-view__exit')!;

  roomIdEl.textContent = `Room ${room.roomId}`;

  let settings: ClientSettings = loadSettings();
  let currentHand: UnoCard[] = [];
  let displayedHand: UnoCard[] = [];
  let currentState: UnoRoomState | null = room.state ?? null;
  let errorBanner: string | null = null;
  let unoBanner: string | null = null;
  let pendingWildCard: UnoCard | null = null;
  let endedMessage: MatchEndedMessage | null = null;
  let prevMyTurn = false;
  let prevPhase = '';

  const focusFirstHandOrDraw = (): void => {
    const firstCard = handEl.querySelector<HTMLButtonElement>('.uno-card');
    if (firstCard) {
      firstCard.focus();
      return;
    }
    hintsEl.querySelector<HTMLButtonElement>('[data-action="draw"]')?.focus();
  };

  const chooseWildColor = (color: UnoColor): void => {
    if (!pendingWildCard) return;
    const cardId = pendingWildCard.id;
    pendingWildCard = null;
    wildOverlay.hidden = true;
    purgeOnClose();
    playEarcon('play_card');
    colyseus.sendAction({
      type: 'play_card',
      cardId,
      chosenColor: color,
    });
    focusFirstHandOrDraw();
  };

  const cancelWildSelection = (): void => {
    if (wildOverlay.hidden) return;
    pendingWildCard = null;
    wildOverlay.hidden = true;
    purgeOnClose();
    playEarcon('modal_close');
    focusFirstHandOrDraw();
  };

  UNO_COLORS.forEach((color, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wild-color-btn';
    btn.dataset['color'] = color;
    const label = formatColorLabel(color);
    btn.textContent = `${idx + 1}. ${label}`;
    btn.setAttribute('aria-label', `${label}, tasto ${idx + 1}`);
    btn.addEventListener('click', () => chooseWildColor(color));
    wildGrid.appendChild(btn);
  });

  cancelWildBtn.addEventListener('click', cancelWildSelection);

  startBotsBtn.addEventListener('click', () => {
    startBotsBtn.disabled = true;
    playEarcon('confirm');
    colyseus.startMatch();
  });

  let exiting = false;
  const handleExit = async (): Promise<void> => {
    if (exiting) return;
    exiting = true;
    exitBtn.disabled = true;
    backLobbyBtn.disabled = true;
    purgeOnClose();
    playEarcon('modal_close');
    try {
      await colyseus.leaveRoom();
    } finally {
      await opts.onExit();
    }
  };

  exitBtn.addEventListener('click', () => void handleExit());
  backLobbyBtn.addEventListener('click', () => void handleExit());
  rematchBtn.addEventListener('click', () => {
    rematchBtn.disabled = true;
    playEarcon('confirm');
    room.send('rematch_vote');
  });

  const handlePlayCard = (card: UnoCard): void => {
    errorBanner = null;
    if (card.color === 'wild') {
      pendingWildCard = card;
      wildOverlay.hidden = false;
      playEarcon('modal_open');
      announce(
        'Scegli il colore del Jolly: 1 Rosso, 2 Giallo, 3 Verde, 4 Blu',
        'assertive'
      );
      wildGrid.querySelector<HTMLButtonElement>('.wild-color-btn')?.focus();
      return;
    }
    playEarcon('play_card');
    colyseus.sendAction({
      type: 'play_card',
      cardId: card.id,
    });
  };

  const triggerDraw = (): void => {
    errorBanner = null;
    playEarcon('draw');
    colyseus.sendAction({ type: 'draw_card' });
  };

  const triggerCallUno = (): void => {
    errorBanner = null;
    playEarcon('uno');
    colyseus.callUno();
  };

  const triggerChallengeWild4 = (): void => {
    errorBanner = null;
    playEarcon('confirm');
    colyseus.challengeWild4();
  };

  const render = (): void => {
    const state = currentState;
    if (!state) return;

    const activeEl = document.activeElement;
    const prevHandButtons = Array.from(handEl.querySelectorAll<HTMLButtonElement>('.uno-card'));
    const hadHandFocus = activeEl instanceof HTMLElement && handEl.contains(activeEl);
    const activeCardId =
      hadHandFocus && activeEl instanceof HTMLElement
        ? (activeEl.dataset['cardId'] ?? null)
        : null;
    const prevFocusIdx =
      hadHandFocus && activeEl instanceof HTMLButtonElement
        ? prevHandButtons.indexOf(activeEl)
        : -1;

    const currentPlayerId = state.turnOrder[state.currentTurnIndex] ?? '';
    const players: OpponentSummary[] = [];
    const nameMap = new Map<string, string>();
    let myHasCalledUno = false;

    state.players.forEach((p, key) => {
      nameMap.set(key, p.username);
      if (key === myId) {
        myHasCalledUno = p.hasCalledUno;
      }
      players.push({
        id: key,
        username: p.username,
        cardCount: p.cardCount,
        isBot: p.isBot,
        isCurrent: key === currentPlayerId,
        hasCalledUno: p.hasCalledUno,
        isConnected: p.isConnected,
      });
    });

    // Lobby attesa prima dell'avvio
    if (state.phase === 'lobby') {
      lobbyOverlay.hidden = false;
      lobbyCountEl.textContent = `Giocatori connessi: ${players.length}`;
      startBotsBtn.hidden = state.hostId !== myId;
      startBotsBtn.disabled = false;
    } else {
      lobbyOverlay.hidden = true;
    }

    // Fine partita
    if (state.phase === 'finished' || endedMessage !== null) {
      endedOverlay.hidden = false;
      const winnerId = endedMessage?.winnerId ?? state.winnerId;
      const winnerName = nameMap.get(winnerId) ?? winnerId;
      const iWon = winnerId === myId;
      endedTitleEl.textContent = iWon ? 'VITTORIA!' : 'PARTITA TERMINATA';
      endedWinnerEl.textContent = iWon
        ? 'Hai vinto la partita!'
        : `Vincitore: ${winnerName}`;

      scoresListEl.innerHTML = '';
      if (endedMessage) {
        const sorted = Object.entries(endedMessage.scores).sort((a, b) => b[1] - a[1]);
        for (const [pid, pts] of sorted) {
          const row = document.createElement('div');
          row.className = `scores-row${pid === winnerId ? ' is-winner' : ''}`;
          const label = nameMap.get(pid) ?? pid;
          const nameSpan = document.createElement('span');
          nameSpan.textContent = label;
          const ptsSpan = document.createElement('span');
          ptsSpan.textContent = `${pts >= 0 ? `+${pts}` : pts} pt`;
          row.append(nameSpan, ptsSpan);
          scoresListEl.appendChild(row);
        }
      }

      const myReceipt = endedMessage?.receipts?.[myId];
      mcpRewardsEl.replaceChildren();
      if (myReceipt) {
        mcpRewardsEl.hidden = false;
        const mmrSign = myReceipt.mmrDelta >= 0 ? `+${myReceipt.mmrDelta}` : String(myReceipt.mmrDelta);
        const items: Array<[string, string]> = [
          ['MMR', `${myReceipt.isRanked ? mmrSign : 'Casuale'} (${myReceipt.mmrAfter})`],
          ['Grado', `${myReceipt.rankAfter}${myReceipt.rankPromoted ? ' · PROMOZIONE!' : ''}`],
          ['Battle Card', `+${myReceipt.xpEarned} XP (Lv.${myReceipt.battleCardLevelAfter})`],
          ['V-Card', `+${myReceipt.vcardEarned} (Tot ${myReceipt.vcardBalanceAfter})`],
          ['Sfide', `+${myReceipt.challengesProgressed} aggiornate`],
        ];
        for (const [k, v] of items) {
          const chip = document.createElement('div');
          chip.className = 'scores-row';
          const lbl = document.createElement('span');
          lbl.textContent = k;
          const val = document.createElement('strong');
          val.textContent = v;
          chip.append(lbl, val);
          mcpRewardsEl.appendChild(chip);
        }
      } else {
        mcpRewardsEl.hidden = true;
      }
    } else {
      endedOverlay.hidden = true;
    }

    const isSpectator = state.phase === 'playing' && !state.players.has(myId);
    const isMyTurn = state.phase === 'playing' && currentPlayerId === myId;
    const topCard = extractTopCard(state);
    const activeColor = parseActiveColor(state.activeColor);

    statusEl.classList.toggle('is-my-turn', isMyTurn);
    statusEl.classList.toggle('is-error', errorBanner !== null);

    if (errorBanner) {
      statusEl.textContent = `⚠ ${errorBanner}`;
    } else if (unoBanner) {
      statusEl.textContent = unoBanner;
    } else if (state.phase === 'lobby') {
      statusEl.textContent = 'In attesa dei giocatori…';
    } else if (state.phase === 'finished') {
      statusEl.textContent = 'Partita terminata';
    } else if (isSpectator) {
      const turnName = nameMap.get(currentPlayerId) ?? '…';
      statusEl.textContent = `MODALITÀ SPETTATORE · Turno di ${turnName}`;
    } else if (isMyTurn) {
      statusEl.textContent = `Tocca a te — Colore: ${formatColorLabel(state.activeColor)}`;
    } else {
      const turnName = nameMap.get(currentPlayerId) ?? '…';
      statusEl.textContent = `Turno di ${turnName}`;
    }

    renderOpponents(opponentsEl, players, myId);
    renderDiscardPile(discardEl, topCard, state.activeColor, state.direction);

    displayedHand = renderHand(
      handEl,
      currentHand,
      {
        activeColor,
        discardTop: topCard,
        pendingDraw: state.pendingDrawCount,
        enabled: isMyTurn,
        autoSort: settings.autoSortHand,
        showKeyHints: settings.showKeyHints,
      },
      handlePlayCard
    );

    renderActionHints(
      hintsEl,
      {
        canDraw: isMyTurn,
        canCallUno:
          state.phase === 'playing' &&
          currentHand.length === 1 &&
          !myHasCalledUno,
        canChallenge:
          isMyTurn &&
          state.pendingDrawCount > 0 &&
          topCard?.kind === 'wild_draw4',
        pendingDraw: state.pendingDrawCount,
        showKeyHints: settings.showKeyHints,
      },
      {
        onDraw: triggerDraw,
        onCallUno: triggerCallUno,
        onChallengeWild4: triggerChallengeWild4,
      }
    );

    // Smart Focus Relocation: preserve card focus across hand re-renders
    if (hadHandFocus) {
      const nextButtons = Array.from(handEl.querySelectorAll<HTMLButtonElement>('.uno-card'));
      if (nextButtons.length > 0) {
        const byId = activeCardId
          ? nextButtons.find((btn) => btn.dataset['cardId'] === activeCardId)
          : undefined;
        const fallbackIdx = prevFocusIdx >= 0
          ? Math.min(prevFocusIdx, nextButtons.length - 1)
          : 0;
        (byId ?? nextButtons[fallbackIdx])?.focus();
      } else {
        hintsEl.querySelector<HTMLButtonElement>('[data-action="draw"]')?.focus();
      }
    }

    // Coordinated Turn-Start Feedback (earcon + atomic narration on transition)
    if (state.phase === 'playing' && isMyTurn && (!prevMyTurn || prevPhase !== 'playing')) {
      playEarcon('turn_start');
      const topLabel = topCard ? formatCardSpeechLabel(topCard) : 'nessuna';
      announce(
        `Tocca a te. Carta in cima: ${topLabel}. Colore attivo: ${formatColorLabel(state.activeColor)}. Hai ${displayedHand.length} carte.`,
        'polite'
      );
    }

    prevMyTurn = isMyTurn;
    prevPhase = state.phase;
  };

  const announceTableSummary = (): void => {
    const state = currentState;
    if (!state) return;
    const topCard = extractTopCard(state);
    const currentPlayerId = state.turnOrder[state.currentTurnIndex] ?? '';
    const turnName =
      currentPlayerId === myId
        ? 'il tuo turno'
        : (state.players.get(currentPlayerId)?.username ?? 'un avversario');
    const topLabel = topCard ? formatCardSpeechLabel(topCard) : 'nessuna';
    const pendingText =
      state.pendingDrawCount > 0 ? ` Penalità accumulata: +${state.pendingDrawCount}.` : '';
    announce(
      `Tavolo: è ${turnName}. Carta in cima: ${topLabel}. Colore attivo: ${formatColorLabel(state.activeColor)}.${pendingText} Hai ${displayedHand.length} carte in mano.`,
      'polite'
    );
  };

  const onTableKeyDown = (ev: KeyboardEvent): void => {
    if (hasBlockedModifier(ev)) return;
    if (document.querySelector('.ultra-modal-backdrop')) return;
    if (isEditableTarget(ev.target)) return;

    if (!wildOverlay.hidden) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        cancelWildSelection();
        return;
      }
      const colorIdx = ['1', '2', '3', '4'].indexOf(ev.key);
      const chosen = colorIdx >= 0 ? UNO_COLORS[colorIdx] : undefined;
      if (chosen) {
        ev.preventDefault();
        chooseWildColor(chosen);
      }
      return;
    }

    if (currentState?.phase !== 'playing') return;

    const cardButtons = Array.from(handEl.querySelectorAll<HTMLButtonElement>('.uno-card'));

    if (
      ev.key === 'ArrowRight' ||
      ev.key === 'ArrowLeft' ||
      ev.code === 'Numpad6' ||
      ev.code === 'Numpad4'
    ) {
      if (cardButtons.length === 0) return;
      ev.preventDefault();
      const delta = ev.key === 'ArrowRight' || ev.code === 'Numpad6' ? 1 : -1;
      const curIdx =
        document.activeElement instanceof HTMLButtonElement
          ? cardButtons.indexOf(document.activeElement)
          : -1;
      const { index, wrapped } = computeSafeLoopIndex(curIdx, delta, cardButtons.length);
      const target = cardButtons[index];
      if (target) {
        target.focus();
        playEarcon(wrapped ? 'boundary' : 'nav');
      }
      return;
    }

    if (ev.key === 'Home' || ev.key === 'End') {
      if (cardButtons.length === 0) return;
      ev.preventDefault();
      const target =
        ev.key === 'Home' ? cardButtons[0] : cardButtons[cardButtons.length - 1];
      target?.focus();
      playEarcon('nav');
      return;
    }

    const shortcutIdx = resolveCardShortcutIndex(ev.key);
    if (shortcutIdx >= 0) {
      ev.preventDefault();
      const btn = cardButtons[shortcutIdx];
      if (!btn) {
        playEarcon('boundary');
        announce(`Nessuna carta allo slot ${ev.key}`, 'polite');
        return;
      }
      btn.focus();
      btn.click();
      return;
    }

    const lower = ev.key.toLowerCase();
    if (lower === 'p') {
      ev.preventDefault();
      hintsEl.querySelector<HTMLButtonElement>('[data-action="draw"]')?.click();
    } else if (lower === 'u') {
      ev.preventDefault();
      hintsEl.querySelector<HTMLButtonElement>('[data-action="call-uno"]')?.click();
    } else if (lower === 'c') {
      const chBtn = hintsEl.querySelector<HTMLButtonElement>('[data-action="challenge-wild4"]');
      if (chBtn) {
        ev.preventDefault();
        chBtn.click();
      }
    } else if (lower === 's') {
      ev.preventDefault();
      announceTableSummary();
    }
  };

  window.addEventListener('keydown', onTableKeyDown);

  const unsubSettings = subscribeSettings((next) => {
    settings = next;
    render();
  });

  const stateListener = (state: UnoRoomState): void => {
    currentState = state;
    render();
  };
  room.onStateChange(stateListener);

  const offHand = colyseus.onHand((cards) => {
    currentHand = cards;
    render();
  });

  const offAction = colyseus.onActionResult((res) => {
    if (!res.ok && res.reason) {
      errorBanner = res.reason;
      playEarcon('error');
      announce(res.reason, 'assertive');
      render();
    }
  });

  const offUno = colyseus.onUnoCalled((msg) => {
    const callerName = currentState?.players.get(msg.playerId)?.username ?? msg.playerId;
    unoBanner = `${callerName} ha gridato UNO!`;
    playEarcon('uno');
    announce(unoBanner, 'assertive');
    render();
    window.setTimeout(() => {
      unoBanner = null;
      render();
    }, 2500);
  });

  const offEnded = colyseus.onMatchEnded((msg) => {
    endedMessage = msg;
    const myReceipt = msg.receipts?.[myId];
    if (myReceipt) {
      patchProfile({
        mmr: myReceipt.mmrAfter,
        rankTier: myReceipt.rankAfter as RankTier,
        vcard: myReceipt.vcardBalanceAfter,
        battleCardLevel: myReceipt.battleCardLevelAfter,
      });
    }
    rematchBtn.disabled = false;
    rematchStatusEl.textContent = '';
    const winnerName = currentState?.players.get(msg.winnerId)?.username ?? msg.winnerId;
    playEarcon(msg.winnerId === myId ? 'win' : 'confirm');
    announce(
      msg.winnerId === myId
        ? 'Hai vinto la partita!'
        : `Partita terminata. Vincitore: ${winnerName}`,
      'assertive'
    );
    render();
  });

  room.onMessage('rematch_status', (payload: { votes: number; required: number }) => {
    rematchStatusEl.textContent = `Voti rivincita: ${payload.votes}/${payload.required}`;
  });

  room.onMessage('chaos_flip', () => {
    unoBanner = 'CHAOS FLIP! Direzione invertita!';
    playEarcon('confirm');
    announce(unoBanner, 'assertive');
    render();
    window.setTimeout(() => {
      unoBanner = null;
      render();
    }, 2200);
  });

  render();

  return () => {
    window.removeEventListener('keydown', onTableKeyDown);
    unsubSettings();
    purgeOnClose();
    room.onStateChange.remove(stateListener);
    offHand();
    offAction();
    offUno();
    offEnded();
    root.remove();
  };
}
