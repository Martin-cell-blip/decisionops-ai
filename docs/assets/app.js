/* DecisionOps AI — ledger app
   Precomputed decisions come from the Python agents (scripts/build_real_datasets.py).
   The BYOD engines below are a documented JS mirror of src/decisionops; the Python
   package remains the canonical implementation. */
"use strict";

/* ---------------- i18n ---------------- */
const I18N = {
  "nav.data": { en: "Real data", zh: "真实数据" },
  "nav.explorer": { en: "Growth explorer", zh: "经营浏览器" },
  "nav.workbench": { en: "Settlement", zh: "结算工作台" },
  "nav.byod": { en: "Your data", zh: "用你的数据" },
  "nav.method": { en: "Method", zh: "方法与评测" },
  "nav.research": { en: "Research", zh: "用户研究" },
  "hero.kicker": { en: "Evidence-grounded business agents", zh: "证据驱动的业务决策 Agent" },
  "hero.title1": { en: "Decisions,", zh: "决策，" },
  "hero.title2": { en: "with receipts.", zh: "笔笔有据。" },
  "hero.lede": {
    en: "Two bounded agents read real e-commerce data — <b>112,650 order lines</b> from the public Olist dataset — and turn it into cited, reversible, human-approved decisions. Python owns every number. The model only explains. You approve.",
    zh: "两个有界 Agent 读取真实电商数据——公开 Olist 数据集的 <b>112,650 条订单行</b>——并把它变成带引用、可回滚、须人工审批的决策。数字由 Python 计算，模型只负责解释，行动由你批准。",
  },
  "hero.cta1": { en: "Explore real merchants", zh: "浏览真实商家" },
  "hero.cta2": { en: "Run your own CSV", zh: "上传你的 CSV" },
  "hero.cta3": { en: "Source", zh: "源码" },
  "card.lbl": { en: "Seeded offline evaluation", zh: "固定种子离线评测" },
  "card.sub": { en: "binary checks passed after one documented eval redesign", zh: "二值检查通过（含一次已记录的评测重构）" },
  "card.r1": { en: "Settlement cases", zh: "结算场景" },
  "card.r2": { en: "Growth cases", zh: "经营场景" },
  "card.r3": { en: "Live ERNIE calls accepted", zh: "ERNIE 在线实测通过" },
  "card.r4": { en: "Real Olist merchants", zh: "真实 Olist 商家" },
  "card.r5": { en: "Real settlement cases", zh: "真实结算案例" },
  "stat.lines": { en: "real order lines", zh: "条真实订单行" },
  "stat.gmv": { en: "real GMV (BRL)", zh: "真实 GMV（雷亚尔）" },
  "stat.sellers": { en: "real sellers in dataset", zh: "个数据集内真实卖家" },
  "stat.reviews": { en: "real review scores", zh: "条真实评分" },
  "loop.h": { en: "A bounded agent loop", zh: "有界的 Agent 循环" },
  "loop.p": {
    en: "The model is deliberately not the calculator or the policy engine. Every number is reproducible, every cited fact is inspectable, and every money / price / inventory action has a human gate.",
    zh: "模型刻意不做计算器、不做政策引擎。每个数字可复现，每条被引用的事实可检查，每个涉及钱、价格、库存的动作都有人工闸门。",
  },
  "loop.1t": { en: "Plan", zh: "规划" }, "loop.1d": { en: "Select completeness, matching, quality and opportunity checks.", zh: "选择完整性、匹配、质量与机会检查项。" },
  "loop.2t": { en: "Execute tools", zh: "执行工具" }, "loop.2d": { en: "Compute facts with deterministic Python policies.", zh: "用确定性 Python 规则计算事实。" },
  "loop.3t": { en: "Apply policy", zh: "应用政策" }, "loop.3d": { en: "Map facts to a bounded candidate action.", zh: "把事实映射为有界的候选动作。" },
  "loop.4t": { en: "Narrate + verify", zh: "叙述 + 校验" }, "loop.4d": { en: "Accept model prose only when [E#] citations survive verification.", zh: "只有 [E#] 引用通过校验，才接受模型文本。" },
  "loop.5t": { en: "Human gate", zh: "人工闸门" }, "loop.5d": { en: "Approve before money, price or inventory moves.", zh: "钱、价格、库存变动前必须人工批准。" },
  "sec1.h": { en: "The data is real", zh: "数据是真实的" },
  "sec1.p": {
    en: "Everything below runs on the public Olist Brazilian e-commerce dataset (2016-10 ~ 2018-08) plus a carrier-bill pipeline with labeled injected anomalies. Where a field cannot be observed, it is labeled — never silently invented.",
    zh: "以下全部内容运行在公开的巴西电商 Olist 数据集（2016-10 ~ 2018-08）以及带标注注入异常的承运商账单管道之上。观测不到的字段都会打上标签——绝不悄悄编造。",
  },
  "chart.trend.h": { en: "Monthly GMV, whole marketplace", zh: "全平台月度 GMV" },
  "chart.trend.sub": { en: "Real order lines, R$ per month", zh: "真实订单行，按月（雷亚尔）" },
  "chart.cat.h": { en: "Top categories by GMV", zh: "GMV 前十品类" },
  "chart.cat.sub": { en: "Real category totals (EN names from the official translation table)", zh: "真实品类合计（官方翻译表英文名）" },
  "chart.rev.h": { en: "Review score distribution", zh: "评分分布" },
  "chart.rev.sub": { en: "All 99k review scores — ratings in the explorer come from here", zh: "全部约 9.9 万条评分——浏览器里的 rating 由此而来" },
  "chart.anom.h": { en: "Carrier-bill line population", zh: "承运商账单行总体" },
  "chart.anom.sub": { en: "99,485 bill lines with labeled injected anomalies (ground truth for the workbench)", zh: "99,485 条账单行，带标注注入异常（工作台的 ground truth）" },
  "prov.legend": { en: "Field provenance:", zh: "字段来源：" },
  "prov.real": { en: "real — straight from Olist", zh: "真实——直接来自 Olist" },
  "prov.proxy": { en: "proxy — derived, disclosed formula", zh: "代理——推导值，公式已披露" },
  "prov.assumption": { en: "assumption — placeholder, no data exists", zh: "假设——占位值，原数据不存在" },
  "prov.synthetic": { en: "synthetic — deterministic, disclosed", zh: "合成——确定性生成，已披露" },
  "sec2.h": { en: "Growth explorer — 24 real merchants", zh: "经营浏览器——24 个真实商家" },
  "sec2.p": {
    en: "Pick a real Olist seller. The decision queue you see was produced by the repository's Python Growth Agent, not by this page. Two deliberately thin merchants show what honesty looks like: no ranking below the evidence threshold.",
    zh: "选择一个真实的 Olist 卖家。你看到的决策队列由仓库中的 Python Growth Agent 生成，而不是这个网页。两个刻意保留的薄数据商家展示诚实的样子：证据不足就拒绝排名。",
  },
  "explorer.pick": { en: "Merchant", zh: "商家" },
  "explorer.queue": { en: "Decision queue", zh: "决策队列" },
  "explorer.skus": { en: "SKU table (top 8 by GMV)", zh: "SKU 明细（GMV 前 8）" },
  "explorer.gmvshare": { en: "GMV by SKU", zh: "SKU GMV 结构" },
  "noev.t": { en: "Insufficient evidence — no recommendations", zh: "证据不足——不输出任何建议" },
  "sec3.h": { en: "Settlement workbench — 30 real cases", zh: "结算工作台——30 个真实案例" },
  "sec3.p": {
    en: "Real freight amounts, real order statuses, labeled injected anomalies. The agent's classification is checked against the injection ground truth on every case. Approve or reject — your queue persists in this browser.",
    zh: "真实运费金额、真实订单状态、带标注的注入异常。每个案例都用注入的 ground truth 校验 Agent 的分类。批准或驳回——审批队列保存在你的浏览器里。",
  },
  "wb.filter": { en: "Anomaly type", zh: "异常类型" },
  "wb.all": { en: "All types", zh: "全部类型" },
  "wb.cases": { en: "Cases", zh: "案例" },
  "wb.expected": { en: "Expected (SOR)", zh: "应付（SOR）" },
  "wb.billed": { en: "Billed", zh: "账单" },
  "wb.variance": { en: "Variance", zh: "差异" },
  "wb.evidence": { en: "Evidence", zh: "证据" },
  "wb.rationale": { en: "Rationale (verified template)", zh: "决策理由（已验证模板）" },
  "wb.lines": { en: "Invoice lines", zh: "账单行" },
  "wb.truth.ok": { en: "matches injected ground truth", zh: "与注入 ground truth 一致" },
  "wb.truth.info": { en: "injected", zh: "注入类型" },
  "q.pending": { en: "Pending", zh: "待审批" },
  "q.approved": { en: "Approved", zh: "已批准" },
  "q.rejected": { en: "Rejected", zh: "已驳回" },
  "q.reset": { en: "Reset queue", zh: "清空队列" },
  "act.approve": { en: "Approve", zh: "批准" },
  "act.reject": { en: "Reject", zh: "驳回" },
  "act.needs": { en: "human approval required", zh: "须人工审批" },
  "act.auto": { en: "no approval needed", zh: "无须审批" },
  "sec4.h": { en: "Bring your own data", zh: "用你自己的数据" },
  "sec4.p": {
    en: "Drop a CSV and get the same decision queue on your numbers. Everything runs inside this browser tab — nothing is uploaded anywhere. The engine here is a documented JavaScript mirror of the Python package, which remains canonical.",
    zh: "拖入一个 CSV，就能在你的数字上得到同样的决策队列。全部计算发生在这个浏览器标签页内——任何数据都不会被上传。此处引擎是 Python 包的 JS 镜像（已在仓库中说明），Python 版本为权威实现。",
  },
  "byod.note": { en: "<b>Local-only:</b> your file is parsed in memory in this tab. Close the tab and it is gone. No network request carries your data.", zh: "<b>仅限本地：</b>文件只在本标签页内存中解析，关掉页面即消失，没有任何网络请求携带你的数据。" },
  "byod.growth.h": { en: "Merchant SKU CSV → decision queue", zh: "商家 SKU CSV → 决策队列" },
  "byod.growth.d": { en: "Columns: sku, price_band(low|mid|high), gmv, orders, views, rating, margin_rate_assumption, stock_units. Missing views? Leave blank — the band-level proxy fills it (disclosed).", zh: "列：sku, price_band(low|mid|high), gmv, orders, views, rating, margin_rate_assumption, stock_units。没有 views？留空即可——按价格带代理假设补齐（已披露）。" },
  "byod.settle.h": { en: "Invoice CSV → settlement review", zh: "账单 CSV → 结算审查" },
  "byod.settle.d": { en: "Columns: line_id, order_id, billed_amount, expected_amount, delivered(true|false). One case is built across all rows.", zh: "列：line_id, order_id, billed_amount, expected_amount, delivered(true|false)。所有行构成一个案例。" },
  "byod.choose": { en: "Choose / drop CSV", zh: "选择或拖入 CSV" },
  "byod.template": { en: "Download template", zh: "下载模板" },
  "byod.err": { en: "Could not parse that CSV — check the template columns.", zh: "CSV 解析失败——请对照模板列名检查。" },
  "sec5.h": { en: "Method: evals, failure, repair", zh: "方法：评测、失败与修复" },
  "sec5.p": {
    en: "This project treats its own claims like settlement lines: check them, publish the failures, fix the system instead of the score.", zh: "这个项目像对账一样对待自己的每条声称：逐条检查、公开失败、修系统而不是修分数。",
  },
  "m1.h": { en: "First growth eval scored 20/60", zh: "经营评测首轮只有 20/60" },
  "m1.p": { en: "The scenarios mixed tail-stock risk with growth intent. We redesigned the scenarios into four decision intents instead of weakening the policy. Now 200/200 — and the failure is documented, not deleted.", zh: "场景把尾货风险和增长意图混在一起。我们重构场景为四类决策意图，而不是放宽政策。现在 200/200——失败被记录在案，而非删除。" },
  "m2.h": { en: "Live ERNIE calls found a real bug", zh: "ERNIE 在线实测发现了真 bug" },
  "m2.p": { en: "ERNIE writes grouped citations like [E16, E17]; the strict verifier rejected them. Fix: normalize format before verification — every ID still checked. Acceptance went from intermittent to 6/6.", zh: "ERNIE 会写 [E16, E17] 合并引用，严格校验器直接拒绝。修复：校验前做格式归一化——每个 ID 仍逐一核验。接受率从时好时坏变成 6/6。" },
  "m3.h": { en: "Below 30 orders, it says so", zh: "不足 30 单，它会直说" },
  "m3.p": { en: "The Growth Agent refuses to rank SKUs below 30 orders / 500 views and returns an explicit insufficient-evidence decision. Two real thin merchants in the explorer demonstrate it.", zh: "低于 30 单 / 500 浏览时，Growth Agent 拒绝为 SKU 排名，返回明确的“证据不足”决策。浏览器里两个真实薄数据商家演示了这一点。" },
  "m.warn": { en: "<strong>Claim boundary:</strong> this project demonstrates decision mechanics and engineering discipline on real data. It does not claim validated demand, revenue impact or product-market fit — that requires a real pilot.", zh: "<strong>声称边界：</strong>本项目在真实数据上展示决策机制与工程纪律，不声称已验证需求、收入影响或 PMF——那需要真实试点。" },
  "sec6.h": { en: "Research without pretending", zh: "不伪装的用户研究" },
  "sec6.p": { en: "Public behavior records ground the problem. A clearly-labeled synthetic panel generates hypotheses. Neither is called an interview.", zh: "公开用户行为记录用于锚定问题，明确标注的合成面板用于生成假设——两者都不冒充访谈。" },
  "r1.d": { en: "public behavior records with source URLs", zh: "条带来源链接的公开用户行为记录" },
  "r2.d": { en: "synthetic personas — labeled, hypothesis-only", zh: "个合成画像——已标注，仅用于假设" },
  "r3.d": { en: "first-party interviews claimed", zh: "次被声称的第一方访谈" },
  "footer.line": { en: "Zhunming Ma · MIT license · Olist public dataset · Built with deterministic Python, one honest LLM layer, and no invented numbers.", zh: "马准名 · MIT 协议 · Olist 公开数据集 · 由确定性 Python、一层诚实的 LLM 和零编造数字构成。" },
  "tt.month": { en: "month", zh: "月份" },
  "tt.gmv": { en: "GMV", zh: "GMV" },
  "tt.lines": { en: "lines", zh: "行数" },
  "tt.reviews": { en: "reviews", zh: "评论数" },
  "thin.badge": { en: "thin data", zh: "薄数据" },
};

