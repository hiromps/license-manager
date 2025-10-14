# 🚀 クイックスタートガイド

## 完全無料でデプロイ（5分で完了）

### 📋 準備するもの

- [ ] GitHubアカウント
- [ ] Vercelアカウント（無料）
- [ ] Neonアカウント（無料）

---

## ステップ1: ライセンスキー生成 🔑

```bash
# プロジェクトルートで実行
node scripts/generate-keys.js
```

**出力例:**
```
LICENSE_PUBLIC_KEY=abcd1234...
LICENSE_PRIVATE_KEY=xyz9876...
```

⚠️ この2つの値をメモ帳等にコピーして保存してください

---

## ステップ2: Neonデータベース作成 🗄️

### 1. Neonアカウント作成
https://neon.tech にアクセス → "Sign Up" → GitHubでログイン

### 2. データベース作成
1. "Create a project" をクリック
2. プロジェクト名: `license-manager`
3. リージョン: `Asia Pacific (Singapore)` または `US East (Ohio)`
4. "Create Project" をクリック

### 3. 接続文字列取得
"Connection string" をコピー（"Pooled connection" を選択）:

```
postgresql://username:password@ep-xxx-xxx.region.neon.tech/license_manager?sslmode=require
```

⚠️ この接続文字列もメモ帳にコピー

---

## ステップ3: GitHubリポジトリ作成 📦

```bash
# プロジェクトルートで実行
git init
git add .
git commit -m "Initial commit"
git branch -M main

# GitHubで新規リポジトリ作成後
git remote add origin https://github.com/YOUR_USERNAME/license-manager.git
git push -u origin main
```

---

## ステップ4: Vercelデプロイ ☁️

### 1. Vercelアカウント作成
https://vercel.com にアクセス → "Sign Up" → GitHubでログイン

### 2. プロジェクトインポート
1. "Add New..." → "Project" をクリック
2. GitHubから `license-manager` リポジトリを選択
3. "Import" をクリック

### 3. プロジェクト設定

**Framework Preset**: Other
**Root Directory**: `./`
**Build Command**: `pnpm build`
**Install Command**: `pnpm install`
**Output Directory**: `apps/web/dist`

"Deploy" をクリック（まだデプロイは失敗します - 環境変数が未設定のため）

### 4. 環境変数設定

デプロイ失敗後、以下の手順で環境変数を設定：

1. Vercel Dashboard → Settings → Environment Variables
2. 以下を1つずつ追加（ステップ1、2でコピーした値を使用）:

#### 必須の環境変数

| 変数名 | 値 | どこで設定 |
|--------|-----|-----------|
| `DATABASE_URL` | ステップ2でコピーしたNeon接続文字列 | Production, Preview, Development |
| `JWT_SECRET` | ランダムな文字列（32文字以上）<br>例: `my-super-secret-jwt-key-2024-production-v1` | Production, Preview, Development |
| `LICENSE_PRIVATE_KEY` | ステップ1で生成した秘密鍵 | Production, Preview, Development |
| `LICENSE_PUBLIC_KEY` | ステップ1で生成した公開鍵 | Production, Preview, Development |
| `NODE_ENV` | `production` | Production のみ |
| `CORS_ORIGIN` | `https://your-app.vercel.app`<br>（後で自分のVercel URLに変更） | Production, Preview, Development |

**JWT_SECRETの生成方法**:
```bash
# PowerShellで実行
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### 5. 再デプロイ

環境変数設定完了後:
1. "Deployments" タブをクリック
2. 最新のデプロイの "..." → "Redeploy" をクリック
3. "Redeploy" ボタンをクリック

数分待つとデプロイ完了！

---

## ステップ5: データベースマイグレーション 🔄

デプロイ成功後、ローカルからマイグレーションを実行：

```bash
# Neon接続文字列を使用（ステップ2でコピーした値）
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database prisma migrate deploy
```

---

## ステップ6: 初期管理者アカウント作成 👤

```bash
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database db:seed
```

**デフォルト管理者アカウント**:
- Email: `admin@acme.com`
- Password: `admin123`

⚠️ 初回ログイン後すぐにパスワードを変更してください

---

## ✅ 完成！アクセスしてみよう

### フロントエンド
https://your-app.vercel.app

### API Health Check
https://your-app.vercel.app/api/v1/health

### 動作確認

1. ✅ ログインページが表示される
2. ✅ 管理者アカウントでログイン成功
3. ✅ ダッシュボードが表示される
4. ✅ 新規登録ができる
5. ✅ 顧客ダッシュボードでライセンスが表示される

---

## 🔧 トラブルシューティング

### デプロイが失敗する

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. Vercel Dashboard → Settings → Environment Variables を確認
2. すべての必須変数が設定されているか確認
3. 変数名にスペースや余分な文字がないか確認
4. 再デプロイ

### ログインできない

**原因**: データベースマイグレーションが実行されていない

**解決方法**:
```bash
DATABASE_URL="your-neon-url" pnpm --filter @license-manager/database prisma migrate deploy
DATABASE_URL="your-neon-url" pnpm --filter @license-manager/database db:seed
```

### API Health Checkが404

**原因**: Vercel設定ファイルの問題

**解決方法**:
1. `vercel.json` が正しく配置されているか確認
2. GitHubにプッシュされているか確認
3. Vercelで再デプロイ

---

## 📈 次のステップ

### カスタムドメイン設定（オプション）
Vercel Dashboard → Settings → Domains

### 監視設定
Vercel Dashboard → Analytics（無料）

### バックアップ設定
Neon Dashboard → Backups（Pro以上）

---

## 💰 無料プランの制限

### Vercel Hobby
- 月100GB帯域幅
- Serverless Functions 10秒タイムアウト
- 個人・非商用のみ

### Neon Free Tier
- 0.5GB storage
- 共有CPU
- 3プロジェクト

**推奨規模**:
- ユーザー数: 〜1,000人
- ライセンス数: 〜10,000件
- 月間PV: 〜50,000

---

## 🆘 サポート

質問・問題がある場合:
- GitHub Issues: https://github.com/YOUR_USERNAME/license-manager/issues
- Vercel Community: https://github.com/vercel/community
- Neon Discord: https://discord.gg/neon

---

**🎉 おめでとうございます！完全無料でLicense Managerが稼働しています！**
