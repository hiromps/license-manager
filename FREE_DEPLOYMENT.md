# 完全無料でのデプロイガイド 🆓

このガイドでは、**完全無料**でLicense Managerをデプロイする方法を説明します。

## 🎯 無料プラン構成

### 使用するサービス

| サービス | 役割 | 無料枠 |
|---------|------|--------|
| **Vercel Hobby** | フロントエンド + API | 月100GB帯域幅、無制限デプロイ |
| **Neon Free Tier** | PostgreSQL | 0.5GB storage、3プロジェクト |

**合計コスト: $0/月** ✅

---

## 📊 無料プランの制限

### Vercel Hobby
- ✅ 個人プロジェクト・非商用のみ
- ✅ 月100GB帯域幅（小〜中規模アプリに十分）
- ✅ Serverless Functions: 10秒タイムアウト
- ✅ 1チームメンバー（自分のみ）

### Neon Free Tier
- ✅ 0.5GB storage（数千ライセンスに対応可能）
- ✅ 共有CPU（アクティブ時のみ課金なし）
- ✅ 自動スケールダウン（非アクティブ時）
- ⚠️ 7日間アクセスなしでスリープ

**推定対応規模**:
- ユーザー数: 〜1,000人
- ライセンス数: 〜10,000件
- 月間リクエスト: 〜100,000件

---

## 🚀 デプロイ手順（完全無料）

### ステップ1: Neonデータベース作成（無料）

#### 1. Neonアカウント作成
https://neon.tech にアクセスして無料アカウント作成

#### 2. プロジェクト作成
1. "Create a project" をクリック
2. プロジェクト名: `license-manager`
3. リージョン: 最も近い場所を選択（例: `asia-southeast1`）
4. PostgreSQL Version: `16`（最新）
5. "Create Project" をクリック

#### 3. 接続文字列取得
作成後、"Connection string" をコピー：

```
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/license_manager?sslmode=require
```

---

### ステップ2: ライセンスキー生成

```bash
# プロジェクトルートで実行
node scripts/generate-keys.js
```

出力をコピーして保存：
```
LICENSE_PUBLIC_KEY=xxxxx
LICENSE_PRIVATE_KEY=xxxxx
```

---

### ステップ3: Vercelデプロイ

#### オプションA: GitHub連携（推奨）

##### 1. GitHubリポジトリ作成

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/license-manager.git
git push -u origin main
```

##### 2. Vercelでインポート

1. https://vercel.com にアクセスして無料アカウント作成
2. "Add New..." → "Project"
3. GitHubリポジトリを選択: `license-manager`
4. プロジェクト設定:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `apps/web/dist`

##### 3. 環境変数設定

Vercel Dashboard → Settings → Environment Variables に以下を追加：

```bash
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars-long-random-string

# License Keys (scripts/generate-keys.jsで生成)
LICENSE_PRIVATE_KEY=your-base64-private-key
LICENSE_PUBLIC_KEY=your-base64-public-key

# Environment
NODE_ENV=production

# CORS (デプロイ後に自分のVercel URLに変更)
CORS_ORIGIN=https://your-app.vercel.app
```

**環境の適用先**: Production, Preview, Development すべてにチェック

##### 4. 再デプロイ

環境変数設定後、"Deployments" → 最新デプロイの "..." → "Redeploy" をクリック

---

#### オプションB: Vercel CLI

```bash
# Vercel CLIインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 環境変数設定（プロンプトに従って入力）
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add LICENSE_PRIVATE_KEY
vercel env add LICENSE_PUBLIC_KEY
vercel env add CORS_ORIGIN

