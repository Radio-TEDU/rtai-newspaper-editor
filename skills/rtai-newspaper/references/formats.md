# Formats and commands

Only this skill folder and Node.js 22.12+ are required. No `npm install` or editor is needed.

```sh
node scripts/newspaper.mjs demo --output output/example.html
node scripts/newspaper.mjs new --input issue.json --output output/newspaper.html
node scripts/newspaper.mjs check --input output/newspaper.html
node scripts/newspaper.mjs unpack --input output/newspaper.html --output output/revision-01
node scripts/newspaper.mjs pack --input output/revision-01/project.json --assets output/revision-01/assets.json --output output/revised.html
```

Run from this skill folder or use its absolute script path. Output paths refer to the working directory. Existing output files/directories are never overwritten.

An issue brief has `name`, `masthead`, `tagline`, `edition`, optional `widthMm`/`heightMm` (defaults 297/420), `articles` and `pages`:

```json
{
  "name": "Sample week", "masthead": "MERCEK", "edition": "Example issue",
  "articles": [{"id":"story-1","title":"A new week","summary":"Short introduction.","body":"Full article.","section":"Campus","image":"media/photo.png","alt":"Photo description","caption":"Caption"}],
  "pages": [{"name":"Cover","type":"cover","articleIds":["story-1"]}]
}
```

Each article may include `url` and `excerpt`. Source/publication status is not required. Images must stay within the brief/assets-mapping directory, including symlink targets. `cover`, `news`, `voices` accept up to two articles, `agenda` up to four. Presets do not fit every text length; adjust custom geometry after opening the generated file.

The HTML contains one `script#rtai-project[type="application/json"]` payload with `format: "rtai-editable-html"`, `version: 1`, `project` and `assets`. Assets have `id`, `type`, `data` (Base64 exactly once per asset). Use the CLI to build/parse this envelope rather than hand-assembling it. The Workshop extracts/validates data without executing supplied HTML. HTML without this payload is unsupported.

100 pages, 500 elements/page, 2000 articles, 1000 media, 20 MB/32 MP per image, 10 MB project model and 100 MB HTML file. PNG/JPEG/WebP/GIF; no SVG/HTML images. MIME/signature checks alone do not prove full image decode; inspect in the browser. GIF prints as a static frame. Text remains in the model when it overflows; fix boxes/font sizes before printing. Rectangular wrapping is supported; automatic text continuation across pages and group transforms are not.
