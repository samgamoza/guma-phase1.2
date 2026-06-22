/**
 * Fix double-encoded UTF-8 in all 18 HTML templates.
 *
 * The PowerShell script that injected {{PALETTE_CSS}} read each UTF-8 file
 * as Windows-1252, then wrote back as UTF-8. This doubled-encoded every
 * non-ASCII character:  — (U+2014) became â€"  ★ became â˜…  ₱ became â‚±
 *
 * This script reverses that: for each Unicode char that maps to a single
 * Windows-1252 byte, we collect that byte, then re-decode the full buffer
 * as UTF-8 to recover the original content.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TMPL_DIR = join(__dirname, 'apps/generator/src/templates/html')

// Reverse Windows-1252 map: Unicode codepoint → byte value (0x80–0x9F range only)
// Everything else (0x00–0x7F and 0xA0–0xFF) maps directly: byte = codepoint
const WIN1252_REV = new Map([
  [0x20AC, 0x80], // €
  [0x201A, 0x82], // ‚
  [0x0192, 0x83], // ƒ
  [0x201E, 0x84], // „
  [0x2026, 0x85], // …
  [0x2020, 0x86], // †
  [0x2021, 0x87], // ‡
  [0x02C6, 0x88], // ˆ
  [0x2030, 0x89], // ‰
  [0x0160, 0x8A], // Š
  [0x2039, 0x8B], // ‹
  [0x0152, 0x8C], // Œ
  [0x017D, 0x8E], // Ž
  [0x2018, 0x91], // '
  [0x2019, 0x92], // '
  [0x201C, 0x93], // "
  [0x201D, 0x94], // "
  [0x2022, 0x95], // •
  [0x2013, 0x96], // –
  [0x2014, 0x97], // —
  [0x02DC, 0x98], // ˜
  [0x2122, 0x99], // ™
  [0x0161, 0x9A], // š
  [0x203A, 0x9B], // ›
  [0x0153, 0x9C], // œ
  [0x017E, 0x9E], // ž
  [0x0178, 0x9F], // Ÿ
])

function reverseDoubleEncoding(content) {
  // Strip UTF-8 BOM added by PowerShell
  const text = content.startsWith('﻿') ? content.slice(1) : content

  const bytes = []
  for (const char of text) {
    const cp = char.codePointAt(0)

    if (WIN1252_REV.has(cp)) {
      // Special Windows-1252 character — use its original byte value
      bytes.push(WIN1252_REV.get(cp))
    } else if (cp <= 0xFF) {
      // ASCII or Latin-1 supplement — byte = codepoint
      bytes.push(cp)
    } else {
      // Code point > 0xFF cannot come from a single Windows-1252 byte.
      // This char was either already correct Unicode or is an emoji we injected.
      // Keep it as-is (write its UTF-8 bytes).
      const buf = Buffer.from(char, 'utf8')
      for (const b of buf) bytes.push(b)
    }
  }

  // Re-decode as UTF-8 — gives us the original content
  return Buffer.from(bytes).toString('utf8')
}

const files = readdirSync(TMPL_DIR).filter(f => f.endsWith('.html'))
let changed = 0

for (const file of files) {
  const path = join(TMPL_DIR, file)
  const original = readFileSync(path, 'utf8')
  const fixed = reverseDoubleEncoding(original)

  const originalClean = original.startsWith('﻿') ? original.slice(1) : original
  if (fixed !== originalClean) {
    // Write without BOM — proper UTF-8
    writeFileSync(path, fixed, { encoding: 'utf8' })
    console.log(`✓ Fixed: ${file}`)
    changed++
  } else {
    console.log(`  OK (unchanged): ${file}`)
  }
}

console.log(`\nDone. Fixed ${changed}/${files.length} template files.`)
