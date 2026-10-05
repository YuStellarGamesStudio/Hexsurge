import { track, line, chord, midi, repeat } from '../compose.js';
import { voices } from '../voices.js';
// Eight-bar harmony; the answering phrase resolves back into the opening motif.
const progression = [["f2","maj7"],["c3","major"],["d3","m7"],["a2","minor"],["bb2","major"],["f2","major"],["g2","minor"],["c3","sus2"]];
const pads = progression.flatMap(([root, quality], i) => chord(root, quality, i*4, 3.55, .6));
const bass = progression.flatMap(([root],i) => [[i*4,midi(root)-12,.7,.85],[i*4+2,midi(root)-5,.55,.65]]);
const arpeggio = progression.flatMap(([root,quality],i) => chord(root,quality,0,1).flatMap(([,n],j) => [[i*4+j*.5,n+12,.22,.4],[i*4+2+j*.5,n+12,.22,.3]]));
const melody = line("a4:1 c5:1 e5:1 r:1 | g4:2 e4:1 r:1 | f4:1 a4:1 c5:1 a4:1 | e5:2 c5:1 r:1 | d5:1 f5:1 d5:1 bb4:1 | a4:2 g4:1 f4:1 | bb4:1 d5:1 a4:1 g4:1 | e4:1 g4:1 c5:1 r:1", {step:1,vel:.85});
export default track('menu', 82, 32, voices, [
  {voice:'bell',notes:melody},
  {voice:'pad',notes:pads},
  {voice:'bass',notes:bass},
  {voice:'pluck',notes:arpeggio},
]);
