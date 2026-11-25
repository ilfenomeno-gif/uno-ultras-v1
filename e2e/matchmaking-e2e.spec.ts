import { expect, test, type Page } from '@playwright/test';

async function registerAndEnterLobby(page: Page, username: string): Promise<void> {
  await page.goto('/#auth');
  await page.locator('.auth-switch').click();
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill('TestPass123!');
  await page.locator('input[name="confirmPassword"]').fill('TestPass123!');
  await page.locator('button.auth-submit').click();
  await expect(page.locator('.launcher-play-btn')).toBeVisible({ timeout: 15_000 });
}

test('two browser contexts matchmake into the same UNO room, reject uninvited WebSocket intruder, play cards, and reach settlement', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
  const usernameA = `E2E_A_${suffix}`;
  const usernameB = `E2E_B_${suffix}`;
  const usernameIntruder = `E2E_X_${suffix}`;

  if (process.env['CI'] || process.env['E2E_USE_REAL_INFRA'] === 'true') {
    const healthRes = await fetch('http://127.0.0.1:3001/api/health');
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as {
      dependencies?: { postgres?: string; redis?: string };
    };
    expect(health.dependencies?.postgres).toBe('up');
    expect(health.dependencies?.redis).toBe('up');
  }

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const contextIntruder = await browser.newContext();

  try {
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const pageIntruder = await contextIntruder.newPage();
    const runtimeLogs: string[] = [];

    for (const [label, page] of [
      ['A', pageA],
      ['B', pageB],
    ] as const) {
      page.on('pageerror', (err) => runtimeLogs.push(`[${label}:pageerror] ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          runtimeLogs.push(`[${label}:console.error] ${msg.text()}`);
        }
      });
    }

    await Promise.all([
      registerAndEnterLobby(pageA, usernameA),
      registerAndEnterLobby(pageB, usernameB),
      registerAndEnterLobby(pageIntruder, usernameIntruder),
    ]);

    // Usa variante Blitz (5 carte iniziali) su coda 1v1 Classificata
    for (const page of [pageA, pageB]) {
      const variantSelect = page.locator('select', {
        has: page.locator('option[value="blitz"]'),
      });
      await variantSelect.selectOption('blitz');
    }

    // Avvia matchmaking su entrambi i browser: A attende e B attiva popMatches() + createRoom
    await Promise.all([
      pageA.locator('.launcher-play-btn').click(),
      (async () => {
        await pageB.waitForTimeout(250);
        await pageB.locator('.launcher-play-btn').click();
      })(),
    ]);

    const roomBadgeA = pageA.locator('[data-role="room-id"]');
    const roomBadgeB = pageB.locator('[data-role="room-id"]');
    await expect(roomBadgeA).toHaveText(/^Room .+/, { timeout: 20_000 });
    await expect(roomBadgeB).toHaveText(/^Room .+/, { timeout: 20_000 });

    const roomIdA = (await roomBadgeA.textContent())?.trim();
    const roomIdB = (await roomBadgeB.textContent())?.trim();
    expect(roomIdA).toBeTruthy();
    expect(roomIdA).toBe(roomIdB);

    const rawRoomId = roomIdA!.replace(/^Room\s+/, '');

    // Verifica reale su WebSocket Colyseus: un terzo utente autenticato non in allowedPlayerIds viene respinto da UnoRoom.onAuth
    const intruderAttempt = await pageIntruder.evaluate(async (targetRoomId) => {
      const { getToken } = await import('/src/state/profile-store.ts');
      const { joinUnoRoomById } = await import('/src/net/tcp/colyseus-client.ts');
      try {
        await joinUnoRoomById(targetRoomId, getToken() ?? '');
        return { joined: true, error: '' };
      } catch (err) {
        return {
          joined: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }, rawRoomId);
    expect(intruderAttempt.joined).toBe(false);
    expect(intruderAttempt.error).toMatch(/Accesso negato/i);

    // Verifica che gli avversari al tavolo siano davvero i due contesti umani (zero bot)
    await expect(pageA.locator('[data-role="opponents"]')).toContainText(usernameB);
    await expect(pageB.locator('[data-role="opponents"]')).toContainText(usernameA);

    // Loop di gioco reale rispettando RoomActionThrottle(12, 2000) fino a fine partita / liquidazione
    let cardsPlayed = 0;
    let drawsClicked = 0;
    const loopDeadline = Date.now() + 75_000;
    while (Date.now() < loopDeadline) {
      const endedA = await pageA.locator('[data-role="ended-overlay"]:not([hidden])').count();
      const endedB = await pageB.locator('[data-role="ended-overlay"]:not([hidden])').count();
      if (endedA > 0 && endedB > 0) {
        break;
      }

      let acted = false;
      for (const page of [pageA, pageB]) {
        const callUnoBtn = page.locator('button[data-action="call-uno"][aria-disabled="false"]');
        if ((await callUnoBtn.count()) > 0) {
          await callUnoBtn.click().catch(() => undefined);
          await page.waitForTimeout(220);
          acted = true;
          break;
        }

        const wildBtns = page.locator('[data-role="wild-overlay"]:not([hidden]) .wild-color-btn');
        if ((await wildBtns.count()) > 0) {
          await wildBtns.first().click({ force: true }).catch(() => undefined);
          await page.waitForTimeout(250);
          acted = true;
          break;
        }

        const isTurn = (await page.locator('[data-role="status"].is-my-turn').count()) > 0;
        if (!isTurn) {
          continue;
        }

        const playableCard = page.locator('.uno-card[aria-disabled="false"]').first();
        if ((await playableCard.count()) > 0) {
          await playableCard.click().catch(() => undefined);
          cardsPlayed += 1;
          await page.waitForTimeout(100);
          const postWild = page.locator('[data-role="wild-overlay"]:not([hidden]) .wild-color-btn');
          if ((await postWild.count()) > 0) {
            await postWild.first().click({ force: true }).catch(() => undefined);
          }
          await page.waitForTimeout(220);
          acted = true;
          break;
        }

        const drawBtn = page.locator('button[data-action="draw"][aria-disabled="false"]');
        if ((await drawBtn.count()) > 0) {
          await drawBtn.click().catch(() => undefined);
          drawsClicked += 1;
          await page.waitForTimeout(250);
          acted = true;
          break;
        }
      }

      if (!acted) {
        await pageA.waitForTimeout(100);
      }
    }

    const finalStatusA = await pageA.locator('[data-role="status"]').textContent();
    const finalStatusB = await pageB.locator('[data-role="status"]').textContent();
    const diag = `cardsPlayed=${cardsPlayed} draws=${drawsClicked} statusA=${finalStatusA} statusB=${finalStatusB} logs=${runtimeLogs.join(' | ')}`;
    expect(cardsPlayed, diag).toBeGreaterThanOrEqual(2);

    // Verifica overlay finale e ricevuta di liquidazione su entrambi i contesti
    for (const page of [pageA, pageB]) {
      await expect(page.locator('[data-role="ended-overlay"]:not([hidden])'), diag).toBeVisible();
      await expect(page.locator('[data-role="ended-winner"]'), diag).not.toHaveText('');
      await expect(page.locator('[data-role="mcp-rewards"]:not([hidden])'), diag).toBeVisible();
      await expect(page.locator('[data-role="mcp-rewards"]'), diag).toContainText('MMR');
      await expect(page.locator('[data-role="mcp-rewards"]'), diag).toContainText('V-Card');
    }
  } finally {
    await contextA.close();
    await contextB.close();
    await contextIntruder.close();
  }
});
