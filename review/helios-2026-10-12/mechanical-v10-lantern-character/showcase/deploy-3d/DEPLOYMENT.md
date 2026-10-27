# Helios showcase deployment

- Site: https://3d.adidesign.org
- Cloudflare Worker: `helios-3d` (`9652c190246e4496bac173e8603583c1`).
- Source: `adiind/Porfolio`, branch `main`, this directory.
- Automatic build trigger: `5b983962-6457-4dc3-8aec-666ab7f08057`.
- Cloudflare runs the deploy command in this directory; the static files require no compilation.
- The existing portfolio GitHub connection and build credential are reused. No local Wrangler commands are required or permitted.

## Verified setup exception — 2026-10-27

The earlier direct upload left an undeployed Worker with no GitHub trigger and no custom domain. The account connection works. Added a production trigger using the existing repository integration, restricted to main and this showcase directory. The existing HTML, model payload, and domain configuration are preserved byte-for-byte. Production publication and domain verification are pending the checked PR merge.
