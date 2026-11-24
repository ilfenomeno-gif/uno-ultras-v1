// ============================================================
// UNO ULTRA Client — 7 Mini-Games Full-Screen Cyber-Arcade Views
// ============================================================

import { MINI_GAME_ENGINES, type AnyMiniGameMode } from '@uno/shared';
import { announce, purgeOnClose } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { hasBlockedModifier } from '../../core/keyboard-nav.js';
import {
  computeBlackjackTotal,
  findCardActions,
  formatMilleCardMeta,
  formatMilleHazardLabel,
  formatMiniGameActionLabel,
  formatScoreSummary,
  formatStandardCardLabel,
  type MiniGameActionLike,
} from './minigame-helpers.js';

interface RenderBoardContext {
  readonly mode: AnyMiniGameMode;
  readonly view: Record<string, unknown>;
  readonly legal: readonly MiniGameActionLike[];
  readonly selectedCardId: string | null;
  readonly raiseAmount: number;
  readonly onSelectCard: (cardId: string) => void;
  readonly onChangeRaise: (amount: number) => void;
  readonly onRunAction: (action: MiniGameActionLike) => void;
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createStandardCardEl(
  raw: Record<string, unknown>,
  options: {
    large?: boolean;
    selected?: boolean;
    playable?: boolean;
    ariaLabel?: string;
    onClick?: (() => void) | undefined;
  } = {},
): HTMLElement {
  const meta = formatStandardCardLabel(raw);
  const tag = options.onClick ? 'button' : 'div';
  const card = document.createElement(tag);
  if (card instanceof HTMLButtonElement) {
    card.type = 'button';
  }
  const classes = ['mg-card-el'];
  if (meta.isRed) classes.push('is-red');
  if (meta.isItalian) classes.push('is-italian');
  if (options.large) classes.push('mg-card-el--lg');
  if (options.playable) classes.push('is-playable');
  if (options.selected) classes.push('is-selected');
  card.className = classes.join(' ');
  if (options.ariaLabel) card.setAttribute('aria-label', options.ariaLabel);

  const topCorner = el('span', 'mg-card-corner', `${meta.rank} ${meta.suitGlyph}`);
  const center = el('span', 'mg-card-center', meta.suitGlyph);
  const botCorner = el('span', 'mg-card-corner mg-card-corner--bot', `${meta.rank} ${meta.suitGlyph}`);
  card.append(topCorner, center, botCorner);

  if (options.onClick) {
    card.addEventListener('click', options.onClick);
  }
  return card;
}

function createCardBackEl(label: string, onClick?: () => void): HTMLElement {
  const tag = onClick ? 'button' : 'div';
  const back = document.createElement(tag);
  if (back instanceof HTMLButtonElement) back.type = 'button';
  back.className = onClick ? 'mg-card-back mg-card-back--clickable' : 'mg-card-back';
  back.textContent = label;
  if (onClick) {
    back.setAttribute('aria-label', label);
    back.addEventListener('click', onClick);
  }
  return back;
}

function createActionButton(
  mode: AnyMiniGameMode,
  action: MiniGameActionLike | null,
  fallbackText: string,
  variant: 'cyan' | 'gold' | 'magenta' | 'violet',
  onRunAction: (action: MiniGameActionLike) => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  const variantClass =
    variant === 'cyan' ? '' : ` mg-neon-btn--${variant}`;
  btn.className = `mg-neon-btn${variantClass}`;
  btn.textContent = action ? formatMiniGameActionLabel(mode, action) : fallbackText;
  if (!action) {
    btn.setAttribute('aria-disabled', 'true');
  } else {
    btn.addEventListener('click', () => onRunAction(action));
  }
  return btn;
}

function renderBlackjackBoard(ctx: RenderBoardContext): HTMLElement {
  const board = el('div', 'mg-board mg-board--blackjack');
  const dealerCards = (ctx.view['dealerCards'] ?? []) as Record<string, unknown>[];
  const hiddenCount = Number(ctx.view['dealerHiddenCount'] ?? 0);
  const myHand = (ctx.view['myHand'] ?? []) as Record<string, unknown>[];

  const arc = el('section', 'mg-bj-arc');
  const dealerTotal = computeBlackjackTotal(dealerCards);
  arc.appendChild(
    el(
      'div',
      'mg-zone-label',
      hiddenCount > 0
        ? `BANCO (${dealerTotal}+ · NASCOSTE: ${hiddenCount})`
        : `BANCO (${dealerTotal})`,
    ),
  );
  const dealerRow = el('div', 'mg-card-strip');
  for (const card of dealerCards) {
    dealerRow.appendChild(createStandardCardEl(card, { large: true }));
  }
  for (let i = 0; i < hiddenCount; i++) {
    dealerRow.appendChild(createCardBackEl('CARTA COPERTA'));
  }
  arc.appendChild(dealerRow);

  const playerSection = el('section', 'mg-pile-slot');
  const playerTotal = computeBlackjackTotal(myHand);
  playerSection.appendChild(el('div', 'mg-zone-label', `LA TUA MANO (${playerTotal})`));
  const handRow = el('div', 'mg-card-strip');
  for (const card of myHand) {
    handRow.appendChild(createStandardCardEl(card, { large: true }));
  }
  playerSection.appendChild(handRow);

  const consoleBar = el('div', 'mg-bj-console');
  const hitAct = ctx.legal.find((a) => a.type === 'hit') ?? null;
  const standAct = ctx.legal.find((a) => a.type === 'stand') ?? null;
  const doubleAct = ctx.legal.find((a) => a.type === 'double') ?? null;

  const makeOrb = (
    act: MiniGameActionLike | null,
    label: string,
    cls: string,
  ): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mg-bj-orb-btn ${cls}`;
    btn.textContent = label;
    if (!act) {
      btn.setAttribute('aria-disabled', 'true');
      btn.style.opacity = '0.38';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.setAttribute('aria-label', formatMiniGameActionLabel('blackjack', act));
      btn.addEventListener('click', () => ctx.onRunAction(act));
    }
    return btn;
  };

  consoleBar.append(
    makeOrb(hitAct, 'HIT', 'mg-bj-orb-btn--hit'),
    makeOrb(standAct, 'STAND', 'mg-bj-orb-btn--stand'),
    makeOrb(doubleAct, 'DOUBLE', 'mg-bj-orb-btn--double'),
  );

  board.append(arc, playerSection, consoleBar);
  return board;
}

function renderScalaOrBurracoBoard(ctx: RenderBoardContext): HTMLElement {
  const isBurraco = ctx.mode === 'burraco';
  const board = el('div', `mg-board ${isBurraco ? 'mg-board--burraco' : 'mg-board--scala40'}`);
  const surface = el('section', 'mg-felt-surface');

  const drawStock = ctx.legal.find((a) => a.type === 'draw_stock') ?? null;
  const drawDiscard =
    ctx.legal.find((a) => a.type === 'draw_discard' || a.type === 'draw_discard_pile') ?? null;

  const pilesRow = el('div', 'mg-piles-row');
  const stockSlot = el('div', 'mg-pile-slot');
  const stockCount = Number(ctx.view['stockCount'] ?? 0);
  stockSlot.appendChild(el('div', 'mg-zone-label', `MAZZO (${stockCount})`));
  stockSlot.appendChild(
    createCardBackEl(
      'MAZZO',
      drawStock ? () => ctx.onRunAction(drawStock) : undefined,
    ),
  );
  pilesRow.appendChild(stockSlot);

  if (isBurraco) {
    const tookPozzetto = (ctx.view['tookPozzetto'] ?? {}) as Record<string, boolean>;
    const pozzSlot = el('div', 'mg-pile-slot');
    pozzSlot.appendChild(el('div', 'mg-zone-label', 'POZZETTI'));
    const pozzRow = el('div', 'mg-card-strip');
    const remainingPozzetti = Object.values(tookPozzetto).filter((v) => !v).length;
    if (remainingPozzetti > 0) {
      for (let i = 0; i < Math.min(2, remainingPozzetti); i++) {
        pozzRow.appendChild(createCardBackEl('POZZETTO'));
      }
    } else {
      pozzRow.appendChild(el('div', 'mg-empty-slot', 'PRESI'));
    }
    pozzSlot.appendChild(pozzRow);
    pilesRow.appendChild(pozzSlot);
  }

  const discardSlot = el('div', 'mg-pile-slot');
  const discardLabel = isBurraco
    ? `SCARTI (${String(ctx.view['discardCount'] ?? 1)})`
    : 'SCARTI';
  discardSlot.appendChild(el('div', 'mg-zone-label', discardLabel));
  const topDiscard = ctx.view['topDiscard'] as Record<string, unknown> | null | undefined;
  if (topDiscard) {
    discardSlot.appendChild(
      createStandardCardEl(topDiscard, {
        playable: Boolean(drawDiscard),
        ariaLabel: drawDiscard ? formatMiniGameActionLabel(ctx.mode, drawDiscard) : 'Scarti',
        onClick: drawDiscard ? () => ctx.onRunAction(drawDiscard) : undefined,
      }),
    );
  } else {
    discardSlot.appendChild(el('div', 'mg-empty-slot', 'VUOTO'));
  }
  pilesRow.appendChild(discardSlot);
  surface.appendChild(pilesRow);

  const rawMelds = isBurraco
    ? Object.values((ctx.view['melds'] ?? {}) as Record<string, readonly Record<string, unknown>[][]>).flat()
    : ((ctx.view['tableMelds'] ?? []) as readonly Record<string, unknown>[][]);

  surface.appendChild(el('div', 'mg-zone-label', isBurraco ? 'CALATE / BURRACO' : 'CALATE SUL TAVOLO'));
  const meldsBox = el('div', 'mg-melds-strip');
  if (rawMelds.length === 0) {
    meldsBox.appendChild(el('span', 'mg-hint-banner', 'Nessuna combinazione ancora calata sul tavolo'));
  } else {
    for (const grp of rawMelds) {
      const grpEl = el('div', 'mg-meld-group');
      for (const c of grp) {
        grpEl.appendChild(createStandardCardEl(c));
      }
      meldsBox.appendChild(grpEl);
    }
  }
  surface.appendChild(meldsBox);

  const actionsBar = el('div', 'mg-action-console');
  if (drawStock || drawDiscard) {
    actionsBar.append(
      createActionButton(ctx.mode, drawStock, 'Pesca dal mazzo', 'cyan', ctx.onRunAction),
      createActionButton(
        ctx.mode,
        drawDiscard,
        isBurraco ? 'Raccogli scarti' : 'Pesca dagli scarti',
        'gold',
        ctx.onRunAction,
      ),
    );
  } else {
    actionsBar.appendChild(
      el('div', 'mg-hint-banner', 'Hai pescato: clicca direttamente una carta nella tua mano per scartarla'),
    );
  }

  const myHand = (ctx.view['myHand'] ?? []) as Record<string, unknown>[];
  const handWrap = el('section', 'mg-pile-slot');
  handWrap.appendChild(el('div', 'mg-zone-label', `LA TUA MANO (${myHand.length})`));
  const handFan = el('div', myHand.length > 9 ? 'mg-hand-fan is-wide' : 'mg-hand-fan');
  for (const c of myHand) {
    const cid = String(c['id'] ?? '');
    const { discardAction } = findCardActions(ctx.legal, cid);
    const cardLabel = formatStandardCardLabel(c);
    handFan.appendChild(
      createStandardCardEl(c, {
        playable: Boolean(discardAction),
        ariaLabel: discardAction ? `Scarta ${cardLabel.rank} ${cardLabel.suit}` : `${cardLabel.rank} ${cardLabel.suit}`,
        onClick: discardAction ? () => ctx.onRunAction(discardAction) : undefined,
      }),
    );
  }
  handWrap.appendChild(handFan);

  board.append(surface, actionsBar, handWrap);
  return board;
}

function renderItalianTableBoard(ctx: RenderBoardContext): HTMLElement {
  const board = el('div', 'mg-board mg-board--italian');
  const rim = el('section', 'mg-italian-rim');

  const statsRow = el('div', 'mg-italian-stats');
  const stockCount = Number(ctx.view['stockCount'] ?? 0);
  statsRow.appendChild(el('span', 'mg-stat-chip', `Mazzo rimanente: ${stockCount}`));

  if (ctx.mode === 'scopa') {
    const captured = (ctx.view['capturedCounts'] ?? {}) as Record<string, number>;
    const scopaCounts = (ctx.view['scopaCounts'] ?? {}) as Record<string, number>;
    for (const [pid, cnt] of Object.entries(captured)) {
      const scope = scopaCounts[pid] ?? 0;
      statsRow.appendChild(el('span', 'mg-stat-chip', `${pid}: ${cnt} prese (${scope} scope)`));
    }
  } else {
    const stackTops = (ctx.view['stackTops'] ?? {}) as Record<
      string,
      { count?: number; top?: Record<string, unknown> | null }
    >;
    for (const [pid, info] of Object.entries(stackTops)) {
      const topLabel = info.top
        ? `Cima: ${formatStandardCardLabel(info.top).rank} ${formatStandardCardLabel(info.top).suitGlyph}`
        : 'Mazzetto vuoto';
      statsRow.appendChild(
        el('span', 'mg-stat-chip', `${pid}: ${info.count ?? 0} carte (${topLabel})`),
      );
    }
  }
  rim.appendChild(statsRow);

  const tableCards = (ctx.view['tableCards'] ?? []) as Record<string, unknown>[];
  rim.appendChild(el('div', 'mg-zone-label', 'CARTE SUL TAVOLO'));
  const tableRow = el('div', 'mg-card-strip');
  if (tableCards.length === 0) {
    tableRow.appendChild(el('div', 'mg-empty-slot', 'TAVOLO VUOTO'));
  } else {
    for (const c of tableCards) {
      tableRow.appendChild(createStandardCardEl(c, { large: true }));
    }
  }
  rim.appendChild(tableRow);

  const myHand = (ctx.view['myHand'] ?? []) as Record<string, unknown>[];
  const handWrap = el('section', 'mg-pile-slot');
  handWrap.appendChild(el('div', 'mg-zone-label', 'LA TUA MANO — CLICCA UNA CARTA PER GIOCARE'));
  const handFan = el('div', 'mg-hand-fan');
  for (const c of myHand) {
    const cid = String(c['id'] ?? '');
    const { playAction } = findCardActions(ctx.legal, cid);
    const lbl = formatStandardCardLabel(c);
    handFan.appendChild(
      createStandardCardEl(c, {
        large: true,
        playable: Boolean(playAction),
        ariaLabel: playAction ? `Gioca ${lbl.rank} di ${lbl.suit}` : `${lbl.rank} di ${lbl.suit}`,
        onClick: playAction ? () => ctx.onRunAction(playAction) : undefined,
      }),
    );
  }
  handWrap.appendChild(handFan);

  const hint = el(
    'div',
    'mg-hint-banner',
    ctx.mode === 'ruba-mazzetto'
      ? 'Clicca direttamente una carta dalla mano per prendere dal tavolo o rubare il mazzetto avversario.'
      : 'Clicca direttamente una carta dalla mano per giocare sul tavolo.',
  );

  board.append(rim, hint, handWrap);
  return board;
}

function renderPokerBoard(ctx: RenderBoardContext): HTMLElement {
  const board = el('div', 'mg-board mg-board--poker');
  const oval = el('section', 'mg-poker-oval');

  const street = String(ctx.view['street'] ?? 'preflop').toUpperCase();
  oval.appendChild(el('div', 'mg-zone-label', `COMMUNITY · FASE ${street}`));

  const community = (ctx.view['communityCards'] ?? []) as Record<string, unknown>[];
  const commRow = el('div', 'mg-poker-community');
  for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
    const card = community[slotIdx];
    if (card) {
      commRow.appendChild(createStandardCardEl(card));
    } else {
      commRow.appendChild(el('div', 'mg-empty-slot', `SLOT ${slotIdx + 1}`));
    }
  }
  oval.appendChild(commRow);
  oval.appendChild(el('div', 'mg-poker-pot', `PIATTO: ${String(ctx.view['pot'] ?? 0)} FICHE`));

  const chips = (ctx.view['chips'] ?? {}) as Record<string, number>;
  const bets = (ctx.view['bets'] ?? {}) as Record<string, number>;
  const stats = el('div', 'mg-italian-stats');
  for (const [pid, stack] of Object.entries(chips)) {
    const bet = bets[pid] ?? 0;
    stats.appendChild(el('span', 'mg-stat-chip', `${pid}: ${stack} fiche (puntata ${bet})`));
  }
  oval.appendChild(stats);

  const hole = (ctx.view['myHoleCards'] ?? []) as Record<string, unknown>[];
  const handWrap = el('section', 'mg-pile-slot');
  handWrap.appendChild(el('div', 'mg-zone-label', 'LA TUA MANO'));
  const holeRow = el('div', 'mg-card-strip');
  for (const card of hole) {
    holeRow.appendChild(createStandardCardEl(card, { large: true }));
  }
  handWrap.appendChild(holeRow);

  const consoleBox = el('div', 'mg-action-console');
  const foldAct = ctx.legal.find((a) => a.type === 'fold') ?? null;
  const checkCallAct = ctx.legal.find((a) => a.type === 'check_call') ?? null;
  const raiseBase = ctx.legal.find((a) => a.type === 'raise') ?? null;

  const sliderRow = el('div', 'mg-poker-slider-row');
  const maxChips = Math.max(40, chips['Tu'] ?? 200);
  const clampedRaise = Math.min(maxChips, Math.max(20, ctx.raiseAmount));
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '20';
  slider.max = String(maxChips);
  slider.step = '10';
  slider.value = String(clampedRaise);
  slider.setAttribute('aria-label', 'Importo rilancio');

  const sliderVal = el('span', undefined, `${clampedRaise} fiche`);
  const customRaise: MiniGameActionLike | null = raiseBase
    ? { type: 'raise', amount: clampedRaise }
    : null;

  const raiseBtn = createActionButton(
    'poker-texas',
    customRaise,
    'Rilancia (Raise)',
    'gold',
    ctx.onRunAction,
  );
  slider.addEventListener('input', () => {
    const nextVal = Number(slider.value);
    ctx.onChangeRaise(nextVal);
    sliderVal.textContent = `${nextVal} fiche`;
    if (raiseBase) {
      raiseBtn.textContent = `Rilancia +${nextVal}`;
    }
  });
  sliderRow.append(el('span', undefined, 'Rilancio:'), slider, sliderVal);

  const btnRow = el('div', 'mg-card-strip');
  btnRow.append(
    createActionButton('poker-texas', foldAct, 'Lascia (Fold)', 'magenta', ctx.onRunAction),
    createActionButton('poker-texas', checkCallAct, 'Vedi / Chiama', 'cyan', ctx.onRunAction),
    raiseBtn,
  );

  consoleBox.append(sliderRow, btnRow);
  board.append(oval, handWrap, consoleBox);
  return board;
}

function renderMilleBoard(ctx: RenderBoardContext): HTMLElement {
  const board = el('div', 'mg-board mg-board--mille');
  const distances = (ctx.view['distances'] ?? {}) as Record<string, number>;
  const hazards = (ctx.view['activeHazard'] ?? {}) as Record<string, string | null>;
  const safeties = (ctx.view['safeties'] ?? {}) as Record<string, readonly string[]>;

  const tracksGrid = el('section', 'mg-mille-tracks');
  for (const [pid, km] of Object.entries(distances)) {
    const lane = el('div', pid === 'Tu' ? 'mg-mille-lane' : 'mg-mille-lane is-bot');
    const head = el('div', 'mg-mille-lane-head');
    head.append(el('span', undefined, pid.toUpperCase()), el('span', 'mg-mille-km', `${km} / 1000 km`));

    const bar = el('div', 'mg-mille-track-bar');
    const fill = el('div', 'mg-mille-track-fill');
    fill.style.width = `${Math.min(100, Math.round((km / 1000) * 100))}%`;
    bar.appendChild(fill);

    const activeHaz = hazards[pid] ?? null;
    const mySafeties = safeties[pid] ?? [];
    const meta = el('div', 'mg-mille-meta');
    meta.append(
      el(
        'span',
        activeHaz ? 'mg-mille-pill is-hazard' : 'mg-mille-pill',
        `Stato: ${formatMilleHazardLabel(activeHaz)}`,
      ),
      el(
        'span',
        'mg-mille-pill',
        mySafeties.length > 0
          ? `Sicurezze: ${mySafeties.map((s) => formatMilleCardMeta({ category: 'safety', safety: s }).title).join(', ')}`
          : 'Sicurezze: Nessuna',
      ),
    );

    lane.append(head, bar, meta);
    tracksGrid.appendChild(lane);
  }

  const myHand = (ctx.view['myHand'] ?? []) as Record<string, unknown>[];
  const fallbackId = myHand[0] ? String(myHand[0]['id'] ?? '') : null;
  const activeId =
    ctx.selectedCardId && myHand.some((c) => String(c['id'] ?? '') === ctx.selectedCardId)
      ? ctx.selectedCardId
      : fallbackId;

  const handWrap = el('section', 'mg-pile-slot');
  handWrap.appendChild(
    el(
      'div',
      'mg-zone-label',
      `LA TUA MANO (${String(ctx.view['deckCount'] ?? 0)} CARTE NEL MAZZO)`,
    ),
  );
  const cardsRow = el('div', 'mg-card-strip');
  for (const raw of myHand) {
    const cid = String(raw['id'] ?? '');
    const spec = (raw['spec'] ?? {}) as Record<string, unknown>;
    const meta = formatMilleCardMeta(spec);
    const { playAction } = findCardActions(ctx.legal, cid);
    const isSel = cid === activeId;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mg-mille-card mg-mille-card--${meta.category}${isSel ? ' is-selected' : ''}`;
    btn.setAttribute('aria-label', `${meta.title} (${meta.badge})`);
    btn.append(
      el('span', 'mg-mille-card-title', meta.title),
      el('span', 'mg-mille-card-icon', meta.icon),
      el('span', 'mg-mille-card-badge', meta.badge),
    );
    btn.addEventListener('click', () => ctx.onSelectCard(cid));
    if (playAction) {
      btn.addEventListener('dblclick', () => ctx.onRunAction(playAction));
    }
    cardsRow.appendChild(btn);
  }
  handWrap.appendChild(cardsRow);

