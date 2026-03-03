'use strict';

/* ============================================================
   蒼穹の歴史戦線 — ゲームロジック
   問題データは questions.js に定義（先に読み込むこと）
   ============================================================ */

// ========== 英雄データ ==========

const CHARACTERS = [
  { id:'nobunaga',   name:'織田信長',   rarity:'SSR', icon:'🔥', atk:95, def:60, int:80, weight:2 },
  { id:'hideyoshi',  name:'豊臣秀吉',   rarity:'SSR', icon:'⭐', atk:75, def:65, int:95, weight:2 },
  { id:'ieyasu',     name:'徳川家康',   rarity:'SR',  icon:'🛡️', atk:70, def:85, int:85, weight:6 },
  { id:'shingen',    name:'武田信玄',   rarity:'SR',  icon:'⚔️', atk:90, def:75, int:75, weight:6 },
  { id:'kenshin',    name:'上杉謙信',   rarity:'SR',  icon:'⚡', atk:92, def:70, int:72, weight:6 },
  { id:'shikibu',    name:'紫式部',     rarity:'SR',  icon:'📖', atk:55, def:70, int:98, weight:5 },
  { id:'ryoma',      name:'坂本龍馬',   rarity:'R',   icon:'🌊', atk:78, def:65, int:82, weight:15 },
  { id:'masamune',   name:'伊達政宗',   rarity:'R',   icon:'🐺', atk:83, def:70, int:72, weight:15 },
  { id:'yoritomo',   name:'源頼朝',     rarity:'R',   icon:'🏯', atk:72, def:78, int:75, weight:14 },
  { id:'shotoku',    name:'聖徳太子',   rarity:'R',   icon:'🕊️', atk:60, def:75, int:95, weight:12 },
  { id:'ashikaga',   name:'足利尊氏',   rarity:'N',   icon:'🗡️', atk:65, def:60, int:65, weight:17 },
  { id:'kiyomori',   name:'平清盛',     rarity:'N',   icon:'⛩️', atk:70, def:68, int:72, weight:15 },
  { id:'masako',     name:'北条政子',   rarity:'N',   icon:'👑', atk:55, def:72, int:80, weight:16 },
  { id:'goshirakawa',name:'後白河上皇', rarity:'N',   icon:'📜', atk:50, def:65, int:80, weight:14 },
];

// ========== 敵データ（教科別） ==========

const ENEMIES = {
  '国語': [
    { name:'言霊の封神',  icon:'📚', maxHp:80,  reward:15, stage:'STAGE 1 / 国語' },
    { name:'文字の魔王',  icon:'✒️', maxHp:100, reward:20, stage:'STAGE 2 / 国語' },
    { name:'古語の覇者',  icon:'📜', maxHp:130, reward:30, stage:'STAGE 3 / 国語' },
  ],
  '数学': [
    { name:'数式の封神',  icon:'🔢', maxHp:80,  reward:15, stage:'STAGE 1 / 数学' },
    { name:'方程式の竜',  icon:'📐', maxHp:100, reward:20, stage:'STAGE 2 / 数学' },
    { name:'関数の暴君',  icon:'📊', maxHp:130, reward:30, stage:'STAGE 3 / 数学' },
  ],
  '理科': [
    { name:'元素の封魔神', icon:'🔬', maxHp:80,  reward:15, stage:'STAGE 1 / 理科' },
    { name:'化学の竜皇',  icon:'⚗️', maxHp:100, reward:20, stage:'STAGE 2 / 理科' },
    { name:'法則の覇者',  icon:'⚡', maxHp:130, reward:30, stage:'STAGE 3 / 理科' },
  ],
  '社会': [
    { name:'歴史の封神',  icon:'🗺️', maxHp:80,  reward:15, stage:'STAGE 1 / 社会' },
    { name:'地理の魔将',  icon:'🌍', maxHp:100, reward:20, stage:'STAGE 2 / 社会' },
    { name:'封印の覇者',  icon:'⚔️', maxHp:130, reward:30, stage:'STAGE 3 / 社会' },
  ],
  '英語': [
    { name:'言語の封神',  icon:'🌐', maxHp:80,  reward:15, stage:'STAGE 1 / 英語' },
    { name:'文法の魔王',  icon:'📝', maxHp:100, reward:20, stage:'STAGE 2 / 英語' },
    { name:'異邦の覇者',  icon:'🗣️', maxHp:130, reward:30, stage:'STAGE 3 / 英語' },
  ],
};

