/* ============================================================
   Personal site — interactions
   ============================================================ */

(async () => {
  "use strict";

  // Mark JS as booted so .reveal animations can run. If this script never
  // runs (e.g. a failed script load), content stays visible instead of blank.
  document.documentElement.classList.add("js-animate");

  /* ---------- Theme ---------- */
  const themeToggle = document.getElementById("theme-toggle");
  const root = document.documentElement;

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    themeToggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });

  // Initialise from storage / system preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  /* ---------- Navigation: scroll state ---------- */
  const nav = document.querySelector(".nav");
  const toTop = document.getElementById("to-top");

  const onScroll = () => {
    const scrolled = window.scrollY > 12;
    nav.classList.toggle("is-scrolled", scrolled);
    toTop.classList.toggle("is-visible", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("nav-burger");
  const menu = document.getElementById("nav-menu");

  const closeMenu = () => {
    menu.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  };

  burger.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    burger.classList.toggle("is-open", isOpen);
    burger.setAttribute("aria-expanded", String(isOpen));
  });

  // Close after clicking a link
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", closeMenu)
  );

  // Close when resizing up to desktop
  window.matchMedia("(min-width: 721px)").addEventListener("change", (e) => {
    if (e.matches) closeMenu();
  });

  /* ---------- Active nav link on scroll ---------- */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav__link");

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === `#${id}`
      );
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Contact form (opens email client via mailto) ---------- */
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      note.textContent = "Please fill in every field before sending.";
      note.className = "form__note is-error";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      note.textContent = "Please enter a valid email address.";
      note.className = "form__note is-error";
      return;
    }

    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:hello@siyechen.dev?subject=${subject}&body=${body}`;

    note.textContent = "Opening your email app… thanks for reaching out!";
    note.className = "form__note is-success";
    form.reset();
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Projects: To-do planner ---------- */
  const todoForm = document.getElementById("todo-form");
  // On pages without the planner, stop here so shared features above keep working.
  if (!todoForm) return;
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");
  const todoEmpty = document.getElementById("todo-empty");
  const todoDateLabel = document.getElementById("todo-date");
  const todoCount = document.getElementById("todo-count");
  const todoSearch = document.getElementById("todo-search");
  const calGrid = document.getElementById("cal-grid");
  const calTitle = document.getElementById("cal-title");
  const calPrev = document.getElementById("cal-prev");
  const calNext = document.getElementById("cal-next");
  const emojiPicker = document.getElementById("emoji-picker");
  const priPicker = document.getElementById("pri-picker");

  const META_KEY = "projects-todo-meta"; // localStorage overlay: id -> { emoji, pri }
  const LS_TASKS_KEY = "projects-todo";   // localStorage fallback when Supabase is unavailable
  const SUPA_URL = "https://qsqwblmuwkpfwpfjzpvm.supabase.co";
  const SUPA_KEY = "sb_publishable_3CAt-OgwxHoXW96xJkdO-Q_a0cv8KO8";
  // Use the UMD global if the CDN script loaded; otherwise fall back to localStorage.
  const sb =
    typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function"
      ? window.supabase.createClient(SUPA_URL, SUPA_KEY)
      : null;
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  const X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const PRI_RANK = { high: 0, medium: 1, low: 2 };
  const PRI_LABEL = { low: "Low", medium: "Med", high: "High" };

  // tasks: [{ id, date, text, done, emoji, pri }]
  let tasks = [];
  let meta = {};
  try { meta = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { meta = {}; }
  function saveMeta() { localStorage.setItem(META_KEY, JSON.stringify(meta)); }

  const todoStatus = document.getElementById("todo-status");
  let statusTimer = null;
  function reportError(msg) {
    if (!todoStatus) return;
    todoStatus.textContent = msg;
    todoStatus.classList.add("is-error");
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      todoStatus.textContent = "";
      todoStatus.classList.remove("is-error");
    }, 3500);
  }

  // Normalize a stored object (Supabase row or local task) into an in-memory task
  function toTask(r) {
    const m = meta[r.id] || {};
    return {
      id: r.id,
      text: r.task != null ? r.task : (r.text || ""),
      done: r.is_complete != null ? !!r.is_complete : !!r.done,
      date: r.date || toKey(today),
      emoji: m.emoji || "",
      pri: PRI_RANK[m.pri] != null ? m.pri : "low",
    };
  }

  function loadLocalTasks() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_TASKS_KEY)) || [];
      return raw.map(toTask).sort((a, b) => a.id - b.id);
    } catch (e) { return []; }
  }
  function saveLocalTasks() {
    localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks));
  }

  async function loadTasks() {
    if (!sb) { tasks = loadLocalTasks(); return; }
    try {
      const { data, error } = await sb
        .from("todos")
        .select("id,task,is_complete,date,created_at")
        .order("created_at", { ascending: true });
      if (error) {
        reportError("Couldn't load tasks: " + (error.message || error));
        tasks = loadLocalTasks();
        return;
      }
      tasks = (data || []).map(toTask);
    } catch (e) {
      reportError("Couldn't load tasks: " + e.message);
      tasks = loadLocalTasks();
    }
  }

  async function dbSetDone(t) {
    if (!sb) { saveLocalTasks(); return; }
    const { error } = await sb.from("todos").update({ is_complete: t.done }).eq("id", t.id);
    if (error) reportError("Couldn't update task: " + (error.message || error));
  }
  async function dbSetText(t) {
    if (!sb) { saveLocalTasks(); return; }
    const { error } = await sb.from("todos").update({ task: t.text }).eq("id", t.id);
    if (error) reportError("Couldn't update task: " + (error.message || error));
  }
  async function dbRemove(t) {
    if (!sb) { saveLocalTasks(); delete meta[t.id]; saveMeta(); return; }
    const { error } = await sb.from("todos").delete().eq("id", t.id);
    if (error) reportError("Couldn't delete task: " + (error.message || error));
    else { delete meta[t.id]; saveMeta(); }
  }

  // Picker state (defaults match the .is-active buttons in the markup)
  let pickedEmoji = "";
  let pickedPri = "low";

  function selectOption(group, btn, attr, set) {
    group.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
    btn.classList.add("is-active");
    btn.setAttribute("aria-checked", "true");
    set(btn.getAttribute(attr));
  }

  emojiPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".emoji-opt");
    if (btn) selectOption(emojiPicker, btn, "data-emoji", (v) => (pickedEmoji = v));
  });
  priPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".pri-opt");
    if (btn) selectOption(priPicker, btn, "data-pri", (v) => (pickedPri = v));
  });

  function resetPickers() {
    pickedEmoji = "";
    pickedPri = "low";
    emojiPicker.querySelectorAll(".emoji-opt").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-emoji") === "");
    });
    priPicker.querySelectorAll(".pri-opt").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-pri") === "low");
    });
  }

  // Search filter state
  let searchQuery = "";
  todoSearch.addEventListener("input", () => {
    searchQuery = todoSearch.value.trim().toLowerCase();
    renderTasks();
  });

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = toKey(today);

  function toKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function fromKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function renderCalendar() {
    calTitle.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    calGrid.innerHTML = "";

    const startDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    // Leading days from previous month (greyed, not selectable)
    for (let i = startDay - 1; i >= 0; i--) {
      calGrid.appendChild(makeDayCell(prevMonthDays - i, { other: true }));
    }
    // Current month days
    const todayKey = toKey(today);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(new Date(viewYear, viewMonth, d));
      calGrid.appendChild(
        makeDayCell(d, {
          key,
          isToday: key === todayKey,
          isSelected: key === selectedDate,
          hasTask: tasks.some((t) => t.date === key),
        })
      );
    }
    // Trailing days to complete the last row
    const total = startDay + daysInMonth;
    const trailing = (7 - (total % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      calGrid.appendChild(makeDayCell(i, { other: true }));
    }
  }

  function makeDayCell(num, opts = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal__day";
    btn.textContent = String(num);
    if (opts.other) btn.classList.add("is-other", "is-empty");
    if (opts.isToday) btn.classList.add("is-today");
    if (opts.isSelected) btn.classList.add("is-selected");
    if (opts.hasTask) {
      const dot = document.createElement("span");
      dot.className = "cal__day__dot";
      btn.appendChild(dot);
    }
    if (opts.key) {
      btn.setAttribute("data-date", opts.key);
      btn.setAttribute("aria-label", fromKey(opts.key).toDateString());
      btn.addEventListener("click", () => {
        selectedDate = opts.key;
        renderCalendar();
        renderTasks();
        todoInput.focus();
      });
    } else {
      btn.tabIndex = -1;
    }
    return btn;
  }

  function formatDateLabel(key) {
    const todayKey = toKey(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (key === todayKey) return "Today";
    if (key === toKey(tomorrow)) return "Tomorrow";
    return fromKey(key).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function startEdit(t, span) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "todo__edit";
    input.value = t.text;
    input.maxLength = 140;
    input.setAttribute("aria-label", "Edit task");
    span.replaceWith(input);
    input.focus();
    input.select();

    let done = false;
    const commit = (apply) => {
      if (done) return;
      done = true;
      if (apply) {
        const next = input.value.trim();
        if (next && next !== t.text) {
          t.text = next;
          dbSetText(t);
        }
      }
      renderTasks();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commit(true); }
      else if (e.key === "Escape") { e.preventDefault(); commit(false); }
    });
    input.addEventListener("blur", () => commit(true));
  }

  function renderTasks() {
    todoDateLabel.textContent = formatDateLabel(selectedDate);
    todoList.innerHTML = "";

    const allDayTasks = tasks.filter((t) => t.date === selectedDate);
    let dayTasks = allDayTasks;
    if (searchQuery) {
      dayTasks = allDayTasks.filter((t) => t.text.toLowerCase().includes(searchQuery));
    }
    dayTasks = dayTasks.sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      const pa = PRI_RANK[a.pri] ?? 2;
      const pb = PRI_RANK[b.pri] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.id - b.id;
    });

    dayTasks.forEach((t) => {
      const li = document.createElement("li");
      li.className = "todo__item" + (t.done ? " is-done" : "");

      const check = document.createElement("button");
      check.type = "button";
      check.className = "todo__check";
      check.setAttribute("aria-label", t.done ? "Mark as not done" : "Mark as done");
      check.innerHTML = CHECK_SVG;
      check.addEventListener("click", () => {
        t.done = !t.done;
        dbSetDone(t);
        renderTasks();
      });

      let em = null;
      if (t.emoji) {
        em = document.createElement("span");
        em.className = "todo__emoji";
        em.textContent = t.emoji;
        em.setAttribute("aria-hidden", "true");
      }

      const span = document.createElement("span");
      span.className = "todo__text";
      span.textContent = t.text;
      span.title = "Click to edit";
      span.addEventListener("click", () => startEdit(t, span));

      const pri = document.createElement("span");
      pri.className = "todo__pri";
      pri.setAttribute("data-pri", t.pri);
      pri.textContent = PRI_LABEL[t.pri];
      pri.title = `Priority: ${PRI_LABEL[t.pri]}`;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "todo__del";
      del.setAttribute("aria-label", "Delete task");
      del.innerHTML = X_SVG;
      del.addEventListener("click", () => {
        tasks = tasks.filter((x) => x.id !== t.id);
        dbRemove(t);
        renderCalendar();
        renderTasks();
      });

      li.appendChild(check);
      if (em) li.appendChild(em);
      li.appendChild(span);
      li.appendChild(pri);
      li.appendChild(del);
      todoList.appendChild(li);
    });

    const done = dayTasks.filter((t) => t.done).length;
    const total = dayTasks.length;
    todoCount.textContent = total ? `${done} of ${total} tasks completed` : "";

    if (allDayTasks.length === 0) {
      todoEmpty.textContent = "No tasks yet — add one below.";
    } else if (dayTasks.length === 0) {
      todoEmpty.textContent = `No tasks match "${todoSearch.value.trim()}".`;
    }
    todoEmpty.classList.toggle("is-visible", dayTasks.length === 0);
  }

  todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    if (!sb) {
      // localStorage fallback
      const id = Date.now();
      meta[id] = { emoji: pickedEmoji, pri: pickedPri };
      saveMeta();
      tasks.push(toTask({ id, task: text, is_complete: false, date: selectedDate }));
      saveLocalTasks();
      todoInput.value = "";
      resetPickers();
      renderCalendar();
      renderTasks();
      return;
    }
    const { data, error } = await sb
      .from("todos")
      .insert([{ task: text, is_complete: false, date: selectedDate }])
      .select("id,task,is_complete,date,created_at");
    if (error || !data || !data.length) {
      reportError("Couldn't save task: " + (error ? error.message || error : "no row returned"));
      return;
    }
    const row = data[0];
    meta[row.id] = { emoji: pickedEmoji, pri: pickedPri };
    saveMeta();
    tasks.push(toTask(row));
    todoInput.value = "";
    resetPickers();
    renderCalendar();
    renderTasks();
  });

  calPrev.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  calNext.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  todoEmpty.textContent = "Loading tasks…";
  todoEmpty.classList.add("is-visible");
  await loadTasks();
  renderCalendar();
  renderTasks();
})();