const ACTION_LABEL = {
  SCALE: { en: "SCALE", zh: "扩量" }, IMPROVE: { en: "IMPROVE", zh: "修质量" },
  DELIST_REVIEW: { en: "DELIST REVIEW", zh: "汰换评审" }, TEST_PRICE_UP: { en: "PRICE TEST", zh: "提价实验" },
  PROTECT: { en: "PROTECT", zh: "守成" },
  PAY: { en: "PAY", zh: "付款" }, REJECT: { en: "REJECT", zh: "拒付" }, RECOVER: { en: "RECOVER", zh: "追回" },
  MANUAL_REVIEW: { en: "MANUAL REVIEW", zh: "人工复核" }, REQUEST_INVOICE: { en: "REQUEST INVOICE", zh: "补票" },
};
const CLASS_LABEL = {
  MATCH: { en: "Match", zh: "一致" }, DUPLICATE: { en: "Duplicate", zh: "重复计费" },
  OVERBILLED: { en: "Overbilled", zh: "多收" }, UNDERBILLED: { en: "Underbilled", zh: "少收" },
  MISSING_ORDER: { en: "Ghost order", zh: "幽灵订单" }, NOT_DELIVERED: { en: "Not delivered", zh: "未妥投" },
  NOT_BILLED: { en: "Not billed", zh: "漏开票" }, MIXED_EXCEPTION: { en: "Mixed exception", zh: "复合异常" },
  AMOUNT_MISMATCH: { en: "Amount mismatch", zh: "金额不符" },
};
const PILL_CLASS = { SCALE: "scale", IMPROVE: "improve", DELIST_REVIEW: "delist", TEST_PRICE_UP: "price", PROTECT: "protect" };

