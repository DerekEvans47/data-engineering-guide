'use strict';
// Quiz Defense — audio: tdAudio engine, synth loop players, music lab,
// file-backed music players, iOS unlock handling.
//
// Split from the old single-file drill.js (2026-07-14). The four files are
// classic scripts sharing the global scope, loaded in order by index.html:
//   drill-core.js -> drill-audio.js -> drill-world.js -> drill-td.js
// Top-level cross-file references only run from event handlers (boot is
// DOMContentLoaded), so declaration order across files is not load-bearing —
// but keep new top-level *executable* statements out of the earlier files if
// they call into later ones.

// ── Audio engine ───────────────────────────────────────────────

const tdAudio = (() => {
  let actx = null, muted = false, _stateChangeFn = null, _htmlUnlocked = false;

  function ac() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  // Schedule notes this far ahead so hardware has time to initialise.
  // Without this, the first tone (on a brand-new, just-resumed AudioContext
  // where currentTime ≈ 0) can be silently dropped when startup latency
  // exceeds the note's scheduled stop time. The music engine already uses
  // a 0.15 s lookahead for the same reason.
  const OFFSET = 0.05;

  // pan: -1 (left) … 0 (centre) … +1 (right); omit or pass 0 for no panning
  function tone(freq, type, dur, gainPeak, freqEnd, pan) {
    const c = ac(); if (!c || muted) return;
    const t = c.currentTime + OFFSET;
    const g = c.createGain(), o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t + dur);
    g.gain.setValueAtTime(gainPeak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    if (pan) {
      try {
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(p); p.connect(c.destination);
      } catch(_) { g.connect(c.destination); }
    } else {
      g.connect(c.destination);
    }
    o.start(t); o.stop(t + dur + 0.02);
  }

  function arpeggio(notes, type, noteDur, gain) {
    const c = ac(); if (!c || muted) return;
    notes.forEach((freq, i) => {
      const t = c.currentTime + OFFSET + i * noteDur;
      const g = c.createGain(), o = c.createOscillator();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 1.6);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + noteDur * 1.6 + 0.02);
    });
  }

  // colFrac: tower/enemy x as 0–1 fraction of canvas width → pan value
  function colPan(colFrac) { return (colFrac * 2 - 1) * 0.75; }

  return {
    // positional SFX — pass colFrac (0–1) for stereo placement
    // Arrow "thwip": a filtered noise snap + a fast falling chirp — reads
    // as a bowshot instead of the old square-wave laser zap.
    shoot: (colFrac=0.5) => {
      const c = ac(); if (!c || muted) return;
      const t = c.currentTime + OFFSET;
      const pan = colPan(colFrac);
      // noise burst through a falling bandpass (string snap / fletching hiss)
      const len = Math.floor(c.sampleRate * 0.09);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(2400, t);
      bp.frequency.exponentialRampToValueAtTime(500, t + 0.09);
      const g = c.createGain();
      g.gain.setValueAtTime(0.10, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      src.connect(bp); bp.connect(g);
      try {
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(p); p.connect(c.destination);
      } catch(_) { g.connect(c.destination); }
      src.start(t); src.stop(t + 0.1);
      // soft low bow-thump under the snap
      tone(150, 'sine', 0.05, 0.05, 90, pan);
    },
    hit:       (colFrac=0.5) => tone(260, 'sine',     0.10, 0.12, 110, colPan(colFrac)),
    death:     (colFrac=0.5) => tone(360, 'sawtooth', 0.18, 0.18, 55,  colPan(colFrac)),
    place:     (colFrac=0.5) => tone(430, 'sine',     0.14, 0.16, 390, colPan(colFrac)),
    // non-positional SFX
    lifeLost:  () => tone(440, 'sine',     0.45, 0.28, 185),
    waveStart: () => arpeggio([330, 415, 523], 'square', 0.09, 0.11),
    correct:   () => arpeggio([523, 659, 784], 'sine',   0.10, 0.14),
    wrong:     () => tone(200, 'sawtooth', 0.22, 0.16, 140),
    victory:   () => arpeggio([523, 659, 784, 1047], 'sine', 0.12, 0.16),
    gameOver:  () => arpeggio([330, 277, 220, 165], 'sawtooth', 0.16, 0.16),
    get muted() { return muted; },
    get ctx()   { return actx; },
    toggleMute() { muted = !muted; return muted; },
    // Call within a user gesture to create + resume the shared AudioContext (iOS requirement).
    // Returns a Promise<boolean> — true if the context is confirmed running, false on any failure.
    unlock() {
      if (!actx) {
        try {
          actx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
          return Promise.resolve(false); // API unavailable or blocked
        }
      }
      if (!actx) return Promise.resolve(false);
      // iOS often resolves resume() before the context is actually outputting audio.
      // Watch for the real state transition so we can realign music scheduling then.
      if (actx.state !== 'running' && !_stateChangeFn) {
        _stateChangeFn = () => {
          if (actx.state !== 'running') return;
          actx.removeEventListener('statechange', _stateChangeFn);
          _stateChangeFn = null;
          // If music is already pumping, realign nextBeat; otherwise honour pending.
          if (menuMusic.playing) menuMusic.restart();
          else menuMusic.onUnlock();
          if (mapMusic.playing) mapMusic.restart();
          else mapMusic.onUnlock();
        };
        actx.addEventListener('statechange', _stateChangeFn);
      }
      // Play a silent HTML <audio> element once per page load.  iOS routes Web Audio
      // through AVAudioSessionCategoryAmbient (muted by the silent switch) unless an
      // HTML media element is also playing, which escalates the session to
      // AVAudioSessionCategoryPlayback (ignores the silent switch) — the same
      // category Reddit/YouTube use, which is why their audio works in silent mode.
      if (!_htmlUnlocked) {
        _htmlUnlocked = true;
        try {
          // Build a minimal valid 46-byte WAV (1 silent sample, 22050 Hz, 16-bit mono)
          const wb = new ArrayBuffer(46), wv = new DataView(wb),
                ws = (o, s) => [...s].forEach((c, i) => wv.setUint8(o + i, c.charCodeAt(0)));
          ws(0,'RIFF'); wv.setUint32(4,38,true); ws(8,'WAVE');
          ws(12,'fmt '); wv.setUint32(16,16,true); wv.setUint16(20,1,true); wv.setUint16(22,1,true);
          wv.setUint32(24,22050,true); wv.setUint32(28,44100,true);
          wv.setUint16(32,2,true); wv.setUint16(34,16,true);
          ws(36,'data'); wv.setUint32(40,2,true); wv.setInt16(44,0,true);
          const url = URL.createObjectURL(new Blob([wb], {type:'audio/wav'}));
          const ha = new Audio(url);
          ha.play().then(() => URL.revokeObjectURL(url)).catch(() => URL.revokeObjectURL(url));
        } catch(_) {}
      }
      const p = actx.state !== 'running' ? actx.resume() : Promise.resolve();
      // Play a 1-sample silent Web Audio buffer — warms up the hardware pipeline
      // so the first scheduled note isn't dropped on initial wakeup.
      return p.then(() => {
        try {
          const buf = actx.createBuffer(1, 1, actx.sampleRate);
          const src = actx.createBufferSource();
          src.buffer = buf; src.connect(actx.destination); src.start(0);
        } catch(_) {}
        return true;
      }).catch(() => false);
    },
  };
})();

