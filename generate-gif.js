#!/usr/bin/env node
// Generate an animated GIF demonstrating the master toggle.
// Captures PNG frames with Puppeteer, then assembles with ImageMagick.
// Usage: node generate-gif.js

const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const POPUP_URL = 'file://' + path.resolve(__dirname, 'popup.html');
const OUTPUT_FILE = path.resolve(__dirname, 'images', 'demo.gif');
const FRAME_DIR = path.resolve(__dirname, '.gif-frames');

const WIDTH = 360;
const SCALE = 2;

(async () => {
  // Prepare temp frame directory
  if (fs.existsSync(FRAME_DIR)) fs.rmSync(FRAME_DIR, { recursive: true });
  fs.mkdirSync(FRAME_DIR);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: SCALE });
  await page.goto(POPUP_URL, { waitUntil: 'networkidle0', timeout: 15000 });

  // Set version badge
  await page.evaluate(() => {
    const badge = document.querySelector('.version-badge');
    if (badge) badge.textContent = 'v1.3.37';
  });

  // Start with all toggles ON
  await page.evaluate(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = true;
    });
  });
  await new Promise(r => setTimeout(r, 400));

  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const clip = { x: 0, y: 0, width: WIDTH, height: bodyHeight };

  let frameNum = 0;
  const frames = []; // { file, delay } — delay in centiseconds (ImageMagick convention)

  async function snap(delayCs) {
    const file = path.join(FRAME_DIR, `frame-${String(frameNum).padStart(3, '0')}.png`);
    await page.screenshot({ path: file, clip });
    frames.push({ file, delay: delayCs });
    frameNum++;
  }

  // ── Frame sequence ───────────────────────────────────────────────
  // 1) Hold ON state
  await snap(120); // 1.2 s

  // 2) Toggle OFF — capture transition
  await page.evaluate(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
  });
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 45));
    await snap(5); // 50 ms
  }

  // 3) Hold OFF state
  await new Promise(r => setTimeout(r, 100));
  await snap(120); // 1.2 s

  // 4) Toggle ON — capture transition
  await page.evaluate(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = true;
    });
  });
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 45));
    await snap(5); // 50 ms
  }

  await browser.close();

  // ── Assemble GIF with ImageMagick ────────────────────────────────
  // Build per-frame delay flags: -delay <cs> <file>
  const convertArgs = frames.flatMap(f => ['-delay', String(f.delay), f.file]);
  const cmd = [
    'magick',
    '-loop', '0',          // infinite loop
    ...convertArgs,
    '-layers', 'Optimize', // optimise file size
    OUTPUT_FILE,
  ];

  console.log(`Assembling ${frames.length} frames into GIF…`);
  execSync(cmd.join(' '), { stdio: 'inherit' });

  // Clean up temp frames
  fs.rmSync(FRAME_DIR, { recursive: true });

  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0);
  console.log(`✓ ${OUTPUT_FILE} (${sizeKB} KB)`);
})();
