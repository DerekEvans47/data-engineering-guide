# Asset Licensing — How We May (and May Not) Use Our AI-Generated Assets

**Purpose.** This is our standing reference for whether we can legally ship the
game's AI-generated assets in a public, commercial release (Android / iOS). If
this question comes up again, start here. It records the sources, the supporting
excerpts, and our summary stance so we don't have to re-derive it each time.

---

## ⚠️ Read this first — two honest limits

1. **Neither the author nor Claude is a lawyer.** This is a factual research
   record, not legal advice. Before a commercial launch, confirm against the
   primary Google terms (while logged into the account that generated the
   assets) and, for anything high-stakes, have a lawyer review it.

2. **Evidence quality — these are secondary sources.** Google returns
   **HTTP 403 (blocks automated access)** on `policies.google.com` and
   `support.google.com`, so the excerpts below are **as reported by Google help
   pages and reputable secondary summaries, not verbatim text we pulled from
   Google's primary pages.** Confirming the wording on the primary pages, logged
   in, is an open action item (see the checklist at the end). The findings are
   consistent across multiple independent sources, which is why we're confident
   enough to act on them — but "confident" is not "verified verbatim."

---

## What we made, and with what

| Asset | Tool | Where in repo |
|-------|------|---------------|
| Music / audio | **Google Flow** (Veo/Imagen-family generation) | `game/assets/audio/` |
| Art (sprites, maps, relic icons, terrain) | **Google Nano Banana** (Gemini image generation) + our cropping, background & watermark edits, and our composition/layout on the maps | `game/assets/enemies/`, `towers/`, `relics/`, `worlds/`, reference art |
| Fonts (Cinzel, MedievalSharp) | Google Fonts — **SIL Open Font License 1.1** | `game/assets/fonts/` — see `game/assets/fonts/OFL.txt` |

Fonts are handled separately and fully in `OFL.txt`; this document is about the
**Flow (music) and Nano Banana (art)** AI-generated assets.

---

## Sources

- Get started with Google Flow — Google Flow Help
  <https://support.google.com/flow/answer/16353333>
- Manage your data in Google Flow — Google Labs Help
  <https://support.google.com/labs/answer/17025472>
- Google Generative AI Prohibited Use Policy (referenced by the Flow help page)
  <https://policies.google.com/terms/generative-ai/use-policy>
- Gemini Output Ownership & Commercial Rights 2026 — Terms.Law
  <https://terms.law/ai-output-rights/gemini/>
- Can You Use Google Gemini Outputs Commercially? — Terms.Law
  <https://terms.law/forum/thread/google-gemini-output-commercial-use.html>
- Veo FAQ: Commercial Rights, Watermarks, and Privacy — Flowith
  <https://flowith.io/blog/veo-faq-commercial-rights-watermarks/>
- Veo 3 Commercial Use Guide 2026 — veo3ai.io
  <https://www.veo3ai.io/blog/veo-3-commercial-use-guide-2026>
- AI Commercial Rights by Platform (2026) — vidpros
  <https://vidpros.com/ai-platforms-rights/>
- Is It Ethical to Remove a Gemini Watermark? — Phrasly
  <https://phrasly.ai/blog/remove-gemini-text-watermark/>

---

## Findings by topic (with supporting excerpts)

> Excerpts are quoted/paraphrased **as reported by the sources above**. They are
> not verified verbatim against Google's primary (403-blocked) pages.

### 1. Ownership — we own our outputs
- Flow Help, as reported: *"Google won't claim ownership over content that you
  generate through Google Flow."*
- Google ToS via Flow, as reported: *"Some of the services allow you to generate
  original content. Google won't claim ownership over that content."*
- Terms.Law: *"as between you and Google, you retain ownership of all outputs."*

**Net:** As between us and Google, the generated music and art are ours. Google
keeps ownership of the underlying models/platform, not of our output.

### 2. Commercial use — permitted, royalty-free, WITH a GA vs. preview catch
- Terms.Law (Gemini images): *"You can use outputs for business, advertising,
  products, and services without paying royalties to Google … provided you don't
  violate third-party IP."*
- vidpros / secondary: *"Flow allows commercial use and grants full ownership
  rights for its **general availability (GA)** features, but this permission does
  **not** extend to **Pre-GA components** … and Google's **Pre-GA Offerings Terms
  explicitly prohibit commercial use of preview products.**"*
- Secondary: **paid-plan** subscribers own rights to generated content for
  commercial purposes; the **consumer/free** tools are volume-limited and "review
  current terms before commercial use."

**Net:** Commercial use is allowed **if** (a) the specific Flow / image feature we
used was **GA, not a preview / Pre-GA model**, and (b) we're within the plan tier's
terms. This GA-vs-preview line is the single most important thing to verify — see
the checklist.

### 3. Watermarks — the mechanics differ by asset type

There are **two distinct kinds** of watermark, and they do **not** apply the same
way to images and audio. Getting this right matters:

- **Visible watermark** — a mark on the pixels: the Veo logo stamped on video
  frames, or the Gemini/"sparkle" mark on generated images. **A pure audio file
  has no visible watermark** — there are no pixels to stamp, so this concept does
  **not** apply to our music.