// ── Menu / map background music ────────────────────────────────
const menuMusic = (() => {
  let actx = null, masterGain = null;
  let playing = false, pending = false, timer = null;
  let beat = 0, nextBeat = 0;

  const BPM  = 100;
  const S    = (60 / BPM) / 2;   // 8th-note step
  const LOOK = 0.25;

  // A minor pentatonic: A2, E3, A3, C4, E4
  const ROOT = 110.00, FIFTH = 164.81, OCT = 220.00;

  // Never create a standalone AudioContext — only share the one tdAudio owns.
  // Returns null only if tdAudio hasn't been unlocked yet (no gesture fired).
  function ac() {
    const shared = tdAudio.ctx;
    if (!shared) return null;
    if (actx !== shared) { actx = shared; masterGain = null; }
    if (!masterGain) {
      masterGain = actx.createGain();
      masterGain.gain.value = tdAudio.muted ? 0 : 0.13;
      masterGain.connect(actx.destination);
    }
    return actx;
  }

  function schedBass(freq, start, dur) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = 'triangle'; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.9, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.01);
  }

  function schedHat(start) {
    const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * 0.04), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(), g = actx.createGain();
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.055, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(start); src.stop(start + 0.05);
  }

  function schedKick(start) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, start);
    o.frequency.exponentialRampToValueAtTime(36, start + 0.08);
    g.gain.setValueAtTime(0.45, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + 0.14);
  }

  // 8-step pattern: kick on 0,4; hihat every step; bass root/fifth/octave
  const BASS_STEPS = [ROOT, 0, FIFTH, 0, OCT, 0, FIFTH, 0];

  function doStart(c) {
    playing = true; pending = false;
    beat = 0; nextBeat = c.currentTime + 0.15;
    pump();
  }

  function pump() {
    if (!playing) return;
    const c = ac(); if (!c) return;
    const now = c.currentTime;
    // If nextBeat has fallen more than 1 s behind (e.g. context was suspended while
    // currentTime advanced), jump ahead so we don't try to schedule past notes.
    if (nextBeat < now - 1.0) nextBeat = now + 0.05;
    while (nextBeat < now + LOOK) {
      const b = beat % 8, t = nextBeat;
      try {
        if (b === 0 || b === 4) schedKick(t);
        schedHat(t);
        if (BASS_STEPS[b]) schedBass(BASS_STEPS[b], t, S * 0.85);
      } catch(_) {}
      beat++;
      nextBeat += S;
    }
    timer = setTimeout(pump, 50);
  }

  return {
    start() {
      if (playing) return;
      const c = ac();
      if (!c) { pending = true; return; }   // defer until onUnlock()
      doStart(c);
    },
    stop() {
      playing = false; pending = false;
      clearTimeout(timer); timer = null;
    },
    get playing() { return playing; },
    // Called after tdAudio.unlock() Promise resolves — context is confirmed running.
    onUnlock() {
      if (!pending) return;
      const c = ac(); if (!c) return;
      doStart(c);
    },
    // Called by tdAudio when the AudioContext statechange fires 'running'.
    // Realigns nextBeat so we don't replay or skip beats after a long suspension.
    restart() {
      if (!playing) return;
      clearTimeout(timer); timer = null;
      const c = ac(); if (!c) return;
      nextBeat = c.currentTime + 0.05;
      pump();
    },
    setMuted(m) {
      if (!masterGain || !actx) return;
      masterGain.gain.setTargetAtTime(m ? 0 : 0.13, actx.currentTime, 0.08);
    },
  };
})();

