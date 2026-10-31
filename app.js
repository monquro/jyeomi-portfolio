/* 포트폴리오 — portfolio.json 을 읽어 선반에 진열한다.
 * 매주 카드 한 칸을 JSON 에 더하면 선반 한 칸이 채워진다. 하나를 누르면 꺼내서 자세히 본다. */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const WEEKS = 9;          // 9주 과정 — 선반 세 줄에 세 칸씩
  const PER_SHELF = 3;
  const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let CARDS = [];
  let opener = null;        // 닫으면 포커스를 돌려줄 물건

  fetch("portfolio.json").then(r => r.json()).then(P => {
    $("#owner").textContent = P.owner;
    $("#headline").textContent = P.headline;
    $("#intro").textContent = P.intro;
    CARDS = P.cards;
    renderShelves();
    renderProposal(P.proposal);
    document.body.dataset.ready = "1";
  });

  /* ── 선반 ─────────────────────────────────────────── */
  function item(c, week) {
    if (!c) {
      return `<div class="slot empty"><span class="ghost">${week}주</span><span class="soon">곧 채워져요</span></div>`;
    }
    return `
      <button class="slot item" data-week="${week}" style="--i:${week}">
        <span class="print">
          ${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : `<span class="noimg">${week}주</span>`}
          <span class="cap">${esc(c.title)}</span>
        </span>
        <span class="tag-wk">${week}주</span>
        <span class="sr">${esc(c.title)} 자세히 보기</span>
      </button>`;
  }

  function renderShelves() {
    const slots = Array.from({ length: WEEKS }, (_, i) => CARDS.find(c => c.week === i + 1));
    let html = "";
    for (let s = 0; s < WEEKS / PER_SHELF; s++) {
      const row = slots.slice(s * PER_SHELF, (s + 1) * PER_SHELF)
        .map((c, k) => item(c, s * PER_SHELF + k + 1)).join("");
      html += `<div class="shelf"><div class="row">${row}</div><div class="board" aria-hidden="true"></div></div>`;
    }
    $("#shelves").innerHTML = html;
    document.querySelectorAll(".item").forEach(b => (b.onclick = () => open(+b.dataset.week, b)));
  }

  /* ── 꺼내 보기 — 선반 자리에서 가운데로 들어 올리고, 설명 카드를 올린다 ── */
  function open(week, btn) {
    const c = CARDS.find(x => x.week === week);
    if (!c) return;
    opener = btn;
    $("#d-week").textContent = `${week}주`;
    $("#d-title").textContent = c.title;
    $("#d-line").textContent = c.line;
    $("#d-tags").innerHTML = (c.ai || []).map(a => `<span>${esc(a)}</span>`).join("");
    $("#d-stats").innerHTML = (c.stats || []).map(([k, v]) =>
      `<div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("");
    $("#d-stats").hidden = !(c.stats || []).length;
    $("#d-judge").textContent = c.judgment;
    const go = $("#d-go");
    go.hidden = !c.url;
    if (c.url) go.href = c.url;

    // 선반 위 사진을 복사해서, 그 자리에서 화면 가운데 위쪽으로 띄운다
    const from = btn.querySelector(".print").getBoundingClientRect();
    const lifted = $("#lifted");
    lifted.innerHTML = btn.querySelector(".print").outerHTML;
    const d = $("#detail");
    d.hidden = false;
    document.body.classList.add("locked");
    const w = Math.min(200, innerWidth * .46);
    const h = w * (from.height / from.width);
    const to = { left: (innerWidth - w) / 2, top: Math.max(24, innerHeight * .1) };
    Object.assign(lifted.style, { width: `${w}px`, height: `${h}px`, left: `${to.left}px`, top: `${to.top}px` });
    if (!calm()) {
      // FLIP — 선반 자리에서 시작해 제자리로
      const sx = from.width / w, dx = from.left - to.left, dy = from.top - to.top;
      lifted.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sx})`, offset: 0 },
        { transform: "translate(0, -12px) scale(1.04) rotate(-3deg)", offset: .7 },
        { transform: "translate(0, 0) scale(1) rotate(-2deg)" },
      ], { duration: 560, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    }
    requestAnimationFrame(() => d.classList.add("on"));
    btn.classList.add("out");                   // 선반의 그 자리는 비어 보이게
    $("#d-close").focus({ preventScroll: true });
  }

  function close() {
    const d = $("#detail");
    if (d.hidden) return;
    d.classList.remove("on");
    const done = () => {
      d.hidden = true;
      document.body.classList.remove("locked");
      if (opener) { opener.classList.remove("out"); opener.focus({ preventScroll: true }); }
    };
    if (calm()) done(); else setTimeout(done, 280);
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
