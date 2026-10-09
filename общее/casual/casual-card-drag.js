'use strict';
window.CasualCardDrag=(s,api,S)=>{
 const board=api.board,dests=[],sources=new Map();
 function destination(el,area,pile){if(!el)return;el.dataset.destination=area;el.dataset.destinationPile=pile;dests.push(el);if(api.view.selection&&S.legal(s,{type:'move',from:api.view.selection,to:{area,pile}}))el.classList.add('legal-destination');}
 function source(el,from){if(!el||!el.matches('[data-card]'))return;el.dataset.dragSource='1';sources.set(el,from);}
 board.querySelectorAll('.card-pile').forEach(col=>{destination(col,'piles',Number(col.dataset.pile));col.querySelectorAll('[data-card]').forEach(el=>source(el,{area:'piles',pile:Number(el.dataset.pile),index:Number(el.dataset.index)}));});
 for(const [selector,area]of [['.free-cells','cells'],['.foundations','foundations']])board.querySelector(selector)?.childNodes.forEach((el,i)=>{destination(el,area,i);source(el,{area,pile:i,index:s[area][i].length-1});});
 if(s.kind==='klondike')source(board.querySelector('.solitaire-top>.card-slot'),{area:'waste',pile:0,index:s.waste.length-1});
 let drag=null;
 const cleanup=()=>{if(!drag)return;drag.ghost?.remove();drag.elements?.forEach(e=>e.classList.remove('card-lifted'));dests.forEach(e=>e.classList.remove('drop-target','drag-legal'));drag=null;};
 api.view.cancelPointer=cleanup;
 board.onpointerdown=e=>{if(e.button!==0)return;const el=e.target.closest('[data-drag-source]'),from=sources.get(el),cards=from&&S.source(s,from)?.slice(from.index);if(!cards||!S.sequence(s,cards))return;drag={el,from,x:e.clientX,y:e.clientY,rect:el.getBoundingClientRect(),moved:false};};
 board.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<7)return;if(!drag.moved){drag.moved=true;board.setPointerCapture(e.pointerId);drag.elements=drag.from.area==='piles'?[...drag.el.parentElement.querySelectorAll('[data-card]')].filter(el=>Number(el.dataset.index)>=drag.from.index):[drag.el];const ghost=document.createElement('div');ghost.className='card-drag-ghost';Object.assign(ghost.style,{left:drag.rect.x+'px',top:drag.rect.y+'px',width:drag.rect.width+'px',height:drag.rect.height+'px'});drag.elements.forEach(el=>{const clone=el.cloneNode(true),r=el.getBoundingClientRect();clone.classList.remove('selected-item');clone.removeAttribute('data-drag-source');Object.assign(clone.style,{position:'absolute',left:'0',top:r.y-drag.rect.y+'px',width:drag.rect.width+'px',height:drag.rect.height+'px'});ghost.append(clone);el.classList.add('card-lifted');});document.querySelector('.casual-app').append(ghost);drag.ghost=ghost;dests.forEach(el=>el.classList.toggle('drag-legal',S.legal(s,{type:'move',from:drag.from,to:{area:el.dataset.destination,pile:Number(el.dataset.destinationPile)}})));}
  drag.ghost.style.translate=dx+'px '+dy+'px';const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-destination]');dests.forEach(el=>el.classList.toggle('drop-target',el===target&&el.classList.contains('drag-legal')));
 };
 board.onpointerup=e=>{if(!drag?.moved){cleanup();return;}const from=drag.from,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-destination]');api.view.cardSuppressUntil=performance.now()+400;api.view.selection=null;cleanup();if(target&&api.send({type:'move',from,to:{area:target.dataset.destination,pile:Number(target.dataset.destinationPile)}})){api.message('Карты на месте.');}else{api.redraw();api.message('Сюда перенести нельзя. Карты вернулись на место.');}};
 board.onpointercancel=cleanup;
};
