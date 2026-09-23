'use strict';
(function () {
  const З = window.ДеберцЗнаки;
  window.ДеберцСказать = function (контекст) {
    const окно = document.createElement('dialog'); окно.id = 'экран-эмоций'; окно.className = 'экран--поверх'; окно.setAttribute('aria-label', 'Сказать за столом');
    const заголовок = document.createElement('span'); заголовок.hidden = true;
    const вкладки = document.createElement('div'); вкладки.className = 'панель-знаков__вкладки';
    const ряд = document.createElement('div'); ряд.className = 'ряд-знаков';
    const сообщение = document.createElement('p'); сообщение.className = 'деберц-тихо'; сообщение.setAttribute('role', 'status');
    const закрыть = document.createElement('button'); закрыть.id = 'кнопка-эмоции-назад'; закрыть.className = 'кнопка кнопка--мелкая'; закрыть.textContent = 'Закрыть'; закрыть.onclick = () => окно.close();
    окно.append(заголовок, вкладки, ряд, сообщение, закрыть); document.body.append(окно);
    const полка = document.createElement('div'); полка.id = 'знаки-внимания'; полка.className = 'знаки-внимания'; полка.setAttribute('role', 'status'); document.getElementById('экран-игры').append(полка);
    let последний = '', отправляется = false, последнееНажатие = 0;
    function попадание(ключ, x, y) {
      const всплеск = document.createElement('div'); всплеск.className = 'деберц-попадание'; всплеск.dataset.предмет = ключ;
      всплеск.style.setProperty('--x', x + 'px'); всплеск.style.setProperty('--y', y + 'px'); document.body.append(всплеск);
      const пятно = document.createElement('i'); пятно.className = 'деберц-пятно'; всплеск.append(пятно);
      пятно.animate([{ transform: 'scale(.15)', opacity: 1 }, { transform: 'scale(1.15)', opacity: .9, offset: .18 }, { transform: 'scale(1)', opacity: .7, offset: .65 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 1600, fill: 'forwards' });
      for (let i = 0; i < 12; i++) {
        const капля = document.createElement('i'); капля.className = 'деберц-капля'; всплеск.append(капля);
        const угол = i * Math.PI / 6, дальность = 28 + Math.random() * 45, dx = Math.cos(угол) * дальность, dy = Math.sin(угол) * дальность;
        капля.animate([{ transform: 'translate(0, 0) scale(.5)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: .45 }, { transform: `translate(${dx * 1.25}px, ${dy + 45}px) scale(.3)`, opacity: 0 }], { duration: 650 + Math.random() * 300, fill: 'forwards', easing: 'ease-out' });
      }
      setTimeout(() => всплеск.remove(), 1700);
    }
    function показать(знак) {
      if (!знак || !З.этоЗнак(знак.номер)) return;
      const к = контекст();
      const облако = document.createElement('div'), кто = document.createElement('span'), что = document.createElement('span');
      const картинка = знак.номер < З.ЭМОЦИИ.length || З.этоБросок(знак.номер);
      облако.className = 'знак-внимания' + (картинка ? ' знак-внимания--смайлик знак-внимания--живой' : '') + (знак.этоЯ ? ' знак-внимания--свой' : '');
      облако.dataset.игрок = String(знак.от ?? 0);
      кто.className = 'знак-внимания__кто'; кто.textContent = (знак.этоЯ ? 'Вы' : знак.имя) + (знак.цель ? ' → ' + знак.цель : '');
      что.className = 'знак-внимания__что';
      if (З.этоБросок(знак.номер)) { const img = document.createElement('img'); img.className = 'предмет-броска'; img.src = 'img/бросок/' + З.предмет(знак.номер).ключ + '.webp'; img.alt = З.текст(знак.номер); что.append(img); }
      else что.textContent = З.текст(знак.номер);
      for (const old of полка.children) if (old.dataset.игрок === облако.dataset.игрок) old.remove();
      облако.append(кто, что); полка.append(облако);
      while (полка.children.length > 3) полка.firstChild.remove();
      setTimeout(() => облако.classList.add('знак-внимания--гаснет'), 1600);
      setTimeout(() => облако.remove(), 2000);
      if (З.этоБросок(знак.номер)) {
        const от = к.место(знак.от ?? 0)?.getBoundingClientRect(), куда = к.место(знак.кому ?? 1)?.getBoundingClientRect();
        if (!от || !куда) return;
        const предмет = document.createElement('img'); предмет.className = 'деберц-летящий-предмет'; предмет.alt = З.текст(знак.номер); предмет.src = 'img/бросок/' + З.предмет(знак.номер).ключ + '.webp'; document.body.append(предмет);
        const x0 = от.x + от.width / 2 - 24, y0 = от.y + от.height / 2 - 24, x1 = куда.x + куда.width / 2 - 24, y1 = куда.y + куда.height / 2 - 24;
        const а = предмет.animate([{ transform: `translate(${x0}px, ${y0}px) rotate(-30deg) scale(.8)` }, { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 65}px) rotate(120deg) scale(1.25)`, offset: .55 }, { transform: `translate(${x1}px, ${y1}px) rotate(240deg) scale(1)` }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 850, fill: 'forwards', easing: 'ease-in-out' });
        а.onfinish = () => { предмет.remove(); попадание(З.предмет(знак.номер).ключ, x1 + 24, y1 + 24); };
      }
    }
    async function отправить(номер, цель) {
      if (отправляется) return;
      if (Date.now() - последнееНажатие < 1500) { сообщение.textContent = 'Подождите немного перед следующей репликой'; return; }
      отправляется = true; const к = контекст();
      try {
        if (к.поСети) {
          const ответ = await window.Сеть.послатьЭмоцию(номер, цель?.id);
          if (!ответ?.принято) { сообщение.textContent = ответ?.причина || 'Не удалось отправить'; return; }
        } else показать({ номер, этоЯ: true, от: 0, кому: цель?.индекс, цель: цель?.имя });
        последнееНажатие = Date.now(); окно.close();
      } finally { отправляется = false; }
    }
    function выбрать(номер) {
      const цели = контекст().игроки;
      if (!З.этоБросок(номер)) { отправить(номер); return; }
      if (цели.length === 1) { отправить(номер, цели[0]); return; }
      ряд.id = 'ряд-целей'; ряд.replaceChildren(); сообщение.textContent = 'В кого кинуть ' + З.предмет(номер).винительный + '?';
      цели.forEach(цель => { const b = document.createElement('button'); b.className = 'кнопка кнопка--цель'; b.textContent = цель.имя; b.onclick = () => отправить(номер, цель); ряд.append(b); });
    }
    const группы = [{ имя: 'Смайлики', начало: 0, список: З.ЭМОЦИИ }, { имя: 'Фразы', начало: З.ЭМОЦИИ.length, список: З.ФРАЗЫ }, { имя: 'Кинуть', начало: З.ЭМОЦИИ.length + З.ФРАЗЫ.length, список: З.БРОСКИ.map(x => x.имя) }];
    function вкладка(индекс) {
      сообщение.textContent = ''; ряд.id = ['ряд-эмоций', 'ряд-фраз', 'ряд-бросков'][индекс]; ряд.replaceChildren();
      [...вкладки.children].forEach((b, i) => { b.setAttribute('aria-pressed', i === индекс); b.classList.toggle('кнопка--активная', i === индекс); });
      группы[индекс].список.forEach((текст, i) => {
        const номер = группы[индекс].начало + i, b = document.createElement('button'); b.className = 'кнопка ' + ['кнопка--смайлик', 'кнопка--фраза', 'кнопка--смайлик кнопка--бросок-предмет'][индекс]; b.setAttribute('aria-label', текст);
        if (индекс === 2) { const img = document.createElement('img'); img.src = 'img/бросок/' + З.предмет(номер).ключ + '.webp'; img.alt = ''; img.className = 'предмет-броска'; b.append(img); }
        else b.textContent = текст;
        b.onclick = () => выбрать(номер); ряд.append(b);
      });
    }
    группы.forEach((г, i) => { const b = document.createElement('button'); b.className = 'кнопка панель-знаков__вкладка'; b.textContent = г.имя; b.onclick = () => вкладка(i); вкладки.append(b); });
    return { открыть() { вкладка(0); окно.showModal(); }, принять(вид) { const з = вид.знакВнимания; const ключ = вид.код + ':' + з?.порядковый; if (з && ключ !== последний) { последний = ключ; показать(з); } } };
  };
})();
