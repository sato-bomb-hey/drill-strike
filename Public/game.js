/* ============================================
   CYBER QUIZ — GAME LOGIC
   ============================================ */

'use strict';

// ============================================
// CONSTANTS
// ============================================

const QUESTIONS_PER_ROUND = 5;
const POINTS_PER_QUESTION = 20;
const BOSS_TRIGGER_INTERVAL = 10;
const BOSS_QUESTIONS_COUNT = 10;
const BOSS_WIN_THRESHOLD = 8;
const BOSS_MAX_HP = 10;

const SUBJECT_NAMES = {
  na: '国語',
  ma: '数学',
  en: '英語',
  sc: '理科',
  so: '社会'
};

const GRADE_NAMES = {
  1: '中1',
  2: '中2'
};

const SEMESTER_NAMES = {
  1: '前期',
  2: '後期'
};

// ============================================
// BOSS DEFINITIONS
// ============================================

const BOSS_TYPES = [
  {
    id: 'neon_reaper',
    name: '⚡ NEON REAPER ⚡',
    type: 'AIハッカー',
    color: '#00ffff',
    bgColor: '#001a1a',
    achievement: 'terminate_neon_reaper'
  },
  {
    id: 'iron_tyrant',
    name: '🔩 IRON TYRANT 🔩',
    type: '戦闘メカ',
    color: '#ff6600',
    bgColor: '#1a0800',
    achievement: 'terminate_iron_tyrant'
  },
  {
    id: 'ghost_protocol',
    name: '👾 GHOST PROTOCOL 👾',
    type: 'サイバー暗殺者AI',
    color: '#aa00ff',
    bgColor: '#0d0020',
    achievement: 'terminate_ghost_protocol'
  },
  {
    id: 'chrome_queen',
    name: '💀 CHROME QUEEN 💀',
    type: 'サイバーAI女王',
    color: '#ff00ff',
    bgColor: '#1a0018',
    achievement: 'terminate_chrome_queen'
  },
  {
    id: 'void_striker',
    name: '🌀 VOID STRIKER 🌀',
    type: 'ヴォイドメカ',
    color: '#4400ff',
    bgColor: '#08001a',
    achievement: 'terminate_void_striker'
  },
  {
    id: 'data_wraith',
    name: '🧬 DATA WRAITH 🧬',
    type: 'データゴースト',
    color: '#00ff88',
    bgColor: '#001a0d',
    achievement: 'terminate_data_wraith'
  }
];

// ============================================
// GACHA ITEMS
// ============================================

const GACHA_ITEMS = [
  // Battle items
  { id: 'emp', name: 'EMPグレネード', icon: '💣', rarity: 'コモン', rarityClass: 'rarity-common', desc: 'ボスに1ダメージ＆問題スキップ', battleType: 'damage', weight: 30 },
  { id: 'hack', name: 'HACK CHIP', icon: '💾', rarity: 'コモン', rarityClass: 'rarity-common', desc: '正解の選択肢が光る', battleType: 'hint', weight: 30 },
  { id: 'shield', name: 'シールドマトリクス', icon: '🛡', rarity: 'レア', rarityClass: 'rarity-rare', desc: '次の不正解を1回防ぐ', battleType: 'shield', weight: 15 },
  { id: 'autoaim', name: 'AUTO-AIM', icon: '🎯', rarity: 'エピック', rarityClass: 'rarity-epic', desc: '自動正解する', battleType: 'autocorrect', weight: 8 },
  // Cosmetic items
  { id: 'katana', name: 'ネオンカタナ', icon: '⚔️', rarity: 'レア', rarityClass: 'rarity-rare', desc: 'サイバーパンクな刀', battleType: null, weight: 15 },
  { id: 'implant', name: 'サイバーインプラント', icon: '🦾', rarity: 'エピック', rarityClass: 'rarity-epic', desc: '強化されたサイボーグ義肢', battleType: null, weight: 6 },
  { id: 'neural', name: 'ニューラルリンク', icon: '🧠', rarity: 'コモン', rarityClass: 'rarity-common', desc: '脳とネットの直結インターフェース', battleType: null, weight: 25 },
  { id: 'plasma', name: 'プラズマライフル', icon: '🔫', rarity: 'レア', rarityClass: 'rarity-rare', desc: '高エネルギー粒子ビーム銃', battleType: null, weight: 12 },
  { id: 'quantum', name: 'クォンタムコア', icon: '💠', rarity: 'レジェンダリー', rarityClass: 'rarity-legendary', desc: '時空を操る量子コアデバイス', battleType: null, weight: 2 },
  { id: 'nano', name: 'ナノボット', icon: '🔬', rarity: 'コモン', rarityClass: 'rarity-common', desc: '体内で働くナノマシン群', battleType: null, weight: 20 },
  { id: 'titan', name: 'タイタンアーマー', icon: '🛡️', rarity: 'エピック', rarityClass: 'rarity-epic', desc: '最強のパワーアーマー', battleType: null, weight: 5 }
];

const BATTLE_ITEM_DEFS = {
  damage:      { name: 'EMPグレネード', icon: '💣', desc: 'ボスに1ダメージ＆スキップ' },
  hint:        { name: 'HACK CHIP', icon: '💾', desc: '正解の選択肢が光る' },
  shield:      { name: 'シールドマトリクス', icon: '🛡', desc: '次の不正解を1回防ぐ' },
  autocorrect: { name: 'AUTO-AIM', icon: '🎯', desc: '自動正解する' }
};

// ============================================
// ACHIEVEMENTS
// ============================================

const ACHIEVEMENTS = {
  terminate_neon_reaper:  { name: '⚡ NEON REAPER 撃破！', icon: '⚡' },
  terminate_iron_tyrant:  { name: '🔩 IRON TYRANT 撃破！', icon: '🔩' },
  terminate_ghost_protocol: { name: '👾 GHOST PROTOCOL 撃破！', icon: '👾' },
  terminate_chrome_queen: { name: '💀 CHROME QUEEN 撃破！', icon: '💀' },
  terminate_void_striker: { name: '🌀 VOID STRIKER 撃破！', icon: '🌀' },
  terminate_data_wraith:  { name: '🧬 DATA WRAITH 撃破！', icon: '🧬' },
  perfect_override:       { name: '💯 PERFECT OVERRIDE', icon: '💯' },
  first_drop:             { name: '💾 初ドロップ！', icon: '💾' },
  loot_hoarder:           { name: '📦 LOOT HOARDER', icon: '📦' },
  legendary_drop:         { name: '✨ LEGENDARY DROP', icon: '✨' }
};

// ============================================
// GAME STATE
// ============================================

let gameState = {
  grade: 1,
  semester: 1,
  subject: 'na',
  categoryKey: '',
  allQuestions: [],      // all questions for current category (shuffled)
  sessionQuestions: [],  // questions for current session
  currentIndex: 0,       // current question index in sessionQuestions
  roundIndex: 0,         // which question within current round (0-4)
  totalAnswered: 0,      // total answered in this session
  roundScore: 0,
  totalScore: 0,
  streak: 0,
  wrongIds: [],          // IDs of wrong answers in this session
  isReviewMode: false
};

