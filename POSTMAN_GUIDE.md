# 📮 POSTMAN 完全ガイド - License Manager API

このガイドでは、POSTMANを使ったAPIテストの方法を、**初心者でもわかるように**段階的に説明します。

---

## 🎯 目次

1. [POSTMANのセットアップ](#1-postmanのセットアップ)
2. [コレクションのインポート](#2-コレクションのインポート)
3. [環境変数の設定](#3-環境変数の設定)
4. [基本的な使い方](#4-基本的な使い方)
5. [実践：APIテストの流れ](#5-実践apiテストの流れ)
6. [よくある質問とトラブルシューティング](#6-よくある質問とトラブルシューティング)

---

## 1. POSTMANのセットアップ

### 📥 インストール

1. **公式サイト**にアクセス: https://www.postman.com/downloads/
2. **Download for Windows**をクリック
3. ダウンロードした`Postman-win64-Setup.exe`を実行
4. インストール完了後、POSTMANが自動起動します

### 👤 アカウント作成（任意）

- **推奨**: アカウントを作成すると、コレクションがクラウド同期されます
- **スキップ可能**: "Skip and continue"でアカウントなしでも使えます

---

## 2. コレクションのインポート

### 📂 手順

1. POSTMANを起動
2. 左サイドバーの**「Collections」**タブを選択
3. 上部の**「Import」**ボタンをクリック
4. **「Upload Files」**を選択
5. プロジェクトルートの`postman_collection.json`を選択
6. **「Import」**をクリック

### ✅ 確認

インポートが成功すると、以下のコレクションが表示されます：

```
📁 License Manager API
  ├── 🏥 Health Check
  ├── 🔐 Authentication
  │    ├── Login
  │    └── Get Current User
  ├── 📜 Licenses
  │    ├── List Licenses
  │    ├── Create License
  │    ├── Get License
  │    ├── Update License
  │    ├── Delete License
  │    ├── Get License Activations
  │    └── Revoke Activation
  └── ✅ Verification (Public)
       ├── Verify License
       ├── Activate License
       └── Heartbeat (Check-in)
```

---

## 3. 環境変数の設定

### 🔧 コレクション変数の確認

1. **「License Manager API」**コレクションを右クリック
2. **「Edit」**を選択
3. **「Variables」**タブを開く

以下の変数が設定されているはずです：

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `token` | (空欄) | (空欄) |

### 📝 説明

- **`baseUrl`**: APIサーバーのベースURL。ローカル開発時は`localhost:3000`
- **`token`**: ログイン後に自動的に保存されるJWTトークン

### 🌍 別の環境を追加する場合（本番環境など）

1. 左サイドバーの**「Environments」**タブを選択
2. **「+」**ボタンで新しい環境を作成
3. 環境名を入力（例：`Production`）
4. 変数を追加：
   - `baseUrl` = `https://api.yourdomain.com`
   - `token` = (空欄)

---

## 4. 基本的な使い方

### 📤 リクエストの送信方法

#### ステップ1: リクエストを選択

左サイドバーから実行したいリクエストをクリック（例：`Health Check`）

#### ステップ2: リクエスト内容を確認

POSTMANの画面構成：

```
┌─────────────────────────────────────────────┐
│ [GET] {{baseUrl}}/health          [Send]    │  ← HTTPメソッドとURL
├─────────────────────────────────────────────┤
│ Params | Authorization | Headers | Body    │  ← タブ
├─────────────────────────────────────────────┤
│                                              │
│  (リクエストの詳細設定エリア)                  │
│                                              │
└─────────────────────────────────────────────┘
```

#### ステップ3: 送信

右上の**「Send」**ボタンをクリック

#### ステップ4: レスポンスを確認

画面下部にレスポンスが表示されます：

```json
{
  "status": "ok",
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

### 🔍 レスポンスの見方

下部パネルのタブ：

- **Body**: レスポンスの内容（JSON、HTML、テキストなど）
- **Cookies**: サーバーから送られたクッキー
- **Headers**: レスポンスヘッダー
- **Test Results**: テストスクリプトの実行結果
- **Status**: `200 OK`などのHTTPステータスコード

---

## 5. 実践：APIテストの流れ

### 🚀 実際にAPIをテストしてみましょう

#### 前提条件

APIサーバーが起動していること：

```bash
# プロジェクトルートで実行
pnpm dev
```

または

```bash
cd apps/api
pnpm dev
```

サーバーが起動すると以下のログが表示されます：
```
🚀 License Manager API running on http://0.0.0.0:3000
📊 Health check: http://0.0.0.0:3000/health
```

---

### ✅ ステップ1: Health Checkでサーバー確認

1. **「🏥 Health Check」** → **「Health Check」**を選択
2. **「Send」**をクリック
3. レスポンス: `200 OK`が返ればサーバーは正常です

```json
{
  "status": "ok",
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

---

### 🔐 ステップ2: ログイン（認証トークンの取得）

**重要**: ほとんどのAPIエンドポイントは認証が必要です。まずログインしてトークンを取得します。

#### 手順

1. **「🔐 Authentication」** → **「Login」**を選択
2. **「Body」**タブを開く
3. デフォルトの認証情報が入力されているのを確認：

```json
{
  "email": "admin@acme.com",
  "password": "admin123"
}
```

4. **「Send」**をクリック
5. レスポンスを確認：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@acme.com",
      "role": "ADMIN"
    }
  }
}
```

#### 🎉 自動化！

**「Login」**リクエストには、**テストスクリプト**が設定されています。
成功すると、`token`が**自動的にコレクション変数に保存**されます！

確認方法：
1. コレクション右クリック → **「Edit」**
2. **「Variables」**タブ
3. `token`の**Current Value**に長い文字列が入っているはずです

---

### 📜 ステップ3: ライセンス一覧を取得

認証が必要なAPIをテストします。

#### 手順

1. **「📜 Licenses」** → **「List Licenses」**を選択
2. **「Headers」**タブを確認
3. `Authorization`ヘッダーが自動的に設定されています：

```
Authorization: Bearer {{token}}
```

4. **「Send」**をクリック
5. レスポンスを確認：

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "licenseKey": "ACM-...",
      "licenseType": "subscription",
      "status": "active"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### ➕ ステップ4: 新しいライセンスを作成

#### 前提条件: 製品IDを取得

まず、製品一覧を取得して`productId`を確認します：

```bash
# ターミナルで実行（または別途APIリクエスト）
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

または、データベースに直接アクセス：

```bash
pnpm db:studio
```

Prisma Studioで`products`テーブルから製品IDをコピーします。

#### リクエスト実行

1. **「📜 Licenses」** → **「Create License」**を選択
2. **「Body」**タブを開く
3. JSONを編集（`productId`を実際の値に置き換える）：

```json
{
  "productId": "ここに実際の製品IDを入力",
  "licenseType": "subscription",
  "maxActivations": 5,
  "expiresAt": "2025-12-31T23:59:59.999Z",
  "features": {
    "basic": true,
    "advanced": false
  },
  "notes": "テストライセンス"
}
```

4. **「Send」**をクリック
5. 成功すると`201 Created`が返ります：

```json
{
  "success": true,
  "data": {
    "id": "新しく作成されたライセンスID",
    "licenseKey": "ACM-1a2b3c4d-xyz123",
    "licenseType": "subscription",
    "status": "active"
  }
}
```

#### 🎉 自動化！

作成されたライセンスの`id`が自動的に`{{licenseId}}`変数に保存されます！

---

### ✅ ステップ5: Public API（認証不要）をテスト

クライアントアプリケーションから使用するPublic APIをテストします。

#### Verify License（ライセンス検証）

1. **「✅ Verification (Public)」** → **「Verify License」**を選択
2. **「Body」**タブで、実際のライセンスキーを入力：

```json
{
  "licenseKey": "ACM-1a2b3c4d-xyz123",
  "deviceFingerprint": "device-fingerprint-123",
  "productVersion": "1.0.0"
}
```

3. **「Send」**をクリック
4. レスポンス：

```json
{
  "valid": true,
  "license": {
    "licenseKey": "ACM-1a2b3c4d-xyz123",
    "licenseType": "subscription",
    "maxActivations": 5,
    "currentActivations": 0,
    "features": {
      "basic": true,
      "advanced": false
    },
    "expiresAt": "2025-12-31T23:59:59.999Z"
  },
  "certificate": "オフライン検証用の署名付き証明書"
}
```

---

## 6. よくある質問とトラブルシューティング

### ❓ Q1: `401 Unauthorized`エラーが出る

**原因**: 認証トークンが無効または期限切れ

**解決方法**:
1. **「Authentication」** → **「Login」**を再実行
2. コレクション変数の`token`が更新されたか確認
3. 他のリクエストを再実行

---

### ❓ Q2: `Could not get any response`エラー

**原因**: APIサーバーが起動していない

**解決方法**:
```bash
# ターミナルで確認
pnpm dev

# または
cd apps/api
pnpm dev
```

サーバーログで`http://localhost:3000`が表示されるか確認してください。

---

### ❓ Q3: `404 Not Found`エラー

**原因**: URLが間違っている、または製品/ライセンスIDが存在しない

**解決方法**:
- URLのスペルミスを確認
- `{{licenseId}}`などの変数が正しく設定されているか確認
- Prisma Studioでデータベースを確認：
  ```bash
  pnpm db:studio
  ```

---

### ❓ Q4: `Validation Error`（バリデーションエラー）

**原因**: リクエストボディの形式が間違っている

**解決方法**:
1. **「Body」**タブのJSONを確認
2. 必須フィールドが入力されているか確認
3. データ型が正しいか確認（数値は`"`なし、文字列は`"`で囲む）

---

### ❓ Q5: 環境変数`{{baseUrl}}`が展開されない

**原因**: コレクション変数が設定されていない

**解決方法**:
1. コレクション右クリック → **「Edit」**
2. **「Variables」**タブ
3. `baseUrl`の**Current Value**を`http://localhost:3000`に設定
4. **「Save」**をクリック

---

## 🎓 次のステップ

### 📚 さらに学ぶ

1. **テストスクリプト**: POSTMANの**Tests**タブでJavaScriptを書いて、自動テストを作成
2. **環境の切り替え**: 開発環境、本番環境を切り替えて使用
3. **コレクションランナー**: 複数のリクエストを連続実行
4. **APIドキュメント生成**: POSTMANからドキュメントを自動生成

### 🔗 参考リンク

- [POSTMAN公式ドキュメント](https://learning.postman.com/docs/)
- [POSTMAN Learning Center](https://learning.postman.com/)
- [REST API チュートリアル](https://www.postman.com/postman/workspace/postman-team-collections/collection/1559645-10e9c43d-7e7c-4c89-b4f4-1f8f7e8c9b9a)

---

## 💡 プロのTips

### 🚀 効率的なワークフロー

1. **環境変数を活用**: `{{token}}`、`{{licenseId}}`など、繰り返し使う値は変数化
2. **フォルダで整理**: 関連するリクエストをフォルダにまとめる
3. **テストスクリプトで自動化**: レスポンスから値を抽出して次のリクエストに使う
4. **Pre-request Script**: リクエスト送信前に動的にデータを生成

### 📋 テストスクリプトの例

**「Login」**リクエストのTestsタブに既に設定されています：

```javascript
// レスポンスが成功した場合、トークンを環境変数に保存
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.success && response.data.token) {
        pm.collectionVariables.set('token', response.data.token);
        console.log('✅ トークンが保存されました');
    }
}
```

---

## 🎉 完了！

これでPOSTMANを使ったAPIテストができるようになりました！

質問があれば、プロジェクトの[README.md](./README.md)や[SETUP.md](./SETUP.md)も参照してください。

**Happy Testing! 🚀**
