# License Manager - Vercel Deployment Guide

このガイドでは、License Managerアプリケーションを**Vercel**にデプロイする手順を説明します。

## 📋 必要なもの

- [Vercel](https://vercel.com) アカウント
- [Neon](https://neon.tech) または [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) アカウント（PostgreSQL用）
- GitHubリポジトリ（推奨）

---

## 🚀 デプロイ方法

### オプション1: Vercel CLI（推奨）

#### 1. Vercel CLIをインストール

```bash
npm install -g vercel
```

#### 2. Vercelにログイン

```bash
vercel login
```

#### 3. プロジェクトをデプロイ

```bash
# プロジェクトルートから実行
vercel

# プロダクションデプロイ
vercel --prod
```

---

### オプション2: GitHub連携（自動デプロイ）

#### 1. GitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/license-manager.git
git push -u origin main
```

#### 2. Vercelでインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) を開く
2. "Add New..." → "Project" をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

---

## 🗄️ データベース設定

### オプションA: Neon（推奨 - 無料プランあり）

#### 1. Neonアカウント作成

https://neon.tech でアカウント作成

#### 2. PostgreSQLデータベース作成

1. "Create a project" をクリック
2. プロジェクト名: `license-manager`
3. リージョン選択
4. 接続文字列をコピー

#### 3. Vercel環境変数に追加

Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
LICENSE_PRIVATE_KEY=your-base64-encoded-private-key
LICENSE_PUBLIC_KEY=your-base64-encoded-public-key
NODE_ENV=production
CORS_ORIGIN=https://your-domain.vercel.app
```

---

### オプションB: Vercel Postgres

#### 1. Vercel Postgresを追加

Vercel Dashboard → Storage → Create Database → Postgres

#### 2. データベース接続

Vercel Postgresは自動的に`DATABASE_URL`環境変数を設定します。

---

## 🔑 ライセンスキー生成

プロダクション用のEd25519キーを生成：

```bash
node -e "
const sodium = require('libsodium-wrappers');
(async () => {
  await sodium.ready;
  const keys = sodium.crypto_sign_keypair();
  console.log('LICENSE_PUBLIC_KEY=' + sodium.to_base64(keys.publicKey));
  console.log('LICENSE_PRIVATE_KEY=' + sodium.to_base64(keys.privateKey));
})();
"
```

生成されたキーをVercelの環境変数に追加してください。

---

## 📝 環境変数一覧

Vercel Dashboard → Settings → Environment Variables で以下を設定：

### 必須

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続文字列 | `postgresql://...` |
| `JWT_SECRET` | JWT署名用シークレット | ランダムな文字列（32文字以上） |
| `LICENSE_PRIVATE_KEY` | ライセンス署名用秘密鍵 | Base64エンコード文字列 |
| `LICENSE_PUBLIC_KEY` | ライセンス検証用公開鍵 | Base64エンコード文字列 |

### オプション

| 変数名 | 説明 | デフォルト値 |
|--------|------|--------------|
| `NODE_ENV` | 環境 | `production` |
| `CORS_ORIGIN` | CORS許可オリジン | `https://your-domain.vercel.app` |
| `JWT_EXPIRES_IN` | JWTトークン有効期限 | `24h` |
| `RATE_LIMIT_MAX` | レート制限最大リクエスト数 | `100` |
| `RATE_LIMIT_WINDOW` | レート制限時間窓 | `15m` |

---

## 🔄 データベースマイグレーション

デプロイ後、データベースマイグレーションを実行：

### 方法1: Vercel CLI経由

```bash
# Vercel環境に接続してマイグレーション実行
vercel env pull .env.production
pnpm --filter @license-manager/database prisma migrate deploy
```

### 方法2: ローカルから直接実行

```bash
# .env.productionファイルに本番DATABASE_URLを設定
DATABASE_URL="postgresql://..." pnpm --filter @license-manager/database prisma migrate deploy
```

---

## 🧪 シードデータ（オプション）

初期管理者アカウントを作成：

```bash
DATABASE_URL="your-production-db-url" pnpm --filter @license-manager/database db:seed
```

デフォルト管理者:
- Email: `admin@acme.com`
- Password: `admin123`

**⚠️ 本番環境では必ずパスワードを変更してください！**

---

## 🔍 トラブルシューティング

### ビルドエラー: "Cannot find module"

**原因**: Monorepo構造でパッケージが見つからない

**解決策**: `vercel.json`の`includeFiles`を確認

```json
{
  "builds": [
    {
      "src": "apps/api/src/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["packages/**", "apps/api/**"]
      }
    }
  ]
}
```

### データベース接続エラー

**原因**: SSL証明書の検証エラー

**解決策**: DATABASE_URLに`?sslmode=require`を追加

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### CORS エラー

**原因**: フロントエンドドメインがCORS_ORIGINに設定されていない

**解決策**: Vercel環境変数に正しいドメインを設定

```
CORS_ORIGIN=https://your-app.vercel.app
```

---

## 📊 デプロイ後の確認

デプロイが成功したら以下を確認：

1. ✅ フロントエンド: `https://your-app.vercel.app`
2. ✅ API Health Check: `https://your-app.vercel.app/api/v1/health`
3. ✅ ログイン機能
4. ✅ ライセンス一覧表示

---

## 🔄 継続的デプロイ

GitHub連携の場合、`main`ブランチへのプッシュで自動デプロイされます：

```bash
git add .
git commit -m "Update feature"
git push origin main
# → Vercelが自動的にビルド&デプロイ
```

---

## 💰 料金

### Vercel
- **Hobby（無料）**: 個人プロジェクト、月100GB帯域幅
- **Pro（$20/月）**: 商用利用、月1TB帯域幅、チームコラボレーション

### Neon
- **Free Tier**: 0.5GB storage、共有CPU、3プロジェクト
- **Pro（$19/月）**: 10GB storage、専用CPU、無制限プロジェクト

### 合計コスト
- **開発/個人**: $0/月（両方無料プラン）
- **商用**: $20-39/月（Vercel Pro + Neon Pro）

---

## 📚 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Fastify on Vercel](https://www.fastify.io/docs/latest/Guides/Serverless/)

---

## 🆘 サポート

問題が発生した場合：
1. Vercel Logs を確認: `vercel logs`
2. GitHub Issues で報告
3. Vercel Community でサポート

---

**🎉 デプロイ完了！**

本番環境でアプリケーションが稼働しています。
