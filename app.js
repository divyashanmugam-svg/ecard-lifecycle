const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = s => esc(s).replace(/\*(.+?)\*/g, "<b>$1</b>");
const ORDER = [...NODES].sort((a, b) => a.col - b.col || ["sched", "tap", "flow"].indexOf(a.row) - ["sched", "tap", "flow"].indexOf(b.row));
let current = ORDER[0].id, msgIdx = 0;

/* timeline */
function renderTimeline() {
  const g = $("#tlGrid"), maxCol = Math.max(...NODES.map(n => n.col));
  g.style.gridTemplateColumns = `92px repeat(${maxCol}, 168px)`;
  let h = "";
  Object.entries(PHASES).forEach(([k, p]) => {
    const cols = NODES.filter(n => n.phase === k).map(n => n.col);
    const a = Math.min(...cols) + 1, b = Math.max(...cols) + 2;
    h += `<div class="phase-head" style="grid-row:1;grid-column:${a}/${b};background:${p.soft};color:${p.color}">${p.label}<small>${p.sub}</small></div>`;
  });
  Object.entries(ROWS).forEach(([k, r], i) => { h += `<div class="rowlabel" style="grid-row:${i + 2}">${r.label}</div>`; });
  NODES.forEach(n => {
    const p = PHASES[n.phase], chs = [...new Set(n.msgs.map(m => m.ch))];
    const dim = false;
    h += `<button class="node ${n.row === "tap" ? "tap" : ""} ${dim ? "dim" : ""}" data-id="${n.id}" aria-current="${n.id === current}"
      style="grid-row:${["sched", "tap", "flow"].indexOf(n.row) + 2};grid-column:${n.col + 1};--nc:${p.color}">
      <span class="ico">${ROWS[n.row].icon} ${p.label}</span><span class="when">${esc(n.when)}</span>
      <span class="ttl">${esc(n.title)}</span>
      <span class="dots">${chs.map(c => `<i style="background:${CH[c].color}" title="${CH[c].label}"></i>`).join("")}</span></button>`;
  });
  g.innerHTML = h;
}
$("#tlGrid").addEventListener("click", e => { const b = e.target.closest(".node"); if (b) select(b.dataset.id, false); });

