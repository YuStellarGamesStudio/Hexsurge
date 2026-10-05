// A minor: the crystal arch becomes a descending blizzard.
// Short releases and a continuous bass pulse bridge the 32-beat seam without masking spell transients.
import { line, chord, midi, track } from '../compose.js';

const voices = {
  "glass": {
    "version": 1,
    "algorithm": 5,
    "feedback": 0,
    "ops": [
      {
        "ratio": 2.01,
        "level": 0.065,
        "detune": 0,
        "adsr": {
          "a": 0.01,
          "d": 0.4,
          "s": 0.08,
          "r": 0.3
        }
      },
      {
        "ratio": 1,
        "level": 0.13,
        "detune": -2,
        "adsr": {
          "a": 0.02,
          "d": 0.4,
          "s": 0.2,
          "r": 0.3
        }
      },
      {
        "ratio": 3,
        "level": 0.045,
        "detune": 0,
        "adsr": {
          "a": 0.005,
          "d": 0.3,
          "s": 0.05,
          "r": 0.25
        }
      },
      {
        "ratio": 1,
        "level": 0.1,
        "detune": 2,
        "adsr": {
          "a": 0.03,
          "d": 0.45,
          "s": 0.15,
          "r": 0.35
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
const harmony = [["a2", "minor"], ["g3", "major"], ["f3", "major"], ["e3", "minor"], ["a2", "minor"], ["c3", "major"], ["d3", "minor"], ["e3", "7"]];
const lead = [
  ...line("e4 a4 b4:1 c5 b4 a4:1 | g4 e4 d4:1 e4 b3 r:1", { vel: 0.67 }),
  ...line("a4 c5 e5:1 d5 c5 b4:1 | a4 g4 f4:1 e4 g#4 a4:1", { start: 8, vel: 0.73 }),
  ...line("e4 a4 b4:1 c5 b4 a4:1 | g4 e4 d4:1 e4 b3 r:1", { start: 16, vel: 0.61 }),
  ...line("a4 c5 e5:1 d5 c5 b4:1 | a4 g4 f4:1 e4 g#4 a4:1", { start: 24, vel: 0.78 }),
];
const bass = [], pad = [], arp = [], drums = [];
for (let bar = 0; bar < harmony.length; bar++) {
  const [root, quality] = harmony[bar];
  const at = bar * 4;
  const notes = chord(root, quality, at, 4, 0.36);
  pad.push(...notes);
  const low = midi(root) - 12;
  for (const [offset, interval, length, velocity] of [[0, 0, 0.9, 0.72], [1, 0, 0.65, 0.48], [2, 7, 0.9, 0.61], [3, 0, 0.9, 0.52]])
    bass.push([at + offset, low + interval, length, velocity]);
  for (let pulse = 0; pulse < 16; pulse++) {
    const pitch = notes[[0, 2, 1, 2][pulse % 4]][1] + 12;
    arp.push([at + pulse * 0.25, pitch, 0.15, pulse % 4 === 0 ? 0.36 : 0.24]);
  }
  for (const [offset, pitch, velocity] of [[0, 36, 0.62], [0.75, 55, 0.25], [1.5, 43, 0.46], [2, 36, 0.52], [2.75, 55, 0.28], [3.5, 43, 0.5]])
    drums.push([at + offset, pitch, 0.12, velocity]);
}

export default track('tundra-2', 140, 32, voices, [
  { voice: 'glass', notes: lead },
  { voice: 'bass', notes: bass },
  { voice: 'pad', notes: pad },
  { voice: 'glass', notes: arp },
  { voice: 'drum', notes: drums },
]);
