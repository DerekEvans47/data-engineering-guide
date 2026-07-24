# Asset Licensing — How We May (and May Not) Use Our AI-Generated Assets

**Purpose.** This is our standing reference for whether we can legally ship the
game's AI-generated assets in a public, commercial release (Android / iOS). If
this question comes up again, start here. It records the governing documents, the
verbatim excerpts, and our summary stance so we don't have to re-derive it.

**Status: verified against primary sources (2026-07-24).** Excerpts below are
quoted verbatim from the archived PDFs in `game/docs/terms-archive/`. One item
remains open — see the checklist at the end.

---

## ⚠️ Read this first

**Neither the author nor Claude is a lawyer.** This is a factual research record,
not legal advice. It quotes the terms accurately; it does not substitute for
professional judgment about how they apply. For a commercial launch, a short
lawyer review of the open item is worthwhile.

*(Correction, 2026-07-24: an earlier version of this file said Google "returns
HTTP 403 (blocks automated access)." That was wrong. The 403s came from **this
development session's own network egress policy**, which blocks Google domains —
not from Google blocking scrapers. The terms were obtained by the author
downloading them directly. Noted so nobody later concludes these documents are
unreachable by automation in general.)*

---

## Governing documents (archived locally)

| Document | Effective / modified | Archived copy |
|---|---|---|
| **Google Terms of Service** | Effective **May 22, 2024** | `terms-archive/2026-07-24_google-terms-of-service_effective-2024-05-22.pdf` |
| **Generative AI Prohibited Use Policy** | Last modified **December 17, 2024** | `terms-archive/2026-07-24_generative-ai-prohibited-use-policy_modified-2024-12-17.pdf` |
| Google Flow Help — "Can I use outputs of these tools for commercial purposes?" | retrieved 2026-07-24 | quoted below |

### ⚠️ Structural point: the "Generative AI Additional Terms" are RETIRED

Google's own notice states:

> *"We updated the Google Terms of Service on May 22, 2024 to cover AI-related
> topics. As of that date, these Generative AI Additional Terms of Service no
> longer apply, unless you're a business partner with a signed agreement that
> references these terms."*

**Implication:** do not go looking for a separate generative-AI terms document —
it no longer governs. The **main Google Terms of Service is the operative
document** for our AI-generated assets, alongside the Prohibited Use Policy.

---

## What we made, and with what

| Asset | Tool | Where in repo |
|-------|------|---------------|
| Music / audio | **Google Flow** | `game/assets/audio/` |
| Art (sprites, maps, relic icons, terrain) | **Google Nano Banana** (Gemini image generation) + our cropping, background & watermark edits, and our composition/layout on the maps | `game/assets/enemies/`, `towers/`, `relics/`, `worlds/` |
| Fonts (Cinzel, MedievalSharp) | Google Fonts — **SIL Open Font License 1.1** | `game/assets/fonts/` — see `OFL.txt` |

Fonts are handled fully in `OFL.txt`. This document covers the **Flow (music) and
Nano Banana (art)** AI-generated assets.

---

## Findings — verbatim excerpts

### 1. Ownership — ✅ CONFIRMED: we own our outputs

Google ToS, under *Content in Google services → Your content*:

> *"Some of our services allow you to generate original content. Google won't
> claim ownership over that content."*

Google ToS, under *Permission to use your content → License*:

> *"Your content remains yours, which means that you retain any intellectual
> property rights that you have in your content."*

Google Flow Help, *"Can I use outputs of these tools for commercial purposes?"*:

> *"The Terms of Service govern how these tools may be used, and must be consulted
> and followed in their entirety. Per those terms: Some of our services allow you
> to generate original content. Google won't claim ownership over that content."*

**Net:** Confirmed at the primary source, and Flow's own help page routes the
commercial question straight back to this same ToS language.

### 2. The license we grant Google — ✅ CONFIRMED: narrow, not a rights grab

Google ToS, *Purpose*:

> *"This license is for the limited purpose of: operating and improving the
> services, which means allowing the services to work as designed and creating new
> features and functionalities… using content you've shared publicly to promote
> the services."*

**Net:** Google takes an operational license, not ownership. Our game assets aren't
shared publicly through a Google service, so even the promotional prong doesn't bite.

### 3. Commercial use — ✅ CONFIRMED permitted (by absence of restriction)

The ToS contains **no prohibition on commercial use of generated output**, and no
royalty or revenue-share obligation. Combined with "Google won't claim ownership,"
commercial distribution of our music and art is permitted.

Note the one restriction that *is* stated, under prohibited activities:

> *"You may not copy, modify, distribute, sell, or lease any part of our services
> or software."*

That covers **Google's services/software** — not the content we generate with them.
Distinct things; our game is the latter.

### 4. Restriction we must not trip — ✅ CONFIRMED (does not affect us)

Google ToS lists among abusive activities:

> *"using AI-generated content from our services to develop machine learning models
> or related AI technology"*

**Net:** We ship a tower-defense game; we do not train models on the outputs. Clear.
**Worth remembering** if anyone ever proposes reusing these assets as training data.

### 5. Watermarks — mechanics differ by asset type

Two distinct kinds, and they do **not** apply the same way:

- **Visible watermark** — a mark on pixels (Veo logo on video frames, Gemini/sparkle
  mark on images). **A pure audio file has none** — no pixels to stamp.
- **Invisible SynthID** — imperceptible signal inside the content; present for images,
  video, and audio. For audio it is embedded via the spectrogram, is **inaudible**, and
  survives compression/noise/speed changes. It only flags content as AI-generated; it
  does **not** affect ownership or usage rights.