/* detail */
function select(id, scroll = true) {
  current = id; msgIdx = 0;
  document.querySelectorAll(".node").forEach(n => n.setAttribute("aria-current", n.dataset.id === id));
  if (scroll) { const n = $(`.node[data-id="${id}"]`); n && n.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }
  renderDetail();
}
function cardImg(v) {
  const num = v === "us" ? `<div class="nums"><div><small>USA and Canada</small><b>+1 833 813 8772</b></div><div><small>All other countries</small><b>+91 22 6963 5374</b></div></div>` : `<div class="nums"><small>24/7 assistance</small><b>+91 22 6963 5374</b></div>`;
  return `<div class="ecard">${v === "multi" ? '<span class="more">+3 travellers</span>' : ""}<div class="logos"><b>ACKO</b><i>europ assistance</i></div><div class="nm">[Name]</div>
  <div class="r"><span>Policy ID</span><b>[Policy ID]</b></div><div class="r"><span>Date of birth</span><b>[DOB]</b></div><div class="r"><span>Coverage</span><b>[start] – [end]</b></div><div class="r"><span>Valid countries</span><b>[Destination]</b></div><div class="r"><span>Medical sum insured</span><b>[Sum insured]</b></div>${num}</div>`;
}
function renderMsg(m) {
  const lab = m.label ? m.label : CH[m.ch].label;
  const proposed = m.ch === "wa" ? '<span class="proposed">Proposed copy</span>' : "";
  let body = "";
  if (m.ch === "wa") {
    body = `<div class="phone"><div class="wa-head"><div class="wa-av">A</div><div><b>ACKO India</b><small>Business account</small></div></div><div class="wa-body">` +
      m.thread.map(t => `<div class="bub ${t.from}">${t.card ? cardImg(t.card) : ""}${t.doc ? `<div class="doc"><span>PDF</span>${esc(t.doc)}</div>` : ""}${md(t.text)}${t.buttons ? `<div class="qr">${t.buttons.map(b => `<div>${esc(b)}</div>`).join("")}</div>` : ""}</div>`).join("") + `</div></div>`;
  } else if (m.ch === "push") {
    body = `<div class="push"><div class="clock">9:41</div><div class="notif"><div class="app">ACKO</div><div><small><span>ACKO</span><span>now</span></small><b>${esc(m.title)}</b><p>${esc(m.body)}</p></div></div><div class="link">${esc(m.link || "")}</div></div>`;
  } else if (m.ch === "email") {
    body = `<div class="email"><div class="eh"><div><span>To</span>${esc(m.to)}</div><div><span>Subject</span><b>${esc(m.subject)}</b></div></div><div class="eb">${esc(m.body)}</div></div>`;
  } else {
    body = `<div class="inapp"><div class="sheet"><b>${esc(m.title)}</b><p>${esc(m.body)}</p>${m.link ? `<div class="l">${esc(m.link)}</div>` : ""}</div></div>`;
  }
  return `<div class="mlabel"><span>${esc(lab)}</span>${proposed}</div>${body}`;
}
const POINTS = {
  p1: ["Policy is issued the moment it's bought.", "Customer gets the policy PDF on WhatsApp and email.", "Nothing about the e-card yet."],
  q1: ["Any e-card action, any number of times.", "The app works normally.", "We send nothing."],
  p2: ["Pre-trip starts 15 days before the trip.", "Still no messages.", "Actions are still ignored."],
  p3: ["3 days before the trip.", "First time we talk about the medical e-card. Text only, no card image.", "Buttons: Download e-card, View policy PDF."],
  p5: ["Any e-card action from T-3 to trip start.", "Download: toast and one WhatsApp confirmation.", "No check-in, because cover hasn't started."],
  i1: ["Trip start day: two WhatsApp messages.", "1. The e-card, with the card image. Variants for 1 traveller, several, and USA / Canada.", "2. The policy document, as proof of insurance for visa and entry checks."],
  i2: ["Any e-card action during the trip.", "We send the WhatsApp check-in straight away.", "Wording follows the action: view, download, share, call."],
  i7: ["Customer taps 👍.", "We say one line back.", "Nothing more."],
  i8: ["Customer taps 👎.", "We show the medical help options. Request a callback opens the form from a link.", "Also: cashless hospitals near me, view e-card, talk to a doctor online."],
  i10: ["Customer submits the callback form.", "In-app alert card, push, and WhatsApp confirmation with more help options.", "One email to Europ Assistance with the details."],
  t2: ["Trip has ended.", "No view, download, call or callback on the e-card.", "No message of any kind."],
};
function renderDetail() {
  const n = NODES.find(x => x.id === current), p = PHASES[n.phase], i = ORDER.indexOf(n), msgs = n.msgs;
  $("#detail").innerHTML = `
  <div>
    <span class="pill" style="background:${p.soft};color:${p.color}">${p.label} · ${esc(n.when)}</span>
    <h2 class="d-title">${esc(n.title)}</h2>
    <div class="sec"><ul>${(POINTS[n.id] || []).map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>
    <div class="navbtns"><button class="btn" id="prev" ${i === 0 ? "disabled" : ""}>← Previous</button><button class="btn primary" id="next" ${i === ORDER.length - 1 ? "disabled" : ""}>Next →</button></div>
  </div>
  <div>
    ${msgs.length > 1 ? `<div class="msg-tabs" role="tablist">${msgs.map((m, k) => `<button class="mt" role="tab" data-k="${k}" aria-selected="${k === msgIdx}"><i style="background:${CH[m.ch].color}"></i>${m.ch === "wa" && msgs.filter(x => x.ch === "wa").length > 1 && m.label ? esc(m.label.replace(/^WhatsApp · /, "").slice(0, 30)) : CH[m.ch].label}</button>`).join("")}</div>` : ""}
    <div id="msgBody">${renderMsg(msgs[msgIdx])}</div>
  </div>`;
  $("#prev").onclick = () => select(ORDER[i - 1].id);
  $("#next").onclick = () => select(ORDER[i + 1].id);
  const mt = $(".msg-tabs"); if (mt) mt.onclick = e => { const b = e.target.closest(".mt"); if (!b) return; msgIdx = +b.dataset.k; renderDetail(); };
}
document.addEventListener("keydown", e => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const i = ORDER.findIndex(n => n.id === current);
  if (e.key === "ArrowRight" && i < ORDER.length - 1) select(ORDER[i + 1].id);
  if (e.key === "ArrowLeft" && i > 0) select(ORDER[i - 1].id);
});


renderTimeline(); renderDetail();