- **Invisible SynthID** — an imperceptible signal woven into the content itself,
  present across Imagen (images), Veo (video), **and Lyria (audio)** outputs. For
  audio, SynthID converts the waveform to a spectrogram, embeds the mark there,
  then converts back; the result is **inaudible** and survives MP3 compression,
  added noise, and speed changes. It only lets Google's SynthID Detector flag the
  track as AI-generated — it does **not** affect ownership or usage rights.

How this maps to our two asset types:

| Asset | Visible watermark | Invisible SynthID | What we did / need to do |
|-------|-------------------|-------------------|--------------------------|
| **Art** (Nano Banana images) | Yes — Gemini/sparkle mark | Yes (in pixels) | We **cropped/removed the visible mark**; SynthID remains, harmless |
| **Music** (Flow audio) | **None exists for audio** | Yes (in the waveform) | Nothing to remove; SynthID inaudible & harmless |

**On removing the visible mark from the ART:** Phrasly/winbuzzer report that
*"Google's Terms of Service do not explicitly prohibit removing the visible
watermark,"* while *"using Google's generative AI to bypass copyright protections
violates the company's service terms."* We removed Google's **own** visible mark
from **our own** generated art — not someone else's watermark to bypass their
copyright — so this is **not clearly prohibited**. "Not explicitly prohibited" ≠
"expressly blessed," so it stays a confirm-on-primary-terms item.

**On the MUSIC:** there is no visible watermark to remove; the only mark is the
inaudible SynthID baked into the waveform, which we can't practically remove and
which doesn't affect our rights. **Nothing to do.**

### 4. Prohibited uses (Generative AI Prohibited Use Policy)
- No knowingly harmful, illegal, or deceptive content.
- No realistic depictions of identifiable real people without consent.
- **Our content (a fantasy tower-defense game) doesn't touch any of these.**

### 5. Timing — which terms govern (asset date vs. publish date)
- Google's ownership language ("Google won't claim ownership") reads as a standing
  grant, not something re-decided at publish time. General principle: the rights
  grant attaches at **generation**, and term changes normally apply **going
  forward**, not retroactively.
- **Practical insurance:** archive a dated copy (PDF/screenshot) of the Flow terms
  as they read when we generated the assets, and record generation dates. If terms
  change before we ship, that's the evidence of what we agreed to and when.

### 6. Residual risk — third-party IP, unindemnified on consumer tiers
- The real surviving exposure isn't Google clawing back our work — it's that an AI
  output could itself **resemble third-party IP** from training data, and on
  **consumer tiers Google does not indemnify** us for that. Low probability, but
  it's the risk that doesn't go away. (Enterprise tiers like Vertex AI sometimes
  offer indemnity; consumer Flow/Gemini generally don't.)

---

## Our summary of findings — the stance

Based on the above, our working position (secondary-source-grounded, not
lawyer-verified):

1. **We own** the music (Flow) and art (Nano Banana) outputs as against Google.
2. **We may use them commercially**, royalty-free, in a paid/monetized store app —
   **provided the feature used was GA, not a preview/Pre-GA model.**
3. **Removing the visible Google watermark from our own generated art is not
   clearly prohibited.** The invisible SynthID remains and is harmless to us.
4. **Our content breaks none of the prohibited-use rules.**
5. **Rights attach at generation;** we archive dated terms + generation dates as
   insurance against later term changes.
6. **Remaining real risk:** third-party-IP resemblance, unindemnified on consumer
   tier — low, but acknowledged.
7. **Fonts** are cleanly handled under OFL 1.1 (`OFL.txt`) and only require shipping
   the license text / an in-app acknowledgements screen.

**Confidence:** high on ownership and no-royalty commercial use; **conditional** on
the GA-vs-preview point; **"probably fine, confirm" on the watermark**.

---

## Open verification items — close these before commercial launch

- [ ] **GA vs. Pre-GA:** confirm the exact Flow / image model used for our shipped
      assets was a **generally available** feature, not a preview/Pre-GA one
      (Pre-GA Offerings Terms prohibit commercial use). *Most important item.*
- [ ] **Plan tier:** confirm the account tier we generated under permits commercial
      use and note whether outputs carried a **visible** watermark.
- [ ] **Primary-source read:** while logged in, read the actual Flow / Google
      generative-AI terms (they 403 automated tools) and confirm the wording above
      still holds.
- [ ] **Archive:** save a dated PDF/screenshot of those terms + record asset
      generation dates (store alongside this file).
- [ ] **Store baseline:** publish a privacy policy (required by both stores);
      complete any AI-generated-content disclosure the target store requires.
- [ ] **Fonts:** surface `OFL.txt` via an in-app Licenses/Acknowledgements screen.
- [ ] For a paid launch, a short lawyer review of items 1–2 above.

---

*Last compiled: 2026-07-24. Recompile if Google's terms change or the shipped
asset set changes. Sources and excerpts above are secondary; primary-source
confirmation is a tracked open item.*
