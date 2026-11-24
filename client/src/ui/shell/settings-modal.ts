// ============================================================
// UNO ULTRA Client — 5-Tab Settings Modal (Honest GUI + ASTRALIS v3)
// ============================================================

import { announce } from '../../core/aria-live.js';
import { playEarcon, syncAudioSettings } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';
import { createToggle } from '../components/toggle.js';
import { openModal } from '../components/modal.js';

export interface ClientSettings {
  audioVolume: number;
  sfxEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  autoSortHand: boolean;
  colorblindLabels: boolean;
  showKeyHints: boolean;
}

const SETTINGS_KEY = 'uno.settings';

const DEFAULT_SETTINGS: ClientSettings = {
  audioVolume: 75,
  sfxEnabled: true,
  reducedMotion: false,
  highContrast: false,
  autoSortHand: true,
  colorblindLabels: false,
  showKeyHints: true,
};

type SettingsListener = (settings: ClientSettings) => void;
const listeners = new Set<SettingsListener>();

function normalizeSettings(partial?: Partial<ClientSettings>): ClientSettings {
  const merged = partial ? { ...DEFAULT_SETTINGS, ...partial } : { ...DEFAULT_SETTINGS };
  const rawVol = merged.audioVolume;
  const audioVolume = Number.isFinite(rawVol)
    ? Math.min(100, Math.max(0, Math.round(rawVol)))
    : DEFAULT_SETTINGS.audioVolume;
  return { ...merged, audioVolume };
}

export function loadSettings(): ClientSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? normalizeSettings(JSON.parse(raw) as Partial<ClientSettings>)
      : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function subscribeSettings(listener: SettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function saveSettings(settings: ClientSettings): void {
  const normalized = normalizeSettings(settings);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  } catch {
    // non-fatal
  }
  applySettingsToDocument(normalized);
  for (const listener of listeners) {
    listener(normalized);
  }
}

export function applySettingsToDocument(settings = loadSettings()): void {
  syncAudioSettings(settings.audioVolume, settings.sfxEnabled);
  if (typeof document === 'undefined' || !document.body) return;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  document.body.classList.toggle('high-contrast', settings.highContrast);
  document.body.classList.toggle('colorblind-labels', settings.colorblindLabels);
  document.body.classList.toggle('hide-key-hints', !settings.showKeyHints);
}

type SettingsTab = 'audio' | 'video' | 'gameplay' | 'controlli' | 'accessibilita';

const TAB_LABELS: ReadonlyArray<{ id: SettingsTab; label: string }> = [
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'controlli', label: 'Controlli' },
  { id: 'accessibilita', label: 'Accessibilità' },
];

export function openSettingsModal(): void {
  let activeTab: SettingsTab = 'audio';
  const current = loadSettings();

  const root = document.createElement('div');
  root.className = 'settings-modal-root';

  const tabBar = document.createElement('div');
  tabBar.className = 'settings-tab-bar';
  tabBar.setAttribute('role', 'tablist');
  tabBar.setAttribute('aria-label', 'Categorie impostazioni');

  const content = document.createElement('div');
  content.className = 'settings-tab-content';
  content.setAttribute('role', 'tabpanel');

  const selectTab = (tabId: SettingsTab, focusActive = false): void => {
    activeTab = tabId;
    renderPanel(focusActive);
    const label = TAB_LABELS.find((t) => t.id === tabId)?.label ?? tabId;
    playEarcon('nav');
    announce(`Scheda ${label}`, 'polite');
  };

  tabBar.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    const curIdx = TAB_LABELS.findIndex((t) => t.id === activeTab);
    const delta = ev.key === 'ArrowRight' ? 1 : -1;
    const { index } = computeSafeLoopIndex(curIdx, delta, TAB_LABELS.length);
    const nextTab = TAB_LABELS[index];
    if (nextTab) {
      selectTab(nextTab.id, true);
    }
  });

  const renderPanel = (focusActiveTab = false): void => {
    tabBar.innerHTML = '';
    for (const tab of TAB_LABELS) {
      const isSelected = activeTab === tab.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ultra-btn ${isSelected ? 'ultra-btn--primary' : 'ultra-btn--ghost'}`;
      btn.textContent = tab.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;
      btn.addEventListener('click', () => {
        if (activeTab !== tab.id) {
          selectTab(tab.id, true);
        }
      });
      tabBar.appendChild(btn);
      if (focusActiveTab && isSelected) {
        btn.focus();
      }
    }

    content.innerHTML = '';
    if (activeTab === 'audio') {
      const volWrap = document.createElement('div');
      volWrap.className = 'ultra-toggle-row';
      const lbl = document.createElement('span');
      lbl.textContent = `Volume Generale (${current.audioVolume}% — tetto sicurezza 75%)`;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(current.audioVolume);
      slider.setAttribute('aria-label', 'Volume Generale');
      slider.addEventListener('input', () => {
        current.audioVolume = Number(slider.value);
        lbl.textContent = `Volume Generale (${current.audioVolume}% — tetto sicurezza 75%)`;
        saveSettings(current);
      });
      volWrap.append(lbl, slider);

      const testBtn = document.createElement('button');
      testBtn.type = 'button';
      testBtn.className = 'ultra-btn ultra-btn--ghost';
      testBtn.textContent = 'Testa Audio';
      testBtn.addEventListener('click', () => {
        playEarcon('confirm');
        announce('Test audio eseguito', 'polite');
      });

      content.append(
        volWrap,
        createToggle({
          label: 'Effetti Sonori (SFX)',
          checked: current.sfxEnabled,
          onChange: (next) => {
            current.sfxEnabled = next;
            saveSettings(current);
            if (next) {
              playEarcon('nav');
            }
          },
        }),
        testBtn,
      );
    } else if (activeTab === 'video') {
      content.appendChild(
        createToggle({
          label: 'Riduci Animazioni (60fps Eco)',
          checked: current.reducedMotion,
          onChange: (next) => {
            current.reducedMotion = next;
            saveSettings(current);
          },
        }),
      );
    } else if (activeTab === 'gameplay') {
      content.appendChild(
        createToggle({
          label: 'Ordina Mano Automaticamente',
          checked: current.autoSortHand,
          onChange: (next) => {
            current.autoSortHand = next;
            saveSettings(current);
          },
        }),
      );
    } else if (activeTab === 'controlli') {
      content.appendChild(
        createToggle({
          label: 'Mostra Suggerimenti Tasti (1-0,-,= / P / U)',
          checked: current.showKeyHints,
          onChange: (next) => {
            current.showKeyHints = next;
            saveSettings(current);
          },
        }),
      );
    } else {
      content.append(
        createToggle({
          label: 'Alto Contrasto WCAG 2.1 AA',
          checked: current.highContrast,
          onChange: (next) => {
            current.highContrast = next;
            saveSettings(current);
          },
        }),
        createToggle({
          label: 'Etichette Testuali per Daltonismo',
          checked: current.colorblindLabels,
          onChange: (next) => {
            current.colorblindLabels = next;
            saveSettings(current);
          },
        }),
      );
    }
  };

  renderPanel();
  root.append(tabBar, content);
  openModal({ title: 'Impostazioni UNO ULTRA', body: root });
}