let bossState = {
  active: false,
  boss: null,
  hp: BOSS_MAX_HP,
  questions: [],
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  answered: false,
  shieldActive: false
};

// ============================================
// LOCALSTORAGE
// ============================================

const LS_WRONG    = 'cyber_quiz_wrong_ids';
const LS_GACHA    = 'cyber_quiz_gacha';
const LS_ACHIEVE  = 'cyber_quiz_achievements';
const LS_ITEMS    = 'cyber_quiz_battle_items';

// --- Auth state ---
let currentUser = null;

// Prefix localStorage key with user UID when logged in
function lsKey(key) {
  return currentUser ? `${currentUser.uid}_${key}` : key;
}

function loadWrongIds() {
  try { return JSON.parse(localStorage.getItem(lsKey(LS_WRONG))) || []; } catch(e) { return []; }
}

function saveWrongIds(ids) {
  localStorage.setItem(lsKey(LS_WRONG), JSON.stringify([...new Set(ids)]));
}

function loadGachaCollection() {
  try { return JSON.parse(localStorage.getItem(lsKey(LS_GACHA))) || {}; } catch(e) { return {}; }
}

function saveGachaCollection(col) {
  localStorage.setItem(lsKey(LS_GACHA), JSON.stringify(col));
}

function loadAchievements() {
  try { return JSON.parse(localStorage.getItem(lsKey(LS_ACHIEVE))) || []; } catch(e) { return []; }
}

function saveAchievements(arr) {
  localStorage.setItem(lsKey(LS_ACHIEVE), JSON.stringify(arr));
}

function loadBattleItems() {
  try { return JSON.parse(localStorage.getItem(lsKey(LS_ITEMS))) || { damage: 0, hint: 0, shield: 0, autocorrect: 0 }; }
  catch(e) { return { damage: 0, hint: 0, shield: 0, autocorrect: 0 }; }
}

function saveBattleItems(items) {
  localStorage.setItem(lsKey(LS_ITEMS), JSON.stringify(items));
}

let battleItemCounts = loadBattleItems();
let gachaState = { spinning: false };

// ============================================
// SCREEN NAVIGATION
// ============================================

