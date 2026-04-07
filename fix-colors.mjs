import fs from 'fs';

const opusPath = 'src/app/opus/page.tsx';
let opus = fs.readFileSync(opusPath, 'utf8');

opus = opus.replace(/selection:bg-purple-500\/30/g, 'selection:bg-amber-500/30');
opus = opus.replace(/bg-purple-600\/8/g, 'bg-amber-500/10');
opus = opus.replace(/bg-blue-600\/6/g, 'bg-yellow-500/10');
opus = opus.replace(/bg-gradient-to-b from-\[#A855F7\] to-\[#D946EF\]/g, 'bg-gradient-to-b from-amber-500 to-yellow-600');
opus = opus.replace(/rgba\(168,85,247,(.*?)\)/g, 'rgba(245,158,11,$1)');
opus = opus.replace(/via-purple-500\/40/g, 'via-amber-500/40');
opus = opus.replace(/ring-purple-500\/50/g, 'ring-amber-500/50');
opus = opus.replace(/from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500/g, 'from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500');
opus = opus.replace(/text-purple-400/g, 'text-amber-400');
opus = opus.replace(/bg-purple-500\/10 border border-purple-500\/30/g, 'bg-amber-500/10 border border-amber-500/30');
opus = opus.replace(/bg-purple-600 hover:bg-purple-500/g, 'bg-amber-600 hover:bg-amber-500');
opus = opus.replace(/bg-purple-500\/20/g, 'bg-amber-500/20');

fs.writeFileSync(opusPath, opus);

const sunoPath = 'src/app/suno/page.tsx';
let suno = fs.readFileSync(sunoPath, 'utf8');

suno = suno.replace(/bg-pink-600\/6/g, 'bg-amber-500/10');
suno = suno.replace(/bg-purple-600\/6/g, 'bg-yellow-500/10');
suno = suno.replace(/border-pink-500\/30/g, 'border-amber-500/30');
suno = suno.replace(/bg-pink-500\/10/g, 'bg-amber-500/10');
suno = suno.replace(/text-pink-300/g, 'text-amber-300');
suno = suno.replace(/rgba\(236,72,153,(.*?)\)/g, 'rgba(245,158,11,$1)');
suno = suno.replace(/text-pink-500/g, 'text-amber-500');
suno = suno.replace(/bg-pink-500 text-white border-pink-500 hover:bg-pink-600/g, 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600');
suno = suno.replace(/ring-pink-500\/50/g, 'ring-amber-500/50');
suno = suno.replace(/text-pink-400/g, 'text-amber-400');
suno = suno.replace(/from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700/g, 'from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700');
suno = suno.replace(/from-pink-500 to-purple-500/g, 'from-amber-500 to-yellow-500');
suno = suno.replace(/via-pink-500\/60/g, 'via-amber-500/60');
suno = suno.replace(/text-pink-600/g, 'text-amber-600');
suno = suno.replace(/bg-pink-600/g, 'bg-amber-600');
suno = suno.replace(/bg-purple-600/g, 'bg-yellow-600');

fs.writeFileSync(sunoPath, suno);

console.log("Colors replaced successfully!");
