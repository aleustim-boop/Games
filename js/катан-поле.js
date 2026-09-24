'use strict';
(function(){
  const П=КатанПравила,Г=П.Г,NS='http://www.w3.org/2000/svg',R=76;
  const xy=v=>[450+v.x*R,420+v.y*R];
  function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
  function поле(svg,v,mode,act){
    const defs=node('defs');
    for(let r=0;r<6;r++){const p=node('pattern',{id:`земля-${r}`,width:1,height:1,viewBox:`${r%3*512} ${Math.floor(r/3)*512} 512 512`,preserveAspectRatio:'xMidYMid slice'});p.append(node('image',{href:'img/катан/земли-v2.jpg',width:1536,height:1024}));defs.append(p);}
    for(let r=0;r<6;r++){const p=node('pattern',{id:`ресурс-${r}`,width:1,height:1,viewBox:`${r%3*512} ${Math.floor(r/3)*512} 512 512`,preserveAspectRatio:'xMidYMid slice'});p.append(node('image',{href:'img/катан/ресурсы-v2.jpg',width:1536,height:1024}));defs.append(p);}
    const shadows=node('filter',{id:'тень-фигуры',x:'-50%',y:'-50%',width:'200%',height:'200%'});shadows.append(node('feDropShadow',{dx:0,dy:4,stdDeviation:2,'flood-opacity':.6}));defs.append(shadows);
    const existing=svg.querySelector('defs');
    if(existing){for(const child of [...svg.children])if(child!==existing)child.remove();}else svg.replaceChildren(defs);
    svg.setAttribute('viewBox','15 35 870 770');
    // Единый контур берега: вода, прибой и толщина острова под игровыми гексами.
    const coast=Г.edges.filter(e=>e.hexes.length===1),outline=[coast[0].a];let at=coast[0].b,prev=coast[0].id;
    while(at!==outline[0]){outline.push(at);const next=coast.find(e=>e.id!==prev&&(e.a===at||e.b===at));if(!next)break;at=next.a===at?next.b:next.a;prev=next.id;}
    const shore=outline.map(id=>xy(Г.vertices[id]).join(',')).join(' ');
    const sea=node('g',{'class':'кат-прибой','aria-hidden':'true'});
    sea.append(node('polygon',{points:shore,fill:'#24747a',stroke:'#2e777b','stroke-width':55,'stroke-linejoin':'round',opacity:.22}),node('polygon',{points:shore,fill:'none',stroke:'#8ae0cc','stroke-width':27,'stroke-linejoin':'round',opacity:.18}));svg.append(sea);
    svg.append(node('polygon',{points:shore,transform:'translate(0 12)',fill:'#796246',stroke:'#3c5045','stroke-width':10,'stroke-linejoin':'round'}));
    svg.append(node('polygon',{points:shore,fill:'#d4c69a',stroke:'#e5d7ad','stroke-width':9,'stroke-linejoin':'round'}));
    const lastRoll=v.log.slice().reverse().find(e=>e.type==='roll'),production=lastRoll&&v.dice&&lastRoll.id===v.serial?П.сумма(v.dice):0;
    for(const h of v.hexes){
      const geom=Г.hexes[h.id],[x,y]=xy(geom),group=node('g',{'class':'кат-гекс','data-hex':h.id});
      group.append(node('title',{},['Лес — дерево','Холмы — глина','Пастбище — шерсть','Поля — зерно','Горы — руда','Пустыня'][h.resource]+(h.number?` · бросок ${h.number}`:'')+(h.id===v.robber?' · заблокировано разбойником':'')));
      const points=geom.vertices.map(id=>{const [vx,vy]=xy(Г.vertices[id]);return [x+(vx-x)*.975,y+(vy-y)*.975].join(',');}).join(' ');
      const path=node('polygon',{points,fill:`url(#земля-${h.resource})`,'class':'кат-земля'});group.append(path);
      if(production===h.number&&h.id!==v.robber)group.append(node('polygon',{points,fill:'none','class':'кат-производство'}));
      if(h.number){
        group.append(node('circle',{cx:x,cy:y+22,r:25,'class':'кат-номер-фон'}));
        group.append(node('text',{x,y:y+26,'class':[6,8].includes(h.number)?'кат-номер кат-красный':'кат-номер'},h.number));
        group.append(node('text',{x,y:y+40,'class':'кат-вероятность'},'•'.repeat(6-Math.abs(7-h.number))));
      }
      if(h.id===v.robber){const robber=node('g',{transform:`translate(${x},${y-23})`,'class':'кат-разбойник'});robber.append(node('ellipse',{cx:0,cy:24,rx:20,ry:8,fill:'#0a171bcc',stroke:'none'}),node('path',{d:'M-16 22L-11 2Q-16-4-10-18Q0-32 10-18Q16-4 11 2L16 22Q0 31-16 22Z'}),node('path',{d:'M-6-9Q0-18 6-9L4-3H-4Z',fill:'#d9c4a0',stroke:'none'}));robber.append(node('title',{},'Разбойник: производство заблокировано'));group.append(robber);}
      if(mode==='robber'&&v.turn===v.me&&h.id!==v.robber){path.classList.add('доступно');group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`Разбойник: гекс ${h.id+1}`);group.onclick=()=>act({type:'robber',hex:h.id});group.onkeydown=e=>{if(e.key==='Enter')group.onclick();};}
      svg.append(group);
    }
    for(const port of v.ports){
      const edge=Г.edges[port.edge],a=Г.vertices[edge.a],b=Г.vertices[edge.b],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},len=Math.hypot(mid.x,mid.y),center=xy({x:mid.x+mid.x/len*.7,y:mid.y+mid.y/len*.7}),group=node('g',{'class':'кат-порт'});
      for(const id of [edge.a,edge.b]){const [x,y]=xy(Г.vertices[id]);group.append(node('line',{x1:x,y1:y,x2:center[0],y2:center[1]}));}
      const specific=port.resource>=0;
      group.append(node('rect',{x:center[0]-43,y:center[1]-22,width:86,height:44,rx:14}));
      group.append(node('rect',{x:center[0]-37,y:center[1]-17,width:34,height:34,rx:9,style:`fill:url(#ресурс-${specific?port.resource:5});stroke:none`}));
      group.append(node('text',{x:center[0]+19,y:center[1]+7},specific?'2:1':'3:1'));
      group.append(node('title',{},port.resource<0?'Порт: любые три одинаковых ресурса за один':'Порт: '+['лес','глина','шерсть','зерно','руда'][port.resource]+' 2:1'));svg.append(group);
    }
    for(const e of Г.edges){
      const [x1,y1]=xy(Г.vertices[e.a]),[x2,y2]=xy(Г.vertices[e.b]),owner=v.roads[e.id],enabled=mode==='road'&&v.legal.road.includes(e.id);
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
      const b=v.buildings[vert.id],[x,y]=xy(vert),enabled=['city','settlement'].includes(mode)&&v.legal[mode].includes(vert.id);
      if(!b&&!enabled)continue;
      const group=node('g',{transform:`translate(${x},${y})`,'data-vertex':vert.id,'class':`кат-постройка ${b?'цвет-'+b.owner:''} ${enabled?'доступно':''}`});
      if(enabled)group.append(node('circle',{r:27,fill:'transparent'}));
      if(b){
        group.append(node('ellipse',{cx:0,cy:10,rx:b.level===1?24:29,ry:12,'class':'кат-основание'}));
        group.append(node('path',{d:'M-18-7L0-18L19-7V12L0 23L-18 12Z','class':'кат-дом'}));
        group.append(node('path',{d:'M0 2L19-7V12L0 23Z',fill:'#a69977',stroke:'#66573f','stroke-width':1.5}));
        group.append(node('path',{d:'M-22-8L-5-31L23-12L1 3Z','class':'кат-крыша'}));
        group.append(node('path',{d:'M-22-8L-5-31L-2-13L1 3Z',fill:'#ffffff35'}));
        group.append(node('path',{d:'M-12 13V4L-6 7V17M7 8L12 5V11L7 14Z',fill:'#544437',stroke:'#d9bf79','stroke-width':1}));
        if(b.level===2){group.append(node('path',{d:'M5-4V-33L18-40L30-33V-6L18 1Z','class':'кат-дом'}));group.append(node('path',{d:'M1-32L17-58L34-33L18-24Z','class':'кат-крыша'}));group.append(node('path',{d:'M17-19V-12M24-22V-15',stroke:'#635133','stroke-width':4}));}
        group.append(node('title',{},`${v.names?.[b.owner]||'Игрок '+(b.owner+1)}: ${b.level===1?'поселение, 1 очко':'город, 2 очка'}`));
      }else{group.append(node('circle',{r:18,'class':'кат-точка'}),node('path',{d:'M-6 0H6M0-6V6',stroke:'#173c31','stroke-width':3,'stroke-linecap':'round','pointer-events':'none'}));}
      if(enabled){group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`${mode==='city'?'Город':'Поселение'} ${vert.id}`);group.onclick=()=>act({type:mode,vertex:vert.id});group.onkeydown=e=>{if(e.key==='Enter')group.onclick();};}
      svg.append(group);
    }
  }
  window.КатанПоле={рисовать:поле};
})();
