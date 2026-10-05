// F-sharp suspended: distant fifths float between unrelated stars.
// Short releases and a continuous bass pulse bridge the 32-beat seam without masking spell transients.
import { line, chord, midi, track } from '../compose.js';

const voices = {
  "alien": {
    "version": 1,
    "algorithm": 6,
    "feedback": 1,
    "ops": [
      {
        "ratio": 3.5,
        "level": 0.06,
        "detune": 0,
        "adsr": {
          "a": 0.015,
          "d": 0.22,
          "s": 0.18,
          "r": 0.18
        }
      },
      {
        "ratio": 1,
        "level": 0.12,
        "detune": -5,
        "adsr": {
          "a": 0.02,
          "d": 0.3,
          "s": 0.35,
          "r": 0.22
        }
      },
      {
        "ratio": 1.5,
        "level": 0.08,
        "detune": 0,
        "adsr": {
          "a": 0.01,
          "d": 0.35,
          "s": 0.2,
          "r": 0.22
        }
      },
      {
        "ratio": 1,
        "level": 0.1,
        "detune": 5,
        "adsr": {
          "a": 0.025,
          "d": 0.3,
          "s": 0.3,
          "r": 0.25
        }
      }
    ]
  },
  "bass": {
    "version": 1,
    "algorithm": 4,
    "feedback": 1,
    "ops": [
      {
        "ratio": 1,
        "level": 0.09,
        "detune": 0,
        "adsr": {
          "a": 0.004,
          "d": 0.09,
          "s": 0.25,
          "r": 0.05
        }
      },
      {
        "ratio": 1,
        "level": 0.18,
        "detune": 0,
        "adsr": {
          "a": 0.005,
          "d": 0.16,
          "s": 0.6,
          "r": 0.07
        }
      },
      {
        "ratio": 2,
        "level": 0.03,
        "detune": 0,
        "adsr": {
          "a": 0.004,
          "d": 0.08,
          "s": 0.2,
          "r": 0.05
        }
      },
      {
        "ratio": 1,
        "level": 0.08,
        "detune": 0,
        "adsr": {
          "a": 0.005,
          "d": 0.16,
          "s": 0.4,
          "r": 0.07
        }
      }
    ]
  },
  "pad": {
    "version": 1,
    "algorithm": 7,
    "feedback": 0,
    "ops": [
      {
        "ratio": 1,
        "level": 0.065,
        "detune": -4,
        "adsr": {
          "a": 0.18,
          "d": 0.35,
          "s": 0.6,
          "r": 0.28
        }
      },
      {
        "ratio": 2,
        "level": 0.03,
        "detune": 0,
        "adsr": {
          "a": 0.2,
          "d": 0.3,
          "s": 0.4,
          "r": 0.3
        }
      },
      {
        "ratio": 1,
        "level": 0.065,
        "detune": 4,
        "adsr": {
          "a": 0.22,
          "d": 0.4,
          "s": 0.55,
          "r": 0.3
        }
      },
      {
        "ratio": 3,
        "level": 0.018,
        "detune": 0,
        "adsr": {
          "a": 0.24,
          "d": 0.3,
          "s": 0.3,
          "r": 0.25
        }
      }
    ]
  },
  "drum": {
    "version": 1,
    "algorithm": 4,
    "feedback": 3,
    "ops": [
      {
        "ratio": 7,
        "level": 0.09,
        "detune": 0,
        "adsr": {
          "a": 0.001,
          "d": 0.035,
          "s": 0,
          "r": 0.025
        }
      },
      {
        "ratio": 0.5,
        "level": 0.16,
        "detune": 0,
        "adsr": {
          "a": 0.001,
          "d": 0.085,
          "s": 0,
          "r": 0.03
        }
      },
      {
        "ratio": 11,
        "level": 0.04,
        "detune": 0,
        "adsr": {
          "a": 0.001,
          "d": 0.03,
          "s": 0,
          "r": 0.02
        }
      },
      {
        "ratio": 1,
        "level": 0.09,
        "detune": 0,
        "adsr": {
          "a": 0.001,
          "d": 0.05,
          "s": 0,
          "r": 0.025
        }
      }
    ]
  }
};
const harmony = [["f#3", "sus2"], ["d3", "maj7"], ["a2", "sus2"], ["e3", "sus4"], ["c#3", "sus2"], ["g3", "maj7"], ["b2", "sus2"], ["c#3", "sus4"]];
const lead = [
  ...line("f#4:1 c#5:1 g#4:1 r:1 | e4:1 b4 a4 f#4:1 r", { vel: 0.67 }),
  ...line("c#4:1 g#4:1 d#5:1 e5:1 | b4 a4 g#4:1 e4:1 f#4:1", { start: 8, vel: 0.73 }),
  ...line("f#4:1 c#5:1 g#4:1 r:1 | e4:1 b4 a4 f#4:1 r", { start: 16, vel: 0.61 }),
  ...line("c#4:1 g#4:1 d#5:1 e5:1 | b4 a4 g#4:1 e4:1 f#4:1", { start: 24, vel: 0.78 }),
];
const bass = [], pad = [], arp = [], drums = [];
for (let bar = 0; bar < harmony.length; bar++) {
  const [root, quality] = harmony[bar];
  const at = bar * 4;
  const notes = chord(root, quality, at, 4, 0.36);
  pad.push(...notes);
  const low = midi(root) - 12;
  for (const [offset, interval, length, velocity] of [[0, 0, 1.8, 0.65], [2, 7, 0.8, 0.48], [3, 0, 0.9, 0.56]])
    bass.push([at + offset, low + interval, length, velocity]);
  for (let pulse = 0; pulse < 8; pulse++) {
    const pitch = notes[[0, 2, 1, 2][pulse % 4]][1] + 12;
    arp.push([at + pulse * 0.5, pitch, 0.3, pulse % 4 === 0 ? 0.36 : 0.24]);
  }
  for (const [offset, pitch, velocity] of [[0, 36, 0.4], [2, 43, 0.32]])
    drums.push([at + offset, pitch, 0.12, velocity]);
}

export default track('void-1', 102, 32, voices, [
  { voice: 'alien', notes: lead },
  { voice: 'bass', notes: bass },
  { voice: 'pad', notes: pad },
  { voice: 'alien', notes: arp },
  { voice: 'drum', notes: drums },
]);