function showScreen(id) {
  document.querySelectorAll('.screen, .overlay').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showStep(step) {
  document.querySelectorAll('.select-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');
}

// ============================================
// SELECT FLOW
// ============================================

function selectGrade(g) {
  gameState.grade = g;
  showStep('semester');
}

function selectSemester(s) {
  gameState.semester = s;
  showStep('subject');
}

function selectSubject(subj) {
  gameState.subject = subj;
  try {
    startGame();
  } catch(e) {
    alert('エラーが発生しました:\n' + e.message + '\n\nコンソールを確認してください。');
    console.error(e);
  }
}

// ============================================
// GAME START
// ============================================

function startGame() {
  if (typeof QUESTIONS === 'undefined') {
    alert('questions.js が読み込めていません。ファイルが正しく配置されているか確認してください。');
    return;
  }

  var key = 'g' + gameState.grade + '-s' + gameState.semester + '-' + gameState.subject;
  gameState.categoryKey = key;
  gameState.isReviewMode = false;

  var pool = QUESTIONS[key];
  if (!pool || pool.length === 0) {
    alert('問題が見つかりませんでした。キー: ' + key);
    return;
  }

  // Shuffle and take up to 50 questions per session
  const shuffled = shuffleArray([...pool]);
  gameState.sessionQuestions = shuffled;
  gameState.allQuestions = shuffled;
  gameState.currentIndex = 0;
  gameState.roundIndex = 0;
  gameState.totalAnswered = 0;
  gameState.roundScore = 0;
  gameState.totalScore = 0;
  gameState.streak = 0;
  gameState.wrongIds = [];

  showScreen('quiz-screen');
  updateHUD();
  showQuestion();
}

function startReviewMode() {
  const wrongIds = loadWrongIds();
  if (wrongIds.length === 0) {
    showScreen('review-screen');
    renderReviewList([]);
    return;
  }

  // Collect wrong questions from all pools
  const wrongQuestions = [];
  for (const key in QUESTIONS) {
    for (const q of QUESTIONS[key]) {
      if (wrongIds.includes(q.id)) wrongQuestions.push(q);
    }
  }

  if (wrongQuestions.length === 0) {
    showScreen('review-screen');
    renderReviewList([]);
    return;
  }

  showScreen('review-screen');
  renderReviewList(wrongQuestions);
}

function renderReviewList(questions) {
  const list = document.getElementById('review-list');
  if (questions.length === 0) {
    list.innerHTML = '<div class="review-empty">間違いがまだありません。<br>まずクイズをプレイしよう！</div>';
    return;
  }

  list.innerHTML = questions.map(q => `
    <div class="review-item" onclick="startReviewQuestion('${q.id}')">
      <div class="review-item-id">${q.id}</div>
      <div class="review-item-text">${q.text}</div>
    </div>
  `).join('');
}

function startReviewQuestion(qId) {
  // Find question
  let targetQ = null;
  for (const key in QUESTIONS) {
    for (const q of QUESTIONS[key]) {
      if (q.id === qId) { targetQ = q; break; }
    }
    if (targetQ) break;
  }
  if (!targetQ) return;

  gameState.isReviewMode = true;
  gameState.sessionQuestions = [targetQ];
  gameState.currentIndex = 0;
  gameState.roundIndex = 0;
  gameState.totalAnswered = 0;
  gameState.roundScore = 0;
  gameState.totalScore = 0;
  gameState.streak = 0;

  showScreen('quiz-screen');
  updateHUD();
  showQuestion();
}

// ============================================
// QUESTION DISPLAY
// ============================================

function showQuestion() {
  const q = gameState.sessionQuestions[gameState.currentIndex];
  if (!q) {
    showResult();
    return;
  }

  // Category label
  const subName = SUBJECT_NAMES[gameState.subject] || '';
  const catLabel = `${GRADE_NAMES[gameState.grade] || ''}${SEMESTER_NAMES[gameState.semester] || ''} // ${subName} // Q${gameState.currentIndex + 1}`;
  document.getElementById('question-category').textContent = catLabel;

  // Question text
  document.getElementById('question-text').textContent = q.text;

  // Build shuffled choices (keep track of correct answer)
  const indexed = q.choices.map((c, i) => ({ text: c, idx: i }));
  const shuffled = shuffleArray(indexed);
  const correctShuffledIdx = shuffled.findIndex(c => c.idx === q.answer);

  const grid = document.getElementById('choices-grid');
  const labels = ['A', 'B', 'C', 'D'];
  grid.innerHTML = shuffled.map((choice, si) => `
    <button class="choice-btn" onclick="submitAnswer(${si}, ${correctShuffledIdx}, '${q.id}')">
      <span class="choice-label">${labels[si]}</span>
      ${escapeHtml(choice.text)}
    </button>
  `).join('');

  // Hide explanation and next button
  const expArea = document.getElementById('explanation-area');
  expArea.classList.remove('show');
  document.getElementById('explanation-text').textContent = '';
  document.getElementById('next-btn').style.display = 'none';

  // Update progress
  updateProgress();
}

function submitAnswer(selectedIdx, correctIdx, qId) {
  const buttons = document.querySelectorAll('#choices-grid .choice-btn');
  buttons.forEach(btn => btn.disabled = true);

  const isCorrect = selectedIdx === correctIdx;

  // Visual feedback
  buttons[correctIdx].classList.add('correct');
  if (!isCorrect) {
    buttons[selectedIdx].classList.add('wrong');
    gameState.wrongIds.push(qId);
    // Persist wrong IDs
    const stored = loadWrongIds();
    stored.push(qId);
    saveWrongIds(stored);
    gameState.streak = 0;
  } else {
    gameState.roundScore += POINTS_PER_QUESTION;
    gameState.totalScore += POINTS_PER_QUESTION;
    gameState.streak++;
  }

  gameState.totalAnswered++;
  gameState.roundIndex++;

  updateHUD();

  // Show explanation
  showExplanation(qId, 'explanation-text', 'explanation-area');

  // Show next button
  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'block';
  if (gameState.roundIndex >= QUESTIONS_PER_ROUND ||
      gameState.currentIndex >= gameState.sessionQuestions.length - 1) {
    nextBtn.textContent = 'SCORE ▶';
  } else {
    nextBtn.textContent = 'NEXT ▶';
  }
}

function nextQuestion() {
  gameState.currentIndex++;

  if (gameState.roundIndex >= QUESTIONS_PER_ROUND) {
    showRoundScore();
  } else if (gameState.currentIndex >= gameState.sessionQuestions.length) {
    showRoundScore();
  } else {
    showQuestion();
  }
}

// ============================================
// ROUND SCORE SCREEN
// ============================================

function showRoundScore() {
  document.getElementById('round-score').textContent = String(gameState.roundScore).padStart(3, '0');

  // Breakdown
  const correct = gameState.roundScore / POINTS_PER_QUESTION;
  const wrong = gameState.roundIndex - correct;
  const breakdown = document.getElementById('score-breakdown');
  breakdown.innerHTML = `
    <div class="score-row correct">
      <span>正解</span><span class="neon-green">${correct} 問</span>
    </div>
    <div class="score-row wrong">
      <span>不正解</span><span class="neon-red">${wrong} 問</span>
    </div>
    <div class="score-row">
      <span>累計スコア</span><span>${gameState.totalScore} pt</span>
    </div>
  `;

  gameState.roundScore = 0;
  gameState.roundIndex = 0;

  showScreen('score-screen');
}

function continueNextRound() {
  if (gameState.currentIndex >= gameState.sessionQuestions.length) {
    showResult();
    return;
  }

  // Check boss trigger
  if (!gameState.isReviewMode && gameState.totalAnswered > 0 &&
      gameState.totalAnswered % BOSS_TRIGGER_INTERVAL === 0) {
    checkAndTriggerBoss();
    return;
  }

  showScreen('quiz-screen');
  updateHUD();
  showQuestion();
}

// ============================================
// RESULT SCREEN
// ============================================

function showResult() {
  const total = gameState.sessionQuestions.length;
  const correct = Math.round(gameState.totalScore / POINTS_PER_QUESTION);
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;

  const rank = getRank(pct);

  document.getElementById('result-stats').innerHTML = `
    <div class="result-stat-row">
      <span class="result-stat-label">正解数</span>
      <span class="result-stat-value">${correct} / ${total}</span>
    </div>
    <div class="result-stat-row">
      <span class="result-stat-label">正答率</span>
      <span class="result-stat-value">${pct}%</span>
    </div>
    <div class="result-stat-row">
      <span class="result-stat-label">総スコア</span>
      <span class="result-stat-value">${gameState.totalScore} pt</span>
    </div>
    <div class="result-stat-row">
      <span class="result-stat-label">ストリーク最大</span>
      <span class="result-stat-value">${gameState.streak}</span>
    </div>
  `;

  document.getElementById('result-rank').textContent = rank.label;
  document.getElementById('result-rank').style.borderColor = rank.color;
  document.getElementById('result-rank').style.color = rank.color;
  document.getElementById('result-rank').style.textShadow = `0 0 12px ${rank.color}`;

  showScreen('result-screen');

  // Upload score to Firestore
  uploadScore(gameState.totalScore, correct, total);
}

function getRank(pct) {
  if (pct >= 100) return { label: 'S++ // PERFECT HACK', color: '#ffff00' };
  if (pct >= 90)  return { label: 'S+ // ELITE RUNNER', color: '#00ff88' };
  if (pct >= 80)  return { label: 'A // STREET SAMURAI', color: '#00ffff' };
  if (pct >= 70)  return { label: 'B // NETRUNNER', color: '#aa00ff' };
  if (pct >= 60)  return { label: 'C // FIXER', color: '#ff6600' };
  return { label: 'D // CORP DRONE', color: '#ff2244' };
}

function playAgain() {
  showScreen('select-screen');
  showStep('grade');
}

// ============================================
// HUD UPDATE
// ============================================

function updateHUD() {
  document.getElementById('hud-score').textContent = String(gameState.totalScore).padStart(3, '0');
  document.getElementById('hud-qnum').textContent = String(gameState.currentIndex + 1).padStart(2, '0');
  document.getElementById('hud-streak').textContent = gameState.streak;
}

function updateProgress() {
  const total = gameState.sessionQuestions.length;
  const pct = total > 0 ? (gameState.currentIndex / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';

  // Boss indicators every BOSS_TRIGGER_INTERVAL questions
  const indContainer = document.getElementById('boss-indicators');
  indContainer.innerHTML = '';
  for (let i = BOSS_TRIGGER_INTERVAL; i < total; i += BOSS_TRIGGER_INTERVAL) {
    const mark = document.createElement('div');
    mark.className = 'boss-indicator-mark';
    mark.style.left = (i / total * 100) + '%';
    indContainer.appendChild(mark);
  }
}

// ============================================
// BOSS BATTLE SYSTEM
// ============================================

function checkAndTriggerBoss() {
  // Pick a random boss
  const boss = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
  startBossBattle(boss);
}

function startBossBattle(boss) {
  bossState.active = true;
  bossState.boss = boss;
  bossState.hp = BOSS_MAX_HP;
  bossState.correct = 0;
  bossState.wrong = 0;
  bossState.currentIndex = 0;
  bossState.answered = false;
  bossState.shieldActive = false;

  // Collect boss questions from all categories
  const allQ = [];
  for (const key in QUESTIONS) {
    allQ.push(...QUESTIONS[key]);
  }
  bossState.questions = shuffleArray(allQ).slice(0, BOSS_QUESTIONS_COUNT);

  // Set boss overlay background
  const overlay = document.getElementById('boss-overlay');
  overlay.style.background = boss.bgColor;
  overlay.classList.add('active');

  // Draw boss
  document.getElementById('boss-name').textContent = boss.name;
  document.getElementById('boss-name').style.color = boss.color;
  document.getElementById('boss-name').style.textShadow = `0 0 12px ${boss.color}, 0 0 24px ${boss.color}`;

  updateBossHUD();
  updateBossItemBar();
  drawBoss(boss.id);
  bossShowQuestion();
}

function bossShowQuestion() {
  const q = bossState.questions[bossState.currentIndex];
  if (!q) {
    endBossBattle();
    return;
  }

  bossState.answered = false;

  // Determine category display from ID
  const catLabel = getBossCategoryLabel(q.id);
  document.getElementById('boss-question-category').textContent = catLabel;
  document.getElementById('boss-question-text').textContent = q.text;

  // Shuffle choices
  const indexed = q.choices.map((c, i) => ({ text: c, idx: i }));
  const shuffled = shuffleArray(indexed);
  const correctShuffledIdx = shuffled.findIndex(c => c.idx === q.answer);

  const grid = document.getElementById('boss-choices-grid');
  const labels = ['A', 'B', 'C', 'D'];
  grid.innerHTML = shuffled.map((choice, si) => `
    <button class="choice-btn" onclick="bossSubmitAnswer(${si}, ${correctShuffledIdx}, '${q.id}')">
      <span class="choice-label">${labels[si]}</span>
      ${escapeHtml(choice.text)}
    </button>
  `).join('');

  // Hide boss explanation and next btn
  document.getElementById('boss-explanation-area').classList.remove('show');
  document.getElementById('boss-next-btn').style.display = 'none';

  updateBossItemBar();
}

function getBossCategoryLabel(qId) {
  const match = qId.match(/^g(\d)s(\d)([a-z]+)\d+$/);
  if (!match) return qId;
  const g = match[1], s = match[2], sub = match[3];
  return `中${g} ${s === '1' ? '前期' : '後期'} // ${SUBJECT_NAMES[sub] || sub}`;
}

function bossSubmitAnswer(selectedIdx, correctIdx, qId) {
  if (bossState.answered) return;
  bossState.answered = true;

  const buttons = document.querySelectorAll('#boss-choices-grid .choice-btn');
  buttons.forEach(btn => btn.disabled = true);

  const isCorrect = selectedIdx === correctIdx;

  buttons[correctIdx].classList.add('correct');
  if (!isCorrect) {
    buttons[selectedIdx].classList.add('wrong');
    if (bossState.shieldActive) {
      bossState.shieldActive = false;
      // Shield blocked the wrong answer — show shield effect
      showBossMessage('🛡 SHIELD BLOCKED!', '#00ffff');
    } else {
      bossState.wrong++;
      // Player hit flash
      document.getElementById('boss-overlay').classList.add('player-hit');
      setTimeout(() => document.getElementById('boss-overlay').classList.remove('player-hit'), 300);
    }
  } else {
    bossState.correct++;
    bossState.hp--;
    bossDamageEffect();
  }

  updateBossHUD();
  showExplanation(qId, 'boss-explanation-text', 'boss-explanation-area');
  document.getElementById('boss-next-btn').style.display = 'block';

  if (bossState.currentIndex >= BOSS_QUESTIONS_COUNT - 1) {
    document.getElementById('boss-next-btn').textContent = 'FINISH ▶';
  } else {
    document.getElementById('boss-next-btn').textContent = 'NEXT ▶';
  }
}

function bossNextQuestion() {
  bossState.currentIndex++;
  if (bossState.currentIndex >= BOSS_QUESTIONS_COUNT) {
    endBossBattle();
  } else {
    bossShowQuestion();
  }
}

function endBossBattle() {
  const victory = bossState.correct >= BOSS_WIN_THRESHOLD;

  // Show result overlay
  const resultDiv = document.createElement('div');
  resultDiv.className = 'boss-result-overlay';
  if (victory) {
    resultDiv.style.background = 'rgba(0,255,136,0.1)';
    resultDiv.innerHTML = `
      <div class="boss-result-text victory">BOSS DEFEATED!</div>
      <div style="font-size:10px;color:#00ff88;text-align:center;line-height:2">${bossState.correct}/${BOSS_QUESTIONS_COUNT} 正解</div>
    `;
  } else {
    resultDiv.style.background = 'rgba(255,34,68,0.1)';
    resultDiv.innerHTML = `
      <div class="boss-result-text defeat">MISSION FAILED</div>
      <div style="font-size:10px;color:#ff2244;text-align:center;line-height:2">${bossState.correct}/${BOSS_QUESTIONS_COUNT} 正解 (必要: ${BOSS_WIN_THRESHOLD})</div>
    `;
  }

  // Add close btn
  const btn = document.createElement('button');
  btn.className = 'cyber-btn primary';
  btn.style.width = '200px';
  btn.textContent = victory ? '▶ LOOT DROP' : '▶ CONTINUE';
  btn.onclick = () => {
    resultDiv.remove();
    bossState.active = false;
    document.getElementById('boss-overlay').classList.remove('active');

    if (victory) {
      // Achievement
      unlockAchievement(bossState.boss.achievement);
      if (bossState.correct === BOSS_QUESTIONS_COUNT) unlockAchievement('perfect_override');
      // Open gacha
      openGacha();
    } else {
      resumeAfterBoss();
    }
  };
  resultDiv.appendChild(btn);
  document.getElementById('boss-overlay').appendChild(resultDiv);
}

function resumeAfterBoss() {
  showScreen('quiz-screen');
  updateHUD();
  showQuestion();
}

function updateBossHUD() {
  const hpPct = (bossState.hp / BOSS_MAX_HP) * 100;
  document.getElementById('boss-hp-bar').style.width = hpPct + '%';
  document.getElementById('boss-hp-num').textContent = bossState.hp;
  document.getElementById('boss-correct').textContent = bossState.correct;
  document.getElementById('boss-wrong').textContent = bossState.wrong;
  document.getElementById('boss-remaining').textContent = BOSS_QUESTIONS_COUNT - bossState.currentIndex;
}

function bossDamageEffect() {
  // Flash
  const flash = document.getElementById('boss-hit-flash');
  flash.classList.add('flash');
  setTimeout(() => flash.classList.remove('flash'), 150);

  // Damage number
  const dmgNum = document.getElementById('boss-damage-num');
  dmgNum.textContent = '-1';
  dmgNum.style.color = bossState.boss ? bossState.boss.color : '#ff2244';
  dmgNum.classList.add('show');
  setTimeout(() => dmgNum.classList.remove('show'), 500);

  // Redraw boss with shake
  const canvas = document.getElementById('boss-canvas');
  canvas.style.animation = 'shake 0.3s ease';
  setTimeout(() => { canvas.style.animation = ''; }, 300);

  // Particle explosion
  spawnBossParticles(bossState.boss ? bossState.boss.color : '#ff2244');
}

function spawnBossParticles(color) {
  const wrap = document.querySelector('.boss-canvas-wrap');
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'boss-particle';
    p.style.background = color;
    p.style.boxShadow = `0 0 4px ${color}`;
    p.style.left = (50 + Math.random() * 80 - 40) + 'px';
    p.style.top = (50 + Math.random() * 80 - 40) + 'px';
    const tx = (Math.random() * 100 - 50) + 'px';
    const ty = (Math.random() * 100 - 50) + 'px';
    p.style.setProperty('--tx', tx);
    p.style.setProperty('--ty', ty);
    wrap.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

function showBossMessage(msg, color) {
  const dmgNum = document.getElementById('boss-damage-num');
  dmgNum.textContent = msg;
  dmgNum.style.color = color;
  dmgNum.style.fontSize = '12px';
  dmgNum.classList.add('show');
  setTimeout(() => {
    dmgNum.classList.remove('show');
    dmgNum.style.fontSize = '20px';
  }, 800);
}

// ============================================
// BATTLE ITEMS
// ============================================

function updateBossItemBar() {
  const bar = document.getElementById('battle-item-bar');
  bar.innerHTML = Object.entries(BATTLE_ITEM_DEFS).map(([type, def]) => {
    const count = battleItemCounts[type] || 0;
    return `
      <button class="battle-item-btn" onclick="useBattleItem('${type}')"
        ${count === 0 || bossState.answered ? 'disabled' : ''}>
        <span class="battle-item-icon">${def.icon}</span>
        <span>${def.name}</span>
        <span class="battle-item-count">x${count}</span>
      </button>
    `;
  }).join('');
}

function useBattleItem(type) {
  if ((battleItemCounts[type] || 0) <= 0) return;
  if (bossState.answered) return;

  battleItemCounts[type]--;
  saveBattleItems(battleItemCounts);

  switch (type) {
    case 'damage':
      useDamageItem();
      break;
    case 'hint':
      useHintItem();
      break;
    case 'shield':
      useShieldItem();
      break;
    case 'autocorrect':
      useAutocorrectItem();
      break;
  }

  updateBossItemBar();
}

function useDamageItem() {
  bossState.hp = Math.max(0, bossState.hp - 1);
  bossDamageEffect();
  updateBossHUD();

  // Auto-skip current question
  bossState.answered = true;
  bossState.correct++;
  const buttons = document.querySelectorAll('#boss-choices-grid .choice-btn');
  buttons.forEach(btn => btn.disabled = true);
  document.getElementById('boss-next-btn').style.display = 'block';
  showBossMessage('💣 EMP HIT!', '#ff6600');
}

function useHintItem() {
  const q = bossState.questions[bossState.currentIndex];
  if (!q) return;

  // Find the correct button in the grid
  const buttons = document.querySelectorAll('#boss-choices-grid .choice-btn');
  // The correct answer corresponds to the button that was rendered with correctIdx
  // We need to find it — we stored the info in the onclick attr
  // Actually we need to check which button is correct. Find it by checking data.
  // Re-detect: click on buttons and check their onclick includes 'correctIdx'
  // Simpler: scan grid buttons for the one with onclick matching correctShuffledIdx
  // We don't have direct access, so we'll mark via class
  const grid = document.getElementById('boss-choices-grid');
  const btns = grid.querySelectorAll('.choice-btn');
  btns.forEach(btn => {
    const match = btn.getAttribute('onclick') || '';
    // onclick="bossSubmitAnswer(si, correctIdx, qId)"
    const parts = match.match(/bossSubmitAnswer\((\d+),\s*(\d+)/);
    if (parts && parts[1] === parts[2]) {
      btn.classList.add('hint-glow');
    }
  });
}

function useShieldItem() {
  bossState.shieldActive = true;
  showBossMessage('🛡 SHIELD ON!', '#00ffff');
}

function useAutocorrectItem() {
  if (bossState.answered) return;
  bossState.answered = true;

  const buttons = document.querySelectorAll('#boss-choices-grid .choice-btn');
  buttons.forEach(btn => btn.disabled = true);

  // Find correct button
  const grid = document.getElementById('boss-choices-grid');
  const btns = grid.querySelectorAll('.choice-btn');
  btns.forEach(btn => {
    const match = btn.getAttribute('onclick') || '';
    const parts = match.match(/bossSubmitAnswer\((\d+),\s*(\d+)/);
    if (parts && parts[1] === parts[2]) {
      btn.classList.add('correct');
    }
  });

  bossState.correct++;
  bossState.hp--;
  bossDamageEffect();
  updateBossHUD();

  const q = bossState.questions[bossState.currentIndex];
  if (q) showExplanation(q.id, 'boss-explanation-text', 'boss-explanation-area');

  document.getElementById('boss-next-btn').style.display = 'block';
  showBossMessage('🎯 AUTO-AIM!', '#00ff88');
}

// ============================================
// GACHA SYSTEM
// ============================================

function openGacha() {
  gachaState.spinning = false;
  document.getElementById('gacha-result').style.display = 'none';
  document.getElementById('gacha-spin-btn').style.display = 'block';
  document.getElementById('gacha-close-btn').style.display = 'none';
  drawGachaMachine();
  renderGachaCollection();

  document.getElementById('gacha-overlay').classList.add('active');
}

function spinGacha() {
  if (gachaState.spinning) return;
  gachaState.spinning = true;

  document.getElementById('gacha-spin-btn').style.display = 'none';

  // Animate gacha canvas
  let frames = 0;
  const maxFrames = 20;
  const anim = setInterval(() => {
    drawGachaMachineSpinning(frames);
    frames++;
    if (frames >= maxFrames) {
      clearInterval(anim);
      doGachaDrop();
    }
  }, 60);
}

function doGachaDrop() {
  // Weighted random selection
  const totalWeight = GACHA_ITEMS.reduce((s, i) => s + i.weight, 0);
  let rng = Math.random() * totalWeight;
  let selected = GACHA_ITEMS[0];
  for (const item of GACHA_ITEMS) {
    rng -= item.weight;
    if (rng <= 0) { selected = item; break; }
  }

  // Save to collection
  const col = loadGachaCollection();
  col[selected.id] = (col[selected.id] || 0) + 1;
  saveGachaCollection(col);

  // If battle item, add to counts
  if (selected.battleType) {
    battleItemCounts[selected.battleType] = (battleItemCounts[selected.battleType] || 0) + 1;
    saveBattleItems(battleItemCounts);
  }

  // Display result
  document.getElementById('gacha-rarity').textContent = selected.rarity;
  document.getElementById('gacha-rarity').className = `gacha-rarity ${selected.rarityClass}`;
  document.getElementById('gacha-item-icon').textContent = selected.icon;
  document.getElementById('gacha-item-name').textContent = selected.name;
  document.getElementById('gacha-item-desc').textContent = selected.desc;
  document.getElementById('gacha-result').style.display = 'flex';
  document.getElementById('gacha-close-btn').style.display = 'block';

  renderGachaCollection();

  // Achievements
  const uniqueCount = Object.keys(col).length;
  if (uniqueCount >= 5) unlockAchievement('loot_hoarder');
  if (selected.rarity === 'レジェンダリー') unlockAchievement('legendary_drop');
  if (!loadAchievements().includes('first_drop')) unlockAchievement('first_drop');

  gachaState.spinning = false;
}

function closeGacha() {
  document.getElementById('gacha-overlay').classList.remove('active');
  resumeAfterBoss();
}

function renderGachaCollection() {
  const col = loadGachaCollection();
  const container = document.getElementById('gacha-collection');

  const owned = GACHA_ITEMS.filter(item => col[item.id]);
  if (owned.length === 0) {
    container.innerHTML = '<div style="font-size:7px;color:#334466;text-align:center;grid-column:1/-1">まだアイテムなし</div>';
    return;
  }

  container.innerHTML = owned.map(item => `
    <div class="gacha-col-item" title="${item.name}">
      ${item.icon}
      <span class="item-count">x${col[item.id]}</span>
    </div>
  `).join('');
}

function drawGachaMachine() {
  const canvas = document.getElementById('gacha-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#0a0018';
  ctx.fillRect(0, 0, W, H);

  // Draw supply crate pixel art
  const grid = 8;
  const crate = [
    '0000000000000000',
    '0CCCCCCCCCCCCCC0',
    '0CYYYYYYYYYYYY0',
    '0CYYYYYYYYYYYY0',
    '0CYYYMMMYYYYY0',
    '0CYYYMMMYYYYY0',
    '0CYYYYYYYYYYYY0',
    '0CCCCCCCCCCCCCC0',
    '0GGGGGGGGGGGGG0',
    '0GYYYYYYYYYYYY0',
    '0GYYYYYYYYYYYY0',
    '0GYYYMMMYYYYY0',
    '0GYYYMMMYYYYY0',
    '0GYYYYYYYYYYYY0',
    '0GGGGGGGGGGGGG0',
    '0000000000000000'
  ];

  const colors = {
    '0': null,
    'C': '#aa00ff',
    'Y': '#ffff00',
    'M': '#ff00ff',
    'G': '#6600aa'
  };

  crate.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (colors[ch]) {
        ctx.fillStyle = colors[ch];
        ctx.fillRect(rx * grid, ry * grid, grid, grid);
      }
    });
  });

  // Glow effect
  ctx.shadowColor = '#aa00ff';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#aa00ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, W - 2, H - 2);
  ctx.shadowBlur = 0;
}

function drawGachaMachineSpinning(frame) {
  const canvas = document.getElementById('gacha-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#0a0018';
  ctx.fillRect(0, 0, W, H);

  // Flash colors
  const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff88', '#ff6600', '#aa00ff'];
  const c = colors[frame % colors.length];

  ctx.fillStyle = c;
  ctx.shadowColor = c;
  ctx.shadowBlur = 15;

  // Random pixels for spin effect
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(Math.random() * 14) * 8 + 4;
    const y = Math.floor(Math.random() * 14) * 8 + 4;
    ctx.fillRect(x, y, 8, 8);
  }
  ctx.shadowBlur = 0;
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================

let achievementQueue = [];
let achievementShowing = false;

function unlockAchievement(id) {
  const unlocked = loadAchievements();
  if (unlocked.includes(id)) return;

  unlocked.push(id);
  saveAchievements(unlocked);

  achievementQueue.push(id);
  if (!achievementShowing) processAchievementQueue();
}

function processAchievementQueue() {
  if (achievementQueue.length === 0) {
    achievementShowing = false;
    return;
  }

  achievementShowing = true;
  const id = achievementQueue.shift();
  const def = ACHIEVEMENTS[id];
  if (!def) { processAchievementQueue(); return; }

  const popup = document.getElementById('achievement-popup');
  document.getElementById('achievement-icon').textContent = def.icon;
  document.getElementById('achievement-name').textContent = def.name;

  popup.classList.remove('hide');
  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
    popup.classList.add('hide');
    setTimeout(() => {
      popup.classList.remove('hide');
      achievementShowing = false;
      processAchievementQueue();
    }, 300);
  }, 4000);
}

// ============================================
// EXPLANATION SYSTEM
// ============================================

function showExplanation(qId, textElId, areaElId) {
  if (typeof EXPLANATIONS === 'undefined') return;
  const text = EXPLANATIONS[qId];
  if (!text) return;

  document.getElementById(textElId).textContent = text;
  document.getElementById(areaElId).classList.add('show');
}

// ============================================
// PIXEL ART — BOSS DRAWINGS
// ============================================

function drawBoss(bossId) {
  const canvas = document.getElementById('boss-canvas');
  const ctx = canvas.getContext('2d');
  const W = 160, H = 160;
  const grid = 8; // 20 cells × 8px = 160px

  ctx.clearRect(0, 0, W, H);

  switch (bossId) {
    case 'neon_reaper':  drawNeonReaper(ctx, grid); break;
    case 'iron_tyrant':  drawIronTyrant(ctx, grid); break;
    case 'ghost_protocol': drawGhostProtocol(ctx, grid); break;
    case 'chrome_queen': drawChromeQueen(ctx, grid); break;
    case 'void_striker': drawVoidStriker(ctx, grid); break;
    case 'data_wraith':  drawDataWraith(ctx, grid); break;
    default: drawNeonReaper(ctx, grid);
  }
}

function drawPixelGrid(ctx, grid, rows, palette) {
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const color = palette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(rx * grid, ry * grid, grid, grid);
        // Neon glow for bright colors
        if (ch !== '.' && ch !== 'K' && ch !== 'G') {
          ctx.shadowColor = color;
          ctx.shadowBlur = 4;
          ctx.fillRect(rx * grid + 1, ry * grid + 1, grid - 2, grid - 2);
          ctx.shadowBlur = 0;
        }
      }
    });
  });
}

