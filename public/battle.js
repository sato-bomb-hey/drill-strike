'use strict';

/* ============================================================
   蒼穹の歴史戦線 — VS バトル（リアルタイム対戦）
   Firestore コレクション: vs_rooms/{roomId}
   10問先取り勝利ルール
   ============================================================ */

// ============================================================
// 定数
// ============================================================
const VS_WIN_COUNT = 10; // 先取り問題数

// ============================================================
// 状態
// ============================================================
let vsRoomId    = null;
let vsPlayerKey = null;  // 'player1' | 'player2'
let vsOppKey    = null;  // 'player2' | 'player1'
let vsUnsub     = null;  // Firestore リスナー解除関数
let vsQuestions = [];    // 解決済み問題オブジェクト配列
let vsQIdx      = 0;     // 現在の問題インデックス（ローカル）
let vsMyCorrect = 0;     // 自分の正解数（ローカル）
let vsFinished  = false; // バトル終了フラグ

// ============================================================
// ユーティリティ
// ============================================================

function vsGenerateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function vsGetAllQuestions() {
  const all = [];
  Object.values(QUESTIONS).forEach(grades =>
    Object.values(grades).forEach(sems =>
      Object.values(sems).forEach(qs => all.push(...qs))
    )
  );
  return all;
}

function vsShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function vsGetPlayerName() {
  const save = JSON.parse(localStorage.getItem('soukyu_save') || '{}');
  return save.playerName || null;
}

function vsSavePlayerName(name) {
  const save = JSON.parse(localStorage.getItem('soukyu_save') || '{}');
  save.playerName = name;
  localStorage.setItem('soukyu_save', JSON.stringify(save));
}

// ============================================================
// プレイヤー名入力オーバーレイ
// ============================================================

function showNameInputOverlay(callback) {
  const overlay = document.getElementById('name-input-overlay');
  overlay.style.display = 'flex';
  overlay._callback = callback;
}

function submitPlayerName() {
  const input = document.getElementById('name-input-field');
  const name = input.value.trim();
  if (!name) {
    alert('名前を入力してください');
    return;
  }
  vsSavePlayerName(name);
  input.value = '';
  const overlay = document.getElementById('name-input-overlay');
  overlay.style.display = 'none';
  if (overlay._callback) {
    const cb = overlay._callback;
    overlay._callback = null;
    cb();
  }
}

// ============================================================
// VS ロビー表示
// ============================================================

function showVSLobby() {
  if (typeof db === 'undefined') {
    alert('Firebase未接続です。\n"firebase serve" で起動してください。');
    return;
  }
  const name = vsGetPlayerName();
  if (!name) {
    showNameInputOverlay(() => showVSLobby());
    return;
  }
  document.getElementById('vs-lobby-name').textContent = name;
  document.getElementById('vs-join-code').value = '';
  showScreen('vs-lobby-screen');
}

// ============================================================
// ルーム作成（ホスト）
// ============================================================

async function createVSRoom() {
  const name = vsGetPlayerName();
  const roomId = vsGenerateCode();
  const allIds = vsGetAllQuestions().map(q => q.id);

  const roomData = {
    status: 'waiting',
    questionIds: vsShuffle(allIds),
    player1: { name, correct: 0, qIdx: 0 },
    player2: null,
    winner: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('vs_rooms').doc(roomId).set(roomData);
  } catch (e) {
    alert('ルームの作成に失敗しました: ' + e.message);
    return;
  }

  vsRoomId    = roomId;
  vsPlayerKey = 'player1';
  vsOppKey    = 'player2';

  showWaitingScreen(roomId);
  vsStartListener();
}

// ============================================================
// 待機画面
// ============================================================

function showWaitingScreen(roomId) {
  document.getElementById('vs-room-code').textContent = roomId;
  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) copyBtn.textContent = '📋 コードをコピー';
  showScreen('vs-waiting-screen');
}

