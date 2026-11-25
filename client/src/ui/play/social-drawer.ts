// ============================================================
// UNO ULTRA Client — Social Drawer (Amici / Notifiche / Bloccati)
// ============================================================

import {
  blockPlayer,
  fetchFriends,
  fetchNotifications,
  markNotificationRead,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
  sendPartyInvite,
  unblockPlayer,
  type FriendItem,
  type FriendsListResponse,
  type NotificationItem,
} from '../../net/tcp/rest-client.js';
import { getRoom } from '../../net/tcp/colyseus-client.js';
import { getProfile } from '../../state/profile-store.js';
import { openProfileModal } from './profile-view.js';

type SocialTab = 'amici' | 'notifiche' | 'bloccati';

export interface SocialDrawerOptions {
  onJoinInvite?: (roomId: string) => Promise<void>;
}

export class SocialDrawer {
  readonly backdrop: HTMLElement;
  readonly drawer: HTMLElement;
  private readonly body: HTMLElement;
  private readonly userBanner: HTMLElement;
  private readonly feedbackEl: HTMLElement;
  private readonly onJoinInvite: ((roomId: string) => Promise<void>) | undefined;
  private activeTab: SocialTab = 'amici';
  private openState = false;
  private friendsData: FriendsListResponse | null = null;
  private notifications: NotificationItem[] = [];

  constructor(options?: SocialDrawerOptions) {
    this.onJoinInvite = options?.onJoinInvite;
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'social-drawer-backdrop';
    this.backdrop.addEventListener('click', () => this.close());

    this.drawer = document.createElement('aside');
    this.drawer.className = 'social-drawer glass-panel';
    this.drawer.setAttribute('aria-label', 'Pannello Social');

    const header = document.createElement('div');
    header.className = 'social-drawer-header';
    const title = document.createElement('h2');
    title.textContent = 'Social';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'news-ticker-close';
    closeBtn.textContent = 'ESC ✕';
    closeBtn.addEventListener('click', () => this.close());
    header.append(title, closeBtn);

    this.userBanner = document.createElement('div');
    this.userBanner.className = 'social-user-banner';

    const tabsRow = document.createElement('div');
    tabsRow.className = 'social-drawer-tabs';
    const tabs: Array<{ id: SocialTab; label: string }> = [
      { id: 'amici', label: 'Amici' },
      { id: 'notifiche', label: 'Notifiche' },
      { id: 'bloccati', label: 'Bloccati' },
    ];
    const tabBtns: HTMLButtonElement[] = [];

    for (const t of tabs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `social-drawer-tab${t.id === this.activeTab ? ' active' : ''}`;
      btn.textContent = t.label;
      btn.addEventListener('click', () => {
        this.activeTab = t.id;
        for (const b of tabBtns) b.classList.remove('active');
        btn.classList.add('active');
        this.renderBody();
      });
      tabBtns.push(btn);
      tabsRow.appendChild(btn);
    }

    this.feedbackEl = document.createElement('div');
    this.feedbackEl.className = 'social-feedback';

    this.body = document.createElement('div');
    this.body.className = 'social-drawer-body';

    this.drawer.append(header, this.userBanner, tabsRow, this.feedbackEl, this.body);
    this.syncUserBanner();
    this.renderBody();
  }

  isOpen(): boolean {
    return this.openState;
  }

  open(): void {
    this.openState = true;
    this.backdrop.classList.add('open');
    this.drawer.classList.add('open');
    this.syncUserBanner();
    void this.refresh();
  }

  close(): void {
    this.openState = false;
    this.backdrop.classList.remove('open');
    this.drawer.classList.remove('open');
  }

  toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  private syncUserBanner(): void {
    const profile = getProfile();
    this.userBanner.innerHTML = profile
      ? `<span>Profilo: <strong>${profile.username}</strong></span><span>${profile.rankTier}</span>`
      : '<span>Ospite non autenticato</span>';
  }

  private setFeedback(msg: string, isError = false): void {
    this.feedbackEl.textContent = msg;
    this.feedbackEl.classList.toggle('is-error', isError);
  }

  async refresh(): Promise<void> {
    if (!getProfile()) {
      this.friendsData = null;
      this.notifications = [];
      this.renderBody();
      return;
    }

    try {
      const [friends, notifs] = await Promise.all([
        fetchFriends(),
        fetchNotifications(),
      ]);
      this.friendsData = friends;
      this.notifications = notifs.items;
      this.renderBody();
    } catch (err) {
      this.setFeedback(
        err instanceof Error ? err.message : 'Errore caricamento dati social',
        true
      );
    }
  }

