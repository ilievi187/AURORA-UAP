# AURORA — pinned Chromium browser runner (4 Nov 2026)

The PR #152 build uncovered an independent GitHub Actions environment change: six browser checks failed during Playwright's browser installation, BEFORE running a single test. The runner resolved ubuntu-latest as ubuntu26.04-x64, and the pinned Playwright 1.56.1 installer reported:

ERROR: Playwright does not support chromium-headless-shell on ubuntu26.04-x64

This was NOT a Turnstile code failure. The local Chromium regression passed 43/43.

To make browser CI deterministic while the pinned Playwright version is in use, the repository now pins all 11 browser-dependent jobs that invoke Playwright headless-shell installation to runs-on: ubuntu-24.04. Non-browser jobs remain on ubuntu-latest.

Revisit this pin only after updating Playwright and confirming its support for the newer runner OS. Check green browser test results in GitHub Actions before merging. Do not disable the browser jobs or interpret a failure to install Chromium as passing the browser tests.
