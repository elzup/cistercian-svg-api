const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const { Readable } = require("node:stream");
const { SVGIcons2SVGFontStream } = require("svgicons2svgfont");
const svg2ttf = require("svg2ttf");
const ttf2woff = require("ttf2woff");
const ttf2woff2 = require("ttf2woff2").default;
const {
  getSegmentsForValue,
  segmentsToPathData,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
} = require("../lib/cistercian");

const finished = promisify(require("node:stream").finished);

const FONT_NAME = "Cistercian";
const DIST_DIR = path.resolve(__dirname, "..", "dist", "font");
const SVG_DIR = path.join(DIST_DIR, "glyphs");
const PUA_PREFIX = 0xf0000;
const FONT_ASCENT = 1000;
const FONT_DESCENT = 0;
const GLYPH_MARGIN = 96;
const UNITS_PER_EM = FONT_ASCENT - FONT_DESCENT;
const GLYPH_HEIGHT = UNITS_PER_EM - GLYPH_MARGIN * 2;
const GLYPH_WIDTH = Math.round(GLYPH_HEIGHT * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT));

function toHex(value) {
  return value.toString(16).toUpperCase();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function scaleX(value) {
  return (value / VIEWBOX_WIDTH) * GLYPH_WIDTH + GLYPH_MARGIN;
}

function scaleY(value) {
  return FONT_ASCENT - ((value / VIEWBOX_HEIGHT) * GLYPH_HEIGHT + GLYPH_MARGIN);
}

function transformPathData(pathData) {
  return pathData.replace(
    /([MLA]) ([0-9.]+) ([0-9.]+)(?: 0 0 1 ([0-9.]+) ([0-9.]+))?/g,
    (match, command, x1, y1, x2, y2) => {
      if (command === "A") {
        const radius = (Number(x1) / VIEWBOX_WIDTH) * GLYPH_WIDTH;
        return `A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 0 0 ${scaleX(Number(x2)).toFixed(3)} ${scaleY(Number(y2)).toFixed(3)}`;
      }

      return `${command} ${scaleX(Number(x1)).toFixed(3)} ${scaleY(Number(y1)).toFixed(3)}`;
    },
  );
}

function buildGlyphSvg(value) {
  const pathData = segmentsToPathData(getSegmentsForValue(value), {
    strokeWidth: 9,
    lineCap: "square",
  });
  const transformedPath = transformPathData(pathData);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GLYPH_WIDTH + GLYPH_MARGIN * 2} ${FONT_ASCENT}">
  <path d="${transformedPath}" />
</svg>`;
}

async function buildSvgFont(glyphs) {
  const svgFontPath = path.join(DIST_DIR, `${FONT_NAME}.svg`);
  const fontStream = new SVGIcons2SVGFontStream({
    fontName: FONT_NAME,
    fontHeight: FONT_ASCENT,
    normalize: false,
    centerHorizontally: true,
    fixedWidth: false,
    descent: FONT_DESCENT,
  });

  const output = fs.createWriteStream(svgFontPath);
  fontStream.pipe(output);

  for (const glyph of glyphs) {
    const stream = Readable.from([glyph.svg]);
    stream.metadata = {
      name: glyph.name,
      unicode: [String.fromCodePoint(glyph.codepoint)],
    };
    fontStream.write(stream);
  }

  fontStream.end();
  await finished(output);

  return svgFontPath;
}

function buildManifest(glyphs) {
  const manifest = {};
  for (const glyph of glyphs) {
    manifest[glyph.value] = {
      codepoint: `U+${toHex(glyph.codepoint)}`,
      entity: `&#x${toHex(glyph.codepoint)};`,
      unicode: String.fromCodePoint(glyph.codepoint),
    };
  }
  return manifest;
}

function buildCss() {
  return `@font-face {
  font-family: "${FONT_NAME}";
  src:
    url("./${FONT_NAME}.woff2") format("woff2"),
    url("./${FONT_NAME}.woff") format("woff"),
    url("./${FONT_NAME}.ttf") format("truetype");
  font-display: block;
}

.cistercian {
  font-family: "${FONT_NAME}", sans-serif;
  font-variant-ligatures: none;
  speak: none;
}`;
}

