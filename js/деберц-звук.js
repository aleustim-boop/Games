'use strict';
(function () {
  let контекст;
  function сыграть(тип, включён) {
    if (!включён) return;
    try {
      const Аудио = window.AudioContext || window.webkitAudioContext;
      if (!Аудио) return;
      контекст = контекст || new Аудио();
      if (контекст.state === 'suspended') контекст.resume().catch(() => {});
      const ноты = тип === 'победа' ? [523, 659, 784] : тип === 'поражение' ? [330, 262, 196] : тип === 'взятка' ? [440, 554] : [360];
      ноты.forEach((частота, i) => {
        const начало = контекст.currentTime + i * .12;
        const тон = контекст.createOscillator(), громкость = контекст.createGain();
        тон.type = 'sine'; тон.frequency.value = частота;
        громкость.gain.setValueAtTime(0, начало);
        громкость.gain.linearRampToValueAtTime(.055, начало + .008);
        громкость.gain.exponentialRampToValueAtTime(.001, начало + .13);
        тон.connect(громкость); громкость.connect(контекст.destination);
        тон.start(начало); тон.stop(начало + .15);
        тон.onended = () => { тон.disconnect(); громкость.disconnect(); };
      });
    } catch (_) { /* Без звукового устройства партия продолжается. */ }
  }
  window.ДеберцЗвук = { сыграть };
})();
