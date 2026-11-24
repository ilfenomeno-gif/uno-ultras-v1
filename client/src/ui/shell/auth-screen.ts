// ============================================================
// UNO ULTRA — Auth screen (login / register post-AVANZA)
// ============================================================

import { LoginPayloadSchema, RegisterPayloadSchema } from '@uno/shared';
import { signIn, signUp } from '../../net/connection-manager.js';

type Mode = 'login' | 'register';

export interface AuthScreenOptions {
  onAuthenticated: () => void;
  onBack?: () => void;
}

export function mountAuthScreen(root: HTMLElement, opts: AuthScreenOptions): () => void {
  let mode: Mode = 'login';

  const container = document.createElement('div');
  container.className = 'auth-screen';

  const render = (): void => {
    const isRegister = mode === 'register';
    container.innerHTML = `
      <div class="auth-panel">
        <h1 class="auth-title">UNO ULTRA</h1>
        <p class="auth-subtitle">${isRegister ? 'Crea un nuovo profilo' : 'Accedi al tuo profilo'}</p>

        <form class="auth-form" novalidate>
          <label class="auth-field">
            <span>Username</span>
            <input type="text" name="username" autocomplete="username" minlength="3" maxlength="20" required />
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input type="password" name="password" autocomplete="${isRegister ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" required />
          </label>
          ${
            isRegister
              ? `<label class="auth-field">
            <span>Conferma Password</span>
            <input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" maxlength="128" required />
          </label>`
              : ''
          }

          <div class="auth-error" role="alert" hidden></div>

          <button type="submit" class="auth-submit">
            ${isRegister ? 'REGISTRATI' : 'ACCEDI'}
          </button>
        </form>

        <button type="button" class="auth-switch">
          ${isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
        </button>
        ${opts.onBack ? '<button type="button" class="auth-back">← Torna allo Splash (ESC)</button>' : ''}
      </div>
    `;

    const form = container.querySelector('form') as HTMLFormElement;
    const errBox = container.querySelector('.auth-error') as HTMLDivElement;
    const submitBtn = container.querySelector('.auth-submit') as HTMLButtonElement;
    const switchBtn = container.querySelector('.auth-switch') as HTMLButtonElement;
    const backBtn = container.querySelector('.auth-back') as HTMLButtonElement | null;

    switchBtn.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      render();
    });

    if (backBtn && opts.onBack) {
      const onBack = opts.onBack;
      backBtn.addEventListener('click', () => onBack());
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      errBox.hidden = true;
      submitBtn.disabled = true;

      const fd = new FormData(form);
      const username = String(fd.get('username') ?? '').trim();
      const password = String(fd.get('password') ?? '');
      const confirmPassword = String(fd.get('confirmPassword') ?? '');

      try {
        if (mode === 'login') {
          const parsed = LoginPayloadSchema.safeParse({ username, password });
          if (!parsed.success) {
            errBox.textContent = parsed.error.issues[0]?.message ?? 'Dati non validi';
            errBox.hidden = false;
            return;
          }
          await signIn(parsed.data);
        } else {
          const parsed = RegisterPayloadSchema.safeParse({
            username,
            password,
            confirmPassword,
          });
          if (!parsed.success) {
            errBox.textContent = parsed.error.issues[0]?.message ?? 'Dati non validi';
            errBox.hidden = false;
            return;
          }
          await signUp(parsed.data);
        }
        opts.onAuthenticated();
      } catch (e) {
        errBox.textContent = e instanceof Error ? e.message : 'Errore di autenticazione';
        errBox.hidden = false;
      } finally {
        submitBtn.disabled = false;
      }
    });
  };

  render();
  root.appendChild(container);

  return () => {
    container.remove();
  };
}
