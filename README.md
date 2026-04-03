# Cistercian SVG API

`0..9999` の整数を受け取り、シトー修道士数字の SVG を返す API です。

## Endpoint

`GET /api/cistercian?value=1987`

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
npm run dev
```

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
<img src="/api/cistercian?value=1987" alt="1987" />
```

## Demo

ルートの [`/index.html`](./index.html) で API を試せます。
