// ============================================================
// UNO ULTRA Client — Playable UNO Table View
// ============================================================

import type { Room } from 'colyseus.js';
import {
  UNO_COLORS,
  type MatchEndedMessage,
  type UnoCard,
  type UnoCardKind,
  type UnoColor,
  type UnoNumericValue,
  type UnoRoomState,
} from '@uno/shared';
import { colyseus } from '../net/connection-manager.js';
import { getProfile } from '../state/profile-store.js';
import { formatColorLabel } from './card-format.js';
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

export function mountGameView(container: HTMLElement, opts: GameViewOptions): () => void {
  const { room } = opts;
  const myId = getProfile()?.id ?? room.sessionId;

  const root = document.createElement('section');
  root.className = 'game-view';
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
    <div class="game-view__hand" data-role="hand"></div>

    <div class="game-overlay" data-role="lobby-overlay" hidden>
      <div class="game-modal glass-panel">
        <h2>Sala d'Attesa UNO</h2>
        <p data-role="lobby-count">Giocatori connessi: 1</p>
        <button type="button" class="launcher-play-btn" data-action="start-bots" hidden>
          AVVIA CON BOT
        </button>
      </div>
    </div>

    <div class="game-overlay" data-role="wild-overlay" hidden>
      <div class="game-modal glass-panel">
        <h2>Scegli il Colore</h2>
        <div class="wild-color-grid" data-role="wild-grid"></div>
        <button type="button" class="hint-btn" data-action="cancel-wild">ANNULLA</button>
      </div>
    </div>

    <div class="game-overlay" data-role="ended-overlay" hidden>
      <div class="game-modal glass-panel">
        <h2 data-role="ended-title">Partita Terminata</h2>
        <p data-role="ended-winner"></p>
        <div class="scores-list" data-role="scores-list"></div>
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
  const endedWinnerEl = root.querySelector<HTMLElement>('[data-role="ended-winner"]')!;
  const scoresListEl = root.querySelector<HTMLElement>('[data-role="scores-list"]')!;
  const rematchStatusEl = root.querySelector<HTMLElement>('[data-role="rematch-status"]')!;
  const rematchBtn = root.querySelector<HTMLButtonElement>('[data-action="rematch"]')!;
  const backLobbyBtn = root.querySelector<HTMLButtonElement>('[data-action="back-lobby"]')!;
  const exitBtn = root.querySelector<HTMLButtonElement>('.game-view__exit')!;

  roomIdEl.textContent = `Room ${room.roomId}`;

  let currentHand: UnoCard[] = [];
  let currentState: UnoRoomState | null = room.state ?? null;
  let errorBanner: string | null = null;
  let unoBanner: string | null = null;
  let pendingWildCard: UnoCard | null = null;
  let endedMessage: MatchEndedMessage | null = null;

  for (const color of UNO_COLORS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wild-color-btn';
    btn.dataset['color'] = color;
    btn.textContent = formatColorLabel(color);
    btn.addEventListener('click', () => {
      if (!pendingWildCard) return;
      const cardId = pendingWildCard.id;
      pendingWildCard = null;
      wildOverlay.hidden = true;
      colyseus.sendAction({
        type: 'play_card',
        cardId,
        chosenColor: color,
      });
    });
    wildGrid.appendChild(btn);
  }

  cancelWildBtn.addEventListener('click', () => {
    pendingWildCard = null;
    wildOverlay.hidden = true;
  });

  startBotsBtn.addEventListener('click', () => {
    startBotsBtn.disabled = true;
    colyseus.startMatch();
  });

  const handleExit = async (): Promise<void> => {
    exitBtn.disabled = true;
    backLobbyBtn.disabled = true;
    await colyseus.leaveRoom();
    await opts.onExit();
  };

  exitBtn.addEventListener('click', () => void handleExit());
  backLobbyBtn.addEventListener('click', () => void handleExit());
  rematchBtn.addEventListener('click', () => {
    rematchBtn.disabled = true;
    room.send('rematch_vote');
  });

  const handlePlayCard = (card: UnoCard): void => {
    errorBanner = null;
    if (card.color === 'wild') {
      pendingWildCard = card;
      wildOverlay.hidden = false;
      return;
    }
    colyseus.sendAction({
      type: 'play_card',
      cardId: card.id,
    });
  };

  const render = (): void => {
    const state = currentState;
    if (!state) return;

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
      endedWinnerEl.textContent =
        winnerId === myId
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

    renderHand(
      handEl,
      currentHand,
      {
        activeColor,
        discardTop: topCard,
        pendingDraw: state.pendingDrawCount,
        enabled: isMyTurn,
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
      },
      {
        onDraw: () => {
          errorBanner = null;
          colyseus.sendAction({ type: 'draw_card' });
        },
        onCallUno: () => {
          errorBanner = null;
          colyseus.callUno();
        },
        onChallengeWild4: () => {
          errorBanner = null;
          colyseus.challengeWild4();
        },
      }
    );
  };

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
      render();
    }
  });

  const offUno = colyseus.onUnoCalled((msg) => {
    const callerName = currentState?.players.get(msg.playerId)?.username ?? msg.playerId;
    unoBanner = `${callerName} ha gridato UNO!`;
    render();
    window.setTimeout(() => {
      unoBanner = null;
      render();
    }, 2500);
  });

  const offEnded = colyseus.onMatchEnded((msg) => {
    endedMessage = msg;
    rematchBtn.disabled = false;
    rematchStatusEl.textContent = '';
    render();
  });

  room.onMessage('rematch_status', (payload: { votes: number; required: number }) => {
    rematchStatusEl.textContent = `Voti rivincita: ${payload.votes}/${payload.required}`;
  });

  room.onMessage('chaos_flip', () => {
    unoBanner = 'CHAOS FLIP! Direzione invertita!';
    render();
    window.setTimeout(() => {
      unoBanner = null;
      render();
    }, 2200);
  });

  render();

  return () => {
    room.onStateChange.remove(stateListener);
    offHand();
    offAction();
    offUno();
    offEnded();
    root.remove();
  };
}