// NEON REAPER — AI Hacker (cyan/dark)
function drawNeonReaper(ctx, g) {
  const p = {
    '.': null,
    'C': '#00ffff',
    'c': '#007777',
    'W': '#e0e8ff',
    'K': '#111122',
    'G': '#334466',
    'M': '#ff00ff',
    'Y': '#ffff00'
  };
  const rows = [
    '.....CCCCCCCC.....',
    '....CCWWWWWWCC....',
    '...CCWKCCCCKCWCC..',
    '...CWKCCC.CCKCWC..',
    '...CWKCCYMCCKC....',
    '...CWKCCYMCCWC....',
    '....CCWWWWWWCC....',
    '.....CCCCCCCC.....',
    '....CGCCCCGC......',
    '...CCGCCCCGCC.....',
    '..CCGGGGGGGGCC....',
    '..CGGCCCCCCCGC....',
    '..CGCCCCCCCCC.....',
    '..CGGCCCCCCCGC....',
    '...CGCCCCCCCCC....',
    '....CCCCCCCCC.....',
    '....CGCCCCCGC.....',
    '...CGCCCCCCCC.....',
    '..CGC......CGC....',
    '.CGC........CGC...'
  ];
  drawPixelGrid(ctx, g, rows, p);
}

// IRON TYRANT — Battle Mech (orange/gray)
function drawIronTyrant(ctx, g) {
  const p = {
    '.': null,
    'O': '#ff6600',
    'o': '#994400',
    'G': '#888888',
    'g': '#555555',
    'W': '#ffffff',
    'K': '#222222',
    'Y': '#ffff00'
  };
  const rows = [
    '....OOOOOOOOOO....',
    '...OOOGGGGGGOOO...',
    '..OOGGKGGGGKGGOO..',
    '..OGGKOOOOOOKGGOO.',
    '..OGGKOYYYOKGGOO..',
    '..OGGKOOOOOKGGOO..',
    '..OOOGGGGGGOOO....',
    '...OOOOOOOOOO.....',
    'OOOOOGGGGGGOOOOOO.',
    'OGGGGGGGGGGGGGGGO.',
    'OGGGOOOOOOOOGGGO..',
    'OGGGOOOOOOOOGGGO..',
    'OGGGGGGGGGGGGGGGO.',
    'OOOOOGGGGGGOOOOOO.',
    '....OOOOOOOOO.....',
    '...OOOGGGGGGOOO...',
    '..OOOGGGGGGGOOO...',
    '..OOOGOOOOOOGOO...',
    '..OGGOOOOOOOGO....',
    '..OOOOOOOOOOOO....'
  ];
  drawPixelGrid(ctx, g, rows, p);
}

