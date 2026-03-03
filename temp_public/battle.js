/* ============================================
   CYBER QUIZ — VS BATTLE (ルーム招待機能)
   ============================================
   Firestore コレクション: rooms/{roomId}
   各プレイヤーは自分の player1/player2 フィールドのみ書き込み。
   ダメージは相手 HP フィールドへ直接書き込む。
   ============================================ */

'use strict';

// ============================================
// BATTLE CONSTANTS
// ============================================
const BATTLE_HP          = 100;
const BATTLE_DMG_BASE    = 10;   // 正解1問あたりのダメージ
const BATTLE_DMG_COMBO   = 5;    // コンボ時の追加ダメージ
const BATTLE_COMBO_THRESH = 3;   // コンボボーナス発動連続正解数
const BATTLE_Q_COUNT     = 10;   // 1バトルの問題数
const BATTLE_SMOKE_MS    = 5000; // スモーク持続時間(ms)
const BATTLE_SYNC_MS     = 500;  // 定期同期間隔(ms)

// ============================================
// BATTLE STATE
// ============================================
let btRoomId      = null;
let btPlayerKey   = null;   // 'player1' | 'player2'
let btOppKey      = null;
let btUnsub       = null;   // Firestore リスナー解除関数
let btQuestions   = [];
let btQIdx        = 0;
let btMyHp        = BATTLE_HP;
let btOppHp       = BATTLE_HP;
let btMyCombo     = 0;
let btSmokeUsed   = false;
let btSmokeTimer  = null;
let btSyncTimer   = null;
let btFinished    = false;

// ホストが選んだ設定（ゲストは room.settings から読む）
let btGrade    = null;
let btSemester = null;
let btSubject  = null;

// ============================================
// NAVIGATION
// ============================================

function showBattleLobby() {
  if (!currentUser) {
    alert('対戦にはログインが必要です。');
    return;
  }
  showScreen('battle-lobby-screen');
}

function showBattleCreate() {
  btGrade = null;
  btSemester = null;
  btSubject = null;
  _showBattleStep('grade');
  showScreen('battle-setup-screen');
}

function showBattleJoin() {
  document.getElementById('join-room-code').value = '';
  document.getElementById('join-error').textContent = '';
  showScreen('battle-join-screen');
}

function showBattleStep(step) {
  _showBattleStep(step);
}

function _showBattleStep(step) {
  document.querySelectorAll('#battle-setup-screen .select-step')
    .forEach(el => el.classList.remove('active'));
  const el = document.getElementById('battle-step-' + step);
  if (el) el.classList.add('active');
}

// ============================================
// HOST: SUBJECT SELECTION
// ============================================

function battleSelectGrade(g) {
  btGrade = g;
  _showBattleStep('semester');
}

function battleSelectSemester(s) {
  btSemester = s;
  _showBattleStep('subject');
}

async function battleSelectSubject(subj) {
  btSubject = subj;
  await _doCreateRoom();
}

// ============================================
// generateRoomId: 重複しない5桁IDを生成
// ============================================

async function _generateUniqueRoomId() {
  for (let i = 0; i < 10; i++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const snap = await db.collection('rooms').doc(id).get();
    if (!snap.exists) return id;
  }
  // フォールバック: タイムスタンプ末尾5桁
  return String(Date.now()).slice(-5);
}

// ============================================
// CREATE ROOM
// ============================================

async function _doCreateRoom() {
  showScreen('battle-room-screen');
  const codeEl   = document.getElementById('room-code-display');
  const statusEl = document.getElementById('room-status');
  const oppEl    = document.getElementById('room-opponent-info');
  const readyBtn = document.getElementById('battle-room-ready-btn');

  codeEl.textContent   = '...';
  statusEl.textContent = 'ルーム作成中...';
  oppEl.textContent    = '';
  readyBtn.style.display = 'none';
  readyBtn.textContent   = '▶ READY!';
  readyBtn.disabled      = false;
  readyBtn.classList.remove('ready');
  document.getElementById('line-invite-btn').style.display = 'none';

  const roomId = await _generateUniqueRoomId();
  const uid    = currentUser.uid;
  const name   = currentUser.displayName || 'HACKER';

  await db.collection('rooms').doc(roomId).set({
    status:    'waiting',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    settings:  { grade: btGrade, semester: btSemester, subject: btSubject },
    player1: {
      uid, name,
      hp: BATTLE_HP, combo: 0, currentQuestionIndex: 0,
      activeSkill: null, isReady: false
    },
    player2:        null,
    questionIndices: []
  });

  btRoomId    = roomId;
  btPlayerKey = 'player1';
  btOppKey    = 'player2';

  codeEl.textContent   = roomId;
  statusEl.textContent = '友達を待っています... 上のコードを共有してね！';
  document.getElementById('line-invite-btn').style.display = 'flex';

  _listenToRoom();
}

