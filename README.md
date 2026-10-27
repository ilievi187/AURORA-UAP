# AURORA — UAP Bulgaria 🛸

Multilingual static website for the independent AURORA UAP initiative.
Planned domain: **aurorauap.org**. Preview release: public design demo.

## Features
- Five interface languages: Bulgarian, English, German, Russian and Simplified Chinese.
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

## Cloudflare Pages (production target)
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
