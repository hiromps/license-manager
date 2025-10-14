# Vercelデプロイチェックリスト ✅

このチェックリストに従って、順番にデプロイを進めてください。

---

## ステップ1: ライセンスキー生成 🔑

```bash
node scripts/generate-keys.js
```

✅ 出力された2つの値をメモ帳にコピー：
- [ ] `LICENSE_PUBLIC_KEY`
- [ ] `LICENSE_PRIVATE_KEY`

---

## ステップ2: Neonデータベース作成 🗄️

### 1. アカウント作成
https://neon.tech にアクセス → GitHubでサインアップ（無料）

### 2. プロジェクト作成
- [ ] "Create a project" をクリック
- [ ] プロジェクト名: `license-manager`
- [ ] リージョン: `Asia Pacific (Singapore)` 推奨
- [ ] "Create Project" をクリック

### 3. 接続文字列取得
- [ ] "Connection string" タブを開く
- [ ] **"Pooled connection"** を選択
- [ ] 接続文字列をメモ帳にコピー:

```
postgresql://username:password@ep-xxx-xxx.region.neon.tech/license_manager?sslmode=require
```

---

## ステップ3: GitHubにプッシュ 📦

```bash
# まだGitリポジトリを作成していない場合
git init
git add .
git commit -m "Initial commit"
git branch -M main

# GitHubで新規リポジトリを作成
# https://github.com/new

# リモートリポジトリを追加してプッシュ
git remote add origin https://github.com/YOUR_USERNAME/license-manager.git
git push -u origin main
```

- [ ] GitHubにコードがプッシュされた

---

## ステップ4: Vercelでプロジェクト作成 ☁️

### 1. アカウント作成
https://vercel.com にアクセス → GitHubでサインアップ（無料）

### 2. プロジェクトインポート
- [ ] "Add New..." → "Project" をクリック
- [ ] GitHubから `license-manager` リポジトリを選択
- [ ] "Import" をクリック

### 3. ビルド設定
以下の設定を入力：

| 項目 | 設定値 |
|-----|--------|
| Framework Preset | **Other** |
| Root Directory | `./` |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Output Directory | `apps/web/dist` |

- [ ] "Deploy" をクリック（まだ失敗します - 正常です）

---

## ステップ5: 環境変数設定 🔐

デプロイ失敗後、以下を設定：

Vercel Dashboard → Settings → Environment Variables

### 必須の環境変数（6つ）

#### 1. DATABASE_URL
- 値: ステップ2でコピーしたNeon接続文字列
- 適用先: ✅ Production ✅ Preview ✅ Development
- [ ] 設定完了

#### 2. JWT_SECRET
- 値: ランダムな文字列（32文字以上）
- 例: `my-super-secret-jwt-key-2024-production-abc123xyz`
- 適用先: ✅ Production ✅ Preview ✅ Development
- [ ] 設定完了

**JWT_SECRETの生成方法**:
```bash
# PowerShellで実行
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### 3. LICENSE_PRIVATE_KEY
- 値: ステップ1で生成した秘密鍵
- 適用先: ✅ Production ✅ Preview ✅ Development
- [ ] 設定完了

#### 4. LICENSE_PUBLIC_KEY
- 値: ステップ1で生成した公開鍵
- 適用先: ✅ Production ✅ Preview ✅ Development
- [ ] 設定完了

#### 5. NODE_ENV
- 値: `production`
- 適用先: ✅ Production のみ
- [ ] 設定完了

#### 6. CORS_ORIGIN
- 値: 後で設定（一旦 `*` でOK）
- 適用先: ✅ Production ✅ Preview ✅ Development
- [ ] 設定完了

---

## ステップ6: 再デプロイ 🔄

- [ ] Vercel Dashboard → "Deployments" タブ
- [ ] 最新のデプロイの "..." → "Redeploy" をクリック
- [ ] "Redeploy" ボタンをクリック
- [ ] デプロイ成功を確認（緑色のチェックマーク）

**デプロイURL**: `https://your-app.vercel.app`

このURLをコピーしてください。

---

## ステップ7: CORS_ORIGIN更新 🔧

- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] `CORS_ORIGIN` を編集
- [ ] 値を `https://your-app.vercel.app` に変更（実際のURLを使用）
- [ ] 保存後、再度 "Redeploy"

---

## ステップ8: データベースマイグレーション 🔄

ローカルPCから実行：

```bash
# ステップ2のNeon接続文字列を使用
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database prisma migrate deploy
```

- [ ] マイグレーション成功

---

## ステップ9: 初期管理者アカウント作成 👤

```bash
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database db:seed
```

- [ ] シード成功

**管理者アカウント**:
- Email: `admin@acme.com`
- Password: `admin123`

⚠️ 初回ログイン後すぐにパスワードを変更

---

## ステップ10: 動作確認 ✅

### 1. フロントエンドアクセス
- [ ] `https://your-app.vercel.app` を開く
- [ ] ログインページが表示される

### 2. API Health Check
- [ ] `https://your-app.vercel.app/api/v1/health` を開く
- [ ] `{"status":"ok","timestamp":"..."}` が表示される

### 3. ログイン
- [ ] `admin@acme.com` / `admin123` でログイン成功
- [ ] 管理者ダッシュボードが表示される

### 4. 新規登録
- [ ] "Create Account" から新規登録
- [ ] 顧客ダッシュボードが表示される

---

## 🎉 デプロイ完了！

すべてのチェックボックスが✅になったら、デプロイ完了です！

**本番URL**: https://your-app.vercel.app

---

## 🔧 トラブルシューティング

### デプロイが失敗する

**確認事項**:
1. すべての環境変数が設定されているか
2. 変数名にスペースや余分な文字がないか
3. `DATABASE_URL` が正しいか（`?sslmode=require` を含む）

### ログインできない

**原因**: データベースマイグレーション未実行

**解決**:
```bash
DATABASE_URL="your-neon-url" pnpm --filter @license-manager/database prisma migrate deploy
DATABASE_URL="your-neon-url" pnpm --filter @license-manager/database db:seed
```

### API が 404

**原因**: `vercel.json` の問題

**解決**: GitHubに `vercel.json` がプッシュされているか確認

---

## 📞 サポート

問題が発生した場合:
- Vercel Logs を確認: Dashboard → Deployments → 該当デプロイ → "Logs"
- GitHub Issues: https://github.com/YOUR_USERNAME/license-manager/issues