let LANG = localStorage.getItem("dops_lang") || (navigator.language || "en").toLowerCase().startsWith("zh") ? (localStorage.getItem("dops_lang") || "zh") : (localStorage.getItem("dops_lang") || "en");
const t = (key) => (I18N[key] ? I18N[key][LANG] : key);
const tl = (map, key) => (map[key] ? map[key][LANG] : key);

function applyI18n() {
  document.documentElement.lang = LANG === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i]").forEach((el) => { el.innerHTML = t(el.dataset.i); });
  document.querySelectorAll(".langsw button").forEach((b) => b.classList.toggle("on", b.dataset.lang === LANG));
}

/* ---------------- helpers ---------------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n, digits = 0) => Number(n).toLocaleString(LANG === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const brl = (n) => "R$ " + (Math.abs(n) >= 1e6 ? fmt(n / 1e6, 1) + "M" : Math.abs(n) >= 1e3 ? fmt(n / 1e3, 0) + "k" : fmt(n, 0));

const tooltip = document.createElement("div");
tooltip.className = "tooltip hidden";
document.body.appendChild(tooltip);
function showTip(html, x, y) {
  tooltip.innerHTML = html;
  tooltip.classList.remove("hidden");
  const w = tooltip.offsetWidth;
  tooltip.style.left = Math.min(x + 14, window.innerWidth - w - 12) + "px";
  tooltip.style.top = y + 16 + "px";
}
const hideTip = () => tooltip.classList.add("hidden");

/* ---------------- charts (single-hue magnitude, thin marks, hover layer) ---------------- */
const INK = "#17251f", GREEN = "#0e6b4f", HAIR = "#d9d2be";

