
let currentStudentDetailAttempts = [];
let currentStudentDetailSort = { key: "completedAt", dir: "desc" };

function formatMalaysiaTime(value) {
  if (!value) return "-";
  try {
    let dateValue;
    if (typeof value === "string") {
      dateValue = new Date(value);
    } else if (value && typeof value.toDate === "function") {
      dateValue = value.toDate();
    } else {
      dateValue = new Date(value);
    }

    if (isNaN(dateValue.getTime())) return String(value);

    return dateValue.toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(",", "");
  } catch {
    return String(value);
  }
}

function getAttemptSortValue(log, key) {
  if (!log) return "";
  if (key === "sifir") return Number(log.sifir || 0);
  if (key === "time") return Number(log.time || 0);
  if (key === "coinsAwarded") return Number(log.coinsAwarded || 0);
  if (key === "xpAwarded") return Number(log.xpAwarded || 0);
  if (key === "completedAt") {
    const raw = log.completedAt || log.date || "";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return String(log[key] || "");
}

function renderStudentDetailAttempts() {
  const attemptsBody = $("studentDetailAttempts");
  if (!attemptsBody) return;

  const sorted = [...currentStudentDetailAttempts].sort((a, b) => {
    const va = getAttemptSortValue(a, currentStudentDetailSort.key);
    const vb = getAttemptSortValue(b, currentStudentDetailSort.key);

    if (typeof va === "number" && typeof vb === "number") {
      return currentStudentDetailSort.dir === "asc" ? va - vb : vb - va;
    }

    return currentStudentDetailSort.dir === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  if (!sorted.length) {
    attemptsBody.innerHTML = `<tr><td colspan="6">No detailed attempts found.</td></tr>`;
    return;
  }

  attemptsBody.innerHTML = sorted.map((log, index) => {
    const completedAt = log.completedAt || log.date || "";
    const completedText = formatMalaysiaTime(completedAt);
    const isChallenge = log.action === "challenge";
    const isGo = log.action === "sifir_go_completed";
    const sifirText = isChallenge
      ? `Challenge L${log.challengeLevel || 1}: ${log.sifir || "-"} x ${log.multiplier || "-"}`
      : isGo
        ? `Sifir Go: ${log.goNumber || "-"}`
      : `Sifir ${log.sifir || "-"}`;
    const timeText = isChallenge
      ? (log.correct === true ? "Betul" : "Salah")
      : isGo
        ? `${log.rowsCompleted || 12} petak`
      : (log.time ? log.time + "s" : "-");
    const coinsText = isChallenge
      ? `Jawapan: ${log.studentAnswer ?? "-"}`
      : isGo
        ? Number(log.coinsAwarded || 0)
      : Number(log.coinsAwarded || 0);
    const xpText = isChallenge
      ? `Betul: ${log.answer ?? "-"}`
      : isGo
        ? Number(log.xpAwarded || 0)
      : Number(log.xpAwarded || 0);

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${sifirText}</td>
        <td>${timeText}</td>
        <td>${coinsText}</td>
        <td>${xpText}</td>
        <td>${completedText}</td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".sortable-detail").forEach(th => {
    const key = th.dataset.sort;
    const label = th.textContent.replace(" ▲", "").replace(" ▼", "").replace(" ⬍", "");
    const arrow = key === currentStudentDetailSort.key
      ? (currentStudentDetailSort.dir === "asc" ? " ▲" : " ▼")
      : " ⬍";
    th.textContent = label + arrow;
  });
}

document.addEventListener("click", (event) => {
  const th = event.target.closest(".sortable-detail");
  if (!th) return;

  const key = th.dataset.sort;
  if (currentStudentDetailSort.key === key) {
    currentStudentDetailSort.dir = currentStudentDetailSort.dir === "asc" ? "desc" : "asc";
  } else {
    currentStudentDetailSort.key = key;
    currentStudentDetailSort.dir = "asc";
  }

  renderStudentDetailAttempts();
});


function playWelcomeSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.11);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.11 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.11);
      osc.stop(ctx.currentTime + i * 0.11 + 0.22);
    });
  } catch {}
}

function hideSessionPages() {
  const loginPage = $("loginPage");
  const appPage = $("app");
  const teacherPage = $("teacherDashboard");
  const adminPage = $("adminDashboard");
  const studentActivityPage = $("studentActivityPage");
  const studentChallengePage = $("studentChallengePage");
  const studentGoPage = $("studentGoPage");

  if (loginPage) loginPage.classList.add("hidden");
  if (appPage) appPage.classList.add("hidden");
  if (teacherPage) teacherPage.classList.add("hidden");
  if (adminPage) adminPage.classList.add("hidden");
  if (studentActivityPage) studentActivityPage.classList.add("hidden");
  if (studentChallengePage) studentChallengePage.classList.add("hidden");
  if (studentGoPage) studentGoPage.classList.add("hidden");
}

function showWelcomeThen(role, callback) {
  const welcomePage = $("welcomePage");
  const roleText = $("welcomeRoleText");

  hideSessionPages();

  if (roleText) {
    roleText.textContent = role === "admin"
      ? "Preparing your Admin Dashboard..."
      : role === "teacher"
        ? "Preparing your Teacher Dashboard..."
        : "Preparing your learning mission...";
  }

  if (welcomePage) welcomePage.classList.remove("hidden");
  playWelcomeSound();

  setTimeout(() => {
    if (welcomePage) welcomePage.classList.add("hidden");
    callback();
  }, 5000);
}


let currentAccountRole = "student";
let currentAccountData = null;
let currentStudentDisplayName = "";
let studentLoginSyncedFor = "";

function toggleSignupRoleFields() {
  const role = $("accountType") ? $("accountType").value : "student";

  const studentWrap = $("studentClassCodeWrap");
  const teacherTenBoxFields = document.querySelectorAll(".teacher-tenbox-field");

  const classInput = $("studentClass");
  const classLabel = classInput ? classInput.previousElementSibling : null;

  if (studentWrap) studentWrap.classList.toggle("hidden", role !== "student");
  teacherTenBoxFields.forEach((field) => {
    if (field) field.classList.toggle("hidden", role !== "teacher");
  });

  // Hide Class / Grade for teacher accounts
  if (classInput) classInput.classList.toggle("hidden", role !== "student");
  if (classLabel && classLabel.classList.contains("login-label")) {
    classLabel.classList.toggle("hidden", role !== "student");
  }
}

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "accountType") toggleSignupRoleFields();
});

function showStudentApp(user, displayName) {
  showWelcomeThen("student", () => {
    showStudentActivityPage(user, displayName);
  });
}

function prepareStudentSession(user, displayName) {
  currentUser = user || currentUser;
  window.currentUser = currentUser;
  currentStudentDisplayName = displayName || currentStudentDisplayName || currentUser;
  currentAccountRole = "student";
  window.currentAccountRole = currentAccountRole;

  if (studentLoginSyncedFor !== currentUser) {
    saveToFirebaseSafe({
      username: currentUser,
      action: "login",
      loggedInAt: new Date().toISOString()
    });

    syncCurrentAccountToFirebase({
      lastLoginAt: new Date().toISOString()
    });
    studentLoginSyncedFor = currentUser;
  }

  coins = Number(coins || totalCoins());
  if ($("welcomeCard")) $("welcomeCard").textContent = "Welcome " + currentStudentDisplayName;
  if ($("studentActivityWelcome")) $("studentActivityWelcome").textContent = "Welcome " + currentStudentDisplayName;
}

function showStudentActivityPage(user, displayName) {
  prepareStudentSession(user, displayName);
  hideSessionPages();
  const page = $("studentActivityPage");
  if (page) page.classList.remove("hidden");
}

function showStudentChallengePage() {
  hideSessionPages();
  const page = $("studentChallengePage");
  if (page) page.classList.remove("hidden");
  startChallengeSession();
}

function showStudentGoPage() {
  hideSessionPages();
  const page = $("studentGoPage");
  if (page) page.classList.remove("hidden");
  startSifirGo();
}

const SIFIR_GO_DIGITS = [1,2,3,4,5,6,7,8,9];
const SIFIR_GO_FACTORS = [1,2,3,4,5,6,7,8,9,10,11,12];
const SIFIR_GO_SET_COINS = 20;
const SIFIR_GO_SET_XP = 20;
let sifirGoState = {
  first: 2,
  second: 2,
  activeRow: 1,
  answers: {},
  completedRows: {},
  wrongRows: {},
  setAttempts: 0,
  setCorrect: 0,
  setCompleted: false
};
let sifirGoWrongTimer = null;

function createSifirGoStats() {
  return {
    setsCompleted: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    rowsCompleted: 0,
    byNumber: {},
    updatedAt: ""
  };
}

function normalizeSifirGoNumberStats(raw = {}) {
  return {
    setsCompleted: Number(raw.setsCompleted || 0),
    attempts: Number(raw.attempts || 0),
    correct: Number(raw.correct || 0),
    rowsCompleted: Number(raw.rowsCompleted || 0),
    bestAccuracy: Number(raw.bestAccuracy || 0),
    lastCompletedAt: raw.lastCompletedAt || ""
  };
}

function normalizeSifirGoStats(stats) {
  const raw = stats || {};
  const normalized = createSifirGoStats();
  normalized.setsCompleted = Number(raw.setsCompleted || 0);
  normalized.totalAttempts = Number(raw.totalAttempts || 0);
  normalized.totalCorrect = Number(raw.totalCorrect || 0);
  normalized.rowsCompleted = Number(raw.rowsCompleted || 0);
  normalized.updatedAt = raw.updatedAt || "";

  Object.keys(raw.byNumber || {}).forEach((numberKey) => {
    normalized.byNumber[numberKey] = normalizeSifirGoNumberStats(raw.byNumber[numberKey]);
  });

  return normalized;
}

function loadSifirGoStats() {
  if (!currentUser) return normalizeSifirGoStats({});
  try {
    return normalizeSifirGoStats(JSON.parse(localStorage.getItem("sifirria_go_stats_" + currentUser) || "{}"));
  } catch {
    return normalizeSifirGoStats({});
  }
}

function saveSifirGoStats(stats) {
  if (!currentUser) return;
  localStorage.setItem("sifirria_go_stats_" + currentUser, JSON.stringify(normalizeSifirGoStats(stats)));
}

function getSifirGoSummary(stats = loadSifirGoStats()) {
  const normalized = normalizeSifirGoStats(stats);
  return {
    setsCompleted: Number(normalized.setsCompleted || 0),
    totalAttempts: Number(normalized.totalAttempts || 0),
    totalCorrect: Number(normalized.totalCorrect || 0),
    rowsCompleted: Number(normalized.rowsCompleted || 0),
    accuracy: normalized.totalAttempts ? Math.round((normalized.totalCorrect / normalized.totalAttempts) * 100) : 0
  };
}

function getSifirGoNumber() {
  return (Number(sifirGoState.first || 0) * 10) + Number(sifirGoState.second || 0);
}

function resetSifirGoAnswers(keepMessage = false) {
  if (sifirGoWrongTimer) {
    clearTimeout(sifirGoWrongTimer);
    sifirGoWrongTimer = null;
  }
  sifirGoState.answers = {};
  sifirGoState.completedRows = {};
  sifirGoState.wrongRows = {};
  sifirGoState.activeRow = 1;
  sifirGoState.setAttempts = 0;
  sifirGoState.setCorrect = 0;
  sifirGoState.setCompleted = false;
  if (!keepMessage) setSifirGoFeedback("");
  renderSifirGo();
}

function setSifirGoFeedback(text, type = "") {
  const el = $("goFeedback");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("correct", "wrong");
  if (type) el.classList.add(type);
}

function renderSifirGoStats() {
  const summary = getSifirGoSummary();
  if ($("goSetText")) $("goSetText").textContent = summary.setsCompleted;
  if ($("goCorrectText")) $("goCorrectText").textContent = summary.rowsCompleted;
  if ($("goAccuracyText")) $("goAccuracyText").textContent = summary.accuracy + "%";
}

function renderSifirGoDigits() {
  const renderButtons = (targetId, type, activeValue) => {
    const target = $(targetId);
    if (!target) return;
    target.innerHTML = SIFIR_GO_DIGITS.map((digit) => `
      <button class="go-digit-button ${digit === activeValue ? "active" : ""}" type="button" data-go-digit-type="${type}" data-go-digit="${digit}">${digit}</button>
    `).join("");
  };

  renderButtons("goFirstDigits", "first", Number(sifirGoState.first || 2));
  renderButtons("goSecondDigits", "second", Number(sifirGoState.second || 2));
}

function renderSifirGoMission() {
  const number = getSifirGoNumber();
  const completed = Object.keys(sifirGoState.completedRows || {}).length;
  if ($("goMissionText")) {
    $("goMissionText").textContent = completed
      ? `Teruskan bina Sifir ${number}. ${completed}/12 petak Sifir sudah betul.`
      : `Lengkapkan Sifir ${number} dengan isi petak Sifir 1 hingga Sifir 12.`;
  }
  if ($("goMissionBadge")) $("goMissionBadge").textContent = `Sifir ${number}`;
  if ($("goNumberText")) $("goNumberText").textContent = number;
}

function renderSifirGoActivePrompt() {
  const number = getSifirGoNumber();
  const row = Number(sifirGoState.activeRow || 1);
  const answer = sifirGoState.answers[row] || "";
  if ($("goActiveQuestion")) $("goActiveQuestion").textContent = `${number} x ${row} =`;
  if ($("goTypedAnswer")) $("goTypedAnswer").textContent = answer || "Isi jawapan";
}

function renderSifirGoRows() {
  const target = $("goRows");
  if (!target) return;

  const number = getSifirGoNumber();
  const tens = Number(sifirGoState.first || 0) * 10;
  const ones = Number(sifirGoState.second || 0);

  target.innerHTML = SIFIR_GO_FACTORS.map((factor) => {
    const tensPart = tens * factor;
    const onesPart = ones * factor;
    const answer = number * factor;
    const typed = sifirGoState.answers[factor] || "";
    const isActive = Number(sifirGoState.activeRow) === factor;
    const isCorrect = Boolean(sifirGoState.completedRows[factor]);
    const isWrong = Boolean(sifirGoState.wrongRows[factor]);
    const statusClass = isCorrect ? "correct" : isWrong ? "wrong" : isActive ? "active" : "";

    return `
      <div class="go-row ${statusClass}" data-go-row="${factor}">
        <div class="go-factor"><span>Sifir</span><b>${factor}</b></div>
        <div class="go-split-work">
          <div class="go-mini-cell"><span>${tens} x ${factor}</span><b>${tensPart}</b></div>
          <div class="go-mini-cell"><span>${ones} x ${factor}</span><b>${onesPart}</b></div>
          <div class="go-sum-line">${tensPart} + ${onesPart}</div>
        </div>
        <button class="go-answer-cell ${statusClass}" type="button" data-go-answer-row="${factor}" aria-label="${number} x ${factor} jawapan">
          <span>Sifir ${factor}</span>
          <b>${typed || ""}</b>
        </button>
      </div>
    `;
  }).join("");
}

function renderSifirGo() {
  renderSifirGoStats();
  renderSifirGoDigits();
  renderSifirGoMission();
  renderSifirGoRows();
  renderSifirGoActivePrompt();
}

