/* Self-paced course pages (business-course.html).

   Every lesson is already in the HTML, so with no JS the page reads as one
   long course. This script turns it into an overview (#lessons) plus one
   lesson at a time (#lesson-N), grades each lesson's quiz, and keeps
   progress in localStorage. Nothing leaves the browser.

   Markup contract (see README, "Courses"):
     [data-course="id"]            wrapper; id namespaces the storage key
     [data-course-home]            overview section, shown when no lesson is open
     [data-course-lessons]         section holding every article.lesson
     article.lesson[data-lesson]   one lesson; form[data-quiz] inside it
     fieldset.quiz-q[data-answer]  one question, answer letter A-D
     .lesson-tool[data-tool]       a calculator, see TOOLS below
     [data-course-card="N"]        overview card for lesson N
     [data-course-progress], [data-course-done], [data-course-reset]
*/
(() => {
  "use strict";
  const root = document.querySelector("[data-course]");
  if (!root) return;

  const PASS = 4;
  const KEY = `able.course.${root.dataset.course}.v1`;
  const home = root.querySelector("[data-course-home]");
  const lessonsWrap = root.querySelector("[data-course-lessons]");
  const lessons = [...root.querySelectorAll("article.lesson[data-lesson]")];
  const total = lessons.length;

  // ---------- progress ----------
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { passed: {}, best: {} }; }
    catch (e) { return { passed: {}, best: {} }; }
  };
  let state = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: this visit only */ }
  };

  const renderProgress = () => {
    const done = lessons.filter((l) => state.passed[l.dataset.lesson]).length;
    root.querySelectorAll("[data-course-progress]").forEach((el) => {
      el.hidden = false;
      const bar = el.querySelector("span");
      if (bar) bar.style.width = `${(done / total) * 100}%`;
      const n = el.querySelector("[data-done]");
      if (n) n.textContent = done;
    });
    root.querySelectorAll("[data-course-card]").forEach((card) => {
      const id = card.dataset.courseCard;
      const passed = !!state.passed[id];
      card.classList.toggle("is-done", passed);
      const status = card.querySelector(".course-status");
      if (status) status.textContent = passed ? "Completed ✓" : state.best[id] != null ? `Best ${state.best[id]}/5` : "Not started";
    });
    const start = root.querySelector("[data-course-start]");
    if (start) {
      const next = lessons.find((l) => !state.passed[l.dataset.lesson]);
      if (done === 0) { start.textContent = "Start lesson 1"; start.href = "#lesson-1"; }
      else if (next) { start.textContent = `Continue: lesson ${next.dataset.lesson}`; start.href = `#lesson-${next.dataset.lesson}`; }
      else { start.textContent = "Review the lessons"; start.href = "#lessons"; }
    }
    const finished = root.querySelector("[data-course-done]");
    if (finished) finished.hidden = done < total;
    // The date on the certificate is the day the last lesson was first
    // passed, so re-taking a quiz later doesn't change it.
    if (done === total && !state.completedAt) { state.completedAt = Date.now(); save(); }
    renderCert(done);
  };

  // ---------- certificate ----------
  // Drawn on a canvas so it can be saved as an image or printed as-is. The
  // name is only ever drawn as canvas text, never inserted as HTML.
  const cert = root.querySelector("[data-course-cert]");
  const q = (sel) => cert && cert.querySelector(sel);
  const locked = q("[data-cert-locked]"), ready = q("[data-cert-ready]");
  const form = q("[data-cert-form]"), nameIn = q("[data-cert-name]");
  const preview = q("[data-cert-preview]"), img = q("[data-cert-img]");
  const actions = q("[data-cert-actions]"), dl = q("[data-cert-download]");
  let certURL = null;

  function renderCert(done) {
    if (!cert) return;
    cert.hidden = false;
    const complete = done === total;
    locked.hidden = complete;
    ready.hidden = !complete;
    const left = q("[data-cert-left]");
    if (left) left.textContent = `${total - done} lesson${total - done === 1 ? "" : "s"}`;
    if (complete && state.name && nameIn && !nameIn.value) nameIn.value = state.name;
  }

  const loadImg = (src) => new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });

  const drawCert = async (name) => {
    const W = 2000, H = 1414;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    const GREEN = "#177814", DEEP = "#125D0F", GOLD = "#E6B33F", INK = "#14143A", MUTED = "#5F6388";
    const SANS = '"Outfit", "Segoe UI", Arial, sans-serif', SERIF = '"Libre Baskerville", Georgia, serif';
    try {
      await Promise.all([`800 90px ${SANS}`, `600 40px ${SANS}`, `400 30px ${SANS}`, `italic 400 40px ${SERIF}`].map((f) => document.fonts.load(f)));
    } catch (e) { /* fall back to system fonts */ }
    const [able, biz] = await Promise.all([loadImg("assets/images/logos/logo-main.png"), loadImg("assets/images/logos/logo-business.png")]);

    // Paper, a deep-green swoosh in two corners, then the frame.
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, W, H);
    // The swooshes are clipped to the inside of the frame.
    x.save();
    x.beginPath(); x.rect(57, 57, W - 114, H - 114); x.clip();
    x.fillStyle = "#EEF8EC";
    x.beginPath(); x.ellipse(W - 40, 20, 520, 340, -0.35, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(40, H - 20, 520, 340, -0.35, 0, Math.PI * 2); x.fill();
    x.restore();
    x.lineWidth = 22; x.strokeStyle = GREEN; x.strokeRect(46, 46, W - 92, H - 92);
    x.lineWidth = 4; x.strokeStyle = GOLD; x.strokeRect(84, 84, W - 168, H - 168);

    const center = (text, y, font, color, maxW) => {
      x.font = font; x.fillStyle = color; x.textAlign = "center"; x.textBaseline = "alphabetic";
      x.fillText(text, W / 2, y, maxW);
    };
    const spaced = (text, y, font, color, gap) => {
      x.font = font; x.fillStyle = color; x.textAlign = "left";
      const chars = [...text];
      const width = chars.reduce((w, ch) => w + x.measureText(ch).width, 0) + gap * (chars.length - 1);
      let cx = W / 2 - width / 2;
      chars.forEach((ch) => { x.fillText(ch, cx, y); cx += x.measureText(ch).width + gap; });
    };

    if (biz) x.drawImage(biz, W / 2 - 88, 150, 176, 176 * biz.height / biz.width);
    spaced("ABLE INITIATIVES  ·  ABLE BUSINESS", 400, `700 26px ${SANS}`, GREEN, 6);
    center("Certificate of Completion", 510, `800 96px ${SANS}`, INK);
    center("This certifies that", 600, `italic 400 38px ${SERIF}`, MUTED);

    // The name: as large as fits, up to 104px, on a gold rule.
    let size = 104;
    x.font = `italic 400 ${size}px ${SERIF}`;
    while (x.measureText(name).width > 1440 && size > 44) { size -= 4; x.font = `italic 400 ${size}px ${SERIF}`; }
    const ruleW = Math.min(1560, Math.max(1120, x.measureText(name).width + 120));
    center(name, 735, x.font, DEEP);
    x.fillStyle = GOLD; x.fillRect(W / 2 - ruleW / 2, 770, ruleW, 4);

    center("has completed the free, self-paced course", 850, `400 34px ${SANS}`, MUTED);
    center("Money & Business Foundations", 945, `800 72px ${SANS}`, GREEN);
    center("Budgeting  ·  Paychecks and taxes  ·  Saving and investing", 1020, `400 28px ${SANS}`, INK);
    center("Credit and debt  ·  How a business makes money  ·  Starting something, and careers in business", 1062, `400 28px ${SANS}`, INK);
    center("Awarded for passing all six lesson quizzes.", 1118, `italic 400 26px ${SERIF}`, MUTED);

    // Footer: date left, ABLE mark centre, where right.
    const date = new Date(state.completedAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const foot = (label, value, cx) => {
      x.textAlign = "center";
      x.fillStyle = INK; x.font = `600 32px ${SANS}`; x.fillText(value, cx, 1232);
      x.fillStyle = "#C9C8CF"; x.fillRect(cx - 250, 1250, 500, 2);
      x.fillStyle = MUTED; x.font = `400 22px ${SANS}`; x.fillText(label, cx, 1284);
    };
    foot("Date completed", date, 470);
    foot("Online at", "ableinitiatives.com/business-course.html", W - 470);
    if (able) {
      x.fillStyle = "#FFFFFF"; x.beginPath(); x.arc(W / 2, 1230, 86, 0, Math.PI * 2); x.fill();
      x.lineWidth = 3; x.strokeStyle = GREEN; x.stroke();
      const s = 120; x.drawImage(able, W / 2 - s / 2, 1230 - (s * able.height / able.width) / 2, s, s * able.height / able.width);
    }
    return c;
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameIn.value.replace(/\s+/g, " ").trim().slice(0, 60);
      if (!name) { nameIn.focus(); return; }
      state.name = name;
      save();
      const c = await drawCert(name);
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      if (certURL) URL.revokeObjectURL(certURL);
      certURL = URL.createObjectURL(blob);
      img.src = certURL;
      img.alt = `Certificate of completion for ${name}, Money & Business Foundations, ABLE Business`;
      dl.href = certURL;
      dl.download = `ABLE-Money-and-Business-certificate-${name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student"}.png`;
      preview.hidden = false;
      actions.hidden = false;
      preview.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  // Print just the certificate, landscape, edge to edge.
  q("[data-cert-print]")?.addEventListener("click", () => {
    if (!certURL) return;
    const sheet = document.createElement("img");
    sheet.className = "cert-print-sheet";
    sheet.src = certURL;
    sheet.alt = "";
    const page = document.createElement("style");
    page.textContent = "@page { size: landscape; margin: 0; }";
    document.head.append(page);
    document.body.append(sheet);
    document.body.classList.add("is-printing-cert");
    const done = () => {
      document.body.classList.remove("is-printing-cert");
      sheet.remove();
      page.remove();
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    const go = () => window.print();
    if (sheet.complete) go(); else sheet.onload = go;
  });

  // ---------- routing: overview or one lesson ----------
  const show = (scroll) => {
    const m = /^#lesson-(\d+)$/.exec(location.hash);
    const current = m && lessons.find((l) => l.dataset.lesson === m[1]);
    if (current) {
      home.hidden = true;
      lessonsWrap.hidden = false;
      lessons.forEach((l) => { l.hidden = l !== current; });
      if (scroll) current.scrollIntoView({ block: "start" });
    } else {
      home.hidden = false;
      lessonsWrap.hidden = true;
      if (scroll && location.hash === "#lessons") home.scrollIntoView({ block: "start" });
      if (scroll && location.hash === "#certificate") cert?.scrollIntoView({ block: "start" });
    }
  };
  root.classList.add("course-ready");
  window.addEventListener("hashchange", () => show(true));
  show(!!location.hash);

  // ---------- quizzes ----------
  lessons.forEach((lesson) => {
    const form = lesson.querySelector("form[data-quiz]");
    if (!form) return;
    const id = lesson.dataset.lesson;
    const qs = [...form.querySelectorAll("fieldset.quiz-q")];
    const result = form.querySelector(".quiz-result");

    const clear = (q) => {
      q.classList.remove("is-right", "is-wrong", "is-missing");
      q.querySelectorAll("label").forEach((l) => l.classList.remove("is-answer", "is-picked-wrong"));
    };
    qs.forEach((q) => q.addEventListener("change", () => clear(q)));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const missing = qs.filter((q) => !q.querySelector("input:checked"));
      qs.forEach(clear);
      if (missing.length) {
        missing.forEach((q) => q.classList.add("is-missing"));
        result.className = "quiz-result is-fail";
        result.textContent = `Answer all ${qs.length} questions first (${missing.length} left).`;
        missing[0].scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      let score = 0;
      qs.forEach((q) => {
        const picked = q.querySelector("input:checked");
        const right = picked.value === q.dataset.answer;
        if (right) score++;
        q.classList.add(right ? "is-right" : "is-wrong");
        q.querySelectorAll("input").forEach((input) => {
          if (input.value === q.dataset.answer) input.closest("label").classList.add("is-answer");
          else if (input === picked) input.closest("label").classList.add("is-picked-wrong");
        });
      });
      state.best[id] = Math.max(score, state.best[id] || 0);
      if (score >= PASS) state.passed[id] = true;
      save();
      renderProgress();
      const n = qs.length;
      if (score >= PASS) {
        const next = lessons[lessons.indexOf(lesson) + 1];
        result.className = "quiz-result is-pass";
        result.textContent = `${score} of ${n} — lesson complete!` + (next ? " On to the next one." : "");
        if (!next && lessons.every((l) => state.passed[l.dataset.lesson])) {
          result.append(" That's the whole course. ");
          const link = document.createElement("a");
          link.href = "#certificate";
          link.textContent = "Get your certificate →";
          result.append(link);
        }
      } else {
        result.className = "quiz-result is-fail";
        result.textContent = `${score} of ${n}. Read the explanations, change your answers and check again. You need ${PASS} to complete the lesson.`;
      }
    });
  });

  root.querySelectorAll("[data-course-reset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!window.confirm("Clear your progress on this course?")) return;
      state = { passed: {}, best: {} };
      if (preview) preview.hidden = true;
      if (actions) actions.hidden = true;
      save();
      renderProgress();
    });
  });

  // ---------- calculators ----------
  const money = (x) => (x < 0 ? "−" : "") + "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (el) => { const v = parseFloat(el.value); return Number.isFinite(v) && v >= 0 ? v : 0; };

  const TOOLS = {
    budget(v, out) {
      out.needs = money(v.income * 0.5);
      out.wants = money(v.income * 0.3);
      out.savings = money(v.income * 0.2);
    },
    paycheck(v, out) {
      const gross = v.wage * v.hours * 2;
      const ss = gross * 0.062, medicare = gross * 0.0145, tax = gross * (v.withholding / 100);
      out.gross = money(gross);
      out.ss = money(ss);
      out.medicare = money(medicare);
      out.tax = money(tax);
      out.net = money(gross - ss - medicare - tax);
    },
    compound(v, out) {
      // Monthly compounding; each contribution lands at the end of its month.
      const r = v.rate / 100 / 12, months = Math.round(v.years * 12);
      let bal = v.start;
      for (let i = 0; i < months; i++) bal = bal * (1 + r) + v.monthly;
      const put = v.start + v.monthly * months;
      out.balance = money(bal);
      out.contributed = money(put);
      out.growth = money(bal - put);
    },
    payoff(v, out) {
      // Fixed payment every month, no new charges, interest = APR / 12 on the
      // balance, rounded to the cent (the method lesson 4's table uses).
      const r = v.apr / 100 / 12;
      let bal = v.balance, months = 0, interest = 0;
      if (bal > 0 && v.payment <= bal * r) return { warn: "This payment doesn't even cover the monthly interest, so the balance never goes down." };
      if (bal > 0 && v.payment <= 0) return { warn: "Enter a monthly payment." };
      while (bal > 0.005 && months < 1200) {
        const i = Math.round(bal * r * 100) / 100;
        interest += i;
        bal = bal + i - Math.min(v.payment, bal + i);
        months++;
      }
      out.months = months >= 1200 ? "100+ years" : `${months} month${months === 1 ? "" : "s"}` + (months >= 12 ? ` (${(months / 12).toFixed(1)} yrs)` : "");
      out.interest = money(interest);
      out.paid = money(v.balance + interest);
    },
    breakeven(v, out) {
      const margin = v.price - v.cost;
      out.margin = money(margin);
      if (margin <= 0) return { warn: "Each sale loses money (or makes none), so no number of sales will cover the fixed costs. Raise the price or cut the cost per unit." };
      out.units = `${Math.ceil(v.fixed / margin - 1e-9)} units`;
      out.revenue = money(Math.ceil(v.fixed / margin - 1e-9) * v.price);
    },
  };

  root.querySelectorAll(".lesson-tool[data-tool]").forEach((tool) => {
    const fn = TOOLS[tool.dataset.tool];
    if (!fn) return;
    const inputs = [...tool.querySelectorAll("[data-in]")];
    const warn = tool.querySelector(".tool-warn");
    const run = () => {
      const v = {};
      inputs.forEach((el) => { v[el.dataset.in] = num(el); });
      const out = {};
      const res = fn(v, out) || {};
      tool.querySelectorAll("[data-out]").forEach((el) => {
        el.textContent = res.warn && !(el.dataset.out in out) ? "—" : out[el.dataset.out] ?? "—";
      });
      if (warn) { warn.hidden = !res.warn; warn.textContent = res.warn || ""; }
    };
    inputs.forEach((el) => el.addEventListener("input", run));
    run();
  });

  renderProgress();
})();