function lineChart(el, points, labelKey, valueKey, valueFmt) {
  const W = 640, H = 260, P = { l: 52, r: 14, t: 14, b: 30 };
  const vmax = Math.max(...points.map((p) => p[valueKey])) * 1.08;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
  const y = (v) => H - P.b - (v / vmax) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[valueKey]).toFixed(1)}`).join("");
  const area = path + `L${x(points.length - 1)},${H - P.b}L${x(0)},${H - P.b}Z`;
  const ticks = 4;
  let grid = "";
  for (let g = 1; g <= ticks; g++) {
    const gv = (vmax / ticks) * g, gy = y(gv);
    grid += `<line class="gridline" x1="${P.l}" y1="${gy}" x2="${W - P.r}" y2="${gy}"/><text x="${P.l - 6}" y="${gy + 3}" text-anchor="end">${brl(gv)}</text>`;
  }
  const xLabels = points.filter((_, i) => i % 3 === 0).map((p) => `<text x="${x(points.indexOf(p))}" y="${H - 8}" text-anchor="middle">${p[labelKey].slice(2)}</text>`).join("");
  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img">
    ${grid}
    <path d="${area}" fill="${GREEN}" opacity=".08"/>
    <path d="${path}" fill="none" stroke="${GREEN}" stroke-width="2"/>
    <line class="xh hidden" y1="${P.t}" y2="${H - P.b}" stroke="${INK}" stroke-dasharray="3 3"/>
    <circle class="xdot hidden" r="4" fill="${GREEN}" stroke="#fff" stroke-width="2"/>
    ${xLabels}
    <rect class="hit" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}" fill="transparent"/>
  </svg>`;
  const svg = el.querySelector("svg"), hit = el.querySelector(".hit"), xh = el.querySelector(".xh"), dot = el.querySelector(".xdot");
  hit.addEventListener("mousemove", (ev) => {
    const box = svg.getBoundingClientRect();
    const px = ((ev.clientX - box.left) / box.width) * W;
    const i = Math.max(0, Math.min(points.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (points.length - 1))));
    const p = points[i];
    xh.setAttribute("x1", x(i)); xh.setAttribute("x2", x(i)); xh.classList.remove("hidden");
    dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(p[valueKey])); dot.classList.remove("hidden");
    showTip(`${esc(p[labelKey])}<br><b>${valueFmt(p[valueKey])}</b>`, ev.clientX, ev.clientY);
  });
  hit.addEventListener("mouseleave", () => { xh.classList.add("hidden"); dot.classList.add("hidden"); hideTip(); });
}

function hbarChart(el, rows, labelKey, valueKey, valueFmt, color = GREEN) {
  const W = 640, rowH = 26, P = { l: 4, r: 70, t: 4, b: 4 };
  const labelW = 168;
  const H = P.t + rows.length * rowH + P.b;
  const vmax = Math.max(...rows.map((r) => r[valueKey]));
  const bw = (v) => Math.max(2, ((W - labelW - P.r) * v) / vmax);
  const bars = rows.map((r, i) => {
    const y = P.t + i * rowH;
    return `<g class="hb" data-i="${i}">
      <text x="${labelW - 8}" y="${y + rowH / 2 + 3}" text-anchor="end" fill="${INK}">${esc(String(r[labelKey]).slice(0, 24))}</text>
      <rect x="${labelW}" y="${y + 5}" width="${bw(r[valueKey]).toFixed(1)}" height="${rowH - 11}" rx="2" fill="${color}"/>
      <text x="${labelW + bw(r[valueKey]) + 7}" y="${y + rowH / 2 + 3}">${valueFmt(r[valueKey])}</text>
      <rect class="hit" x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>
    </g>`;
  }).join("");
  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img">${bars}</svg>`;
  el.querySelectorAll(".hb .hit").forEach((hitEl, i) => {
    hitEl.addEventListener("mousemove", (ev) => showTip(`${esc(rows[i][labelKey])}<br><b>${valueFmt(rows[i][valueKey])}</b>`, ev.clientX, ev.clientY));
    hitEl.addEventListener("mouseleave", hideTip);
  });
}

function colChart(el, rows, labelKey, valueKey, valueFmt, color = GREEN) {
  const W = 640, H = 230, P = { l: 50, r: 10, t: 12, b: 28 };
  const vmax = Math.max(...rows.map((r) => r[valueKey])) * 1.1;
  const bw = (W - P.l - P.r) / rows.length;
  const y = (v) => H - P.b - (v / vmax) * (H - P.t - P.b);
  let grid = "";
  for (let g = 1; g <= 3; g++) {
    const gv = (vmax / 3) * g, gy = y(gv);
    grid += `<line class="gridline" x1="${P.l}" y1="${gy}" x2="${W - P.r}" y2="${gy}"/><text x="${P.l - 6}" y="${gy + 3}" text-anchor="end">${fmt(gv / 1000, 0)}k</text>`;
  }
  const bars = rows.map((r, i) => {
    const bx = P.l + i * bw + bw * 0.18, bwid = bw * 0.64, by = y(r[valueKey]);
    return `<g class="cb" data-i="${i}">
      <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bwid.toFixed(1)}" height="${(H - P.b - by).toFixed(1)}" rx="2" fill="${color}"/>
      <text x="${(bx + bwid / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="${INK}">${esc(String(r[labelKey]))}</text>
      <rect class="hit" x="${(P.l + i * bw).toFixed(1)}" y="${P.t}" width="${bw.toFixed(1)}" height="${H - P.t - P.b}" fill="transparent"/>
    </g>`;
  }).join("");
  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img">${grid}${bars}</svg>`;
  el.querySelectorAll(".cb .hit").forEach((hitEl, i) => {
    hitEl.addEventListener("mousemove", (ev) => showTip(`${esc(rows[i][labelKey])}<br><b>${valueFmt(rows[i][valueKey])}</b>`, ev.clientX, ev.clientY));
    hitEl.addEventListener("mouseleave", hideTip);
  });
}

/* ---------------- approval queue (localStorage) ---------------- */
const QKEY = "dops_queue_v1";
const queue = JSON.parse(localStorage.getItem(QKEY) || "{}");
function setQ(id, status) { queue[id] = status; localStorage.setItem(QKEY, JSON.stringify(queue)); renderQueueStrip(); }
function resetQ() { Object.keys(queue).forEach((k) => delete queue[k]); localStorage.setItem(QKEY, "{}"); renderQueueStrip(); DATA && (renderExplorer(), renderWorkbench()); }
let PENDING_TOTAL = 0;
function renderQueueStrip() {
  const approved = Object.values(queue).filter((v) => v === "approved").length;
  const rejected = Object.values(queue).filter((v) => v === "rejected").length;
  $("#q-approved").textContent = approved;
  $("#q-rejected").textContent = rejected;
  $("#q-pending").textContent = Math.max(0, PENDING_TOTAL - approved - rejected);
}

