"use strict";
const assert = require("node:assert/strict"),
  P = require("../js/монополия-правила"),
  D = require("../js/монополия-данные");
const fixture = () => {
  const g = P.create(3, 1);
  g.turn = 0;
  g.phase = "manage";
  return g;
};
const own = (g, p, ids, level = 0) =>
  ids.forEach((id) => Object.assign(g.properties[id], { owner: p, level }));
const act = (g, m, p = P.who(g)) => {
  P.action(g, p, m);
  P.assert(g);
};
function rollSeed(want) {
  for (let seed = 0; seed < 10000; seed++) {
    let n = seed;
    const d = [0, 0].map(() => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return Math.floor((n / 4294967296) * 6) + 1;
    });
    if (want(d)) return seed;
  }
  throw Error("seed");
}
{
  const g = fixture();
  g.phase = "roll";
  g.doubles = 2;
  g.seed = rollSeed((d) => d[0] === d[1]);
  act(g, { type: "roll" });
  assert(g.players[0].jail);
  assert.equal(g.players[0].position, 10);
  assert.equal(g.players[0].money, 1500);
  assert(!g.extra);
  act(g, { type: "end" });
  assert.equal(g.turn, 1);
}
{
  const g = fixture();
  g.phase = "jail";
  Object.assign(g.players[0], {
    position: 10,
    jail: true,
    attempts: 2,
    money: 0,
  });
  own(g, 0, [1, 3]);
  g.seed = rollSeed((d) => d[0] !== d[1] && d[0] + d[1] === 5);
  act(g, { type: "roll" });
  assert.equal(g.phase, "debt");
  assert.equal(g.players[0].position, 10);
  act(g, { type: "mortgage", id: 1 });
  assert.equal(g.phase, "debt");
  act(g, { type: "mortgage", id: 3 });
  assert.equal(g.players[0].position, 15);
  assert.equal(g.players[0].money, 10);
  assert(!g.extra);
  assert.equal(g.phase, "buy");
  const h = fixture();
  h.phase = "jail";
  Object.assign(h.players[0], { position: 10, jail: true, attempts: 0 });
  h.seed = rollSeed((d) => d[0] === d[1]);
  act(h, { type: "roll" });
  assert(!h.players[0].jail);
  assert(!h.extra);
}
{
  const g = fixture();
  g.phase = "roll";
  g.players[0].position = 39;
  g.seed = rollSeed((d) => d[0] + d[1] === 2);
  act(g, { type: "roll" });
  assert.equal(g.players[0].money, 1700);
  assert.equal(g.players[0].position, 1);
  assert.equal(g.phase, "buy");
  const h = fixture();
  h.phase = "roll";
  h.players[0].position = 8;
  own(h, 1, [12, 28]);
  h.seed = rollSeed((d) => d[0] + d[1] === 4);
  act(h, { type: "roll" });
  assert.equal(
    h.players[0].money,
    1500 - 10 * h.utilityDice.reduce((a, b) => a + b),
  );
}
{
  const g = fixture();
  own(g, 0, [1]);
  g.players[0].money = 0;
  g.phase = "debt";
  g.queue = [{ kind: "pay", from: 0, to: 2, amount: 40, reason: "Аренда" }];
  act(g, {
    type: "offer",
    to: 1,
    give: { cash: 0, ids: [1], cards: [] },
    want: { cash: 50, ids: [], cards: [] },
  });
  act(g, { type: "accept" });
  assert.equal(g.players[0].money, 10);
  assert.equal(g.players[2].money, 1540);
  assert.equal(g.phase, "manage");
}
{
  const g = fixture();
  own(g, 0, [1, 3]);
  g.properties[1].mortgaged = true;
  g.players[0].money = 0;
  g.phase = "debt";
  g.queue = [{ kind: "pay", from: 0, to: -1, amount: 100, reason: "Налог" }];
  act(g, { type: "bankrupt" });
  assert.equal(g.phase, "auction");
  assert(!g.properties[1].mortgaged);
  let n = 0;
  while (g.phase === "auction" && n++ < 20) act(g, { type: "pass" });
  assert.equal(g.turn, 1);
  assert.equal(g.properties[1].owner, -1);
}
{
  const g = fixture();
  own(g, 0, [1, 3], 4);
  own(g, 1, [6, 8, 9], 4);
  own(g, 2, [11, 13, 14], 4);
  assert.equal(P.stock(g).houses, 0);
  act(g, { type: "build", id: 1 });
  assert.equal(P.stock(g).houses, 4);
  assert.equal(P.stock(g).hotels, 11);
  act(g, { type: "sell", id: 1 });
  assert.equal(P.stock(g).houses, 0);
  assert.equal(P.stock(g).hotels, 12);
  const h = fixture();
  own(h, 0, [1, 3], 5);
  own(h, 1, [6, 8, 9], 4);
  own(h, 2, [11, 13, 14], 4);
  own(h, 2, [16, 18, 19], 2);
  h.properties[16].level = 3;
  assert.equal(P.stock(h).houses, 1);
  assert.throws(() => act(h, { type: "sell", id: 1 }));
  act(h, { type: "sellGroup", id: 1 });
  assert.equal(h.players[0].money, 1750);
}
{
  const g = fixture();
  own(g, 0, [1, 3], 0);
  own(g, 1, [6, 8, 9], 0);
  own(g, 2, [11, 13, 14], 4);
  own(g, 2, [16, 18, 19], 4);
  own(g, 2, [21, 23, 24], 2);
  g.properties[21].level = 3;
  assert.equal(P.stock(g).houses, 1);
  act(g, { type: "build", id: 1 });
  assert.equal(g.phase, "auction");
  assert(g.auction.building);
  act(g, { type: "bid", amount: 10, id: 1 });
  while (g.phase === "auction") act(g, { type: "pass" });
  assert.equal(g.properties[1].level, 1);
  assert.equal(P.stock(g).houses, 0);
}
{
  const g = fixture();
  g.phase = "roll";
  g.players[0].position = 0;
  g.seed = rollSeed((d) => d[0] + d[1] === 7);
  const free = D.chance.findIndex((x) => x.free);
  g.decks.chance = g.decks.chance.filter((x) => x !== free);
  g.decks.chance.unshift(free);
  act(g, { type: "roll" });
  assert.equal(g.players[0].free.length, 1);
  assert(!g.decks.chance.includes(free));
  g.players[0].jail = true;
  g.players[0].position = 10;
  g.phase = "jail";
  act(g, { type: "free", card: 0 });
  assert.equal(g.decks.chance.at(-1), free);
  assert.equal(g.phase, "roll");
}
{
  const g = fixture();
  g.phase = "roll";
  g.extra = true;
  own(g, 1, [1]);
  act(g, { type: "surrender" }, 1);
  assert(g.players[1].out);
  assert.equal(g.phase, "auction");
  while (g.phase === "auction") act(g, { type: "pass" });
  assert.equal(g.turn, 0);
  assert.equal(g.phase, "roll");
  assert(g.extra);
  act(g, { type: "surrender" }, 0);
  assert.equal(g.phase, "finished");
  assert.equal(g.winner, 2);
}
console.log(
  "Монополия: дубли, три попытки, долг перед выходом, Старт, новый бросок аренды, обмен при долге, банковское банкротство, дефицит домов, аукцион зданий, карты освобождения и добровольный выход — OK",
);
