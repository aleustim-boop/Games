"use strict";
const assert = require("node:assert/strict"),
  P = require("../js/монополия-правила"),
  D = require("../js/монополия-данные"),
  B = require("../js/монополия-бот");
function game() {
  const g = P.create(3, 123);
  g.turn = 0;
  g.phase = "manage";
  return g;
}
function own(g, p, ...ids) {
  for (const id of ids) g.properties[id].owner = p;
}
function act(g, m, p = P.who(g)) {
  P.action(g, p, m);
  P.assert(g);
}
{
  const g = game();
  own(g, 0, 1, 3);
  assert.equal(P.rent(g, 1), 4);
  act(g, { type: "build", id: 1 });
  assert.equal(P.rent(g, 1), 10);
  const before = JSON.stringify(g);
  assert.throws(() => act(g, { type: "build", id: 1 }));
  assert.equal(JSON.stringify(g), before);
  assert.throws(() => act(g, { type: "mortgage", id: 3 }));
  act(g, { type: "build", id: 3 });
  act(g, { type: "sell", id: 1 });
  assert.throws(() => act(g, { type: "sell", id: 1 }));
  act(g, { type: "sell", id: 3 });
  act(g, { type: "mortgage", id: 1 });
  assert.equal(P.rent(g, 1), 0);
  assert.equal(P.rent(g, 3), 8);
  act(g, { type: "unmortgage", id: 1 });
  assert.equal(g.players[0].money, 1447);
}
{
  const g = game();
  own(g, 1, 5, 15, 25, 35);
  assert.equal(P.rent(g, 5), 200);
  g.properties[15].mortgaged = true;
  assert.equal(P.rent(g, 5), 200);
  assert.equal(P.rent(g, 15), 0);
  g.phase = "buy";
  g.queue = [{ kind: "buy", from: 0, id: 1 }];
  act(g, { type: "auction" });
  act(g, { type: "bid", amount: 10 });
  act(g, { type: "pass" });
  act(g, { type: "pass" });
  assert.equal(g.properties[1].owner, 0);
  assert.equal(g.players[0].money, 1490);
}
{
  const g = game();
  own(g, 0, 1, 3);
  own(g, 1, 6);
  g.properties[6].mortgaged = true;
  act(g, {
    type: "offer",
    to: 1,
    give: { cash: 100, ids: [], cards: [] },
    want: { cash: 0, ids: [6], cards: [] },
  });
  act(g, { type: "accept" });
  assert.equal(g.players[0].money, 1395);
  assert.equal(g.players[1].money, 1600);
  assert.equal(g.properties[6].owner, 0);
  assert(g.properties[6].mortgaged);
  act(g, { type: "build", id: 1 });
  assert.throws(() =>
    act(g, {
      type: "offer",
      to: 1,
      give: { cash: 0, ids: [3], cards: [] },
      want: { cash: 100, ids: [], cards: [] },
    }),
  );
}
{
  const g = game();
  own(g, 0, 1);
  g.players[0].money = 10;
  g.phase = "debt";
  g.queue = [{ kind: "pay", from: 0, to: 1, amount: 45, reason: "rent" }];
  act(g, { type: "bankrupt" });
  assert(g.players[0].out);
  assert.equal(g.properties[1].owner, 1);
  assert.equal(g.turn, 1);
  const h = game();
  own(h, 0, 1);
  h.players[0].money = 10;
  h.phase = "debt";
  h.queue = [{ kind: "pay", from: 0, to: 1, amount: 35, reason: "rent" }];
  assert.throws(() => act(h, { type: "bankrupt" }));
  act(h, { type: "mortgage", id: 1 });
  assert.equal(h.players[0].money, 5);
  assert.equal(h.players[1].money, 1535);
}
{
  const g = game();
  own(g, 0, 1);
  g.properties[1].mortgaged = true;
  g.players[0].money = 0;
  g.phase = "debt";
  g.queue = [{ kind: "pay", from: 0, to: 1, amount: 100, reason: "rent" }];
  act(g, { type: "bankrupt" });
  assert.equal(g.phase, "inherit");
  act(g, { type: "inherit", redeem: [] });
  assert.equal(g.players[1].money, 1497);
}
let max = 0;
for (let seed = 1; seed <= 18; seed++) {
  const g = P.create(2 + (seed % 5), seed);
  let steps = 0;
  while (g.phase !== "finished" && steps < 30000) {
    const p = P.who(g),
      v = P.view(g, p),
      m = B.move(v);
    assert(m, `No action ${g.phase}`);
    try {
      act(g, m, p);
    } catch (e) {
      console.error({ seed, steps, phase: g.phase, p, m, queue: g.queue });
      throw e;
    }
    steps++;
  }
  assert.equal(g.phase, "finished", `Seed ${seed}: game must end (${steps})`);
  assert(!g.players[g.winner].out);
  assert.equal(g.players.filter((p) => !p.out).length, 1);
  assert(!("seed" in P.view(g, 0)));
  assert(!("decks" in P.view(g, 0)));
  max = Math.max(max, steps);
  console.log(
    `seed ${seed}: ${g.players.length} players, ${steps} actions, winner ${g.winner}`,
  );
}
console.log("Monopoly rules and 18 full games passed; max actions", max);