/* ---------------- data + render ---------------- */
let DATA = null;
let currentMerchant = 0, currentCase = 0, caseFilter = "ALL";

async function boot() {
  applyI18n();
  const [merchants, settlement, overview] = await Promise.all(
    ["data/merchants.json", "data/settlement.json", "data/overview.json"].map((u) => fetch(u).then((r) => r.json()))
  );
  DATA = { merchants, settlement, overview };
  PENDING_TOTAL =
    settlement.cases.filter((c) => c.decision.approval_required).length +
    merchants.merchants.reduce((acc, m) => acc + m.decision.recommendations.filter((r) => r.approval_required).length, 0);
  renderStats(); renderCharts(); renderExplorer(); renderWorkbench(); renderQueueStrip();
}

function renderStats() {
  const tt = DATA.overview.totals;
  $("#stat-lines").textContent = fmt(tt.order_lines);
  $("#stat-gmv").textContent = brl(tt.gmv_brl);
  $("#stat-sellers").textContent = fmt(tt.sellers);
  const reviews = DATA.overview.review_distribution.reduce((a, r) => a + r.count, 0);
  $("#stat-reviews").textContent = fmt(reviews);
}

function renderCharts() {
  lineChart($("#c-trend"), DATA.overview.monthly_gmv, "month", "gmv", brl);
  hbarChart($("#c-cat"), DATA.overview.top_categories.map((c) => ({ ...c, category: c.category.replace(/_/g, " ") })), "category", "gmv", brl);
  colChart($("#c-rev"), DATA.overview.review_distribution.map((r) => ({ ...r, score: "★" + r.score })), "score", "count", (v) => fmt(v) + " " + t("tt.reviews"));
  const anomalies = Object.entries(DATA.settlement.bill_line_population).map(([k, v]) => ({ label: tl(CLASS_LABEL, k), count: v }));
  hbarChart($("#c-anom"), anomalies, "label", "count", (v) => fmt(v) + " " + t("tt.lines"), "#b3402e");
}

/* ---- growth explorer ---- */
function provBadge(field) {
  const status = (DATA.merchants.provenance[field] || {}).status || "real";
  const short = { real: "REAL", proxy: "PROXY", assumption: "ASSUMED", synthetic: "SYNTH", "real+injected": "REAL+" }[status] || status.toUpperCase();
  const cls = status.startsWith("real") ? "real" : status;
  return `<span class="prov ${cls}" title="${esc((DATA.merchants.provenance[field] || {}).note || "")}">${short}</span>`;
}

function renderExplorer() {
  const merchants = DATA.merchants.merchants;
  const list = $("#m-list");
  list.innerHTML = merchants.map((m, i) => {
    const thin = !m.decision.recommendations.length;
    const gmv = m.snapshot.skus.reduce((a, s) => a + s.gmv, 0);
    return `<button data-i="${i}" class="${i === currentMerchant ? "on" : ""}">
      <span>${esc(m.label[LANG])}${thin ? ` <span class="prov synthetic">${t("thin.badge")}</span>` : ""}</span>
      <span class="num mono">${brl(gmv)}</span></button>`;
  }).join("");
  list.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { currentMerchant = +b.dataset.i; renderExplorer(); }));

  const m = merchants[currentMerchant];
  const d = m.decision;
  let queueHtml;
  if (!d.recommendations.length) {
    queueHtml = `<div class="noev"><b>${t("noev.t")}</b>${esc(d.diagnosis)}</div>`;
  } else {
    queueHtml = d.recommendations.map((r) => {
      const key = `g:${m.merchant_id}:${r.sku}`;
      const status = queue[key];
      const evid = d.evidence.filter((e) => r.evidence_ids.includes(e.evidence_id));
      return `<div class="rec" data-key="${esc(key)}">
        <div class="rec-head"><span class="prio num">#${r.priority}</span>
          <span class="sku">${esc(r.sku)}</span>
          <span class="pill ${PILL_CLASS[r.action] || "protect"}">${tl(ACTION_LABEL, r.action)}</span></div>
        <div class="rec-body">
          <p class="rec-exp">${esc(r.experiment)}</p>
          <div class="evrows">${evid.map((e) => `<div><code>[${e.evidence_id}]</code> ${esc(e.fact)} = <b class="num">${esc(fmtVal(e.value))}</b></div>`).join("")}</div>
        </div>
        <div class="rec-actions">${r.approval_required
          ? (status
            ? `<span class="stamp ${status}">${status === "approved" ? t("q.approved") : t("q.rejected")}</span>`
            : `<button class="mini ok">${t("act.approve")}</button><button class="mini no">${t("act.reject")}</button>`)
          : ""}
          <span class="note">${r.approval_required ? t("act.needs") : t("act.auto")}</span></div>
      </div>`;
    }).join("");
  }
  $("#m-queue").innerHTML = queueHtml;
  $("#m-queue").querySelectorAll(".rec").forEach((card) => {
    card.querySelector(".rec-head").addEventListener("click", () => card.classList.toggle("open"));
    const key = card.dataset.key;
    const ok = card.querySelector(".mini.ok"), no = card.querySelector(".mini.no");
    ok && ok.addEventListener("click", (e) => { e.stopPropagation(); setQ(key, "approved"); renderExplorer(); });
    no && no.addEventListener("click", (e) => { e.stopPropagation(); setQ(key, "rejected"); renderExplorer(); });
  });
  if ($("#m-queue .rec")) $("#m-queue .rec").classList.add("open");

  renderSkuTable($("#m-skus"), m.snapshot.skus, true);
  hbarChart($("#m-gmv"), m.snapshot.skus.map((s) => ({ sku: s.sku, gmv: s.gmv })), "sku", "gmv", brl);
  $("#m-meta").textContent = `${m.city} · ${m.snapshot.period}` + (m.rating_fallbacks ? ` · ${m.rating_fallbacks}/8 ratings from seller mean (<3 reviews)` : "");
}

function fmtVal(v) {
  if (typeof v === "number") return Math.abs(v) >= 1000 ? fmt(v) : String(Math.round(v * 10000) / 10000);
  return v === null || v === undefined ? "—" : String(v);
}

