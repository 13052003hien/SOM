import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://127.0.0.1:4173';
const viewports = [
  { name: 'desktop-1366', width: 1366, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 }
];

const routes = [
  '/dashboard',
  '/transactions',
  '/wallets',
  '/categories',
  '/reports',
  '/settings'
];

function getSelector(el) {
  if (!el || !el.tagName) return 'unknown';
  if (el.id) return `#${el.id}`;
  const cls = (el.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return cls.length ? `${el.tagName.toLowerCase()}.${cls.join('.')}` : el.tagName.toLowerCase();
}

test('responsive audit', async ({ browser }) => {
  test.setTimeout(180000);
  const logs = [];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

    await context.addInitScript(() => {
      window.localStorage.setItem('som_token', 'qa-token');
      window.localStorage.setItem('som_user', JSON.stringify({ email: 'qa@example.com' }));
    });

    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);

      const issue = await page.evaluate(() => {
        const issues = [];
        const root = document.documentElement;
        const overflowX = root.scrollWidth > window.innerWidth + 1;
        if (overflowX) {
          issues.push({
            type: 'horizontal-overflow',
            detail: `scrollWidth=${root.scrollWidth}, innerWidth=${window.innerWidth}`
          });
        }

        const controls = Array.from(document.querySelectorAll('button, input, select, textarea, a'));
        const tooSmall = controls
          .map((el) => ({ el, rect: el.getBoundingClientRect() }))
          .filter(({ rect, el }) => {
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (rect.width === 0 || rect.height === 0) return false;
            return rect.height < 38;
          })
          .slice(0, 8)
          .map(({ el, rect }) => ({
            selector: (function getSelector(node) {
              if (!node || !node.tagName) return 'unknown';
              if (node.id) return `#${node.id}`;
              const cls = (node.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);
              return cls.length ? `${node.tagName.toLowerCase()}.${cls.join('.')}` : node.tagName.toLowerCase();
            })(el),
            height: Math.round(rect.height)
          }));

        if (tooSmall.length) {
          issues.push({ type: 'small-controls', detail: tooSmall });
        }

        const emptyButtons = Array.from(document.querySelectorAll('button'))
          .filter((btn) => {
            const text = (btn.textContent || '').trim();
            const aria = (btn.getAttribute('aria-label') || '').trim();
            const cs = window.getComputedStyle(btn);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            return !text && !aria;
          })
          .slice(0, 8)
          .map((btn) => (function getSelector(node) {
            if (!node || !node.tagName) return 'unknown';
            if (node.id) return `#${node.id}`;
            const cls = (node.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);
            return cls.length ? `${node.tagName.toLowerCase()}.${cls.join('.')}` : node.tagName.toLowerCase();
          })(btn));

        if (emptyButtons.length) {
          issues.push({ type: 'empty-buttons', detail: emptyButtons });
        }

        const clippedText = Array.from(document.querySelectorAll('h1, h2, h3, p, span, strong, button, a'))
          .filter((el) => {
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            const hasClip = ['hidden', 'clip'].includes(cs.overflowX) || cs.textOverflow === 'ellipsis';
            if (!hasClip) return false;
            return el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0;
          })
          .slice(0, 8)
          .map((el) => (function getSelector(node) {
            if (!node || !node.tagName) return 'unknown';
            if (node.id) return `#${node.id}`;
            const cls = (node.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);
            return cls.length ? `${node.tagName.toLowerCase()}.${cls.join('.')}` : node.tagName.toLowerCase();
          })(el));

        if (clippedText.length) {
          issues.push({ type: 'potential-clipped-text', detail: clippedText });
        }

        return issues;
      });

      logs.push({ viewport: vp.name, route, issues: issue });
    }

    await context.close();
  }

  const outPath = path.resolve(process.cwd(), 'responsive-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(logs, null, 2), 'utf-8');
  console.log(`responsive-audit-written:${outPath}`);
});