function startSifirGo() {
  renderSifirGo();
  setSifirGoFeedback("");
}

function setSifirGoDigit(type, digit) {
  const cleanDigit = Number(digit || 0);
  if (!SIFIR_GO_DIGITS.includes(cleanDigit)) return;
  if (type === "first") sifirGoState.first = cleanDigit;
  if (type === "second") sifirGoState.second = cleanDigit;
  resetSifirGoAnswers();
}

function setSifirGoActiveRow(row) {
  const cleanRow = Number(row || 0);
  if (!SIFIR_GO_FACTORS.includes(cleanRow)) return;
  if (sifirGoState.completedRows[cleanRow]) {
    setSifirGoFeedback("Petak ini sudah betul. Pilih petak lain.", "correct");
    return;
  }
  sifirGoState.activeRow = cleanRow;
  setSifirGoFeedback("");
  renderSifirGoRows();
  renderSifirGoActivePrompt();
}

function recordSifirGoAttempt(row, value, isCorrect) {
  const number = String(getSifirGoNumber());
  const stats = loadSifirGoStats();
  const numberStats = normalizeSifirGoNumberStats(stats.byNumber[number]);

  stats.totalAttempts += 1;
  numberStats.attempts += 1;
  sifirGoState.setAttempts += 1;

  if (isCorrect) {
    stats.totalCorrect += 1;
    stats.rowsCompleted += 1;
    numberStats.correct += 1;
    numberStats.rowsCompleted += 1;
    sifirGoState.setCorrect += 1;
  }

  numberStats.bestAccuracy = numberStats.attempts ? Math.max(numberStats.bestAccuracy, Math.round((numberStats.correct / numberStats.attempts) * 100)) : 0;
  stats.byNumber[number] = numberStats;
  stats.updatedAt = new Date().toISOString();
  saveSifirGoStats(stats);
  renderSifirGoStats();

  return stats;
}

function getNextSifirGoRow() {
  return SIFIR_GO_FACTORS.find((factor) => !sifirGoState.completedRows[factor]) || 1;
}

function completeSifirGoSet(statsAfterAttempt) {
  if (sifirGoState.setCompleted) return;
  sifirGoState.setCompleted = true;

  const number = String(getSifirGoNumber());
  const stats = normalizeSifirGoStats(statsAfterAttempt || loadSifirGoStats());
  const numberStats = normalizeSifirGoNumberStats(stats.byNumber[number]);
  const completedAt = new Date().toISOString();

  stats.setsCompleted += 1;
  stats.updatedAt = completedAt;
  numberStats.setsCompleted += 1;
  numberStats.lastCompletedAt = completedAt;
  stats.byNumber[number] = numberStats;
  saveSifirGoStats(stats);

  const progress = loadProgress();
  progress[todayKey()] = (progress[todayKey()] || 0) + 1;
  saveProgress(progress);

  const coinProgress = loadCoins();
  coinProgress[todayKey()] = Number(coinProgress[todayKey()] || 0) + SIFIR_GO_SET_COINS;
  saveCoins(coinProgress);
  coins = Number(coins || 0) + SIFIR_GO_SET_COINS;
  const playerStats = addXP(SIFIR_GO_SET_XP);

  const payload = {
    username: currentUser,
    action: "sifir_go_completed",
    goNumber: Number(number),
    rowsCompleted: 12,
    rowAttempts: Number(sifirGoState.setAttempts || 12),
    rowCorrect: Number(sifirGoState.setCorrect || 12),
    totalAttempts: stats.totalAttempts,
    coins: coins,
    coinsAwarded: SIFIR_GO_SET_COINS,
    xpAwarded: SIFIR_GO_SET_XP,
    sifirGoStats: stats,
    completedAt,
    date: todayKey()
  };

  saveToFirebaseSafe(payload);
  syncCurrentAccountToFirebase({
    sifirGoStats: stats,
    lastSifirGo: payload,
    lastSifirGoNumber: Number(number),
    lastSifirGoAt: completedAt,
    xp: Number(playerStats.xp || 0),
    level: Number(playerStats.level || 1)
  });

  renderSifirGoStats();
  renderSifirGoMission();
  setSifirGoFeedback(`Hebat! Sifir ${number} siap. +${SIFIR_GO_SET_COINS} coins, +${SIFIR_GO_SET_XP} XP`, "correct");
  try { playSuccessMelody(); } catch {}
}

function checkSifirGoAnswer(row) {
  const number = getSifirGoNumber();
  const expected = number * row;
  const typed = sifirGoState.answers[row] || "";
  if (typed.length < String(expected).length) return;

  const isCorrect = Number(typed) === expected;
  const stats = recordSifirGoAttempt(row, typed, isCorrect);

  if (isCorrect) {
    sifirGoState.completedRows[row] = true;
    delete sifirGoState.wrongRows[row];
    const completedCount = Object.keys(sifirGoState.completedRows).length;

    if (completedCount >= SIFIR_GO_FACTORS.length) {
      renderSifirGo();
      completeSifirGoSet(stats);
      return;
    }

    sifirGoState.activeRow = getNextSifirGoRow();
    setSifirGoFeedback("Betul. Petak seterusnya!", "correct");
    renderSifirGo();
    return;
  }

  sifirGoState.wrongRows[row] = true;
  setSifirGoFeedback("Cuba lagi. Gunakan pecahan puluh dan sa di sebelah kiri.", "wrong");
  renderSifirGoRows();
  renderSifirGoActivePrompt();

  if (sifirGoWrongTimer) clearTimeout(sifirGoWrongTimer);
  sifirGoWrongTimer = setTimeout(() => {
    if (sifirGoState.completedRows[row]) return;
    sifirGoState.answers[row] = "";
    delete sifirGoState.wrongRows[row];
    renderSifirGoRows();
    renderSifirGoActivePrompt();
  }, 650);
}

function handleSifirGoKey(key) {
  const row = Number(sifirGoState.activeRow || 1);
  if (!SIFIR_GO_FACTORS.includes(row) || sifirGoState.completedRows[row] || sifirGoState.setCompleted) return;

  const expectedLength = String(getSifirGoNumber() * row).length;
  let answer = sifirGoState.answers[row] || "";

  if (key === "clear") {
    answer = "";
    delete sifirGoState.wrongRows[row];
  } else if (key === "back") {
    answer = answer.slice(0, -1);
    delete sifirGoState.wrongRows[row];
  } else if (/^\d$/.test(key) && answer.length < expectedLength) {
    answer += key;
  }

  sifirGoState.answers[row] = answer;
  renderSifirGoRows();
  renderSifirGoActivePrompt();

  if (/^\d$/.test(key) && answer.length === expectedLength) {
    checkSifirGoAnswer(row);
  }
}

const CHALLENGE_FACTORS = [1,2,3,4,5,6,7,8,9,10,11,12];
let challengeState = {
  level: 1,
  sifir: 1,
  multiplier: 1,
  answer: 1,
  typedAnswer: "",
  answered: false
};
let challengeAutoNextTimer = null;
let challengeMissionCache = null;

function createChallengeLevelStats() {
  const bySifir = {};
  CHALLENGE_FACTORS.forEach((n) => {
    bySifir[n] = { attempts: 0, correct: 0 };
  });
  return { attempts: 0, correct: 0, currentStreak: 0, bestStreak: 0, bySifir };
}

function normalizeChallengeLevelStats(levelStats) {
  const normalized = createChallengeLevelStats();
  const raw = levelStats || {};
  normalized.attempts = Number(raw.attempts || 0);
  normalized.correct = Number(raw.correct || 0);
  normalized.currentStreak = Number(raw.currentStreak || 0);
  normalized.bestStreak = Number(raw.bestStreak || 0);
  CHALLENGE_FACTORS.forEach((n) => {
    const item = (raw.bySifir && raw.bySifir[n]) || {};
    normalized.bySifir[n] = {
      attempts: Number(item.attempts || 0),
      correct: Number(item.correct || 0)
    };
  });
  return normalized;
}

function normalizeChallengeStats(stats) {
  const raw = stats || {};
  const level1 = normalizeChallengeLevelStats(raw.level1);
  const level2 = normalizeChallengeLevelStats(raw.level2);
  const totalAttempts = Number(raw.totalAttempts ?? (level1.attempts + level2.attempts));
  const totalCorrect = Number(raw.totalCorrect ?? (level1.correct + level2.correct));
  return {
    level1,
    level2,
    totalAttempts,
    totalCorrect,
    currentStreak: Number(raw.currentStreak || Math.max(level1.currentStreak, level2.currentStreak)),
    bestStreak: Number(raw.bestStreak || Math.max(level1.bestStreak, level2.bestStreak)),
    updatedAt: raw.updatedAt || ""
  };
}

function loadChallengeStats() {
  if (!currentUser) return normalizeChallengeStats({});
  try {
    return normalizeChallengeStats(JSON.parse(localStorage.getItem("sifirria_challenge_stats_" + currentUser) || "{}"));
  } catch {
    return normalizeChallengeStats({});
  }
}

function saveChallengeStats(stats) {
  if (!currentUser) return;
  localStorage.setItem("sifirria_challenge_stats_" + currentUser, JSON.stringify(normalizeChallengeStats(stats)));
}

function getChallengeSummary(stats = loadChallengeStats()) {
  const normalized = normalizeChallengeStats(stats);
  const attempts = Number(normalized.totalAttempts || 0);
  const correct = Number(normalized.totalCorrect || 0);
  return {
    attempts,
    correct,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    bestStreak: Number(normalized.bestStreak || 0),
    level1Correct: Number(normalized.level1.correct || 0),
    level2Correct: Number(normalized.level2.correct || 0)
  };
}

function randomChallengeFact() {
  const sifir = CHALLENGE_FACTORS[Math.floor(Math.random() * CHALLENGE_FACTORS.length)];
  const multiplier = CHALLENGE_FACTORS[Math.floor(Math.random() * CHALLENGE_FACTORS.length)];
  return { sifir, multiplier, answer: sifir * multiplier };
}

function shuffleChallengeChoices(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

function buildChallengeChoices(answer) {
  const choices = new Set([answer]);
  while (choices.size < 3) {
    const offset = Math.floor(Math.random() * 21) - 10;
    const candidate = Math.max(1, answer + offset);
    if (candidate !== answer) choices.add(candidate);
  }
  return shuffleChallengeChoices(Array.from(choices));
}

function renderChallengeStats() {
  const summary = getChallengeSummary();
  if ($("challengeCorrectText")) $("challengeCorrectText").textContent = summary.correct;
  if ($("challengeAttemptText")) $("challengeAttemptText").textContent = summary.attempts;
  if ($("challengeStreakText")) $("challengeStreakText").textContent = summary.bestStreak;
}

function setChallengeMission(text, badge) {
  if ($("challengeMissionText")) $("challengeMissionText").textContent = text;
  if ($("challengeMissionBadge")) $("challengeMissionBadge").textContent = badge;
}

function setSelfChallengeMission(summary = getChallengeSummary()) {
  if (summary.bestStreak > 0) {
    setChallengeMission(
      `Challenge diri sendiri: cuba kalahkan best streak ${summary.bestStreak}.`,
      `${summary.correct} betul`
    );
    return;
  }
  setChallengeMission(
    "Challenge diri sendiri: bina streak pertama anda dalam Sifir Challenge.",
    "Self challenge"
  );
}

async function updateChallengeMission(forceRefresh = false) {
  if (!$("challengeMissionText") || !$("challengeMissionBadge")) return;

  const summary = getChallengeSummary();
  if (!currentClassCode || typeof window.getClassTopForChallenge !== "function") {
    setSelfChallengeMission(summary);
    return;
  }

  if (forceRefresh) challengeMissionCache = null;

  try {
    if (!challengeMissionCache) {
      challengeMissionCache = await window.getClassTopForChallenge(currentClassCode);
    }

    const top = challengeMissionCache && challengeMissionCache.ok ? challengeMissionCache.topStudent : null;
    if (!top || Number(top.totalCorrect || 0) <= 0) {
      setChallengeMission(
        "Jadi murid pertama dalam kelas yang mencatat rekod Sifir Challenge.",
        "Juara pertama"
      );
      return;
    }

    const topCorrect = Number(top.totalCorrect || 0);
    const topStreak = Number(top.bestStreak || 0);
    const localIsAhead = summary.correct > topCorrect || (summary.correct === topCorrect && summary.bestStreak > topStreak);
    const topIsMe = top.username === currentUser || localIsAhead;

    if (topIsMe && summary.correct > 0) {
      setChallengeMission(
        `Anda sedang mendahului kelas dengan ${summary.correct} jawapan betul. Kekalkan streak terbaik ${summary.bestStreak}.`,
        "Class leader"
      );
      return;
    }

    if (summary.correct > 0 && summary.correct === topCorrect && summary.bestStreak === topStreak) {
      setChallengeMission(
        `Anda sebaris dengan ${top.fullName}. Jawab satu lagi soalan untuk mendahului kelas.`,
        "Tie challenge"
      );
      return;
    }

    setChallengeMission(
      `Cabar ${top.fullName}: kejar ${topCorrect} jawapan betul dalam Sifir Challenge.`,
      `Target ${topCorrect}`
    );
  } catch (error) {
    console.warn("Challenge mission failed", error);
    setSelfChallengeMission(summary);
  }
}

function setChallengeFeedback(text, type = "") {
  const el = $("challengeFeedback");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("correct", "wrong");
  if (type) el.classList.add(type);
}

function clearChallengeAutoNext() {
  if (!challengeAutoNextTimer) return;
  clearTimeout(challengeAutoNextTimer);
  challengeAutoNextTimer = null;
}

function scheduleNextChallengeQuestion(delay = 1000) {
  clearChallengeAutoNext();
  challengeAutoNextTimer = setTimeout(() => {
    challengeAutoNextTimer = null;
    nextChallengeQuestion();
  }, delay);
}

function renderChallengeQuestion() {
  const question = $("challengeQuestionText");
  if (!question) return;
  const answerText = challengeState.level === 2 ? challengeState.typedAnswer : "?";
  question.textContent = `${challengeState.sifir} x ${challengeState.multiplier} = ${answerText}`;
}

function setChallengeKeyboardEnabled(enabled) {
  document.querySelectorAll("[data-challenge-key]").forEach((button) => {
    button.disabled = !enabled;
  });
}

function setChallengeLevel(level) {
  challengeState.level = level === 2 ? 2 : 1;
  if ($("challengeLevel1Button")) $("challengeLevel1Button").classList.toggle("active", challengeState.level === 1);
  if ($("challengeLevel2Button")) $("challengeLevel2Button").classList.toggle("active", challengeState.level === 2);
  nextChallengeQuestion();
}

function startChallengeSession() {
  clearChallengeAutoNext();
  renderChallengeStats();
  updateChallengeMission();
  setChallengeLevel(challengeState.level || 1);
}

function nextChallengeQuestion() {
  clearChallengeAutoNext();
  const fact = randomChallengeFact();
  challengeState = {
    ...challengeState,
    ...fact,
    typedAnswer: "",
    answered: false
  };

  renderChallengeQuestion();
  setChallengeFeedback("");
  setChallengeKeyboardEnabled(true);

  const isLevel1 = challengeState.level === 1;
  if ($("challengeChoices")) {
    $("challengeChoices").classList.toggle("hidden", !isLevel1);
    $("challengeChoices").innerHTML = isLevel1 ? buildChallengeChoices(fact.answer).map((choice) => `
      <button class="challenge-choice-button" type="button" data-challenge-choice="${choice}">${choice}</button>
    `).join("") : "";
  }
  if ($("challengeKeyboard")) $("challengeKeyboard").classList.toggle("hidden", isLevel1);
}

function recordChallengeAnswer(studentAnswer) {
  if (challengeState.answered) return;
  challengeState.answered = true;
  const answer = Number(studentAnswer || 0);
  const isCorrect = answer === Number(challengeState.answer);
  const stats = loadChallengeStats();
  const levelKey = challengeState.level === 2 ? "level2" : "level1";
  const levelStats = stats[levelKey];
  const sifirStats = levelStats.bySifir[challengeState.sifir] || { attempts: 0, correct: 0 };

  levelStats.attempts += 1;
  stats.totalAttempts += 1;
  sifirStats.attempts += 1;

  if (isCorrect) {
    levelStats.correct += 1;
    stats.totalCorrect += 1;
    sifirStats.correct += 1;
    levelStats.currentStreak += 1;
    stats.currentStreak += 1;
    levelStats.bestStreak = Math.max(levelStats.bestStreak, levelStats.currentStreak);
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak, levelStats.bestStreak);
  } else {
    levelStats.currentStreak = 0;
    stats.currentStreak = 0;
  }

  levelStats.bySifir[challengeState.sifir] = sifirStats;
  stats.updatedAt = new Date().toISOString();
  saveChallengeStats(stats);
  renderChallengeStats();

  const summary = getChallengeSummary(stats);
  const payload = {
    username: currentUser,
    action: "challenge",
    challengeLevel: challengeState.level,
    sifir: challengeState.sifir,
    multiplier: challengeState.multiplier,
    answer: challengeState.answer,
    studentAnswer: answer,
    correct: isCorrect,
    challengeStats: stats,
    challengeSummary: summary,
    completedAt: new Date().toISOString(),
    date: todayKey()
  };

  syncCurrentAccountToFirebase({
    challengeStats: stats,
    lastChallenge: payload
  });
  saveToFirebaseSafe(payload);

  setChallengeFeedback(
    isCorrect ? "Betul! Hebat." : `Cuba lagi. Jawapan betul ialah ${challengeState.answer}.`,
    isCorrect ? "correct" : "wrong"
  );

  document.querySelectorAll(".challenge-choice-button").forEach((button) => {
    const value = Number(button.dataset.challengeChoice || 0);
    button.disabled = true;
    if (value === challengeState.answer) button.classList.add("correct");
    if (value === answer && !isCorrect) button.classList.add("wrong");
  });
  setChallengeKeyboardEnabled(false);
  updateChallengeMission(true);
  scheduleNextChallengeQuestion(isCorrect ? 900 : 1300);
}