// ── World/region map background music — driving march, pushes the run forward ──
const mapMusicSynthOriginal = (() => {
  let actx = null, masterGain = null;
  let playing = false, pending = false, timer = null;
  let beat = 0, nextBeat = 0;

  const BPM  = 116;
  const S    = (60 / BPM) / 2;   // 8th-note step
  const LOOK = 0.25;

  // D natural minor — root/3rd/5th "call to arms" motif, doubled an octave
  // up for the higher/tinnier second horn that joins in the final bar.
  const N = {
    A2:110.00, D3:146.83, F3:174.61, A3:220.00,
    D4:293.66, F4:349.23, A4:440.00,
    D5:587.33, F5:698.46, A5:880.00,
  };

  // Steady march cadence — same kick/snare/bass groove every bar, never lets up.
  const BASS_STEPS = [N.D3, 0, N.A2, 0, N.D3, 0, N.F3, 0];

  // 32-step (4-bar) arrangement: bar 1 is cadence-only, bar 2 brings in the
  // brass call, bar 3 answers it under rising tension strings, bar 4 adds the
  // second horn for the peak, then thins back to cadence to loop seamlessly.
  const MELODY = new Array(32).fill(0);
  MELODY[8]  = N.D4; MELODY[11] = N.F4; MELODY[13] = N.A4;
  MELODY[16] = N.A4; MELODY[18] = N.F4; MELODY[20] = N.D4;
  MELODY[24] = N.D4; MELODY[26] = N.F4; MELODY[28] = N.A4; MELODY[30] = N.D4;
  const MELODY_DUR = { 8:3, 11:2, 13:3, 16:2, 18:2, 20:4, 24:2, 26:2, 28:2, 30:2 };

  // Second, higher/tinnier horn — only answers in the final bar
  const HORN2 = new Array(32).fill(0);
  HORN2[24] = N.D5; HORN2[26] = N.F5; HORN2[28] = N.A5;
  const HORN2_DUR = { 24:2, 26:2, 28:2 };

  // Never create a standalone AudioContext — only share the one tdAudio owns.
  function ac() {
    const shared = tdAudio.ctx;
    if (!shared) return null;
    if (actx !== shared) { actx = shared; masterGain = null; }
    if (!masterGain) {
      masterGain = actx.createGain();
      masterGain.gain.value = tdAudio.muted ? 0 : 0.15;
      masterGain.connect(actx.destination);
    }
    return actx;
  }

  function schedNote(freq, type, start, dur, vol) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.01);
  }

  function schedKick(start) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, start);
    o.frequency.exponentialRampToValueAtTime(45, start + 0.11);
    g.gain.setValueAtTime(0.5, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + 0.16);
  }

  function schedSnare(start) {
    const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * 0.09), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(), g = actx.createGain();
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200;
    g.gain.setValueAtTime(0.22, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(start); src.stop(start + 0.1);
  }

  function pump() {
    if (!playing) return;
    const c = ac(); if (!c) return;
    const now = c.currentTime;
    if (nextBeat < now - 1.0) nextBeat = now + 0.05;
    while (nextBeat < now + LOOK) {
      const step = beat % 32, b8 = step % 8, t = nextBeat;
      try {
        if (b8 === 0 || b8 === 4) schedKick(t);
        if (b8 === 2 || b8 === 6) schedSnare(t);
        if (BASS_STEPS[b8]) schedNote(BASS_STEPS[b8], 'sawtooth', t, S * 1.4, 0.12);
        if (MELODY[step]) schedNote(MELODY[step], 'square', t, S * MELODY_DUR[step], 0.13);
        if (HORN2[step])  schedNote(HORN2[step], 'square', t, S * HORN2_DUR[step], 0.075);
        // rising tension strings — trembling under the brass from bar 3 onward
        if (step >= 16 && step % 2 === 0) schedNote(step % 4 === 0 ? N.A3 : N.D4, 'triangle', t, S * 0.42, 0.035);
      } catch(_) {}
      beat++;
      nextBeat += S;
    }
    timer = setTimeout(pump, 50);
  }

  function doStart(c) {
    playing = true; pending = false;
    beat = 0; nextBeat = c.currentTime + 0.15;
    pump();
  }

  return {
    start() {
      if (playing) return;
      const c = ac();
      if (!c) { pending = true; return; }   // defer until onUnlock()
      doStart(c);
    },
    stop() {
      playing = false; pending = false;
      clearTimeout(timer); timer = null;
    },
    get playing() { return playing; },
    onUnlock() {
      if (!pending) return;
      const c = ac(); if (!c) return;
      doStart(c);
    },
    restart() {
      if (!playing) return;
      clearTimeout(timer); timer = null;
      const c = ac(); if (!c) return;
      nextBeat = c.currentTime + 0.05;
      pump();
    },
    setMuted(m) {
      if (!masterGain || !actx) return;
      masterGain.gain.setTargetAtTime(m ? 0 : 0.15, actx.currentTime, 0.08);
    },
  };
})();

