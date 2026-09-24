"use strict";
const D = require("../js/монополия-данные");
async function move(p, v, a) {
  const modal = p.locator("#mono-modal");
  if (await modal.isVisible()) await p.locator("#mono-close").click();
  const actions = p.locator("#mono-actions");
  const labels = {
    roll: v.phase === "jail" ? "Попробовать дубль" : "Бросить кубики",
    end: v.extra ? "Следующий бросок" : "Завершить ход",
    buy: /^Купить за/,
    auction: "На аукцион",
    pass: "Пас",
    bail: "Выйти за 50",
    free: "Использовать карту",
    accept: "Принять обмен",
    reject: "Отклонить",
    inherit: "Оплатить и продолжить",
  };
  if (labels[a.type]) {
    await actions.getByRole("button", { name: labels[a.type] }).click();
    if (
      a.type === "accept" &&
      (await modal
        .getByRole("button", { name: "Подтвердить обмен" })
        .isVisible())
    )
      await modal.getByRole("button", { name: "Подтвердить обмен" }).click();
    return;
  }
  if (a.type === "bid") {
    await actions.getByRole("spinbutton").fill(String(a.amount));
    if (a.id !== undefined && (await actions.getByRole("combobox").count()))
      await actions.getByRole("combobox").selectOption(String(a.id));
    await actions.getByRole("button", { name: "Сделать ставку" }).click();
    return;
  }
  if (
    ["build", "sell", "sellGroup", "mortgage", "unmortgage"].includes(a.type)
  ) {
    await p.locator(`#mono-board [data-cell="${a.id}"]`).click();
    const text = {
      build: /^Построить/,
      sell: /^Продать одно/,
      sellGroup: "Продать здания всего квартала",
      mortgage: /^Заложить/,
      unmortgage: /^Погасить/,
    }[a.type];
    await modal.getByRole("button", { name: text }).click();
    if (a.type === "sellGroup")
      await modal.getByRole("button", { name: "Продать", exact: true }).click();
    return;
  }
  if (a.type === "bankrupt") {
    await actions.getByRole("button", { name: "Объявить банкротство" }).click();
    await modal.getByRole("button", { name: "Объявить банкротство" }).click();
    return;
  }
  if (a.type === "offer") {
    await p.locator("#mono-trade").click();
    await modal.getByRole("combobox").selectOption(String(a.to));
    for (const [i, side] of [a.give, a.want].entries()) {
      const s = modal.locator(".mono-trade-grid section").nth(i);
      await s.getByRole("spinbutton").fill(String(side.cash));
      for (const id of side.ids)
        await s
          .getByRole("checkbox", { name: new RegExp("^" + D.cells[id].name) })
          .check();
      for (const card of side.cards)
        await s
          .getByRole("checkbox", { name: "Карта освобождения" })
          .nth(card)
          .check();
    }
    await modal
      .getByRole("button", { name: "Предложить обмен", exact: true })
      .click();
    return;
  }
  throw Error("Нет действия " + JSON.stringify(a));
}
module.exports = { move };