function handleChallengeKey(key) {
  if (challengeState.answered) return;
  if (key === "clear") {
    challengeState.typedAnswer = "";
  } else if (key === "back") {
    challengeState.typedAnswer = challengeState.typedAnswer.slice(0, -1);
  } else if (/^\d$/.test(key) && challengeState.typedAnswer.length < 4) {
    challengeState.typedAnswer += key;
  }
  renderChallengeQuestion();

  const requiredLength = String(challengeState.answer).length;
  if (/^\d$/.test(key) && challengeState.typedAnswer.length >= requiredLength) {
    recordChallengeAnswer(Number(challengeState.typedAnswer || 0));
  }
}


async function showTeacherDashboard(account) {
  showWelcomeThen("teacher", async () => {
    await showTeacherDashboardReal(account);
  });
}

async function showTeacherDashboardReal(account) {
  currentAccountRole = "teacher";
  window.currentAccountRole = currentAccountRole;
  currentAccountData = account || {};
  hideSessionPages();
  const dash = $("teacherDashboard");
  if (dash) dash.classList.remove("hidden");

  if ($("teacherWelcome")) {
    $("teacherWelcome").textContent = "Welcome " + (account.fullName || account.username || currentUser);
  }

  const schoolInput = $("newClassSchool");
  const stateInput = $("newClassState");
  if (schoolInput && !schoolInput.value) schoolInput.value = account.schoolName || "";
  if (stateInput && !stateInput.value) stateInput.value = account.stateName || "";

  await loadTeacherDashboard();
}

async function loadTeacherDashboard() {
  const classList = $("teacherClassList");
  const table = $("teacherStudentTable");
  if (classList) classList.innerHTML = "Loading class summary...";
  if (table) table.innerHTML = `<tr><td colspan="14">Loading fast student summary...</td></tr>`;

  if (typeof window.getTeacherDashboardData !== "function") {
    if (table) table.innerHTML = `<tr><td colspan="14">Firebase dashboard function not ready.</td></tr>`;
    return;
  }

  const result = await window.getTeacherDashboardData(currentUser);
  if (!result.ok) {
    if (classList) classList.innerHTML = "Failed to load classes.";
    if (table) table.innerHTML = `<tr><td colspan="14">${result.message}</td></tr>`;
    return;
  }

  if (classList) {
    if (!result.classes.length) {
      classList.innerHTML = `<div class="class-card">No class yet. Create a class first, then share the class code with students.</div>`;
    } else {
      classList.innerHTML = result.classes.map(c => `
        <div class="class-card">
          <b>${c.className || "Class"}</b><br>
          <span>Class Code: <b>${c.classCode}</b></span><br>
          <small>${c.schoolName || ""} ${c.stateName ? "• " + c.stateName : ""}</small>
        </div>
      `).join("");
    }
  }

  renderTeacherStudents(result.students || []);
}

let adminDashboardDataCache = { users: [], classes: [] };

function adminEsc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

