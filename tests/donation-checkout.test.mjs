import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const checkoutSource = await readFile(resolve(root, 'donation-checkout.js'), 'utf8');
const window = {};
vm.runInNewContext(checkoutSource, { window, URL });
const validate = value => window.AURORA_DONATION_CHECKOUT.verifiedCheckoutLink(value);

test('null and malformed payment config stays unavailable', () => {
  for (const value of [null, undefined, '', 'not a URL']) assert.equal(validate(value), null);
});

test('rejects unsafe, non-creator and ambiguous payment URLs', () => {
  for (const value of [
    'http://buymeacoffee.com/creator',
    'https://buymeacoffee.com',
    'https://buymeacoffee.com.attacker.example/creator',
    'https://attacker.example/buymeacoffee.com/creator',
    'https://user:password@buymeacoffee.com/creator',
    'https://buymeacoffee.com:8443/creator',
    'https://buymeacoffee.com/creator?redirect=https://attacker.example',
    'https://buymeacoffee.com/creator#checkout'
  ]) assert.equal(validate(value), null, `must reject ${value}`);
});

test('accepts an HTTPS public creator profile only', () => {
  assert.equal(validate('https://buymeacoffee.com/creator'), 'https://buymeacoffee.com/creator');
  assert.equal(validate('https://www.buymeacoffee.com/creator'), 'https://www.buymeacoffee.com/creator');
});
