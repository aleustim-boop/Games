"use strict";
(function (root) {
  const P =
      typeof module !== "undefined"
        ? require("./монополия-правила")
        : root.МонополияПравила,
    D =
      typeof module !== "undefined"
        ? require("./монополия-данные")
        : root.МонополияДанные;
  function value(g, p, ids) {
    return ids.reduce((n, id) => {
      const c = D.cells[id],
        s = g.properties[id],
        set = c.rents
          ? P.group(id)
          : D.cells.filter((x) => x.type === c.type).map((x) => x.id),
        owned = set.filter(
          (k) => g.properties[k].owner === p || ids.includes(k),
        ).length;
      return (
        n +
        c.price * (s.mortgaged ? 0.6 : 1) * (owned === set.length ? 2.6 : 1.25)
      );
    }, 0);
  }
  function trade(g) {
    const t = g.trade,
      p = t.to;
    const gain =
        value(g, p, t.give.ids) + t.give.cash + t.give.cards.length * 50,
      cost = value(g, p, t.want.ids) + t.want.cash + t.want.cards.length * 50;
    return {
      type:
        gain >= cost && g.players[p].money + t.give.cash - t.want.cash >= 100
          ? "accept"
          : "reject",
    };
  }
  function move(g) {
    const p = P.who(g),
      pl = g.players[p];
    if (p < 0) return null;
    if (g.phase === "trade") return trade(g);
    if (g.phase === "inherit") return { type: "inherit", redeem: [] };
    if (g.phase === "debt") {
      if (P.liquid(g, p) < g.queue[0].amount) return { type: "bankrupt" };
      const mortgage = D.cells
        .filter(
          (c) =>
            g.properties[c.id].owner === p &&
            !g.properties[c.id].mortgaged &&
            (!c.rents ||
              P.group(c.id).every((id) => g.properties[id].level === 0)),
        )
        .sort(
          (a, b) =>
            (P.monopoly(g, p, a.id) ? 1 : 0) -
              (P.monopoly(g, p, b.id) ? 1 : 0) || b.mortgage - a.mortgage,
        )[0];
      if (mortgage) return { type: "mortgage", id: mortgage.id };
      const property = D.cells
        .filter(
          (c) => g.properties[c.id].owner === p && g.properties[c.id].level > 0,
        )
        .sort((a, b) => g.properties[b.id].level - g.properties[a.id].level)[0];
      if (property)
        return {
          type:
            g.properties[property.id].level === 5 && P.stock(g).houses < 4
              ? "sellGroup"
              : "sell",
          id: property.id,
        };
      throw Error("Бот не нашёл способ оплаты долга");
    }
    if (g.phase === "auction") {
      const a = g.auction,
        id = a.id,
        c = D.cells[id];
      let target = id,
        budget;
      if (a.building) {
        target = D.cells.find(
          (x) =>
            P.buildable(g, p, x.id) &&
            (g.properties[x.id].level === 4 ? "hotel" : "house") === a.kind,
        )?.id;
        budget = target === undefined ? 0 : D.cells[target].house * 1.6;
      } else budget = value(g, p, [id]);
      const bid = Math.max(10, a.bid + (a.bid < 100 ? 10 : 20));
      return bid <= Math.min(pl.money, budget)
        ? { type: "bid", amount: bid, id: target }
        : { type: "pass" };
    }
    if (g.phase === "buy")
      return {
        type: pl.money >= D.cells[g.queue[0].id].price ? "buy" : "auction",
      };
    if (g.phase === "jail") {
      if (pl.free.length) return { type: "free", card: 0 };
      return {
        type:
          pl.money > 250 && g.round < g.players.length * 12 ? "bail" : "roll",
      };
    }
    if (g.phase === "roll") return { type: "roll" };
    if (g.phase === "manage") {
      const redeem = D.cells.find(
        (c) =>
          g.properties[c.id].owner === p &&
          g.properties[c.id].mortgaged &&
          pl.money > c.mortgage * 1.1 + 250,
      );
      if (redeem) return { type: "unmortgage", id: redeem.id };
      const build = D.cells
        .filter(
          (c) =>
            P.buildable(g, p, c.id) &&
            pl.money >= c.house + 180 &&
            P.stock(g)[g.properties[c.id].level === 4 ? "hotels" : "houses"] >
              0,
        )
        .sort(
          (a, b) =>
            g.properties[a.id].level - g.properties[b.id].level ||
            b.group - a.group,
        )[0];
      if (build) return { type: "build", id: build.id };
      const turnEvent =
        g.events.filter((e) => e.kind === "turn" || e.kind === "start").at(-1)
          ?.id || 0;
      if (
        !g.events.some(
          (e) => e.kind === "offer" && e.player === p && e.id > turnEvent,
        )
      ) {
        for (let group = 7; group >= 0; group--) {
          const set = D.cells.filter((c) => c.group === group),
            mine = set.filter((c) => g.properties[c.id].owner === p),
            missing = set.filter((c) => g.properties[c.id].owner !== p);
          if (mine.length && missing.length === 1) {
            const c = missing[0],
              to = g.properties[c.id].owner,
              cash = Math.ceil(value(g, to, [c.id]) + 10);
            if (to >= 0 && !P.monopoly(g, to, c.id) && pl.money > cash + 200)
              return {
                type: "offer",
                to,
                give: { cash, ids: [], cards: [] },
                want: { cash: 0, ids: [c.id], cards: [] },
              };
          }
        }
      }
      return { type: "end" };
    }
    return null;
  }
  const api = { move, ход: move };
  if (typeof module !== "undefined") module.exports = api;
  else root.МонополияБот = api;
})(typeof window !== "undefined" ? window : globalThis);