// ── Music Lab (temporary A/B testing tool — 🎵 button on home screen) ──────
// Auditions alternate map-theme arrangements against the shipped mapMusic
// without navigating the map flow each time. Delete this whole section (plus
// the music-lab-btn markup/listener and showMusicLab/hideMusicLab) once a
// final theme is picked — it doesn't touch any game logic.
function createLoopPlayer(cfg) {
  let actx = null, masterGain = null;
  let playing = false, pending = false, timer = null;
  let beat = 0, nextBeat = 0;
  const S = (60 / cfg.bpm) / 2;
  const LOOK = 0.25;

  function ac() {
    const shared = tdAudio.ctx;
    if (!shared) return null;
    if (actx !== shared) { actx = shared; masterGain = null; }
    if (!masterGain) {
      masterGain = actx.createGain();
      masterGain.gain.value = tdAudio.muted ? 0 : cfg.gain;
      masterGain.connect(actx.destination);
    }
    return actx;
  }

  function schedNote(freq, type, start, dur, vol) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.01);
  }
  function schedNoteThick(freq, type, start, dur, vol) {
    schedNote(freq, type, start, dur, vol);
    schedNote(freq / 2, type, start, dur, vol * 0.7);
  }
  // Generic pitch-swept percussive hit — kick is just the low-and-fast case;
  // toms reuse this at a higher, gentler-sweeping pitch.
  function schedThump(freqStart, freqEnd, start, dur, vol) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freqStart, start);
    o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur * 0.8);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.01);
  }
  function schedKick(start) { schedThump(130, 45, start, 0.14, 0.5); }
  function schedSnare(start, vol, dur) {
    dur = dur !== undefined ? dur : 0.09;
    const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * dur), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(), g = actx.createGain();
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200;
    g.gain.setValueAtTime(vol !== undefined ? vol : 0.22, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(start); src.stop(start + dur + 0.01);
  }

  function pump() {
    if (!playing) return;
    const c = ac(); if (!c) return;
    const now = c.currentTime;
    if (nextBeat < now - 1.0) nextBeat = now + 0.05;
    while (nextBeat < now + LOOK) {
      const step = beat % cfg.steps, t = nextBeat;
      try { cfg.onStep(step, t, { schedNote, schedNoteThick, schedThump, schedKick, schedSnare, S }); } catch(_) {}
      beat++;
      nextBeat += S;
    }
    timer = setTimeout(pump, 50);
  }

  function doStart(c) {
    playing = true; pending = false;
    beat = 0; nextBeat = c.currentTime + 0.15;
    pump();
  }

  return {
    start() {
      if (playing) return;
      const c = ac();
      if (!c) { pending = true; return; }
      doStart(c);
    },
    stop() {
      playing = false; pending = false;
      clearTimeout(timer); timer = null;
    },
    get playing() { return playing; },
    onUnlock() { if (!pending) return; const c = ac(); if (!c) return; doStart(c); },
    restart() {
      if (!playing) return;
      clearTimeout(timer); timer = null;
      const c = ac(); if (!c) return;
      nextBeat = c.currentTime + 0.05;
      pump();
    },
    setMuted(m) {
      if (!masterGain || !actx) return;
      masterGain.gain.setTargetAtTime(m ? 0 : cfg.gain, actx.currentTime, 0.08);
    },
  };
}

