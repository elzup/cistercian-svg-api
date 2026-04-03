const { renderCistercianSvg } = require("../lib/cistercian");

function parseInteger(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

module.exports = function handler(req, res) {
  const value = parseInteger(req.query.value);

  if (value === null || value < 0 || value > 9999) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: "value must be an integer between 0 and 9999",
      }),
    );
    return;
  }

  const svg = renderCistercianSvg(value, {
    cap: req.query.cap,
    color: req.query.color,
    stroke: req.query.stroke,
    size: req.query.size,
  });

  res.statusCode = 200;
  res.setHeader("content-type", "image/svg+xml; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  res.end(svg);
};
