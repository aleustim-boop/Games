/* Звук боя синтезируется локально: никаких сетевых запросов и автозапуска до касания. */
(function(){'use strict';
class BastionSound{
 constructor(){this.ctx=null;this.active=false;this.last={};this.voices=0;}
 init(){if(this.ctx)return;this.ctx=new (window.AudioContext||window.webkitAudioContext)();const c=this.ctx;this.master=c.createGain();this.master.gain.value=.55;const limiter=c.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=5;this.master.connect(limiter);limiter.connect(c.destination);
  const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate),a=buffer.getChannelData(0);let value=0;for(let i=0;i<a.length;i++){value=.98*value+.02*(Math.random()*2-1);a[i]=value*3;}this.noise=buffer;
  const sea=c.createBufferSource();sea.buffer=buffer;sea.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=520;this.ambient=c.createGain();this.ambient.gain.value=.035;sea.connect(filter);filter.connect(this.ambient);this.seaGate=c.createGain();this.seaGate.gain.value=this.active?1:0;this.ambient.connect(this.seaGate);this.seaGate.connect(this.master);const tide=c.createOscillator(),depth=c.createGain();tide.frequency.value=.085;depth.gain.value=.018;tide.connect(depth);depth.connect(this.ambient.gain);sea.start();tide.start();
 }
 setActive(active){if(active===this.active)return;this.active=active;if(!this.ctx)return;this.seaGate.gain.setTargetAtTime(active?1:0,this.ctx.currentTime,.08);if(active)this.ctx.resume().catch(()=>{});else this.ctx.suspend().catch(()=>{});}
 tone(freq,to,duration,level,type='sine',offset=0){this.voices++;const c=this.ctx,t=c.currentTime+offset,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();this.endVoice();};}
 burst(duration,level,frequency,type='lowpass',offset=0){this.voices++;const c=this.ctx,t=c.currentTime+offset,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();n.buffer=this.noise;f.type=type;f.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(f);f.connect(g);g.connect(this.master);n.start(t);n.stop(t+duration);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();this.endVoice();};}
 endVoice(){this.voices=Math.max(0,this.voices-1);if(!this.voices&&!this.active)this.ctx.suspend().catch(()=>{});}
 play(kind,tower){try{this.init();this.ctx.resume().catch(()=>{});const now=this.ctx.currentTime,key=kind+':'+tower;if(now-(this.last[key]??-1)<(kind==='shot'?.11:.06))return;this.last[key]=now;
  if(kind==='impact'){if(tower==='mortar'){this.tone(85,30,.38,.18);this.burst(.38,.65,1100);}else if(tower==='ballista')this.burst(.07,.25,1700);else if(tower==='storm')this.burst(.08,.25,2200,'highpass');return;}
  if(kind==='shot'){
   if(tower==='mortar'){this.tone(110,45,.2,.12);this.burst(.18,.4,1100);this.tone(1600,600,.065,.035,'triangle');}
   else if(tower==='ballista'){this.tone(940,150,.1,.09,'triangle');this.burst(.12,.36,2700,'highpass');}
   else if(tower==='storm'){this.burst(.24,.6,1800,'highpass');this.tone(1100,160,.2,.025,'sawtooth');}
   else if(tower==='tide'){this.burst(.5,.55,850,'bandpass');this.tone(400,700,.22,.028);}
   else this.burst(.3,.65,1200);
  }else if(kind==='won'){[392,494,587,784].forEach((f,i)=>this.tone(f,f,.55,.1,'sine',i*.16));}
  else if(kind==='lost'){[330,247,165].forEach((f,i)=>this.tone(f,f*.75,.5,.09,'triangle',i*.16));}
  else if(kind==='build'){this.burst(.18,.35,800);this.tone(560,840,.2,.07,'triangle',.06);}
  else if(kind==='wave'){this.tone(146,146,.65,.06,'triangle');this.tone(220,220,.5,.04,'triangle',.13);}
  else this.tone(660,880,.09,.05);
 }catch(_){}}
}
window.BastionSound=BastionSound;
})();
