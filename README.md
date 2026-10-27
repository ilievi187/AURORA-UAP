# AURORA — UAP Bulgaria 🛸

Multilingual static website for the independent AURORA UAP initiative.
Domain: **aurorauap.org** on Cloudflare Pages. Current release: public design preview.

## Mission Control V1.2 — interactive research workflow (2026-10-27)
- New **Mission Control** section linked from desktop, mobile and footer navigation.
- Four keyboard-accessible research tabs: Document → Verify → Analyze → Conclude. Each changes the explanatory checklist and phase visualization; Next cycles through all phases.
- Procedurally animated orbital dashboard and radar sweep over the existing map, with accessibility-safe reduced-motion behavior.
- Localized Mission Control UX for Bulgarian, English, German, Russian and Simplified Chinese; English fallback is used for the 13 explicitly marked preview locales.
- Three **DEMO case** shortcuts open the same existing example-case dialog, maintaining synthetic-case disclosures.
- Cross-browser automation exercises navigation, stage changes, keyboard controls, language switching, mobile layout, sample cases and existing map filters.
- **Not real-time telemetry or report processing:** displays are educational illustrations, not real detected events. The report form still only saves drafts locally; no upload or email delivery is connected.

## JARVIS-style HUD update (2026-10-27)
- **Two-step entrance required on every homepage visit:** select from the language cards and then press the separately translated **Continue** button. A saved language preselects the card but never silently skips the gateway.
- The welcome scene and homepage now display real animated 2D Canvas radar sweeps, arcs, star-like signal particles, scan-line layers, instrument readouts and pointer parallax. These are **artistic interface effects**, not live UFO detections.
- Motion is rate-limited and paused when the tab is hidden; reduced-motion accessibility preference disables continuous animation.
- Chromium end-to-end tests verify the actual entry flow on desktop/mobile and drawn Canvas pixels, alongside the lightweight static CI suite.
- There is no change to the privacy posture: report submissions remain local drafts, reports remain labelled DEMO and payment processing remains inactive.

## AURORA cinematic V1 — 2026-10-27
This design-first release adds an original cinematic dark-science theme inspired by immersive motion-design websites (without copying a third-party page), an accessible first-visit language gateway, persistent language selection, reduced-motion support, scroll reveal/progress effects, redesigned research panels, and a matching donation page.

**Language coverage:** Bulgarian, English, German, Russian and Simplified Chinese retain the original full translated prototype. French, Spanish, Italian, Portuguese, Turkish, Romanian, Greek, Serbian, Ukrainian, Polish, Arabic, Japanese and Korean offer preview translations of the entry/hero/navigation with **English fallback** in other sections. The UI labels these as preview, not as full localization. Further translated content, RTL review and specialist terminology review are still required before the public release.

**Important:** Report submission, email delivery and evidence uploads are NOT implemented in V1. Report forms still store a local draft only. No real reports or personal data are collected on this static site. The map/archive still contain labelled synthetic demo cases. Payments remain inactive without a verified Buy Me a Coffee profile link. This build remains noindex while features and privacy disclosures are built out.

**Deployment:** Cloudflare Pages is connected to the `main` branch. When the V1 branch is merged after CI validation, Pages automatically starts a production deployment. Verify at `https://aurora-uap.pages.dev/` and `https://aurorauap.org/` when Cloudflare reports success.

**Testing:** `node --test tests/aurora-v1.test.mjs` (Node.js 22); GitHub Actions runs the same smoke suite on PRs.

## Features
- Five complete prototype locales plus 13 preview locales with explicit English fallback (see V1 notes).
- Responsive sci-fi homepage, illustrated research sections, demo sightings map and demo case archive.
- Local-only draft report form. **No data is submitted to a server.**
- Support page explaining intended spending on equipment, expeditions, workspace, technology and expert review.
- Visible red **❤️ ДАРИ** buttons. When no verified payment URL is set, clicking shows the "not yet active" notice rather than charging anyone.

## Donations — Buy Me a Coffee
The payment service has not yet been connected.
After the owner finishes Buy Me a Coffee registration and verification:
1. Confirm the permitted use of the account for this initiative and disclose the recipient's name/status and intended use of funds.
2. Set the **public** profile link in `payment-config.js`:
   `window.AURORA_PAYMENT_LINK = "https://buymeacoffee.com/YOUR_PROFILE";`
3. Test the redirect and review the provider's fee, receipt and refund policies.

Never put private IBANs, identity documents, bank statements, account tokens or payment secrets in this public repository. Donations always require explicit donor authorization on the hosted provider page. AURORA is not represented as a registered charitable organization.

## Cloudflare Pages (connected)
Connect GitHub repository `ilievi187/AURORA-UAP` to Cloudflare Pages:
- Framework preset: None / Static HTML
- Production branch: `main`
- Build command: none (or `exit 0`)
- Build output directory: `.`
- Custom domain: `aurorauap.org` after the initial Pages deployment

## GitHub Pages (optional design preview)
A GitHub Actions workflow in `.github/workflows/pages.yml` deploys static files when GitHub Pages is enabled with **Settings → Pages → Source: GitHub Actions**. The preview URL will be `https://ilievi187.github.io/AURORA-UAP/` once deployment succeeds.

## Prototype-only functionality
All sighting examples are fictional and marked **DEMO**. No live sightings, verified evidence, accounts, report submissions, payment processing or private data storage are active yet. The pages use `noindex` until public launch.