// ========== 必殺技 ==========

const SPECIALS = [
  { name:'漆黒の絶対領域', damage:40, color:'#ff2244' },
  { name:'蒼穹の覚醒',     damage:50, color:'#2277ff' },
  { name:'無明の滅剣',     damage:45, color:'#aa00ff' },
];

// ========== ゲーム状態 ==========

const LS_KEY = 'soukyu_save';

let gs = {
  orbs:           0,
  collected:      {},
  team:           Array(9).fill(null),
  wrongIds:       [],
  totalBattles:   0,
  totalVictories: 0,
};

let battle = {
  grade: '1', semester: '前期', subject: '社会',
  enemyIdx: 0,
  enemyHp: 100, playerHp: 100,
  questions: [], qIdx: 0,
  combo: 0, specialGauge: 0,
  answered: false, earnedOrbs: 0, correctCount: 0,
};

// ========== 選択状態 ==========

let selectStep     = 0;   // 0=学年 1=学期 2=教科 3=モード
let selectedGrade    = null;
let selectedSemester = null;
let selectedSubject  = null;

let modalTargetChar = null;
let targetSlot = null;

// ========== localStorage ==========

function loadSave() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) Object.assign(gs, JSON.parse(raw));
    if (!Array.isArray(gs.team) || gs.team.length !== 9) gs.team = Array(9).fill(null);
    if (!Array.isArray(gs.wrongIds)) gs.wrongIds = [];
  } catch(e) {}
}

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(gs)); } catch(e) {}
}

// ========== 画面遷移 ==========

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'title-screen')  renderTitleStats();
  if (id === 'gacha-screen')  renderGachaScreen();
  if (id === 'team-screen')   renderTeamScreen();
  if (id === 'review-screen') renderReviewScreen();
}

// ========== タイトル ==========

function renderTitleStats() {
  const owned = Object.keys(gs.collected).length;
  document.getElementById('title-stats').innerHTML =
    `💎 ${gs.orbs} オーブ　👥 ${owned}/${CHARACTERS.length} 英雄　⚔ ${gs.totalVictories} 勝`;
}

// ========== 選択フロー ==========

function showSelectScreen() {
  selectStep = 0;
  selectedGrade = selectedSemester = selectedSubject = null;
  renderSelectStep();
  showScreen('select-screen');
}

function selectBack() {
  if (selectStep === 0) { showScreen('title-screen'); return; }
  selectStep--;
  renderSelectStep();
}

function renderSelectStep() {
  const titles = ['学年を選べ', '学期を選べ', '教科を選べ', '出撃モードを選べ'];
  document.getElementById('select-title').textContent = titles[selectStep];

  const bc = [];
  if (selectedGrade)    bc.push('中学' + selectedGrade + '年');
  if (selectedSemester) bc.push(selectedSemester);
  if (selectedSubject)  bc.push(selectedSubject);
  document.getElementById('select-breadcrumb').textContent = bc.join(' › ');

  const content = document.getElementById('select-step-content');

  if (selectStep === 0) {
    content.innerHTML = `
      <div class="select-grid">
        <button class="select-card" onclick="selectGrade('1')">
          <div class="select-card-icon">🏫</div>
          <div class="select-card-name">中学1年</div>
        </button>
        <button class="select-card" onclick="selectGrade('2')">
          <div class="select-card-icon">🎓</div>
          <div class="select-card-name">中学2年</div>
        </button>
      </div>`;

  } else if (selectStep === 1) {
    content.innerHTML = `
      <div class="select-grid">
        <button class="select-card" onclick="selectSemester('前期')">
          <div class="select-card-icon">🌸</div>
          <div class="select-card-name">前期</div>
          <div class="select-card-sub">4月〜9月</div>
        </button>
        <button class="select-card" onclick="selectSemester('後期')">
          <div class="select-card-icon">🍂</div>
          <div class="select-card-name">後期</div>
          <div class="select-card-sub">10月〜3月</div>
        </button>
      </div>`;

  } else if (selectStep === 2) {
    const subjects = [
      { id:'国語', icon:'📖' },
      { id:'数学', icon:'📐' },
      { id:'理科', icon:'🔬' },
      { id:'社会', icon:'🌍' },
      { id:'英語', icon:'🌐' },
    ];
    content.innerHTML = `
      <div class="select-grid subjects">
        ${subjects.map(s => `
          <button class="select-card" onclick="selectSubject('${s.id}')">
            <div class="select-card-icon">${s.icon}</div>
            <div class="select-card-name">${s.id}</div>
          </button>`).join('')}
      </div>`;

  } else if (selectStep === 3) {
    content.innerHTML = `
      <div class="select-mode-grid">
        <button class="select-mode-card normal" onclick="startNormalBattle()">
          <div class="mode-icon">⚔</div>
          <div class="mode-name">通常学習</div>
          <div class="mode-desc">10問に挑戦してスコアを上げろ！</div>
        </button>
        <button class="select-mode-card vs" onclick="showVSLobby()">
          <div class="mode-icon">👥</div>
          <div class="mode-name">VS対戦</div>
          <div class="mode-desc">友達と10問先取り対決！</div>
        </button>
      </div>`;
  }
}