| Asset | Visible mark | SynthID | What we did / need to do |
|---|---|---|---|
| **Art** (Nano Banana) | Yes — Gemini/sparkle | Yes | We cropped/removed the visible mark; SynthID remains, harmless |
| **Music** (Flow) | **None exists for audio** | Yes (waveform) | Nothing to remove; inaudible & harmless |

**On our art watermark edits:** neither archived document prohibits removing a
visible watermark from **your own** generated content. The Prohibited Use Policy's
concern is deception (§4), not watermark removal as such. We removed Google's own
mark from our own asset — not a third party's mark to bypass their copyright.
*Assessment: not prohibited by the governing documents we hold.*

### 6. Prohibited Use Policy — ✅ CONFIRMED we comply

The policy bars: illegal/dangerous activity, CSAE, violent extremism, NCII, self-harm,
IP/privacy violations, non-consensual tracking, security compromise, spam/malware,
filter circumvention, hate speech, harassment, violence, sexually explicit content,
fraud, impersonation, and misleading claims. **A fantasy tower-defense game engages
none of these.**

One clause is directly relevant to how we *describe* the game:

> *"Misrepresenting the provenance of generated content by claiming it was created
> solely by a human, in order to deceive."* (§4e)

**Net:** We must not market the game as entirely human-made art/music. Our honest
provenance records already satisfy this — keep store listings consistent with them.

### 7. Warranties & liability — ✅ CONFIRMED: this is the real residual risk

Google ToS, *Warranty disclaimer*:

> *"TO THE EXTENT ALLOWED BY APPLICABLE LAW, WE PROVIDE OUR SERVICES "AS IS" WITHOUT
> ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND **NON-INFRINGEMENT**."*

Liability is capped:

> *"…limited to the greater of (1) $200 or (2) the fees paid to use the relevant
> services in the 12 months before the dispute"*

And indemnity runs *toward* Google, not from it:

> *"If you're a business user or organization: To the extent allowed by applicable
> law, you'll indemnify Google … for any third-party legal proceedings … arising out
> of or relating to your unlawful use of the services or violation of these terms."*

**Net — the honest bottom line on risk:** Google expressly disclaims any warranty of
**non-infringement**. If a generated asset happens to resemble third-party IP, that
exposure is **ours**, Google's liability is capped at ~$200, and as a business user we
would owe Google indemnity rather than the reverse. Low probability, but this is the
one risk that genuinely does not go away, and it is now confirmed verbatim rather than
inferred.

### 8. Timing — which terms govern

The ToS grants ownership as a standing statement ("Your content remains yours"), not a
per-publication permission, so rights attach at generation and later term changes apply
going forward. **Insurance already in place:** the archived PDFs in `terms-archive/`
are dated copies of the terms as they stood on 2026-07-24. Re-archive if we generate
significant new assets later.

---

## Our summary of findings — the stance

Verified against the archived primary sources:

1. **We own** the Flow music and Nano Banana art as against Google. *(Confirmed)*
2. **We may ship them commercially**, royalty-free, in a paid/monetized store app.
   No commercial restriction exists in the governing terms. *(Confirmed)*
3. **Google's license to our content is narrow** — operating/improving services. *(Confirmed)*
4. **Removing the visible watermark from our own art is not prohibited** by the
   governing documents. *(Assessment, no contrary provision found)*
5. **Our content violates none of the prohibited uses** — but we must not claim the
   assets were made solely by humans. *(Confirmed)*
6. **Residual risk is third-party-IP resemblance**, expressly unwarranted by Google
   (non-infringement disclaimed), liability capped at ~$200, indemnity flowing to
   Google. *(Confirmed)*
7. **Fonts** are cleanly handled under OFL 1.1 — ship `OFL.txt` via an in-app
   acknowledgements screen.

**Confidence: high** on ownership, commercial use, and prohibited-use compliance —
these are now verbatim from primary sources.

### Still open (one item)

**GA vs. preview/Pre-GA.** Secondary sources suggested Google's *Pre-GA Offerings
Terms* prohibit commercial use of preview products. Two things reduce this concern:
those Pre-GA terms are a **Google Cloud / Vertex AI** construct, which is a different
product surface from consumer Flow; and **Flow's own help page answers the commercial
question by pointing at the main ToS**, which permits it. Neither archived document
mentions a preview restriction. *Assessment: low risk, probably a conflation of Google
Cloud terms with consumer Flow — but not formally closed,* since we have not read
Flow/Labs-specific terms.

---

## Remaining checklist before commercial launch

- [ ] **Flow / Labs-specific terms:** open Flow → Terms link, confirm no preview /
      Pre-GA commercial restriction applies to the model used. *(Only open legal item.)*
- [ ] Note whether the Flow model used was labeled "preview"/"experimental."
- [x] ~~Archive dated copies of the governing terms~~ — done, `terms-archive/`.
- [x] ~~Confirm ownership and commercial-use rights at primary source~~ — done.
- [ ] **Fonts:** surface `OFL.txt` via an in-app Licenses/Acknowledgements screen.
- [ ] **Privacy policy** published (required by both stores).
- [ ] **Store listing:** keep AI provenance honest — do not claim solely-human authorship.
- [ ] For a paid launch, a short lawyer review of the residual-IP-risk position.

---

*Last verified 2026-07-24 against archived primary sources. Re-verify if Google's
terms change or the shipped asset set changes.*
