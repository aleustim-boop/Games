'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Sudoku=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const ALL=511,levels=['easy','medium','hard','expert'];
 const units=[];
 for(let r=0;r<9;r++)units.push(Array.from({length:9},(_,c)=>r*9+c));
 for(let c=0;c<9;c++)units.push(Array.from({length:9},(_,r)=>r*9+c));
 for(let b=0;b<9;b++)units.push(Array.from({length:9},(_,i)=>(Math.floor(b/3)*3+Math.floor(i/3))*9+b%3*3+i%3));
 const peers=Array.from({length:81},(_,i)=>[...new Set(units.filter(u=>u.includes(i)).flat())].filter(j=>j!==i));
 const bits=m=>Array.from({length:9},(_,i)=>i+1).filter(n=>m&(1<<(n-1)));
 const valid=b=>Array.isArray(b)&&b.length===81&&b.every(n=>Number.isInteger(n)&&n>=0&&n<=9);
 const conflicts=b=>b.map((v,i)=>v&&peers[i].some(j=>b[j]===v)?i:-1).filter(i=>i>=0);
 const candidates=(b,i)=>b[i]?0:peers[i].reduce((m,j)=>b[j]?m&~(1<<(b[j]-1)):m,ALL);
 function solve(input,limit=2){
  if(!valid(input)||conflicts(input).length)return {count:0,solution:null};
  const b=input.slice();let count=0,solution=null;
  function visit(){let index=-1,choices=null;for(let i=0;i<81;i++)if(!b[i]){const nums=bits(candidates(b,i));if(!nums.length)return;if(!choices||nums.length<choices.length){index=i;choices=nums;if(nums.length===1)break;}}
   if(index<0){count++;solution=b.slice();return;}for(const n of choices){b[index]=n;visit();if(count>=limit)break;}b[index]=0;
  }visit();return {count,solution};
 }
 // Grade by the strongest technique needed by this logical solver.
 function logic(input){const b=input.slice(),m=b.map((_,i)=>candidates(b,i));let grade=0;const steps=[];
  function put(i,n,technique){b[i]=n;m[i]=0;for(const j of peers[i])m[j]&=~(1<<(n-1));steps.push({index:i,value:n,technique:grade>=2?'deduction':technique});}
  while(b.includes(0)){
   let changed=false;
   for(let i=0;i<81;i++)if(!b[i]&&bits(m[i]).length===1){put(i,bits(m[i])[0],'single');changed=true;break;}
   if(changed)continue;
   for(const u of units){for(let n=1;n<=9;n++){const places=u.filter(i=>!b[i]&&(m[i]&(1<<(n-1))));if(places.length===1){put(places[0],n,'hidden');grade=Math.max(grade,1);changed=true;break;}}if(changed)break;}
   if(changed)continue;
   // Locked candidates: a digit confined to the intersection of two units.
   for(const a of units){for(let n=1;n<=9;n++){const mask=1<<(n-1),places=a.filter(i=>!b[i]&&(m[i]&mask));if(places.length<2)continue;for(const u of units){if(u===a||!places.every(i=>u.includes(i)))continue;for(const j of u)if(!a.includes(j)&&(m[j]&mask)){m[j]&=~mask;changed=true;}}}if(changed)break;}
   if(changed){grade=Math.max(grade,2);continue;}
   for(const u of units){for(const i of u)if(bits(m[i]).length===2){const pair=u.filter(j=>m[j]===m[i]);if(pair.length===2)for(const j of u)if(!pair.includes(j)&&(m[j]&m[i])){m[j]&=~m[i];changed=true;}}if(changed)break;}
   if(changed){grade=Math.max(grade,2);continue;}
   return {level:'expert',steps,board:b};
  }return {level:levels[grade],steps,board:b};
 }
 function rng(seed){let s=(seed>>>0)||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
 function shuffle(a,random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function generate(seed,target=28){const random=rng(seed),digits=shuffle([1,2,3,4,5,6,7,8,9],random),order=()=>shuffle([0,1,2],random).flatMap(b=>shuffle([0,1,2],random).map(i=>b*3+i)),rows=order(),cols=order();
  const solution=rows.flatMap(r=>cols.map(c=>digits[(r*3+Math.floor(r/3)+c)%9])),puzzle=solution.slice();let left=81;
  for(const i of shuffle(Array.from({length:81},(_,i)=>i),random)){const n=puzzle[i];puzzle[i]=0;if(solve(puzzle).count!==1)puzzle[i]=n;else left--;if(left<=target)break;}
  return {puzzle,solution,level:logic(puzzle).level};
 }
 function create(level,bank,seed){if(!levels.includes(level)||!bank[level]?.length)throw Error('Unknown Sudoku level');const random=rng(seed),source=bank[level][Math.floor(random()*bank[level].length)],digits=shuffle([1,2,3,4,5,6,7,8,9],random),order=()=>shuffle([0,1,2],random).flatMap(b=>shuffle([0,1,2],random).map(i=>b*3+i)),rows=order(),cols=order(),transpose=random()<.5;
  const puzzle=rows.flatMap(r=>cols.map(c=>{const n=Number(source[transpose?c*9+r:r*9+c]);return n?digits[n-1]:0;})),solution=solve(puzzle,1).solution;
  return {version:1,level,puzzle,solution,board:puzzle.slice(),notes:Array(81).fill(0),history:[],seconds:0,hints:0,completed:false};
 }
 function snapshot(s){return {board:s.board.slice(),notes:s.notes.slice()};}
 function enter(s,i,n,note=false){if(s.completed||!Number.isInteger(i)||i<0||i>80||!Number.isInteger(n)||n<0||n>9||s.puzzle[i]||(note&&s.board[i]))return false;
  if(!note&&s.board[i]===n&&!s.notes[i])return false;
  s.history.push(snapshot(s));if(s.history.length>200)s.history.shift();
  if(note&&n)s.notes[i]^=1<<(n-1);else{s.board[i]=n;s.notes[i]=0;if(n)for(const j of peers[i])s.notes[j]&=~(1<<(n-1));}
  s.completed=s.board.every((v,j)=>v===s.solution[j]);return true;
 }
 function undo(s){if(s.completed||!s.history.length)return false;const prev=s.history.pop();s.board=prev.board;s.notes=prev.notes;return true;}
 function hint(s,selected){const wrong=s.board.findIndex((v,i)=>v&&v!==s.solution[i]);if(wrong>=0)return {index:wrong,value:s.solution[wrong],technique:'correction'};
  const step=logic(s.board).steps[0];if(step)return step;
  const i=Number.isInteger(selected)&&!s.board[selected]?selected:s.board.indexOf(0);return i>=0?{index:i,value:s.solution[i],technique:'reveal'}:null;
 }
 function restore(raw){if(!raw||raw.version!==1||!levels.includes(raw.level)||!valid(raw.puzzle)||!valid(raw.board))return null;
  if(raw.puzzle.some((v,i)=>v&&v!==raw.board[i]))return null;const solved=solve(raw.puzzle);if(solved.count!==1)return null;
  const notesOK=n=>Array.isArray(n)&&n.length===81&&n.every(v=>Number.isInteger(v)&&v>=0&&v<=ALL);
  const s={version:1,level:raw.level,puzzle:raw.puzzle.slice(),solution:solved.solution,board:raw.board.slice(),notes:notesOK(raw.notes)?raw.notes.slice():Array(81).fill(0),history:[],seconds:Number.isFinite(raw.seconds)?Math.min(31536000,Math.max(0,raw.seconds)):0,hints:Number.isSafeInteger(raw.hints)&&raw.hints>=0?raw.hints:0};
  s.history=Array.isArray(raw.history)?raw.history.slice(-200).filter(h=>valid(h?.board)&&notesOK(h.notes)&&!s.puzzle.some((v,i)=>v&&h.board[i]!==v)).map(h=>({board:h.board.slice(),notes:h.notes.slice()})):[];
  s.completed=s.board.every((v,i)=>v===s.solution[i]);return s;
 }
 return {levels,units,peers,bits,conflicts,candidates,solve,logic,generate,create,enter,undo,hint,restore};
});
