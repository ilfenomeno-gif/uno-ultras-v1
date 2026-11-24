// ============================================================
// UNO ULTRA Client — Escalating SVG Artworks for V-Card Currency Packs
// ============================================================

const VCARD_PACK_ARTWORKS: Readonly<Record<string, string>> = {
  vcard_500: `
    <svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="vcard500_aura" cx="50%" cy="52%" r="50%">
          <stop offset="0%" stop-color="#1ad1ff" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="vcard500_coin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7ee8ff"/>
          <stop offset="50%" stop-color="#f5c842"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="80" r="64" fill="url(#vcard500_aura)"/>
      <circle cx="118" cy="88" r="36" fill="#091529" stroke="#1ad1ff" stroke-width="2.5"/>
      <circle cx="118" cy="88" r="27" fill="none" stroke="#7ee8ff" stroke-width="1.3" stroke-dasharray="5 3"/>
      <circle cx="84" cy="74" r="40" fill="#0d1b36" stroke="url(#vcard500_coin)" stroke-width="3.2"/>
      <circle cx="84" cy="74" r="31" fill="none" stroke="#1ad1ff" stroke-width="1.5"/>
      <polygon points="71,58 84,92 97,58 90,58 84,76 78,58" fill="#ffe066" stroke="#ffffff" stroke-width="1"/>
      <circle cx="144" cy="44" r="2.4" fill="#7ee8ff"/>
      <circle cx="52" cy="118" r="2" fill="#ffe066"/>
    </svg>
  `,

  vcard_1100: `
    <svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="vcard1100_aura" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stop-color="#b84dff" stop-opacity="0.38"/>
          <stop offset="65%" stop-color="#f5c842" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="vcard1100_card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e879f9"/>
          <stop offset="50%" stop-color="#9333ea"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="80" r="66" fill="url(#vcard1100_aura)"/>
      <rect x="48" y="34" width="66" height="96" rx="10" transform="rotate(-14 81 82)" fill="#131432" stroke="#c084fc" stroke-width="2"/>
      <rect x="86" y="34" width="66" height="96" rx="10" transform="rotate(14 119 82)" fill="#1b1236" stroke="#ffe066" stroke-width="2"/>
      <rect x="66" y="26" width="68" height="102" rx="11" fill="url(#vcard1100_card)" stroke="#f5d0fe" stroke-width="2.6"/>
      <polygon points="84,56 100,98 116,56 108,56 100,79 92,56" fill="#ffe066" stroke="#ffffff" stroke-width="1.2"/>
      <polygon points="40,56 46,48 50,58" fill="#e879f9"/>
      <polygon points="154,50 160,42 164,52" fill="#ffe066"/>
    </svg>
  `,

  vcard_3200: `
    <svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="vcard3200_aura" cx="50%" cy="54%" r="54%">
          <stop offset="0%" stop-color="#ffc42e" stop-opacity="0.42"/>
          <stop offset="70%" stop-color="#f97316" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="vcard3200_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="48%" stop-color="#f5c842"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="82" r="68" fill="url(#vcard3200_aura)"/>
      <polygon points="40,94 100,72 160,94 100,118" fill="url(#vcard3200_gold)" stroke="#fef9c3" stroke-width="2"/>
      <polygon points="40,94 100,118 100,136 40,112" fill="#b45309" stroke="#fde047" stroke-width="1.8"/>
      <polygon points="160,94 100,118 100,136 160,112" fill="#78350f" stroke="#fde047" stroke-width="1.8"/>
      <polygon points="54,70 100,52 146,70 100,88" fill="url(#vcard3200_gold)" stroke="#ffffff" stroke-width="2"/>
      <polygon points="54,70 100,88 100,104 54,86" fill="#d97706" stroke="#fef08a" stroke-width="1.6"/>
      <polygon points="146,70 100,88 100,104 146,86" fill="#92400e" stroke="#fef08a" stroke-width="1.6"/>
      <polygon points="82,24 100,58 118,24 110,24 100,43 90,24" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.4"/>
      <line x1="100" y1="12" x2="100" y2="20" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
      <line x1="56" y1="26" x2="66" y2="34" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
      <line x1="144" y1="26" x2="134" y2="34" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  vcard_8000: `
    <svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="vcard8000_holo" cx="50%" cy="34%" r="52%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58"/>
          <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.34"/>
          <stop offset="75%" stop-color="#e879f9" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="vcard8000_lid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="50%" stop-color="#c4b5fd"/>
          <stop offset="100%" stop-color="#fbcfe8"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="60" r="64" fill="url(#vcard8000_holo)"/>
      <polygon points="56,74 100,12 144,74" fill="#a5f3fc" fill-opacity="0.2"/>
      <polygon points="100,16 120,40 100,62 80,40" fill="#ffffff" fill-opacity="0.92" stroke="#7dd3fc" stroke-width="1.8"/>
      <polygon points="89,30 100,52 111,30 106,30 100,42 94,30" fill="#0ea5e9"/>
      <polygon points="44,68 100,48 156,68 100,88" fill="url(#vcard8000_lid)" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
      <polygon points="44,68 100,88 100,138 44,116" fill="#1e294b" stroke="#7dd3fc" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="156,68 100,88 100,138 156,116" fill="#2d1e57" stroke="#f5d0fe" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="56,84 88,97 88,122 56,109" fill="#00f6ff" fill-opacity="0.4" stroke="#a5f3fc" stroke-width="1.4"/>
      <polygon points="144,84 112,97 112,122 144,109" fill="#e879f9" fill-opacity="0.4" stroke="#fae8ff" stroke-width="1.4"/>
      <polygon points="90,82 110,82 110,112 90,112" fill="#ffe066" stroke="#ffffff" stroke-width="1.8"/>
    </svg>
  `,
};

export const VCARD_ARTWORK_IDS: readonly string[] = Object.keys(VCARD_PACK_ARTWORKS);

export function getVCardPackArtworkSvg(packId: string): string {
  return VCARD_PACK_ARTWORKS[packId] ?? VCARD_PACK_ARTWORKS['vcard_500']!;
}

export interface VCardPackActionState {
  readonly label: string;
  readonly actionable: boolean;
}

export function getVCardPackActionState(
  devGrantsEnabled: boolean,
  priceDisplay: string
): VCardPackActionState {
  if (!devGrantsEnabled) {
    return {
      label: 'Pagamenti non ancora attivi',
      actionable: false,
    };
  }
  return {
    label: `Accredita Test · ${priceDisplay}`,
    actionable: true,
  };
}