function adminText(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function adminActiveDaysCount(user) {
  if (user && user.activeDays instanceof Set) return user.activeDays.size;
  const progress = (user && user.progress) || {};
  return Object.keys(progress).filter((d) => Number(progress[d] || 0) > 0).length;
}

function normalizeAdminUser(user) {
  const raw = user || {};
  const summary = buildFastStudentSummary(raw);
  const role = String(raw.role || summary.role || "student").toLowerCase();
  const activeDaysCount = adminActiveDaysCount(summary);
  const totalAttempts = Number(summary.totalAttempts || 0);
  const challengeAttempts = Number(summary.challengeAttempts || 0);
  const goSets = Number(summary.sifirGoSets || 0);
  const activeScore = Number(summary.activeScore || raw.activeScore || 0);

  return {
    ...summary,
    role,
    activeDaysCount,
    totalAttempts,
    activeScore,
    isLearningActive: totalAttempts > 0 || challengeAttempts > 0 || goSets > 0 || activeDaysCount > 0 || activeScore > 0
  };
}

function adminSchoolKey(schoolName, stateName) {
  return [
    String(schoolName || "Not stated").trim().toLowerCase(),
    String(stateName || "Not stated").trim().toLowerCase()
  ].join("|");
}

function ensureAdminSchool(map, schoolName, stateName) {
  const school = adminText(schoolName === "-" ? "" : schoolName);
  const state = adminText(stateName === "-" ? "" : stateName);
  const key = adminSchoolKey(school, state);

  if (!map.has(key)) {
    map.set(key, {
      schoolName: school,
      stateName: state,
      teacherNames: new Set(),
      studentNames: new Set(),
      classCodes: new Set(),
      activeStudents: 0,
      totalAttempts: 0,
      activeScore: 0
    });
  }

  return map.get(key);
}

function buildAdminDashboardModel(users, classes) {
  const normalizedUsers = (users || []).map(normalizeAdminUser);
  const students = normalizedUsers.filter((u) => u.role === "student");
  const teachers = normalizedUsers.filter((u) => u.role === "teacher");
  const schoolMap = new Map();
  const teacherMap = new Map();

  teachers.forEach((teacher) => {
    const username = teacher.username || teacher.fullName || "teacher";
    teacherMap.set(username, {
      username,
      name: teacher.fullName || teacher.username || username,
      schoolName: teacher.schoolName || "Not stated",
      stateName: teacher.stateName || "Not stated",
      classes: new Set(),
      students: new Set(),
      activeStudents: 0,
      totalAttempts: 0,
      activeScore: 0
    });

    const school = ensureAdminSchool(schoolMap, teacher.schoolName, teacher.stateName);
    school.teacherNames.add(username);
  });

  const classesByCode = new Map();
  (classes || []).forEach((classItem) => {
    const classCode = String(classItem.classCode || "").trim().toUpperCase();
    if (!classCode) return;
    classesByCode.set(classCode, classItem);

    const school = ensureAdminSchool(schoolMap, classItem.schoolName, classItem.stateName);
    school.classCodes.add(classCode);
    if (classItem.teacherUsername) school.teacherNames.add(String(classItem.teacherUsername));

    const teacherUsername = classItem.teacherUsername || "";
    if (teacherUsername && !teacherMap.has(teacherUsername)) {
      teacherMap.set(teacherUsername, {
        username: teacherUsername,
        name: teacherUsername,
        schoolName: classItem.schoolName || "Not stated",
        stateName: classItem.stateName || "Not stated",
        classes: new Set(),
        students: new Set(),
        activeStudents: 0,
        totalAttempts: 0,
        activeScore: 0
      });
    }
    if (teacherUsername) teacherMap.get(teacherUsername).classes.add(classCode);
  });

  students.forEach((student) => {
    const classCode = String(student.classCode || "").trim().toUpperCase();
    const classInfo = classesByCode.get(classCode) || {};
    const schoolName = student.schoolName || classInfo.schoolName || "Not stated";
    const stateName = student.stateName || classInfo.stateName || "Not stated";
    const teacherUsername = student.teacherUsername || classInfo.teacherUsername || "";
    const studentKey = student.username || student.fullName || "student";

    const school = ensureAdminSchool(schoolMap, schoolName, stateName);
    school.studentNames.add(studentKey);
    if (classCode) school.classCodes.add(classCode);
    if (teacherUsername) school.teacherNames.add(String(teacherUsername));
    if (student.isLearningActive) school.activeStudents += 1;
    school.totalAttempts += Number(student.totalAttempts || 0);
    school.activeScore += Number(student.activeScore || 0);

    if (teacherUsername) {
      if (!teacherMap.has(teacherUsername)) {
        teacherMap.set(teacherUsername, {
          username: teacherUsername,
          name: teacherUsername,
          schoolName,
          stateName,
          classes: new Set(),
          students: new Set(),
          activeStudents: 0,
          totalAttempts: 0,
          activeScore: 0
        });
      }
      const teacher = teacherMap.get(teacherUsername);
      if (classCode) teacher.classes.add(classCode);
      teacher.students.add(studentKey);
      if (student.isLearningActive) teacher.activeStudents += 1;
      teacher.totalAttempts += Number(student.totalAttempts || 0);
      teacher.activeScore += Number(student.activeScore || 0);
    }
  });

  const schoolRows = Array.from(schoolMap.values()).map((school) => ({
    ...school,
    teachers: school.teacherNames.size,
    students: school.studentNames.size,
    classes: school.classCodes.size
  })).sort((a, b) =>
    Number(b.activeScore || 0) - Number(a.activeScore || 0)
    || Number(b.totalAttempts || 0) - Number(a.totalAttempts || 0)
    || Number(b.activeStudents || 0) - Number(a.activeStudents || 0)
  );

  const activeStudents = students
    .filter((student) => student.isLearningActive)
    .sort((a, b) => Number(b.activeScore || 0) - Number(a.activeScore || 0));

  const teacherRows = Array.from(teacherMap.values()).map((teacher) => ({
    ...teacher,
    classCount: teacher.classes.size,
    studentCount: teacher.students.size
  })).sort((a, b) =>
    Number(b.activeScore || 0) - Number(a.activeScore || 0)
    || Number(b.studentCount || 0) - Number(a.studentCount || 0)
  );

  const activeTeachers = teacherRows.filter((teacher) =>
    teacher.classCount > 0 || teacher.studentCount > 0 || teacher.totalAttempts > 0
  );

  return {
    users: normalizedUsers,
    students,
    teachers,
    classes: classes || [],
    schoolRows,
    activeStudents,
    teacherRows,
    activeTeachers,
    totalAttempts: students.reduce((sum, student) => sum + Number(student.totalAttempts || 0), 0),
    challengeAttempts: students.reduce((sum, student) => sum + Number(student.challengeAttempts || 0), 0),
    challengeCorrect: students.reduce((sum, student) => sum + Number(student.challengeCorrect || 0), 0),
    goSets: students.reduce((sum, student) => sum + Number(student.sifirGoSets || 0), 0)
  };
}

function adminMatchesKeyword(row, keyword, fields) {
  if (!keyword) return true;
  return fields.map((field) => row[field] || "").join(" ").toLowerCase().includes(keyword);
}

function renderAdminDashboard() {
  const model = buildAdminDashboardModel(adminDashboardDataCache.users, adminDashboardDataCache.classes);
  const keyword = ($("adminSearchInput") ? $("adminSearchInput").value : "").toLowerCase().trim();

  if ($("adminTotalUsers")) $("adminTotalUsers").textContent = model.users.length;
  if ($("adminTotalStudents")) $("adminTotalStudents").textContent = model.students.length;
  if ($("adminTotalTeachers")) $("adminTotalTeachers").textContent = model.teachers.length;
  if ($("adminTotalClasses")) $("adminTotalClasses").textContent = model.classes.length;
  if ($("adminActiveSchools")) $("adminActiveSchools").textContent = model.schoolRows.filter((s) => s.activeStudents > 0 || s.totalAttempts > 0).length;
  if ($("adminActiveStudents")) $("adminActiveStudents").textContent = model.activeStudents.length;
  if ($("adminActiveTeachers")) $("adminActiveTeachers").textContent = model.activeTeachers.length;
  if ($("adminTotalAttempts")) $("adminTotalAttempts").textContent = model.totalAttempts;
  if ($("adminChallengeCorrect")) $("adminChallengeCorrect").textContent = model.challengeCorrect;
  if ($("adminGoSets")) $("adminGoSets").textContent = model.goSets;

  const schoolRows = model.schoolRows.filter((row) =>
    adminMatchesKeyword(row, keyword, ["schoolName", "stateName"])
  );
  if ($("adminSchoolTable")) {
    $("adminSchoolTable").innerHTML = schoolRows.length ? schoolRows.map((row) => `
      <tr>
        <td><b>${adminEsc(row.schoolName)}</b></td>
        <td>${adminEsc(row.stateName)}</td>
        <td>${row.teachers}</td>
        <td>${row.students}</td>
        <td>${row.classes}</td>
        <td>${row.activeStudents}</td>
        <td>${row.totalAttempts}</td>
        <td>${row.activeScore}</td>
      </tr>
    `).join("") : `<tr><td colspan="8">No school data found.</td></tr>`;
  }

  const studentRows = model.activeStudents.filter((student) =>
    adminMatchesKeyword(student, keyword, ["username", "fullName", "studentClass", "className", "schoolName", "stateName", "status"])
  );
  if ($("adminStudentTable")) {
    $("adminStudentTable").innerHTML = studentRows.length ? studentRows.map((student) => `
      <tr>
        <td><b>${adminEsc(student.fullName || student.username || "-")}</b><br><small>${adminEsc(student.username || "")}</small></td>
        <td>${adminEsc(student.studentClass || student.className || "-")}</td>
        <td>${adminEsc(student.schoolName || "-")}</td>
        <td>${adminEsc(student.stateName || "-")}</td>
        <td>${student.totalAttempts}</td>
        <td>${student.sifirCount || 0}</td>
        <td><b>${formatChallengeSummary(student.challengeStats)}</b><br><small>${student.challengeAccuracy || 0}%</small></td>
        <td><b>${formatSifirGoSummary(student.sifirGoStats)}</b><br><small>${student.sifirGoRows || 0} petak</small></td>
        <td>${student.activeDaysCount}</td>
        <td>${student.coins || 0}</td>
        <td>${student.xp || 0}</td>
        <td>${adminEsc(student.status || "-")}</td>
      </tr>
    `).join("") : `<tr><td colspan="12">No active student data found.</td></tr>`;
  }

  const teacherRows = model.activeTeachers.filter((teacher) =>
    adminMatchesKeyword(teacher, keyword, ["username", "name", "schoolName", "stateName"])
  );
  if ($("adminTeacherTable")) {
    $("adminTeacherTable").innerHTML = teacherRows.length ? teacherRows.map((teacher) => `
      <tr>
        <td><b>${adminEsc(teacher.name || teacher.username || "-")}</b><br><small>${adminEsc(teacher.username || "")}</small></td>
        <td>${adminEsc(teacher.schoolName || "-")}</td>
        <td>${adminEsc(teacher.stateName || "-")}</td>
        <td>${teacher.classCount}</td>
        <td>${teacher.studentCount}</td>
        <td>${teacher.activeStudents}</td>
        <td>${teacher.totalAttempts}</td>
        <td>${teacher.activeScore}</td>
      </tr>
    `).join("") : `<tr><td colspan="8">No active teacher data found.</td></tr>`;
  }

  const userRows = model.users.filter((user) =>
    adminMatchesKeyword(user, keyword, ["username", "fullName", "role", "studentClass", "className", "schoolName", "stateName", "status"])
  ).sort((a, b) => Number(b.activeScore || 0) - Number(a.activeScore || 0));
  if ($("adminUserTable")) {
    $("adminUserTable").innerHTML = userRows.length ? userRows.map((user) => `
      <tr>
        <td>${adminEsc(user.role || "-")}</td>
        <td><b>${adminEsc(user.fullName || user.username || "-")}</b><br><small>${adminEsc(user.username || "")}</small></td>
        <td>${adminEsc(user.studentClass || user.className || "-")}</td>
        <td>${adminEsc(user.schoolName || "-")}</td>
        <td>${adminEsc(user.stateName || "-")}</td>
        <td>${user.coins || 0}</td>
        <td>${user.xp || 0}</td>
        <td>${formatChallengeSummary(user.challengeStats)}</td>
        <td>${formatSifirGoSummary(user.sifirGoStats)}</td>
        <td>${user.activeScore || 0}</td>
        <td>${adminEsc(user.status || "-")}</td>
        <td>${adminEsc(user.classCode || "-")}</td>
      </tr>
    `).join("") : `<tr><td colspan="12">No user data found.</td></tr>`;
  }
}

async function loadAdminDashboard() {
  if ($("adminUserTable")) $("adminUserTable").innerHTML = `<tr><td colspan="12">Loading admin data...</td></tr>`;
  if ($("adminSchoolTable")) $("adminSchoolTable").innerHTML = `<tr><td colspan="8">Loading admin data...</td></tr>`;
  if ($("adminStudentTable")) $("adminStudentTable").innerHTML = `<tr><td colspan="12">Loading admin data...</td></tr>`;
  if ($("adminTeacherTable")) $("adminTeacherTable").innerHTML = `<tr><td colspan="8">Loading admin data...</td></tr>`;

  if (typeof window.getAdminDashboardData !== "function") {
    if ($("adminUserTable")) $("adminUserTable").innerHTML = `<tr><td colspan="12">Firebase admin function not ready.</td></tr>`;
    return;
  }

  const result = await window.getAdminDashboardData();
  if (!result.ok) {
    const message = adminEsc(result.message || "Failed to load admin data.");
    if ($("adminUserTable")) $("adminUserTable").innerHTML = `<tr><td colspan="12">${message}</td></tr>`;
    if ($("adminSchoolTable")) $("adminSchoolTable").innerHTML = `<tr><td colspan="8">${message}</td></tr>`;
    if ($("adminStudentTable")) $("adminStudentTable").innerHTML = `<tr><td colspan="12">${message}</td></tr>`;
    if ($("adminTeacherTable")) $("adminTeacherTable").innerHTML = `<tr><td colspan="8">${message}</td></tr>`;
    return;
  }

  adminDashboardDataCache = {
    users: result.users || [],
    classes: result.classes || []
  };
  renderAdminDashboard();
}

async function showAdminDashboard(account) {
  showWelcomeThen("admin", async () => {
    await showAdminDashboardReal(account);
  });
}

async function showAdminDashboardReal(account) {
  currentAccountRole = "admin";
  window.currentAccountRole = currentAccountRole;
  currentAccountData = account || {};
  hideSessionPages();

  const dash = $("adminDashboard");
  if (dash) dash.classList.remove("hidden");

  if ($("adminWelcome")) {
    $("adminWelcome").textContent = "Welcome " + (account.fullName || account.username || currentUser) + " - system-wide activity overview";
  }

  await loadAdminDashboard();
}


let teacherDashboardStudentsCache = [];

function calculateStreakFromDates(dateSet) {
  const dates = Array.from(dateSet || []).sort();
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak || 1;
}

function getActivityStatus(activeDays) {
  if (activeDays >= 10) return "Very Active";
  if (activeDays >= 5) return "Active";
  if (activeDays >= 2) return "Occasional";
  return "Needs Encouragement";
}

function formatChallengeSummary(stats) {
  const summary = getChallengeSummary(stats);
  return `${summary.correct}/${summary.attempts}`;
}

function formatSifirGoSummary(stats) {
  const summary = getSifirGoSummary(stats);
  return `${summary.setsCompleted} set`;
}

function buildFastStudentSummary(s) {
  const progress = s.progress || {};
  const coinProgress = s.coinProgress || {};
  const records = s.sifirRecords || {};
  const last = s.lastData || {};
  const challengeStats = normalizeChallengeStats(s.challengeStats || last.challengeStats || {});
  const challengeSummary = getChallengeSummary(challengeStats);
  const sifirGoStats = normalizeSifirGoStats(s.sifirGoStats || last.sifirGoStats || {});
  const sifirGoSummary = getSifirGoSummary(sifirGoStats);

  const activeDays = new Set(Object.keys(progress).filter(d => Number(progress[d] || 0) > 0));
  const streak = calculateStreakFromDates(activeDays);
  const totalAttempts = Object.values(progress).reduce((a, b) => a + Number(b || 0), 0);
  const sifirKeys = Object.keys(records || {});

  let bestTime = null;
  sifirKeys.forEach(k => {
    const rec = records[k] || {};
    const t = Number(rec.bestTime || 0);
    if (t > 0 && (!bestTime || t < bestTime)) bestTime = t;
  });

  // fallback if summary has not been built yet but lastData exists
  if (!bestTime && Number(last.time || 0) > 0) bestTime = Number(last.time);

  const coinsFromDays = Object.values(coinProgress).reduce((a, b) => a + Number(b || 0), 0);
  const coins = Math.max(Number(s.coins || 0), Number(last.coins || 0), coinsFromDays);
  const xp = Number(s.xp || last.xpAwarded || 0);
  const activeScore = coins + (activeDays.size * 10) + (streak * 5) + (sifirKeys.length * 15) + (challengeSummary.correct * 4) + (sifirGoSummary.setsCompleted * 12);
  const status = getActivityStatus(activeDays.size);

  return {
    ...s,
    lastData: last,
    challengeStats,
    challengeAttempts: challengeSummary.attempts,
    challengeCorrect: challengeSummary.correct,
    challengeAccuracy: challengeSummary.accuracy,
    challengeBestStreak: challengeSummary.bestStreak,
    challengeLevel1Correct: challengeSummary.level1Correct,
    challengeLevel2Correct: challengeSummary.level2Correct,
    sifirGoStats,
    sifirGoSets: sifirGoSummary.setsCompleted,
    sifirGoAttempts: sifirGoSummary.totalAttempts,
    sifirGoCorrect: sifirGoSummary.totalCorrect,
    sifirGoRows: sifirGoSummary.rowsCompleted,
    sifirGoAccuracy: sifirGoSummary.accuracy,
    activeDays,
    streak,
    totalAttempts,
    sifirCount: sifirKeys.length || (last.sifir ? 1 : 0),
    bestTime,
    coins,
    xp,
    activeScore,
    status
  };
}

function updatePowerSummary(summary) {
  const totalStudents = summary.length;
  const totalAttempts = summary.reduce((a, s) => a + Number(s.totalAttempts || 0), 0);
  const challengeCorrect = summary.reduce((a, s) => a + Number(s.challengeCorrect || 0), 0);
  const goSets = summary.reduce((a, s) => a + Number(s.sifirGoSets || 0), 0);
  const mostActive = summary.length ? [...summary].sort((a,b)=>Number(b.activeScore||0)-Number(a.activeScore||0))[0] : null;
  const needsSupport = summary.filter(s => s.status === "Needs Encouragement").length;

  if ($("sumTotalStudents")) $("sumTotalStudents").textContent = totalStudents;
  if ($("sumTotalAttempts")) $("sumTotalAttempts").textContent = totalAttempts;
  if ($("sumMostActive")) $("sumMostActive").textContent = mostActive ? (mostActive.fullName || mostActive.username) : "-";
  if ($("sumNeedsSupport")) $("sumNeedsSupport").textContent = needsSupport;
  if ($("sumChallengeCorrect")) $("sumChallengeCorrect").textContent = challengeCorrect;
  if ($("sumGoSets")) $("sumGoSets").textContent = goSets;

  const topActive = [...summary].sort((a,b)=>Number(b.activeScore||0)-Number(a.activeScore||0)).slice(0,5);
  const fastest = [...summary].filter(s=>s.bestTime).sort((a,b)=>Number(a.bestTime)-Number(b.bestTime)).slice(0,5);
  const support = [...summary].filter(s=>s.status === "Needs Encouragement").slice(0,5);

  if ($("topActiveList")) {
    $("topActiveList").innerHTML = topActive.length ? topActive.map((s,i)=>`
      <div class="leader-row"><b>${i+1}. ${s.fullName || s.username}</b><span>${s.activeScore} pts</span></div>
    `).join("") : "No data yet.";
  }

  if ($("fastestList")) {
    $("fastestList").innerHTML = fastest.length ? fastest.map((s,i)=>`
      <div class="leader-row"><b>${i+1}. ${s.fullName || s.username}</b><span>${s.bestTime}s</span></div>
    `).join("") : "No data yet.";
  }

  if ($("supportList")) {
    $("supportList").innerHTML = support.length ? support.map((s)=>`
      <div class="leader-row warning"><b>${s.fullName || s.username}</b><span>${s.activeDays.size} day</span></div>
    `).join("") : "No student needs support.";
  }
}

function renderTeacherStudents(students) {
  const table = $("teacherStudentTable");
  if (!table) return;

  teacherDashboardStudentsCache = students || [];

  const keyword = ($("teacherSearchInput") ? $("teacherSearchInput").value : "").toLowerCase().trim();
  let summary = teacherDashboardStudentsCache.map(buildFastStudentSummary);

  teacherDashboardGroupedStudents = {};
  summary.forEach(s => {
    teacherDashboardGroupedStudents[s.username] = s;
  });

  if (keyword) {
    summary = summary.filter(s => {
      const combined = [
        s.username, s.fullName, s.studentClass, s.className, s.schoolName, s.stateName, s.status
      ].join(" ").toLowerCase();
      return combined.includes(keyword);
    });
  }

  updatePowerSummary(Object.values(teacherDashboardGroupedStudents));

  if (!summary.length) {
    table.innerHTML = `<tr><td colspan="14">No student summary found.</td></tr>`;
    return;
  }

  summary.sort((a, b) => Number(b.activeScore || 0) - Number(a.activeScore || 0));

  table.innerHTML = summary.map(s => `
    <tr class="student-summary-row" data-username="${s.username}">
      <td><b>${s.fullName || s.username || "-"}</b><br><small>${s.username || ""}</small></td>
      <td>${s.studentClass || s.className || "-"}</td>
      <td>${s.schoolName || "-"}</td>
      <td>${s.stateName || "-"}</td>
      <td>${s.coins}</td>
      <td>${s.xp}</td>
      <td>${s.totalAttempts}</td>
      <td>${s.sifirCount} sifir</td>
      <td><b>${formatChallengeSummary(s.challengeStats)}</b><br><small>L1 ${s.challengeLevel1Correct} • L2 ${s.challengeLevel2Correct} • ${s.challengeAccuracy}%</small></td>
      <td><b>${formatSifirGoSummary(s.sifirGoStats)}</b><br><small>${s.sifirGoRows} petak • ${s.sifirGoAccuracy}%</small></td>
      <td>${s.bestTime ? s.bestTime + "s" : "-"}</td>
      <td>${s.activeDays.size}</td>
      <td>${s.activeScore}</td>
      <td>${s.status}</td>
    </tr>
  `).join("");
}

async function openStudentDetail(username) {
  const s = teacherDashboardGroupedStudents[username];
  if (!s) return;

  const modal = $("studentDetailModal");
  const title = $("studentDetailTitle");
  const subtitle = $("studentDetailSubtitle");
  const summaryBox = $("studentDetailSummary");
  const attemptsBody = $("studentDetailAttempts");

  if (!modal || !title || !summaryBox || !attemptsBody) return;

  title.textContent = s.fullName || s.username || "Student Details";
  subtitle.textContent = `${s.username || ""} • ${s.studentClass || s.className || "-"} • ${s.schoolName || "-"}`;

  summaryBox.innerHTML = `
    <div class="detail-summary-card"><span>Total Attempts</span><b>${s.totalAttempts}</b></div>
    <div class="detail-summary-card"><span>Sifir Completed</span><b>${s.sifirCount}</b></div>
    <div class="detail-summary-card"><span>Challenge</span><b>${formatChallengeSummary(s.challengeStats)}</b></div>
    <div class="detail-summary-card"><span>Challenge Accuracy</span><b>${s.challengeAccuracy}%</b></div>
    <div class="detail-summary-card"><span>Sifir Go</span><b>${formatSifirGoSummary(s.sifirGoStats)}</b></div>
    <div class="detail-summary-card"><span>Best Time</span><b>${s.bestTime ? s.bestTime + "s" : "-"}</b></div>
    <div class="detail-summary-card"><span>Active Days</span><b>${s.activeDays.size}</b></div>
    <div class="detail-summary-card"><span>Active Score</span><b>${s.activeScore}</b></div>
    <div class="detail-summary-card"><span>Status</span><b style="font-size:18px">${s.status}</b></div>
  `;

  attemptsBody.innerHTML = `<tr><td colspan="6">Loading attempt details...</td></tr>`;
  modal.classList.remove("hidden");

  if (typeof window.getStudentProgressLogs !== "function") {
    attemptsBody.innerHTML = `<tr><td colspan="6">Detail function not ready.</td></tr>`;
    return;
  }

  const result = await window.getStudentProgressLogs(username);
  if (!result.ok) {
    attemptsBody.innerHTML = `<tr><td colspan="6">${result.message || "Failed to load details."}</td></tr>`;
    return;
  }

  const attempts = result.logs || [];
  if (!attempts.length) {
    attemptsBody.innerHTML = `<tr><td colspan="6">No detailed attempts found.</td></tr>`;
    return;
  }

  currentStudentDetailAttempts = attempts;
  currentStudentDetailSort = { key: "completedAt", dir: "desc" };
  renderStudentDetailAttempts();
}


document.addEventListener("click", async (event) => {
  const choiceButton = event.target && event.target.closest ? event.target.closest(".challenge-choice-button") : null;
  if (choiceButton) {
    recordChallengeAnswer(Number(choiceButton.dataset.challengeChoice || 0));
    return;
  }

  const challengeKey = event.target && event.target.closest ? event.target.closest("[data-challenge-key]") : null;
  if (challengeKey) {
    handleChallengeKey(challengeKey.dataset.challengeKey || "");
    return;
  }

  const goDigitButton = event.target && event.target.closest ? event.target.closest(".go-digit-button") : null;
  if (goDigitButton) {
    setSifirGoDigit(goDigitButton.dataset.goDigitType || "", goDigitButton.dataset.goDigit || "");
    return;
  }

  const goAnswerCell = event.target && event.target.closest ? event.target.closest("[data-go-answer-row]") : null;
  if (goAnswerCell) {
    setSifirGoActiveRow(goAnswerCell.dataset.goAnswerRow || "");
    return;
  }

  const goKey = event.target && event.target.closest ? event.target.closest("[data-go-key]") : null;
  if (goKey) {
    handleSifirGoKey(goKey.dataset.goKey || "");
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#goResetButton, #goResetAnswersButton")) {
    resetSifirGoAnswers();
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#challengeLevel1Button")) {
    setChallengeLevel(1);
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#challengeLevel2Button")) {
    setChallengeLevel(2);
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#openSifir2DigitButton")) {
    login(currentUser, currentStudentDisplayName || currentUser);
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#openSifirChallengeButton")) {
    showStudentChallengePage();
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#openSifirGoButton")) {
    showStudentGoPage();
    return;
  }

  if (event.target && event.target.closest && event.target.closest("#studentMenuButton, #challengeMenuButton, #goMenuButton")) {
    showStudentActivityPage(currentUser, currentStudentDisplayName || currentUser);
    return;
  }

  if (event.target && event.target.id === "createClassButton") {
    const className = $("newClassName").value.trim();
    const schoolName = $("newClassSchool").value.trim();
    const stateName = $("newClassState").value.trim();

    if (!className || !schoolName || !stateName) {
      $("classCreateMessage").textContent = "Please complete class name, school and state.";
      return;
    }

    $("classCreateMessage").textContent = "Creating class...";
    const result = await window.createClassFirebase(currentUser, className, schoolName, stateName);
    if (!result.ok) {
      $("classCreateMessage").textContent = "Failed: " + result.message;
      return;
    }

    $("classCreateMessage").innerHTML = `Class created. Share this code with students: <b>${result.classCode}</b>`;
    $("newClassName").value = "";
    await loadTeacherDashboard();
  }

  if (event.target && event.target.id === "reloadDashboardButton") {
    await loadTeacherDashboard();
  }

  if (event.target && event.target.id === "adminReloadButton") {
    await loadAdminDashboard();
  }
});

document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "teacherSearchInput") {
    renderTeacherStudents(teacherDashboardStudentsCache || []);
  }

  if (event.target && event.target.id === "adminSearchInput") {
    renderAdminDashboard();
  }
});