  private renderFriendRow(friend: FriendItem): HTMLElement {
    const row = document.createElement('div');
    row.className = 'social-row';

    const info = document.createElement('div');
    info.className = 'social-row-info';

    const dot = document.createElement('span');
    dot.className = `presence-dot ${friend.presenceStatus}`;

    const nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.className = 'social-name-btn';
    nameBtn.textContent = friend.username;
    nameBtn.title = 'Visualizza Profilo';
    nameBtn.addEventListener('click', () => openProfileModal(friend.username));

    info.append(dot, nameBtn);

    const actions = document.createElement('div');
    actions.className = 'social-row-actions';

    const inviteBtn = document.createElement('button');
    inviteBtn.type = 'button';
    inviteBtn.className = 'social-mini-btn social-mini-btn--gold';
    inviteBtn.textContent = '+';
    inviteBtn.title = `Invita ${friend.username}`;
    inviteBtn.addEventListener('click', async () => {
      try {
        const roomId = getRoom()?.roomId ?? 'lobby';
        const res = await sendPartyInvite({
          targetPlayerId: friend.playerId,
          roomId,
          mode: 'uno',
        });
        this.setFeedback(
          res.deliveredOnline
            ? `Invito inviato a ${friend.username} (online)`
            : `Invito salvato per ${friend.username} (offline)`
        );
      } catch (err) {
        this.setFeedback(
          err instanceof Error ? err.message : 'Invito fallito',
          true
        );
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'social-mini-btn social-mini-btn--danger';
    removeBtn.textContent = '✕';
    removeBtn.title = `Rimuovi ${friend.username}`;
    removeBtn.addEventListener('click', async () => {
      await removeFriend(friend.playerId);
      await this.refresh();
    });

    const blockBtn = document.createElement('button');
    blockBtn.type = 'button';
    blockBtn.className = 'social-mini-btn social-mini-btn--danger';
    blockBtn.textContent = 'Blocca';
    blockBtn.addEventListener('click', async () => {
      await blockPlayer(friend.playerId);
      await this.refresh();
    });

    actions.append(inviteBtn, removeBtn, blockBtn);
    row.append(info, actions);
    return row;
  }

  private renderBody(): void {
    this.body.innerHTML = '';

    if (this.activeTab === 'amici') {
      const online = this.friendsData?.online ?? [];
      const offline = this.friendsData?.offline ?? [];

      const onlineTitle = document.createElement('div');
      onlineTitle.className = 'social-section-title';
      onlineTitle.textContent = `Amici Online (${online.length})`;
      this.body.appendChild(onlineTitle);

      if (online.length === 0) {
        const p = document.createElement('p');
        p.className = 'social-empty';
        p.textContent = 'Nessun amico online.';
        this.body.appendChild(p);
      } else {
        for (const f of online) this.body.appendChild(this.renderFriendRow(f));
      }

      const offlineTitle = document.createElement('div');
      offlineTitle.className = 'social-section-title';
      offlineTitle.textContent = `Amici Offline (${offline.length})`;
      this.body.appendChild(offlineTitle);

      if (offline.length === 0) {
        const p = document.createElement('p');
        p.className = 'social-empty';
        p.textContent = 'Nessun amico offline.';
        this.body.appendChild(p);
      } else {
        for (const f of offline) this.body.appendChild(this.renderFriendRow(f));
      }

      // Aggiungi amico per username univoco
      const form = document.createElement('form');
      form.className = 'social-add-form';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'social-add-input';
      input.placeholder = 'Nome utente amico…';
      input.minLength = 3;
      input.maxLength = 20;
      input.required = true;
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'social-add-submit';
      submit.textContent = 'AGGIUNGI';

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const target = input.value.trim();
        if (target.length < 3 || target.length > 20) {
          this.setFeedback('Inserisci un nome utente valido (3-20 caratteri).', true);
          return;
        }
        submit.disabled = true;
        this.setFeedback(`Invio richiesta a ${target}…`);
        try {
          const res = await sendFriendRequest(target);
          this.setFeedback(
            res.status === 'accepted'
              ? `Tu e ${target} siete ora amici!`
              : `Richiesta inviata a ${target}`
          );
          input.value = '';
          const [friends, notifs] = await Promise.all([
            fetchFriends(),
            fetchNotifications(),
          ]);
          this.friendsData = friends;
          this.notifications = notifs.items;
          this.renderBody();
        } catch (err) {
          this.setFeedback(
            err instanceof Error ? err.message : 'Richiesta fallita',
            true
          );
        } finally {
          submit.disabled = false;
        }
      });

      form.append(input, submit);
      this.body.appendChild(form);
      return;
    }

    if (this.activeTab === 'notifiche') {
      const pending = this.friendsData?.pendingIncoming ?? [];
      if (pending.length > 0) {
        const reqTitle = document.createElement('div');
        reqTitle.className = 'social-section-title';
        reqTitle.textContent = `Richieste Amicizia (${pending.length})`;
        this.body.appendChild(reqTitle);

        for (const req of pending) {
          const row = document.createElement('div');
          row.className = 'social-row';
          row.innerHTML = `
            <div class="social-row-info">
              <span><strong>${req.username}</strong> <span class="social-meta">${req.rankTier}</span></span>
            </div>
          `;
          const actions = document.createElement('div');
          actions.className = 'social-row-actions';
          const accept = document.createElement('button');
          accept.type = 'button';
          accept.className = 'social-mini-btn social-mini-btn--gold';
          accept.textContent = 'Accetta';
          accept.addEventListener('click', async () => {
            await respondFriendRequest(req.requestId, 'accept');
            await this.refresh();
          });
          const reject = document.createElement('button');
          reject.type = 'button';
          reject.className = 'social-mini-btn social-mini-btn--danger';
          reject.textContent = 'Rifiuta';
          reject.addEventListener('click', async () => {
            await respondFriendRequest(req.requestId, 'reject');
            await this.refresh();
          });
          actions.append(accept, reject);
          row.appendChild(actions);
          this.body.appendChild(row);
        }
      }

      const notifTitle = document.createElement('div');
      notifTitle.className = 'social-section-title';
      notifTitle.textContent = `Notifiche (${this.notifications.length})`;
      this.body.appendChild(notifTitle);

      if (this.notifications.length === 0 && pending.length === 0) {
        this.body.innerHTML +=
          '<p class="social-empty">Nessuna nuova notifica di invito o torneo.</p>';
        return;
      }

      for (const n of this.notifications) {
        const row = document.createElement('div');
        row.className = 'social-row';
        const from =
          typeof n.payload['fromUsername'] === 'string'
            ? n.payload['fromUsername']
            : 'Sistema';
        const label =
          n.type === 'party_invite'
            ? `Invito partita da ${from}`
            : n.type === 'friend_request'
              ? `Richiesta amicizia da ${from}`
              : n.type === 'friend_accepted'
                ? `${from} ha accettato l'amicizia`
                : 'Avviso di sistema';

        const info = document.createElement('div');
        info.className = 'social-row-info';
        info.textContent = label;

        const actions = document.createElement('div');
        actions.className = 'social-row-actions';

        const inviteRoomId =
          n.type === 'party_invite' && typeof n.payload['roomId'] === 'string'
            ? n.payload['roomId']
            : null;
        if (inviteRoomId && inviteRoomId !== 'lobby' && this.onJoinInvite) {
          const joinBtn = document.createElement('button');
          joinBtn.type = 'button';
          joinBtn.className = 'social-mini-btn social-mini-btn--gold';
          joinBtn.textContent = 'Unisciti';
          joinBtn.addEventListener('click', async () => {
            joinBtn.disabled = true;
            try {
              await markNotificationRead(n.id);
              await this.onJoinInvite?.(inviteRoomId);
            } catch (err) {
              this.setFeedback(
                err instanceof Error ? err.message : 'Ingresso nella stanza fallito',
                true
              );
            } finally {
              joinBtn.disabled = false;
            }
          });
          actions.appendChild(joinBtn);
        }

        const markBtn = document.createElement('button');
        markBtn.type = 'button';
        markBtn.className = 'social-mini-btn';
        markBtn.textContent = 'Letta';
        markBtn.addEventListener('click', async () => {
          await markNotificationRead(n.id);
          await this.refresh();
        });
        actions.appendChild(markBtn);

        row.append(info, actions);
        this.body.appendChild(row);
      }
      return;
    }

    // Tab Bloccati
    const blocked = this.friendsData?.blocked ?? [];
    if (blocked.length === 0) {
      this.body.innerHTML = '<p class="social-empty">Nessun giocatore bloccato.</p>';
      return;
    }
    for (const b of blocked) {
      const row = document.createElement('div');
      row.className = 'social-row';
      const info = document.createElement('div');
      info.className = 'social-row-info';
      info.textContent = b.username;

      const unblockBtn = document.createElement('button');
      unblockBtn.type = 'button';
      unblockBtn.className = 'social-mini-btn';
      unblockBtn.textContent = 'Sblocca';
      unblockBtn.addEventListener('click', async () => {
        await unblockPlayer(b.playerId);
        await this.refresh();
      });
      row.append(info, unblockBtn);
      this.body.appendChild(row);
    }
  }
}
