const {
  getSegmentsForValue,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
} = require("../lib/cistercian");

function parseInteger(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function renderLines(segments, opts) {
  const { scaleX, scaleY, offsetX, offsetY, color, strokeWidth, lineCap } =
    opts;
  return segments
    .map(([x1, y1, x2, y2]) => {
      const sx1 = Math.round((x1 / VIEWBOX_WIDTH) * scaleX + offsetX);
      const sy1 = Math.round((y1 / VIEWBOX_HEIGHT) * scaleY + offsetY);
      const sx2 = Math.round((x2 / VIEWBOX_WIDTH) * scaleX + offsetX);
      const sy2 = Math.round((y2 / VIEWBOX_HEIGHT) * scaleY + offsetY);
      return `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" />`;
    })
    .join("\n    ");
}

function renderLogo(value, segments) {
  const size = 512;
  const pad = 64;
  const glyphW = size - pad * 2;
  const glyphH = Math.round(glyphW * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH));
  const offsetX = pad;
  const offsetY = Math.round((size - glyphH) / 2);

  const lines = renderLines(segments, {
    scaleX: glyphW,
    scaleY: glyphH,
    offsetX,
    offsetY,
    color: "#e8e0d0",
    strokeWidth: 10,
    lineCap: "round",
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${value}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#2a2560" />
      <stop offset="100%" stop-color="#0d0b1e" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="64" fill="url(#bg)" />
  <g fill="none" stroke="#e8e0d0" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    ${lines}
  </g>
  <rect width="${size}" height="${size}" rx="64" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.12" />
</svg>`;
}

function renderScreen(value, segments) {
  const W = 1200;
  const H = 630;

  const glyphH = 420;
  const glyphW = Math.round(glyphH * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT));
  const glyphOffsetX = 120;
  const glyphOffsetY = Math.round((H - glyphH) / 2);

  const lines = renderLines(segments, {
    scaleX: glyphW,
    scaleY: glyphH,
    offsetX: glyphOffsetX,
    offsetY: glyphOffsetY,
    color: "#f0ead6",
    strokeWidth: 12,
    lineCap: "round",
  });

  const arabicX = glyphOffsetX + glyphW + 80;
  const arabicCenterX = Math.round((arabicX + W - 60) / 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${value}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0c29" />
      <stop offset="50%" stop-color="#1a1650" />
      <stop offset="100%" stop-color="#24243e" />
    </linearGradient>
    <linearGradient id="divider" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <!-- decorative dots -->
  <circle cx="980" cy="80" r="160" fill="#ffffff" fill-opacity="0.025" />
  <circle cx="1100" cy="550" r="100" fill="#ffffff" fill-opacity="0.02" />
  <!-- cistercian glyph -->
  <g fill="none" stroke="#f0ead6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    ${lines}
  </g>
  <!-- vertical divider -->
  <line x1="${arabicX - 40}" y1="0" x2="${arabicX - 40}" y2="${H}" stroke="url(#divider)" stroke-width="1" />
  <!-- arabic numeral -->
  <text x="${arabicCenterX}" y="${Math.round(H / 2 + 60)}" text-anchor="middle" font-family="Georgia, serif" font-size="160" font-weight="700" fill="#f0ead6" letter-spacing="-4">${value}</text>
  <!-- label -->
  <text x="${arabicCenterX}" y="${H - 48}" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#f0ead6" fill-opacity="0.4" letter-spacing="6">CISTERCIAN</text>
</svg>`;
}

module.exports = function handler(req, res) {
  const value = parseInteger(req.query.value);

  if (value === null || value < 0 || value > 9999) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({ error: "value must be an integer between 0 and 9999" }),
    );
    return;
  }

  const type = req.query.type === "logo" ? "logo" : "screen";
  const segments = getSegmentsForValue(value);
  const svg = type === "logo" ? renderLogo(value, segments) : renderScreen(value, segments);

  res.statusCode = 200;
  res.setHeader("content-type", "image/svg+xml; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  res.end(svg);
};