const MAP_NOTES = {
  A2:110.00, D3:146.83, F3:174.61,
  D4:293.66, F4:349.23, A4:440.00,
};
const MAP_MELODY     = { 0:MAP_NOTES.D4, 3:MAP_NOTES.F4, 5:MAP_NOTES.A4, 8:MAP_NOTES.A4, 11:MAP_NOTES.F4, 13:MAP_NOTES.D4 };
const MAP_BASS_STEPS = [MAP_NOTES.D3, 0, MAP_NOTES.A2, 0, MAP_NOTES.D3, 0, MAP_NOTES.F3, 0];

// Variant 1 — fixes the "silent intro bar": melody, drone, and a thicker
// (octave-doubled) mix all present from note one instead of building up.
const mapMusicDense = createLoopPlayer({
  bpm: 116, steps: 16, gain: 0.22,
  onStep(step, t, { schedNote, schedNoteThick, schedKick, schedSnare, S }) {
    const b8 = step % 8;
    const dur = { 0:3, 3:2, 5:3, 8:2, 11:2, 13:3 }[step];
    if (b8 === 0 || b8 === 4) schedKick(t);
    if (b8 === 2 || b8 === 6) schedSnare(t, 0.24);
    if (MAP_BASS_STEPS[b8]) schedNote(MAP_BASS_STEPS[b8], 'sawtooth', t, S * 1.6, 0.16);
    schedNote(MAP_NOTES.A2, 'triangle', t, S * 0.9, 0.05); // constant low tension drone
    if (MAP_MELODY[step]) schedNoteThick(MAP_MELODY[step], 'square', t, S * dur, 0.2);
  },
});

