"use strict";
(function (root) {
  const D = root.МонополияДанные,
    NS = "http://www.w3.org/2000/svg",
    colors = ["#e5ba53", "#dee4eb", "#df7e49", "#738595", "#77acd3", "#cfb680"];
  function node(tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function rect(id) {
    const w = 740 / 9;
    if (id === 0) return [870, 870, 130, 130];
    if (id < 10) return [870 - id * w, 870, w, 130];
    if (id === 10) return [0, 870, 130, 130];
    if (id < 20) return [0, 870 - (id - 10) * w, 130, w];
    if (id === 20) return [0, 0, 130, 130];
    if (id < 30) return [130 + (id - 21) * w, 0, w, 130];
    if (id === 30) return [870, 0, 130, 130];
    return [870, 130 + (id - 31) * w, 130, w];
  }
  function pos(id) {
    const [x, y, w, h] = rect(id);
    return { x: x + w / 2, y: y + h / 2 };
  }
  function lines(text, max) {
    const a = [];
    for (const word of text.split(" ")) {
      if (!a.length || a.at(-1).length + word.length + 1 > max) a.push(word);
      else a[a.length - 1] += " " + word;
    }
    return a;
  }
  function draw(svg, g, select, previous) {
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.replaceChildren();
    const defs = node("defs"),
      clip = node("clipPath", { id: "mono-city-clip" });
    clip.append(
      node("rect", { x: 131, y: 131, width: 738, height: 738, rx: 9 }),
    );
    defs.append(clip);
    const surface = node("linearGradient", {
      id: "mono-ivory",
      x2: "0",
      y2: "1",
    });
    surface.append(
      node("stop", { offset: "0%", "stop-color": "#f4ecd7" }),
      node("stop", { offset: "100%", "stop-color": "#ddcfac" }),
    );
    defs.append(surface);
    svg.append(
      defs,
      node("image", {
        href: "img/монополия/город.webp",
        x: 130,
        y: 130,
        width: 740,
        height: 740,
        "clip-path": "url(#mono-city-clip)",
      }),
    );
    for (const c of D.cells) {
      const [x, y, w, h] = rect(c.id),
        tall = h > w,
        s = g.properties[c.id];
      const gr = node("g", {
        class: "mono-cell",
        role: "button",
        tabindex: "0",
        "aria-label": c.name + (c.price ? " · " + c.price : ""),
        "data-cell": c.id,
      });
      gr.append(
        node("rect", {
          x,
          y,
          width: w,
          height: h,
          fill: "url(#mono-ivory)",
          stroke: "#a99e80",
          "stroke-width": 1.5,
        }),
      );
      gr.append(
        node("path", {
          d:
            "M" +
            (x + 2) +
            " " +
            (y + h - 2) +
            "V" +
            (y + 2) +
            "H" +
            (x + w - 2),
          fill: "none",
          stroke: "#fff8e4",
          "stroke-width": 2,
        }),
      );
      if (c.group !== undefined) {
        gr.append(
          node("rect", {
            x: x + 2,
            y: y + 2,
            width: w - 4,
            height: 14,
            fill: D.colors[c.group],
          }),
        );
        const pw = tall ? w - 12 : 34,
          ph = tall ? 38 : 31,
          px = tall ? x + 6 : x + w - 39,
          py = tall ? y + 62 : y + 24;
        const pattern = node("pattern", {
          id: "mono-street-" + c.id,
          width: 1,
          height: 1,
          viewBox:
            (c.group % 4) * 384 +
            " " +
            Math.floor(c.group / 4) * 512 +
            " 384 512",
          preserveAspectRatio: "xMidYMid slice",
        });
        pattern.append(
          node("image", {
            href: "img/монополия/кварталы.webp",
            width: 1536,
            height: 1024,
          }),
        );
        defs.append(pattern);
        gr.append(
          node("rect", {
            x: px,
            y: py,
            width: pw,
            height: ph,
            rx: 3,
            fill: "url(#mono-street-" + c.id + ")",
            opacity: ".9",
          }),
        );
      }
      const tx = c.group !== undefined && !tall ? x + (w - 39) / 2 : x + w / 2;
      const text = lines(
        c.name,
        c.group !== undefined && !tall ? 11 : tall ? 10 : 15,
      );
      text.forEach((line, i) =>
        gr.append(
          node(
            "text",
            {
              x: tx,
              y: y + (c.group !== undefined ? 31 : 25) + i * 14,
              "text-anchor": "middle",
              "font-size": 11,
              "font-weight": 650,
            },
            line,
          ),
        ),
      );
      if (c.price)
        gr.append(
          node(
            "text",
            {
              x: x + w / 2,
              y: y + h - 10,
              "text-anchor": "middle",
              "font-size": 14,
              "font-weight": 750,
            },
            c.price,
          ),
        );
      else {
        const symbols = {
          go: "↖ +200",
          chest: "✦",
          chance: "?",
          jail: "В ГОСТЯХ",
          parking: "P",
          goToJail: "↙",
          tax: "−" + c.amount,
        };
        gr.append(
          node(
            "text",
            {
              x: x + w / 2,
              y: y + h - (tall || w === h ? 24 : 10),
              "text-anchor": "middle",
              "font-size":
                c.type === "jail" ? 12 : c.type === "tax" && !tall ? 20 : 25,
              "font-weight": 750,
            },
            symbols[c.type] || "",
          ),
        );
      }
      if (s.owner >= 0) {
        gr.append(
          node("rect", {
            class: "mono-owner",
            x: x + 3,
            y: y + h - 5,
            width: w - 6,
            height: 4,
            fill: colors[s.owner],
          }),
        );
        if (s.mortgaged)
          gr.append(
            node("rect", {
              x: x + 2,
              y: y + 2,
              width: w - 4,
              height: h - 4,
              fill: "#514238",
              opacity: ".28",
            }),
            node(
              "text",
              {
                x: x + w / 2,
                y: y + h - 28,
                "text-anchor": "middle",
                "font-size": 9,
                "font-weight": 800,
                fill: "#792e23",
              },
              "ЗАЛОГ",
            ),
          );
        if (s.level) {
          const n = s.level === 5 ? 1 : s.level;
          for (let j = 0; j < n; j++) {
            const hx = x + w / 2 - n * 8 + j * 16,
              hy = tall ? y + h - 37 : y + 14;
            gr.append(
              node("path", {
                d: "M" + hx + " " + hy + "l6 -6 6 6v10h-12z",
                fill: s.level === 5 ? "#b44130" : "#2f7653",
                stroke: "#fff2d6",
                "stroke-width": 1.2,
              }),
            );
          }
        }
      }
      gr.onclick = () => select(c.id);
      gr.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(c.id);
        }
      };
      svg.append(gr);
    }
    svg.append(
      node(
        "text",
        {
          x: 500,
          y: 390,
          "text-anchor": "middle",
          "font-family": "Georgia,serif",
          "font-size": 49,
          "font-weight": 700,
          fill: "#f4d59b",
          stroke: "#15392f",
          "stroke-width": 1,
        },
        "МОНОПОЛИЯ",
      ),
      node(
        "text",
        {
          x: 500,
          y: 428,
          "text-anchor": "middle",
          "font-family": "system-ui",
          "font-size": 16,
          fill: "#e4d9b5",
        },
        "ВЕЧЕРНИЙ ГОРОД",
      ),
    );
    for (let i = 0; i < g.players.length; i++) {
      const p = g.players[i];
      if (p.out) continue;
      const a = pos(p.position),
        sharing = g.players
          .map((q, j) => (q.position === p.position && !q.out ? j : -1))
          .filter((j) => j >= 0),
        index = sharing.indexOf(i),
        dx = ((index % 3) - 1) * 24,
        dy = Math.floor(index / 3) * 24 + 12;
      const token = node("g", {
        "data-token": i,
        "pointer-events": "none",
        "aria-label":
          (g.names?.[i] || "Игрок " + (i + 1)) +
          ": " +
          D.cells[p.position].name,
        transform: "translate(" + (a.x + dx) + " " + (a.y + dy) + ")",
      });
      token.append(
        node("circle", {
          r: 22,
          fill: "#14231e",
          stroke: colors[i],
          "stroke-width": 4,
        }),
      );
      const tokenClip = node("clipPath", { id: "mono-token-clip-" + i });
      tokenClip.append(node("circle", { r: 19 }));
      defs.append(tokenClip);
      const t = p.token % 6,
        col = t % 4,
        row = Math.floor(t / 4);
      token.append(
        node("image", {
          href: "img/монополия/фишки.webp",
          x: -19 - col * 38,
          y: -19 - row * 38,
          width: 152,
          height: 76,
          preserveAspectRatio: "none",
          "clip-path": "url(#mono-token-clip-" + i + ")",
        }),
      );
      svg.append(token);
      const old = previous?.players[i];
      if (
        old &&
        old.position !== p.position &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const moves = g.events.filter(
            (e) =>
              e.id > previous.serial && e.kind === "move" && e.player === i,
          ),
          points = [pos(old.position)];
        for (const m of moves) {
          const backwards =
            (m.from - m.to + 40) % 40 === 3 &&
            g.card?.id === 11 &&
            g.card.deck === "chance";
          let id = m.from;
          do {
            id = (id + (backwards ? 39 : 1)) % 40;
            points.push(pos(id));
          } while (id !== m.to && points.length < 85);
        }
        points.push({ x: a.x + dx, y: a.y + dy });
        const frames = points.map((pt) => ({
          transform: "translate(" + pt.x + "px," + pt.y + "px)",
        }));
        token.animate(frames, {
          duration: Math.min(2300, Math.max(700, points.length * 125)),
          delay: g.events.some(
            (e) => e.id > previous.serial && e.kind === "dice",
          )
            ? 1000
            : 0,
          easing: "linear",
          fill: "backwards",
        });
      }
    }
  }
  root.МонополияПоле = { draw, rect, pos, colors };
})(window);
