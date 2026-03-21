#!/usr/bin/env node
// Generate PNG screenshots of the extension popup in all 4 variants.
// Usage: node generate-screenshots.js

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const POPUP_URL = 'file://' + path.resolve(__dirname, 'popup.html');
const OUTPUT_DIR = path.resolve(__dirname, 'images');

const VARIANTS = [
  { name: 'light-enabled',  dark: false, enabled: true  },
  { name: 'light-disabled', dark: false, enabled: false },
  { name: 'dark-enabled',   dark: true,  enabled: true  },
  { name: 'dark-disabled',  dark: true,  enabled: false },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  for (const v of VARIANTS) {
    const page = await browser.newPage();

    // Set viewport to match popup width; height will be auto-clipped
    await page.setViewport({ width: 360, height: 900, deviceScaleFactor: 2 });

    await page.goto(POPUP_URL, { waitUntil: 'networkidle0', timeout: 15000 });

    // Apply dark theme class if needed
    await page.evaluate((isDark) => {
      document.documentElement.classList.toggle('dark-theme', isDark);
    }, v.dark);

    // Set version badge text
    await page.evaluate(() => {
      const badge = document.querySelector('.version-badge');
      if (badge) badge.textContent = 'v1.3.37';
    });

    // Toggle all checkboxes
    await page.evaluate((checked) => {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = checked;
      });
    }, v.enabled);

    // Brief pause for any CSS transitions
    await new Promise(r => setTimeout(r, 300));

    // Clip to actual body content height
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

    const outFile = path.join(OUTPUT_DIR, `${v.name}.png`);
    await page.screenshot({
      path: outFile,
      clip: { x: 0, y: 0, width: 360, height: bodyHeight },
      omitBackground: false,
    });

    console.log(`✓ ${outFile}`);
    await page.close();
  }

  await browser.close();
  console.log('\nDone — 4 screenshots saved to images/');
})();
