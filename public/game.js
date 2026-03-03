'use strict';

/* ============================================
   蒼穹の歴史戦線 — ゲームロジック
   ============================================ */

// ========== 問題データ ==========

const QUESTIONS = {
  geography: [
    { id:'g01', text:'日本の首都はどこ？', choices:['大阪','東京','名古屋','福岡'], answer:1 },
    { id:'g02', text:'世界で最も長い川は？', choices:['アマゾン川','長江','ナイル川','ミシシッピ川'], answer:2 },
    { id:'g03', text:'日本の最高峰は？', choices:['白山','槍ヶ岳','北岳','富士山'], answer:3 },
    { id:'g04', text:'赤道が通過しない大陸はどれ？', choices:['アフリカ大陸','南アメリカ大陸','ユーラシア大陸','オーストラリア大陸'], answer:2 },
    { id:'g05', text:'6大陸の中で最も面積が大きいのは？', choices:['アフリカ大陸','ユーラシア大陸','北アメリカ大陸','南アメリカ大陸'], answer:1 },
    { id:'g06', text:'日本の標準時子午線（東経何度）？', choices:['東経120度','東経130度','東経135度','東経140度'], answer:2 },
    { id:'g07', text:'北海道の道庁所在地は？', choices:['函館市','旭川市','釧路市','札幌市'], answer:3 },
    { id:'g08', text:'三大洋のうち最も大きいのは？', choices:['大西洋','インド洋','北極海','太平洋'], answer:3 },
    { id:'g09', text:'ユーラシア大陸の西端に位置する国は？', choices:['スペイン','フランス','ポルトガル','イギリス'], answer:2 },
    { id:'g10', text:'オーストラリア大陸の中央部に広がる気候帯は？', choices:['熱帯','温帯','乾燥帯','冷帯'], answer:2 },
    { id:'g11', text:'本州・四国・九州・北海道のうち面積が最も大きいのは？', choices:['本州','四国','九州','北海道'], answer:0 },
    { id:'g12', text:'アフリカ大陸のナイル川が注ぐ海は？', choices:['大西洋','インド洋','地中海','紅海'], answer:2 },
  ],
  history: [
    { id:'h01', text:'鎌倉幕府を開いたのは誰？', choices:['平清盛','源義経','後白河上皇','源頼朝'], answer:3 },
    { id:'h02', text:'東大寺に安置されている巨大な仏像の名称は？', choices:['釈迦如来像','薬師如来像','阿弥陀如来像','盧遮那仏（大仏）'], answer:3 },
    { id:'h03', text:'江戸幕府の初代将軍は？', choices:['徳川秀忠','徳川家光','豊臣秀吉','徳川家康'], answer:3 },
    { id:'h04', text:'「天下布武」を掲げた戦国武将は？', choices:['豊臣秀吉','徳川家康','武田信玄','織田信長'], answer:3 },
    { id:'h05', text:'743年に土地の私有を認めた法令は？', choices:['大宝律令','班田収授法','荘園整理令','墾田永年私財法'], answer:3 },
    { id:'h06', text:'「源氏物語」を書いた平安時代の女性は？', choices:['清少納言','和泉式部','藤原道長','紫式部'], answer:3 },
    { id:'h07', text:'1185年、壇ノ浦の戦いで滅んだのは？', choices:['源氏','藤原氏','橘氏','平氏'], answer:3 },
    { id:'h08', text:'1192年、源頼朝が就いた役職は？', choices:['関白','太政大臣','摂政','征夷大将軍'], answer:3 },
    { id:'h09', text:'「冠位十二階」を制定した人物は？', choices:['天武天皇','藤原鎌足','中大兄皇子','聖徳太子'], answer:3 },
    { id:'h10', text:'奈良に都が置かれた時代を何という？', choices:['飛鳥時代','弥生時代','平安時代','奈良時代'], answer:3 },
    { id:'h11', text:'1600年、関ヶ原の戦いで勝利したのは？', choices:['豊臣秀頼','石田三成','毛利輝元','徳川家康'], answer:3 },
    { id:'h12', text:'645年の大化の改新を主導したのは？', choices:['聖徳太子','天武天皇','藤原道長','中大兄皇子'], answer:3 },
  ]
};

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

// ========== 敵データ ==========

const ENEMIES = {
  geography: [
    { name:'大地封神',   icon:'🌋', maxHp:80,  reward:15, stage:'STAGE 1 / 地理' },
    { name:'海峡の幻獣', icon:'🌊', maxHp:100, reward:20, stage:'STAGE 2 / 地理' },
    { name:'砂漠の竜帝', icon:'🏜️', maxHp:130, reward:30, stage:'STAGE 3 / 地理' },
  ],
  history: [
    { name:'忘却の魔将', icon:'💀', maxHp:80,  reward:15, stage:'STAGE 1 / 歴史' },
    { name:'時の封魔王', icon:'⏳', maxHp:100, reward:20, stage:'STAGE 2 / 歴史' },
    { name:'蒼穹の覇者', icon:'⚡', maxHp:130, reward:30, stage:'STAGE 3 / 歴史' },
  ]
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
  field: 'history', enemyIdx: 0,
  enemyHp: 100, playerHp: 100,
  questions: [], qIdx: 0,
  combo: 0, specialGauge: 0,
  answered: false, earnedOrbs: 0, correctCount: 0,
};

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

// ========== バトル開始 ==========

function startBattle(field) {
  battle.field        = field;
  battle.enemyIdx     = Math.floor(Math.random() * ENEMIES[field].length);
  const enemy         = ENEMIES[field][battle.enemyIdx];
  battle.enemyHp      = enemy.maxHp;
  battle.playerHp     = calcPlayerHp();
  battle.questions    = shuffleArray([...QUESTIONS[field]]).slice(0, 10);
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
      gs.wrongIds.push({ id: qId, field: battle.field });
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
  const enemy  = ENEMIES[battle.field][battle.enemyIdx];
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
    battle.earnedOrbs += ENEMIES[battle.field][battle.enemyIdx].reward;
  }
  gs.orbs += battle.earnedOrbs;
  save();

  const titleEl  = document.getElementById('result-title');
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
  const grid = document.getElementById('collection-grid');
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
    const pool = QUESTIONS[w.field];
    const q    = pool ? pool.find(q => q.id === w.id) : null;
    if (!q) return '';
    return `<div class="review-item">
      <div class="review-item-field">${w.field === 'geography' ? '🌍 地理' : '⚔️ 歴史'}</div>
      <div class="review-item-text">${escHtml(q.text)}</div>
      <div style="font-size:11px;color:#553366;margin-top:4px">正解: ${escHtml(q.choices[q.answer])}</div>
    </div>`;
  }).filter(Boolean).join('');
}

// ========== LINE招待（VSバトル用） ==========

function inviteViaLine(roomId) {
  const url  = window.location.origin + window.location.pathname + '?room=' + roomId;
  const text = 'ドリルバトルで勝負だ！下のリンクからルームに入ってこい！【招待コード：' + roomId + '】 ' + url;
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
