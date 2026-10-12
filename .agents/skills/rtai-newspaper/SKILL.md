---
name: rtai-newspaper
description: Create an editable newspaper package for rtai-newspaper-editor from local articles, images and design instructions, or revise selected pages in an exported project while preserving manual edits. Use for newspaper production; app feature development is a separate task.
---

# RTAI gazete üretimi

Produce a `.rtai.zip` file that the web editor opens as editable text/image/shape elements and independent articles. The model is `src/model.ts`; validation is `src/validation.ts`. Find the project root from these files, not a machine-specific absolute path. Run tools from that root after dependencies are installed.

Read [the terminal workflow](../../../docs/TERMINAL-WORKFLOW.md) for input formats, commands, supported layout types and package limits. Use `npm run issue -- help` to confirm the CLI interface. No GPT API key or embedded AI connection is needed; this skill guides the user's existing Codex session.

## New issue

- Inspect the provided articles, images and design brief. Preserve factual content; distinguish mock content from actual news. Use provided/local images, or leave an explicit editable placeholder if none was supplied. Do not invent quotes, dates, source links or image provenance.
- Start with an issue brief JSON and `new` for cover/news/agenda/voices presets. For a custom layout, generate complete `Project` JSON using the current model and use `pack`; begin from a generated/unpacked example to obtain all required fields.
- Keep article content separate from design boxes. Give each article and element a stable, unique identifier. Link headline/deck/body elements through `articleId` and, when appropriate, `articleField`; the page excerpt may be shorter than the full article.
- Keep images in files, mapped to `assetId`. Do not embed repeated Base64 in project JSON. Media paths are relative to the input directory and stay inside it.
- Use `layoutMode: "safe"` for ordinary pages. Set `wrapText` on an image only when text should flow around it. Use `allowOverlap` only for intentional design layering; do not use it merely to silence a layout problem. Respect the page bounds and leave readable spacing.
- Create output in a user-designated local directory, normally `.local/issues/<issue-name>/`. Choose a new output name; the CLI refuses to overwrite existing files. Run `check` and then the browser verification command described in the workflow. Inspect the generated preview/PDF when layout matters; repair overflow before delivery.

## Revise an existing issue

- Use the latest exported `.rtai.zip`, not an earlier generated draft. Unpack into a new directory. Preserve the original package as a backup.
- Inspect `project.json` and `assets.json`. Modify only the requested articles/pages/elements; preserve identifiers, untouched pages, manual edits, image mappings and dimensions. Avoid regenerating the whole issue unless asked.
- Repack to a new file, validate it, and compare untouched pages/articles with the original. If the request changes shared article text, account for every linked element without silently changing their geometry.

Deliver the package path, page count, changes and any actual remaining layout limitations. Explain how to open it with **Paket aç**, edit it, and export a fresh package. Do not commit/push, publish the site, modify the reference HTML, or clear browser storage as part of newspaper production unless explicitly requested.