function applyFirebaseAccountData(account) {
  if (!account || !currentUser) return;

  const lastData = account.lastData || {};
  const progress = account.progress || {};
  const coinProgress = account.coinProgress || {};
  const sifirRecords = account.sifirRecords || {};
  const challengeStats = account.challengeStats || lastData.challengeStats || {};
  const sifirGoStats = account.sifirGoStats || lastData.sifirGoStats || {};

  const xp = Math.max(Number(account.xp || 0), Number(lastData.xp || lastData.xpAwarded || 0));
  const level = Number(account.level || Math.floor(xp / 100) + 1);
  const firebaseCoins = Math.max(Number(account.coins || 0), Number(lastData.coins || 0));

  localStorage.setItem("sifirria_progress_" + currentUser, JSON.stringify(progress));
  localStorage.setItem("sifirria_coin_progress_" + currentUser, JSON.stringify(coinProgress));
  localStorage.setItem("sifirria_sifir_records_" + currentUser, JSON.stringify(sifirRecords));
  localStorage.setItem("sifirria_challenge_stats_" + currentUser, JSON.stringify(normalizeChallengeStats(challengeStats)));
  localStorage.setItem("sifirria_go_stats_" + currentUser, JSON.stringify(normalizeSifirGoStats(sifirGoStats)));
  localStorage.setItem("sifirria_player_stats_" + currentUser, JSON.stringify({ xp, level }));

  coins = firebaseCoins;
}

function syncCurrentAccountToFirebase(extraData = {}) {
  if (typeof window.syncAccountToFirebase !== "function" || !currentUser) return;

  const stats = loadPlayerStats();
  const accountData = {
    username: currentUser,
    classCode: currentClassCode,
    coins: coins,
    xp: Number(stats.xp || 0),
    level: Number(stats.level || Math.floor(Number(stats.xp || 0) / 100) + 1),
    progress: loadProgress(),
    coinProgress: loadCoins(),
    sifirRecords: loadSifirRecords(),
    challengeStats: loadChallengeStats(),
    sifirGoStats: loadSifirGoStats(),
    ...extraData
  };

  window.syncAccountToFirebase(currentUser, accountData);
}


function saveToFirebaseSafe(data) {
  if (typeof window.saveProgressToFirebase === "function") {
    window.saveProgressToFirebase(data);
  } else {
    console.warn("Firebase not ready yet:", data);
  }
}

const $ = (id) => document.getElementById(id);
    const rows = [1,2,3,4,5,6,7,8,9];

    let authMode = "login";
    window.sifirriaAuthMode = authMode;
    if (document.body) document.body.dataset.authMode = authMode;
