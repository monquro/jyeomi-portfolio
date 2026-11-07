/* 포트폴리오 — portfolio.json 을 읽어 선반에 상자로 진열한다.
 * 매주 카드 한 칸을 JSON 에 더하면 선반의 빈 상자 하나가 채워진다. 상자를 누르면 꺼내서 자세히 본다. */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const WEEKS = 9;          // 9주 과정 — 선반 세 줄에 세 칸씩
  const PER_SHELF = 3;
  const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let CARDS = [];
  let opener = null;        // 닫으면 포커스를 돌려줄 상자

  /* 상자 앞면 그림 — 카드의 art 이름으로 고른다. 없으면 화면 캡처(img)를 붙인다 */
  const ART = {
    photobooth: `
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <g fill="none" stroke="#0f1030" stroke-width="2.5" stroke-linejoin="round">
          <rect x="30" y="18" width="60" height="84" rx="6" fill="#2438f5"/>
          <rect x="30" y="18" width="60" height="12" rx="4" fill="#3a4cff"/>
          <rect x="36" y="36" width="18" height="22" rx="3" fill="#d8ff3e"/>
          <path d="M60 32h26v66H60z" fill="#d8ff3e"/>
          <path d="M66 32v66M73 32v66M80 32v66" stroke-width="1.5"/>
          <rect x="38" y="66" width="14" height="4" rx="2" fill="#0f1030"/>
          <rect x="22" y="72" width="22" height="34" rx="2" fill="#fff" transform="rotate(-12 33 89)"/>
          <rect x="25" y="76" width="16" height="9" fill="#ff7fa3" transform="rotate(-12 33 89)"/>
          <rect x="25" y="88" width="16" height="9" fill="#b9a3ff" transform="rotate(-12 33 89)"/>
        </g>
        <g fill="#ff7fa3"><rect x="14" y="24" width="5" height="9" rx="1" transform="rotate(-25 16 28)"/><rect x="98" y="40" width="5" height="9" rx="1" transform="rotate(20 100 44)"/></g>
        <g fill="#b9a3ff"><rect x="100" y="76" width="5" height="9" rx="1" transform="rotate(-15 102 80)"/><rect x="16" y="54" width="5" height="9" rx="1" transform="rotate(30 18 58)"/></g>
        <path d="M44 42l2 4h-4z" fill="#0f1030"/>
      </svg>`,
    /* 2주 — 받은 글 목록: 급한 글(빨강)이 위로, 칸 이름표 */
    inbox: `
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <g fill="none" stroke="#0f1030" stroke-width="2.5" stroke-linejoin="round">
          <rect x="18" y="20" width="84" height="80" rx="8" fill="#fff"/>
          <path d="M18 34h84" />
          <rect x="18" y="20" width="84" height="14" rx="6" fill="#2438f5"/>
          <rect x="26" y="42" width="68" height="16" rx="4" fill="#ffd6e0"/>
          <rect x="26" y="62" width="68" height="16" rx="4" fill="#fff"/>
          <rect x="26" y="82" width="68" height="12" rx="4" fill="#fff"/>
        </g>
        <circle cx="34" cy="50" r="3.5" fill="#d12a4a"/><rect x="42" y="47" width="30" height="6" rx="3" fill="#0f1030"/><rect x="76" y="46" width="13" height="8" rx="4" fill="#d8ff3e" stroke="#0f1030" stroke-width="1.5"/>
        <circle cx="34" cy="70" r="3.5" fill="#f5a524"/><rect x="42" y="67" width="38" height="6" rx="3" fill="#0f1030" opacity=".55"/>
        <circle cx="34" cy="88" r="3.5" fill="#1f9d63"/><rect x="42" y="85" width="26" height="6" rx="3" fill="#0f1030" opacity=".35"/>
        <circle cx="30" cy="27" r="2" fill="#d8ff3e"/><circle cx="37" cy="27" r="2" fill="#fff"/><circle cx="44" cy="27" r="2" fill="#fff"/>
        <g fill="#b9a3ff"><rect x="102" y="96" width="5" height="9" rx="1" transform="rotate(-20 104 100)"/></g>
        <g fill="#ff7fa3"><rect x="10" y="60" width="5" height="9" rx="1" transform="rotate(25 12 64)"/></g>
      </svg>`,
  };

  fetch("portfolio.json").then(r => r.json()).then(P => {
    $("#owner").textContent = P.owner;
    $("#headline").textContent = P.headline;
    $("#intro").textContent = P.intro;
    CARDS = P.cards;
    $("#progress").innerHTML = `<i aria-hidden="true"></i>${CARDS.length} / ${WEEKS} 진행 중`;
    renderShelves();
    renderProposal(P.proposal);
    document.body.dataset.ready = "1";
  });

  /* ── 상자 ─────────────────────────────────────────── */
  const split = t => { const [a, ...b] = String(t).split(" · "); return [a, b.join(" · ")]; };

  function box(c, week) {
    if (!c) {
      return `<div class="box empty" aria-hidden="true">
        <span class="face front"><b>${week}주</b></span><span class="face side"></span><span class="face top"></span></div>`;
    }
    const [name] = split(c.title);
    const art = ART[c.art] || (c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : "");
    return `<span class="box full">
        <span class="face front"><span class="art">${art}</span><span class="band">${esc(name)}</span></span>
        <span class="face side"><span>${esc(name)}</span></span>
        <span class="face top"></span>
      </span>`;
  }

  function label(c, week) {
    if (!c) return `<div class="lab"><span class="chip off">${week}주</span><span class="soon">곧 채워져요</span></div>`;
    const [name, sub] = split(c.title);
    return `<div class="lab"><span class="chip">${week}주</span>
      <span class="name"><span aria-hidden="true">${esc(c.emoji || "")}</span> ${esc(name)}</span>
      ${sub ? `<span class="sub">${esc(sub)}</span>` : ""}
      <span class="short">${esc(c.short || c.line)}</span></div>`;
  }

  function renderShelves() {
    const slots = Array.from({ length: WEEKS }, (_, i) => CARDS.find(c => c.week === i + 1));
    let html = "";
    for (let s = 0; s < WEEKS / PER_SHELF; s++) {
      const part = slots.slice(s * PER_SHELF, (s + 1) * PER_SHELF);
      const boxes = part.map((c, k) => {
        const w = s * PER_SHELF + k + 1;
        return c
          ? `<button class="slot" data-week="${w}" style="--i:${w}">${box(c, w)}<span class="sr">${esc(c.title)} 자세히 보기</span></button>`
          : `<div class="slot" style="--i:${w}">${box(null, w)}</div>`;
      }).join("");
      const labels = part.map((c, k) => label(c, s * PER_SHELF + k + 1)).join("");
      html += `<div class="shelf"><div class="row">${boxes}</div>
        <div class="board" aria-hidden="true"></div><div class="labels">${labels}</div></div>`;
    }
    $("#shelves").innerHTML = html;
    document.querySelectorAll("button.slot").forEach(b => (b.onclick = () => open(+b.dataset.week, b)));
  }

  /* ── 꺼내 보기 — 선반 자리에서 위로 들어 올리고, 설명 카드를 올린다 ── */
  function open(week, btn) {
    const c = CARDS.find(x => x.week === week);
    if (!c) return;
    opener = btn;
    const [name, sub] = split(c.title);
    $("#d-week").textContent = `${week}주차`;
    $("#d-emoji").textContent = c.emoji || "";
    $("#d-title").textContent = name;
    $("#d-sub").textContent = sub;
    $("#d-line").textContent = c.short || c.line;
    $("#d-tags").innerHTML = (c.ai || []).map((a, i) => `<span class="t${i % 3}">${esc(a)}</span>`).join("");
    $("#d-stats").innerHTML = (c.stats || []).map(([k, v]) =>
      `<div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("");
    $("#d-stats").hidden = !(c.stats || []).length;
    $("#d-judge").textContent = c.judgment;
    const go = $("#d-go");
    go.hidden = !c.url;
    if (c.url) go.href = c.url;

    // 선반 위 상자를 같은 비율로 복사해서, 그 자리에서 화면 위쪽 가운데로 띄운다.
    // 크기는 transform(scale)로만 바꾼다 — 글자가 다시 줄바꿈되거나 튀지 않게
    const src = btn.querySelector(".box");
    const lifted = $("#lifted");
    const w = Math.min(170, innerWidth * .4);
    lifted.innerHTML = src.outerHTML;
    lifted.firstElementChild.style.setProperty("--w", `${w}px`);
    const to = { left: (innerWidth - w) / 2, top: Math.max(20, innerHeight * .06) };
    Object.assign(lifted.style, { width: `${w}px`, left: `${to.left}px`, top: `${to.top}px` });
    FLIP = from(btn, src, to, w);

    const d = $("#detail");
    d.hidden = false;
    document.body.classList.add("locked");
    btn.classList.add("out");                   // 선반의 그 자리는 비어 보이게
    if (!calm()) {
      lifted.animate([{ transform: FLIP.box }, { transform: "none" }], { duration: 640, easing: EASE_OUT, fill: "both" });
      lifted.firstElementChild.animate([{ transform: FLIP.turn }, { transform: LIFTED_TURN }],
        { duration: 640, easing: EASE_OUT, fill: "both" });
    }
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("on")));
    $("#d-close").focus({ preventScroll: true });
  }

  const EASE_OUT = "cubic-bezier(.22, 1, .36, 1)";      // 빠르게 출발해 부드럽게 멈춘다
  const EASE_IN = "cubic-bezier(.4, 0, .2, 1)";
  const LIFTED_TURN = "rotateX(-6deg) rotateY(-14deg)";
  let FLIP = null;

  /* 선반 위 상자의 자리 · 크기 · 기울기를, 꺼낸 상자 기준의 transform 으로 바꾼다 */
  function from(btn, src, to, w) {
    const r = btn.getBoundingClientRect();
    const bw = src.offsetWidth, bh = src.offsetHeight;
    const left = r.left + (r.width - bw) / 2;
    const top = r.bottom - 6 - bh;                  // .slot 아래 여백 6px
    const turn = getComputedStyle(src).transform;   // 지금 기울기(손을 올렸으면 그 상태) 그대로
    return {
      box: `translate(${left - to.left}px, ${top - to.top}px) scale(${bw / w})`,
      turn: turn === "none" ? "rotateX(-6deg) rotateY(-24deg)" : turn,
    };
  }

  function close() {
    const d = $("#detail");
    if (d.hidden || d.dataset.closing) return;
    d.dataset.closing = "1";
    d.classList.remove("on");
    const done = () => {
      delete d.dataset.closing;
      d.hidden = true;
      document.body.classList.remove("locked");
      if (opener) { opener.classList.remove("out"); opener.focus({ preventScroll: true }); }
    };
    if (calm() || !FLIP) { done(); return; }
    // 선반 제자리로 되돌려 놓는다 (스크롤했을 수 있으니 자리를 다시 잰다)
    const lifted = $("#lifted");
    const back = from(opener, opener.querySelector(".box"), {
      left: parseFloat(lifted.style.left), top: parseFloat(lifted.style.top) }, parseFloat(lifted.style.width));
    back.turn = "rotateX(-6deg) rotateY(-24deg)";
    lifted.animate([{ transform: "none" }, { transform: back.box }], { duration: 440, easing: EASE_IN, fill: "both" });
    lifted.firstElementChild.animate([{ transform: LIFTED_TURN }, { transform: back.turn }],
      { duration: 440, easing: EASE_IN, fill: "both" }).finished.then(done);
  }

  document.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  /* ── 제안 (9주차에 채운다) ───────────────────────── */
  function renderProposal(p) {
    if (!p) return;
    $("#proposal").hidden = false;
    $("#p-title").textContent = p.title;
    $("#p-ask").textContent = p.ask;
    $("#p-evidence").innerHTML = p.evidence.map(x => `<li>${esc(x)}</li>`).join("");
    $("#p-wrong").innerHTML = p.if_wrong.map(x => `<li>${esc(x)}</li>`).join("");
    $("#p-dont").textContent = p.dont;
  }
})();