function buildDemo(manifest) {
  const demoValues = [1, 9, 42, 1987, 9999]
    .map((value) => {
      const entry = manifest[String(value)];
      return `<tr><th>${value}</th><td class="cistercian">${entry.unicode}</td><td>${entry.entity}</td></tr>`;
    })
    .join("\n        ");
  const sample = manifest["1987"];
  const shortLabel = `Shelf <span class="cistercian inline-glyph">${sample.unicode}</span> north`;
  const bodyText = `Archive note <span class="cistercian inline-glyph">${sample.unicode}</span> was copied before dawn.`;
  const inlineCode = `<span class="cistercian">${sample.entity}</span>`;
  const htmlCode = [
    inlineCode,
    "",
    `<p>Shelf ${inlineCode} north</p>`,
    `<p>Archive note ${inlineCode} was copied.</p>`,
  ]
    .map((line) => escapeHtml(line))
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${FONT_NAME} Demo</title>
    <link rel="stylesheet" href="./${FONT_NAME}.css" />
    <style>
      :root {
        color-scheme: light;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        background: #f4efe6;
        color: #23180d;
      }
      body {
        margin: 0;
        padding: 48px 24px;
      }
      main {
        max-width: 860px;
        margin: 0 auto;
      }
      .section {
        margin-top: 28px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: rgba(255, 255, 255, 0.7);
      }
      th, td {
        padding: 16px;
        border-bottom: 1px solid rgba(35, 24, 13, 0.15);
        text-align: left;
      }
      .cistercian {
        font-size: 72px;
        line-height: 1;
      }
      .inline-glyph {
        font-size: 1.15em;
        vertical-align: -0.08em;
      }
      .example-block {
        padding: 18px 20px;
        border: 1px solid rgba(35, 24, 13, 0.15);
        background: rgba(255, 255, 255, 0.7);
      }
      pre {
        margin: 0;
        padding: 16px;
        overflow: auto;
        background: #f8f4ec;
      }
      code {
        font-family: "SFMono-Regular", monospace;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${FONT_NAME}</h1>
      <p>Each value maps to one Private Use Area code point. Apply the font to the mapped character, not to the Arabic digits directly.</p>
      <table>
        <thead>
          <tr><th>Value</th><th>Glyph</th><th>HTML Entity</th></tr>
        </thead>
        <tbody>
        ${demoValues}
        </tbody>
      </table>

      <section class="section">
        <h2>Inline examples</h2>
        <div class="example-block">
          <p>${shortLabel}</p>
          <p>${bodyText}</p>
        </div>
      </section>

      <section class="section">
        <h2>HTML</h2>
        <pre><code>${htmlCode}</code></pre>
      </section>
    </main>
  </body>
</html>`;
}

async function main() {
  ensureDir(DIST_DIR);
  ensureDir(SVG_DIR);

  const glyphs = [];

  for (let value = 0; value <= 9999; value += 1) {
    const svg = buildGlyphSvg(value);
    const name = `cistercian-${String(value).padStart(4, "0")}`;
    const codepoint = PUA_PREFIX + Number.parseInt(String(value).padStart(4, "0"), 16);
    fs.writeFileSync(path.join(SVG_DIR, `${name}.svg`), svg);
    glyphs.push({ value: String(value), name, codepoint, svg });
  }

  const svgFontPath = await buildSvgFont(glyphs);
  const svgFont = fs.readFileSync(svgFontPath, "utf8");
  const ttf = svg2ttf(svgFont, {});
  const ttfBuffer = Buffer.from(ttf.buffer);
  const manifest = buildManifest(glyphs);

  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.ttf`), ttfBuffer);
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.woff`), Buffer.from(ttf2woff(ttfBuffer).buffer));
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.woff2`), Buffer.from(ttf2woff2(ttfBuffer)));
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.css`), buildCss());
  fs.writeFileSync(path.join(DIST_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(DIST_DIR, "demo.html"), buildDemo(manifest));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