// ============================================
// JOIN ROOM
// ============================================

async function doJoinRoom() {
  const code  = document.getElementById('join-room-code').value.trim();
  const errEl = document.getElementById('join-error');
  errEl.textContent = '';

  if (!/^\d{5}$/.test(code)) {
    errEl.textContent = '5桁の数字を入力してください';
    return;
  }

  try {
    const snap = await db.collection('rooms').doc(code).get();
    if (!snap.exists) {
      errEl.textContent = 'ルームが見つかりません';
      return;
    }
    const room = snap.data();
    if (room.status !== 'waiting') {
      errEl.textContent = 'このルームはすでに開始しています';
      return;
    }
    if (room.player2 !== null) {
      errEl.textContent = 'このルームは満員です';
      return;
    }
    if (room.player1.uid === currentUser.uid) {
      errEl.textContent = '自分のルームには入れません';
      return;
    }

    const uid  = currentUser.uid;
    const name = currentUser.displayName || 'RUNNER';

    await db.collection('rooms').doc(code).update({
      player2: {
        uid, name,
        hp: BATTLE_HP, combo: 0, currentQuestionIndex: 0,
        activeSkill: null, isReady: false
      }
    });

    btRoomId    = code;
    btPlayerKey = 'player2';
    btOppKey    = 'player1';
    btGrade     = room.settings.grade;
    btSemester  = room.settings.semester;
    btSubject   = room.settings.subject;

    showScreen('battle-room-screen');
    document.getElementById('room-code-display').textContent = code;
    document.getElementById('room-status').textContent       = '入室しました！';
    document.getElementById('room-opponent-info').textContent = 'vs ' + room.player1.name;
    const readyBtn = document.getElementById('battle-room-ready-btn');
    readyBtn.style.display = 'block';
    readyBtn.textContent   = '▶ READY!';
    readyBtn.disabled      = false;
    readyBtn.classList.remove('ready');

    _listenToRoom();
  } catch (e) {
    errEl.textContent = 'エラー: ' + e.message;
  }
}

// ============================================
// ROOM LISTENER
// ============================================

function _listenToRoom() {
  if (btUnsub) { btUnsub(); btUnsub = null; }
  btUnsub = db.collection('rooms').doc(btRoomId).onSnapshot(snap => {
    if (!snap.exists) return;
    _onRoomUpdate(snap.data());
  });
}

function _onRoomUpdate(room) {
  if (room.status === 'waiting') {
    _updateWaitingUI(room);
  } else if (room.status === 'playing') {
    if (!document.getElementById('battle-screen').classList.contains('active')) {
      _initBattleScreen(room);
    } else {
      _updateBattleUI(room);
    }
  } else if (room.status === 'finished') {
    if (!btFinished) {
      btFinished = true;
      _showBattleResult(room);
    }
  }
}

function _updateWaitingUI(room) {
  const statusEl = document.getElementById('room-status');
  const oppEl    = document.getElementById('room-opponent-info');
  const readyBtn = document.getElementById('battle-room-ready-btn');

  if (room.player2) {
    oppEl.textContent = 'vs ' + room.player2.name + ' が入室！';
    if (btPlayerKey === 'player1' && readyBtn.style.display === 'none') {
      readyBtn.style.display = 'block';
      statusEl.textContent   = '準備ができたら READY を押してください';
    }
  }

  // 自分が READY 済みなら表示を更新
  const myData = room[btPlayerKey];
  if (myData && myData.isReady) {
    readyBtn.textContent = '✓ READY!';
    readyBtn.classList.add('ready');
    readyBtn.disabled    = true;
    statusEl.textContent = '相手の準備を待っています...';
  }

  // 両者 READY → ホストがバトル開始
  if (room.player1 && room.player1.isReady &&
      room.player2 && room.player2.isReady &&
      btPlayerKey === 'player1') {
    _hostStartBattle(room);
  }
}

async function setBattleReady() {
  const btn = document.getElementById('battle-room-ready-btn');
  btn.disabled = true;
  try {
    await db.collection('rooms').doc(btRoomId).update({
      [`${btPlayerKey}.isReady`]: true
    });
  } catch (e) {
    btn.disabled = false;
    console.warn('[Battle] setBattleReady error:', e);
  }
}

