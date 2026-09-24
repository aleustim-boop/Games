"use strict";
(function (root) {
  const D =
    typeof module !== "undefined"
      ? require("./монополия-данные.js")
      : root.МонополияДанные;
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const need = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const int = (x, min = 0, max = 1000000) =>
    Number.isInteger(x) && x >= min && x <= max;
  function random(g, n) {
    if (g.secure && typeof module !== "undefined")
      return require("node:crypto").randomInt(n);
    g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((g.seed / 4294967296) * n);
  }
  function dice(g) {
    return [random(g, 6) + 1, random(g, 6) + 1];
  }
  function shuffle(g, a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = random(g, i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function event(g, text, extra = {}) {
    g.serial++;
    g.events.push({ id: g.serial, text, ...extra });
    if (g.events.length > 100) g.events.shift();
  }
  const alive = (g) =>
    g.players.map((p, i) => (p.out ? -1 : i)).filter((i) => i >= 0);
  const group = (id) =>
    D.cells
      .filter((c) => c.group !== undefined && c.group === D.cells[id].group)
      .map((c) => c.id);
  const owns = (g, p, id) => g.properties[id].owner === p;
  const monopoly = (g, p, id) =>
    D.cells[id].group !== undefined && group(id).every((k) => owns(g, p, k));
  function stock(g) {
    return {
      houses:
        32 - g.properties.reduce((s, p) => s + (p.level < 5 ? p.level : 0), 0),
      hotels: 12 - g.properties.filter((p) => p.level === 5).length,
    };
  }
  function who(g) {
    if (g.phase === "finished") return -1;
    if (g.phase === "auction") return g.auction.actor;
    if (g.phase === "trade") return g.trade.to;
    if (g.phase === "debt" || g.phase === "inherit") return g.queue[0].from;
    return g.turn;
  }
  function next(g) {
    const a = alive(g);
    if (a.length === 1) {
      g.phase = "finished";
      g.winner = a[0];
      event(g, "Партия завершена", { kind: "win", player: a[0] });
      return;
    }
    do {
      g.turn = (g.turn + 1) % g.players.length;
    } while (g.players[g.turn].out);
    g.round++;
    g.doubles = 0;
    g.extra = false;
    g.phase = g.players[g.turn].jail ? "jail" : "roll";
    event(g, "Начинается новый ход", { kind: "turn", player: g.turn });
  }
  function jail(g, p) {
    g.players[p].position = 10;
    g.players[p].jail = true;
    g.players[p].attempts = 0;
    g.extra = false;
    g.doubles = 0;
    event(g, "Отправляется в тюрьму", { kind: "jail", player: p });
  }
  function pay(from, to, amount, reason) {
    return { kind: "pay", from, to, amount, reason };
  }
  function move(g, p, to, forward = true) {
    const player = g.players[p],
      from = player.position;
    if (forward && to < from) {
      player.money += 200;
      event(g, "Проходит Старт: +200", {
        player: p,
        kind: "cash",
        amount: 200,
      });
    }
    player.position = to;
    event(g, D.cells[to].name, { kind: "move", player: p, from, to });
    land(g, p);
  }
  function rent(g, id, multiplier = 1) {
    const c = D.cells[id],
      s = g.properties[id],
      owner = s.owner;
    if (owner < 0 || s.mortgaged) return 0;
    if (c.type === "street")
      return (
        c.rents[s.level] * (s.level === 0 && monopoly(g, owner, id) ? 2 : 1)
      );
    const count = D.cells.filter(
      (x) => x.type === c.type && owns(g, owner, x.id),
    ).length;
    if (c.type === "rail") return 25 * Math.pow(2, count - 1) * multiplier;
    return count === 2 ? 10 : 4;
  }
  function land(g, p, multiplier = 1) {
    const id = g.players[p].position,
      c = D.cells[id],
      s = g.properties[id];
    if (c.price) {
      if (s.owner < 0) {
        g.queue.push({ kind: "buy", from: p, id });
        return;
      }
      if (s.owner !== p && !s.mortgaged) {
        let amount = rent(g, id, multiplier);
        if (c.type === "utility") {
          const d = dice(g);
          g.utilityDice = d;
          amount = (multiplier === 10 ? 10 : amount) * (d[0] + d[1]);
          event(g, "Бросок для оплаты услуг", {
            kind: "utilityDice",
            player: p,
            dice: d,
          });
        }
        g.queue.push(pay(p, s.owner, amount, "Аренда: " + c.name));
      }
      return;
    }
    if (c.type === "tax") g.queue.push(pay(p, -1, c.amount, c.name));
    else if (c.type === "goToJail") jail(g, p);
    else if (c.type === "chance" || c.type === "chest")
      g.queue.push({ kind: "card", from: p, deck: c.type });
  }
  function card(g, p, deck) {
    const id = g.decks[deck].shift(),
      c = D[deck][id];
    g.card = { deck, id, text: c.text, player: p, serial: g.serial + 1 };
    event(g, c.text, { kind: "card", player: p, deck, id });
    if (c.free) g.players[p].free.push({ deck, id });
    else g.decks[deck].push(id);
    if (c.jail) jail(g, p);
    else if (c.to !== undefined) move(g, p, c.to);
    else if (c.back)
      move(g, p, (g.players[p].position - c.back + 40) % 40, false);
    else if (c.nearest) {
      const from = g.players[p].position;
      let to = (from + 1) % 40;
      while (D.cells[to].type !== c.nearest) to = (to + 1) % 40;
      if (to < from) g.players[p].money += 200;
      g.players[p].position = to;
      event(g, D.cells[to].name, { kind: "move", player: p, from, to });
      land(g, p, c.multiplier);
    } else if (c.cash > 0) g.players[p].money += c.cash;
    else if (c.cash < 0) g.queue.push(pay(p, -1, -c.cash, c.text));
    else if (c.each)
      for (const i of alive(g))
        if (i !== p)
          g.queue.push(
            c.each > 0 ? pay(i, p, c.each, c.text) : pay(p, i, -c.each, c.text),
          );
        else if (c.repair) {
          const amount = g.properties.reduce(
            (sum, s) =>
              sum +
              (s.owner === p
                ? s.level === 5
                  ? c.repair[1]
                  : s.level * c.repair[0]
                : 0),
            0,
          );
          if (amount) g.queue.push(pay(p, -1, amount, c.text));
        }
  }
  function auction(g, task) {
    g.auction = {
      id: task.id,
      building: !!task.building,
      eligible: task.eligible || alive(g),
      passed: [],
      high: -1,
      bid: 0,
      actor: task.eligible?.[0] ?? g.turn,
    };
    if (g.players[g.auction.actor].out) g.auction.actor = alive(g)[0];
    g.phase = "auction";
    event(g, "Начинается аукцион", { kind: "auction", id: task.id });
  }
  function pump(g) {
    if (g.phase === "finished") return;
    while (g.queue.length) {
      const q = g.queue[0];
      if (g.players[q.from]?.out && q.kind !== "inherit") {
        g.queue.shift();
        continue;
      }
      if (q.kind === "pay") {
        if (q.to >= 0 && g.players[q.to].out) q.to = -1;
        if (g.players[q.from].money < q.amount) {
          g.phase = "debt";
          return;
        }
        g.players[q.from].money -= q.amount;
        if (q.to >= 0) g.players[q.to].money += q.amount;
        event(g, q.reason, {
          kind: "payment",
          player: q.from,
          to: q.to,
          amount: q.amount,
        });
        g.queue.shift();
      } else if (q.kind === "buy") {
        g.phase = "buy";
        return;
      } else if (q.kind === "inherit") {
        g.phase = "inherit";
        return;
      } else if (q.kind === "auction") {
        auction(g, q);
        return;
      } else {
        g.queue.shift();
        if (q.kind === "card") card(g, q.from, q.deck);
        if (q.kind === "move") move(g, q.from, q.to);
      }
    }
    if (g.players[g.turn].out) next(g);
    else g.phase = g.resume || "manage";
    g.resume = null;
  }
  function create(n = 4, seed = Date.now(), secure = false) {
    need(int(n, 2, 6), "Нужно от 2 до 6 игроков");
    const g = {
      version: 1,
      secure,
      seed: seed >>> 0,
      players: Array.from({ length: n }, (_, i) => ({
        money: 1500,
        position: 0,
        jail: false,
        attempts: 0,
        free: [],
        out: false,
        token: i,
      })),
      properties: D.cells.map(() => ({
        owner: -1,
        level: 0,
        mortgaged: false,
      })),
      turn: 0,
      round: 1,
      phase: "roll",
      doubles: 0,
      extra: false,
      dice: [1, 1],
      dicePlayer: null,
      utilityDice: null,
      decks: { chance: [], chest: [] },
      queue: [],
      events: [],
      serial: 0,
      winner: -1,
      auction: null,
      trade: null,
      card: null,
    };
    g.decks.chance = shuffle(
      g,
      D.chance.map((_, i) => i),
    );
    g.decks.chest = shuffle(
      g,
      D.chest.map((_, i) => i),
    );
    g.startRolls = g.players.map(() => dice(g));
    let tied = g.startRolls.map((_, i) => i);
    while (tied.length > 1) {
      const max = Math.max(
        ...tied.map((i) => g.startRolls[i][0] + g.startRolls[i][1]),
      );
      tied = tied.filter(
        (i) => g.startRolls[i][0] + g.startRolls[i][1] === max,
      );
      if (tied.length > 1) for (const i of tied) g.startRolls[i] = dice(g);
    }
    g.turn = tied[0];
    event(g, "Первый ход определён броском кубиков", {
      kind: "start",
      player: g.turn,
    });
    return g;
  }
  function buildable(g, p, id) {
    const s = g.properties[id];
    return (
      D.cells[id].type === "street" &&
      owns(g, p, id) &&
      monopoly(g, p, id) &&
      s.level < 5 &&
      group(id).every(
        (k) => !g.properties[k].mortgaged && g.properties[k].level >= s.level,
      )
    );
  }
  function liquid(g, p) {
    return (
      g.players[p].money +
      g.properties.reduce(
        (sum, s, id) =>
          sum +
          (s.owner === p
            ? (!s.mortgaged ? D.cells[id].mortgage : 0) +
              (s.level * (D.cells[id].house || 0)) / 2
            : 0),
        0,
      )
    );
  }
  function bankrupt(g, p, forced = false) {
    const debt = g.queue[0];
    need(g.phase === "debt" && debt.from === p, "Сейчас нет долга");
    need(
      forced || liquid(g, p) < debt.amount,
      "Долг можно оплатить: продайте здания или заложите собственность",
    );
    const recipient = debt.to,
      pl = g.players[p];
    if (recipient >= 0) g.players[recipient].money += pl.money;
    pl.money = 0;
    pl.out = true;
    pl.jail = false;
    if (p === g.turn) g.extra = false;
    const inherited = [],
      auctions = [];
    for (let id = 0; id < 40; id++) {
      const s = g.properties[id];
      if (s.owner !== p) continue;
      if (recipient >= 0) {
        g.players[recipient].money += (s.level * (D.cells[id].house || 0)) / 2;
        s.level = 0;
        s.owner = recipient;
        if (s.mortgaged) inherited.push(id);
      } else {
        s.owner = -1;
        s.level = 0;
        s.mortgaged = false;
        auctions.push({ kind: "auction", id });
      }
    }
    if (recipient >= 0) g.players[recipient].free.push(...pl.free);
    else for (const f of pl.free) g.decks[f.deck].push(f.id);
    pl.free = [];
    g.queue.shift();
    g.queue = g.queue.filter((q) => q.from !== p);
    g.queue.unshift(
      ...(inherited.length
        ? [{ kind: "inherit", from: recipient, ids: inherited }]
        : []),
      ...auctions,
    );
    event(g, "Банкротство", { kind: "bankrupt", player: p, to: recipient });
    if (alive(g).length === 1) {
      g.phase = "finished";
      g.winner = alive(g)[0];
      event(g, "Победа", { kind: "win", player: g.winner });
    } else pump(g);
  }
  function settleAuction(g) {
    const a = g.auction;
    if (a.high >= 0) {
      g.players[a.high].money -= a.bid;
      if (a.building) g.properties[a.targets[a.high]].level++;
      else g.properties[a.id].owner = a.high;
      event(g, "Победа на аукционе", {
        kind: "auctionWin",
        player: a.high,
        id: a.building ? a.targets[a.high] : a.id,
        amount: a.bid,
      });
    }
    g.auction = null;
    g.queue.shift();
    pump(g);
  }
  function auctionNext(g) {
    const a = g.auction,
      remaining = a.eligible.filter(
        (i) => !a.passed.includes(i) && i !== a.high,
      );
    if (!remaining.length) {
      settleAuction(g);
      return;
    }
    do {
      a.actor = (a.actor + 1) % g.players.length;
    } while (!remaining.includes(a.actor));
  }
  function validateTrade(g, t) {
    need(
      int(t.from, 0, g.players.length - 1) &&
        int(t.to, 0, g.players.length - 1) &&
        t.from !== t.to &&
        !g.players[t.from].out &&
        !g.players[t.to].out,
      "Выберите другого участника",
    );
    for (const side of ["give", "want"]) {
      const offer = t[side],
        p = side === "give" ? t.from : t.to;
      need(
        offer &&
          int(offer.cash) &&
          Array.isArray(offer.ids) &&
          Array.isArray(offer.cards),
        "Неверный обмен",
      );
      need(
        new Set(offer.ids).size === offer.ids.length &&
          offer.ids.every(
            (id) =>
              int(id, 0, 39) &&
              owns(g, p, id) &&
              (!D.cells[id].rents ||
                group(id).every((k) => g.properties[k].level === 0)),
          ),
        "Нельзя передать чужую собственность или квартал со зданиями",
      );
      need(
        new Set(offer.cards).size === offer.cards.length &&
          offer.cards.every((i) => int(i, 0, g.players[p].free.length - 1)),
        "Нет такой карты освобождения",
      );
    }
    need(
      t.give.cash ||
        t.want.cash ||
        t.give.ids.length ||
        t.want.ids.length ||
        t.give.cards.length ||
        t.want.cards.length,
      "Обмен пуст",
    );
  }
  function apply(g, p, m) {
    need(m && typeof m === "object" && !Array.isArray(m), "Неверное действие");
    need(
      int(p, 0, g.players.length - 1) &&
        !g.players[p].out &&
        g.phase !== "finished",
      "Игрок не участвует",
    );
    const type = m.type;
    if (type === "surrender") {
      const original = g.phase;
      if (g.trade) {
        g.phase = g.resume || "manage";
        g.resume = null;
        g.trade = null;
      }
      if (!["buy", "debt", "inherit", "auction"].includes(g.phase))
        g.resume = g.phase;
      if (original === "auction") g.auction = null;
      if (!(g.phase === "debt" && g.queue[0]?.from === p))
        g.queue.unshift(
          pay(p, -1, 1000000000, "Добровольное завершение участия"),
        );
      g.phase = "debt";
      bankrupt(g, p, true);
      return;
    }
    if (
      ["build", "sell", "sellGroup", "mortgage", "unmortgage"].includes(type)
    ) {
      need(
        ["roll", "jail", "manage", "buy", "debt"].includes(g.phase) ||
          (g.phase === "auction" &&
            ["sell", "sellGroup", "mortgage"].includes(type)),
        "Сначала завершите текущее действие",
      );
      need(
        g.phase !== "debt" || who(g) === p,
        "Сначала другой игрок должен оплатить долг",
      );
      need(int(m.id, 0, 39) && owns(g, p, m.id), "Это не ваша собственность");
      const id = m.id,
        c = D.cells[id],
        s = g.properties[id],
        pl = g.players[p],
        ids = c.rents ? group(id) : [id];
      if (type === "mortgage") {
        need(
          !s.mortgaged && ids.every((k) => g.properties[k].level === 0),
          "Сначала продайте все здания этого квартала",
        );
        s.mortgaged = true;
        pl.money += c.mortgage;
      }
      if (type === "unmortgage") {
        const cost = Math.ceil(c.mortgage * 1.1);
        need(
          s.mortgaged && pl.money >= cost,
          "Не хватает денег для снятия залога",
        );
        s.mortgaged = false;
        pl.money -= cost;
      }
      if (type === "build") {
        need(
          buildable(g, p, id),
          "Стройте равномерно в полном квартале без залогов",
        );
        const available = stock(g)[s.level === 4 ? "hotels" : "houses"];
        need(available > 0, "В банке закончились здания");
        need(pl.money >= c.house, "Не хватает денег");
        if (available === 1) {
          const kind = s.level === 4 ? "hotel" : "house",
            eligible = alive(g).filter((i) =>
              D.cells.some(
                (x) =>
                  buildable(g, i, x.id) &&
                  (g.properties[x.id].level === 4 ? "hotel" : "house") === kind,
              ),
            );
          if (eligible.length > 1) {
            g.resume = g.phase;
            g.queue.unshift({ kind: "auction", id, building: true, eligible });
            auction(g, g.queue[0]);
            g.auction.kind = kind;
            g.auction.targets = {};
            return;
          }
        }
        pl.money -= c.house;
        s.level++;
      }
      if (type === "sell") {
        need(
          c.rents &&
            s.level > 0 &&
            ids.every((k) => g.properties[k].level <= s.level),
          "Продавайте здания равномерно",
        );
        need(
          s.level !== 5 || stock(g).houses >= 4,
          "Нет четырёх домов для размена отеля: продайте здания всего квартала",
        );
        s.level--;
        pl.money += c.house / 2;
      }
      if (type === "sellGroup") {
        need(c.rents, "Здесь нет зданий");
        for (const k of ids) {
          need(owns(g, p, k), "Квартал должен принадлежать вам");
          pl.money += (g.properties[k].level * c.house) / 2;
          g.properties[k].level = 0;
        }
      }
      event(
        g,
        {
          build: "Построено здание",
          sell: "Продано здание",
          sellGroup: "Проданы здания квартала",
          mortgage: "Собственность заложена",
          unmortgage: "Залог погашен",
        }[type],
        { kind: type, player: p, id },
      );
      if (g.phase === "debt") pump(g);
      return;
    }
    if (type === "offer") {
      need(
        ["roll", "jail", "manage", "buy", "debt"].includes(g.phase),
        "Сначала завершите текущее действие",
      );
      need(
        g.phase !== "debt" || p === who(g) || m.to === who(g),
        "Сначала помогите игроку с долгом",
      );
      const t = {
        from: p,
        to: m.to,
        give: copy(m.give),
        want: copy(m.want),
        redeem: Array.isArray(m.redeem) ? m.redeem : [],
      };
      validateTrade(g, t);
      need(
        g.players[p].money >= t.give.cash &&
          g.players[t.to].money >= t.want.cash,
        "Не хватает денег для предложения",
      );
      g.resume = g.phase;
      g.trade = t;
      g.phase = "trade";
      event(g, "Предложен обмен", { kind: "offer", player: p, to: t.to });
      return;
    }
    if (type === "cancel") {
      need(g.phase === "trade" && g.trade.from === p, "Нет вашего предложения");
      g.trade = null;
      g.phase = g.resume;
      g.resume = null;
      return;
    }
    need(who(g) === p, "Сейчас действует другой игрок");
    const pl = g.players[p];
    if (type === "roll") {
      need(["roll", "jail"].includes(g.phase), "Сейчас нельзя бросать кубики");
      const inJail = pl.jail,
        d = dice(g),
        double = d[0] === d[1];
      g.dice = d;
      g.dicePlayer = p;
      g.utilityDice = null;
      g.card = null;
      event(g, "Бросок кубиков", { kind: "dice", player: p, dice: d });
      g.phase = "manage";
      if (inJail) {
        pl.attempts++;
        g.extra = false;
        if (double) {
          pl.jail = false;
          pl.attempts = 0;
          move(g, p, (pl.position + d[0] + d[1]) % 40);
        } else if (pl.attempts >= 3) {
          pl.jail = false;
          pl.attempts = 0;
          g.queue.push(pay(p, -1, 50, "Третья попытка: освобождение"), {
            kind: "move",
            from: p,
            to: (10 + d[0] + d[1]) % 40,
          });
        }
      } else {
        g.extra = double;
        g.doubles = double ? g.doubles + 1 : 0;
        if (g.doubles === 3) jail(g, p);
        else move(g, p, (pl.position + d[0] + d[1]) % 40);
      }
      pump(g);
      return;
    }
    if (type === "bail" || type === "free") {
      need(g.phase === "jail" && pl.jail, "Игрок не в тюрьме");
      if (type === "free") {
        need(int(m.card, 0, pl.free.length - 1), "Выберите карту освобождения");
        const f = pl.free.splice(m.card, 1)[0];
        g.decks[f.deck].push(f.id);
      } else {
        need(pl.money >= 50, "Нужно 50 для освобождения");
        pl.money -= 50;
      }
      pl.jail = false;
      pl.attempts = 0;
      g.phase = "roll";
      event(g, "Освобождение из тюрьмы", { kind: type, player: p });
      return;
    }
    if (type === "end") {
      need(g.phase === "manage", "Сначала завершите действие");
      if (g.extra && !pl.jail) {
        g.extra = false;
        g.phase = "roll";
        event(g, "Дубль — ещё один бросок", { kind: "extra", player: p });
      } else next(g);
      return;
    }
    if (type === "buy" || type === "auction") {
      need(g.phase === "buy", "Нет покупки");
      const q = g.queue[0],
        c = D.cells[q.id];
      if (type === "buy") {
        need(
          pl.money >= c.price,
          "Не хватает денег: можно заложить собственность или начать аукцион",
        );
        pl.money -= c.price;
        g.properties[q.id].owner = p;
        g.queue.shift();
        event(g, "Куплена собственность", {
          kind: "buy",
          player: p,
          id: q.id,
          amount: c.price,
        });
        pump(g);
      } else {
        q.kind = "auction";
        auction(g, q);
      }
      return;
    }
    if (type === "bid" || type === "pass") {
      need(g.phase === "auction", "Нет аукциона");
      const a = g.auction;
      if (type === "pass") a.passed.push(p);
      else {
        need(
          int(m.amount, Math.max(10, a.bid + 1)) && pl.money >= m.amount,
          "Ставка должна быть выше текущей и в пределах наличных",
        );
        if (a.building) {
          need(
            int(m.id, 0, 39) &&
              buildable(g, p, m.id) &&
              (g.properties[m.id].level === 4 ? "hotel" : "house") === a.kind,
            "Выберите место для выигранного здания",
          );
          a.targets[p] = m.id;
        }
        a.high = p;
        a.bid = m.amount;
      }
      auctionNext(g);
      return;
    }
    if (type === "bankrupt") {
      bankrupt(g, p);
      return;
    }
    if (type === "inherit") {
      need(g.phase === "inherit", "Нет переданных залогов");
      const q = g.queue.shift(),
        redeem = Array.isArray(m.redeem) ? m.redeem : [];
      need(
        new Set(redeem).size === redeem.length &&
          redeem.every((id) => q.ids.includes(id)),
        "Неверный список погашения",
      );
      let fee = 0;
      for (const id of q.ids) {
        const principal = D.cells[id].mortgage;
        fee += Math.ceil(principal * 0.1);
        if (redeem.includes(id)) {
          fee += principal;
          g.properties[id].mortgaged = false;
        }
      }
      g.queue.unshift(pay(p, -1, fee, "Проценты по переданным залогам"));
      pump(g);
      return;
    }
    if (type === "accept" || type === "reject") {
      need(g.phase === "trade", "Нет предложения обмена");
      const t = g.trade;
      if (type === "accept") {
        validateTrade(g, t);
        const redeem = Array.isArray(m.redeem) ? m.redeem : [];
        need(
          redeem.every((id) => t.give.ids.includes(id)) &&
            t.redeem.every((id) => t.want.ids.includes(id)),
          "Неверное погашение",
        );
        const fee = (ids, r) =>
            ids.reduce(
              (n, id) =>
                n +
                (g.properties[id].mortgaged
                  ? Math.ceil(D.cells[id].mortgage * 0.1) +
                    (r.includes(id) ? D.cells[id].mortgage : 0)
                  : 0),
              0,
            ),
          aFee = fee(t.want.ids, t.redeem),
          bFee = fee(t.give.ids, redeem);
        need(
          g.players[t.from].money - t.give.cash + t.want.cash >= aFee &&
            pl.money - t.want.cash + t.give.cash >= bFee,
          "Не хватает денег с учётом процентов по залогам",
        );
        g.players[t.from].money += t.want.cash - t.give.cash - aFee;
        pl.money += t.give.cash - t.want.cash - bFee;
        for (const [side, owner, r] of [
          [t.give, t.to, redeem],
          [t.want, t.from, t.redeem],
        ])
          for (const id of side.ids) {
            g.properties[id].owner = owner;
            if (r.includes(id)) g.properties[id].mortgaged = false;
          }
        const ca = t.give.cards.map((i) => g.players[t.from].free[i]),
          cb = t.want.cards.map((i) => pl.free[i]);
        g.players[t.from].free = g.players[t.from].free
          .filter((_, i) => !t.give.cards.includes(i))
          .concat(cb);
        pl.free = pl.free
          .filter((_, i) => !t.want.cards.includes(i))
          .concat(ca);
        event(g, "Обмен принят", { kind: "trade", player: t.from, to: p });
      } else event(g, "Обмен отклонён", { kind: "reject", player: p });
      g.trade = null;
      g.phase = g.resume;
      g.resume = null;
      if (g.phase === "debt") pump(g);
      return;
    }
    throw Error("Неизвестное действие");
  }
  function action(g, p, m) {
    const draft = copy(g);
    apply(draft, p, m);
    if (draft.serial === g.serial)
      event(
        draft,
        {
          bid: "Ставка: " + m.amount,
          pass: "Пас на аукционе",
          cancel: "Предложение отозвано",
          inherit: "Оплата переданных залогов",
        }[m.type] || "Действие выполнено",
        { kind: m.type, player: p },
      );
    Object.assign(g, draft);
    return g;
  }
  function view(g, me) {
    const v = copy(g);
    delete v.seed;
    delete v.decks;
    v.me = me;
    v.actor = who(g);
    v.stock = stock(g);
    return v;
  }
  function assert(g) {
    need(
      g.players.every((p) => int(p.money, 0, 1e9)),
      "Неверные деньги",
    );
    need(stock(g).houses >= 0 && stock(g).hotels >= 0, "Не хватает зданий");
    for (const [id, s] of g.properties.entries()) {
      need(
        int(s.level, 0, 5) && int(s.owner, -1, g.players.length - 1),
        "Неверная собственность",
      );
      if (s.level)
        need(
          monopoly(g, s.owner, id) &&
            group(id).every(
              (k) =>
                !g.properties[k].mortgaged &&
                Math.abs(g.properties[k].level - s.level) <= 1,
            ),
          "Неравномерные здания",
        );
    }
    return true;
  }
  const api = {
    create,
    action,
    view,
    who,
    stock,
    rent,
    group,
    monopoly,
    buildable,
    liquid,
    assert,
    создать: create,
    действие: action,
    вид: view,
    кто: who,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.МонополияПравила = api;
})(typeof window !== "undefined" ? window : globalThis);
