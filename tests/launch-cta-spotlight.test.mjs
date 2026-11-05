import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("index.html"),report=read("report.html"),donate=read("donate.html");
const css=read("launch-cta-spotlight.css");

test("front-page report and support actions are visible, English, accessible and navigate to real pages",()=>{
 assert.match(home,/class="button button-secondary hero-report-cta"[^>]*>Report a Sighting/);
 assert.match(home,/class="button button-secondary hero-donate-cta"[^>]*>Support AURORA/);
 assert.match(home,/class="nav-support" data-portal-nav="support"/);
 assert.match(home,/class="nav-donate nav-support"/);
 assert.match(home,/class="nav-report"/);
 assert.match(home,/href="\/report\.html"/);
 assert.match(home,/href="\/donate\.html"/);
 assert.match(home,/launch-cta-spotlight\.css/);
 assert.ok(home.lastIndexOf("launch-cta-spotlight.css")>home.lastIndexOf("home-portal.css"),"spotlights must override final editorial CSS");
 assert.match(css,/\.silence-hero \.silence-actions\{[\s\S]*?opacity:1!important/);
 assert.match(css,/\.hero-report-cta/);
 assert.match(css,/\.hero-donate-cta/);
 assert.match(css,/\.portal-card\[data-portal="report"\]/);
 assert.match(css,/\.portal-card\[data-portal="support"\]/);
});

test("support page becomes bright but disabled payments remain disabled until a verified link exists",()=>{
 assert.match(donate,/launch-cta-spotlight\.css/);
 assert.match(donate,/id="donateCheckout" disabled/);
 assert.match(donate,/id="paymentStatus" role="status"/);
 assert.match(donate,/class="donate-trust"/);
 assert.match(donate,/class="donate-secondary-link" href="\/archive\.html"/);
 const paymentConfig=read("payment-config.js");
 assert.match(paymentConfig,/AURORA_PAYMENT_LINK\s*=\s*null/);
 const checkout=read("donate.js");
 assert.match(checkout,/verifiedCheckoutLink/);
 assert.match(checkout,/if\(link\)\{/);
 assert.match(checkout,/checkout\.disabled=false/);
 assert.match(checkout,/if\(link\)[\s\S]*?checkout\.disabled=false/);
 assert.match(css,/#donateCheckout:disabled/);
});

test("report page CTA leads into the existing verified-email, Turnstile, private-review form",()=>{
 assert.match(report,/launch-cta-spotlight\.css/);
 assert.match(report,/class="report-hero-cta" href="#observationForm"/);
 assert.match(report,/id="observationForm" novalidate/);
 assert.match(report,/class="report-hero-highlights"/);
 assert.match(report,/id="reportAuth"[^>]+hidden/);
 assert.match(report,/id="activationControls" hidden/);
 assert.match(report,/id="adultConfirm" required/);
 assert.match(report,/id="consent"/);
 assert.match(report,/id="turnstileMount"/);
 assert.match(report,/id="sendReport" disabled/);
 assert.match(report,/id="reportStatus" role="status"/);
 assert.match(css,/#reportStatus\.ready/);
 assert.match(css,/#reportStatus\.disabled/);
 assert.match(css,/#sendReport:disabled/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
