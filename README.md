# Cistercian SVG API

![Cistercian SVG API logo](./logo.svg)

`0..9999` の整数を受け取り、シトー修道士数字の SVG を返す API です。

SVG API とは別に、同じ glyph コアからフォント生成もできます。

## Endpoint

`GET /1987`

内部的には `/api/n?value=1987` へ rewrite されます。

追加オプション:

- `color`: 線色。例 `black`, `#222`
- `stroke`: 線幅。例 `6`
- `size`: 画像サイズ。例 `128`

## Response

- 正常時: `image/svg+xml; charset=utf-8`
- 異常時: `400` JSON

## Local

```bash
npm install
npm run vercel:dev
```

`dev` script に `vercel dev` を置くと再帰するので、ローカル起動は `npm run vercel:dev` を使います。

## Font Build

SVG API とは別用途で、`0..9999` の glyph を Private Use Area に割り当てた font も生成できます。

```bash
npm install
npm run build:font
```

生成物:

- `dist/font/Cistercian.ttf`
- `dist/font/Cistercian.woff`
- `dist/font/Cistercian.woff2`
- `dist/font/Cistercian.css`
- `dist/font/manifest.json`
- `dist/font/demo.html`

`manifest.json` には `1987 -> U+...` の対応表が入ります。HTML ではアラビア数字の `"1987"` にそのまま font を当てるのではなく、対応するコードポイント文字を出して `font-family` を適用します。

```html
<link rel="stylesheet" href="/fonts/Cistercian.css" />
<span class="cistercian">&#xF07C3;</span>
```

値ごとのコードポイントは `dist/font/manifest.json` を参照してください。

## Deploy

Vercel 想定です。`api/` 配下の関数と `index.html` をそのままデプロイします。

```bash
npm install
npx vercel
npx vercel --prod
```

GitHub リポジトリを Vercel に import しても動きます。初回はプロジェクトを link したあと、以後は push ごとに preview / production deploy できます。

## Example

```html
<img src="/1987" alt="1987" />
```

## Demo

ルートの [`/index.html`](./index.html) で API を試せます。