function renderSkuTable(el, skus, withProv) {
  const P = withProv ? provBadge : () => "";
  el.innerHTML = `<table class="data"><thead><tr>
    <th>SKU</th><th>GMV${P("gmv")}</th><th>Orders${P("orders")}</th><th>Views${P("views")}</th>
    <th>Rating${P("rating")}</th><th>Margin${P("margin_rate_assumption")}</th><th>Stock${P("stock_units")}</th></tr></thead>
    <tbody>${skus.map((s) => `<tr><td>${esc(s.sku)} <span class="prov real">${s.price_band.toUpperCase()}</span></td>
      <td class="num">${brl(s.gmv)}</td><td class="num">${fmt(s.orders)}</td><td class="num">${fmt(s.views)}</td>
      <td class="num">${s.rating.toFixed(2)}</td><td class="num">${(s.margin_rate_assumption * 100).toFixed(0)}%</td>
      <td class="num">${fmt(s.stock_units)}</td></tr>`).join("")}</tbody></table>`;
}

/* ---- settlement workbench ---- */
function renderWorkbench() {
  const cases = DATA.settlement.cases.filter((c) => caseFilter === "ALL" || c.injected_type === caseFilter);
  if (!cases.length) return;
  if (currentCase >= cases.length) currentCase = 0;
  const list = $("#c-list");
  list.innerHTML = cases.map((c, i) => {
    const status = queue[`s:${c.case.case_id}`];
    return `<button data-i="${i}" class="${i === currentCase ? "on" : ""}">
      <span class="mono">${esc(c.case.case_id)}</span>
      <span>${status ? `<span class="pill ${status === "approved" ? "scale" : "delist"}">${status === "approved" ? "✓" : "✗"}</span>` : ""}
      <span class="pill ${c.decision.risk_level === "high" ? "risk-high" : c.decision.risk_level === "medium" ? "risk-medium" : "risk-low"}">${tl(ACTION_LABEL, c.decision.action)}</span></span></button>`;
  }).join("");
  list.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { currentCase = +b.dataset.i; renderWorkbench(); }));

  const c = cases[currentCase], d = c.decision;
  const truthOk = d.classification === c.injected_type ||
    (c.injected_type === "AMOUNT_MISMATCH" && ["OVERBILLED", "UNDERBILLED"].includes(d.classification));
  const key = `s:${c.case.case_id}`, status = queue[key];
  $("#c-detail").innerHTML = `
    <div class="rec-head" style="cursor:default">
      <span class="sku" style="font-family:var(--disp);font-size:21px">${tl(CLASS_LABEL, d.classification)} → ${tl(ACTION_LABEL, d.action)}</span>
      <span class="pill ${d.risk_level === "high" ? "risk-high" : d.risk_level === "medium" ? "risk-medium" : "risk-low"}">${d.risk_level}</span>
      <span class="prov ${truthOk ? "real" : "synthetic"}" title="${esc(c.injected_type)}">${truthOk ? "✓ " + t("wb.truth.ok") : t("wb.truth.info") + ": " + c.injected_type}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px">
      <div class="metric"><small style="color:var(--muted)">${t("wb.expected")}</small><div class="num" style="font-family:var(--disp);font-size:24px;font-weight:900">R$ ${fmt(d.expected_amount, 2)}</div></div>
      <div class="metric"><small style="color:var(--muted)">${t("wb.billed")}</small><div class="num" style="font-family:var(--disp);font-size:24px;font-weight:900">R$ ${fmt(d.billed_amount, 2)}</div></div>
      <div class="metric"><small style="color:var(--muted)">${t("wb.variance")}</small><div class="num" style="font-family:var(--disp);font-size:24px;font-weight:900;color:${Math.abs(d.variance_amount) > 0.01 ? "var(--verm)" : "var(--green)"}">${d.variance_amount >= 0 ? "+" : ""}R$ ${fmt(d.variance_amount, 2)}</div></div>
    </div>
    <div style="padding:0 16px 8px"><b style="font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">${t("wb.evidence")}</b>
      <div class="evrows" style="margin-top:8px">${d.evidence.map((e) => `<div><code>[${e.evidence_id}]</code> ${esc(e.fact)} = <b class="num">${esc(fmtVal(e.value))}</b></div>`).join("")}</div></div>
    <div style="padding:8px 16px"><b style="font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">${t("wb.rationale")}</b>
      <p style="font-size:13.5px;color:var(--ink2);margin:8px 0 0">${esc(d.rationale)}</p></div>
    <div style="padding:8px 16px 4px"><b style="font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">${t("wb.lines")}</b>
      <table class="data" style="margin-top:8px"><thead><tr><th>line</th><th>order</th><th>billed</th></tr></thead>
      <tbody>${c.case.invoice_lines.map((l) => `<tr><td class="mono">${esc(l.line_id)}</td><td class="mono">${esc(l.order_id.slice(0, 12))}…</td><td class="num">R$ ${fmt(l.billed_amount, 2)}</td></tr>`).join("")}</tbody></table></div>
    <div class="rec-actions">${d.approval_required
      ? (status
        ? `<span class="stamp ${status}">${status === "approved" ? t("q.approved") : t("q.rejected")}</span>`
        : `<button class="mini ok" id="c-ok">${t("act.approve")}</button><button class="mini no" id="c-no">${t("act.reject")}</button>`)
      : ""}
      <span class="note">${d.approval_required ? t("act.needs") : t("act.auto")}</span></div>`;
  const ok = $("#c-ok"), no = $("#c-no");
  ok && ok.addEventListener("click", () => { setQ(key, "approved"); renderWorkbench(); });
  no && no.addEventListener("click", () => { setQ(key, "rejected"); renderWorkbench(); });
}

/* ---------------- BYOD: JS mirror of src/decisionops (Python is canonical) ---------------- */
const CONV = { low: 0.04, mid: 0.03, high: 0.02 };
function median(arr) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

