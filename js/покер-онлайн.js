'use strict';
window.НастройкиЭкранаОнлайн={создатьИгру(){document.getElementById('pk-public').checked=true;document.getElementById('кнопка-с-другом').click();}};
document.getElementById('кнопка-создать-игру').addEventListener('click',async e=>{e.stopImmediatePropagation();e.preventDefault();const b=e.currentTarget;if(b.disabled)return;b.disabled=true;try{await window.Сеть.создатьКомнату({открытый:document.getElementById('pk-public').checked});}finally{b.disabled=false;}},true);