function selectGrade(g)    { selectedGrade    = g; selectStep = 1; renderSelectStep(); }
function selectSemester(s) { selectedSemester = s; selectStep = 2; renderSelectStep(); }
function selectSubject(s)  { selectedSubject  = s; selectStep = 3; renderSelectStep(); }

function startNormalBattle() {
  startBattle(selectedGrade, selectedSemester, selectedSubject);
}

// ========== バトル開始 ==========

function startBattle(grade, semester, subject) {
  const pool = QUESTIONS[grade][semester][subject];

  battle.grade        = grade;
  battle.semester     = semester;
  battle.subject      = subject;
  battle.enemyIdx     = Math.floor(Math.random() * ENEMIES[subject].length);
  const enemy         = ENEMIES[subject][battle.enemyIdx];
  battle.enemyHp      = enemy.maxHp;
  battle.playerHp     = calcPlayerHp();
  battle.questions    = shuffleArray([...pool]).slice(0, 10);
  battle.qIdx         = 0;
  battle.combo        = 0;
  battle.specialGauge = 0;
  battle.answered     = false;
  battle.earnedOrbs   = 0;
  battle.correctCount = 0;

  showScreen('battle-screen');
  renderBattleHUD();
  showQuestion();
}

function calcPlayerHp() {
  let base = 100;
  gs.team.forEach(id => {
    if (!id) return;
    const c = CHARACTERS.find(c => c.id === id);
    if (c) base += Math.floor(c.def * 0.3);
  });
  return Math.min(base, 200);
}

function calcTeamAtk() {
  let atk = 30;
  gs.team.forEach(id => {
    if (!id) return;
    const c = CHARACTERS.find(c => c.id === id);
    if (c) atk += Math.floor(c.atk * 0.2);
  });
  return atk;
}

// ========== 問題表示 ==========

function showQuestion() {
  const q = battle.questions[battle.qIdx];
  if (!q) { endBattle(true); return; }

  battle.answered = false;
  document.getElementById('question-num').textContent = `Q${battle.qIdx + 1} / ${battle.questions.length}`;
  document.getElementById('question-text').textContent = q.text;
  document.getElementById('battle-feedback').textContent = '';

  const shuffled   = shuffleArray(q.choices.map((c, i) => ({ text: c, orig: i })));
  const correctIdx = shuffled.findIndex(c => c.orig === q.answer);
  const labels     = ['A','B','C','D'];

  document.getElementById('choices-area').innerHTML = shuffled.map((c, i) => `
    <button class="choice-btn" onclick="submitAnswer(${i}, ${correctIdx}, '${q.id}')">
      <span class="choice-label-tag">${labels[i]}</span>${escHtml(c.text)}
    </button>
  `).join('');

  renderBattleHUD();
}

// ========== 回答処理 ==========

