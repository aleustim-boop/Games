"use strict";
const P = require("../../игры/покер/покер-правила"),
  B = require("../../игры/покер/покер-бот"),
  { номерМеста } = require("../партия-по-сети");
/* Обычная Error из правил (throw Error('текст')) уже написана по-русски —
   показываем как есть. Техническую ошибку JS (TypeError, RangeError,
   ReferenceError, SyntaxError, а то и не Error вовсе) игрок видеть не
   должен, даже если в её тексте случайно есть русские буквы (утечка вида
   «Cannot read properties of undefined (reading 'флоты')»). Такую ошибку —
   со стеком — пишем в журнал сервера; обычный отказ правил в журнал не
   пишем, иначе он забьётся частыми отказами и потеряется настоящий сбой. */
function понятнаяПричина(e, где) {
  if (e instanceof Error && e.constructor === Error) return e.message;
  console.error(где + ": сбой хода", e);
  return "Такой ход не принят";
}
function раздать(_, settings = {}) {
  const игроки = (settings.игроки || []).slice();
  if (
    игроки.length < 2 ||
    игроки.length > 6 ||
    new Set(игроки).size !== игроки.length
  )
    throw Error("Нужно 2–6 участников");
  return {
    игроки,
    игра: P.create(игроки.length, undefined, true),
    завершена: false,
    результат: null,
    проигравшие: [],
    deadline:Date.now()+30000,
  };
}
function чейХод(p) {
  return !p || p.завершена ? null : p.игроки[p.игра.turn] || null;
}
function сделатьХод(p, key, a = {}) {
  const i = p?.игроки.indexOf(key);
  if (!p || i < 0 || p.завершена)
    return { принято: false, причина: "Партия недоступна" };
  try {
    if (!a || typeof a !== "object") throw Error("Ход не разобран");
    if (!["покер", "сдаться"].includes(a.действие))
      throw Error("Неизвестное действие");
    if(a.действие === "сдаться") {
      if(p.игроки.length!==2)throw Error("Покиньте стол через меню: место займёт бот");
      p.завершена=true;p.результат=p.игроки.find(k=>k!==key);p.проигравшие=[key];
      return {принято:true,событие:'сдался'};
    }
    if (!a.move || typeof a.move !== "object" || typeof a.move.type !== "string")
      throw Error("Не хватает данных хода");
    if(a.move?.version!==undefined&&a.move.version!==p.игра.version)throw Error('Ситуация за столом изменилась. Проверьте новую ставку.');
    P.action(p.игра,i,a.move);
    p.deadline=Date.now()+(p.игра.phase==="between"?6000:30000);
    if (p.игра.phase === "finished") {
      p.завершена = true;
      p.результат = p.игроки[p.игра.winner];
      p.проигравшие = p.игроки.filter((k) => k !== p.результат);
    }
    return { принято: true, событие: a.move?.type || a.действие };
  } catch (e) {
    return { принято: false, причина: понятнаяПричина(e, "покер") };
  }
}
function ходЗаБота(p, key, level) {
  const i = p.игроки.indexOf(key);
  if (i < 0 || p.завершена) return null;
  const move = B.move(P.view(p.игра, i),level);
  return move && сделатьХод(p, key, { действие: "покер", move }).принято
    ? { событие: move.type, ктоСделал: key }
    : null;
}
function видДляИгрока(p, key, d = {}) {
  const participants=d.места||d.участники||[];
  const v = {
    игра: "покер",
    код: d.код,
    этап: d.этап,
    версия: d.версия,
    номерСобытия: d.номерСобытия,
    событие: d.событие || "",
    сыграноПартий: d.сыграноПартий,
    яХочуЕщё: !!d.яХочуЕщё,
    соперникХочетЕщё: !!d.соперникХочетЕщё,
    соперникПришёл: !!d.соперникПришёл,
    соперникНаСвязи: !!d.соперникНаСвязи,
    соперникУшёл: !!d.соперникУшёл,
    имяСоперника: String(d.имяСоперника || "Соперник"),
    завершена: !!p?.завершена,
    яХожу: чейХод(p) === key,
  };
  if (Array.isArray(d.места)) {
    Object.assign(v, {
      мест: d.мест,
      мойНомер: d.мойНомер,
      яХозяин: !!d.яХозяин,
      можноНачать: !!d.можноНачать,
      парами: false,
      уровеньБотов: d.уровеньБотов,
    });
    v.застолом = d.места.map((m) => ({
      номер: номерМеста(m.ключ),
      имя: m.имя,
      этоЯ: m.ключ === key,
      этоБот: !!m.этоБот,
      хозяин: !!m.хозяин,
      наСвязи: !!m.наСвязи,
      ушёл: !!m.ушёл,
      хочетЕщё: !!m.хочетЕщё,
      напарник: null,
    }));
  }
  if (p && p.игроки.includes(key)) {
    const i = p.игроки.indexOf(key);
    v.покер = P.view(p.игра, i);
    if(p.завершена&&p.игра.phase!=='finished'){
      v.покер.phase='finished';v.покер.winner=p.игроки.indexOf(p.результат);
      v.покер.interrupted=true;v.покер.legal={};v.покер.turn=-1;
    }
    v.покер.deadline=p.deadline;
    v.покер.bots=p.игроки.map(k=>!!participants.find(m=>m.ключ===k)?.этоБот);
    v.покер.names = p.игроки.map(
      (k, j) =>
        participants.find((m) => m.ключ === k)?.имя ||
        (j === i ? "Вы" : `Игрок ${j + 1}`),
    );
  }
  return v;
}
module.exports = {
  имя: "покер",
  мест: { мин: 2, макс: 6, впарах: 0 },
  раздать,
  чейХод,
  сделатьХод,
  видДляИгрока,
  ходЗаБота,
  темпБота: { обычный: 2000, внеОчереди: 2000 },
  задержкаБота:p=>p.игра.phase==="between"?6000:2000,
  остатокВремениНаХод:p=>p.завершена?Infinity:Math.max(0,p.deadline-Date.now()),
  ходПоПросрочке(p){if(p.завершена||Date.now()<p.deadline)return null;const i=p.игра.turn,key=p.игроки[i],l=P.legal(p.игра,i),move={type:l.next?"next":l.check?"check":"fold"};return сделатьХод(p,key,{действие:"покер",move}).принято?{ктоСделал:key}:null;},
  ходВнеОчереди: null,
  напарник: () => null,
  знаки: {
    сколько: () => 0,
    этоЗнак: () => false,
    этоБросок: () => false,
    голосБота: () => null,
  },
  текстСобытия: () => "",
};