# プロダクションデプロイ
vercel --prod
```

---

### ステップ4: データベースマイグレーション

デプロイ完了後、データベースマイグレーションを実行：

```bash
# ローカルから実行（Neon接続文字列を使用）
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database prisma migrate deploy
```

---

### ステップ5: 初期データ投入（オプション）

管理者アカウントを作成：

```bash
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database db:seed
```

デフォルト管理者:
- Email: `admin@acme.com`
- Password: `admin123`

**⚠️ デプロイ後すぐにパスワードを変更してください！**

---

## ✅ デプロイ完了チェックリスト

- [ ] Neonデータベース作成完了
- [ ] ライセンスキー生成完了
- [ ] GitHubリポジトリ作成完了
- [ ] Vercelプロジェクト作成完了
- [ ] 環境変数すべて設定完了
- [ ] データベースマイグレーション完了
- [ ] フロントエンドアクセス確認: `https://your-app.vercel.app`
- [ ] API Health Check確認: `https://your-app.vercel.app/api/v1/health`
- [ ] ログイン機能動作確認
- [ ] 新規登録機能動作確認
- [ ] ライセンス表示確認

---

## 🔄 自動デプロイ設定

GitHub連携している場合、以下が自動的に行われます：

```bash
# mainブランチにプッシュ → 本番環境に自動デプロイ
git push origin main

# feature/xxxブランチにプッシュ → プレビュー環境に自動デプロイ
git checkout -b feature/new-feature
git push origin feature/new-feature
```

各デプロイに一意のURLが発行されます：
- 本番: `https://your-app.vercel.app`
- プレビュー: `https://your-app-git-feature-xxx.vercel.app`

---

## 📈 スケールアップが必要な場合

無料プランで制限に達した場合の選択肢：

### Vercelをアップグレード（$20/月）
- 月1TB帯域幅（10倍）
- カスタムドメイン無制限
- チームコラボレーション
- 優先サポート

### Neonをアップグレード（$19/月）
- 10GB storage（20倍）
- 専用CPU
- 自動バックアップ
- ポイントインタイムリカバリ

---

## 🆘 トラブルシューティング

### ビルドエラー: "Out of memory"

**原因**: Monorepo構造でメモリ不足

**解決策**: `.vercelignore` を作成してビルド対象を限定

```
# .vercelignore
node_modules
*.log
.git
.vscode
claudedocs
```

### Neonデータベースがスリープ

**原因**: 7日間アクセスなし

**解決策**:
1. Neon Dashboardでプロジェクトを開く
2. "Wake up" ボタンをクリック
3. または初回アクセス時に自動起動（数秒待つ）

### APIタイムアウト

**原因**: Vercel Serverless Functionsの10秒制限

**解決策**:
1. データベースクエリの最適化
2. N+1問題の解決
3. キャッシング追加

---

## 💡 無料プランでの最適化Tips

### 1. データベース接続プーリング

Neon無料プランは接続数制限があるため、Prismaの設定を最適化：

```javascript
// apps/api/src/index.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 接続プールサイズを小さく
  datasourceUrl: process.env.DATABASE_URL + '&connection_limit=5',
});
```

### 2. Vercel帯域幅節約

- 画像最適化（Next.js Image使用）
- Gzip圧縮有効化（自動）
- 不要なアセット削除

### 3. Neonストレージ節約

- 古いaudit_logsの定期削除
- インデックス最適化
- 不要なカラム削除

---

## 📊 無料プランでの推奨利用規模

| 指標 | 推奨値 |
|-----|--------|
| 登録ユーザー数 | 〜1,000人 |
| ライセンス数 | 〜10,000件 |
| 月間ページビュー | 〜50,000 PV |
| 月間APIリクエスト | 〜100,000 req |
| データベースサイズ | 〜300MB |

これを超える場合はアップグレードを検討してください。

---

## 🎉 デプロイ成功！

完全無料でLicense Managerが稼働しています！

**本番URL**: https://your-app.vercel.app

次のステップ：
1. カスタムドメイン設定（オプション）
2. SSL証明書確認（Vercel自動）
3. 監視・アラート設定（Vercel Analytics）

---

**質問・問題がある場合**: GitHub Issuesで報告してください
