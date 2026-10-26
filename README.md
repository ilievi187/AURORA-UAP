# AURORA — UAP Bulgaria 🛸

Official website project for **aurorauap.org**.

## Current release
The complete static prototype is packaged as `AURORA-UAP-github-ready.zip` in the project's preparation workspace. It contains a multilingual homepage, demo sightings map and case archive, plus a dedicated **Support AURORA** page with a prominent **red DONATE** button.

Supported interface languages: **Bulgarian, English, German, Russian, Simplified Chinese**.

## Donation safety and banking privacy
- A secure hosted payment provider is required. **It is not possible to charge visitors automatically without authorizing payment.**
- Do **not** commit IBANs, personal identity documents, home addresses, bank statements, card numbers, or Stripe secret API keys.
- Before activating payments, identify and verify the recipient and its legal status, and disclose it clearly to supporters.
- Donations must be associated with a specific, permitted purpose and comply with applicable provider policies and local law.
- The site documents intended uses: field equipment, research, travel, rent/workspace if needed, hosting, software, expert review, education and outreach.
- Create a provider-hosted *choose your amount* EUR Payment Link (after approval), connect the bank account privately to the provider's payout settings, and set the public checkout URL in `payment-config.js`.
- **Until live checkout is configured, the red button must remain disabled and clearly labelled as not accepting payments.**

## Cloudflare Pages
Connect the GitHub repository `ilievi187/AURORA-UAP` as a **Pages** project:
- Production branch: `main`
- Build command: `exit 0`
- Output directory: `.`
- Custom domain: `aurorauap.org` after deployment

## Research accuracy
All sample sightings in the prototype are fictional and explicitly labelled **DEMO**; none are presented as real observations or verified evidence.

## Status
Source package prepared; pending upload of site files and licensed payment-provider setup before public payments can be accepted.