// Variant 2 — isolates rhythm density: kick on every beat (not just 1 & 3)
// plus a continuous soft shaker, for a galloping rather than half-time feel.
const mapMusicGallop = createLoopPlayer({
  bpm: 116, steps: 16, gain: 0.19,
  onStep(step, t, { schedNote, schedKick, schedSnare, S }) {
    const b8 = step % 8;
    const dur = { 0:3, 3:2, 5:3, 8:2, 11:2, 13:3 }[step];
    if (b8 % 2 === 0) schedKick(t);
    if (b8 === 2 || b8 === 6) schedSnare(t, 0.22);
    schedSnare(t, 0.045); // continuous 8th-note shaker
    if (MAP_BASS_STEPS[b8]) schedNote(MAP_BASS_STEPS[b8], 'sawtooth', t, S * 1.1, 0.13);
    if (MAP_MELODY[step]) schedNote(MAP_MELODY[step], 'square', t, S * dur, 0.14);
  },
});

// Variant 3 — isolates instrument tone: dual saw+square layered melody and a
// sustained low pedal drone, same rhythm section as the shipped version.
const mapMusicBrass = createLoopPlayer({
  bpm: 116, steps: 16, gain: 0.19,
  onStep(step, t, { schedNote, schedKick, schedSnare, S }) {
    const b8 = step % 8;
    const dur = { 0:4, 3:3, 5:4, 8:3, 11:3, 13:4 }[step];
    if (b8 === 0 || b8 === 4) schedKick(t);
    if (b8 === 2 || b8 === 6) schedSnare(t, 0.22);
    if (MAP_BASS_STEPS[b8]) schedNote(MAP_BASS_STEPS[b8], 'sawtooth', t, S * 1.4, 0.12);
    if (step % 4 === 0) schedNote(MAP_NOTES.D3, 'triangle', t, S * 4.2, 0.06); // low pedal drone
    if (MAP_MELODY[step]) {
      schedNote(MAP_MELODY[step], 'sawtooth', t, S * dur, 0.15);
      schedNote(MAP_MELODY[step], 'square',   t, S * dur, 0.1);
    }
  },
});

// Variant 4 — direct transcription of the uploaded Instrument.mid (program 42,
// "Cello" — a wavering C4-[E4/D#4/F4]-G4-C5 arpeggio) + Drum_Machine.mid (a
// 16-step kick/hat/tom groove, no snare). Extracted programmatically from the
// actual MIDI event bytes, not hand-transcribed — both tracks share the exact
// same 0.3s step grid, which is why one loop player can drive both at once.
const MIDI_MELODY = [
  261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 311.13, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 261.63, 349.23, 392.00, 523.25, 0
];
const MIDI_DRUM_KICK    = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0];
const MIDI_DRUM_HAT_CL  = [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0];
const MIDI_DRUM_TOM_LO  = [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];
const MIDI_DRUM_HAT_OP  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0];
const MIDI_DRUM_TOM_MID = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const mapMusicMidiImport = createLoopPlayer({
  // bpm:100 makes an 8th-note step (S) exactly 0.3s — the same grid both MIDI
  // files were written on, so no time-stretching/quantizing is happening here.
  bpm: 100, steps: 133, gain: 0.2,
  onStep(step, t, { schedNote, schedThump, schedKick, schedSnare, S }) {
    if (MIDI_DRUM_KICK[step])    schedKick(t);
    if (MIDI_DRUM_TOM_LO[step])  schedThump(160, 90, t, 0.22, 0.32);
    if (MIDI_DRUM_TOM_MID[step]) schedThump(190, 110, t, 0.2, 0.3);
    if (MIDI_DRUM_HAT_CL[step])  schedSnare(t, 0.14, 0.045);
    if (MIDI_DRUM_HAT_OP[step])  schedSnare(t, 0.12, 0.11);
    if (MIDI_MELODY[step]) schedNote(MIDI_MELODY[step], 'sawtooth', t, S * 0.5, 0.16);
  },
});

