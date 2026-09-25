"use strict";
(function () {
  const P = window.МонополияПравила,
    D = window.МонополияДанные,
    B = window.МонополияБот,
    F = window.МонополияПоле,
    $ = (id) => document.getElementById(id),
    KEY = "monopoly-match-v1";
  let game = null,
    v = null,
    previous = null,
    online = false,
    network = null,
    timer = null,
    busy = false,
    record = null,
    lastCard = null,
    lastWinner = null,
    prefs = { n: 4, pace: 4500 },
    dialogKind = "",
    presenting = false,
    presentationTimer = null;
  const el = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  const button = (text, fn, gold = false) => {
    const b = el("button", text, "mono-btn" + (gold ? " mono-gold" : ""));
    b.type = "button";
    b.onclick = fn;
    return b;
  };
  const money = (x) => Number(x).toLocaleString("ru-RU");
  const name = (i) =>
    i < 0 ? "Банк" : i === v?.me ? "Вы" : v?.names?.[i] || `Бот ${i}`;
  function token(i) {
    const e = el("span", undefined, "mono-token");
    e.style.setProperty("--tx", ((i % 4) / 3) * 100 + "%");
    e.style.setProperty("--ty", Math.floor(i / 4) * 100 + "%");
    e.setAttribute("aria-hidden", "true");
    return e;
  }
  function portrait(i) {
    const e = el("span", undefined, "mono-portrait");
    e.style.setProperty("--px", (i % 3) * 50 + "%");
    e.style.setProperty("--py", Math.floor(i / 3) * 100 + "%");
    e.setAttribute("aria-hidden", "true");
    return e;
  }
  function art(id) {
    const c = D.cells[id],
      e = el("div", undefined, "mono-art"),
      group = c.group ?? 0;
    e.style.setProperty("--tx", ((group % 4) / 3) * 100 + "%");
    e.style.setProperty("--ty", Math.floor(group / 4) * 100 + "%");
    return e;
  }
  function save() {
    try {
      localStorage.setItem("monopoly-prefs", JSON.stringify(prefs));
      if (record) localStorage.setItem(KEY, JSON.stringify(record));
    } catch (_) {
      $("mono-error").textContent =
        "Браузер не разрешил сохранить партию. Не закрывайте вкладку до завершения.";
    }
  }
  try {
    Object.assign(
      prefs,
      JSON.parse(localStorage.getItem("monopoly-prefs")) || {},
    );
    if (![2, 3, 4, 5, 6].includes(prefs.n)) prefs.n = 4;
    if (![2500, 4500, 6500].includes(prefs.pace)) prefs.pace = 4500;
    const r = JSON.parse(localStorage.getItem(KEY));
    if (
      r &&
      r.version === 1 &&
      Array.isArray(r.actions) &&
      r.actions.length < 30000
    ) {
      const restored = P.create(r.n, r.seed);
      for (const x of r.actions) P.action(restored, x.p, x.move);
      P.assert(restored);
      game = restored;
      record = r;
    }
  } catch (_) {
    $("mono-error").textContent = "Сохранённую партию не удалось восстановить.";
  }
  function screen(id) {
    clearTimeout(timer);
    if (id !== "экран-игры") {
      clearTimeout(presentationTimer);
      presenting = false;
    }
    if (id === "экран-меню") id = "экран-лобби";
    document
      .querySelectorAll(".экран")
      .forEach((e) => e.classList.toggle("экран--виден", e.id === id));
    $("mono-resume").classList.toggle(
      "скрыт",
      !game || game.phase === "finished",
    );
    window.Телеграм?.показатьСтрелку(back);
  }
  function modal(title, kind = "") {
    clearTimeout(timer);
    dialogKind = kind;
    $("mono-modal-title").textContent = title;
    const body = $("mono-modal-body");
    body.replaceChildren();
    if (!$("mono-modal").open) $("mono-modal").showModal();
    return body;
  }
  function close() {
    dialogKind = "";
    $("mono-modal").close();
    schedule();
  }
  function back() {
    if ($("mono-modal").open) {
      close();
      return;
    }
    if ($("mono-board-wrap").classList.contains("mono-zoom")) {
      zoom();
      return;
    }
    if ($("экран-комнаты").classList.contains("экран--виден")) {
      $("кнопка-комната-отмена").click();
      return;
    }
    if ($("экран-лобби").classList.contains("экран--виден")) {
      location.href = "index.html";
      return;
    }
    if (online && $("экран-игры").classList.contains("экран--виден")) {
      const body = modal("Вернуться в меню?");
      body.append(
        el(
          "p",
          "Партия онлайн продолжится. Вы сможете вернуться к своему столу.",
        ),
        button("В меню", () => {
          close();
          screen("экран-лобби");
        }),
        button("Остаться в игре", close, true),
      );
      return;
    }
    screen("экран-лобби");
  }
  function fresh() {
    clearTimeout(presentationTimer);
    presenting = false;
    online = false;
    network = null;
    previous = null;
    lastCard = null;
    lastWinner = null;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    record = {
      version: 1,
      n: prefs.n,
      seed,
      actions: [],
      id: Date.now(),
      result: false,
    };
    game = P.create(prefs.n, seed);
    save();
    screen("экран-игры");
    render();
  }
  function local(p, move) {
    P.action(game, p, move);
    record.actions.push({ p, move });
    save();
  }
  async function act(move) {
    if (busy || presenting) return false;
    busy = true;
    $("mono-error").textContent = "";
    try {
      if (online) {
        const r = await window.Сеть.отправитьХод({
          действие: "монополия",
          move,
        });
        if (!r?.принято)
          throw Error(r?.причина || "Нет связи. Повторите действие.");
      } else local(0, move);
      if ($("mono-modal").open && dialogKind !== "rules") close();
      return true;
    } catch (e) {
      $("mono-error").textContent = e.message;
      if ($("mono-modal").open) {
        let error = $("mono-dialog-error");
        if (!error) {
          error = el("p", undefined, "mono-error");
          error.id = "mono-dialog-error";
          $("mono-modal-body").append(error);
        }
        error.textContent = e.message;
      }
      return false;
    } finally {
      busy = false;
      render();
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (
      online ||
      !game ||
      game.phase === "finished" ||
      busy ||
      presenting ||
      $("mono-modal").open ||
      !$("экран-игры").classList.contains("экран--виден") ||
      P.who(game) === 0
    )
      return;
    timer = setTimeout(() => {
      try {
        const p = P.who(game);
        local(p, B.move(P.view(game, p)));
        render();
      } catch (e) {
        $("mono-error").textContent = "Не удалось выполнить ход: " + e.message;
      }
    }, prefs.pace);
  }
  function dice() {
    const tray = $("mono-dice");
    tray.replaceChildren();
    const values =
        v.utilityDice ||
        (v.dicePlayer === null ? v.startRolls[v.turn] : v.dice),
      roll = v.events
        .filter((e) => ["dice", "utilityDice"].includes(e.kind))
        .at(-1),
      old = previous?.events
        .filter((e) => ["dice", "utilityDice"].includes(e.kind))
        .at(-1);
    const pips = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    for (const [i, value] of values.entries()) {
      const space = el("div", undefined, "mono-die-space"),
        shadow = el("span", undefined, "mono-die-shadow");
      const cube = el("div", undefined, "mono-die");
      cube.dataset.value = value;
      cube.setAttribute("aria-label", "Кубик: " + value);
      const resting = `rotateX(-55deg) rotateY(${i ? -22 : 22}deg) rotateZ(${i ? 7 : -7}deg)`;
      cube.style.transform = resting;
      for (const n of (() => {
        const rest = [1, 2, 3, 4, 5, 6].filter(
            (x) => x !== value && x !== 7 - value,
          ),
          a = rest[0],
          b = rest.find((x) => x !== a && x !== 7 - a);
        return [b, 7 - b, a, 7 - a, value, 7 - value];
      })()) {
        const face = el("span", undefined, "mono-face");
        for (let j = 0; j < 9; j++)
          face.append(
            el("i", undefined, pips[n].includes(j) ? "mono-pip" : ""),
          );
        cube.append(face);
      }
      space.append(shadow, cube);
      tray.append(space);
      if (
        roll &&
        roll.id !== old?.id &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        cube.animate(
          [
            {
              transform: `translate3d(${i ? 25 : -25}px,-85px,35px) rotateX(620deg) rotateY(470deg) rotateZ(-35deg)`,
              offset: 0,
              easing: "cubic-bezier(.55,.06,.8,.55)",
            },
            {
              transform: `translate3d(${i ? -8 : 8}px,3px,0) rotateX(265deg) rotateY(190deg) rotateZ(17deg)`,
              offset: 0.42,
              easing: "cubic-bezier(.15,.65,.35,1)",
            },
            {
              transform: `translate3d(${i ? -4 : 4}px,-23px,0) rotateX(130deg) rotateY(100deg) rotateZ(-13deg)`,
              offset: 0.6,
              easing: "cubic-bezier(.55,.05,.8,.65)",
            },
            {
              transform: `translate3d(0,2px,0) rotateX(-64deg) rotateY(${i ? -31 : 31}deg) rotateZ(${i ? 11 : -11}deg)`,
              offset: 0.78,
              easing: "ease-out",
            },
            { transform: `translateY(-5px) ${resting}`, offset: 0.87 },
            { transform: resting, offset: 1 },
          ],
          { duration: 1550 + i * 130, easing: "linear" },
        );
        shadow.animate(
          [
            { transform: "scale(.6)", opacity: 0.15, offset: 0 },
            { transform: "scale(1)", opacity: 0.65, offset: 0.42 },
            { transform: "scale(.8)", opacity: 0.3, offset: 0.6 },
            { transform: "scale(1)", opacity: 0.65, offset: 0.78 },
            { transform: "scale(.95)", opacity: 0.55, offset: 1 },
          ],
          { duration: 1550 + i * 130 },
        );
      }
    }
    tray.append(el("strong", String(values[0] + values[1]), "mono-dice-sum"));
    tray.title = roll
      ? `${name(roll.player)}: ${values.join(" + ")}`
      : "Кубики готовы к броску";
    tray.setAttribute("aria-label", tray.title);
    tray.append(
      el(
        "small",
        roll
          ? (roll.kind === "utilityDice" ? "Услуги · " : "") +
              name(roll.player) +
              " · последний бросок"
          : "Первый ход: " + name(v.turn),
        "mono-dice-caption",
      ),
    );
  }
  function logText(e) {
    const prefix = e.player !== undefined ? name(e.player) + ": " : "";
    return (
      prefix +
      e.text +
      (e.kind === "dice" || e.kind === "utilityDice"
        ? " " + e.dice.join(" + ") + " = " + (e.dice[0] + e.dice[1])
        : e.kind === "payment"
          ? ` · ${money(e.amount)} → ${name(e.to)}`
          : e.kind === "buy" || e.kind === "auctionWin"
            ? ` · ${D.cells[e.id].name} · ${money(e.amount)}`
            : "")
    );
  }
  function render() {
    if (!online && game) {
      v = P.view(game, 0);
      v.names = game.players.map((_, i) =>
        i === 0 ? window.Телеграм?.имяИгрока?.() || "Вы" : `Бот ${i}`,
      );
    }
    if (!v) return;
    if (
      previous &&
      v.events.some(
        (e) =>
          e.id > previous.serial && ["dice", "utilityDice"].includes(e.kind),
      ) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      clearTimeout(presentationTimer);
      presenting = true;
      presentationTimer = setTimeout(() => {
        presenting = false;
        render();
      }, 3500);
    }
    $("mono-round").textContent =
      `Ход ${v.round} · ${v.players.filter((p) => !p.out).length} в игре`;
    const players = $("mono-players");
    players.style.setProperty("--players", Math.min(v.players.length, 4));
    players.dataset.n = v.players.length;
    players.replaceChildren(
      ...v.players.map((p, i) => {
        const row = el(
          "div",
          undefined,
          "mono-player" +
            (v.actor === i ? " active" : "") +
            (p.out ? " out" : ""),
        );
        row.style.setProperty("--pc", F.colors[i]);
        const text = el("div");
        text.style.minWidth = "0";
        text.append(
          el("b", name(i), "mono-player-name"),
          el("strong", money(p.money)),
          el(
            "small",
            p.out
              ? "Банкрот"
              : p.jail
                ? "В тюрьме"
                : v.actor === i
                  ? "Сейчас действует"
                  : `${v.properties.filter((s) => s.owner === i).length} владений`,
          ),
        );
        const piece = token(p.token);
        piece.classList.add("mono-player-piece");
        row.append(portrait(i), text, piece);
        return row;
      }),
    );
    F.draw($("mono-board"), v, property, previous);
    dice();
    $("mono-turn").textContent =
      v.phase === "finished"
        ? v.winner === v.me
          ? "Вы победили!"
          : `Победитель: ${name(v.winner)}`
        : v.actor === v.me
          ? "Ваш ход"
          : `Действует ${name(v.actor)}`;
    const hints = {
      roll: "Бросьте кубики и двигайтесь по городу.",
      jail: "Заплатите 50, используйте карту или попробуйте выбросить дубль.",
      manage: v.extra
        ? "Дубль даёт ещё один бросок. Можно управлять собственностью."
        : "Можно строить, обмениваться и завершить ход.",
      buy: "Купить по цене клетки или выставить на аукцион.",
      auction: "В торгах участвуют все, включая отказавшегося от покупки.",
      debt: "Нужно оплатить долг. Продайте здания или заложите собственность.",
      trade: "Участник рассматривает предложение обмена.",
      inherit: "При получении залога нужно заплатить 10% банку.",
      finished: "Последний оставшийся в игре участник победил.",
    };
    $("mono-hint").textContent = hints[v.phase] || "";
    const actions = $("mono-actions");
    actions.dataset.phase = v.phase;
    actions.replaceChildren();
    const mine = v.actor === v.me,
      p = v.players[v.me];
    const action = (label, move, gold = false) =>
      actions.append(button(label, () => act(move), gold));
    if (v.phase === "finished") {
      actions.append(button("Итоги партии", results, true));
      if (!online && record && !record.result) {
        let h = [];
        try {
          h = JSON.parse(localStorage.getItem("monopoly-history")) || [];
        } catch (_) {}
        h.unshift({
          date: Date.now(),
          win: v.winner === 0,
          round: v.round,
          n: v.players.length,
        });
        localStorage.setItem(
          "monopoly-history",
          JSON.stringify(h.slice(0, 30)),
        );
        record.result = true;
        save();
      }
      if (lastWinner !== v.winner) {
        lastWinner = v.winner;
        results();
      }
    } else if (v.phase === "buy") {
      const c = D.cells[v.queue[0].id];
      actions.append(art(c.id));
      actions.append(el("h3", c.name), el("div", money(c.price), "mono-price"));
      if (mine) {
        action("Купить за " + money(c.price), { type: "buy" }, true);
        action("На аукцион", { type: "auction" });
      } else
        actions.append(
          el("p", name(v.actor) + " выбирает: купить или начать торги."),
        );
    } else if (v.phase === "auction") {
      const a = v.auction;
      actions.append(
        el("h3", a.building ? "Аукцион здания" : D.cells[a.id].name),
        el("div", a.bid ? money(a.bid) : "От 10", "mono-price"),
        el("p", a.high >= 0 ? "Лидер: " + name(a.high) : "Ставок пока нет"),
      );
      if (mine) {
        const bid = el("input");
        bid.type = "number";
        bid.min = Math.max(10, a.bid + 1);
        bid.max = p.money;
        bid.value = Math.max(10, a.bid + 10);
        bid.setAttribute("aria-label", "Ваша ставка");
        actions.append(bid);
        let target = null;
        if (a.building) {
          target = el("select");
          target.setAttribute("aria-label", "Куда поставить здание");
          D.cells
            .filter(
              (c) =>
                P.buildable(v, v.me, c.id) &&
                (v.properties[c.id].level === 4 ? "hotel" : "house") === a.kind,
            )
            .forEach((c) => {
              const o = el("option", c.name);
              o.value = c.id;
              target.append(o);
            });
          actions.append(target);
        }
        actions.append(
          button(
            "Сделать ставку",
            () =>
              act({
                type: "bid",
                amount: Number(bid.value),
                ...(target ? { id: Number(target.value) } : {}),
              }),
            true,
          ),
        );
        action("Пас", { type: "pass" });
      }
    } else if (v.phase === "debt") {
      const q = v.queue[0];
      actions.append(
        el("h3", q.reason),
        el("div", money(q.amount), "mono-price"),
        el(
          "p",
          `Получатель: ${name(q.to)} · Наличные: ${money(v.players[q.from].money)}`,
        ),
      );
      if (mine) {
        actions.append(
          button("Продать здания / заложить", () => properties(), true),
        );
        if (P.liquid(v, v.me) < q.amount)
          actions.append(
            button("Объявить банкротство", () => {
              const b = modal("Объявить банкротство?");
              b.append(
                el(
                  "p",
                  "Имущества недостаточно для оплаты долга. Вы покинете эту партию.",
                ),
                button(
                  "Объявить банкротство",
                  () => act({ type: "bankrupt" }),
                  true,
                ),
                button("Вернуться", close),
              );
            }),
          );
      }
    } else if (v.phase === "inherit") {
      actions.append(el("h3", "Получены заложенные владения"));
      if (mine) {
        const ids = v.queue[0].ids,
          checks = [];
        for (const id of ids) {
          const label = el("label", undefined, "mono-check"),
            input = el("input");
          input.type = "checkbox";
          checks.push([id, input]);
          label.append(
            input,
            el(
              "span",
              `${D.cells[id].name}: погасить ${Math.ceil(D.cells[id].mortgage * 1.1)} (оставить залог: ${Math.ceil(D.cells[id].mortgage * 0.1)})`,
            ),
          );
          actions.append(label);
        }
        actions.append(
          button(
            "Оплатить и продолжить",
            () =>
              act({
                type: "inherit",
                redeem: checks.filter((x) => x[1].checked).map((x) => x[0]),
              }),
            true,
          ),
        );
      }
    } else if (v.phase === "trade") {
      const t = v.trade;
      actions.append(
        el("h3", "Предложение обмена"),
        el("p", `${name(t.from)} → ${name(t.to)}`),
        el("p", "Отдаёт: " + bundle(t.give)),
        el("p", "Получает: " + bundle(t.want)),
      );
      if (mine) {
        actions.append(
          button(
            "Принять обмен",
            () => {
              const ids = t.give.ids.filter((id) => v.properties[id].mortgaged);
              if (!ids.length) {
                act({ type: "accept" });
                return;
              }
              const body = modal("Получение заложенных владений"),
                checks = [];
              for (const id of ids) {
                const label = el("label", undefined, "mono-check"),
                  input = el("input");
                input.type = "checkbox";
                checks.push([id, input]);
                label.append(
                  input,
                  el(
                    "span",
                    D.cells[id].name +
                      " — погасить сразу за " +
                      Math.ceil(D.cells[id].mortgage * 1.1),
                  ),
                );
                body.append(label);
              }
              body.append(
                el(
                  "p",
                  "Для неотмеченных владений будет оплачено 10% банку, залог останется.",
                ),
                button(
                  "Подтвердить обмен",
                  () =>
                    act({
                      type: "accept",
                      redeem: checks
                        .filter((x) => x[1].checked)
                        .map((x) => x[0]),
                    }),
                  true,
                ),
              );
            },
            true,
          ),
        );
        action("Отклонить", { type: "reject" });
      } else if (t.from === v.me)
        action("Отозвать предложение", { type: "cancel" });
    } else if (mine) {
      if (v.phase === "roll") action("Бросить кубики", { type: "roll" }, true);
      if (v.phase === "jail") {
        action("Попробовать дубль", { type: "roll" }, true);
        action("Выйти за 50", { type: "bail" });
        if (p.free.length)
          action("Использовать карту", { type: "free", card: 0 });
      }
      if (v.phase === "manage")
        action(
          v.extra ? "Следующий бросок" : "Завершить ход",
          { type: "end" },
          true,
        );
    } else {
      const wait = el("div", undefined, "mono-wait");
      wait.innerHTML = "<i></i><i></i><i></i>";
      actions.append(
        wait,
        el(
          "p",
          v.players[v.actor]?.jail
            ? "Решает, как выйти из тюрьмы…"
            : "Обдумывает действие…",
        ),
      );
    }
    $("mono-properties").disabled = p.out;
    $("mono-trade").disabled =
      p.out || !["roll", "jail", "manage", "buy", "debt"].includes(v.phase);
    $("mono-event").textContent = v.events.slice(-1).map(logText).join(" · ");
    previous = JSON.parse(JSON.stringify(v));
    if (presenting)
      actions
        .querySelectorAll("button,input,select")
        .forEach((e) => (e.disabled = true));
    if (
      v.card &&
      v.card.serial !== lastCard &&
      v.phase !== "finished" &&
      !presenting &&
      !$("mono-modal").open
    ) {
      lastCard = v.card.serial;
      const body = modal(
        v.card.deck === "chance" ? "Шанс" : "Городская казна",
        "card",
      );
      body.append(
        el("p", name(v.card.player)),
        el("h3", v.card.text),
        button("Понятно", close, true),
      );
    }
    schedule();
  }
  function bundle(b) {
    return (
      [
        b.cash ? money(b.cash) : "",
        ...b.ids.map((id) => D.cells[id].name),
        b.cards.length ? `Карт освобождения: ${b.cards.length}` : "",
      ]
        .filter(Boolean)
        .join(", ") || "Ничего"
    );
  }
  function property(id) {
    const c = D.cells[id],
      s = v.properties[id],
      body = modal(c.name, "property");
    if (c.group !== undefined) body.append(art(id));
    body.append(
      el(
        "p",
        c.price
          ? `Стоимость: ${money(c.price)} · Владелец: ${name(s.owner)}${s.mortgaged ? " · В залоге" : ""}`
          : {
              go: "Получите 200, проходя Старт или останавливаясь здесь.",
              jail: "Посетители ничего не платят. Заключённые ждут дубля, платят 50 или используют карту.",
              parking:
                "Бесплатная остановка. Банк не выплачивает накопленные штрафы.",
              goToJail: "Сразу отправляйтесь в тюрьму. За Старт выплаты нет.",
              tax: `Заплатите банку ${c.amount}.`,
              chance: "Возьмите верхнюю карту «Шанс».",
              chest: "Возьмите верхнюю карту городской казны.",
            }[c.type],
      ),
    );
    if (c.price) {
      const table = el("table", undefined, "mono-rents"),
        rows = c.rents
          ? [
              ["Аренда без построек", c.rents[0]],
              ["Полный квартал", c.rents[0] * 2],
              ...c.rents
                .slice(1, 5)
                .map((x, i) => [i + 1 + " дом" + (i ? "а" : ""), x]),
              ["Отель", c.rents[5]],
              ["Здание: купить / продать", c.house + " / " + c.house / 2],
            ]
          : c.type === "rail"
            ? [
                ["1 / 2 вокзала", "25 / 50"],
                ["3 / 4 вокзала", "100 / 200"],
              ]
            : [
                ["Одна служба", "Новый бросок × 4"],
                ["Две службы", "Новый бросок × 10"],
              ];
      rows.push(
        ["Залог", c.mortgage],
        ["Погасить залог", Math.ceil(c.mortgage * 1.1)],
      );
      for (const [a, b] of rows) {
        const tr = el("tr");
        tr.append(el("td", a), el("td", String(b)));
        table.append(tr);
      }
      body.append(table);
      if (
        s.owner === v.me &&
        ["roll", "jail", "manage", "buy", "debt", "auction"].includes(v.phase)
      ) {
        if (c.rents) {
          if (P.buildable(v, v.me, id))
            body.append(
              button(
                "Построить " +
                  (s.level === 4 ? "отель" : "дом") +
                  " · " +
                  c.house,
                () => act({ type: "build", id }),
                true,
              ),
            );
          if (s.level) {
            body.append(
              button("Продать одно здание · " + c.house / 2, () =>
                act({ type: "sell", id }),
              ),
              button("Продать здания всего квартала", () => {
                const b = modal("Продать все здания квартала?");
                b.append(
                  el("p", "Банк вернёт половину стоимости построек."),
                  button("Продать", () => act({ type: "sellGroup", id }), true),
                );
              }),
            );
          }
        }
        body.append(
          button(
            s.mortgaged
              ? "Погасить залог · " + Math.ceil(c.mortgage * 1.1)
              : "Заложить · +" + c.mortgage,
            () => act({ type: s.mortgaged ? "unmortgage" : "mortgage", id }),
          ),
        );
      }
    }
  }
  function properties() {
    const body = modal("Ваша собственность", "properties");
    body.append(
      el(
        "p",
        `Наличные: ${money(v.players[v.me].money)} · В банке: ${P.stock(v).houses} домов, ${P.stock(v).hotels} отелей`,
      ),
    );
    const ids = D.cells.filter((c) => v.properties[c.id].owner === v.me);
    if (!ids.length)
      body.append(
        el(
          "p",
          "У вас пока нет владений. Покупайте свободные клетки после остановки или участвуйте в аукционах.",
        ),
      );
    for (const c of ids) {
      const s = v.properties[c.id],
        b = el("button", undefined, "mono-property-row"),
        text = el("span", c.name);
      b.style.setProperty("--group", D.colors[c.group] || "#b7a980");
      text.append(
        el(
          "small",
          s.mortgaged
            ? "В залоге"
            : s.level === 5
              ? "Отель"
              : s.level
                ? `Домов: ${s.level}`
                : "Без построек",
        ),
      );
      b.append(el("i"), text, el("b", "›"));
      b.onclick = () => property(c.id);
      body.append(b);
    }
    body.append(el("p", `Карт освобождения: ${v.players[v.me].free.length}`));
  }
  function trade() {
    const body = modal("Предложить обмен", "trade"),
      select = el("select");
    select.setAttribute("aria-label", "Участник обмена");
    v.players.forEach((p, i) => {
      if (i !== v.me && !p.out) {
        const option = el("option", name(i));
        option.value = i;
        select.append(option);
      }
    });
    body.append(select);
    const grid = el("div", undefined, "mono-trade-grid");
    body.append(grid);
    let read;
    function fields() {
      grid.replaceChildren();
      const readers = [];
      for (const [p, title] of [
        [v.me, "Вы отдаёте"],
        [Number(select.value), "Вы получаете"],
      ]) {
        const section = el("section");
        section.append(el("h3", title));
        const cash = el("input");
        cash.type = "number";
        cash.min = 0;
        cash.max = v.players[p].money;
        cash.value = 0;
        cash.setAttribute("aria-label", title + " — деньги");
        section.append(cash);
        const ids = [],
          cards = [],
          redeem = [];
        for (const c of D.cells.filter(
          (c) =>
            v.properties[c.id].owner === p &&
            (!c.rents || P.group(c.id).every((k) => !v.properties[k].level)),
        )) {
          const label = el("label", undefined, "mono-check"),
            input = el("input");
          input.type = "checkbox";
          ids.push([c.id, input]);
          label.append(
            input,
            el(
              "span",
              c.name + (v.properties[c.id].mortgaged ? " · залог" : ""),
            ),
          );
          section.append(label);
          if (p !== v.me && v.properties[c.id].mortgaged) {
            const line = el("label", undefined, "mono-check"),
              check = el("input");
            check.type = "checkbox";
            redeem.push([c.id, check]);
            line.append(check, el("span", "Погасить сразу: " + c.name));
            section.append(line);
          }
        }
        v.players[p].free.forEach((_, i) => {
          const label = el("label", undefined, "mono-check"),
            input = el("input");
          input.type = "checkbox";
          cards.push([i, input]);
          label.append(input, el("span", "Карта освобождения"));
          section.append(label);
        });
        grid.append(section);
        readers.push(() => ({
          cash: Number(cash.value),
          ids: ids.filter((x) => x[1].checked).map((x) => x[0]),
          cards: cards.filter((x) => x[1].checked).map((x) => x[0]),
          redeem: redeem
            .filter(
              (x) =>
                x[1].checked && ids.some((y) => y[0] === x[0] && y[1].checked),
            )
            .map((x) => x[0]),
        }));
      }
      read = () => readers.map((f) => f());
    }
    select.onchange = fields;
    fields();
    body.append(
      el(
        "p",
        "Собственность квартала со зданиями нельзя передать. Получатель залога платит 10% банку; сам залог сохраняется.",
      ),
      button(
        "Предложить обмен",
        () => {
          const [give, want] = read();
          act({
            type: "offer",
            to: Number(select.value),
            give,
            want,
            redeem: want.redeem,
          });
        },
        true,
      ),
    );
  }
  function results() {
    const body = modal(
      v.winner === v.me ? "Ваш город победил!" : "Партия завершена",
      "result",
    );
    body.append(el("p", `Победитель: ${name(v.winner)} · Ходов: ${v.round}`));
    for (const [i, p] of v.players.entries()) {
      const row = el("div", undefined, "mono-property-row");
      row.append(
        token(p.token),
        el("span", name(i)),
        el("b", p.out ? "Банкрот" : money(p.money)),
      );
      body.append(row);
    }
    body.append(
      button(
        "Сыграть ещё",
        async () => {
          if (online) {
            const r = await window.Сеть.отправитьХод({ действие: "ещё" });
            if (!r?.принято)
              $("mono-error").textContent = r?.причина || "Нет связи";
            else
              $("mono-modal-body").append(
                el("p", "Ждём согласия остальных игроков…"),
              );
          } else {
            close();
            fresh();
          }
        },
        true,
      ),
      button("Посмотреть поле", close),
    );
  }
  function history() {
    const body = modal("Мои партии");
    let h = [];
    try {
      h = JSON.parse(localStorage.getItem("monopoly-history")) || [];
    } catch (_) {}
    if (!h.length)
      body.append(el("p", "Здесь появятся завершённые партии с ботами."));
    for (const x of h)
      body.append(
        el(
          "p",
          `${new Date(x.date).toLocaleDateString("ru-RU")} · ${x.win ? "Победа" : "Поражение"} · ${x.n} игроков · ${x.round} ходов`,
        ),
      );
  }
  function rules() {
    const body = modal("Как играть", "rules");
    for (const [title, text] of [
      [
        "Цель",
        "Остаться последним участником, который может оплачивать долги. Все начинают с 1 500. За прохождение Старта — 200.",
      ],
      [
        "Покупки и аукционы",
        "На свободной собственности выберите покупку или аукцион. В аукционе могут участвовать все, даже отказавшийся от покупки. Начальная ставка — 10, повышение — минимум 1.",
      ],
      [
        "Кварталы и строительство",
        "Соберите все улицы одного цвета. Без зданий аренда удваивается. Дома строятся и продаются равномерно. После четырёх домов — отель. В банке 32 дома и 12 отелей; при споре за последнее здание проводится аукцион.",
      ],
      [
        "Залог и обмен",
        "Перед залогом улицы продайте здания во всём квартале. Заложенная клетка не приносит аренду. Снятие залога стоит сумму залога плюс 10%. При передаче залога новому владельцу банк сразу берёт 10%. Обменивать можно деньги, собственность без зданий и карты освобождения.",
      ],
      [
        "Кубики и тюрьма",
        "Дубль даёт дополнительный бросок. Три дубля подряд отправляют в тюрьму. Выйти можно за 50, по карте или выбросив дубль за три попытки. После третьей неудачи заплатите 50 и двигайтесь по последнему броску. Дубль при выходе не даёт повторного броска.",
      ],
      [
        "Долги",
        "Для оплаты продавайте здания за половину цены и закладывайте имущество. Если всех средств недостаточно, объявите банкротство: кредитор получает имущество. При долге банку собственность выставляется на аукцион.",
      ],
      [
        "Управление",
        "Нажмите клетку, чтобы увидеть аренду и владельца. В «Собственности» стройте, продавайте и оформляйте залог. «Увеличить поле» открывает подробную доску. В «Истории ходов» видны броски и все платежи.",
      ],
      [
        "Классические правила",
        "Бесплатная парковка не приносит деньги. У коммунальных служб аренда считается по новому броску кубиков. В тюрьме можно получать аренду и управлять имуществом.",
      ],
    ])
      body.append(el("h3", title), el("p", text));
    const a = el("a", "Официальные правила Hasbro C1009");
    a.href =
      "https://instructions.hasbro.com/api/download/C1009_en-my_monopoly-classic-game.pdf";
    a.target = "_blank";
    a.rel = "noopener";
    body.append(a);
  }
  function seats(root, n, bots) {
    root.replaceChildren();
    for (let i = 0; i < n; i++) {
      const b = el("div", undefined, "mono-seat");
      if (i === 0 || bots) b.append(token(i));
      else {
        const wait = el("span", undefined, "mono-wait");
        wait.innerHTML = "<i></i><i></i><i></i>";
        b.append(wait);
      }
      b.append(
        el("b", i === 0 ? "Вы" : bots ? `Бот ${i}` : "Свободно"),
        el(
          "small",
          i === 0 ? "Хозяин стола" : bots ? D.tokens[i] : "Пригласите друга",
        ),
      );
      root.append(b);
    }
  }
  function settings() {
    for (const [id, n, isOnline] of [
      ["mono-count", prefs.n, false],
      ["mono-count-online", Number($("монополия-мест-друга").value), true],
    ]) {
      $(id).replaceChildren(
        ...[2, 3, 4, 5, 6].map((x) => {
          const b = button(String(x), () => {
            if (isOnline) $("монополия-мест-друга").value = x;
            else prefs.n = x;
            save();
            settings();
          });
          b.setAttribute("aria-pressed", String(x === n));
          return b;
        }),
      );
      seats($(isOnline ? "mono-seats-online" : "mono-seats"), n, !isOnline);
    }
    $("mono-pace").value = prefs.pace;
  }
  function zoom() {
    const root = $("mono-board-wrap"),
      on = root.classList.toggle("mono-zoom");
    $("mono-zoom").textContent = on
      ? "Закрыть увеличение ✕"
      : "Увеличить поле ↗";
  }
  $("mono-close").onclick = close;
  $("mono-modal").addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  document.querySelectorAll("[data-back]").forEach((b) => (b.onclick = back));
  document.querySelectorAll("[data-rules]").forEach((b) => (b.onclick = rules));
  $("mono-bots").onclick = () => {
    settings();
    screen("mono-settings");
  };
  $("mono-pace").onchange = () => {
    prefs.pace = Number($("mono-pace").value);
    save();
  };
  $("mono-start").onclick = () => {
    if (game && game.phase !== "finished") {
      const b = modal("Начать новую партию?");
      b.append(
        el("p", "Текущая партия с ботами будет заменена."),
        button(
          "Начать новую",
          () => {
            close();
            fresh();
          },
          true,
        ),
        button("Продолжить текущую", () => {
          close();
          online = false;
          screen("экран-игры");
          render();
        }),
      );
    } else fresh();
  };
  $("mono-resume").onclick = () => {
    online = false;
    screen("экран-игры");
    render();
  };
  $("mono-profile").onclick = () => window.ЭкранПрофиля.открыть("монополия");
  $("mono-history").onclick = history;
  $("mono-properties").onclick = properties;
  $("mono-trade").onclick = trade;
  $("mono-zoom").onclick = zoom;
  $("mono-log").onclick = () => {
    const body = modal("История ходов");
    v.events
      .slice()
      .reverse()
      .forEach((e) => body.append(el("p", logText(e))));
  };
  $("mono-settings-game").onclick = () => {
    const body = modal("Темп игры");
    if (online)
      body.append(
        el("p", "В онлайн-партии каждый участник управляет своим ходом."),
      );
    else
      for (const [ms, label] of [
        [2500, "Обычный · 2,5 с"],
        [4500, "Спокойный · 4,5 с"],
        [6500, "Вдумчивый · 6,5 с"],
      ])
        body.append(
          button(label + (prefs.pace === ms ? " ✓" : ""), () => {
            prefs.pace = ms;
            save();
            close();
          }),
        );
    body.append(button("Правила", rules));
    if (v.phase !== "finished" && !v.players[v.me].out)
      body.append(
        button("Завершить участие", () => {
          const b = modal("Завершить участие?");
          b.append(
            el(
              "p",
              "Вы покинете партию с поражением. Остальные игроки продолжат, ваше имущество будет распределено по правилам банкротства.",
            ),
            button("Завершить участие", () => act({ type: "surrender" })),
            button("Продолжить игру", close, true),
          );
        }),
      );
  };
  const menu = window.ЛистЕщё.подключить({
    экраныСЛистом: [
      "экран-лобби",
      "экран-игры",
      "экран-друга",
      "экран-комнаты",
    ],
    двери: {
      вМеню: { действие: back },
      какИграть: { действие: rules },
      рекорды: { действие: history },
    },
  });
  $("кнопка-комната-ещё").onclick = () => menu.открыть();
  $("кнопка-комната-назад").onclick = () => $("кнопка-комната-отмена").click();
  $("экран-лобби").insertBefore($("кнопка-вернуться-в-игру"), $("mono-resume"));
  window.ИграПоСети = {
    начать() {
      clearTimeout(timer);
      online = true;
    },
    показатьВид(state) {
      if (
        !state.монополия ||
        (network?.код === state.код &&
          (state.версия < network.версия ||
            (state.версия === network.версия &&
              $("экран-игры").classList.contains("экран--виден"))))
      )
        return;
      const changed =
        !network ||
        network.код !== state.код ||
        network.сыграноПартий !== state.сыграноПартий;
      if (changed) {
        previous = null;
        lastCard = null;
        lastWinner = null;
        close();
      }
      online = true;
      network = state;
      v = state.монополия;
      screen("экран-игры");
      render();
    },
    показатьСвязь(text) {
      $("строка-связи").textContent = text || "";
      $("строка-связи").classList.toggle("скрыт", !text);
    },
    экран: screen,
    вМеню() {
      online = false;
      network = null;
      screen("экран-лобби");
    },
    идёт: () => online,
  };
  window.addEventListener("load", () => {
    $("mono-name").textContent = window.Телеграм?.имяИгрока?.() || "Вы";
  });
  settings();
  screen("экран-лобби");
})();