let currentUser = "";
    let firstDigit = null;
    let secondDigit = null;
    let selectedFirst = false;
    let selectedSecond = false;
    let answers = {};
    let rewardedRows = {};
    let seconds = 0;
    let isStarted = false;
    let coins = 0;
    let timer = null;
    let blinkCount = 0;
    let blinkTimer = null;
    let extraBonusGiven = false;
    let roundCompleted = false;
    let userIsManualScrolling = false;
    let manualScrollTimer = null;
    let programmaticScrollTimer = null;
    let lastScrollY = window.scrollY || 0;
    let answerCombo = 0;
    const MAX_RECORD_REWARDS = 2;
    const FIRST_RECORD_COINS = 50;
    const SPEED_RECORD_COINS = 75;
    const COMPLETE_XP = 25;
    const RECORD_XP = 50;

    let currentClassCode = "";
    let classRivalCache = {};

    function getFriendlyNameFromAccount(account) {
      return (account && (account.fullName || account.username)) || currentUser || "your classmate";
    }

    async function updateClassRivalMission() {
      const sifir = getSifirNumber();
      if (!sifir || !currentClassCode || typeof window.getClassTopForSifir !== "function") return;

      const cacheKey = currentClassCode + "_" + sifir;
      let result = classRivalCache[cacheKey];

      if (!result) {
        result = await window.getClassTopForSifir(currentClassCode, sifir);
        classRivalCache[cacheKey] = result;
      }

      if (!result || !result.ok || !result.topStudent) {
        if ($("missionText")) $("missionText").innerHTML = `Complete Sifir ${sifir} and become the first top learner in your class.`;
        if ($("missionBadge")) $("missionBadge").textContent = "Be the first champion";
        return;
      }

      const top = result.topStudent;
      const isMe = top.username === currentUser;

      if (isMe) {
        if ($("missionText")) $("missionText").innerHTML = `You are currently the class leader for Sifir ${sifir} with <b>${top.bestTime}s</b>. Defend your record!`;
        if ($("missionBadge")) $("missionBadge").textContent = "Class leader";
      } else {
        if ($("missionText")) $("missionText").innerHTML = `Try to do better than <b>${top.fullName}</b> (${top.bestTime}s)`;
        if ($("missionBadge")) $("missionBadge").textContent = `Target: under ${top.bestTime}s`;
      }
    }


    function isMobileView() {
      return window.matchMedia("(max-width: 820px)").matches;
    }

    function markManualScroll() {
      if (programmaticScrollTimer) return;
      userIsManualScrolling = true;
      clearTimeout(manualScrollTimer);
      manualScrollTimer = setTimeout(() => {
        userIsManualScrolling = false;
      }, 1100);
    }

    window.addEventListener("wheel", markManualScroll, { passive: true });
    window.addEventListener("touchmove", markManualScroll, { passive: true });
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) markManualScroll();
    }, { passive: true });
    window.addEventListener("scroll", () => {
      if (programmaticScrollTimer) { lastScrollY = window.scrollY || 0; return; }
      const nowY = window.scrollY || 0;
      if (Math.abs(nowY - lastScrollY) > 8) markManualScroll();
      lastScrollY = nowY;
    }, { passive: true });

    function setActiveAnswer(input) {
      document.querySelectorAll('.answer-row.active-answer').forEach(row => row.classList.remove('active-answer'));
      if (input && input.closest('.answer-row')) {
        input.closest('.answer-row').classList.add('active-answer');
        input.classList.add('learning-focus-pulse');
        setTimeout(() => input.classList.remove('learning-focus-pulse'), 650);
      }
    }

    function smoothScrollToElement(el, delay = 100, positionRatio = 0.22, force = false) {
      if (!el) return;
      setTimeout(() => {
        if (userIsManualScrolling && !force) return;

        const rect = el.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const targetY = window.scrollY + rect.top - (viewportHeight * positionRatio);

        programmaticScrollTimer = true;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth"
        });
        setTimeout(() => { programmaticScrollTimer = null; lastScrollY = window.scrollY || 0; }, 850);
      }, delay);
    }

    function getVisibleViewportHeight() {
      // visualViewport gives the real visible area when the phone keyboard is open.
      if (window.visualViewport && window.visualViewport.height) return window.visualViewport.height;
      return window.innerHeight || document.documentElement.clientHeight;
    }

    function smartScrollToInput(input, delay = 80, force = false) {
      if (!input) return;
      setTimeout(() => {
        if (userIsManualScrolling && !force) return;

        setActiveAnswer(input);

        const rect = input.getBoundingClientRect();
        const visibleHeight = getVisibleViewportHeight();
        const keyboardLikelyOpen = window.visualViewport && window.visualViewport.height < window.innerHeight * 0.82;

        // On phone, do not center the answer too low because the keyboard can cover it.
        // Put the active answer row around the upper-middle area so both the diagonal boxes
        // and the answer box remain visible together.
        const safeTop = isMobileView() ? 78 : 90;
        const safeBottom = isMobileView() ? visibleHeight - (keyboardLikelyOpen ? 145 : 95) : visibleHeight * 0.76;
        const isCovered = rect.top < safeTop || rect.bottom > safeBottom;

        if (!force && !isCovered) return;

        const rowEl = input.closest('.answer-row') || input;
        const rowRect = rowEl.getBoundingClientRect();
        const preferredTop = isMobileView()
          ? (keyboardLikelyOpen ? visibleHeight * 0.20 : visibleHeight * 0.26)
          : visibleHeight * 0.38;

        const targetY = window.scrollY + rowRect.top - preferredTop;

        programmaticScrollTimer = true;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth"
        });
        setTimeout(() => { programmaticScrollTimer = null; lastScrollY = window.scrollY || 0; }, 900);
      }, delay);
    }

    function scrollAfterSifirSelection(whichSelected) {
      setTimeout(() => {
        if (selectedFirst && selectedSecond) {
          smoothScrollToElement(document.querySelector(".bones-area"), 80, isMobileView() ? 0.13 : 0.18, true);
          return;
        }

        if (whichSelected === "first" && selectedFirst && !selectedSecond) {
          smoothScrollToElement($('secondGrid'), 80, isMobileView() ? 0.32 : 0.38, true);
          return;
        }

        if (whichSelected === "second" && selectedSecond && !selectedFirst) {
          smoothScrollToElement($('firstGrid'), 80, isMobileView() ? 0.32 : 0.38, true);
        }
      }, 180);
    }

    function todayKey() {
      return new Date().toISOString().slice(0, 10);
    }
    function getDateKey(offset) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      return d.toISOString().slice(0, 10);
    }
    function loadProgress() {
      return JSON.parse(localStorage.getItem("sifirria_progress_" + currentUser) || "{}");
    }
    function saveProgress(p) {
      localStorage.setItem("sifirria_progress_" + currentUser, JSON.stringify(p));
    }
    function loadCoins() {
      return JSON.parse(localStorage.getItem("sifirria_coin_progress_" + currentUser) || "{}");
    }
    function saveCoins(p) {
      localStorage.setItem("sifirria_coin_progress_" + currentUser, JSON.stringify(p));
    }
    function totalCoins() {
      return Object.values(loadCoins()).reduce((a,b)=>a+Number(b),0);
    }
    function getStreak(progress) {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const key = getDateKey(i);
        if ((progress[key] || 0) > 0) streak++;
        else break;
      }
      return streak;
    }

    function loadPlayerStats() {
      return JSON.parse(localStorage.getItem("sifirria_player_stats_" + currentUser) || '{"xp":0,"level":1}');
    }
    function savePlayerStats(stats) {
      localStorage.setItem("sifirria_player_stats_" + currentUser, JSON.stringify(stats));
    }
    function addXP(amount) {
      const stats = loadPlayerStats();
      stats.xp = Number(stats.xp || 0) + amount;
      stats.level = Math.floor(stats.xp / 100) + 1;
      savePlayerStats(stats);
      return stats;
    }
    function getSifirNumber() {
      if (firstDigit === null || secondDigit === null) return "";
      return String(firstDigit * 10 + secondDigit);
    }
    function loadSifirRecords() {
      return JSON.parse(localStorage.getItem("sifirria_sifir_records_" + currentUser) || "{}");
    }
    function saveSifirRecords(records) {
      localStorage.setItem("sifirria_sifir_records_" + currentUser, JSON.stringify(records));
    }
    function getCurrentSifirRecord() {
      const n = getSifirNumber();
      if (!n) return null;
      const records = loadSifirRecords();
      return records[n] || { bestTime: null, rewards: 0, attempts: 0, completed: 0 };
    }
    function saveCurrentSifirRecord(record) {
      const n = getSifirNumber();
      if (!n) return;
      const records = loadSifirRecords();
      records[n] = record;
      saveSifirRecords(records);
    }
    function addCoinsToday(amount) {
      if (amount <= 0) return;
      const coinProgress = loadCoins();
      coinProgress[todayKey()] = (coinProgress[todayKey()] || 0) + amount;
      saveCoins(coinProgress);
      coins += amount;
    }
    function processCompletionReward(currentTime) {
      const record = getCurrentSifirRecord() || { bestTime: null, rewards: 0, attempts: 0, completed: 0 };
      record.attempts = Number(record.attempts || 0) + 1;
      record.completed = Number(record.completed || 0) + 1;

      let coinsAwarded = 0;
      let xpAwarded = COMPLETE_XP;
      let rewardType = "no_reward";
      let message = "Perfect round! Try to beat your best time for coins.";

      if (record.bestTime === null) {
        record.bestTime = currentTime;
        record.rewards = 1;
        coinsAwarded = FIRST_RECORD_COINS;
        xpAwarded += RECORD_XP;
        rewardType = "first_clear";
        message = `First clear for Sifir ${getSifirNumber()}! +${coinsAwarded} coins.`;
      } else if (currentTime < record.bestTime && Number(record.rewards || 0) < MAX_RECORD_REWARDS) {
        const oldBest = record.bestTime;
        record.bestTime = currentTime;
        record.rewards = Number(record.rewards || 0) + 1;
        coinsAwarded = SPEED_RECORD_COINS;
        xpAwarded += RECORD_XP;
        rewardType = "new_record";
        message = `New record! ${oldBest}s → ${currentTime}s. +${coinsAwarded} coins.`;
      } else if (currentTime < record.bestTime && Number(record.rewards || 0) >= MAX_RECORD_REWARDS) {
        record.bestTime = currentTime;
        rewardType = "record_no_coin";
        message = `New best time ${currentTime}s! Coin rewards for this sifir are already used.`;
      } else {
        const best = record.bestTime;
        const left = Math.max(0, MAX_RECORD_REWARDS - Number(record.rewards || 0));
        rewardType = left > 0 ? "slower" : "locked";
        message = left > 0
          ? `Completed! Best time is ${best}s. Finish faster next time to earn coins.`
          : `Completed! Coin reward limit reached for this sifir.`;
      }

      saveCurrentSifirRecord(record);
      addCoinsToday(coinsAwarded);
      const stats = addXP(xpAwarded);
      return { coinsAwarded, xpAwarded, record, stats, rewardType, message };
    }
    function updateGamificationPanel() {
      const stats = loadPlayerStats();
      const level = Math.floor(Number(stats.xp || 0) / 100) + 1;
      const xpIntoLevel = Number(stats.xp || 0) % 100;
      if ($("levelText")) $("levelText").textContent = "Level " + level;
      if ($("xpText")) $("xpText").textContent = xpIntoLevel + " / 100 XP";
      if ($("xpFill")) $("xpFill").style.width = xpIntoLevel + "%";

      const sifir = getSifirNumber();
      if (!sifir) {
        if ($("missionText")) $("missionText").textContent = "Choose two numbers to start your mission.";
        if ($("missionBadge")) $("missionBadge").textContent = "Ready";
        if ($("recordText")) $("recordText").textContent = "No sifir selected yet.";
        return;
      }
      const record = getCurrentSifirRecord() || { bestTime: null, rewards: 0, attempts: 0, completed: 0 };
      const rewardsLeft = Math.max(0, MAX_RECORD_REWARDS - Number(record.rewards || 0));
      if (record.bestTime === null) {
        if ($("missionText")) $("missionText").innerHTML = `Complete Sifir ${sifir} with all answers correct to earn your first reward.`;
        if ($("missionBadge")) $("missionBadge").textContent = "+" + FIRST_RECORD_COINS + " coins available";
        if ($("recordText")) $("recordText").textContent = "No best time yet. First clear will be recorded.";
        updateClassRivalMission();
      } else {
        if ($("missionText")) $("missionText").innerHTML = rewardsLeft > 0
          ? `Beat your best time for Sifir ${sifir}: <b>${record.bestTime}s</b>.`
          : `Practice Sifir ${sifir}. Coin rewards are complete, but your best time can still improve.`;
        if ($("missionBadge")) $("missionBadge").textContent = rewardsLeft > 0 ? `${rewardsLeft} coin reward left` : "Reward limit reached";
        if ($("recordText")) $("recordText").innerHTML = `Best: <b>${record.bestTime}s</b><br>Rewards used: <b>${record.rewards || 0}/${MAX_RECORD_REWARDS}</b><br>Completed: <b>${record.completed || 0}</b>`;
        updateClassRivalMission();
      }
    }

    // ================= PREMIUM AUDIO MURID MODE =================
    // Semua bunyi dijana secara offline menggunakan Web Audio API.
    // Suara cikgu menggunakan speechSynthesis peranti masing-masing.
    let premiumAudioCtx = null;
    let audioUnlocked = false;
    let lastSpokenText = "";
    let lastSpokenAt = 0;

    function getPremiumAudioCtx() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!premiumAudioCtx) premiumAudioCtx = new AudioCtx();
      if (premiumAudioCtx.state === "suspended") premiumAudioCtx.resume().catch(() => {});
      return premiumAudioCtx;
    }

    function unlockPremiumAudio() {
      if (audioUnlocked) return;
      const ctx = getPremiumAudioCtx();
      if (!ctx) return;
      audioUnlocked = true;
      playPremiumTone(440, 0.01, 0.001, "sine", 0);
    }

    function playPremiumTone(freq, duration = 0.12, volume = 0.1, type = "sine", delay = 0) {
      try {
        const ctx = getPremiumAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + delay;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.03);
      } catch {}
    }

    function playClickSound() {
      playPremiumTone(520, 0.045, 0.08, "triangle", 0);
      playPremiumTone(760, 0.045, 0.045, "triangle", 0.035);
    }

    function playDing() {
      playCorrectRandom();
    }

    function playBuzzer() {
      playPremiumTone(220, 0.11, 0.10, "sawtooth", 0);
      playPremiumTone(165, 0.12, 0.08, "square", 0.10);
    }

    function playCorrectRandom() {
      const pattern = Math.floor(Math.random() * 5);
      if (pattern === 0) {
        playPremiumTone(880, 0.10, 0.11, "sine", 0);
        playPremiumTone(1175, 0.12, 0.09, "sine", 0.07);
      } else if (pattern === 1) {
        playPremiumTone(784, 0.08, 0.10, "triangle", 0);
        playPremiumTone(1046, 0.10, 0.09, "triangle", 0.06);
        playPremiumTone(1318, 0.12, 0.07, "triangle", 0.13);
      } else if (pattern === 2) {
        playPremiumTone(988, 0.07, 0.10, "sine", 0);
        playPremiumTone(1480, 0.11, 0.08, "sine", 0.08);
      } else if (pattern === 3) {
        playPremiumTone(660, 0.08, 0.08, "triangle", 0);
        playPremiumTone(990, 0.08, 0.08, "triangle", 0.05);
        playPremiumTone(1320, 0.10, 0.07, "triangle", 0.11);
      } else {
        playPremiumTone(523, 0.06, 0.08, "sine", 0);
        playPremiumTone(659, 0.06, 0.08, "sine", 0.05);
        playPremiumTone(784, 0.10, 0.08, "sine", 0.10);
      }
    }

    function getPraiseText() {
      const normal = [
        "Good job!",
        "Great work!",
        "Awesome!",
        "Nice work!",
        "Well done!",
        "Fantastic!",
        "Excellent!",
        "Keep it up!"
      ];
      const combo = [
        `Combo ${answerCombo}!`,
        `Great streak! Combo ${answerCombo}!`,
        `You are on fire! Combo ${answerCombo}!`,
        `Amazing! ${answerCombo} correct in a row!`
      ];
      const list = answerCombo >= 3 ? combo : normal;
      return list[Math.floor(Math.random() * list.length)];
    }

    function getShortPraise() {
      const words = ["Great!", "Nice!", "Awesome!", "Well done!", "Excellent!"];
      return words[Math.floor(Math.random() * words.length)];
    }

    function getTryAgainText() {
      const words = ["Try again", "Almost there", "Check the diagonal again", "You can do it", "Look carefully and try again"];
      return words[Math.floor(Math.random() * words.length)];
    }

    function playSuccessMelody() {
      [523, 659, 784, 1046].forEach((freq, i) => {
        playPremiumTone(freq, 0.14, 0.11, "sine", i * 0.12);
      });
      playPremiumTone(1318, 0.25, 0.09, "triangle", 0.48);
    }



    function playCinematicVictory() {
      try {
        unlockPremiumAudio();
        const fanfare = [
          [523, 0.16, 0.16, "triangle", 0.00], [659, 0.16, 0.15, "triangle", 0.14],
          [784, 0.18, 0.15, "triangle", 0.28], [1046, 0.28, 0.13, "sine", 0.44],
          [784, 0.18, 0.10, "triangle", 0.78], [988, 0.18, 0.10, "triangle", 0.92],
          [1175, 0.36, 0.12, "sine", 1.08]
        ];
        fanfare.forEach(([freq, dur, vol, type, delay]) => playPremiumTone(freq, dur, vol, type, delay));
        [523, 659, 784, 1046].forEach((freq, i) => playPremiumTone(freq, 0.55, 0.055, "sine", 1.42 + i * 0.025));
      } catch {}
    }

    function cinematicConfettiBlast() {
      const colors = ["#fff200", "#22c55e", "#0ea5e9", "#f97316", "#ef4444", "#a855f7"];
      for (let i = 0; i < 90; i++) {
        const c = document.createElement("div");
        c.className = "cinematic-confetti";
        c.style.left = Math.random() * 100 + "vw";
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDuration = (1.7 + Math.random() * 1.8) + "s";
        c.style.animationDelay = (Math.random() * 0.35) + "s";
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3900);
      }
      for (let i = 0; i < 22; i++) {
        const s = document.createElement("div");
        s.className = "cinematic-star";
        s.textContent = ["⭐", "✨", "🎉", "🪙"][Math.floor(Math.random() * 4)];
        s.style.left = "50vw";
        s.style.top = "45vh";
        s.style.setProperty("--x", (Math.random() * 520 - 260) + "px");
        s.style.setProperty("--y", (Math.random() * 360 - 180) + "px");
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1500);
      }
    }

    function showCinematicEnding(finalSeconds, rewardText = "Victory") {
      const overlay = document.getElementById("cinematicOverlay");
      if (!overlay) return;
      const timeEl = document.getElementById("cinematicTime");
      const rewardEl = document.getElementById("cinematicReward");
      if (timeEl) timeEl.textContent = finalSeconds + "s";
      if (rewardEl) rewardEl.textContent = rewardText;
      overlay.classList.remove("hidden");
      cinematicConfettiBlast();
      setTimeout(() => speakText("Congratulations! You are a math champion!", true), 500);
    }

    function closeCinematicEnding() {
      const overlay = document.getElementById("cinematicOverlay");
      if (overlay) overlay.classList.add("hidden");
    }

    function chooseTeacherVoice() {
      if (!("speechSynthesis" in window)) return null;
      const voices = speechSynthesis.getVoices() || [];
      return voices.find(v => /en-US/i.test(v.lang))
          || voices.find(v => /en-GB/i.test(v.lang))
          || voices.find(v => /female|woman|zira|samantha|google/i.test(v.name))
          || voices.find(v => /en/i.test(v.lang))
          || voices[0]
          || null;
    }

    function speakText(text, force = false) {
      try {
        if (!("speechSynthesis" in window)) return;
        const now = Date.now();
        if (!force && text === lastSpokenText && now - lastSpokenAt < 1200) return;
        lastSpokenText = text;
        lastSpokenAt = now;
        speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        const voice = chooseTeacherVoice();
        if (voice) utter.voice = voice;
        utter.lang = voice?.lang || "en-US";
        utter.rate = 0.95;
        utter.pitch = 1.08;
        utter.volume = 1;
        speechSynthesis.speak(utter);
      } catch {}
    }

    // Delegated click sound: berfungsi juga untuk button yang dijana selepas page load.
    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        unlockPremiumAudio();
        playClickSound();
      }
    }, { passive: true });

    document.addEventListener("touchstart", unlockPremiumAudio, { passive: true, once: true });
    document.addEventListener("mousedown", unlockPremiumAudio, { passive: true, once: true });

    function setAuthMode(mode) {
      authMode = mode;
      window.sifirriaAuthMode = mode;
      if (document.body) document.body.dataset.authMode = mode;
      const isSignup = mode === "signup";
      const isAdmin = mode === "admin";
      $("loginTab").classList.toggle("active", mode === "login");
      $("signupTab").classList.toggle("active", isSignup);
      if ($("adminLoginTab")) $("adminLoginTab").classList.toggle("active", isAdmin);
      $("signupFields").classList.toggle("hidden", !isSignup);
      if ($("signupProfileFields")) $("signupProfileFields").classList.toggle("hidden", !isSignup);
      if ($("roleFields")) $("roleFields").classList.toggle("hidden", !isSignup);
      toggleSignupRoleFields();
      if ($("signupProfileFields")) $("signupProfileFields").classList.toggle("hidden", !isSignup);
      $("authButton").textContent = isAdmin ? "LOGIN ADMIN" : mode === "login" ? "LOGIN" : "REGISTER";
      $("loginSubtitle").textContent = isAdmin
        ? "Admin login is only for existing admin accounts."
        : mode === "login"
          ? "Log in to start building 2-digit multiplication."
          : "Register a new student or teacher account to use the app.";
      $("loginError").textContent = "";
    }

    window.sifirriaSetAuthMode = setAuthMode;
    $("loginTab").onclick = () => setAuthMode("login");
    $("signupTab").onclick = () => setAuthMode("signup");
    if ($("adminLoginTab")) $("adminLoginTab").onclick = () => setAuthMode("admin");
    $("authForm").onsubmit = async (e) => {
      e.preventDefault();

      const activeAuthMode = window.sifirriaAuthMode || (document.body && document.body.dataset.authMode) || authMode;
      authMode = activeAuthMode;
      const user = $("username").value.trim();
      const pass = $("password").value.trim();
      const confirm = $("confirmPassword") ? $("confirmPassword").value.trim() : "";

      if (!user || !pass) {
        $("loginError").textContent = "Please enter username and password.";
        return;
      }

      if (activeAuthMode === "login" && user === "demo" && pass === "1234") {
        if (typeof window.getFirebaseSyncData === "function") {
          const demoData = await window.getFirebaseSyncData(user);
          if (demoData.ok && demoData.account) {
            currentUser = user;
            window.currentUser = user;
            applyFirebaseAccountData(demoData.account);
            currentClassCode = (demoData.account.classCode || '').toUpperCase();
          }
        }
        showStudentApp(user, "Demo User");
        return;
      }

      if (activeAuthMode === "signup") {
        const role = $("accountType") ? $("accountType").value : "student";
        const fullName = $("fullName") ? $("fullName").value.trim() : "";
        const birthDate = $("birthDate") ? $("birthDate").value.trim() : "";
        const studentClass = $("studentClass") ? $("studentClass").value.trim() : "";
        const schoolName = $("schoolName") ? $("schoolName").value.trim() : "";
        const stateName = $("stateName") ? $("stateName").value.trim() : "";
        const schoolCode = $("schoolCode") ? $("schoolCode").value.trim().toUpperCase() : "";
        const district = $("districtName") ? $("districtName").value.trim() : "";
        const gender = $("gender") ? $("gender").value.trim() : "";
        const email = $("email") ? $("email").value.trim() : "";
        const classCode = $("classCodeInput") ? $("classCodeInput").value.trim().toUpperCase() : "";
        const teacherCode = $("teacherCodeInput") ? $("teacherCodeInput").value.trim() : "";

        if (!fullName || !schoolName || !stateName) {
          $("loginError").textContent = "Please complete full name, school and state.";
          return;
        }

        if (role === "student" && (!birthDate || !studentClass || !classCode)) {
          $("loginError").textContent = "Students must complete date of birth, class and class code.";
          return;
        }

        if (role === "teacher" && (!schoolCode || !birthDate || !district || !gender || !email)) {
          $("loginError").textContent = "Teachers must complete school code, date of birth, district, gender and email.";
          return;
        }

        if (role === "teacher" && teacherCode !== "GURU123") {
          $("loginError").textContent = "Invalid teacher code.";
          return;
        }

        if (role === "admin") {
          $("loginError").textContent = "Admin registration is disabled. Please use Admin Login.";
          return;
        }

        if (!/^[A-Za-z0-9!@#$%^&*._-]+$/.test(user) || user.includes(" ")) {
          $("loginError").textContent = "Username must be one word only.";
          return;
        }

        if (pass !== confirm) {
          $("loginError").textContent = "Passwords do not match.";
          return;
        }

        if (typeof window.registerAccountFirebase !== "function") {
          $("loginError").textContent = "Firebase is not ready yet. Please refresh and try again.";
          return;
        }

        const profile = {
          role,
          fullName,
          email: role === "teacher" ? email : "",
          birthDate,
          studentClass,
          schoolName,
          schoolInstitution: schoolName,
          workplace: schoolName,
          schoolCode: role === "teacher" ? schoolCode : "",
          stateName,
          state: stateName,
          district: role === "teacher" ? district : "",
          gender: role === "teacher" ? gender : "",
          classCode,
          teacherCode
        };

        $("loginError").textContent = "Creating account...";
        const result = await window.registerAccountFirebase(user, pass, profile);

        if (!result.ok) {
          $("loginError").textContent = result.message;
          return;
        }

        localStorage.setItem("user_profile_" + user, JSON.stringify({ username:user, password: pass, ...profile }));
        $("loginError").textContent = result.message;
        setAuthMode("login");
        return;
      }

      if (typeof window.loginAccountFirebase === "function") {
        $("loginError").textContent = "Checking account...";
        const result = await window.loginAccountFirebase(user, pass);

        if (result.ok) {
          const loggedInUser = result.username || user;
          currentUser = loggedInUser;
          window.currentUser = loggedInUser;
          currentAccountData = result.account || {};
          currentClassCode = (currentAccountData.classCode || '').toUpperCase();
          currentAccountRole = currentAccountData.role || "student";
          window.currentAccountRole = currentAccountRole;

          if (activeAuthMode === "admin") {
            if (currentAccountRole !== "admin") {
              $("loginError").textContent = "Only admin accounts can use Admin Login.";
              return;
            }
            await showAdminDashboard(currentAccountData);
            return;
          }

          if (currentAccountRole === "admin") {
            $("loginError").textContent = "Admin accounts must use the Admin Login button.";
            return;
          }

          applyFirebaseAccountData(currentAccountData);

          if (currentAccountRole === "teacher") {
            await showTeacherDashboard(currentAccountData);
          } else {
            showStudentApp(loggedInUser, currentAccountData.fullName || loggedInUser);
          }
          return;
        }

        $("loginError").textContent = result.message;
        return;
      }

      $("loginError").textContent = "Firebase is not ready yet. Please refresh and try again.";
    };

    function login(user, displayName) {
      prepareStudentSession(user, displayName);
      hideSessionPages();
      $("app").classList.remove("hidden");
      renderAll();
      updateStats();

      setTimeout(() => {
        speakText("Choose Numbers");
        let count = 0;
        const beep = setInterval(() => {
          playDing();
          count++;
          if (count === 3) clearInterval(beep);
        }, 400);
      }, 500);
    }

    $("logoutButton").onclick = () => location.reload();

    function digitOnly(value, maxLength) {
      return String(value).split("").filter(c => c >= "0" && c <= "9").join("").slice(0, maxLength);
    }

    function splitProduct(digit, row) {
      const product = digit * row;
      return { tens: Math.floor(product / 10), ones: product % 10 };
    }

    function correctAnswer(row) {
      if (firstDigit === null || secondDigit === null) return 0;
      return (firstDigit * 10 + secondDigit) * row;
    }

    function resetBeforeNewDigitSelection() {
      // Jika satu set sudah lengkap, klik sifir baharu bermaksud mula set baharu.
      // Jadi kedua-dua pilihan lama, jawapan, coin row, dan masa perlu dikosongkan dahulu.
      if (roundCompleted) {
        resetAnswers(true);
        return;
      }

      // Jika set belum lengkap, murid boleh pilih nombor dalam apa-apa susunan.
      // Contoh: tekan Second Number dahulu, kemudian tekan First Number.
      // Pilihan yang sudah dibuat tidak dibuang.
      resetAnswers(false);
    }

    function renderButtons() {
      const first = $("firstGrid");
      const second = $("secondGrid");
      first.innerHTML = "";
      second.innerHTML = "";

      rows.forEach((digit) => {
        const b = document.createElement("button");
        b.className = "sifir-button" + (firstDigit === digit ? " active-first" : "");
        b.textContent = digit;
        b.onclick = () => {
          resetBeforeNewDigitSelection();
          firstDigit = digit;
          selectedFirst = true;
          blinkCount = 0;
          renderAll();
          scrollAfterSifirSelection("first");
          startCountdownIfReady();
        };
        first.appendChild(b);

        const c = document.createElement("button");
        c.className = "sifir-button" + (secondDigit === digit ? " active-second" : "");
        c.textContent = digit;
        c.onclick = () => {
          resetBeforeNewDigitSelection();
          secondDigit = digit;
          selectedSecond = true;
          blinkCount = 0;
          renderAll();
          scrollAfterSifirSelection("second");
          startCountdownIfReady();
        };
        second.appendChild(c);
      });
    }

    function renderBone(containerId, digit, side) {
      const el = $(containerId);
      el.innerHTML = `<div class="bone-heading">${digit ?? ""}</div><div class="bone-box"></div>`;
      const box = el.querySelector(".bone-box");

      rows.forEach((row) => {
        const cell = document.createElement("div");
        cell.className = "bone-cell";
        if (digit !== null) {
          const value = splitProduct(digit, row);
          const yellow = side === "right" ? "yellow-bottom" : "yellow-top";
          cell.innerHTML = `
            <div class="yellow ${yellow}"></div>
            <div class="diagonal-line"></div>
            <div class="tens">${value.tens}</div>
            <div class="ones">${value.ones}</div>
          `;
        }
        box.appendChild(cell);
      });
    }

    function renderAnswers() {
      const number = firstDigit !== null && secondDigit !== null ? firstDigit * 10 + secondDigit : "";
      $("answerHeading").textContent = number ? "Multiplication " + number : "";
      const list = $("answerList");
      list.innerHTML = "";

      rows.forEach((row) => {
        const wrap = document.createElement("div");
        wrap.className = "answer-row";
        const input = document.createElement("input");
        const value = answers[row] || "";
        const ca = correctAnswer(row);
        const expectedLength = ca ? String(ca).length : 4;
        let status = "empty";

        if (value !== "") {
          status = value.length < expectedLength ? "typing" : (Number(value) === ca ? "correct" : "wrong");
        }

        input.className = "answer-input " + status;
        input.value = value;
        input.disabled = rewardedRows[row] === true;
        input.inputMode = "numeric";
        input.dataset.row = row;
        input.maxLength = expectedLength;

        input.oninput = (e) => {
          const cleanValue = digitOnly(e.target.value, expectedLength);
          e.target.value = cleanValue;
          // Jangan scroll semula ke kotak lama selepas jawapan betul.
          // Logik auto-focus dan auto-scroll dikawal dalam updateAnswer().
          const wasCorrect = ca && cleanValue.length === expectedLength && Number(cleanValue) === ca;
          updateAnswer(row, cleanValue, e.target);
          // Jangan tarik scroll balik ke kotak lama selepas jawapan betul.
          // Kalau belum lengkap atau salah, baru kekalkan kotak semasa dalam viewport.
          if (cleanValue.length > 0 && !wasCorrect) smartScrollToInput(e.target, 180, false);
        };

        input.onfocus = () => {
          smartScrollToInput(input, 120, false);
        };

        wrap.appendChild(input);
        list.appendChild(wrap);
      });
    }


    const tutorialSteps = [
      {
        title: "1. Know the multiplication number",
        text: "Choose two numbers. The first number becomes the tens digit and the second number becomes the ones digit. For example, 2 and 3 form multiplication by 23.",
        demoTitle: "Teacher demo first",
        demoHtml: `<div class="teacher-demo-stage">
          <div class="teacher-flow">
            <div class="teacher-flow-card">Choose<br>First Number</div>
            <div class="teacher-flow-card" style="background:#fff7ed;border-color:#f59e0b;font-size:30px;">2</div>
            <div class="teacher-flow-card">Tens</div>
            <div class="teacher-flow-card">Choose<br>Second Number</div>
            <div class="teacher-flow-card" style="background:#ecfeff;border-color:#0f766e;font-size:30px;">3</div>
            <div class="teacher-flow-card">Ones</div>
          </div>
          <div class="teacher-board"><span class="teacher-mini-step">✓</span>Gabungkan 2 dan 3 menjadi <b>Multiplication 23</b>.</div>
        </div>`,
        note: "After two numbers are selected, the Napier boxes will appear and students can start reading the diagonals."
      },
      {
        title: "2. Read the yellow diagonal boxes",
        text: "Each row shows a multiplication combination. Add the numbers in the yellow diagonal boxes. Look at the numbers on the same diagonal path, not just one box.",
        demoTitle: "How to read the diagonal",
        demoHtml: `<div class="teacher-demo-stage">
          <svg class="teacher-svg" viewBox="0 0 430 410" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Yellow diagonal boxes to read">
            <rect width="430" height="410" fill="#eefcff" rx="18"></rect>
            <g transform="translate(54,40)">
              <rect x="0" y="0" width="160" height="160" fill="#fff"></rect>
              <polygon points="0,160 160,0 160,160" fill="#fff200"></polygon>
              <line x1="0" y1="160" x2="160" y2="0" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="0" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="48" y="64" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">0</text>
              <text x="112" y="112" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">2</text>

              <rect x="160" y="0" width="160" height="160" fill="#fff"></rect>
              <polygon points="160,0 320,0 160,160" fill="#fff200"></polygon>
              <line x1="160" y1="160" x2="320" y2="0" stroke="#000" stroke-width="7"></line>
              <rect x="160" y="0" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="208" y="64" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">0</text>
              <text x="272" y="112" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">3</text>

              <rect x="0" y="160" width="160" height="160" fill="#fff"></rect>
              <polygon points="0,320 160,160 160,320" fill="#fff200"></polygon>
              <line x1="0" y1="320" x2="160" y2="160" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="160" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="48" y="224" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">0</text>
              <text x="112" y="272" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">4</text>

              <rect x="160" y="160" width="160" height="160" fill="#fff"></rect>
              <polygon points="160,160 320,160 160,320" fill="#fff200"></polygon>
              <line x1="160" y1="320" x2="320" y2="160" stroke="#000" stroke-width="7"></line>
              <rect x="160" y="160" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="208" y="224" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">0</text>
              <text x="272" y="272" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">6</text>

              <line x1="160" y1="0" x2="160" y2="320" stroke="#000" stroke-width="7"></line>
              <line x1="0" y1="160" x2="320" y2="160" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="0" width="320" height="320" fill="none" stroke="#000" stroke-width="9"></rect>

              <circle cx="112" cy="112" r="33" fill="none" stroke="#22c55e" stroke-width="6"></circle>
              <circle cx="208" cy="64" r="33" fill="none" stroke="#22c55e" stroke-width="6"></circle>
              <path class="teacher-highlight-dash" d="M112 112 C145 90,175 78,208 64" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8"></path>
            </g>
          </svg>
          <div class="teacher-board"><span class="teacher-mini-step">1</span>Read the numbers on the same yellow diagonal path. Then add those numbers.</div>
        </div>`,
        note: "Focus on the yellow diagonal path. The top labels are hidden so students are not distracted.",
        warning: "⚠️ Do not read only one box. Follow the whole diagonal path."
      },
      {
        title: "3. Add without carrying",
        text: "Some diagonals only need normal addition. For example, 2 + 0 = 2. Since the sum is less than 10, write it directly.",
        demoTitle: "Teacher demo: write the answer directly",
        demoHtml: `<div class="teacher-demo-stage">
          <svg class="teacher-svg" viewBox="0 0 430 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Example without carrying">
            <rect width="430" height="300" fill="#eefcff" rx="18"></rect>
            <text x="215" y="42" text-anchor="middle" font-size="27" font-weight="900" fill="#0f766e">EXAMPLE: 2 + 0 = 2</text>
            <g transform="translate(54,74)">
              <rect x="0" y="0" width="160" height="160" fill="#fff"></rect>
              <polygon points="0,160 160,0 160,160" fill="#fff200"></polygon>
              <line x1="0" y1="160" x2="160" y2="0" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="0" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="48" y="64" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">0</text>
              <text x="112" y="112" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">2</text>
              <rect x="160" y="0" width="160" height="160" fill="#fff"></rect>
              <polygon points="160,0 320,0 160,160" fill="#fff200"></polygon>
              <line x1="160" y1="160" x2="320" y2="0" stroke="#000" stroke-width="7"></line>
              <rect x="160" y="0" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="208" y="64" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">0</text>
              <text x="272" y="112" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">3</text>
              <line x1="160" y1="0" x2="160" y2="160" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="0" width="320" height="160" fill="none" stroke="#000" stroke-width="9"></rect>
              <circle cx="112" cy="112" r="33" fill="none" stroke="#22c55e" stroke-width="6"></circle>
              <circle cx="208" cy="64" r="33" fill="none" stroke="#22c55e" stroke-width="6"></circle>
              <path class="teacher-highlight-dash" d="M112 112 C145 90,175 78,208 64" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8"></path>
            </g>
          </svg>
          <div class="teacher-answer-row">
            <div class="teacher-answer-label">Answer box:</div>
            <div class="teacher-answer-cell">23</div>
          </div>
          <div class="teacher-board"><span class="teacher-mini-step">2</span>The sum is less than 10. So students write the full answer <b>23</b> in the answer box.</div>
        </div>`,
        note: "In this tutorial, the answer box is shown so students can see where the final answer is written.",
        warning: "Make sure the numbers being added are on the same diagonal."
      },
      {
        title: "4. Add with carrying",
        text: "If the diagonal sum is 10 or more, students need to carry. For example, 8 + 2 = 10. Write 0 in that place, then carry 1 to the diagonal box on the left.",
        demoTitle: "Teacher demo: write 0, carry 1",
        demoHtml: `<div class="teacher-demo-stage">
          <svg class="teacher-svg" viewBox="0 0 430 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Example with carrying">
            <rect width="430" height="330" fill="#eefcff" rx="18"></rect>
            <text x="215" y="42" text-anchor="middle" font-size="27" font-weight="900" fill="#b91c1c">EXAMPLE: 8 + 2 = 10</text>
            <g transform="translate(54,84)">
              <rect x="0" y="0" width="160" height="160" fill="#fff"></rect>
              <polygon points="0,160 160,0 160,160" fill="#fff200"></polygon>
              <line x1="0" y1="160" x2="160" y2="0" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="0" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="48" y="64" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">1</text>
              <text x="112" y="112" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">8</text>
              <g class="teacher-carry-one">
                <circle cx="25" cy="30" r="18" fill="#fff1f2" stroke="#ef4444" stroke-width="4"></circle>
                <text x="25" y="31" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="900" fill="#dc2626">1</text>
              </g>
              <rect x="160" y="0" width="160" height="160" fill="#fff"></rect>
              <polygon points="160,0 320,0 160,160" fill="#fff200"></polygon>
              <line x1="160" y1="160" x2="320" y2="0" stroke="#000" stroke-width="7"></line>
              <rect x="160" y="0" width="160" height="160" fill="none" stroke="#000" stroke-width="7"></rect>
              <text x="208" y="64" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">2</text>
              <text x="272" y="112" text-anchor="middle" dominant-baseline="middle" font-size="58" font-weight="900" fill="#0f172a">7</text>
              <line x1="160" y1="0" x2="160" y2="160" stroke="#000" stroke-width="7"></line>
              <rect x="0" y="0" width="320" height="160" fill="none" stroke="#000" stroke-width="9"></rect>
              <circle cx="112" cy="112" r="33" fill="none" stroke="#ef4444" stroke-width="6"></circle>
              <circle cx="208" cy="64" r="33" fill="none" stroke="#ef4444" stroke-width="6"></circle>
              <path class="teacher-highlight-dash" d="M112 112 C145 90,175 78,208 64" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8"></path>
              <defs><marker id="teacherCarryHead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 Z" fill="#ef4444"></path></marker></defs>
              <text x="112" y="26" text-anchor="middle" font-size="17" font-weight="900" fill="#dc2626">carry 1</text>
              <path class="teacher-highlight-dash" d="M204 82 C158 42,92 31,45 31" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8" marker-end="url(#teacherCarryHead)"></path>
            </g>
          </svg>
          <div class="teacher-answer-row">
            <div class="teacher-answer-label">Answer box:</div>
            <div class="teacher-answer-cell carry-mode">207</div>
            <div class="teacher-answer-label" style="color:#b91c1c;">0 is written, 1 is carried to the left</div>
          </div>
          <div class="teacher-board warning"><span class="teacher-mini-step">!</span>8 + 2 = 10. Students write <b>0</b> in the answer box, then <b>carry 1</b> to the diagonal on the left.</div>
        </div>`,
        note: "The answer box shows 207 so students can see the full answer after carrying.",
        warning: "⚠️ Do not write 10 in one answer box. Write 0 first, then carry 1."
      }
    ];

    let tutorialIndex = 0;

    function renderTutorialStep() {
      const step = tutorialSteps[tutorialIndex];
      if (!$('tutorialModal')) return;

      $('tutorialStepTitle').textContent = step.title;
      $('tutorialStepText').textContent = step.text;
      $('tutorialDemoTitle').textContent = step.demoTitle;
      $('tutorialDemoRow').innerHTML = step.demoHtml;
      $('tutorialDemoNote').textContent = step.note || '';
      $('tutorialStepLabel').textContent = (tutorialIndex + 1) + ' / ' + tutorialSteps.length;

      $('tutorialStepWarning').classList.toggle('hidden', !step.warning);
      $('tutorialStepWarning').textContent = step.warning || '';

      $('tutorialPrevButton').disabled = tutorialIndex === 0;
      $('tutorialNextButton').textContent = tutorialIndex === tutorialSteps.length - 1 ? 'Start Using ✓' : 'Next →';

      $('tutorialProgressLine').innerHTML = tutorialSteps.map((_, i) => `<div class="tutorial-dot ${i <= tutorialIndex ? 'active' : ''}"></div>`).join('');
    }

    function openTutorial() {
      tutorialIndex = 0;
      renderTutorialStep();
      $('tutorialModal').classList.remove('hidden');
      setTimeout(() => {
        const panel = document.querySelector('.tutorial-panel');
        if (panel) panel.scrollTop = 0;
      }, 50);
    }

    function closeTutorial() {
      $('tutorialModal').classList.add('hidden');
    }

    function nextTutorialStep() {
      if (tutorialIndex < tutorialSteps.length - 1) {
        tutorialIndex++;
        renderTutorialStep();
      } else {
        closeTutorial();
      }
    }

    function prevTutorialStep() {
      if (tutorialIndex > 0) {
        tutorialIndex--;
        renderTutorialStep();
      }
    }

    function renderAll() {
      $("selectorTitle").classList.toggle("stable", selectedFirst && selectedSecond);
      renderButtons();
      renderBone("firstBone", firstDigit, "right");
      renderBone("secondBone", secondDigit, "left");
      renderAnswers();
      updateStats();
    }

    function updateStats() {
      const progress = loadProgress();
      $("timeBox").textContent = "⏱️ Time: " + seconds + "s";
      $("coinBox").textContent = "🪙 Coin: " + coins;
      $("todayBox").textContent = "📅 Today: " + (progress[todayKey()] || 0) + " sets";
      updateGamificationPanel();
    }

    function resetAnswers(clearSelection = true) {
      answers = {};
      rewardedRows = {};
      seconds = 0;
      isStarted = false;
      roundCompleted = false;
      extraBonusGiven = false;
      clearInterval(timer);
      timer = null;
      $("finishMessage").classList.add("hidden");
      $("finishMessage").textContent = "";

      if (clearSelection) {
        firstDigit = null;
        secondDigit = null;
        selectedFirst = false;
        selectedSecond = false;
        blinkCount = 0;
      }
      renderAll();
    }

    $("resetButton").onclick = () => resetAnswers(true);

    function startCountdownIfReady() {
      if (selectedFirst && selectedSecond && firstDigit !== null && secondDigit !== null && !isStarted) {
        speakText("3, 2, 1, start!");
        setTimeout(() => {
          isStarted = true;
          clearInterval(timer);
          timer = setInterval(() => {
            seconds++;
            updateStats();
          }, 1000);

          setTimeout(() => {
            smoothScrollToElement(document.querySelector(".bones-area"), 40, 0.13, true);
            const firstInput = document.querySelector(".answer-input:not(:disabled)");
            if (firstInput) {
              setTimeout(() => {
                firstInput.focus();
                smartScrollToInput(firstInput, 180, true);
              }, 260);
            }
          }, 200);
        }, 1800);
      }
    }

    function updateAnswer(row, value, inputEl) {
      if (firstDigit === null || secondDigit === null) return;

      const ca = correctAnswer(row);
      const expectedLength = String(ca).length;
      answers[row] = value;

      // Reset class tanpa bina semula semua kotak. Ini elak fokus melompat.
      if (inputEl) {
        inputEl.classList.remove("empty", "typing", "correct", "wrong");

        if (value === "") {
          inputEl.classList.add("empty");
          updateStats();
          return;
        }

        if (value.length < expectedLength) {
          inputEl.classList.add("typing");
          updateStats();
          return;
        }

        if (Number(value) === ca) {
          inputEl.classList.add("correct");
          answerCombo++;
          playCorrectRandom();
          speakText(getPraiseText(), false);
        } else {
          inputEl.classList.add("wrong");
          answerCombo = 0;
          playBuzzer();
          const tryAgainText = getTryAgainText();
          speakText(tryAgainText, false);
          $("finishMessage").textContent = tryAgainText + " 😊";
          $("finishMessage").classList.remove("hidden");
          updateStats();
          return;
        }
      }

      // Reward, lock dan auto-jump hanya selepas digit cukup DAN jawapan betul.
      if (value.length === expectedLength && Number(value) === ca && !rewardedRows[row]) {
        let totalBonus = 0;
        rewardedRows[row] = true;

        const completedAll = rows.every((r) => rewardedRows[r]);
        let message = `${getShortPraise()} Answer locked ✅`;
        if (answerCombo >= 3) message = `🔥 Combo ${answerCombo}! Answer locked ✅`;

        if (completedAll) {
          roundCompleted = true;
          const progress = loadProgress();
          progress[todayKey()] = (progress[todayKey()] || 0) + 1;
          saveProgress(progress);
          isStarted = false;
          clearInterval(timer);
          answerCombo = 0;
          playSuccessMelody();
          playCinematicVictory();

          const rewardResult = processCompletionReward(seconds);
          message = "🎉 " + rewardResult.message + ` +${rewardResult.xpAwarded} XP`;
          saveToFirebaseSafe({
            username: currentUser,
            action: "completed_game",
            sifir: getSifirNumber(),
            firstNumber: firstDigit,
            secondNumber: secondDigit,
            time: seconds,
            coins: coins,
            coinsAwarded: rewardResult.coinsAwarded,
            xpAwarded: rewardResult.xpAwarded,
            bestTime: rewardResult.record.bestTime,
            rewardsUsed: rewardResult.record.rewards,
            completed: true,
            completedAt: new Date().toISOString()
          });

          syncCurrentAccountToFirebase({
            lastCompletedSifir: getSifirNumber(),
            lastTime: seconds,
            lastCoinsAwarded: rewardResult.coinsAwarded,
            lastXpAwarded: rewardResult.xpAwarded,
            lastCompletedAt: new Date().toISOString()
          });

          if (currentClassCode) {
            delete classRivalCache[currentClassCode + "_" + getSifirNumber()];
          }

          showCinematicEnding(seconds, rewardResult.coinsAwarded > 0 ? `+${rewardResult.coinsAwarded} Coins` : "Practice Complete");

          if (rewardResult.coinsAwarded > 0) {
            speakText("New record! You earned coins!", true);
          } else if (rewardResult.rewardType === "slower") {
            speakText("Great work! Try faster next time to earn coins.", true);
          } else {
            speakText("Great practice! Your answers are correct.", true);
          }
        }

        if (!completedAll) {
          // During a round, rows are locked but coins are only awarded after all answers are correct.
          totalBonus = 0;
        }

        $("finishMessage").textContent = message;
        $("finishMessage").classList.remove("hidden");

        if (inputEl) inputEl.disabled = true;

        // Auto terus ke kotak jawapan seterusnya selepas jawapan lengkap dan betul.
        // Fokus dibuat segera supaya keyboard phone tidak tertutup dan murid tidak perlu klik.
        if (!completedAll) {
          const inputs = Array.from(document.querySelectorAll(".answer-input"));
          const currentIndex = rows.indexOf(row);
          const nextInput = inputs.slice(currentIndex + 1).find((el) => !el.disabled);

          if (nextInput) {
            nextInput.focus({ preventScroll: true });
            try { nextInput.select(); } catch {}
            // Ultra smooth fixed: jawapan betul mesti ikut turun ke kotak seterusnya.
            // Force = true kerana ini flow pembelajaran, bukan scroll rawak.
            userIsManualScrolling = false;
            clearTimeout(manualScrollTimer);
            smartScrollToInput(nextInput, 80, true);
            setTimeout(() => {
              smartScrollToInput(nextInput, 20, true);
            }, 260);
          }
        } else {
          // Bila semua selesai, kekalkan paparan mesej tamat dengan scroll lembut.
          const finish = document.getElementById("finishMessage");
          if (finish) smoothScrollToElement(finish, 30, 0.18, true);
        }
      }

      updateStats();
    }

        $("coinBox").onclick = () => {
      const progress = loadProgress();
      const coinProgress = loadCoins();
      const entries = Object.entries(coinProgress).sort(([a],[b]) => a.localeCompare(b));
      const max = entries.length ? Math.max(...entries.map(([,v]) => v)) : 0;
      const bestDays = entries.filter(([,v]) => v === max && max > 0).map(([d]) => d);
      const streak = getStreak(progress);

      $("progressContent").innerHTML = `
        <h3>Daily Coin Progress</h3>
        <div class="progress-summary">
          <div class="progress-summary-card">🔥 Streak<br>${streak} days</div>
          <div class="progress-summary-card">📊 Coin Record<br>${max}</div>
        </div>
        ${bestDays.length ? `<div class="best-day">🏆 Most active day: ${bestDays.join(", ")}</div>` : ""}
        ${entries.length === 0 ? "<p>No data yet</p>" : ""}
        <div class="bar-chart">
          ${entries.map(([date, value]) => `
            <div class="bar-row ${value === max ? "best" : ""}">
              <span>${date}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:${max ? (value / max) * 100 : 0}%"></div>
              </div>
              <b>${value}</b>
            </div>
          `).join("")}
        </div>
        ${entries.map(([date,value]) => `<div class="progress-item"><span>${date}</span><b>${value} coin</b></div>`).join("")}
        <h3 style="margin-top:18px;">Sifir Records</h3>
        ${Object.entries(loadSifirRecords()).length === 0 ? "<p>No sifir record yet</p>" : ""}
        ${Object.entries(loadSifirRecords()).sort(([a],[b]) => Number(a)-Number(b)).map(([s,rec]) => `<div class="progress-item"><span>Sifir ${s}<br><small>Completed ${rec.completed || 0} times</small></span><b>${rec.bestTime ?? "-"}s<br>${rec.rewards || 0}/${MAX_RECORD_REWARDS} rewards</b></div>`).join("")}
      `;

      $("progressModal").classList.remove("hidden");
    };

    $("progressModal").onclick = () => $("progressModal").classList.add("hidden");
    $("progressContent").onclick = (event) => event.stopPropagation();

    $("tutorialButton").onclick = openTutorial;
    $("tutorialCloseButton").onclick = closeTutorial;
    $("tutorialNextButton").onclick = nextTutorialStep;
    $("tutorialPrevButton").onclick = prevTutorialStep;
    $("tutorialModal").onclick = closeTutorial;
    document.querySelector(".tutorial-panel").onclick = (event) => event.stopPropagation();
    document.addEventListener("keydown", (event) => {
      if (!$('tutorialModal').classList.contains('hidden')) {
        if (event.key === 'Escape') closeTutorial();
        if (event.key === 'ArrowRight') nextTutorialStep();
        if (event.key === 'ArrowLeft') prevTutorialStep();
      }
    });

    const cinematicBtn = document.getElementById("cinematicCloseButton");
    if (cinematicBtn) {
      cinematicBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Continue now only closes the champion screen.
        // The completed sifir, diagonal boxes, and locked answers remain visible
        // so students have time to copy their completed work.
        closeCinematicEnding();

        setTimeout(() => {
          const answerArea = document.querySelector(".answer-area") || document.querySelector(".bones-area") || document.querySelector(".main-layout");
          if (answerArea) smoothScrollToElement(answerArea, 20, 0.25, true);
        }, 120);
      });
    }

    renderAll();

document.addEventListener("click", (event) => {
  const row = event.target.closest(".student-summary-row");
  if (row) openStudentDetail(row.dataset.username);

  if (event.target && event.target.id === "studentDetailClose") {
    $("studentDetailModal").classList.add("hidden");
  }

  if (event.target && event.target.id === "studentDetailModal") {
    $("studentDetailModal").classList.add("hidden");
  }
});
