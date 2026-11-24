// ============================================================
// UNO ULTRA Client — 5-Tab Settings Modal (WCAG + Persisted Prefs)
// ============================================================

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

export function loadSettings(): ClientSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ClientSettings>) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: ClientSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // non-fatal
  }
  applySettingsToDocument(settings);
}

export function applySettingsToDocument(settings = loadSettings()): void {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  document.body.classList.toggle('high-contrast', settings.highContrast);
  document.body.classList.toggle('colorblind-labels', settings.colorblindLabels);
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
  const content = document.createElement('div');
  content.className = 'settings-tab-content';

  const renderPanel = (): void => {
    tabBar.innerHTML = '';
    for (const tab of TAB_LABELS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ultra-btn ${activeTab === tab.id ? 'ultra-btn--primary' : 'ultra-btn--ghost'}`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        activeTab = tab.id;
        renderPanel();
      });
      tabBar.appendChild(btn);
    }

    content.innerHTML = '';
    if (activeTab === 'audio') {
      const volWrap = document.createElement('div');
      volWrap.className = 'ultra-toggle-row';
      const lbl = document.createElement('span');
      lbl.textContent = `Volume Generale (${current.audioVolume}%)`;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(current.audioVolume);
      slider.addEventListener('input', () => {
        current.audioVolume = Number(slider.value);
        lbl.textContent = `Volume Generale (${current.audioVolume}%)`;
        saveSettings(current);
      });
      volWrap.append(lbl, slider);
      content.append(
        volWrap,
        createToggle({
          label: 'Effetti Sonori (SFX)',
          checked: current.sfxEnabled,
          onChange: (next) => {
            current.sfxEnabled = next;
            saveSettings(current);
          },
        }),
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
          label: 'Mostra Suggerimenti Tasti (INVIO / ESC)',
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
