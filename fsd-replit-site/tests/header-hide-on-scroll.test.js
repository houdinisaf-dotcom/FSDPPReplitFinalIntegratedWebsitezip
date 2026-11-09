import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../src/site-navigation.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/site-navigation.css', import.meta.url), 'utf8');

test('banner hides on scroll down and returns on scroll up', () => {
  assert.match(js, /is-hidden-on-scroll/);
  assert.match(js, /fsd-header-hidden/);
  assert.match(js, /delta > 0/, 'hidden only while scrolling down');
  assert.match(js, /isOpen \|\| y < 120/, 'stays visible near the top and while a menu is open');
  assert.match(css, /html\.fsd-header-hidden \.fsd-navigation-shell\.is-hidden-on-scroll\s*\{[^}]*translateY/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