  const selectedActions = activeId
    ? findCardActions(ctx.legal, activeId)
    : { playAction: null, discardAction: null };

  const consoleBox = el('div', 'mg-action-console');
  const playBtn = createActionButton(
    'mille-miglia',
    selectedActions.playAction,
    'Gioca',
    'cyan',
    ctx.onRunAction,
  );
  if (selectedActions.playAction) playBtn.textContent = 'Gioca';
  const discardBtn = createActionButton(
    'mille-miglia',
    selectedActions.discardAction,
    'Scarta',
    'gold',
    ctx.onRunAction,
  );
  if (selectedActions.discardAction) discardBtn.textContent = 'Scarta';
  consoleBox.append(playBtn, discardBtn);

  board.append(tracksGrid, handWrap, consoleBox);
  return board;
}

function renderModeBoard(ctx: RenderBoardContext): HTMLElement {
  switch (ctx.mode) {
    case 'blackjack':
      return renderBlackjackBoard(ctx);
    case 'scala40':
    case 'burraco':
      return renderScalaOrBurracoBoard(ctx);
    case 'scopa':
    case 'ruba-mazzetto':
      return renderItalianTableBoard(ctx);
    case 'poker-texas':
      return renderPokerBoard(ctx);
    case 'mille-miglia':
      return renderMilleBoard(ctx);
  }
}

