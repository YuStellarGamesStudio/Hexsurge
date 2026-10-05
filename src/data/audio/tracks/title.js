import { track, line, chord, midi, repeat } from '../compose.js';
import { voices } from '../voices.js';
// Eight-bar harmony; the answering phrase resolves back into the opening motif.
const progression = [["c3","major"],["g2","major"],["a2","minor"],["f2","major"],["d3","minor"],["g2","sus4"],["f2","major"],["g2","major"]];
const pads = progression.flatMap(([root, quality], i) => chord(root, quality, i*4, 3.55, .6));
const bass = progression.flatMap(([root],i) => [[i*4,midi(root)-12,.7,.85],[i*4+2,midi(root)-5,.55,.65]]);
const arpeggio = progression.flatMap(([root,quality],i) => chord(root,quality,0,1).flatMap(([,n],j) => [[i*4+j*.5,n+12,.22,.4],[i*4+2+j*.5,n+12,.22,.3]]));
const melody = line("g4:1 c5:1 e5:1 d5:1 | b4:1 g4:1 d5:2 | e5:1 a5:1 g5:1 e5:1 | f5:2 e5:1 c5:1 | d5:1 f5:1 a5:1 f5:1 | g5:1 d5:1 c5:1 b4:1 | a4:1 c5:1 f5:1 e5:1 | d5:2 g4:1 r:1", {step:1,vel:.85});
melody.push(...line("e5:1 g5:1 c6:2 | b5:1 g5:1 d5:2 | c5:1 e5:1 a5:2 | g5:1 f5:1 e5:1 c5:1 | f5:1 a5:1 d6:1 c6:1 | b5:1 a5:1 g5:2 | a5:1 g5:1 f5:1 e5:1 | d5:1 b4:1 c5:2", {start:32,step:1,vel:.95}));
export default track('title', 104, 64, voices, [
  {voice:'brass',notes:melody},
  {voice:'pad',notes:repeat(pads,2,32)},
  {voice:'bass',notes:repeat(bass,2,32)},
  {voice:'pluck',notes:repeat(arpeggio,2,32)},
]);
