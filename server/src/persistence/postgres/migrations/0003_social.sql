-- ============================================================
-- UNO ULTRA — Migration 0003: Social graph, blocks & notifications
-- ============================================================
-- Strategia Anti-Race per richieste incrociate (A->B e B->A):
--   Ibrido (a) + Auto-Accept:
--   1. Manteniamo requester_id e addressee_id per preservare la semantica
--      di chi ha avviato la richiesta.
--   2. Applichiamo l'indice univoco funzionale su coppia ordinata
--      idx_friendships_unique_pair(LEAST(requester,addressee), GREATEST(...))
--      che impedisce fisicamente due righe pendenti incrociate nel DB.
--   3. Lato applicativo (friends.ts), createFriendRequest blocca la coppia
--      con FOR UPDATE: se esiste una richiesta inversa 'pending' (B->A),
--      la promuove automaticamente a 'accepted' (auto-accept).
-- ============================================================

CREATE TABLE IF NOT EXISTS friendships (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    addressee_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (requester_id <> addressee_id),
    UNIQUE (requester_id, addressee_id)
);

-- Previene richieste incrociate simultanee A->B e B->A a livello DB
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_unique_pair
    ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE INDEX IF NOT EXISTS idx_friendships_addressee_status
    ON friendships (addressee_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_requester_status
    ON friendships (requester_id, status);

-- Relazione di blocco unidirezionale (blocker -> blocked)
CREATE TABLE IF NOT EXISTS blocks (
    blocker_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked
    ON blocks (blocked_id);

-- Notifiche persistenti (anche per destinatari offline; TTL inviti = 24h)
CREATE TABLE IF NOT EXISTS notifications (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    type          TEXT NOT NULL
                  CHECK (type IN ('friend_request', 'friend_accepted', 'party_invite', 'system')),
    payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at       TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications (recipient_id, read_at)
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_expires
    ON notifications (expires_at)
    WHERE expires_at IS NOT NULL;
