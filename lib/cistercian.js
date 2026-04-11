const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 156;
const STEM_X = 50;
const TOP_Y = 14;
const MID_Y = 52;
const BOTTOM_Y = 142;
const EDGE_X = 90;

const UNIT_PATTERNS = {
  1: [
    [STEM_X, TOP_Y, EDGE_X, TOP_Y],
  ],
  2: [
    [STEM_X, MID_Y, EDGE_X, MID_Y],
  ],
  3: [
    [STEM_X, TOP_Y, EDGE_X, MID_Y],
  ],
  4: [
    [STEM_X, MID_Y, EDGE_X, TOP_Y],
  ],
  5: [
    [STEM_X, MID_Y, EDGE_X, TOP_Y],
    [STEM_X, TOP_Y, EDGE_X, TOP_Y],
  ],
  6: [
    [EDGE_X, TOP_Y, EDGE_X, MID_Y],
  ],
  7: [
    [STEM_X, TOP_Y, EDGE_X, TOP_Y],
    [EDGE_X, TOP_Y, EDGE_X, MID_Y],
  ],
  8: [
    [STEM_X, MID_Y, EDGE_X, MID_Y],
    [EDGE_X, TOP_Y, EDGE_X, MID_Y],
  ],
  9: [
    [STEM_X, MID_Y, EDGE_X, MID_Y],
    [EDGE_X, TOP_Y, EDGE_X, MID_Y],
    [STEM_X, TOP_Y, EDGE_X, TOP_Y],
  ],
};

function reflectSegment(segment, place) {
  const [x1, y1, x2, y2] = segment;

  if (place === 0) {
    return segment;
  }

  if (place === 1) {
    return [VIEWBOX_WIDTH - x1, y1, VIEWBOX_WIDTH - x2, y2];
  }

  if (place === 2) {
    return [x1, VIEWBOX_HEIGHT - y1, x2, VIEWBOX_HEIGHT - y2];
  }

  return [
    VIEWBOX_WIDTH - x1,
    VIEWBOX_HEIGHT - y1,
    VIEWBOX_WIDTH - x2,
    VIEWBOX_HEIGHT - y2,
  ];
}

function segmentsForDigit(place, digit) {
  if (digit === 0) {
    return [];
  }

  return UNIT_PATTERNS[digit].map((segment) => reflectSegment(segment, place));
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeOptions(options = {}) {
  const size = clampNumber(Number(options.size) || 128, 32, 1024);
  const strokeWidth = clampNumber(Number(options.stroke) || 6, 1, 32);
  const lineCap = options.cap === "square" ? "square" : "round";
  const color = /^[a-zA-Z]+$|^#[0-9a-fA-F]{3,8}$/.test(options.color || "")
    ? options.color
    : "currentColor";

  return {
    lineCap,
    color,
    size,
    strokeWidth,
  };
}

function roundNumber(value) {
  return Number(value.toFixed(3));
}

function segmentToPathData(segment, options = {}) {
  const [x1, y1, x2, y2] = segment;
  const strokeWidth = Number(options.strokeWidth) || 6;
  const lineCap = options.lineCap === "square" ? "square" : "round";
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return "";
  }

  const ux = dx / length;
  const uy = dy / length;
  const px = -uy * (strokeWidth / 2);
  const py = ux * (strokeWidth / 2);

  const startLeft = [roundNumber(x1 + px), roundNumber(y1 + py)];
  const endLeft = [roundNumber(x2 + px), roundNumber(y2 + py)];
  const endRight = [roundNumber(x2 - px), roundNumber(y2 - py)];
  const startRight = [roundNumber(x1 - px), roundNumber(y1 - py)];

  if (lineCap === "square") {
    return [
      `M ${startLeft[0]} ${startLeft[1]}`,
      `L ${endLeft[0]} ${endLeft[1]}`,
      `L ${endRight[0]} ${endRight[1]}`,
      `L ${startRight[0]} ${startRight[1]}`,
      "Z",
    ].join(" ");
  }

  const radius = roundNumber(strokeWidth / 2);

  return [
    `M ${startLeft[0]} ${startLeft[1]}`,
    `L ${endLeft[0]} ${endLeft[1]}`,
    `A ${radius} ${radius} 0 0 1 ${endRight[0]} ${endRight[1]}`,
    `L ${startRight[0]} ${startRight[1]}`,
    `A ${radius} ${radius} 0 0 1 ${startLeft[0]} ${startLeft[1]}`,
    "Z",
  ].join(" ");
}

function segmentsToPathData(segments, options = {}) {
  return segments
    .map((segment) => segmentToPathData(segment, options))
    .filter(Boolean)
    .join(" ");
}

function renderCistercianSvg(value, options = {}) {
  const { color, lineCap, size, strokeWidth } = normalizeOptions(options);
  const digits = String(value).padStart(4, "0").split("").map(Number);
  const segments = [
    [STEM_X, TOP_Y, STEM_X, BOTTOM_Y],
    ...segmentsForDigit(0, digits[3]),
    ...segmentsForDigit(1, digits[2]),
    ...segmentsForDigit(2, digits[1]),
    ...segmentsForDigit(3, digits[0]),
  ];

  const lines = segments
    .map(
      ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT))}" height="${size}" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" role="img" aria-label="${escapeXml(value)}">
  <g fill="none" stroke="${escapeXml(color)}" stroke-width="${strokeWidth}" stroke-linecap="${lineCap}" stroke-linejoin="round">
    ${lines}
  </g>
</svg>`;
}

function getSegmentsForValue(value) {
  const digits = String(value).padStart(4, "0").split("").map(Number);
  return [
    [STEM_X, TOP_Y, STEM_X, BOTTOM_Y],
    ...segmentsForDigit(0, digits[3]),
    ...segmentsForDigit(1, digits[2]),
    ...segmentsForDigit(2, digits[1]),
    ...segmentsForDigit(3, digits[0]),
  ];
}

module.exports = {
  renderCistercianSvg,
  getSegmentsForValue,
  segmentsToPathData,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
};
