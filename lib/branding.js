// Resolves per-client branding: the logo fallback chain and the accent
// color palette (light + dark variants). Best effort only, per the
// project's locked decision that a missing or wrong logo is far less
// costly than a wrong client profile field. Nothing here ever throws or
// blocks rendering, it always resolves to something.

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function relativeLuminance(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Text drawn on a tinted accent background flips between a dark and light
// ink variant depending on contrast, so it stays readable whichever accent
// a client ends up with.
export function contrastInk(hex) {
  return relativeLuminance(hex) > 0.42 ? "#14181a" : "#ffffff";
}

// Deterministic, tasteful accent for when no real brand color was found.
// The same hue drives both theme variants so a client's dashboard still
// reads as "their color" regardless of light or dark mode.
function hashedAccent(seed) {
  const hue = hashString(seed || "client") % 360;
  return {
    light: {
      accent: hslToHex(hue, 38, 42),
      accentInk: hslToHex(hue, 45, 26),
      accentSoft: hslToHex(hue, 45, 94),
    },
    dark: {
      accent: hslToHex(hue, 42, 62),
      accentInk: hslToHex(hue, 55, 82),
      accentSoft: hslToHex(hue, 30, 20),
    },
  };
}

// A real brand color, when found, drives the light-mode accent directly,
// with ink/soft variants derived from it, and a lightened variant for dark
// mode so it doesn't go muddy on a dark surface.
function derivedFromHex(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return {
    light: {
      accent: hex,
      accentInk: hslToHex(h, Math.min(sPct + 10, 70), Math.max(lPct - 18, 18)),
      accentSoft: hslToHex(h, Math.min(sPct, 55), 94),
    },
    dark: {
      accent: hslToHex(h, Math.max(sPct - 5, 25), Math.min(lPct + 18, 72)),
      accentInk: hslToHex(h, Math.min(sPct + 15, 75), 84),
      accentSoft: hslToHex(h, Math.max(sPct - 15, 20), 20),
    },
  };
}

export function resolvePalette(branding, seed) {
  const hex = branding && branding.primary_color;
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) return derivedFromHex(hex);
  return hashedAccent(seed);
}

export function monogram(nameOrCompany) {
  const words = (nameOrCompany || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Ordered list of logo candidates to try, best effort, falling through
// silently on failure. The monogram badge is not in this list, it's the
// guaranteed rendering path used once every candidate here has failed or
// none exist at all.
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com",
  "live.com", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me",
  "protonmail.com", "comcast.net", "att.net", "sbcglobal.net", "verizon.net", "cox.net",
]);

export function logoCandidates(branding, confirmationEmail) {
  const candidates = [];
  if (branding && branding.logo_url) candidates.push(branding.logo_url);
  const domain = (confirmationEmail || "").split("@")[1];
  const cleanDomain = domain ? domain.trim().toLowerCase() : "";
  // A personal inbox says nothing about the company, so never show its logo
  // (a Gmail address would otherwise put Google's logo on a client's page).
  if (cleanDomain && !PERSONAL_EMAIL_DOMAINS.has(cleanDomain)) {
    candidates.push(`https://logo.clearbit.com/${cleanDomain}`);
    candidates.push(`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`);
  }
  return candidates;
}