function submitAnswer(selectedIdx, correctIdx, qId) {
  if (battle.answered) return;
  battle.answered = true;

  const btns = document.querySelectorAll('.choice-btn');
  btns.forEach(b => b.disabled = true);
  btns[correctIdx].classList.add('correct');

  const isCorrect = selectedIdx === correctIdx;

  if (isCorrect) {
    battle.correctCount++;
    battle.combo++;
    const dmg = calcDamage();
    battle.enemyHp      = Math.max(0, battle.enemyHp - dmg);
    battle.specialGauge = Math.min(100, battle.specialGauge + 20);
    battle.earnedOrbs  += 2;
    showDamage(dmg);
    showComboEffect();
    document.getElementById('battle-feedback').textContent = '✅ 正解！';
  } else {
    btns[selectedIdx].classList.add('wrong');
    battle.combo    = 0;
    battle.playerHp = Math.max(0, battle.playerHp - 15);
    document.getElementById('battle-screen').classList.add('shake');
    setTimeout(() => document.getElementById('battle-screen').classList.remove('shake'), 400);
    document.getElementById('battle-feedback').textContent = '❌ 不正解...';
    if (!gs.wrongIds.find(w => w.id === qId)) {
      gs.wrongIds.push({
        id: qId,
        grade:    battle.grade,
        semester: battle.semester,
        subject:  battle.subject,
      });
      save();
    }
  }

  renderBattleHUD();

  if (battle.enemyHp <= 0)  { setTimeout(() => endBattle(true),  800); return; }
  if (battle.playerHp <= 0) { setTimeout(() => endBattle(false), 800); return; }

  battle.qIdx++;
  setTimeout(showQuestion, 1200);
}

function calcDamage() {
  const base  = calcTeamAtk();
  const bonus = battle.combo >= 3 ? battle.combo * 5 : 0;
  return base + bonus;
}

function showDamage(dmg) {
  const el = document.getElementById('damage-effect');
  el.textContent = `-${dmg}`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 800);
}

function showComboEffect() {
  if (battle.combo < 2) return;
  const el = document.getElementById('combo-overlay');
  el.textContent = `${battle.combo} COMBO!!`;
  el.classList.remove('burst');
  void el.offsetWidth;
  el.classList.add('burst');
}

// ========== 必殺技 ==========

function activateSpecial() {
  if (battle.specialGauge < 100) return;
  battle.specialGauge = 0;

  const sp      = SPECIALS[Math.floor(Math.random() * SPECIALS.length)];
  const overlay = document.getElementById('special-overlay');
  const nameEl  = document.getElementById('special-name');
  nameEl.textContent = sp.name;
  nameEl.style.color = sp.color;
  overlay.classList.add('active');

  setTimeout(() => {
    overlay.classList.remove('active');
    battle.enemyHp    = Math.max(0, battle.enemyHp - sp.damage);
    battle.earnedOrbs += 5;
    showDamage(sp.damage);
    renderBattleHUD();
    if (battle.enemyHp <= 0) setTimeout(() => endBattle(true), 600);
  }, 1800);
}

// ========== HUD更新 ==========

function renderBattleHUD() {
  const enemy  = ENEMIES[battle.subject][battle.enemyIdx];
  const maxPhp = calcPlayerHp();

  document.getElementById('enemy-name').textContent    = enemy.name;
  document.getElementById('enemy-stage').textContent   = enemy.stage;
  document.getElementById('enemy-figure').textContent  = enemy.icon;
  document.getElementById('enemy-hp-bar').style.width  = Math.max(0, (battle.enemyHp / enemy.maxHp) * 100) + '%';
  document.getElementById('enemy-hp-num').textContent  = battle.enemyHp;
  document.getElementById('player-hp-bar').style.width = Math.max(0, (battle.playerHp / maxPhp) * 100) + '%';
  document.getElementById('player-hp-num').textContent = battle.playerHp;
  document.getElementById('combo-num').textContent     = battle.combo;
  document.getElementById('hud-orbs').textContent      = gs.orbs + battle.earnedOrbs;
  document.getElementById('special-gauge-bar').style.width = battle.specialGauge + '%';
  document.getElementById('special-btn').disabled      = battle.specialGauge < 100;
}

// ========== バトル終了 ==========

