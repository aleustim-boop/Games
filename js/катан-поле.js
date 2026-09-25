'use strict';
(function(){
  const П=КатанПравила,Г=П.Г,NS='http://www.w3.org/2000/svg',R=83;
  const xy=v=>[450+(v.x*Math.sqrt(3)/2-v.y*.5)*R,420+(v.x*.5+v.y*Math.sqrt(3)/2)*R*.9];
  function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
  function поле(svg,v,mode,act,prefix=''){
    const direct=mode==='direct';
    const defs=node('defs');
    const pawnGradient=node('radialGradient',{id:prefix+'черная-фигура',cx:'.3',cy:'.2',r:'.85'});pawnGradient.append(node('stop',{offset:'0','stop-color':'#6d7d83'}),node('stop',{offset:'.4','stop-color':'#27333a'}),node('stop',{offset:'1','stop-color':'#070b0e'}));defs.append(pawnGradient);
    const water=node('pattern',{id:prefix+'океан',width:1,height:1,viewBox:'768 0 768 1024',preserveAspectRatio:'xMidYMid slice'});water.append(node('image',{href:'img/катан/материалы-v3.webp',width:1536,height:1024}));defs.append(water);
    for(let r=0;r<6;r++){const p=node('pattern',{id:`${prefix}земля-${r}`,width:1,height:1,viewBox:`${r%3*512} ${Math.floor(r/3)*512} 512 512`,preserveAspectRatio:'xMidYMid slice'});p.append(node('image',{href:'img/катан/земли-v4.webp',width:1536,height:1024}));defs.append(p);}
    const timber=node('pattern',{id:prefix+'причал',width:1,height:1,viewBox:'0 0 768 1024',preserveAspectRatio:'xMidYMid slice'});timber.append(node('image',{href:'img/катан/материалы-v3.webp',width:1536,height:1024}));defs.append(timber);
    // Атлас отрисованных деревянных фигур. Контур при показе обрезает студийный фон.
    const silhouettes=[
      '68,246 195,119 330,196 329,363 202,431 69,391',
      '48,88 69,76 70,53 107,40 143,58 145,81 164,70 193,84 193,132 218,121 220,103 250,90 284,108 286,129 315,112 347,130 347,308 219,361 47,287'
    ];
    for(let owner=0;owner<4;owner++)for(let level=1;level<=2;level++){
      const id=`${prefix}фигура-${owner}-${level}`,paint=node('pattern',{id:id+'-краска',width:1,height:1,viewBox:level===1?'68 119 262 312':'47 40 300 321',preserveAspectRatio:'none'});
      paint.append(node('image',{href:'img/катан/фигуры-v4.webp',x:-owner*384,y:-(level-1)*512,width:1536,height:1024}));defs.append(paint);
      const piece=node('symbol',{id,viewBox:level===1?'55 105 285 340':'35 25 320 365'});piece.append(node('polygon',{points:silhouettes[level-1],fill:`url(#${id}-краска)`}));defs.append(piece);
    }
    for(let r=0;r<6;r++){const p=node('pattern',{id:`${prefix}ресурс-${r}`,width:1,height:1,viewBox:`${r%3*512} ${Math.floor(r/3)*512} 512 512`,preserveAspectRatio:'xMidYMid slice'});p.append(node('image',{href:'img/катан/ресурсы-v2.webp',width:1536,height:1024}));defs.append(p);}
    const shadows=node('filter',{id:prefix+'тень-фигуры',x:'-50%',y:'-50%',width:'200%',height:'200%'});shadows.append(node('feDropShadow',{dx:0,dy:4,stdDeviation:2,'flood-opacity':.6}));defs.append(shadows);
    const existing=svg.querySelector('defs');
    if(existing){for(const child of [...svg.children])if(child!==existing)child.remove();}else svg.replaceChildren(defs);
    svg.setAttribute('viewBox','0 0 900 840');
    svg.append(node('image',{href:'img/катан/окружение-v4.webp',x:0,y:0,width:900,height:840,preserveAspectRatio:'none','aria-hidden':'true'}));
    // Единый контур берега: вода, прибой и толщина острова под игровыми гексами.
    const coast=Г.edges.filter(e=>e.hexes.length===1),outline=[coast[0].a];let at=coast[0].b,prev=coast[0].id;
    while(at!==outline[0]){outline.push(at);const next=coast.find(e=>e.id!==prev&&(e.a===at||e.b===at));if(!next)break;at=next.a===at?next.b:next.a;prev=next.id;}
    const shore=outline.map(id=>xy(Г.vertices[id]).join(',')).join(' ');
    svg.append(node('polygon',{points:shore,transform:'translate(0 9)',fill:'#8b613d',stroke:'#493624','stroke-width':8,'stroke-linejoin':'round'}));
    svg.append(node('polygon',{points:shore,fill:'#dcc293',stroke:'#efd09b','stroke-width':6,'stroke-linejoin':'round'}));
    const lastRoll=v.log.slice().reverse().find(e=>e.type==='roll'),production=lastRoll&&v.dice&&lastRoll.id===v.serial?П.сумма(v.dice):0;
    for(const h of v.hexes){
      const geom=Г.hexes[h.id],[x,y]=xy(geom),group=node('g',{'class':'кат-гекс','data-hex':h.id});
      group.append(node('title',{},['Лес — дерево','Холмы — глина','Пастбище — шерсть','Поля — зерно','Горы — руда','Пустыня'][h.resource]+(h.number?` · бросок ${h.number}`:'')+(h.id===v.robber?' · заблокировано разбойником':'')));
      const points=geom.vertices.map(id=>{const [vx,vy]=xy(Г.vertices[id]);return [x+(vx-x)*.95,y+(vy-y)*.95].join(',');}).join(' ');
      const path=node('polygon',{points,fill:`url(#${prefix}земля-${h.resource})`,'class':'кат-земля'});group.append(path);
      group.append(node('text',{x,y:y-36,'class':'кат-название-земли'},['Дерево','Глина','Шерсть','Зерно','Руда','Пустыня'][h.resource]));
      if(production===h.number&&h.id!==v.robber)group.append(node('polygon',{points,fill:'none','class':'кат-производство'}));
      if(h.number){
        group.append(node('circle',{cx:x,cy:y+22,r:25,'class':'кат-номер-фон'}));
        group.append(node('text',{x,y:y+26,'class':[6,8].includes(h.number)?'кат-номер кат-красный':'кат-номер'},h.number));
        group.append(node('text',{x,y:y+40,'class':'кат-вероятность'},'•'.repeat(6-Math.abs(7-h.number))));
      }
      if(h.id===v.robber){const robber=node('g',{transform:`translate(${x},${y-16})`,'class':'кат-разбойник',style:'stroke:none'});robber.append(node('ellipse',{cx:3,cy:22,rx:20,ry:8,fill:'#20150670'}),node('ellipse',{cx:0,cy:18,rx:17,ry:9,fill:`url(#${prefix}черная-фигура)`}),node('path',{d:'M-14 14Q-7 1-8-9H8Q7 1 14 14Q0 24-14 14Z',fill:`url(#${prefix}черная-фигура)`}),node('circle',{cx:0,cy:-17,r:12,fill:`url(#${prefix}черная-фигура)`}));robber.append(node('title',{},'Разбойник: производство заблокировано'));group.append(robber);}
      if(mode==='robber'&&v.turn===v.me&&(v.legal.robber||v.hexes.filter(h=>h.id!==v.robber).map(h=>h.id)).includes(h.id)){path.classList.add('доступно');group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`Разбойник: гекс ${h.id+1}`);group.onclick=()=>act({type:'robber',hex:h.id});group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();group.onclick();}};}
      svg.append(group);
    }
    for(const port of v.ports){
      const edge=Г.edges[port.edge],a=Г.vertices[edge.a],b=Г.vertices[edge.b],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},len=Math.hypot(mid.x,mid.y),center=xy({x:mid.x+mid.x/len*.7,y:mid.y+mid.y/len*.7}),group=node('g',{'class':'кат-порт'});
      for(const id of [edge.a,edge.b]){const [x,y]=xy(Г.vertices[id]);group.append(node('line',{x1:x,y1:y,x2:center[0],y2:center[1]}));}
      const specific=port.resource>=0;
      const [cx,cy]=center;
      group.append(node('path',{d:`M${cx-34} ${cy+12}L${cx+26} ${cy+12}L${cx+36} ${cy+28}L${cx-27} ${cy+28}Z`,fill:`url(#${prefix}причал)`,stroke:'#603718','stroke-width':3}));
      for(const dx of [-26,25]){group.append(node('rect',{x:cx+dx-4,y:cy+17,width:8,height:24,rx:2,style:'fill:#956335;stroke:#573518;stroke-width:2'}),node('ellipse',{cx:cx+dx,cy:cy+18,rx:5,ry:3,fill:'#ca9a59'}));}
      group.append(node('path',{d:`M${cx} ${cy-33}L${cx+30} ${cy-19}V${cy+16}L${cx} ${cy+31}L${cx-30} ${cy+16}V${cy-19}Z`,fill:'#edcc9b',stroke:'#895a32','stroke-width':3}));
      if(specific){group.append(node('rect',{x:cx-20,y:cy-25,width:40,height:36,rx:4,style:`fill:url(#${prefix}ресурс-${port.resource});stroke:none`}));group.append(node('text',{x:cx,y:cy+24,style:'font-size:16px'},'2:1'));}
      else group.append(node('text',{x:cx,y:cy+8},'3:1'));
      group.append(node('title',{},port.resource<0?'Порт: любые три одинаковых ресурса за один':'Порт: '+['лес','глина','шерсть','зерно','руда'][port.resource]+' 2:1'));svg.append(group);
    }
    for(const e of Г.edges){
      const [x1,y1]=xy(Г.vertices[e.a]),[x2,y2]=xy(Г.vertices[e.b]),owner=v.roads[e.id],enabled=(mode==='road'||direct)&&v.legal.road.includes(e.id);
      if(owner<0&&!enabled)continue;
      const line=node('line',{x1:x1+(x2-x1)*.17,y1:y1+(y2-y1)*.17,x2:x2-(x2-x1)*.17,y2:y2-(y2-y1)*.17,'class':owner>=0?`кат-дорога цвет-${owner}`:'кат-дорога доступно','data-edge':e.id});
      if(enabled){
        const target=node('g',{'data-edge':e.id,role:'button',tabindex:0,'aria-label':'Построить дорогу '+e.id});
        const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),nx=-dy/len*15,ny=dx/len*15;
        target.append(node('polygon',{points:[[x1+nx,y1+ny],[x2+nx,y2+ny],[x2-nx,y2-ny],[x1-nx,y1-ny]].map(p=>p.join(',')).join(' '),fill:'transparent'}),line);
        target.onclick=()=>act({type:'road',edge:e.id});target.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();target.onclick();}};svg.append(target);
      }else{const group=node('g',{'class':`кат-путь цвет-${owner}`});const base=line.cloneNode();base.setAttribute('class','кат-дорога-основание');base.setAttribute('transform','translate(0 3)');const shine=line.cloneNode();shine.setAttribute('class','кат-дорога-блик');shine.setAttribute('transform','translate(0 -2)');group.append(base,line,shine);svg.append(group);}
    }
    for(const vert of Г.vertices){
      const b=v.buildings[vert.id],[x,y]=xy(vert),type=direct?(b?'city':'settlement'):mode,enabled=['city','settlement'].includes(type)&&v.legal[type].includes(vert.id);
      if(!b&&!enabled)continue;
      const group=node('g',{transform:`translate(${x},${y})`,'data-vertex':vert.id,'class':`кат-постройка ${b?'цвет-'+b.owner:''} ${enabled?'доступно':''}`});
      if(enabled)group.append(node('circle',{r:27,fill:'transparent'}));
      if(b){
        group.append(node('ellipse',{cx:0,cy:7,rx:b.level===1?20:26,ry:8,fill:'#20170766'}));
        group.append(node('use',{href:`#${prefix}фигура-${b.owner}-${b.level}`,x:b.level===1?-24:-29,y:b.level===1?-49:-55,width:b.level===1?48:58,height:b.level===1?58:66,'class':'кат-фигура'}));
        group.append(node('title',{},`${v.names?.[b.owner]||'Игрок '+(b.owner+1)}: ${b.level===1?'поселение, 1 очко':'город, 2 очка'}`));
      }else{group.append(node('circle',{r:9,'class':'кат-точка'}));}
      if(enabled){group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`${type==='city'?'Город':'Поселение'} ${vert.id}`);group.onclick=()=>act({type,vertex:vert.id});group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();group.onclick();}};}
      svg.append(group);
    }
  }
  window.КатанПоле={рисовать:поле};
})();
