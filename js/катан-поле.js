'use strict';
(function(){
  const П=КатанПравила,Г=П.Г,NS='http://www.w3.org/2000/svg',R=76;
  const xy=v=>[450+v.x*R,420+v.y*R];
  function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
  function поле(svg,v,mode,act){
    const defs=node('defs');
    for(let r=0;r<6;r++){const p=node('pattern',{id:`земля-${r}`,width:1,height:1,viewBox:`${r%3*512} ${Math.floor(r/3)*512} 512 512`,preserveAspectRatio:'xMidYMid slice'});p.append(node('image',{href:'img/катан/земли.jpg',width:1536,height:1024}));defs.append(p);}
    for(let r=0;r<5;r++){const p=node('pattern',{id:`ресурс-${r}`,width:1,height:1,viewBox:`${r%3*512} ${Math.floor(r/3)*512} 512 512`,preserveAspectRatio:'xMidYMid slice'});p.append(node('image',{href:'img/катан/ресурсы.jpg',width:1536,height:1024}));defs.append(p);}
    const shadows=node('filter',{id:'тень-фигуры',x:'-50%',y:'-50%',width:'200%',height:'200%'});shadows.append(node('feDropShadow',{dx:0,dy:4,stdDeviation:2,'flood-opacity':.6}));defs.append(shadows);
    const existing=svg.querySelector('defs');
    if(existing){for(const child of [...svg.children])if(child!==existing)child.remove();}else svg.replaceChildren(defs);
    svg.setAttribute('viewBox','0 0 900 840');
    for(const h of v.hexes){
      const geom=Г.hexes[h.id],[x,y]=xy(geom),group=node('g',{'class':'кат-гекс','data-hex':h.id});
      group.append(node('title',{},['Лес — дерево','Холмы — глина','Пастбище — шерсть','Поля — зерно','Горы — руда','Пустыня'][h.resource]+(h.number?` · бросок ${h.number}`:'')+(h.id===v.robber?' · заблокировано разбойником':'')));
      const path=node('polygon',{points:geom.vertices.map(id=>xy(Г.vertices[id]).join(',')).join(' '),fill:`url(#земля-${h.resource})`,'class':'кат-земля'});group.append(path);
      if(h.number){
        group.append(node('circle',{cx:x,cy:y,r:23,'class':'кат-номер-фон'}));
        group.append(node('text',{x,y:y+5,'class':[6,8].includes(h.number)?'кат-номер кат-красный':'кат-номер'},h.number));
        group.append(node('text',{x,y:y+18,'class':'кат-вероятность'},'•'.repeat(6-Math.abs(7-h.number))));
      }
      if(h.id===v.robber){const robber=node('g',{transform:`translate(${x+34},${y-27})`,'class':'кат-разбойник'});robber.append(node('path',{d:'M-11 27L-8 3Q-17-8-8-18Q0-26 8-18Q17-8 8 3L11 27Z'}));robber.append(node('title',{},'Разбойник: производство заблокировано'));group.append(robber);}
      if(mode==='robber'&&v.turn===v.me&&h.id!==v.robber){path.classList.add('доступно');group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`Разбойник: гекс ${h.id+1}`);group.onclick=()=>act({type:'robber',hex:h.id});group.onkeydown=e=>{if(e.key==='Enter')group.onclick();};}
      svg.append(group);
    }
    for(const port of v.ports){
      const edge=Г.edges[port.edge],a=Г.vertices[edge.a],b=Г.vertices[edge.b],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},len=Math.hypot(mid.x,mid.y),center=xy({x:mid.x+mid.x/len*.7,y:mid.y+mid.y/len*.7}),group=node('g',{'class':'кат-порт'});
      for(const id of [edge.a,edge.b]){const [x,y]=xy(Г.vertices[id]);group.append(node('line',{x1:x,y1:y,x2:center[0],y2:center[1]}));}
      const specific=port.resource>=0;
      group.append(node('rect',{x:center[0]-(specific?39:29),y:center[1]-19,width:specific?78:58,height:38,rx:12}));
      if(specific)group.append(node('rect',{x:center[0]-32,y:center[1]-13,width:26,height:26,rx:5,style:`fill:url(#ресурс-${port.resource});stroke:none`}));
      group.append(node('text',{x:center[0]+(specific?16:0),y:center[1]+5},specific?'2:1':'3:1'));
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
      }else svg.append(line);
    }
    for(const vert of Г.vertices){
      const b=v.buildings[vert.id],[x,y]=xy(vert),enabled=['city','settlement'].includes(mode)&&v.legal[mode].includes(vert.id);
      if(!b&&!enabled)continue;
      const group=node('g',{transform:`translate(${x},${y})`,'data-vertex':vert.id,'class':`кат-постройка ${b?'цвет-'+b.owner:''} ${enabled?'доступно':''}`});
      if(enabled)group.append(node('circle',{r:27,fill:'transparent'}));
      if(b){
        group.append(node('path',{d:b.level===1?'M-15 12V-7L0-21L15-7V12Z':'M-20 13V-5H-8V-23L3-30L14-23V-4H23V13Z','class':'кат-дом'}));
        group.append(node('path',{d:b.level===1?'M-15-7L0-21L15-7M-3 12V1H4V12':'M-8-23L3-30L14-23M-11 13V2H-4V13M4-15H8V-10','class':'кат-крыша'}));
      }else group.append(node('circle',{r:17,'class':'кат-точка'}));
      if(enabled){group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`${mode==='city'?'Город':'Поселение'} ${vert.id}`);group.onclick=()=>act({type:mode,vertex:vert.id});group.onkeydown=e=>{if(e.key==='Enter')group.onclick();};}
      svg.append(group);
    }
  }
  window.КатанПоле={рисовать:поле};
})();
