// ============================================================
// UNO ULTRA Client — Bespoke SVG Artworks for Cosmetic Shop
// Every item has isolated <defs> IDs to prevent DOM gradient collisions.
// ============================================================

import type { CosmeticCategory } from '@uno/shared';

const ARTWORKS: Readonly<Record<string, string>> = {
  avatar_neon_fox: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_nfox_aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.34"/>
          <stop offset="55%" stop-color="#ff2d95" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="art_nfox_stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f6ff"/>
          <stop offset="52%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#ff2d95"/>
        </linearGradient>
      </defs>
      <circle cx="90" cy="76" r="62" fill="url(#art_nfox_aura)"/>
      <polygon points="44,24 70,54 50,74" fill="#0d1730" stroke="#00f6ff" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="136,24 110,54 130,74" fill="#170f2e" stroke="#ff2d95" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="50,36 64,54 52,65" fill="none" stroke="#ff2d95" stroke-width="1.5"/>
      <polygon points="130,36 116,54 128,65" fill="none" stroke="#00f6ff" stroke-width="1.5"/>
      <polygon points="50,74 70,54 110,54 130,74 118,104 90,126 62,104" fill="#091124" fill-opacity="0.92" stroke="url(#art_nfox_stroke)" stroke-width="2.6" stroke-linejoin="round"/>
      <polyline points="70,54 90,68 110,54" fill="none" stroke="#00f6ff" stroke-width="1.6" opacity="0.85"/>
      <polyline points="50,74 76,84 90,126 104,84 130,74" fill="none" stroke="#ff2d95" stroke-width="1.7" opacity="0.88"/>
      <polygon points="64,78 78,76 74,85" fill="#00f6ff"/>
      <polygon points="116,78 102,76 106,85" fill="#ff2d95"/>
      <polygon points="84,112 96,112 90,121" fill="#ffffff" stroke="#00f6ff" stroke-width="1.2"/>
      <line x1="36" y1="88" x2="54" y2="92" stroke="#00f6ff" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="144" y1="88" x2="126" y2="92" stroke="#ff2d95" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `,

  avatar_cyber_dragon: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_cdrag_glow" cx="50%" cy="52%" r="52%">
          <stop offset="0%" stop-color="#00f6ff" stop-opacity="0.35"/>
          <stop offset="65%" stop-color="#f59e0b" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="art_cdrag_body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="50%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#ff2d95"/>
        </linearGradient>
      </defs>
      <ellipse cx="90" cy="76" rx="64" ry="56" fill="url(#art_cdrag_glow)"/>
      <polygon points="46,122 134,122 142,134 38,134" fill="#11182d" stroke="#f5c842" stroke-width="2"/>
      <line x1="54" y1="128" x2="126" y2="128" stroke="#00f6ff" stroke-width="1.5" stroke-dasharray="6 4"/>
      <path d="M58,116 C40,94 48,66 74,64 C94,62 118,76 112,96 C106,112 78,108 82,90 C86,74 114,52 106,32 L124,22 L116,38 L132,36 L116,49 C126,70 124,104 94,118 Z" fill="#091326" stroke="url(#art_cdrag_body)" stroke-width="2.6" stroke-linejoin="round"/>
      <polyline points="62,56 50,42 66,46 60,30 78,42" fill="none" stroke="#ff2d95" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="104,34 114,30 112,39" fill="#f5c842"/>
      <path d="M52,82 L68,78 M49,94 L66,91 M102,72 L118,68" stroke="#00f6ff" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `,

  avatar_chrono_ace: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_chr_glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#c084fc" stop-opacity="0.34"/>
          <stop offset="60%" stop-color="#00f0ff" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="90" cy="76" r="62" fill="url(#art_chr_glow)"/>
      <polyline points="24,50 48,50 60,64" fill="none" stroke="#00f0ff" stroke-width="1.6"/>
      <polyline points="20,76 48,76" fill="none" stroke="#b84dff" stroke-width="1.6"/>
      <polyline points="28,104 48,104 60,90" fill="none" stroke="#00f0ff" stroke-width="1.6"/>
      <polyline points="156,50 132,50 120,64" fill="none" stroke="#00f0ff" stroke-width="1.6"/>
      <polyline points="160,76 132,76" fill="none" stroke="#b84dff" stroke-width="1.6"/>
      <polyline points="152,104 132,104 120,90" fill="none" stroke="#00f0ff" stroke-width="1.6"/>
      <circle cx="24" cy="50" r="2.5" fill="#00f0ff"/>
      <circle cx="156" cy="50" r="2.5" fill="#00f0ff"/>
      <circle cx="20" cy="76" r="2.5" fill="#b84dff"/>
      <circle cx="160" cy="76" r="2.5" fill="#b84dff"/>
      <rect x="82" y="20" width="16" height="10" rx="2" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.8"/>
      <circle cx="90" cy="17" r="5" fill="none" stroke="#e2e8f0" stroke-width="1.8"/>
      <circle cx="90" cy="76" r="42" fill="#0b1122" stroke="#e2e8f0" stroke-width="3"/>
      <circle cx="90" cy="76" r="35" fill="#f8fafc" fill-opacity="0.08" stroke="#b84dff" stroke-width="1.5"/>
      <line x1="90" y1="44" x2="90" y2="50" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="90" y1="102" x2="90" y2="108" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="58" y1="76" x2="64" y2="76" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="116" y1="76" x2="122" y2="76" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="90" y1="76" x2="90" y2="53" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="90" y1="76" x2="109" y2="85" stroke="#ffd500" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="90" cy="76" r="3.5" fill="#ffffff"/>
    </svg>
  `,

  frame_gold_pulse: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_fgold_glow" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stop-color="#b84dff" stop-opacity="0.34"/>
          <stop offset="65%" stop-color="#f5c842" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="art_fgold_bevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff0a6"/>
          <stop offset="45%" stop-color="#f5c842"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <rect x="26" y="14" width="128" height="122" rx="14" fill="url(#art_fgold_glow)"/>
      <rect x="46" y="22" width="88" height="106" rx="8" fill="#070b18" stroke="url(#art_fgold_bevel)" stroke-width="5"/>
      <rect x="54" y="30" width="72" height="90" rx="5" fill="none" stroke="#ffd86b" stroke-width="1.4" opacity="0.7"/>
      <polyline points="35,44 43,58 34,74 44,92 36,110" fill="none" stroke="#e879f9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="145,40 136,56 146,72 137,90 144,108" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="60,16 78,24 94,14 114,23" fill="none" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
      <polyline points="64,132 82,124 98,135 118,125" fill="none" stroke="#e879f9" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `,

  frame_ssl_prism: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_prism_aura" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
          <stop offset="50%" stop-color="#c4b5fd" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="art_prism_f1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="100%" stop-color="#a5f3fc"/>
        </linearGradient>
        <linearGradient id="art_prism_f2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5d0fe"/>
          <stop offset="100%" stop-color="#c4b5fd"/>
        </linearGradient>
        <linearGradient id="art_prism_f3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#fbcfe8"/>
        </linearGradient>
      </defs>
      <circle cx="90" cy="75" r="64" fill="url(#art_prism_aura)"/>
      <polygon points="90,14 134,58 90,74" fill="url(#art_prism_f1)" stroke="#ffffff" stroke-width="1.5"/>
      <polygon points="90,14 46,58 90,74" fill="#ffffff" fill-opacity="0.9" stroke="#ffffff" stroke-width="1.5"/>
      <polygon points="46,58 90,74 48,96" fill="url(#art_prism_f2)" stroke="#ffffff" stroke-width="1.4"/>
      <polygon points="134,58 90,74 132,96" fill="url(#art_prism_f3)" stroke="#ffffff" stroke-width="1.4"/>
      <polygon points="48,96 90,74 90,136" fill="#99f6e4" fill-opacity="0.88" stroke="#ffffff" stroke-width="1.5"/>
      <polygon points="132,96 90,74 90,136" fill="#ddd6fe" fill-opacity="0.92" stroke="#ffffff" stroke-width="1.5"/>
      <line x1="90" y1="14" x2="90" y2="136" stroke="#ffffff" stroke-width="1.8" opacity="0.9"/>
      <circle cx="62" cy="36" r="2.2" fill="#ffffff"/>
      <circle cx="126" cy="40" r="1.8" fill="#a5f3fc"/>
      <circle cx="118" cy="116" r="2" fill="#f5d0fe"/>
    </svg>
  `,

  back_arcade_grid: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="art_rgrid_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="55%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#090d1f"/>
        </linearGradient>
      </defs>
      <rect x="34" y="20" width="112" height="106" rx="10" fill="#131a32" stroke="#1ad1ff" stroke-width="2.5"/>
      <rect x="44" y="30" width="92" height="72" rx="6" fill="url(#art_rgrid_sky)" stroke="#c084fc" stroke-width="1.6"/>
      <polygon points="52,70 68,52 84,70 100,48 122,70" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
      <line x1="45" y1="70" x2="135" y2="70" stroke="#22d3ee" stroke-width="1.5"/>
      <line x1="45" y1="80" x2="135" y2="80" stroke="#e879f9" stroke-width="1.1"/>
      <line x1="45" y1="91" x2="135" y2="91" stroke="#e879f9" stroke-width="1.2"/>
      <line x1="90" y1="70" x2="90" y2="102" stroke="#22d3ee" stroke-width="1.1"/>
      <line x1="74" y1="70" x2="54" y2="102" stroke="#22d3ee" stroke-width="1.1"/>
      <line x1="106" y1="70" x2="126" y2="102" stroke="#22d3ee" stroke-width="1.1"/>
      <text x="90" y="47" text-anchor="middle" fill="#4ade80" font-size="11" font-family="monospace" font-weight="700">1984</text>
      <rect x="52" y="109" width="24" height="6" rx="2" fill="#22d3ee"/>
      <circle cx="122" cy="112" r="3" fill="#ff2d95"/>
      <circle cx="132" cy="112" r="3" fill="#22d3ee"/>
    </svg>
  `,

  back_obsidian_holo: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="art_obsi_face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="50%" stop-color="#060913"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="art_obsi_shard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f6ff" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
      <rect x="46" y="14" width="88" height="122" rx="12" fill="url(#art_obsi_face)" stroke="#ffc42e" stroke-width="2.4"/>
      <rect x="53" y="21" width="74" height="108" rx="8" fill="none" stroke="#00f6ff" stroke-width="1.3" opacity="0.75"/>
      <polygon points="55,112 125,38 125,58 55,126" fill="url(#art_obsi_shard)"/>
      <polygon points="90,42 114,75 90,108 66,75" fill="#071226" stroke="#00f6ff" stroke-width="2"/>
      <polygon points="90,54 104,75 90,96 76,75" fill="#00f6ff" fill-opacity="0.24" stroke="#ffc42e" stroke-width="1.4"/>
    </svg>
  `,

  title_combo_king: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_chip_glow" cx="50%" cy="68%" r="48%">
          <stop offset="0%" stop-color="#1ad1ff" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="90" cy="108" rx="64" ry="26" fill="url(#art_chip_glow)"/>
      <g>
        <ellipse cx="62" cy="112" rx="22" ry="8" fill="#16223c" stroke="#1ad1ff" stroke-width="1.8"/>
        <ellipse cx="62" cy="102" rx="22" ry="8" fill="#0d152a" stroke="#ff2d95" stroke-width="1.8"/>
        <ellipse cx="62" cy="92" rx="22" ry="8" fill="#16223c" stroke="#1ad1ff" stroke-width="1.8"/>
        <ellipse cx="62" cy="82" rx="22" ry="8" fill="#0f1d38" stroke="#1ad1ff" stroke-width="2"/>
      </g>
      <g>
        <ellipse cx="96" cy="116" rx="24" ry="9" fill="#1a1230" stroke="#ff2d95" stroke-width="1.8"/>
        <ellipse cx="96" cy="105" rx="24" ry="9" fill="#0f1c38" stroke="#1ad1ff" stroke-width="1.8"/>
        <ellipse cx="96" cy="94" rx="24" ry="9" fill="#1a1230" stroke="#ff2d95" stroke-width="1.8"/>
        <ellipse cx="96" cy="83" rx="24" ry="9" fill="#0f1c38" stroke="#1ad1ff" stroke-width="1.8"/>
        <ellipse cx="96" cy="72" rx="24" ry="9" fill="#1a1230" stroke="#ff2d95" stroke-width="1.8"/>
        <ellipse cx="96" cy="61" rx="24" ry="9" fill="#0f1c38" stroke="#1ad1ff" stroke-width="1.8"/>
        <ellipse cx="96" cy="50" rx="24" ry="9" fill="#111e3d" stroke="#22d3ee" stroke-width="2.2"/>
        <ellipse cx="96" cy="50" rx="12" ry="4.5" fill="none" stroke="#ff2d95" stroke-width="1.5"/>
      </g>
      <g>
        <ellipse cx="126" cy="108" rx="19" ry="7" fill="#1a1230" stroke="#ff2d95" stroke-width="1.6"/>
        <ellipse cx="126" cy="98" rx="19" ry="7" fill="#101f3d" stroke="#1ad1ff" stroke-width="1.6"/>
        <ellipse cx="126" cy="88" rx="19" ry="7" fill="#1a1230" stroke="#ff2d95" stroke-width="1.8"/>
      </g>
    </svg>
  `,

  title_grand_architect: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_arch_glow" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="90" cy="75" r="62" fill="url(#art_arch_glow)"/>
      <polygon points="36,36 102,22 146,112 76,128" fill="#091834" fill-opacity="0.45" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="5 3"/>
      <polygon points="56,42 110,32 130,104 74,114" fill="#0a2146" fill-opacity="0.55" stroke="#7dd3fc" stroke-width="2"/>
      <ellipse cx="93" cy="73" rx="18" ry="26" transform="rotate(-14 93 73)" fill="none" stroke="#c084fc" stroke-width="1.8"/>
      <rect x="44" y="88" width="42" height="28" rx="4" fill="#07132b" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1.5"/>
      <line x1="36" y1="24" x2="108" y2="12" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
      <line x1="126" y1="40" x2="150" y2="40" stroke="#c084fc" stroke-width="1.3"/>
      <line x1="128" y1="48" x2="146" y2="48" stroke="#38bdf8" stroke-width="1.3"/>
    </svg>
  `,

  theme_tokyo_rain: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="art_tok_floor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#091529"/>
        </linearGradient>
      </defs>
      <polygon points="90,82 148,108 90,136 32,108" fill="url(#art_tok_floor)" stroke="#00f6ff" stroke-width="2"/>
      <polygon points="36,34 84,18 84,86 36,104" fill="#131934" stroke="#6366f1" stroke-width="1.6"/>
      <polygon points="84,18 136,38 136,104 84,86" fill="#0e142b" stroke="#ff2d95" stroke-width="1.6"/>
      <rect x="45" y="42" width="12" height="22" rx="2" fill="#ff2d95" fill-opacity="0.82"/>
      <rect x="63" y="34" width="12" height="18" rx="2" fill="#00f6ff" fill-opacity="0.82"/>
      <rect x="94" y="34" width="26" height="14" rx="2" fill="#f5c842" fill-opacity="0.85"/>
      <rect x="98" y="56" width="18" height="24" rx="2" fill="#38bdf8" fill-opacity="0.45" stroke="#00f6ff" stroke-width="1"/>
      <line x1="56" y1="112" x2="86" y2="126" stroke="#ff2d95" stroke-width="1.8" opacity="0.75"/>
      <line x1="98" y1="126" x2="128" y2="112" stroke="#00f6ff" stroke-width="1.8" opacity="0.75"/>
      <line x1="50" y1="16" x2="46" y2="30" stroke="#7dd3fc" stroke-width="1.1" opacity="0.65"/>
      <line x1="128" y1="14" x2="124" y2="28" stroke="#7dd3fc" stroke-width="1.1" opacity="0.65"/>
    </svg>
  `,

  crate_bronze_100: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="art_cbr_top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f3b27a"/>
          <stop offset="100%" stop-color="#9a5628"/>
        </linearGradient>
        <linearGradient id="art_cbr_side" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#c2743b"/>
          <stop offset="100%" stop-color="#5c2f13"/>
        </linearGradient>
      </defs>
      <polygon points="90,26 142,50 90,74 38,50" fill="url(#art_cbr_top)" stroke="#f7c89c" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="38,50 90,74 90,126 38,102" fill="url(#art_cbr_side)" stroke="#e0945a" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="142,50 90,74 90,126 142,102" fill="#703816" stroke="#e0945a" stroke-width="2" stroke-linejoin="round"/>
      <line x1="38" y1="68" x2="90" y2="92" stroke="#ffb36b" stroke-width="2.2"/>
      <line x1="142" y1="68" x2="90" y2="92" stroke="#ffb36b" stroke-width="2.2"/>
      <polygon points="82,70 98,70 98,94 82,94" fill="#f59e0b" stroke="#fff3d1" stroke-width="1.6"/>
      <rect x="52" y="72" width="22" height="22" rx="3" fill="none" stroke="#f3b27a" stroke-width="1.6"/>
      <rect x="106" y="72" width="22" height="22" rx="3" fill="none" stroke="#f3b27a" stroke-width="1.6"/>
    </svg>
  `,

  crate_silver_500: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="art_csil_top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
        <linearGradient id="art_csil_glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d946ef"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <polygon points="90,26 142,50 90,74 38,50" fill="url(#art_csil_top)" stroke="#f8fafc" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="38,50 90,74 90,126 38,102" fill="#334155" stroke="#cbd5e1" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="142,50 90,74 90,126 142,102" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="48,66 80,81 80,108 48,93" fill="url(#art_csil_glow)" stroke="#f0abfc" stroke-width="1.4"/>
      <polygon points="132,66 100,81 100,108 132,93" fill="url(#art_csil_glow)" stroke="#f0abfc" stroke-width="1.4"/>
      <polygon points="83,68 97,68 97,94 83,94" fill="#f0abfc" stroke="#ffffff" stroke-width="1.5"/>
    </svg>
  `,

  crate_ssl_1000: `
    <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art_cssl_holo" cx="50%" cy="32%" r="48%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
          <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="art_cssl_arm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="50%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
      </defs>
      <circle cx="90" cy="54" r="56" fill="url(#art_cssl_holo)"/>
      <polygon points="62,56 90,14 118,56" fill="#38bdf8" fill-opacity="0.22"/>
      <polygon points="90,18 106,36 90,54 74,36" fill="#e0f2fe" stroke="#ffffff" stroke-width="1.6"/>
      <polygon points="90,46 144,68 90,90 36,68" fill="url(#art_cssl_arm)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="36,68 90,90 90,136 36,114" fill="#1e294b" stroke="#7dd3fc" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="144,68 90,90 90,136 144,114" fill="#2b1e54" stroke="#f0abfc" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="48,82 78,95 78,120 48,107" fill="#00f6ff" fill-opacity="0.38" stroke="#a5f3fc" stroke-width="1.4"/>
      <polygon points="132,82 102,95 102,120 132,107" fill="#d946ef" fill-opacity="0.38" stroke="#f5d0fe" stroke-width="1.4"/>
      <polygon points="82,84 98,84 98,108 82,108" fill="#ffffff" stroke="#38bdf8" stroke-width="1.6"/>
    </svg>
  `,
};

const CATEGORY_FALLBACKS: Readonly<Record<CosmeticCategory, string>> = {
  avatar: ARTWORKS['avatar_neon_fox']!,
  frame: ARTWORKS['frame_gold_pulse']!,
  card_back: ARTWORKS['back_arcade_grid']!,
  title: ARTWORKS['title_combo_king']!,
  theme: ARTWORKS['theme_tokyo_rain']!,
  crate: ARTWORKS['crate_bronze_100']!,
};

export const SHOP_ARTWORK_IDS: readonly string[] = Object.keys(ARTWORKS);

/** Returns a safe, unique-gradient inline SVG illustration for a shop item. */
export function getShopItemArtworkSvg(
  itemId: string,
  category: CosmeticCategory
): string {
  return ARTWORKS[itemId] ?? CATEGORY_FALLBACKS[category];
}
