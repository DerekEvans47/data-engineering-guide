# Asset Provenance & Licensing

This file records where each part of the game came from and the licensing
obligations that attach to it. It exists so that, before any public release
(App Store / Google Play), nothing gets missed.

**This is a factual record, not legal advice.** For a commercial launch, have
a lawyer confirm the two Google-terms items flagged below.

> **Detailed licensing research** (sources, excerpts, and our summarized stance
> on how we may use the Flow music and Nano Banana art) lives with the game:
> [`game/docs/ASSET-LICENSING.md`](../game/docs/ASSET-LICENSING.md). That file is
> the authoritative record if the "can we ship the AI assets?" question comes up
> again; this file is the higher-level provenance + checklist.

## Provenance

| Component | Source | Human contribution |
|-----------|--------|--------------------|
| **Music / audio** (`game/assets/audio/`) | Generated with **Google Flow** | Selection, integration into the game |
| **Code** (`game/*.js`, `game/*.css`, `game/*.json`, `index.html`, `learn/`, `guide/`) | Primarily written with **Claude Code**, with edits by the author | Direction, editing, integration — human-authored work |
| **Art** (`game/assets/enemies/`, `game/assets/towers/`, `game/assets/relics/`, `game/assets/worlds/`, map backgrounds) | Generated with **Google Nano Banana** | Cropping, background removal, watermark removal, and — for the maps — the author's composition, layout, selection, and placement of assets |
| **Fonts** (`game/assets/fonts/`) | **Google Fonts**: Cinzel (Natanael Gama / The Cinzel Project Authors), MedievalSharp (wmk69) | Selection only |

## Copyright status (plain-language summary)

- **Code** and the **composed maps** (the author's arrangement/layout of assets)
  are human-authored and are the most strongly protected parts of the project.
  They are proprietary — all rights reserved. No open-source license is
  published for them.
- **Raw individual AI assets** (a single generated sprite or music track) have
  weak-to-no copyright protection under current US guidance, because pure AI
  output lacks human authorship. This is the project's weakest link if an asset
  is extracted from a shipped build — but it does not permit anyone to clone the
  game as a whole, because the code and map compositions are protected.
- **Fonts** are third-party and remain under their own license (OFL, see below).

## Licensing obligations for public release

### 1. Fonts — SIL Open Font License 1.1 (REQUIRED)

Both bundled fonts are OFL 1.1. The OFL explicitly permits embedding them in an
app (including a paid, closed-source app). On **distribution**, two conditions apply:

- [ ] Ship the OFL license text + copyright notices with the app.
      Source of truth: `game/assets/fonts/OFL.txt`. In a mobile build, surface
      this via a **Licenses / Acknowledgements** screen (both stores expect
      third-party license disclosure) or a bundled license file.
- [x] Do not sell the fonts on their own (we don't — they're embedded only).
- [x] Do not use the Reserved Font Names ("Cinzel", "MedievalSharp") for any
      modified/renamed font (we don't modify the fonts).

### 2. Google Flow (music) + Nano Banana (art) — ✅ VERIFIED 2026-07-24

Confirmed against the primary Google Terms of Service (effective 2024-05-22) and
the Generative AI Prohibited Use Policy, both archived in
`game/docs/terms-archive/`. Full excerpts and analysis:
[`game/docs/ASSET-LICENSING.md`](../game/docs/ASSET-LICENSING.md).

- [x] **Ownership** — *"Google won't claim ownership over that content."*
- [x] **Commercial use** — permitted; no commercial restriction or royalty in the terms.
- [x] **Watermark removal** (art) — not prohibited by the governing documents.
- [x] **Prohibited use** — our content complies.
- [x] **Dated terms archived** as evidence of what applied.
- [ ] **Only open item:** confirm no **preview / Pre-GA** commercial restriction
      applies to the specific Flow model used (check Flow's in-app Terms link).
      Assessed low risk — Pre-GA terms are a Google Cloud construct, and Flow's own
      help page routes the commercial question to the main ToS.

> **Note:** the *Generative AI Additional Terms* are **retired** — folded into the
> main ToS on 2024-05-22. Don't go looking for them.

**Residual risk (confirmed, unavoidable):** Google disclaims any warranty of
**non-infringement**, caps liability at ~$200, and requires business users to
indemnify Google. If a generated asset resembles third-party IP, that exposure is
ours.

### 4. Store requirements (REQUIRED)

- [ ] Privacy policy published (required by both App Store and Google Play).
- [ ] AI-generated-content disclosure, if/when the target store requires it.
- [ ] **Do not market the assets as solely human-made** — the Prohibited Use Policy
      §4e bars misrepresenting generated content's provenance in order to deceive.

## Protecting against clones

- Wholesale cloning or reskinning the game infringes the protected code and map
  compositions — actionable via **DMCA takedown** and each store's copyright
  complaint process.
- Optional hardening (not launch blockers): code obfuscation, and keeping
  progression/economy logic server-side so it can't be trivially copied from an
  extracted build.
