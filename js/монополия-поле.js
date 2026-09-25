"use strict";
(function (root) {
  const D = root.МонополияДанные,
    NS = "http://www.w3.org/2000/svg",
    colors = ["#e5ba53", "#db8292", "#74b8e8", "#82ca90", "#c19ade", "#eea967"];
  function node(tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }

  const pieces = [
    {
      box: [38, 196, 402, 270],
      path: "M42 344L56 317L128 279L163 269L202 238L225 220L261 226L282 211L302 224L337 198L360 209L371 253L416 275L437 314L430 365L409 393L385 397L357 382L244 417L221 452L190 463L163 450L151 427L87 415L58 390Z",
    },
    {
      box: [452, 162, 339, 290],
      path: "M513 191Q627 142 731 177L737 311Q795 322 785 360Q733 431 589 445Q500 451 460 407Q434 371 513 332Z",
    },
    {
      box: [824, 112, 350, 361],
      path: "M830 351L874 327L886 278L935 260L944 205L957 181L973 184L980 268L1024 280L1024 127L1071 115L1088 128L1085 271L1127 278L1151 312L1170 329L1160 383Q1086 455 879 469L840 444Z",
    },
    {
      box: [1193, 93, 302, 383],
      path: "M1239 99L1284 123L1340 124L1375 99L1384 160L1404 195L1412 231L1415 275Q1491 209 1490 287Q1483 348 1449 366L1458 405L1438 452L1373 467L1250 475L1216 457L1202 414L1222 328L1246 266L1239 223L1238 181Z",
    },
    {
      box: [21, 565, 423, 342],
      path: "M28 883L60 832L87 726L124 705L124 598L153 570L197 573L205 607L209 692L293 678L291 646L403 631L436 655L433 763L442 804L413 855L378 859L351 832L310 877L269 884L237 864L213 898L174 899L150 877L102 900Z",
    },
    {
      box: [484, 564, 306, 334],
      path: "M490 659L559 631Q573 570 634 573Q712 566 713 650L709 697L735 734L757 711L775 721L785 777Q795 862 702 890Q547 908 500 824L501 777L534 741L573 714L548 697Z",
    },
    {
      box: [844, 612, 307, 304],
      path: "M850 735L938 650L957 652L961 627L996 615L1029 628L1036 675L1089 685L1145 740L1135 768L1108 771L1109 875L997 913L874 866L876 759Z",
    },
    {
      box: [1209, 568, 279, 342],
      path: "M1217 669L1271 605L1310 612L1314 579L1353 571L1401 581L1400 616L1437 631L1485 686L1476 710L1471 873L1332 905L1227 865L1229 700Z",
    },
  ];
  function piece(defs, id, type, x, y, w, h) {
    const p = pieces[type],
      pattern = node("pattern", {
        id: "piece-" + id,
        patternUnits: "userSpaceOnUse",
        width: 1536,
        height: 1024,
      });
    pattern.append(
      node("image", {
        href: "img/монополия/фигуры-v2.webp",
        width: 1536,
        height: 1024,
      }),
    );
    defs.append(pattern);
    const shape = node("svg", {
      x,
      y,
      width: w,
      height: h,
      viewBox: p.box.join(" "),
      overflow: "visible",
      "pointer-events": "none",
    });
    shape.append(node("path", { d: p.path, fill: "url(#piece-" + id + ")" }));
    return shape;
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
      node("rect", { x: 131, y: 131, width: 738, height: 738, rx: 0 }),
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
        href: "img/монополия/город-v2.webp",
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
        const strip =
          c.id < 10
            ? [x, y, w, 18]
            : c.id < 20
              ? [x + w - 18, y, 18, h]
              : c.id < 30
                ? [x, y + h - 18, w, 18]
                : [x, y, 18, h];
        gr.append(
          node("rect", {
            x: strip[0],
            y: strip[1],
            width: strip[2],
            height: strip[3],
            fill: D.colors[c.group],
            stroke: "#4a351b",
            "stroke-width": 1.5,
          }),
        );
      }
      const tx =
        x + w / 2 + (c.group !== undefined && !tall ? (c.id < 20 ? -8 : 8) : 0);
      const text = lines(c.name, tall ? 10 : 13);
      text.forEach((line, i) =>
        gr.append(
          node(
            "text",
            {
              x: tx,
              y: y + (c.group !== undefined && c.id < 10 ? 36 : 24) + i * 15,
              "text-anchor": "middle",
              "font-size": 13,
              "font-weight": 500,
              ...(line.length * 7 > (tall ? w - 8 : w - 32)
                ? {
                    textLength: tall ? w - 8 : w - 32,
                    lengthAdjust: "spacingAndGlyphs",
                  }
                : {}),
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
              y:
                y +
                h -
                (c.group !== undefined && c.id >= 20 && c.id < 30 ? 25 : 10),
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
          chest: "",
          chance: "?",
          jail: "В ГОСТЯХ",
          parking: "",
          goToJail: "",
          tax: "−" + c.amount,
        };
        gr.append(
          node(
            "text",
            {
              x: x + w / 2 + (c.type === "tax" && !tall && w !== h ? 18 : 0),
              y: y + h - (tall || w === h ? 24 : 10),
              "text-anchor": "middle",
              "font-size":
                c.type === "jail"
                  ? 12
                  : c.type === "chance"
                    ? tall
                      ? 42
                      : 30
                    : c.type === "tax" && !tall
                      ? 20
                      : 25,
              "font-weight": 750,
            },
            symbols[c.type] || "",
          ),
        );
      }
      if (
        [
          "rail",
          "utility",
          "parking",
          "jail",
          "goToJail",
          "tax",
          "chest",
        ].includes(c.type)
      ) {
        const size = w === h ? 48 : tall ? (c.type === "tax" ? 30 : 37) : 25;
        const icon = node("svg", {
          x: !tall && w !== h ? x + 10 : x + (w - size) / 2,
          y: y + (w === h ? 52 : tall ? 49 : 44),
          width: size,
          height: size,
          viewBox: "0 0 40 40",
          "pointer-events": "none",
        });
        const paths = {
          rail: "M9 4h22v24H9z M13 8h14v10H13z M13 29l-5 8m19-8 5 8M10 34h20M14 23h1m10 0h1",
          parking:
            "M6 18l4-10h20l4 10M5 18h30v13H5zM10 31v5m20-5v5M10 24h3m14 0h3M12 11h16",
          jail: "M5 4h30v33H5zM12 5v31M20 5v31M28 5v31",
          goToJail: "M5 4h30v33H5zM12 5v31M20 5v31M28 5v31",
          utility:
            c.id === 12
              ? "M13 25C-2 5 39-2 28 23l-4 5v6h-9v-6zM16 38h7"
              : "M20 3C14 13 7 20 7 27a13 11 0 0 0 26 0C33 20 26 13 20 3zM13 25q-2 7 5 9",
          tax: "M6 17v15c0 6 28 6 28 0V17M6 25c0 6 28 6 28 0M6 17c0-7 28-7 28 0s-28 7-28 0M11 8c0-7 22-7 22 0s-22 7-22 0",
          chest: "M4 14Q4 4 20 4t16 10v20H4zM4 16h32M15 14h10v10H15zM8 30h24",
        };
        icon.append(
          node("path", {
            d: paths[c.type],
            fill: c.type === "tax" ? "#dab758" : "none",
            stroke: "#332716",
            "stroke-width": 2.8,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          }),
        );
        gr.append(icon);
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
            const hx = tall
                ? x + w / 2 - n * 8 + j * 16
                : c.id < 20
                  ? x + w - 19
                  : x + 1,
              hy = tall
                ? c.id < 10
                  ? y + 1
                  : y + h - 20
                : y + h / 2 - n * 8 + j * 16;
            gr.append(
              piece(
                defs,
                "house-" + c.id + "-" + j,
                s.level === 5 ? 7 : 6,
                hx,
                hy,
                tall ? 16 : 18,
                tall ? 19 : 16,
              ),
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
      node("rect", {
        x: 132,
        y: 132,
        width: 736,
        height: 736,
        fill: "none",
        stroke: "#ddb775",
        "stroke-width": 4,
        "pointer-events": "none",
      }),
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
        node("ellipse", {
          cx: 0,
          cy: 17,
          rx: 25,
          ry: 8,
          fill: colors[i],
          opacity: 0.8,
        }),
      );
      token.append(piece(defs, "token-" + i, p.token % 6, -31, -38, 62, 58));
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
