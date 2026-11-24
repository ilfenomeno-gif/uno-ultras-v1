// ============================================================
// UNO ULTRA Client — Tournament Challengers & Top 100 Leaderboard List
// ============================================================

export interface ChallengerEntry {
  rank: number;
  username: string;
  mmr: number;
  rankTier: string;
}

export function renderChallengerList(entries: readonly ChallengerEntry[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'challenger-list glass-panel';

  if (entries.length === 0) {
    wrap.innerHTML = '<p class="empty-note">Nessun contendente registrato al momento.</p>';
    return wrap;
  }

  const table = document.createElement('table');
  table.className = 'ultra-table';
  table.innerHTML = `
    <thead>
      <tr><th>#</th><th>Giocatore</th><th>Tier</th><th>MMR</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody')!;
  for (const e of entries) {
    const tr = document.createElement('tr');
    const tdRank = document.createElement('td');
    tdRank.textContent = `#${e.rank}`;
    const tdUser = document.createElement('td');
    tdUser.textContent = e.username;
    const tdTier = document.createElement('td');
    tdTier.textContent = e.rankTier;
    const tdMmr = document.createElement('td');
    tdMmr.textContent = String(e.mmr);
    tr.append(tdRank, tdUser, tdTier, tdMmr);
    tbody.appendChild(tr);
  }
  wrap.appendChild(table);
  return wrap;
}
