'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Nonogram=factory();})(globalThis,()=>{
 const sizes={easy:5,medium:10,hard:15};
 function runs(line){const result=[];let length=0;for(const value of [...line,0]){if(value===1)length++;else if(length){result.push(length);length=0;}}return result.length?result:[0];}
 function clues(solution,n){return {rows:Array.from({length:n},(_,r)=>runs(solution.slice(r*n,r*n+n))),cols:Array.from({length:n},(_,c)=>runs(Array.from({length:n},(_,r)=>solution[r*n+c])))};}
 function patterns(numbers,n){if(numbers.length===1&&numbers[0]===0)return [0];const out=[];
  function place(k,start,mask){if(k===numbers.length){out.push(mask);return;}const remaining=numbers.slice(k).reduce((a,b)=>a+b,0)+numbers.length-k-1;
   for(let x=start;x<=n-remaining;x++)place(k+1,x+numbers[k]+1,mask|((1<<numbers[k])-1)<<x);
  }place(0,0,0);return out;
 }
 function possibilities(line,numbers,n){return patterns(numbers,n).filter(mask=>line.every((v,i)=>v===0||(v===1)===!!(mask&(1<<i))));}
 function solve(hints,n,limit=2){let count=0,solution=null,nodes=0;
  function search(rows,cols){if(++nodes>100000)throw Error('Nonogram search limit');let changed=true;
   while(changed){changed=false;if(rows.some(a=>!a.length)||cols.some(a=>!a.length))return;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
     const rowOne=rows[r].some(p=>p&(1<<c)),rowZero=rows[r].some(p=>!(p&(1<<c))),colOne=cols[c].some(p=>p&(1<<r)),colZero=cols[c].some(p=>!(p&(1<<r)));
     const rr=rows[r].filter(p=>p&(1<<c)?colOne:colZero),cc=cols[c].filter(p=>p&(1<<r)?rowOne:rowZero);
     if(!rr.length||!cc.length)return;if(rr.length!==rows[r].length||cc.length!==cols[c].length)changed=true;rows[r]=rr;cols[c]=cc;
    }
   }
   let best=null;for(const [axis,lines]of [['row',rows],['col',cols]])lines.forEach((a,i)=>{if(a.length>1&&(!best||a.length<best.values.length))best={axis,i,values:a};});
   if(!best){count++;solution=rows.flatMap(a=>Array.from({length:n},(_,i)=>a[0]&(1<<i)?1:0));return;}
   for(const mask of best.values){const r=rows.map(a=>a.slice()),c=cols.map(a=>a.slice());(best.axis==='row'?r:c)[best.i]=[mask];search(r,c);if(count>=limit)return;}
  }search(hints.rows.map(a=>patterns(a,n)),hints.cols.map(a=>patterns(a,n)));return {count,solution,nodes};
 }
 function logicalStep(board,hints,n){for(const axis of ['row','col'])for(let line=0;line<n;line++){
  const indices=Array.from({length:n},(_,i)=>axis==='row'?line*n+i:i*n+line),values=indices.map(i=>board[i]),options=possibilities(values,hints[axis==='row'?'rows':'cols'][line],n);if(!options.length)continue;
  for(let j=0;j<n;j++)if(!values[j]){const filled=options.every(p=>p&(1<<j)),empty=options.every(p=>!(p&(1<<j)));if(filled||empty)return {index:indices[j],value:filled?1:-1,axis,line,options:options.length};}
 }return null;}
 function logicalSolve(hints,n){const board=Array(n*n).fill(0);let steps=0;while(true){const next=logicalStep(board,hints,n);if(!next)break;board[next.index]=next.value;steps++;}return {solved:!board.includes(0),board,steps};}
 function create(puzzle){const n=sizes[puzzle.level],solution=[...puzzle.pattern].map(Number);if(solution.length!==n*n||solution.some(v=>v!==0&&v!==1))throw Error('Invalid puzzle');return {version:1,id:puzzle.id,level:puzzle.level,n,solution,clues:clues(solution,n),board:Array(n*n).fill(0),history:[],future:[],seconds:0,hints:0,checks:0,completed:false};}
 function apply(s,changes){if(s.completed)return false;const board=s.board.slice();for(const {index,value}of changes)if(Number.isInteger(index)&&index>=0&&index<board.length&&[-1,0,1].includes(value))board[index]=value;if(board.every((v,i)=>v===s.board[i]))return false;
  s.history.push(s.board.slice());if(s.history.length>100)s.history.shift();s.future=[];s.board=board;s.completed=board.every((v,i)=>(v===1)===(s.solution[i]===1));return true;
 }
 function undo(s){if(s.completed||!s.history.length)return false;s.future.push(s.board.slice());s.board=s.history.pop();return true;}
 function redo(s){if(s.completed||!s.future.length)return false;s.history.push(s.board.slice());s.board=s.future.pop();s.completed=s.board.every((v,i)=>(v===1)===(s.solution[i]===1));return true;}
 function mistakes(s){return s.board.map((v,i)=>v!==0&&((v===1)!==(s.solution[i]===1))?i:-1).filter(i=>i>=0);}
 function hint(s){const wrong=mistakes(s)[0];if(wrong!==undefined)return {index:wrong,value:s.solution[wrong]?1:-1,kind:'correction'};const step=logicalStep(s.board,s.clues,s.n);if(step)return {...step,kind:'logic'};const i=s.board.findIndex((v,i)=>v===0&&s.solution[i]);return i>=0?{index:i,value:1,kind:'reveal'}:null;}
 function restore(raw,bank){if(!raw||raw.version!==1)return null;const puzzle=bank.find(p=>p.id===raw.id);if(!puzzle)return null;const s=create(puzzle),valid=a=>Array.isArray(a)&&a.length===s.n*s.n&&a.every(v=>[-1,0,1].includes(v));if(!valid(raw.board))return null;s.board=raw.board.slice();for(const key of ['history','future'])s[key]=Array.isArray(raw[key])?raw[key].slice(-100).filter(valid).map(a=>a.slice()):[];s.seconds=Number.isFinite(raw.seconds)?Math.min(31536000,Math.max(0,raw.seconds)):0;for(const key of ['hints','checks'])s[key]=Number.isSafeInteger(raw[key])&&raw[key]>=0?raw[key]:0;s.completed=s.board.every((v,i)=>(v===1)===(s.solution[i]===1));return s;}
 return {sizes,runs,clues,patterns,possibilities,solve,logicalStep,logicalSolve,create,apply,undo,redo,mistakes,hint,restore};
});
