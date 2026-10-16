/* Next Shore v2 engine — shared by /v2a /v2b /v2c /playground.
 * Concept: you are a small boat crossing to the far shore. Each answer moves the boat;
 * the 5 axes become parts of the scene. Scoring + countries come from ../data.js (window.NS).
 *  english    -> lighthouse beam on the far shore (how clearly you can see / be seen)
 *  skills     -> size of the sail
 *  experience -> wake lines behind the boat (distance already rowed)
 *  runway     -> supply crates on deck
 *  flex       -> wind in the sky                                                     */
(function () {
  const N = window.NS, T = N.T;
  const KEY_LANG = "ns.lang", KEY_RES = "ns2.answers";

  /* One question per screen. kind: slider | chips | multi. Copy is deliberately short. */
  const QS = [
    { id: "english", kind: "slider", q: T("平时英语什么水平？", "How's your everyday English?"), more: N.STEPS[0].hint },
    { id: "edu", kind: "chips", q: T("最高学历？", "Highest degree?") },
    { id: "field", kind: "chips", q: T("做哪一行？", "What field are you in?"), more: N.STEPS[1].hint },
    { id: "years", kind: "slider", q: T("工作几年了？", "Years of work?") },
    { id: "relevance", kind: "chips", q: T("工作和专业对口吗？", "Does your job match your field?"), more: N.STEPS[2].hint },
    { id: "age", kind: "slider", q: T("年龄？", "Your age?"), more: N.STEPS[3].hint },
    { id: "willing", kind: "multi", q: T("愿意做哪些？拖上船或点选", "What would you do? Drag aboard or tap"), more: N.STEPS[4].hint },
    { id: "runway", kind: "slider", q: T("不赚钱，能撑多久？", "No income — how long could you last?"), more: N.STEPS[5].hint },
    { id: "prio", kind: "multi", q: T("你在乎什么？", "What matters to you?"), more: N.STEPS[6].hint },
    { id: "risk", kind: "slider", q: T("能接受多少不确定？", "How much uncertainty is OK?") },
  ];
  const optsOf = (id) => { for (const s of N.STEPS) for (const q of s.questions) if (q.id === id) return q.options; };

  /* Short result titles (archetype ids from data.js). */
  const SHORT = {
    ready: T("差不多可以出发了", "Nearly ready to sail"),
    skilledSoon: T("再练一两年，就能直航", "A year or two more, then sail direct"),
    studyRoute: T("直航太远，先读书或跟雇主过去", "Too far to sail direct — go via study or an employer"),
    pivot: T("英语够了，换个更缺人的方向", "English is fine — switch to a field that's hiring"),
    explore: T("先在近海练好英语和手艺", "Stay near shore for now — build English and skills"),
  };
  const UI = {
    next: T("下一题", "Next"), back: T("上一题", "Back"), done: T("看海图", "See my chart"),
    of: T("{n} / {t}", "{n} / {t}"), more: T("这题什么意思？", "What does this mean?"),
    here: T("你在这里", "You are here"), why: T("为什么是这个结果", "Why this result"),
    steps: T("接下来做什么", "What to do next"), weak: T("最需要补的", "Weakest areas"),
    effort: T("投入", "Effort"), edit: T("改答案", "Edit answers"), redo: T("重新来", "Start over"),
    harbors: T("可以靠岸的港口", "Harbors you could reach"), others: T("其他港口", "Other harbors"),
    soon: T("即将更新", "Coming soon"), match: T("匹配", "match"), gaps: T("对你来说还差什么", "What it would take for you"),
    noGap: T("主要门槛已达到，关键是拿到 offer 或邀请。", "Main thresholds met; the key is an offer or invitation."),
    lang: T("需要学当地语言", "You'd need the local language"), tap: T("点港口看详情", "Tap a harbor for details"),
    disc: T("一般信息，不是移民或法律建议。数字均为近似，以官方为准。不含投资移民。", "General info, not migration or legal advice. Figures are approximate — check official sources. No investment routes."),
    drop: T("拖到这里", "Drop here"), chosen: T("已选", "selected"),
    sec: { overview: T("概况", "Overview"), routes: T("路线", "Routes"), req: T("要求", "Requirements"), living: T("生活与工作", "Living & working"), risks: T("风险", "Risks"), suits: T("适合", "Suits"), links: T("官方来源", "Official sources") },
    axes: { english: T("灯塔 = 英语", "Lighthouse = English"), skills: T("帆 = 专业技能", "Sail = skills"), experience: T("尾迹 = 经验", "Wake = experience"), runway: T("补给 = 资金缓冲", "Supplies = runway"), flex: T("风 = 灵活度", "Wind = flexibility") },
  };

  /* ---------- tiny helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Seeded jitter so hand-drawn lines stay stable between renders.
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  /** Wobbly horizontal line — the "hand-made" stroke. */
  function wob(x1, x2, y, amp = 3, step = 40) {
    let d = `M${x1},${y + (rnd() - 0.5) * amp}`;
    for (let x = x1 + step; x <= x2 + step; x += step) {
      const cx = x - step / 2, cy = y + (rnd() - 0.5) * amp * 2.2;
      d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${Math.min(x, x2)},${(y + (rnd() - 0.5) * amp).toFixed(1)}`;
    }
    return d;
  }
  /** Wobbly closed blob (islands). */
  function blob(cx, cy, r, pts = 9) {
    const p = [];
    for (let i = 0; i < pts; i++) { const a = (i / pts) * Math.PI * 2, rr = r * (0.78 + rnd() * 0.4); p.push([cx + Math.cos(a) * rr * 1.35, cy + Math.sin(a) * rr * 0.75]); }
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < pts; i++) { const a = p[i], b = p[(i + 1) % pts]; d += ` Q${a[0].toFixed(1)},${a[1].toFixed(1)} ${((a[0] + b[0]) / 2).toFixed(1)},${((a[1] + b[1]) / 2).toFixed(1)}`; }
    return d + "Z";
  }

  function mount(root, cfg = {}) {
    const S = { lang: localStorage.getItem(KEY_LANG) || "zh", i: 0, a: {}, view: "q", pick: null };
    try { const s = JSON.parse(localStorage.getItem(KEY_RES) || "null"); if (s && !cfg.demo) { S.a = s; S.view = "r"; } } catch (e) {}
    if (cfg.demo) { S.a = { english: "e3", edu: "ba", field: "it", years: "y2", relevance: "high", age: "a2", willing: ["study"], runway: "r2", prio: ["balance"], risk: "mid" }; S.i = 6; }
    const t = (o) => (o ? o[S.lang] : "");
    const u = (k, v) => { let s = t(UI[k]); for (const x in v || {}) s = s.replace("{" + x + "}", v[x]); return s; };

    root.classList.add("ns2");
    root.innerHTML = `
      <header class="top"><a class="mark" href="../variants.html">Next Shore <span>彼岸</span></a>
        <div class="lang" role="group" aria-label="Language"><button data-l="zh">中</button><button data-l="en">EN</button></div></header>
      <div class="stage"><svg class="scene" viewBox="0 0 1000 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true"></svg>
        <div class="legend" aria-hidden="true"></div></div>
      <main class="panel" aria-live="polite"></main>
      <footer class="disc"></footer>`;
    const svg = $(".scene", root), panel = $(".panel", root);

    /* ---------- build the scene once; update attributes later (so CSS transitions morph) ---------- */
    seed = 11;
    let g = "";
    g += `<g class="wind">${[0, 1, 2, 3, 4].map((i) => `<path class="gust" d="${wob(120 + i * 150, 230 + i * 150, 50 + (i % 3) * 32, 4, 30)}"/>`).join("")}</g>`;
    g += `<path class="land home" d="M0,262 Q30,236 52,250 Q70,258 86,276 L86,300 L0,300Z"/>`;
    g += `<g class="far"><path class="land" d="M840,280 Q868,236 905,240 Q935,214 968,232 Q990,240 1000,236 L1000,300 L840,300Z"/>
          <polygon class="beam" points="903,150 600,118 600,196"/>
          <path class="tower" d="M896,236 L899,156 L909,156 L912,236Z"/><rect class="lamp" x="897" y="144" width="14" height="12" rx="2"/></g>`;
    g += `<g class="tide"><path class="water" d="M-20,286 L1020,286 L1020,480 L-20,480Z"/>
          ${[290, 318, 350, 386].map((y, i) => `<path class="wave w${i}" d="${wob(-40, 1040, y, 4 + i, 46)}"/>`).join("")}</g>`;
    g += `<g class="boat" transform="translate(110,262)"><g class="bob">
          <g class="wake">${[0, 1, 2, 3, 4].map((i) => `<path d="${wob(-30 - i * 34, -8 - i * 34, 30 + (i % 2) * 6, 2, 11)}"/>`).join("")}</g>
          <path class="hull" d="M-34,14 Q-30,34 0,34 Q32,34 40,12 Z"/>
          <path class="mast" d="M2,14 L2,-62"/>
          <path class="sail" d="M5,-58 Q30,-24 38,8 L5,8 Z"/>
          <g class="crates">${[0, 1, 2, 3].map((i) => `<rect x="${-28 + i * 0}" y="${2 - i * 9}" width="16" height="9" rx="1.5"/>`).join("")}</g></g></g>`;
    svg.innerHTML = g;

    function paintScene(progress) {
      const s = N.scoreAxes(S.a), r = N.readiness(s, S.a);
      const x = 110 + 660 * progress * (0.5 + 0.5 * r / 100);
      $(".boat", svg).setAttribute("transform", `translate(${x.toFixed(0)},262)`);
      $(".boat", svg).style.transform = `translate(${x.toFixed(0)}px,262px)`;
      $(".beam", svg).style.opacity = (0.05 + 0.45 * s.english / 100).toFixed(2);
      $(".sail", svg).style.transform = `scale(${(0.35 + 0.75 * s.skills / 100).toFixed(2)})`;
      [...svg.querySelectorAll(".wake path")].forEach((p, i) => p.style.opacity = i < Math.round(s.experience / 20) ? 1 : 0);
      [...svg.querySelectorAll(".crates rect")].forEach((p, i) => p.style.opacity = i < Math.round(s.runway / 25) ? 1 : 0);
      [...svg.querySelectorAll(".gust")].forEach((p, i) => p.style.opacity = i < Math.round(s.flex / 20) ? 1 : 0);
      $(".tide", svg).style.transform = `translateY(${(-14 * progress).toFixed(1)}px)`;
      $(".legend", root).innerHTML = N.AXES.map((ax) => `<span><i style="--v:${s[ax.id]}%"></i>${t(UI.axes[ax.id])}</span>`).join("");
      return { s, r };
    }

    /* ---------- question screen ---------- */
    function answered(q) { return q.kind === "multi" || q.kind === "slider" || !!S.a[q.id]; }
    function renderQ() {
      const q = QS[S.i], opts = optsOf(q.id), last = S.i === QS.length - 1;
      if (q.kind === "slider" && !S.a[q.id]) S.a[q.id] = opts[Math.floor((opts.length - 1) / 2)].id;
      let body = "";
      if (q.kind === "slider") {
        const idx = opts.findIndex((o) => o.id === S.a[q.id]);
        body = `<div class="slide"><input type="range" min="0" max="${opts.length - 1}" step="1" value="${idx}" aria-label="${esc(t(q.q))}" aria-valuetext="${esc(t(opts[idx].label))}">
          <div class="ticks">${opts.map((o, i) => `<span class="${i === idx ? "on" : ""}"></span>`).join("")}</div>
          <p class="readout"><b>${t(opts[idx].label)}</b>${opts[idx].sub ? ` <small>${t(opts[idx].sub)}</small>` : ""}</p></div>`;
      } else {
        const sel = (o) => (q.kind === "multi" ? (S.a[q.id] || []).includes(o.id) : S.a[q.id] === o.id);
        body = `<div class="chips ${q.kind}">${opts.map((o) => `<button class="chip" draggable="${q.kind === "multi"}" data-o="${o.id}" aria-pressed="${sel(o)}">${t(o.label)}</button>`).join("")}</div>`;
        if (q.kind === "multi") body += `<div class="dock" aria-hidden="true">${u("drop")}</div>`;
      }
      panel.innerHTML = `<div class="q" key="${q.id}">
        <div class="count">${u("of", { n: S.i + 1, t: QS.length })}<span class="bar"><i style="width:${((S.i + 1) / QS.length) * 100}%"></i></span></div>
        <h1>${t(q.q)}</h1>
        ${q.more ? `<details class="more"><summary aria-label="${u("more")}">?</summary><p>${t(q.more)}</p></details>` : ""}
        ${body}
        <nav class="go"><button class="ghost" data-act="back" ${S.i === 0 ? "disabled" : ""} aria-label="${u("back")}">←</button>
        <button class="primary" data-act="next" ${answered(q) ? "" : "disabled"}>${last ? u("done") : u("next")} →</button></nav></div>`;
      paintScene(S.i / QS.length);
      const rng = $("input[type=range]", panel);
      if (rng) rng.addEventListener("input", () => {
        const o = opts[+rng.value]; S.a[q.id] = o.id; rng.setAttribute("aria-valuetext", t(o.label));
        $(".readout", panel).innerHTML = `<b>${t(o.label)}</b>${o.sub ? ` <small>${t(o.sub)}</small>` : ""}`;
        [...panel.querySelectorAll(".ticks span")].forEach((s, i) => s.classList.toggle("on", i === +rng.value));
        paintScene((S.i + 0.5) / QS.length);
      });
      // Drag tokens onto the dock / boat (pointer-friendly alternative: tapping toggles).
      const dock = $(".dock", panel);
      if (dock) {
        panel.querySelectorAll(".chip").forEach((c) => c.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", c.dataset.o)));
        [dock, svg].forEach((z) => { z.addEventListener("dragover", (e) => { e.preventDefault(); dock.classList.add("hot"); }); z.addEventListener("dragleave", () => dock.classList.remove("hot"));
          z.addEventListener("drop", (e) => { e.preventDefault(); dock.classList.remove("hot"); const id = e.dataTransfer.getData("text/plain"); const arr = new Set(S.a[q.id] || []); arr.add(id); S.a[q.id] = [...arr]; renderQ(); }); });
      }
    }
    panel.addEventListener("click", (e) => {
      if (S.view !== "q") return;
      const c = e.target.closest(".chip"), act = e.target.closest("[data-act]");
      const q = QS[S.i];
      if (c) {
        if (q.kind === "multi") { const arr = new Set(S.a[q.id] || []); arr.has(c.dataset.o) ? arr.delete(c.dataset.o) : arr.add(c.dataset.o); S.a[q.id] = [...arr]; c.setAttribute("aria-pressed", arr.has(c.dataset.o)); paintScene((S.i + 0.5) / QS.length); }
        else { S.a[q.id] = c.dataset.o; panel.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === c)); $("[data-act=next]", panel).disabled = false; paintScene((S.i + 0.5) / QS.length); }
      }
      if (act && act.dataset.act === "back" && S.i > 0) { S.i--; renderQ(); }
      if (act && act.dataset.act === "next") { if (S.i < QS.length - 1) { S.i++; renderQ(); $(".q h1", panel).focus?.(); } else finish(); }
    });
    function finish() { if (!cfg.demo) localStorage.setItem(KEY_RES, JSON.stringify(S.a)); S.view = "r"; S.pick = null; render(); root.scrollIntoView?.({ block: "start" }); }

    /* ---------- result: nautical chart ---------- */
    function chart(arch, ranked) {
      seed = 23;
      const top = [...ranked].sort((a, b) => b.score + (b.c.full ? 10 : 0) - a.score - (a.c.full ? 10 : 0)).slice(0, 6);
      const spots = [[820, 120], [900, 230], [800, 330], [915, 420], [760, 470], [880, 520]];
      const route = "M110,470 C260,470 330,300 480,300 S640,200 720,240";
      const buoys = [[250, 430], [420, 310], [620, 238]];
      let g = `<g class="layer" data-depth="0.15">${Array.from({ length: 21 }, (_, i) => `<path class="grid" d="M${i * 50},0 V600"/>`).join("")}${Array.from({ length: 13 }, (_, i) => `<path class="grid" d="M0,${i * 50} H1000"/>`).join("")}</g>`;
      g += `<g class="layer" data-depth="0.35">${[120, 200, 280, 380, 470, 540].map((y) => `<path class="contour" d="${wob(0, 700, y, 10, 70)}"/>`).join("")}</g>`;
      g += `<g class="rose" transform="translate(90,90)"><circle r="34"/><path d="M0,-44 L7,0 L0,44 L-7,0Z"/><path d="M-44,0 L0,6 L44,0 L0,-6Z"/><text y="-50" text-anchor="middle">N</text></g>`;
      g += `<path class="coast" d="M740,0 Q700,90 760,170 Q720,260 750,330 Q700,420 730,600 L1000,600 L1000,0Z"/>`;
      g += `<path class="route" d="${route}"/>`;
      g += `<g class="port"><circle cx="110" cy="470" r="9"/><text x="110" y="500" text-anchor="middle">${u("here")}</text></g>`;
      g += buoys.map(([x, y], i) => `<g class="buoy" style="animation-delay:${0.3 + i * 0.25}s"><path d="M${x - 7},${y + 6} L${x},${y - 12} L${x + 7},${y + 6}Z"/><text x="${x}" y="${y + 26}" text-anchor="middle"><tspan class="mo">${["0–6", "6–18", "18–36"][i]}${S.lang === "zh" ? " 个月" : " mo"}</tspan><tspan x="${x}" dy="16">${esc(t(arch.timeline[i]))}</tspan></text></g>`).join("");
      g += top.map(({ c, score }, i) => { const [x, y] = spots[i]; return `<g class="harbor ${c.full ? "full" : "soon"} ${S.pick === c.id ? "on" : ""}" tabindex="0" role="button" data-c="${c.id}" aria-label="${esc(t(c.name))} ${score}">
          <path d="${blob(x, y, 14 + score / 7)}"/>${i === 0 ? `<path class="lane" d="M720,240 Q${(720 + x) / 2},${Math.min(240, y) - 30} ${x - 20},${y}"/>` : ""}
          <text x="${x}" y="${y - 1}" text-anchor="middle">${esc(t(c.name))}</text><text class="sc" x="${x}" y="${y + 14}" text-anchor="middle">${score}</text></g>`; }).join("");
      root._top = top; return { svg: `<svg class="chart" viewBox="0 0 1000 600" role="img" aria-label="${esc(t(SHORT[arch.id]))}">${g}</svg>`, rest: ranked.filter((x) => !top.includes(x)) };
    }
    function gapLine(g) { return g.axis === "language" ? u("lang") : `${t(N.AXES.find((a) => a.id === g.axis).label)} ${g.have} → ${g.need}+`; }
    function harborDetail(id) {
      const c = N.COUNTRIES.find((x) => x.id === id), { s } = paintScene(1), m = N.matchCountry(c, s, S.a);
      const sec = (k, html, open) => `<details ${open ? "open" : ""}><summary>${t(UI.sec[k])}</summary><div>${html}</div></details>`;
      let html = `<div class="hd"><h2>${t(c.name)}</h2><span class="score">${m.score} ${u("match")}</span></div><p class="line">${t(c.line)}</p>
        <details open><summary>${u("gaps")}</summary><ul>${m.gaps.length ? m.gaps.map((g) => `<li>${esc(gapLine(g))}</li>`).join("") : `<li>${u("noGap")}</li>`}</ul></details>`;
      if (!c.full) return html + `<p class="soonnote">${u("soon")}</p>`;
      return html + sec("overview", `<p>${t(c.overview)}</p>`) + sec("routes", c.routes.map((r) => `<p><b>${t(r.name)}</b><br>${t(r.note)}</p>`).join(""))
        + sec("req", `<dl>${c.req.map(([a, b]) => `<dt>${t(a)}</dt><dd>${t(b)}</dd>`).join("")}</dl>`) + sec("living", `<p>${t(c.living)}</p>`)
        + sec("risks", `<ul>${c.risks.map((r) => `<li>${t(r)}</li>`).join("")}</ul>`) + sec("suits", `<p>${c.suits.map(t).join(" · ")}</p>`)
        + sec("links", `<ul>${c.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${t(l.label)} ↗</a></li>`).join("")}</ul>`);
    }
    function renderR() {
      const { s, r } = paintScene(1), arch = N.pickArchetype(s, r);
      const ranked = N.COUNTRIES.map((c) => ({ c, ...N.matchCountry(c, s, S.a) })).sort((a, b) => b.score - a.score);
      const { svg: ch, rest } = chart(arch, ranked);
      const weak = Object.entries(s).sort((a, b) => a[1] - b[1]).slice(0, 3);
      panel.innerHTML = `<div class="res">
        <div class="verdict"><h1>${t(SHORT[arch.id])}</h1>
          <div class="meta"><span class="yrs">${t(arch.years)}</span><span class="knots" aria-label="${u("effort")} ${arch.effort}/5">${u("effort")} ${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= arch.effort ? "on" : ""}"></i>`).join("")}</span></div></div>
        <div class="mapwrap">${ch}<p class="hint">${u("tap")}</p></div><div class="olist hlist">${root._top.map(({ c, score }) => `<button data-c="${c.id}" aria-pressed="${S.pick === c.id}">${t(c.name)} <small>${score}</small></button>`).join("")}</div>
        <section class="harbor-detail" ${S.pick ? "" : "hidden"}>${S.pick ? harborDetail(S.pick) : ""}</section>
        <details class="why"><summary>${u("why")}</summary><div><p>${t(arch.summary)}</p>
          <h3>${u("steps")}</h3><ol>${arch.steps.map((x) => `<li>${t(x)}</li>`).join("")}</ol>
          <h3>${u("weak")}</h3>${weak.map(([k, v]) => `<p class="weak"><span class="m"><i style="width:${v}%"></i></span><b>${t(N.AXES.find((a) => a.id === k).label)} ${v}</b> ${t(N.GAP_TEXT[k])}</p>`).join("")}</div></details>
        <details class="others"><summary>${u("others")} (${rest.length})</summary><div class="olist">${rest.map(({ c, score }) => `<button data-c="${c.id}">${t(c.name)} <small>${score}${c.full ? "" : " · " + u("soon")}</small></button>`).join("")}</div></details>
        <nav class="go"><button class="ghost" data-r="edit">${u("edit")}</button><button class="ghost" data-r="redo">${u("redo")}</button></nav></div>`;
      const mw = $(".mapwrap", panel); mw.scrollLeft = mw.scrollWidth;
      parallax();
    }
    panel.addEventListener("click", (e) => {
      if (S.view !== "r") return;
      const hb = e.target.closest("[data-c]"), b = e.target.closest("[data-r]");
      if (hb) { S.pick = hb.dataset.c; renderR(); const d = $(".harbor-detail", panel); d.scrollIntoView?.({ behavior: "smooth", block: "nearest" }); }
      if (b && b.dataset.r === "edit") { S.view = "q"; S.i = 0; render(); }
      if (b && b.dataset.r === "redo") { S.a = {}; S.i = 0; S.view = "q"; localStorage.removeItem(KEY_RES); render(); }
    });
    panel.addEventListener("keydown", (e) => { const hb = e.target.closest && e.target.closest(".harbor"); if (hb && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); hb.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });

    /* Parallax for chart layers (used visibly by the bold variant). */
    function parallax() {
      if (!cfg.parallax) return;
      const layers = panel.querySelectorAll(".layer");
      const on = () => { const y = window.scrollY; layers.forEach((l) => l.style.transform = `translateY(${(-y * l.dataset.depth * 0.3).toFixed(1)}px)`); };
      window.removeEventListener("scroll", root._px || (() => {})); root._px = on; window.addEventListener("scroll", on, { passive: true }); on();
    }

    function render() {
      root.dataset.view = S.view;
      document.documentElement.lang = S.lang === "zh" ? "zh-CN" : "en";
      root.querySelectorAll("[data-l]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === S.lang));
      $(".disc", root).textContent = u("disc");
      if (cfg.demo) { renderQ(); const extra = $(".demo-result"); if (extra) { const v = S.view; S.view = "r"; const keep = panel.innerHTML; renderR(); extra.innerHTML = panel.innerHTML; panel.innerHTML = keep; S.view = v; paintScene(S.i / QS.length); } return; }
      S.view === "q" ? renderQ() : renderR();
    }
    root.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => { S.lang = b.dataset.l; localStorage.setItem(KEY_LANG, S.lang); render(); }));
    document.addEventListener("keydown", (e) => { if (S.view === "q" && e.key === "Enter" && !e.target.closest("button,summary,a")) { const n = $("[data-act=next]", panel); n && !n.disabled && n.click(); } });
    render();
    return { rerender: render };
  }
  window.NSV = { mount, QS };
})();
