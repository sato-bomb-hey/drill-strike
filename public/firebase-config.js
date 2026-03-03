'use strict';

/* ============================================================
   FIREBASE CONFIG — 蒼穹の歴史戦線
   ============================================================
   このファイルは Firebase Hosting が自動提供する
   /__/firebase/init.js によって初期化済みの firebase を使用します。

   ローカル開発時は "firebase serve" または
   "firebase emulators:start --only hosting,firestore" で起動してください。

   Firestore セキュリティルール (コンソールで設定):
   -----------------------------------------------
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /vs_rooms/{roomId} {
         allow read:   if true;
         allow create: if true;
         allow update: if true;
         allow delete: if true;
       }
     }
   }
   -----------------------------------------------
   ※ 本番運用時はルールを適切に制限してください。
   ============================================================ */

const db = firebase.firestore();