function growthEngine(skus) {
  const totalOrders = skus.reduce((a, s) => a + s.orders, 0);
  const totalViews = skus.reduce((a, s) => a + s.views, 0);
  if (totalOrders < 30 || totalViews < 500) {
    return { insufficient: true, totalOrders, totalViews, recommendations: [], evidence: [] };
  }
  const totalGmv = skus.reduce((a, s) => a + s.gmv, 0) || 1;
  const conversions = skus.map((s) => (s.views > 0 ? s.orders / s.views : 0));
  const medConv = median(conversions), medGmv = median(skus.map((s) => s.gmv));
  const evidence = [], cands = [];
  skus.forEach((s) => {
    const conv = s.views > 0 ? s.orders / s.views : 0;
    const share = s.gmv / totalGmv;
    const stockPressure = s.stock_units / Math.max(s.orders, 1);
    const ids = [];
    [[`${s.sku} GMV share`, +share.toFixed(4)], [`${s.sku} conversion`, +conv.toFixed(4)], [`${s.sku} rating`, s.rating],
     [`${s.sku} assumed margin rate`, s.margin_rate_assumption], [`${s.sku} stock per order`, +stockPressure.toFixed(2)]]
      .forEach(([fact, value]) => { const id = `E${evidence.length + 1}`; evidence.push({ evidence_id: id, fact, value }); ids.push(id); });
    let action, dir, score, exp, approval;
    if (s.rating < 3.5) { action = "IMPROVE"; dir = "quality"; score = 100 + s.gmv; exp = "Review recent complaints; fix the dominant quality issue before adding traffic."; approval = false; }
    else if (s.orders === 0 || (s.gmv < medGmv * 0.35 && stockPressure > 6)) { action = "DELIST_REVIEW"; dir = "cash_release"; score = 90 + stockPressure; exp = "Pause replenishment for 14 days; review substitution and liquidation options before delisting."; approval = true; }
    else if (s.rating >= 4.5 && conv >= medConv && share >= 0.12) { action = "SCALE"; dir = "growth"; score = 80 + share * 100 + conv * 100; exp = "Increase qualified traffic by 15% with a matched holdout; stop if return or complaint rate worsens."; approval = true; }
    else if (s.margin_rate_assumption >= 0.35 && s.rating >= 4.2) { action = "TEST_PRICE_UP"; dir = "margin"; score = 70 + s.margin_rate_assumption * 100; exp = "Run a +3% price test against a holdout; measure conversion and contribution margin, not GMV alone."; approval = true; }
    else { action = "PROTECT"; dir = "growth"; score = 40 + share * 100; exp = "Hold price and inventory policy; monitor conversion and rating weekly."; approval = false; }
    cands.push([score, { sku: s.sku, action, priority: 1, expected_direction: dir, experiment: exp, approval_required: approval, evidence_ids: ids }]);
  });
  cands.sort((a, b) => b[0] - a[0]);
  const recs = cands.slice(0, 5).map(([, r], i) => ({ ...r, priority: i + 1 }));
  return { insufficient: false, recommendations: recs, evidence };
}

const PRECEDENCE = { PAY: 0, REQUEST_INVOICE: 1, MANUAL_REVIEW: 2, RECOVER: 3, REJECT: 4 };
function settlementEngine(lines, tolerancePct = 0.02) {
  const orders = {};
  lines.forEach((l) => { if (l.expected_amount !== null && !(l.order_id in orders)) orders[l.order_id] = { expected: l.expected_amount, delivered: l.delivered }; });
  const byOrder = {};
  lines.forEach((l) => (byOrder[l.order_id] = byOrder[l.order_id] || []).push(l));
  const classifications = [], evidence = [];
  const ev = (fact, value) => evidence.push({ evidence_id: `E${evidence.length + 1}`, fact, value });
  Object.entries(byOrder).forEach(([oid, ols]) => {
    const order = orders[oid];
    const billed = +ols.reduce((a, l) => a + l.billed_amount, 0).toFixed(2);
    if (!order) { classifications.push("MISSING_ORDER"); ev(`Invoice references unknown order ${oid}`, billed); return; }
    if (ols.length > 1) { classifications.push("DUPLICATE"); ev(`Order ${oid} appears on ${ols.length} invoice lines`, billed); }
    if (!order.delivered) { classifications.push("NOT_DELIVERED"); ev(`Order ${oid} has no completed delivery`, false); }
    const variance = billed - order.expected;
    const tol = order.expected * tolerancePct;
    if (ols.length === 1 && order.delivered) {
      classifications.push(variance > tol ? "OVERBILLED" : variance < -tol ? "UNDERBILLED" : "MATCH");
    }
    ev(`Order ${oid}: billed minus expected`, +variance.toFixed(2));
  });
  if (!classifications.length) classifications.push("MATCH");
  const unique = new Set(classifications), nonMatch = new Set([...unique].filter((c) => c !== "MATCH"));
  let classification, action;
  if (!nonMatch.size) { classification = "MATCH"; action = "PAY"; }
  else {
    const actions = [];
    if (["MISSING_ORDER", "NOT_DELIVERED", "DUPLICATE"].some((k) => unique.has(k))) actions.push("REJECT");
    if (unique.has("OVERBILLED")) actions.push("RECOVER");
    if (unique.has("UNDERBILLED")) actions.push("MANUAL_REVIEW");
    action = actions.sort((a, b) => PRECEDENCE[b] - PRECEDENCE[a])[0] || "MANUAL_REVIEW";
    classification = nonMatch.size === 1 ? [...nonMatch][0] : "MIXED_EXCEPTION";
  }
  const expectedTotal = +Object.values(orders).reduce((a, o) => a + o.expected, 0).toFixed(2);
  const billedTotal = +lines.reduce((a, l) => a + l.billed_amount, 0).toFixed(2);
  return { classification, action, approval_required: action !== "PAY", expected: expectedTotal, billed: billedTotal, variance: +(billedTotal - expectedTotal).toFixed(2), evidence };
}

/* ---- CSV plumbing ---- */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch; }
    else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (cell !== "" || row.length) { row.push(cell); rows.push(row); row = []; cell = ""; } if (ch === "\r" && text[i + 1] === "\n") i++; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((c) => c.trim() !== "")).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || "").trim()])));
}

const GROWTH_TEMPLATE = `sku,price_band,gmv,orders,views,rating,margin_rate_assumption,stock_units
HERO-001,high,50000,700,12000,4.8,0.38,600
BASE-002,mid,18000,350,11000,4.0,0.25,700
TAIL-003,low,800,12,900,3.9,0.12,400
`;
const SETTLE_TEMPLATE = `line_id,order_id,billed_amount,expected_amount,delivered
L1,ORD-1001,101.00,100.00,true
L2,ORD-1002,80.00,80.00,true
L3,ORD-1002,80.00,80.00,true
L4,ORD-2001,240.00,,true
`;