// GHOST PROTOCOL — Cyber Assassin AI (purple/dark)
function drawGhostProtocol(ctx, g) {
  const p = {
    '.': null,
    'P': '#aa00ff',
    'p': '#550088',
    'W': '#e0e8ff',
    'K': '#0d0020',
    'G': '#444466',
    'C': '#00ffff',
    'M': '#ff00ff'
  };
  const rows = [
    '.......PPPP.......',
    '......PPWWPP......',
    '.....PPWKWKWPP....',
    '.....PWKCPPCKWP...',
    '.....PWKMPPMKWP...',
    '.....PPWWWWWWPP...',
    '.....CPPPPPPPC....',
    '....CPPPPPPPPPC...',
    '....PGPPPPPPPGP...',
    '...PPGGGPPPGGGPP..',
    '...PGGPPPPPPPGGP..',
    '...PGPPPPPPPPPGP..',
    '...PPGGGPPPGGGPP..',
    '....PGPPPPPPPGP...',
    '.....PPPPPPPP.....',
    '....PGGPPPPGGP....',
    '...PPGGPPPPGGPP...',
    '..PPPGGPPPPGGPPP..',
    '..PGG..PPPP..GGP..',
    '..PG....PP....GP..'
  ];
  drawPixelGrid(ctx, g, rows, p);
}

