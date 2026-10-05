import { track, line, chord, midi, repeat } from '../compose.js';
import { voices } from '../voices.js';
// Eight-bar harmony; the answering phrase resolves back into the opening motif.
const progression = [["c3","maj7"],["e3","minor"],["f2","major"],["g2","sus4"],["a2","minor"],["f2","major"],["g2","major"],["c3","major"]];
const pads = progression.flatMap(([root, quality], i) => chord(root, quality, i*4, 3.55, .6));
const bass = progression.flatMap(([root],i) => [[i*4,midi(root)-12,.7,.85],[i*4+2,midi(root)-5,.55,.65]]);
const arpeggio = progression.flatMap(([root,quality],i) => chord(root,quality,0,1).flatMap(([,n],j) => [[i*4+j*.5,n+12,.22,.4],[i*4+2+j*.5,n+12,.22,.3]]));
const melody = line("e5:2 d5:1 c5:1 | b4:1 g4:1 e4:2 | a4:1 c5:1 f5:2 | e5:1 d5:1 g4:2 | c5:1 e5:1 a5:1 g5:1 | f5:2 e5:1 c5:1 | d5:1 b4:1 g4:1 r:1 | e5:1 d5:1 c5:2", {step:1,vel:.85});
export default track('results', 88, 32, voices, [
  {voice:'pluck',notes:melody},
  {voice:'pad',notes:pads},
  {voice:'bass',notes:bass},
  {voice:'pluck',notes:arpeggio},
]);