// Plays back a real audio file on loop instead of scheduling oscillators —
// used for temp/reference tracks (a BandLab export, etc.) rather than
// procedurally-generated ones. Shares tdAudio's AudioContext/unlock/mute
// conventions so it slots into the same start/stop/setMuted interface as
// every synthesized player above.
function createAudioFilePlayer(url, gain, loopEnd) {
  let actx = null, masterGain = null;
  let buffer = null, loadPromise = null;
  let source = null, playing = false, pending = false;

  function ac() {
    const shared = tdAudio.ctx;
    if (!shared) return null;
    if (actx !== shared) { actx = shared; masterGain = null; }
    if (!masterGain) {
      masterGain = actx.createGain();
      masterGain.gain.value = tdAudio.muted ? 0 : gain;
      masterGain.connect(actx.destination);
    }
    return actx;
  }

  function loadBuffer(c) {
    if (buffer) return Promise.resolve(buffer);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(url)
      .then(r => r.arrayBuffer())
      .then(ab => c.decodeAudioData(ab))
      .then(decoded => { buffer = decoded; return buffer; })
      .catch(err => { loadPromise = null; throw err; });
    return loadPromise;
  }

  function doStart(c) {
    playing = true; pending = false;
    loadBuffer(c).then(buf => {
      if (!playing) return; // stopped again before the fetch/decode finished
      source = c.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      // Cut off any trailing tail past the composition's actual loop point
      // instead of looping the full decoded buffer (which can include a
      // few hundred ms of decay/padding beyond where the music really ends).
      if (loopEnd && loopEnd < buf.duration) source.loopEnd = loopEnd;
      source.connect(masterGain);
      source.start(0);
    }).catch(() => { playing = false; });
  }

  return {
    start() {
      if (playing) return;
      const c = ac();
      if (!c) { pending = true; return; }
      doStart(c);
    },
    stop() {
      playing = false; pending = false;
      if (source) { try { source.stop(); } catch(_) {} source.disconnect(); source = null; }
    },
    get playing() { return playing; },
    onUnlock() { if (!pending) return; const c = ac(); if (!c) return; doStart(c); },
    // Native buffer playback doesn't drift the way our hand-scheduled
    // oscillator loops can, so there's no beat clock to realign here.
    restart() {},
    setMuted(m) {
      if (!masterGain || !actx) return;
      masterGain.gain.setTargetAtTime(m ? 0 : gain, actx.currentTime, 0.08);
    },
  };
}

// Temp placeholder while music design continues — a real BandLab export,
// not synthesized. Path is relative to index.html, so it resolves the same
// regardless of which directory the dev server's root is.
// Drum groove repeats every 4.8s (6 bars = 28.8s); the file itself runs
// 28.95s, so the last ~0.15s is decay/tail past the actual loop point.
const mapMusic = createAudioFilePlayer('assets/audio/world-map-temp.mp3', 0.5, 28.8);

// Battle-music contenders (temp testers, auditioned via the Music Lab).
// Both are pre-trimmed seamless-loop exports (the files contain the loop
// repeated a few times over), so we loop the whole buffer — no loopEnd cut.
const battleMusicHorn    = createAudioFilePlayer('assets/audio/verdant-battle-horn.mp3', 0.5);
const battleMusicStrings = createAudioFilePlayer('assets/audio/verdant-battle-strings.mp3', 0.5);

