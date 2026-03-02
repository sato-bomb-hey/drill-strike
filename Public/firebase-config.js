/* ============================================
   FIREBASE CONFIG
   ============================================
   Firebase セットアップ手順:
   1. https://console.firebase.google.com でプロジェクト作成
   2. Authentication → ログイン方法 → メール/パスワード を有効化
   3. Firestore Database を作成（テストモードで開始 → 後でルールを設定）
   4. プロジェクト設定 → マイアプリ → Firebase SDK → 設定値を下記に貼り付け

   Firestore セキュリティルール（コンソールで設定）:
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       // VS Battle: ルーム招待機能
       // ログイン済みユーザーは読み取り可能
       // 書き込みはルームの参加者のみ許可
       match /rooms/{roomId} {
         allow read:   if request.auth != null;
         allow create: if request.auth != null;
         allow update: if request.auth != null && (
           resource.data.player1.uid == request.auth.uid ||
           (resource.data.player2 != null && resource.data.player2.uid == request.auth.uid) ||
           resource.data.player2 == null
         );
         allow delete: if request.auth != null &&
           resource.data.player1.uid == request.auth.uid;
       }
     }
   }
   ============================================ */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cyber-punk-drill-jr-high.firebaseapp.com",
  projectId: "cyber-punk-drill-jr-high",
  storageBucket: "cyber-punk-drill-jr-high.firebasestorage.app",
  messagingSenderId: "130539896707",
  appId: "1:130539896707:web:d82458112e6a25f55200b6",
  measurementId: "G-P24Q0PQ7VJ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