function copyRoomCode() {
  const code = document.getElementById('vs-room-code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copy-code-btn');
    btn.textContent = 'コピー済み！';
    setTimeout(() => { btn.textContent = '📋 コードをコピー'; }, 1500);
  }).catch(() => {
    alert('コード: ' + code);
  });
}

function inviteViaLineVS() {
  const code = document.getElementById('vs-room-code').textContent;
  const text = `蒼穹の歴史戦線 VS対戦に招待！\nルームコード: ${code}\nあなたも参戦しろ！`;
  const url = 'https://social-plugins.line.me/lineit/share?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

function cancelRoom() {
  if (vsUnsub) { vsUnsub(); vsUnsub = null; }
  if (vsRoomId) {
    db.collection('vs_rooms').doc(vsRoomId).delete().catch(() => {});
  }
  vsRoomId = null;
  vsPlayerKey = null;
  vsOppKey = null;
  showScreen('vs-lobby-screen');
}

// ============================================================
// ルーム参加（ゲスト）
// ============================================================

async function joinVSRoom() {
  const input = document.getElementById('vs-join-code').value.trim().toUpperCase();
  if (input.length !== 5) {
    alert('5文字のルームコードを入力してください');
    return;
  }
  const name = vsGetPlayerName();

  let snap;
  try {
    snap = await db.collection('vs_rooms').doc(input).get();
  } catch (e) {
    alert('接続に失敗しました: ' + e.message);
    return;
  }

  if (!snap.exists) {
    alert('ルームが見つかりません');
    return;
  }
  const data = snap.data();
  if (data.status !== 'waiting') {
    alert('このルームはすでに開始または終了しています');
    return;
  }
  if (data.player2 !== null) {
    alert('このルームはすでに満員です');
    return;
  }

  try {
    await db.collection('vs_rooms').doc(input).update({
      'player2': { name, correct: 0, qIdx: 0 },
      'status': 'playing'
    });
  } catch (e) {
    alert('参加に失敗しました: ' + e.message);
    return;
  }

  vsRoomId    = input;
  vsPlayerKey = 'player2';
  vsOppKey    = 'player1';

  // 問題リストを解決
  const all = vsGetAllQuestions();
  vsQuestions = data.questionIds.map(id => all.find(q => q.id === id)).filter(Boolean);
  vsQIdx      = 0;
  vsMyCorrect = 0;
  vsFinished  = false;

  vsStartListener();
  vsStartBattle(data.player1.name);
}

// ============================================================
// Firestore リアルタイムリスナー
// ============================================================

function vsStartListener() {
  if (vsUnsub) vsUnsub();

  vsUnsub = db.collection('vs_rooms').doc(vsRoomId).onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();

    // ホスト: player2が参加したらバトル開始
    if (vsPlayerKey === 'player1' && data.status === 'playing' && data.player2) {
      if (document.getElementById('vs-waiting-screen').classList.contains('active')) {
        const all = vsGetAllQuestions();
        vsQuestions = data.questionIds.map(id => all.find(q => q.id === id)).filter(Boolean);
        vsQIdx      = 0;
        vsMyCorrect = 0;
        vsFinished  = false;
        vsStartBattle(data.player2.name);
      }
    }

    // 相手の正解数を更新
    if (data[vsOppKey]) {
      vsUpdateOppProgress(data[vsOppKey].correct, data[vsOppKey].name);
    }

    // 勝敗判定
    if (data.winner && !vsFinished) {
      vsFinished = true;
      const iWon = data.winner === vsPlayerKey;
      const myC  = data[vsPlayerKey] ? data[vsPlayerKey].correct : vsMyCorrect;
      const oppC = data[vsOppKey]    ? data[vsOppKey].correct    : 0;
      const oppName = data[vsOppKey] ? data[vsOppKey].name : '相手';
      vsShowResult(iWon, myC, oppC, oppName);
    }
  });
}

// ============================================================
// バトル開始
// ============================================================

function vsStartBattle(oppName) {
  showScreen('vs-battle-screen');

  const myName = vsGetPlayerName();
  document.getElementById('vs-my-name').textContent  = myName;
  document.getElementById('vs-opp-name').textContent = oppName || '相手';

  vsUpdateMyProgress(0);
  vsUpdateOppProgress(0, oppName);
  vsShowQuestion();
}

