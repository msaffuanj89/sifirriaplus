
let currentAccountRole = "student";
let currentAccountData = null;

function toggleSignupRoleFields() {
  const role = $("accountType") ? $("accountType").value : "student";

  const teacherWrap = $("teacherCodeWrap");
  const studentWrap = $("studentClassCodeWrap");

  const classInput = $("studentClass");
  const classLabel = classInput ? classInput.previousElementSibling : null;

  if (teacherWrap) teacherWrap.classList.toggle("hidden", role !== "teacher");
  if (studentWrap) studentWrap.classList.toggle("hidden", role !== "student");

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
  login(user, displayName);
}

async function showTeacherDashboard(account) {
  currentAccountRole = "teacher";
  currentAccountData = account || {};
  $("loginPage").classList.add("hidden");
  $("app").classList.add("hidden");
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
  if (table) table.innerHTML = `<tr><td colspan="12">Loading fast student summary...</td></tr>`;

  if (typeof window.getTeacherDashboardData !== "function") {
    if (table) table.innerHTML = `<tr><td colspan="12">Firebase dashboard function not ready.</td></tr>`;
    return;
  }

  const result = await window.getTeacherDashboardData(currentUser);
  if (!result.ok) {
    if (classList) classList.innerHTML = "Failed to load classes.";
    if (table) table.innerHTML = `<tr><td colspan="12">${result.message}</td></tr>`;
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

function buildFastStudentSummary(s) {
  const progress = s.progress || {};
  const coinProgress = s.coinProgress || {};
  const records = s.sifirRecords || {};
  const last = s.lastData || {};

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
  const activeScore = coins + (activeDays.size * 10) + (streak * 5) + (sifirKeys.length * 15);
  const status = getActivityStatus(activeDays.size);

  return {
    ...s,
    lastData: last,
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
  const mostActive = summary.length ? [...summary].sort((a,b)=>Number(b.activeScore||0)-Number(a.activeScore||0))[0] : null;
  const needsSupport = summary.filter(s => s.status === "Needs Encouragement").length;

  if ($("sumTotalStudents")) $("sumTotalStudents").textContent = totalStudents;
  if ($("sumTotalAttempts")) $("sumTotalAttempts").textContent = totalAttempts;
  if ($("sumMostActive")) $("sumMostActive").textContent = mostActive ? (mostActive.fullName || mostActive.username) : "-";
  if ($("sumNeedsSupport")) $("sumNeedsSupport").textContent = needsSupport;

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
    table.innerHTML = `<tr><td colspan="12">No student summary found.</td></tr>`;
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

  attemptsBody.innerHTML = attempts.map((log, index) => {
    const completedAt = log.completedAt || log.date || "-";
    const completedText = completedAt && completedAt !== "-"
      ? String(completedAt).replace("T", " ").slice(0, 19)
      : "-";

    return `
      <tr>
        <td>${index + 1}</td>
        <td>Sifir ${log.sifir || "-"}</td>
        <td>${log.time ? log.time + "s" : "-"}</td>
        <td>${Number(log.coinsAwarded || 0)}</td>
        <td>${Number(log.xpAwarded || 0)}</td>
        <td>${completedText}</td>
      </tr>
    `;
  }).join("");
}


document.addEventListener("click", async (event) => {
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
});

document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "teacherSearchInput") {
    renderTeacherStudents(teacherDashboardStudentsCache || []);
  }
});



