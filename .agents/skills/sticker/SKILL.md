---
name: sticker
description: Use when Adi requests a sticker in the portfolio sticker series, including holo, matte, or clean finishes from supplied artwork or an official logo.
---

# Sticker series

Render the supplied design using a retained sticker finish anchor.

1. Resolve the source image to an absolute path and inspect it.
2. Pick the finish from the request: `holo`, `matte`, or `clean`. Default to `holo`.
3. Resolve the anchor to `/Users/adi/Portfolio/Porfolio/.agents/skills/sticker/assets/anchors/<finish>.png`. If that file does not exist, stop and report the missing absolute path. Do not substitute another finish or generate an anchor. Only `holo.png` is currently supplied; matte and clean require their own anchors later.
4. Inspect the anchor, then always call the built-in image tool with exactly these two references, in this order:

   ```text
   referenced_image_paths = [SOURCE absolute path, ANCHOR absolute path]
   transparent_background = true
   ```

   Use this prompt frame verbatim, followed by the requested subject and finish:

   > Image 1 is the design to render. Image 2 is the style reference only: match its die-cut cream border, thickness, holo or matte finish, wear, glare, and outline. Don't copy Image 2's content.

   Include these constraints in the image prompt:
   - For logos, keep the real shapes and letterforms from the official file exactly. Don't redraw type. Use the official source file; if it is missing, stop and report that it is needed.
   - No text that isn't in the source, and no human faces.
   - Make the background genuinely transparent and preserve the generated alpha channel.

5. Save the generated PNG to `/Users/adi/Portfolio/Porfolio/review/stickers/<name>-<finish>-vN.png`, using a descriptive lowercase hyphenated name. Choose the next unused positive integer `N` for that name and finish. Copy without overwriting; if the destination exists, choose the next unused version. Never overwrite earlier outputs.
6. Inspect the saved result for source fidelity, finish, border, unwanted text or faces, and actual transparency. Show it inline and report its absolute saved path.

The holo anchor is a byte-for-byte copy of `/Users/adi/Portfolio/Porfolio/review/stickers/pilot/self-b-r4.png`. Its Self artwork is a style reference only, never content to transfer to another sticker.