// ============================================================
// 問題表示・回答処理
// ============================================================

function vsShowQuestion() {
  if (vsFinished || vsQIdx >= vsQuestions.length) return;

  const q = vsQuestions[vsQIdx];
  document.getElementById('vs-q-num').textContent  = 'Q' + (vsQIdx + 1);
  document.getElementById('vs-q-text').textContent = q.text;
  document.getElementById('vs-feedback').textContent = '';
  document.getElementById('vs-feedback').className  = 'vs-feedback';

  const area = document.getElementById('vs-choices-area');
  area.innerHTML = '';
  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className   = 'vs-choice-btn';
    btn.textContent = choice;
    btn.onclick     = () => vsHandleAnswer(i, q.answer);
    area.appendChild(btn);
  });
}

async function vsHandleAnswer(selectedIdx, correctIdx) {
  if (vsFinished) return;

  // ボタン無効化
  document.querySelectorAll('.vs-choice-btn').forEach(b => b.disabled = true);

  const isCorrect = selectedIdx === correctIdx;
  const fb = document.getElementById('vs-feedback');

  if (isCorrect) {
    vsMyCorrect++;
    fb.textContent = '✅ 正解！';
    fb.className   = 'vs-feedback correct';
    vsUpdateMyProgress(vsMyCorrect);

    // 10問先取り達成
    if (vsMyCorrect >= VS_WIN_COUNT) {
      vsFinished = true;
      try {
        await db.collection('vs_rooms').doc(vsRoomId).update({
          [`${vsPlayerKey}.correct`]: vsMyCorrect,
          [`${vsPlayerKey}.qIdx`]:    vsQIdx + 1,
          winner: vsPlayerKey,
          status: 'finished'
        });
      } catch (e) { /* スナップショットで結果画面を表示 */ }
      return;
    }
  } else {
    fb.textContent = '❌ はずれ';
    fb.className   = 'vs-feedback wrong';
  }

  vsQIdx++;
  // Firestore に進捗を書き込む（失敗してもローカルで続行）
  db.collection('vs_rooms').doc(vsRoomId).update({
    [`${vsPlayerKey}.correct`]: vsMyCorrect,
    [`${vsPlayerKey}.qIdx`]:    vsQIdx
  }).catch(() => {});

  setTimeout(vsShowQuestion, 700);
}

// ============================================================
// プログレスバー更新
// ============================================================

function vsUpdateMyProgress(count) {
  document.getElementById('vs-my-correct').textContent = count;
  document.getElementById('vs-my-bar').style.width = (count / VS_WIN_COUNT * 100) + '%';
}

function vsUpdateOppProgress(count, name) {
  document.getElementById('vs-opp-correct').textContent = count;
  document.getElementById('vs-opp-bar').style.width = (count / VS_WIN_COUNT * 100) + '%';
  if (name) document.getElementById('vs-opp-name').textContent = name;
}

// ============================================================
// 結果画面
// ============================================================

function vsShowResult(iWon, myCorrect, oppCorrect, oppName) {
  if (vsUnsub) { vsUnsub(); vsUnsub = null; }

  const titleEl = document.getElementById('vs-result-title');
  titleEl.textContent = iWon ? '勝利！！' : '敗北…';
  titleEl.className   = 'vs-result-title ' + (iWon ? 'win' : 'lose');

  document.getElementById('vs-result-score').textContent =
    `あなた ${myCorrect}問 正解 vs ${oppName || '相手'} ${oppCorrect}問 正解`;

  showScreen('vs-result-screen');
}

function leaveVSRoom() {
  if (vsUnsub) { vsUnsub(); vsUnsub = null; }
  vsRoomId    = null;
  vsPlayerKey = null;
  vsOppKey    = null;
  vsQuestions = [];
  vsQIdx      = 0;
  vsMyCorrect = 0;
  vsFinished  = false;
  showScreen('title-screen');
}