// CHROME QUEEN — Cyber AI Queen (magenta/silver)
function drawChromeQueen(ctx, g) {
  const p = {
    '.': null,
    'M': '#ff00ff',
    'm': '#880088',
    'S': '#cccccc',
    's': '#888888',
    'W': '#ffffff',
    'K': '#1a0018',
    'Y': '#ffff00',
    'C': '#00ffff'
  };
  const rows = [
    '...MMMSSSSSSMM....',
    '..MMSSSSSSSSSMM...',
    '.MMSSSWWWWWSSSMM..',
    '.MSSWWKSSSSKWWSM..',
    '.MSSWKSMYYSMKWSM..',
    '.MSSWWKSSSSKWWSM..',
    '..MMSSSWWWWSSSMM..',
    '..MMSSSMSMSSSM....',
    '.MMMMCMSMSMCMM....',
    '.MSSMMSSSSSSSSM...',
    '.MSSSSSSSSSSSM....',
    '.MSSMMSSSSSSSSM...',
    '.MMMMSSSSSSSSSM...',
    '..MMSSSSSSSSSMM...',
    '...MMMMSSSSMMM....',
    '....MMMSSSMMM.....',
    '...MMMSSSSSMM.....',
    '..MMMSSSSSSMM.....',
    '..MM..SSSS..MM....',
    '..M....SS....M....'
  ];
  drawPixelGrid(ctx, g, rows, p);
}

