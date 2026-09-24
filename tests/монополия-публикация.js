"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  B = require("../js/монополия-бот");
const base = process.env.MONOPOLY_BASE || "https://igra.medart.com.ua",
  players = [];
const req = async (p, body) => {
  const r = await fetch(base + "/" + encodeURIComponent(p), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(r.status, 200, p + " HTTP " + r.status);
  return r.json();
};
(async () => {
  for (const file of [
    "монополия.html",
    "style-монополия.css",
    "style-монополия-витрина.css",
    "js/монополия-данные.js",
    "js/монополия-правила.js",
    "js/монополия-бот.js",
    "js/монополия-поле.js",
    "js/монополия-экран.js",
    "img/монополия/обложка.webp",
    "img/монополия/город.webp",
    "img/монополия/фишки.webp",
    "img/монополия/кварталы.webp",
  ]) {
    const r = await fetch(
      base +
        "/" +
        file.split("/").map(encodeURIComponent).join("/") +
        "?check=" +
        Date.now(),
      { signal: AbortSignal.timeout(20000) },
    );
    assert.equal(r.status, 200, file);
    const actual = Buffer.from(await r.arrayBuffer()),
      expected = fs.readFileSync(path.join(__dirname, "..", file));
    if (file.endsWith(".webp"))
      assert.equal(
        crypto.createHash("sha256").update(actual).digest("hex"),
        crypto.createHash("sha256").update(expected).digest("hex"),
        file,
      );
    else
      assert.equal(
        actual.toString("utf8").replace(/\r\n/g, "\n").trimEnd(),
        expected.toString("utf8").replace(/\r\n/g, "\n").trimEnd(),
        file,
      );
  }
  console.log(
    "Монополия: опубликованные код, стили и иллюстрации совпадают с проверенными.",
  );
  if (process.env.MONOPOLY_ASSETS_ONLY) return;
  try {
    const a = await req("создать", {
      игра: "монополия",
      мест: 3,
      открытый: false,
      имя: "Проверка Монополии 1",
    });
    players.push({ код: a.код, пропуск: a.пропуск });
    for (let i = 1; i < 3; i++) {
      const p = await req("войти", {
        код: a.код,
        имя: "Проверка Монополии " + (i + 1),
      });
      players.push({ код: a.код, пропуск: p.пропуск });
    }
    assert.equal(
      (await req("ход", { ...players[0], действие: "начать" })).принято,
      true,
    );
    let steps = 0;
    while (steps++ < 3000) {
      const state = await req("состояние", players[0]),
        v = (state.состояние || state).монополия;
      assert(v);
      assert(!("seed" in v) && !("decks" in v));
      if (v.phase === "finished") {
        console.log(
          "Живой сервер: полная партия завершена, " + steps + " действий.",
        );
        break;
      }
      const move = B.move(v),
        r = await req("ход", {
          ...players[v.actor],
          действие: "монополия",
          move,
        });
      assert.equal(r.принято, true, JSON.stringify(r));
      if (steps % 100 === 0) console.log("Живой сервер:", steps, "действий");
    }
    assert(steps < 3000);
    console.log("Монополия: публикация проверена — OK");
  } finally {
    const cleanup = await Promise.allSettled(
      players.map((p) => req("выйти", p)),
    );
    for (const r of cleanup)
      if (r.status === "rejected")
        console.error(
          "Не удалось закрыть проверочное место:",
          r.reason.message,
        );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