function applyFirebaseAccountData(account) {
  if (!account || !currentUser) return;

  const lastData = account.lastData || {};
  const progress = account.progress || {};
  const coinProgress = account.coinProgress || {};
  const sifirRecords = account.sifirRecords || {};

  const xp = Math.max(Number(account.xp || 0), Number(lastData.xp || lastData.xpAwarded || 0));
  const level = Number(account.level || Math.floor(xp / 100) + 1);
  const firebaseCoins = Math.max(Number(account.coins || 0), Number(lastData.coins || 0));

  localStorage.setItem("sifirria_progress_" + currentUser, JSON.stringify(progress));
  localStorage.setItem("sifirria_coin_progress_" + currentUser, JSON.stringify(coinProgress));
  localStorage.setItem("sifirria_sifir_records_" + currentUser, JSON.stringify(sifirRecords));
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
      $("loginTab").classList.toggle("active", mode === "login");
      $("signupTab").classList.toggle("active", mode === "signup");
      $("signupFields").classList.toggle("hidden", mode !== "signup");
      if ($("signupProfileFields")) $("signupProfileFields").classList.toggle("hidden", mode !== "signup");
      if ($("roleFields")) $("roleFields").classList.toggle("hidden", mode !== "signup");
      toggleSignupRoleFields();
      if ($("signupProfileFields")) $("signupProfileFields").classList.toggle("hidden", mode !== "signup");
      $("authButton").textContent = mode === "login" ? "LOGIN" : "REGISTER";
      $("loginSubtitle").textContent = mode === "login" ? "Log in to start building 2-digit multiplication." : "Register a new account to use the app.";
      $("loginError").textContent = "";
    }

    $("loginTab").onclick = () => setAuthMode("login");
    $("signupTab").onclick = () => setAuthMode("signup");
$("authForm").onsubmit = async (e) => {
      e.preventDefault();

      const user = $("username").value.trim();
      const pass = $("password").value.trim();
      const confirm = $("confirmPassword") ? $("confirmPassword").value.trim() : "";

      if (!user || !pass) {
        $("loginError").textContent = "Please enter username and password.";
        return;
      }

      if (authMode === "login" && user === "demo" && pass === "1234") {
        if (typeof window.getFirebaseSyncData === "function") {
          const demoData = await window.getFirebaseSyncData(user);
          if (demoData.ok && demoData.account) {
            currentUser = user;
      window.currentUser = user;
            window.currentUser = user;
            applyFirebaseAccountData(demoData.account);
            currentClassCode = (demoData.account.classCode || '').toUpperCase();
          }
        }
        showStudentApp(user, "Demo User");
        return;
      }

      if (authMode === "signup") {
        const role = $("accountType") ? $("accountType").value : "student";
        const fullName = $("fullName") ? $("fullName").value.trim() : "";
        const birthDate = $("birthDate") ? $("birthDate").value.trim() : "";
        const studentClass = $("studentClass") ? $("studentClass").value.trim() : "";
        const schoolName = $("schoolName") ? $("schoolName").value.trim() : "";
        const stateName = $("stateName") ? $("stateName").value.trim() : "";
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

        if (role === "teacher" && teacherCode !== "GURU123") {
          $("loginError").textContent = "Invalid teacher code.";
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

        const profile = { role, fullName, birthDate, studentClass, schoolName, stateName, classCode, teacherCode };

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
          currentUser = user;
          window.currentUser = user;
          currentAccountData = result.account || {};
          currentClassCode = (currentAccountData.classCode || '').toUpperCase();
          currentAccountRole = currentAccountData.role || "student";
          applyFirebaseAccountData(currentAccountData);

          if (currentAccountRole === "teacher") {
            await showTeacherDashboard(currentAccountData);
          } else {
            showStudentApp(user, result.username || user);
          }
          return;
        }

        $("loginError").textContent = result.message;
        return;
      }

      $("loginError").textContent = "Firebase is not ready yet. Please refresh and try again.";
    };

    function login(user, displayName) {
      currentUser = user;
      window.currentUser = user;

      saveToFirebaseSafe({
        username: currentUser,
        action: "login",
        loggedInAt: new Date().toISOString()
      });

      syncCurrentAccountToFirebase({
        lastLoginAt: new Date().toISOString()
      });
      coins = Number(coins || totalCoins());
      $("welcomeCard").textContent = "Welcome " + displayName;
      $("loginPage").classList.add("hidden");
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
