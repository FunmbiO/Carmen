// Developer check: a finger drag on the bouquet, the sunset scene and the slider must not scroll the page.
// Needs Playwright (not a project dependency) and the built site served on port 4173.
const { chromium } = require('playwright');
// Drags a finger vertically across an element and reports how far the page scrolled.
async function swipe(cdp, x, y0, y1) {
  const pt = (yy) => [{ x, y: yy, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(y0) });
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(y0 + ((y1 - y0) * i) / steps) });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.route('https://www.youtube.com/**', (r) => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('carmen-theme', 'ivory'); } catch {} });
  const targets = [['bloom', '#cv-bloom', 'bouquet'], ['golden-hour', '#cv-golden', 'sunset canvas'], ['golden-hour', '#gSlider', 'sunset slider']];
  for (const [hash, sel, label] of targets) {
    await p.goto('http://127.0.0.1:4173/#' + hash); await p.waitForTimeout(2500);
    // Bring the element to the middle of the screen, then swipe up across it.
    await p.evaluate((s) => { const el = document.querySelector(s); const v = document.getElementById('views'); const r = el.getBoundingClientRect(); v.scrollTop += r.top - 200; }, sel);
    await p.waitForTimeout(700);
    const box = await p.locator(sel).boundingBox();
    const before = await p.evaluate(() => document.getElementById('views').scrollTop);
    const x = box.x + box.width * 0.5, y0 = box.y + box.height * 0.5;
    await swipe(cdp, x, sel === '#gSlider' ? y0 : y0 + 60, y0 - 100);
    await p.waitForTimeout(900);
    const after = await p.evaluate(() => document.getElementById('views').scrollTop);
    const ta = await p.evaluate((s) => getComputedStyle(document.querySelector(s)).touchAction, sel);
    console.log(`${label.padEnd(14)} touch-action=${ta.padEnd(6)} page moved ${Math.round(after - before)}px`);
  }
  await b.close();
})();