export function openMiniGameSandboxModal(mode: AnyMiniGameMode): void {
  const previousStage = document.querySelector('.mg-fs-stage');
  previousStage?.remove();

  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const engine = MINI_GAME_ENGINES[mode];
  const players = Array.from({ length: Math.max(2, engine.minPlayers) }, (_, idx) =>
    idx === 0 ? 'Tu' : `Bot_${idx}`,
  );
  let state = engine.createInitialState(`local_${mode}`, players, Date.now());
  let selectedCardId: string | null = null;
  let raiseAmount = 40;

  const stage = document.createElement('div');
  stage.className = 'mg-fs-stage';
  stage.setAttribute('role', 'dialog');
  stage.setAttribute('aria-modal', 'true');
  stage.setAttribute('aria-label', `${engine.label} — Tavolo a schermo intero`);

  const hud = el('header', 'mg-fs-hud');
  const hudLeft = el('div', 'mg-fs-hud-left');
  hudLeft.append(el('span', 'mg-fs-brand', 'UNO ULTRA'), el('h1', 'mg-fs-title', engine.label));

  const turnPill = el('div', 'mg-fs-turn-pill', 'Turno: Tu');
  const hudRight = el('div', 'mg-fs-hud-right');
  const scoreBadge = el('span', 'mg-fs-score', 'Tu: 0 · Bot_1: 0');

  const fsBtn = document.createElement('button');
  fsBtn.type = 'button';
  fsBtn.className = 'mg-fs-hud-btn';
  fsBtn.textContent = 'Schermo Intero';

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'mg-fs-hud-btn mg-fs-hud-btn--exit';
  exitBtn.textContent = 'Esci';

  hudRight.append(scoreBadge, fsBtn, exitBtn);
  hud.append(hudLeft, turnPill, hudRight);

  const viewport = el('main', 'mg-fs-viewport');
  stage.append(hud, viewport);

  const syncFullscreenLabel = (): void => {
    fsBtn.textContent =
      document.fullscreenElement === stage ? 'Riduci Schermo' : 'Schermo Intero';
  };

  const closeStage = (): void => {
    window.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('fullscreenchange', syncFullscreenLabel);
    if (document.fullscreenElement === stage && typeof document.exitFullscreen === 'function') {
      void document.exitFullscreen().catch(() => undefined);
    }
    purgeOnClose();
    playEarcon('modal_close');
    stage.remove();
    previousFocus?.focus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !hasBlockedModifier(event)) {
      event.preventDefault();
      closeStage();
    }
  };

  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement === stage) {
      if (typeof document.exitFullscreen === 'function') {
        void document.exitFullscreen().catch(() => undefined);
      }
      return;
    }
    if (typeof stage.requestFullscreen === 'function') {
      void stage.requestFullscreen().catch(() => undefined);
    }
  });
  exitBtn.addEventListener('click', closeStage);
  document.addEventListener('fullscreenchange', syncFullscreenLabel);
  window.addEventListener('keydown', onKeyDown);

  const runAction = (action: MiniGameActionLike): void => {
    try {
      state = engine.applyAction(state, 'Tu', action);
      if (action.type.startsWith('draw')) {
        playEarcon('draw');
      } else {
        playEarcon('play_card');
      }
      selectedCardId = null;

      let safetyGuard = 0;
      while (
        state.phase === 'playing' &&
        state.playerOrder[state.currentTurnIndex] !== 'Tu' &&
        safetyGuard < 40
      ) {
        safetyGuard += 1;
        const cur = state.playerOrder[state.currentTurnIndex];
        if (!cur) break;
        const botActs = engine.getLegalActions(state, cur);
        if (botActs.length === 0) break;
        state = engine.applyAction(state, cur, botActs[0]);
      }

      if (state.phase === 'finished') {
        playEarcon(state.winnerId === 'Tu' ? 'win' : 'error');
        announce(`Partita terminata. Vincitore: ${state.winnerId ?? 'Nessuno'}.`, 'assertive');
      }
    } catch (err) {
      playEarcon('error');
      const msg = err instanceof Error ? err.message : 'Azione non valida';
      announce(msg, 'assertive');
    }
    paint();
  };

  const paint = (): void => {
    const view = engine.getPublicView(state, 'Tu');
    const legal = engine.getLegalActions(state, 'Tu') as MiniGameActionLike[];

    turnPill.textContent =
      state.phase === 'finished'
        ? `Terminata · Vincitore: ${state.winnerId ?? 'Nessuno'}`
        : `Turno: ${String(view['currentPlayerId'] ?? 'Tu')}`;
    turnPill.className =
      state.phase === 'finished' ? 'mg-fs-turn-pill is-finished' : 'mg-fs-turn-pill';
    scoreBadge.textContent = formatScoreSummary(view);

    viewport.replaceChildren();
    const board = renderModeBoard({
      mode,
      view,
      legal,
      selectedCardId,
      raiseAmount,
      onSelectCard: (cid) => {
        selectedCardId = cid;
        playEarcon('confirm');
        paint();
      },
      onChangeRaise: (amt) => {
        raiseAmount = amt;
      },
      onRunAction: runAction,
    });
    viewport.appendChild(board);

    if (state.phase === 'finished') {
      const finishBar = el('div', 'mg-finish-banner');
      finishBar.appendChild(
        el('span', 'mg-finish-title', `Vincitore: ${state.winnerId ?? 'Pareggio'}`),
      );
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'mg-neon-btn mg-neon-btn--gold';
      resetBtn.textContent = 'Nuova Mano';
      resetBtn.addEventListener('click', () => {
        state = engine.createInitialState(`local_${mode}`, players, Date.now());
        selectedCardId = null;
        playEarcon('confirm');
        paint();
      });

      const lobbyBtn = document.createElement('button');
      lobbyBtn.type = 'button';
      lobbyBtn.className = 'mg-neon-btn';
      lobbyBtn.textContent = 'Torna alla Lobby';
      lobbyBtn.addEventListener('click', closeStage);

      finishBar.append(resetBtn, lobbyBtn);
      viewport.appendChild(finishBar);
    } else if (legal.length === 0) {
      const botBar = el('div', 'mg-action-console');
      const botBtn = document.createElement('button');
      botBtn.type = 'button';
      botBtn.className = 'mg-neon-btn';
      botBtn.textContent = 'Avanza Turno Bot';
      botBtn.addEventListener('click', () => {
        const cur = state.playerOrder[state.currentTurnIndex];
        if (cur) {
          const botActs = engine.getLegalActions(state, cur);
          if (botActs.length > 0) state = engine.applyAction(state, cur, botActs[0]);
        }
        paint();
      });
      botBar.appendChild(botBtn);
      viewport.appendChild(botBar);
    }
  };

  paint();
  document.body.appendChild(stage);
  playEarcon('modal_open');
  announce(`${engine.label} avviato a schermo intero.`);
  exitBtn.focus();
}
