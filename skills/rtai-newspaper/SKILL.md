---
name: rtai-newspaper
description: Create standalone, editable newspaper HTML from local articles, images and a design brief, or revise a newspaper HTML while preserving manual edits. Works without the Gazette Workshop app; app development is a separate task.
---

# Editable newspaper production

Deliver one self-contained `.html` that reads offline in a browser and opens as editable pages, articles, text, images and shapes in RTAI Gazete Atölyesi. This skill folder is independent: it needs Node.js 22.12+ but no editor checkout, npm packages, API key, account server or publication endpoint.

Run `node <this-skill>/scripts/newspaper.mjs help` to see the interface. Resolve paths relative to this skill's location. Read [formats and commands](references/formats.md) for brief input, custom layout and revision.

## New issue

- Inspect the user's local articles/images and design request. Preserve facts; clearly label mock content. Use supplied images or editable placeholders; do not invent source links, quotes or image provenance.
- Use `new` with an issue brief for cover/news/agenda/voices presets. For a custom layout, generate a demo, `unpack` it, then edit its project model and `pack` it. See [the model](references/model.md) when preparing custom elements.
- Keep full articles separate from layout boxes. Give pages/articles/elements stable identifiers and link relevant headline/deck/body boxes through `articleId` and optional `articleField`. An excerpt may be shorter than the full article.
- Keep media in local files. Map files to `assetId`; the HTML embeds each image once and reuses it. Use safe layout ordinarily, image `wrapText` for deliberate wrapping, and `allowOverlap` only for deliberate layering.
- Write to the user's output folder using new filenames. The CLI refuses overwrites. Run `check`, then open the HTML and inspect every page, article dialog and text-overflow status. Fix overflow before delivery. The reader includes a PDF/print button using the modeled physical page size.

## Revise

Use the latest HTML exported from the editor, unpack into a new folder, and change only requested pages/articles/elements. Preserve identifiers, untouched pages, media mappings and manual geometry. Repack to a new HTML and compare untouched data with the original. Account for all linked boxes when changing a shared article.

Return the output path, page count and actual checks/limitations. Tell the user to choose **Dosyadan gazete ekle** in the Workshop and export a new HTML after editing. Ordinary HTML without the versioned editing payload cannot be converted into editable layout. Do not publish/upload to ERP or alter editor source as part of newspaper production; publishing is a separate, later step.
