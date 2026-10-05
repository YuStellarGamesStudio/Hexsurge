import { track, line, chord, midi, repeat } from '../compose.js';
import { voices } from '../voices.js';
// Eight-bar harmony; the answering phrase resolves back into the opening motif.
const progression = [["d3","minor"],["bb2","major"],["g2","minor"],["a2","major"],["d3","minor"],["f2","major"],["bb2","major"],["a2","major"]];
const pads = progression.flatMap(([root, quality], i) => chord(root, quality, i*4, 3.55, .6));
const bass = progression.flatMap(([root],i) => [[i*4,midi(root)-12,.7,.85],[i*4+2,midi(root)-5,.55,.65]]);
const arpeggio = progression.flatMap(([root,quality],i) => chord(root,quality,0,1).flatMap(([,n],j) => [[i*4+j*.5,n+12,.22,.4],[i*4+2+j*.5,n+12,.22,.3]]));
const melody = line("d5:.5 a4:.5 d5:1 f5:.5 e5:.5 d5:1 | f5:1 d5:.5 bb4:.5 f5:1 r:1 | g5:.5 d5:.5 bb4:1 d5:1 g5:1 | e5:1 c#5:.5 a4:.5 e5:1 c#5:1 | a5:1 f5:.5 e5:.5 d5:1 a4:1 | c5:.5 f5:.5 a5:1 g5:1 f5:1 | d5:1 f5:1 bb5:.5 a5:.5 f5:1 | e5:.5 c#5:.5 a4:1 c#5:1 r:1", {step:1,vel:.85});
export default track('boss', 148, 32, voices, [
  {voice:'lead',notes:melody},
  {voice:'pad',notes:pads},
  {voice:'bass',notes:bass},
  {voice:'pluck',notes:arpeggio},
  {voice:'kick',notes:Array.from({length:32},(_,i)=>[i,36,.08,i%4===0?.8:.5])},
]);