// VOID STRIKER — Void Mech (deep blue/purple)
function drawVoidStriker(ctx, g) {
  const p = {
    '.': null,
    'V': '#4400ff',
    'v': '#220088',
    'B': '#0000cc',
    'C': '#00ffff',
    'W': '#e0e8ff',
    'K': '#08001a',
    'P': '#aa00ff'
  };
  const rows = [
    '...VVVVVVVVVVV....',
    '..VVWWWWWWWWWVV...',
    '..VWWKVVVVVKWWV...',
    '..VWKVCCCCCKVWV...',
    '..VWKVPVVVPKVWV...',
    '..VWKVCCCCCKVWV...',
    '..VVWWWWWWWWWVV...',
    '...VVVVVVVVVVV....',
    'VVVVVVBBBBBBVVVVV.',
    'VBBBBBBBBBBBBBBBV.',
    'VBBVVVVBBBBVVVBBV.',
    'VBBVVVVBBBBVVVBBV.',
    'VBBBBBBBBBBBBBBBV.',
    'VVVVVVBBBBBBVVVVV.',
    '....VVVVVVVVV.....',
    '...VVVBBBBVVVV....',
    '...VBBBBBBBBVV....',
    '...VBBVVVVBBVV....',
    '...VBB....BBVV....',
    '...VV......VVV....'
  ];
  drawPixelGrid(ctx, g, rows, p);
}

// DATA WRAITH — Data Ghost (green/dark)
function drawDataWraith(ctx, g) {
  const p = {
    '.': null,
    'E': '#00ff88',
    'e': '#007744',
    'K': '#001a0d',
    'G': '#004422',
    'W': '#e0e8ff',
    'Y': '#ffff00',
    'C': '#00ffff'
  };
  const rows = [
    '.....EEEEEEEE.....',
    '....EEWWWWWWEE....',
    '...EEWKEEEEEKWEE..',
    '...EWKECYYCEKWEE..',
    '...EWKEEEEEEEKWE..',
    '...EEWKEEEEEKWEE..',
    '....EEWWWWWWEE....',
    '.....EEEEEEEE.....',
    '....EGEEEEEGE.....',
    '...EEGEEEEEGEE....',
    '..EEGGGGGGGGEE....',
    '..EGGKKKKKKKGE....',
    '..EGKEEEEEEEKE....',
    '..EGGKKKKKKKGE....',
    '...EGEEEEEGEE.....',
    '....EGEEEEEGE.....',
    '.....EEEEEEE......',
    '....EGEEEEGE......',
    '...EGE....EGE.....',
    '..EGE......EGE....'
  ];
  drawPixelGrid(ctx, g, rows, p);
}

// ============================================
// TITLE SCREEN PIXEL ART
// ============================================