function endBattle(victory) {
  gs.totalBattles++;
  if (victory) {
    gs.totalVictories++;
    battle.earnedOrbs += ENEMIES[battle.subject][battle.enemyIdx].reward;
  }
  gs.orbs += battle.earnedOrbs;
  save();

  const titleEl = document.getElementById('result-title');
  titleEl.textContent = victory ? 'VICTORY!!' : 'DEFEAT...';
  titleEl.className   = 'result-title ' + (victory ? 'victory' : 'defeat');
  document.getElementById('result-subtitle').textContent =
    victory ? '封印を解放した！' : '魔獣の力に屈した...';
  document.getElementById('result-stats').innerHTML =
    `正解: ${battle.correctCount} / ${battle.questions.length}<br>最大コンボ: ${battle.combo}`;
  document.getElementById('result-orbs').innerHTML =
    `💎 +${battle.earnedOrbs} オーブ獲得！（合計: ${gs.orbs}）`;
  document.getElementById('result-gacha-btn').style.display = victory ? 'flex' : 'none';

  showScreen('battle-result-screen');
}

function goToGacha() { showScreen('gacha-screen'); }

// ========== ガチャ ==========

function renderGachaScreen() {
  document.getElementById('gacha-orb-num').textContent = gs.orbs;
  document.getElementById('gacha-btn').disabled        = gs.orbs < 10;
  document.getElementById('gacha-result-area').style.display = 'none';
  document.getElementById('gacha-circle').textContent  = '✨';
  renderCollection();
}

function doGacha() {
  if (gs.orbs < 10) return;
  gs.orbs -= 10;
  save();

  const char   = weightedRandom(CHARACTERS);
  gs.collected[char.id] = (gs.collected[char.id] || 0) + 1;
  save();

  const circle = document.getElementById('gacha-circle');
  let frames   = 0;
  const anim   = setInterval(() => {
    circle.textContent = frames % 2 === 0 ? '⚡' : '💫';
    frames++;
    if (frames > 10) {
      clearInterval(anim);
      circle.textContent = char.icon;
      showGachaResult(char);
    }
  }, 80);
}

function showGachaResult(char) {
  const area = document.getElementById('gacha-result-area');
  area.style.display = 'block';
  area.className     = `gacha-result-area rarity-${char.rarity}`;
  area.innerHTML = `
    <div class="result-char-icon">${char.icon}</div>
    <div class="result-char-rarity rarity-${char.rarity}">${char.rarity}</div>
    <div class="result-char-name">${char.name}</div>
    <div class="result-char-stats">⚔ ATK ${char.atk}　🛡 DEF ${char.def}　🧠 INT ${char.int}</div>
  `;
  document.getElementById('gacha-orb-num').textContent = gs.orbs;
  document.getElementById('gacha-btn').disabled        = gs.orbs < 10;
  renderCollection();
}

function renderCollection() {
  const grid  = document.getElementById('collection-grid');
  const owned = CHARACTERS.filter(c => gs.collected[c.id]);
  if (owned.length === 0) {
    grid.innerHTML = '<div style="font-size:12px;color:#553366;grid-column:1/-1;text-align:center;padding:16px">まだ英雄がいない</div>';
    return;
  }
  grid.innerHTML = owned.map(c => `
    <div class="collection-card rarity-${c.rarity}" onclick="openModal('${c.id}')">
      <span class="card-count">×${gs.collected[c.id]}</span>
      <span class="card-icon">${c.icon}</span>
      <span class="card-rarity-badge">${c.rarity}</span>
      <span class="card-name">${c.name}</span>
    </div>
  `).join('');
}

// ========== チーム編成 ==========

function renderTeamScreen() {
  document.getElementById('team-grid').innerHTML = Array(9).fill(0).map((_, i) => {
    const id   = gs.team[i];
    const char = id ? CHARACTERS.find(c => c.id === id) : null;
    return `<div class="team-slot ${char ? 'filled rarity-'+char.rarity : ''}" onclick="openTeamSlotModal(${i})">
      <span class="team-slot-num">${i + 1}番</span>
      ${char
        ? `<span class="team-slot-icon">${char.icon}</span>
           <span class="team-slot-name">${char.name}</span>
           <span class="team-slot-atk">ATK ${char.atk}</span>`
        : `<span class="team-slot-icon" style="font-size:20px;color:#553366">＋</span>
           <span class="team-slot-name" style="color:#553366">空き</span>`}
    </div>`;
  }).join('');
  renderBench();
  renderTeamPower();
}