async function cancelRoom() {
  if (btRoomId) {
    if (btPlayerKey === 'player1') {
      try { await db.collection('rooms').doc(btRoomId).delete(); } catch (_) {}
    } else {
      try {
        await db.collection('rooms').doc(btRoomId).update({ player2: null });
      } catch (_) {}
    }
  }
  _cleanupBattle();
  showScreen('title-screen');
}

// ============================================
// HOST: START BATTLE (questions を生成して status='playing' に)
// ============================================

async function _hostStartBattle(room) {
  const { grade, semester, subject } = room.settings;
  const key  = `g${grade}-s${semester}-${subject}`;
  const pool = (typeof QUESTIONS !== 'undefined' && QUESTIONS[key]) || [];

  // 問題インデックスをシャッフルして選択
  const allIdx   = pool.map((_, i) => i);
  const shuffled = allIdx.sort(() => Math.random() - 0.5);
  const picked   = shuffled.slice(0, Math.min(BATTLE_Q_COUNT, shuffled.length));

  await db.collection('rooms').doc(btRoomId).update({
    status:          'playing',
    questionIndices: picked,
    startedAt:       firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ============================================
// BATTLE SCREEN INIT
// ============================================

function _initBattleScreen(room) {
  btFinished  = false;
  btQIdx      = 0;
  btMyHp      = BATTLE_HP;
  btOppHp     = BATTLE_HP;
  btMyCombo   = 0;
  btSmokeUsed = false;

  const { grade, semester, subject } = room.settings;
  const key  = `g${grade}-s${semester}-${subject}`;
  const pool = (typeof QUESTIONS !== 'undefined' && QUESTIONS[key]) || [];
  btQuestions = room.questionIndices.map(i => pool[i]).filter(Boolean);

  showScreen('battle-screen');

  const smokeBtn = document.getElementById('battle-smoke-btn');
  smokeBtn.disabled    = false;
  smokeBtn.style.opacity = '1';
  document.getElementById('smoke-overlay').classList.remove('active');
  document.getElementById('battle-next-btn').style.display = 'none';

  // 初期 HUD
  _setHpBar('my',  BATTLE_HP);
  _setHpBar('opp', BATTLE_HP);

  const myData  = room[btPlayerKey];
  const oppData = room[btOppKey];
  if (myData)  document.getElementById('battle-my-name').textContent  = myData.name;
  if (oppData) document.getElementById('battle-opp-name').textContent = oppData.name;

  _showBattleQuestion();
  _startSyncTimer();
}

// ============================================
// BATTLE QUIZ
// ============================================

function _showBattleQuestion() {
  if (btQIdx >= btQuestions.length) {
    _endBattle('timeout');
    return;
  }

  const q    = btQuestions[btQIdx];
  document.getElementById('battle-qnum').textContent         = `Q${btQIdx + 1} / ${btQuestions.length}`;
  document.getElementById('battle-question-text').textContent = q.text;

  const grid = document.getElementById('battle-choices-grid');
  grid.innerHTML = '';

  // 選択肢をシャッフルして表示
  const idxArr   = q.choices.map((_, i) => i);
  const shuffled = idxArr.sort(() => Math.random() - 0.5);
  shuffled.forEach(ci => {
    const btn = document.createElement('button');
    btn.className   = 'choice-btn';
    btn.textContent = q.choices[ci];
    btn.onclick     = () => _answerBattle(ci === q.answer);
    grid.appendChild(btn);
  });
}

async function _answerBattle(correct) {
  // 選択肢を無効化
  document.querySelectorAll('#battle-choices-grid .choice-btn')
    .forEach(b => b.disabled = true);

  let damage = 0;
  if (correct) {
    btMyCombo++;
    damage = btMyCombo >= BATTLE_COMBO_THRESH
      ? BATTLE_DMG_BASE + BATTLE_DMG_COMBO
      : BATTLE_DMG_BASE;
    btOppHp = Math.max(0, btOppHp - damage);
    _showHitEffect(damage);
    if (btMyCombo >= BATTLE_COMBO_THRESH) _showComboEffect(btMyCombo);
  } else {
    btMyCombo = 0;
  }

  _setHpBar('opp', btOppHp);

  // syncBattleState: ローカル計算後に DB へ送信
  await _syncBattleState(damage);

  if (correct && btOppHp <= 0) {
    await _endBattle('win');
    return;
  }

  btQIdx++;
  document.getElementById('battle-next-btn').style.display = 'block';
}

function battleNextQuestion() {
  document.getElementById('battle-next-btn').style.display = 'none';
  _showBattleQuestion();
}

// ============================================
// syncBattleState: イベント時に DB を更新
// ============================================

async function _syncBattleState(damage) {
  if (!btRoomId || btFinished) return;

  const update = {
    [`${btPlayerKey}.combo`]:                btMyCombo,
    [`${btPlayerKey}.currentQuestionIndex`]: btQIdx,
  };
  // ダメージがあれば相手 HP を更新
  if (damage > 0) {
    update[`${btOppKey}.hp`] = btOppHp;
  }

  try {
    await db.collection('rooms').doc(btRoomId).update(update);
  } catch (e) {
    console.warn('[Battle] syncBattleState failed:', e);
  }
}

// onValue 相当: 0.5 秒おきの定期同期タイマー
function _startSyncTimer() {
  if (btSyncTimer) clearInterval(btSyncTimer);
  btSyncTimer = setInterval(() => {
    if (btFinished) { clearInterval(btSyncTimer); return; }
    db.collection('rooms').doc(btRoomId).update({
      [`${btPlayerKey}.combo`]:                btMyCombo,
      [`${btPlayerKey}.currentQuestionIndex`]: btQIdx,
    }).catch(() => {});
  }, BATTLE_SYNC_MS);
}

// ============================================
// REAL-TIME UPDATE (Firestore onSnapshot から呼ばれる)
// ============================================

function _updateBattleUI(room) {
  const myData  = room[btPlayerKey];
  const oppData = room[btOppKey];

  if (myData) {
    // 相手から自分の HP が書き換えられた場合を検知
    if (myData.hp < btMyHp) {
      btMyHp = myData.hp;
      _setHpBar('my', btMyHp);
    }
    document.getElementById('battle-my-name').textContent = myData.name;
  }

  if (oppData) {
    document.getElementById('battle-opp-name').textContent = oppData.name;

    // スモークスキル検知: 相手が smoke を発動 → 自分の画面に表示
    if (oppData.activeSkill === 'smoke') {
      const overlay = document.getElementById('smoke-overlay');
      if (!overlay.classList.contains('active')) {
        _activateSmokeOverlay();
        // BATTLE_SMOKE_MS 後にフラグをクリア
        if (btSmokeTimer) clearTimeout(btSmokeTimer);
        btSmokeTimer = setTimeout(() => {
          overlay.classList.remove('active');
          db.collection('rooms').doc(btRoomId).update({
            [`${btOppKey}.activeSkill`]: null
          }).catch(() => {});
        }, BATTLE_SMOKE_MS);
      }
    }
  }

  // 相手 HP が 0 になったことを onSnapshot で検知 → 勝利
  if (oppData && oppData.hp <= 0 && !btFinished) {
    _endBattle('win');
    return;
  }
  // 自分 HP が 0 → 敗北
  if (myData && myData.hp <= 0 && !btFinished) {
    _endBattle('lose');
  }
}

function _setHpBar(who, hp) {
  const pct = Math.max(0, Math.min(100, (hp / BATTLE_HP) * 100));
  const bar = document.getElementById(`battle-${who}-hp-bar`);
  const num = document.getElementById(`battle-${who}-hp-num`);
  if (bar) {
    bar.style.width = pct + '%';
    bar.className   = 'battle-hp-bar' + (who === 'my' ? ' my-bar' : '');
    if (pct <= 25)      bar.classList.add('critical');
    else if (pct <= 50) bar.classList.add('warning');
  }
  if (num) num.textContent = hp;
}

// ============================================
// SMOKE SKILL
// ============================================

async function activateSmoke() {
  if (btSmokeUsed || btFinished || !btRoomId) return;
  btSmokeUsed = true;

  const btn = document.getElementById('battle-smoke-btn');
  btn.disabled      = true;
  btn.style.opacity = '0.4';
  btn.textContent   = '💨 USED';

  try {
    // 自分の activeSkill を 'smoke' にセット → 相手のリスナーが検知
    await db.collection('rooms').doc(btRoomId).update({
      [`${btPlayerKey}.activeSkill`]: 'smoke'
    });
    // 自動クリア (BATTLE_SMOKE_MS + 余裕)
    setTimeout(() => {
      db.collection('rooms').doc(btRoomId).update({
        [`${btPlayerKey}.activeSkill`]: null
      }).catch(() => {});
    }, BATTLE_SMOKE_MS + 1000);
  } catch (e) {
    console.warn('[Battle] activateSmoke failed:', e);
  }
}

function _activateSmokeOverlay() {
  document.getElementById('smoke-overlay').classList.add('active');
}

// ============================================
// EFFECTS
// ============================================

function _showHitEffect(damage) {
  const el = document.getElementById('battle-hit-effect');
  el.textContent = `-${damage}`;
  el.classList.remove('active');
  // リフロー強制で再アニメーション
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 900);
}

function _showComboEffect(combo) {
  const el = document.getElementById('battle-combo-effect');
  el.textContent = `COMBO ×${combo}!!`;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 1100);
}

// ============================================
// END BATTLE
// ============================================

async function _endBattle(reason) {
  if (btFinished) return;
  btFinished = true;
  if (btSyncTimer) { clearInterval(btSyncTimer); btSyncTimer = null; }

  let winner;
  if (reason === 'win')      winner = btPlayerKey;
  else if (reason === 'lose') winner = btOppKey;
  else                        winner = btMyHp > btOppHp ? btPlayerKey
                                     : btMyHp < btOppHp ? btOppKey
                                     : 'draw';

  try {
    await db.collection('rooms').doc(btRoomId).update({
      status:     'finished',
      winner,
      finishedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (_) {
    // 相手が先に書き込んだ場合は無視
  }

  _showBattleResult({
    winner,
    [btPlayerKey]: { hp: btMyHp },
    [btOppKey]:    { hp: btOppHp }
  });
}

// ============================================
// BATTLE RESULT
// ============================================

function _showBattleResult(room) {
  if (btUnsub)    { btUnsub(); btUnsub = null; }
  if (btSyncTimer){ clearInterval(btSyncTimer); btSyncTimer = null; }

  const isWin  = room.winner === btPlayerKey;
  const isDraw = room.winner === 'draw';

  const titleEl = document.getElementById('battle-result-title');
  const subEl   = document.getElementById('battle-result-sub');
  const statsEl = document.getElementById('battle-result-stats');

  if (isDraw) {
    titleEl.textContent = 'DRAW...';
    titleEl.setAttribute('data-text', 'DRAW...');
    titleEl.style.color = 'var(--yellow)';
    subEl.textContent   = '引き分けだ...';
  } else if (isWin) {
    titleEl.textContent = 'VICTORY!!';
    titleEl.setAttribute('data-text', 'VICTORY!!');
    titleEl.style.color = 'var(--cyan)';
    subEl.textContent   = '相手を撃破した！';
  } else {
    titleEl.textContent = 'DEFEAT...';
    titleEl.setAttribute('data-text', 'DEFEAT...');
    titleEl.style.color = 'var(--red)';
    subEl.textContent   = 'やられてしまった...';
  }

  const myHp  = (room[btPlayerKey] || {}).hp ?? btMyHp;
  const oppHp = (room[btOppKey]    || {}).hp ?? btOppHp;
  statsEl.innerHTML = `
    <div class="result-stat-row"><span>自分 HP</span><span class="neon-green">${myHp}</span></div>
    <div class="result-stat-row"><span>相手 HP</span><span class="neon-red">${oppHp}</span></div>
  `;

  showScreen('battle-result-screen');
  _cleanupBattle();
}

// ============================================
// LINE INVITE
// ============================================

function inviteViaLine() {
  if (!btRoomId) return;

  // 現在のページ URL にルームコードを付加して招待リンクを生成
  const joinUrl = window.location.origin + window.location.pathname + '?room=' + btRoomId;

  const text =
    'ドリルバトルで勝負だ！下のリンクからルームに入ってこい！' +
    '【招待コード：' + btRoomId + '】 ' + joinUrl;

  const shareUrl =
    'https://social-plugins.line.me/lineit/share?url=' +
    encodeURIComponent(joinUrl) +
    '&text=' +
    encodeURIComponent(text);

  window.location.href = shareUrl;
}

// ============================================
// CLEANUP
// ============================================

function _cleanupBattle() {
  if (btUnsub)    { btUnsub(); btUnsub = null; }
  if (btSyncTimer){ clearInterval(btSyncTimer); btSyncTimer = null; }
  if (btSmokeTimer){ clearTimeout(btSmokeTimer); btSmokeTimer = null; }

  document.getElementById('smoke-overlay').classList.remove('active');

  btRoomId    = null;
  btPlayerKey = null;
  btOppKey    = null;
  btQuestions = [];
  btQIdx      = 0;
  btMyHp      = BATTLE_HP;
  btOppHp     = BATTLE_HP;
  btMyCombo   = 0;
  btSmokeUsed = false;
  btFinished  = false;
}