function drawTitleArt() {
  const canvas = document.getElementById('title-canvas');
  const ctx = canvas.getContext('2d');
  const g = 8;

  ctx.fillStyle = '#06060f';
  ctx.fillRect(0, 0, 160, 160);

  // Draw a cyber city skyline / hacker emblem
  const p = {
    '.': null,
    'C': '#00ffff',
    'M': '#ff00ff',
    'Y': '#ffff00',
    'G': '#00ff88',
    'O': '#ff6600',
    'K': '#111133',
    'W': '#e0e8ff',
    'P': '#aa00ff'
  };

  const rows = [
    '.....YYYYYYY......',
    '....YYYYYYYYYY....',
    '...YYYY.CCC.YYY...',
    '...YYY.CCCCC.YY...',
    '...YY.CCCCCCC.YY..',
    '...YY.CMCMCMC.YY..',
    '...YY.CCCCCCC.YY..',
    '...YYY.CCCCC.YY...',
    '...YYYY.CCC.YYY...',
    '....YYYYYYYYYYY...',
    '.....YYYYYYY......',
    '......YYYYY.......',
    '.KKKKKKKKKKKKKKKK.',
    '.KMMKKKKKKKKKMMKK.',
    '.KMMKCOOOOCKMMKK..',
    '.KKKKCOOOOOCKKKK..',
    '.KKKKCOOOOOCKKKK..',
    '.KKKKCCCCCCCKKKK..',
    '.KKKKKKKKKKKKKKKK.',
    '.KKKKKKKKKKKKKKKK.'
  ];

  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const color = p[ch];
      if (color) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.fillRect(rx * g, ry * g, g, g);
      }
    });
  });
  ctx.shadowBlur = 0;
}

// ============================================
// TITLE STATS
// ============================================

function updateTitleStats() {
  const wrongIds = loadWrongIds();
  const achievements = loadAchievements();
  const col = loadGachaCollection();
  const items = loadBattleItems();

  const container = document.getElementById('title-stats');
  container.innerHTML = `
    間違い: ${wrongIds.length}問 | 実績: ${achievements.length}/${Object.keys(ACHIEVEMENTS).length}<br>
    アイテム: 💣${items.damage || 0} 💾${items.hint || 0} 🛡${items.shield || 0} 🎯${items.autocorrect || 0}
  `;
}

// ============================================
// UTILITY
// ============================================

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================
// FIREBASE AUTH
// ============================================

function initAuth() {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      battleItemCounts = loadBattleItems();
      updateTitleStats();
      updateUserDisplay();
      showScreen('title-screen');
    } else {
      showScreen('auth-screen');
    }
  });
}

function showAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
  document.getElementById('auth-form-login').style.display = isLogin ? 'flex' : 'none';
  document.getElementById('auth-form-register').style.display = isLogin ? 'none' : 'flex';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'EMAIL と PASSWORD を入力してください';
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged will handle screen transition
  } catch(e) {
    errEl.textContent = authErrorMessage(e.code);
  }
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');
  errEl.textContent = '';

  if (!name || !email || !password) {
    errEl.textContent = '全ての項目を入力してください';
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    // onAuthStateChanged will handle screen transition
  } catch(e) {
    errEl.textContent = authErrorMessage(e.code);
  }
}

async function handleLogout() {
  try {
    await auth.signOut();
    // onAuthStateChanged will show auth-screen
  } catch(e) {
    console.error('Logout error:', e);
  }
}

function updateUserDisplay() {
  const el = document.getElementById('user-display');
  if (!el || !currentUser) return;
  const name = escapeHtml(currentUser.displayName || currentUser.email || 'UNKNOWN');
  el.innerHTML = `
    <span class="user-name">${name}</span>
    <button class="cyber-btn small" onclick="handleLogout()">LOGOUT</button>
  `;
}

function authErrorMessage(code) {
  const messages = {
    'auth/invalid-email':            'メールアドレスの形式が不正です',
    'auth/user-not-found':           'アカウントが見つかりません',
    'auth/wrong-password':           'パスワードが違います',
    'auth/email-already-in-use':     'このメールアドレスは既に使用されています',
    'auth/weak-password':            'パスワードは6文字以上にしてください',
    'auth/invalid-credential':       'メールアドレスまたはパスワードが違います',
    'auth/too-many-requests':        'しばらく待ってから再試行してください',
    'auth/network-request-failed':   'ネットワークエラーが発生しました'
  };
  return messages[code] || `エラーが発生しました (${code})`;
}

// ============================================
// FIRESTORE SCORE UPLOAD
// ============================================

async function uploadScore(sessionScore, correctCount, totalCount) {
  if (!currentUser || sessionScore === 0) return;
  try {
    await db.collection('users').doc(currentUser.uid).set({
      displayName: currentUser.displayName || currentUser.email || 'UNKNOWN',
      totalScore:      firebase.firestore.FieldValue.increment(sessionScore),
      gamesPlayed:     firebase.firestore.FieldValue.increment(1),
      correctAnswers:  firebase.firestore.FieldValue.increment(correctCount),
      totalAnswers:    firebase.firestore.FieldValue.increment(totalCount),
      lastPlayed:      firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch(e) {
    console.error('Score upload failed:', e);
  }
}

// ============================================
// RANKING
// ============================================

async function showRanking() {
  showScreen('ranking-screen');
  const listEl = document.getElementById('ranking-list');
  listEl.innerHTML = '<div class="ranking-loading">LOADING...</div>';

  try {
    const snapshot = await db.collection('users')
      .orderBy('totalScore', 'desc')
      .limit(20)
      .get();
    renderRanking(snapshot.docs);
  } catch(e) {
    listEl.innerHTML = '<div class="ranking-error">データ取得に失敗しました</div>';
    console.error('Ranking fetch failed:', e);
  }
}

function renderRanking(docs) {
  const listEl = document.getElementById('ranking-list');

  if (docs.length === 0) {
    listEl.innerHTML = '<div class="ranking-empty">NO DATA YET</div>';
    return;
  }

  const rows = docs.map((doc, i) => {
    const d = doc.data();
    const acc = d.totalAnswers > 0 ? Math.round(d.correctAnswers / d.totalAnswers * 100) : 0;
    const isSelf = currentUser && doc.id === currentUser.uid;
    const rankClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
    const selfClass = isSelf ? ' self' : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
    return `
      <tr class="ranking-row${selfClass} ${rankClass}">
        <td>${medal}</td>
        <td>${escapeHtml(d.displayName || 'UNKNOWN')}</td>
        <td>${d.totalScore || 0}</td>
        <td>${acc}%</td>
        <td>${d.gamesPlayed || 0}</td>
      </tr>
    `;
  }).join('');

  listEl.innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>#</th>
          <th>PLAYER</th>
          <th>SCORE</th>
          <th>ACC</th>
          <th>GAMES</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ============================================
// INIT
// ============================================

window.addEventListener('DOMContentLoaded', () => {
  drawTitleArt();
  initAuth();
});