function renderBench() {
  const onTeam   = new Set(gs.team.filter(Boolean));
  const benchers = CHARACTERS.filter(c => gs.collected[c.id] && !onTeam.has(c.id));
  document.getElementById('bench-grid').innerHTML = benchers.length === 0
    ? '<div style="font-size:12px;color:#553366;grid-column:1/-1;padding:8px">控えなし</div>'
    : benchers.map(c => `
        <div class="collection-card rarity-${c.rarity}" onclick="openModal('${c.id}')">
          <span class="card-icon">${c.icon}</span>
          <span class="card-rarity-badge">${c.rarity}</span>
          <span class="card-name">${c.name}</span>
        </div>`).join('');
}

function renderTeamPower() {
  let power = 0;
  gs.team.forEach(id => {
    if (!id) return;
    const c = CHARACTERS.find(c => c.id === id);
    if (c) power += c.atk + c.def + c.int;
  });
  document.getElementById('team-power-num').textContent = power;
}

function openTeamSlotModal(slotIdx) {
  targetSlot = slotIdx;
  const id   = gs.team[slotIdx];
  if (id) { openModal(id); return; }
  const onTeam    = new Set(gs.team.filter(Boolean));
  const available = CHARACTERS.filter(c => gs.collected[c.id] && !onTeam.has(c.id));
  if (available.length > 0) openModal(available[0].id);
}

// ========== モーダル ==========

function openModal(charId) {
  const char = CHARACTERS.find(c => c.id === charId);
  if (!char) return;
  modalTargetChar = char;

  document.getElementById('modal-char-icon').textContent = char.icon;
  const rarityEl = document.getElementById('modal-char-rarity');
  rarityEl.textContent = char.rarity;
  rarityEl.className   = `modal-char-rarity rarity-${char.rarity}`;
  document.getElementById('modal-char-name').textContent  = char.name;
  document.getElementById('modal-char-stats').innerHTML   =
    `⚔ ATK ${char.atk}　🛡 DEF ${char.def}　🧠 INT ${char.int}`;

  const onTeam = gs.team.includes(char.id);
  const btn    = document.getElementById('modal-team-btn');
  btn.textContent = onTeam ? '外す' : 'スタメン登録';
  btn.className   = onTeam ? 'btn-ghost' : 'btn-primary';

  document.getElementById('char-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('char-modal').classList.remove('active');
  modalTargetChar = null;
  targetSlot      = null;
}

function toggleTeamMember() {
  if (!modalTargetChar) return;
  const id     = modalTargetChar.id;
  const onTeam = gs.team.includes(id);
  if (onTeam) {
    gs.team = gs.team.map(t => t === id ? null : t);
  } else {
    const idx = targetSlot !== null ? targetSlot : gs.team.indexOf(null);
    if (idx >= 0) gs.team[idx] = id;
  }
  save();
  closeModal();
  renderTeamScreen();
}

// ========== 復習 ==========

function renderReviewScreen() {
  const list = document.getElementById('review-list');
  if (gs.wrongIds.length === 0) {
    list.innerHTML = '<div class="review-empty">封印はない。<br>全て正解している！</div>';
    return;
  }
  list.innerHTML = gs.wrongIds.map(w => {
    const q = QUESTION_MAP[w.id];
    if (!q) return '';
    const label = w.grade ? `中${w.grade}年 ${w.semester} ${w.subject}` : (w.field || '');
    return `<div class="review-item">
      <div class="review-item-field">${label}</div>
      <div class="review-item-text">${escHtml(q.text)}</div>
      <div style="font-size:11px;color:#553366;margin-top:4px">正解: ${escHtml(q.choices[q.answer])}</div>
    </div>`;
  }).filter(Boolean).join('');
}

// ========== LINE招待（VSバトル用） ==========

function inviteViaLine(roomId) {
  const url  = window.location.origin + window.location.pathname + '?room=' + roomId;
  const text = 'ドリルバトルで勝負だ！【招待コード：' + roomId + '】 ' + url;
  window.location.href =
    'https://social-plugins.line.me/lineit/share?url=' +
    encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
}

// ========== ユーティリティ ==========

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedRandom(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ========== 初期化 ==========

window.addEventListener('DOMContentLoaded', () => {
  loadSave();
  renderTitleStats();
});