const MUSIC_LAB_TRACKS = [
  { id: 'live',     label: 'Live (WorldMap.m4a)', desc: 'What’s actually playing now — your temp BandLab track, looped.', player: mapMusic },
  { id: 'battleHorn',    label: 'Battle: Horn',    desc: 'Battle contender 1 — medieval battle theme, more horn.', player: battleMusicHorn },
  { id: 'battleStrings', label: 'Battle: Strings', desc: 'Battle contender 2 — ascendant kingdom, more strings.', player: battleMusicStrings },
  { id: 'synth',    label: 'Original Synth March', desc: 'The first synthesized march (D minor, sparse intro).', player: mapMusicSynthOriginal },
  { id: 'dense',    label: 'Full Density',      desc: 'No silent intro — melody, drone & thicker mix from note one.', player: mapMusicDense },
  { id: 'gallop',   label: 'Driving Gallop',    desc: 'Kick on every beat + continuous shaker for a galloping feel.', player: mapMusicGallop },
  { id: 'midi',     label: 'Your MIDI Import',  desc: 'Real transcription of Instrument.mid + Drum_Machine.mid, adapted to our synth engine.', player: mapMusicMidiImport },
  { id: 'brass',    label: 'Big Brass',         desc: 'Layered saw+square melody and a sustained low drone underneath.', player: mapMusicBrass },
];

function showMusicLab() {
  menuMusic.stop(); // don't let the home theme clash with whatever's auditioning
  const overlay = document.createElement('div');
  overlay.className = 'relic-equip-overlay';
  overlay.id = 'music-lab-overlay';
  overlay.innerHTML = `
    <div class="relic-equip-sheet">
      <div class="relic-equip-header">
        <span class="relic-equip-title">\u{1F3B5} Music Lab (temp)</span>
        <button class="relic-equip-close" id="music-lab-close">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:.6rem;padding:.2rem 0 1rem">
        ${MUSIC_LAB_TRACKS.map(tr => `
          <div style="border:1px solid var(--border);border-radius:var(--radius);padding:.7rem .9rem;display:flex;align-items:center;justify-content:space-between;gap:.7rem">
            <div>
              <div style="font-weight:700">${tr.label}</div>
              <div style="font-size:.8rem;color:var(--text-muted)">${tr.desc}</div>
            </div>
            <button class="td-map-btn music-lab-play" data-id="${tr.id}">▶ Play</button>
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);

  function stopAll() { MUSIC_LAB_TRACKS.forEach(tr => tr.player.stop()); }

  overlay.querySelectorAll('.music-lab-play').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = MUSIC_LAB_TRACKS.find(x => x.id === btn.dataset.id);
      const wasPlaying = tr.player.playing;
      stopAll();
      overlay.querySelectorAll('.music-lab-play').forEach(b => b.textContent = '▶ Play');
      if (!wasPlaying) { tr.player.start(); btn.textContent = '⏸ Stop'; }
    });
  });

  function close() {
    stopAll();
    overlay.remove();
    if (mode === 'home') menuMusic.start();
  }
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('music-lab-close').addEventListener('click', close);
}

// iOS Safari requires AudioContext creation/resume inside a user gesture.
// Capture-phase so this fires before any element handler on the very first tap.
// unlock() returns a Promise that resolves once the context is confirmed running;
// only THEN do we call onUnlock() so the state check inside ac() passes.
// iOS Safari requires AudioContext creation/resume inside a user gesture.
// We listen on touchstart, touchend, AND click for maximum compatibility.
// _audioUnlocked is only set true on success — so if creation fails on the
// first tap (e.g. brief race) the next tap will retry automatically.
let _audioUnlocked = false;
function _audioUnlock() {
  if (_audioUnlocked) return;
  tdAudio.unlock().then(ok => {
    if (!ok) return; // creation failed — leave _audioUnlocked false so we retry
    _audioUnlocked = true;
    menuMusic.onUnlock();
    mapMusic.onUnlock();
    battleMusicHorn.onUnlock();
    battleMusicStrings.onUnlock();
    // Remove ourselves once we've succeeded
    ['touchstart', 'touchend', 'click'].forEach(e =>
      document.removeEventListener(e, _audioUnlock, true));
  });
}
['touchstart', 'touchend', 'click'].forEach(e =>
  document.addEventListener(e, _audioUnlock, { capture: true, passive: true }));

// Re-resume on every subsequent touch in case iOS auto-suspends the context
// (e.g. after a phone call, locking the screen, or backgrounding the app).
// The statechange listener in tdAudio.unlock() handles music realignment once
// the context transitions back to 'running'.
document.addEventListener('touchstart', () => {
  const ctx = tdAudio.ctx;
  if (ctx && ctx.state === 'suspended') {
    tdAudio.unlock();
  }
}, { passive: true });
