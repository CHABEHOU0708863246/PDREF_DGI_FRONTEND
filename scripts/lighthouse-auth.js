module.exports = async (browser, context) => {
  const target = new URL(context.url);
  if (!target.pathname.startsWith('/dashboard') || target.searchParams.get('lighthouse') === '1') {
    return;
  }

  const login = process.env.PDREF_LHCI_LOGIN;
  const password = process.env.PDREF_LHCI_PASSWORD;
  if (!login || !password) {
    throw new Error('PDREF_LHCI_LOGIN et PDREF_LHCI_PASSWORD sont requis pour Lighthouse.');
  }

  const page = await browser.newPage();
  try {
    await page.goto(`${target.origin}/auth/login`, { waitUntil: 'networkidle0' });
    if (page.url().includes('/auth/login')) {
      await page.type('#login-identifiant', login);
      await page.type('#login-password', password);
      await page.click('button[type="submit"]');
    }
    await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), {
      timeout: 30_000,
    });
    await page.goto(target.href, { waitUntil: 'networkidle0' });
  } finally {
    await page.close();
  }
};