function download(name, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

function wireDrop(dropEl, inputEl, handler) {
  dropEl.addEventListener("click", () => inputEl.click());
  inputEl.addEventListener("change", () => inputEl.files[0] && readFile(inputEl.files[0], handler));
  ["dragover", "dragenter"].forEach((evName) => dropEl.addEventListener(evName, (e) => { e.preventDefault(); dropEl.classList.add("hover"); }));
  ["dragleave", "drop"].forEach((evName) => dropEl.addEventListener(evName, (e) => { e.preventDefault(); dropEl.classList.remove("hover"); }));
  dropEl.addEventListener("drop", (e) => e.dataTransfer.files[0] && readFile(e.dataTransfer.files[0], handler));
}
function readFile(file, handler) {
  const reader = new FileReader();
  reader.onload = () => handler(String(reader.result));
  reader.readAsText(file);
}

function handleGrowthCsv(text) {
  const out = $("#byod-growth-out");
  try {
    const rows = parseCsv(text);
    const skus = rows.map((r) => {
      const band = ["low", "mid", "high"].includes(r.price_band) ? r.price_band : "mid";
      const orders = Math.max(0, Math.round(+r.orders || 0));
      return {
        sku: r.sku || "SKU", price_band: band, gmv: +r.gmv || 0, orders,
        views: r.views !== "" && r.views !== undefined ? Math.round(+r.views) : Math.round(orders / CONV[band]),
        rating: Math.min(5, Math.max(0, +r.rating || 0)),
        margin_rate_assumption: Math.min(1, Math.max(0, +r.margin_rate_assumption || 0)),
        stock_units: Math.max(0, Math.round(+r.stock_units || 0)),
      };
    });
    if (!skus.length) throw new Error("empty");
    const result = growthEngine(skus);
    if (result.insufficient) {
      out.innerHTML = `<div class="noev"><b>${t("noev.t")}</b>${result.totalOrders} orders / ${result.totalViews} views &lt; 30 / 500.</div>`;
      return;
    }
    out.innerHTML = result.recommendations.map((r) => {
      const evid = result.evidence.filter((e) => r.evidence_ids.includes(e.evidence_id));
      return `<div class="rec open"><div class="rec-head" style="cursor:default"><span class="prio num">#${r.priority}</span>
        <span class="sku">${esc(r.sku)}</span><span class="pill ${PILL_CLASS[r.action]}">${tl(ACTION_LABEL, r.action)}</span></div>
        <div class="rec-body" style="display:block"><p class="rec-exp">${esc(r.experiment)}</p>
        <div class="evrows">${evid.map((e) => `<div><code>[${e.evidence_id}]</code> ${esc(e.fact)} = <b class="num">${esc(fmtVal(e.value))}</b></div>`).join("")}</div></div>
        <div class="rec-actions"><span class="note">${r.approval_required ? t("act.needs") : t("act.auto")}</span></div></div>`;
    }).join("");
  } catch (err) { out.innerHTML = `<div class="noev"><b>⚠</b> ${t("byod.err")}</div>`; }
}

function handleSettleCsv(text) {
  const out = $("#byod-settle-out");
  try {
    const rows = parseCsv(text);
    const lines = rows.map((r) => ({
      line_id: r.line_id || "L?", order_id: r.order_id || "?",
      billed_amount: +r.billed_amount || 0,
      expected_amount: r.expected_amount === "" || r.expected_amount === undefined ? null : +r.expected_amount,
      delivered: String(r.delivered).toLowerCase() !== "false",
    }));
    if (!lines.length) throw new Error("empty");
    const d = settlementEngine(lines);
    out.innerHTML = `<div class="rec open"><div class="rec-head" style="cursor:default">
      <span class="sku" style="font-family:var(--disp);font-size:20px">${tl(CLASS_LABEL, d.classification)} → ${tl(ACTION_LABEL, d.action)}</span>
      <span class="pill ${d.action === "PAY" ? "risk-low" : "risk-high"}">${d.action === "PAY" ? "low" : "high"}</span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px 16px">
        <div><small style="color:var(--muted)">${t("wb.expected")}</small><div class="num" style="font-family:var(--disp);font-size:22px;font-weight:900">${fmt(d.expected, 2)}</div></div>
        <div><small style="color:var(--muted)">${t("wb.billed")}</small><div class="num" style="font-family:var(--disp);font-size:22px;font-weight:900">${fmt(d.billed, 2)}</div></div>
        <div><small style="color:var(--muted)">${t("wb.variance")}</small><div class="num" style="font-family:var(--disp);font-size:22px;font-weight:900;color:${Math.abs(d.variance) > 0.01 ? "var(--verm)" : "var(--green)"}">${d.variance >= 0 ? "+" : ""}${fmt(d.variance, 2)}</div></div></div>
      <div style="padding:0 16px 14px"><div class="evrows">${d.evidence.map((e) => `<div><code>[${e.evidence_id}]</code> ${esc(e.fact)} = <b class="num">${esc(fmtVal(e.value))}</b></div>`).join("")}</div></div>
      <div class="rec-actions"><span class="note">${d.approval_required ? t("act.needs") : t("act.auto")}</span></div></div>`;
  } catch (err) { out.innerHTML = `<div class="noev"><b>⚠</b> ${t("byod.err")}</div>`; }
}

/* ---------------- wiring ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".langsw button").forEach((b) =>
    b.addEventListener("click", () => { LANG = b.dataset.lang; localStorage.setItem("dops_lang", LANG); applyI18n(); if (DATA) { renderCharts(); renderExplorer(); renderWorkbench(); } }));
  $("#c-filter").addEventListener("change", (e) => { caseFilter = e.target.value; currentCase = 0; renderWorkbench(); });
  $("#q-reset").addEventListener("click", resetQ);
  wireDrop($("#drop-growth"), $("#file-growth"), handleGrowthCsv);
  wireDrop($("#drop-settle"), $("#file-settle"), handleSettleCsv);
  $("#tpl-growth").addEventListener("click", () => download("decisionops_growth_template.csv", GROWTH_TEMPLATE));
  $("#tpl-settle").addEventListener("click", () => download("decisionops_settlement_template.csv", SETTLE_TEMPLATE));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("in")), { threshold: 0.08 });
  document.querySelectorAll(".rv").forEach((el) => io.observe(el));
  boot().catch((err) => { console.error("boot failed", err); });
});
