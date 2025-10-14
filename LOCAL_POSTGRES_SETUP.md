# ローカルPostgreSQL設定ガイド

schema.prismaをPostgreSQLに変更したので、ローカル開発でもPostgreSQLを使う必要があります。

## 🎯 3つの選択肢

### オプション1: Neon（開発用）を使う【推奨・最も簡単】

**メリット**: セットアップ不要、無料、クラウド

#### 手順

1. **Neonで開発用データベースを作成**

https://neon.tech にアクセス

2. **2つ目のプロジェクトを作成**
   - プロジェクト名: `license-manager-dev`
   - これは開発専用

3. **接続文字列をコピー**
```
postgresql://user:pass@ep-xxx.neon.tech/license_manager_dev?sslmode=require
```

4. **apps/api/.env を更新**
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/license_manager_dev?sslmode=require
```

5. **マイグレーション実行**
```bash
pnpm db:migrate
```

✅ **完了！** 開発サーバーを再起動してください

---

### オプション2: Docker PostgreSQL

**メリット**: ローカル完結、オフライン対応

#### 手順

1. **Dockerがインストールされているか確認**
```bash
docker --version
```

2. **PostgreSQLコンテナを起動**
```bash
docker run --name license-postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=license_manager ^
  -p 5432:5432 ^
  -d postgres:16-alpine
```

3. **apps/api/.env を更新**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/license_manager
```

4. **マイグレーション実行**
```bash
pnpm db:migrate
```

✅ **完了！**

---

### オプション3: PostgreSQLをローカルインストール

**メリット**: Dockerなしで動作

#### Windows

1. https://www.postgresql.org/download/windows/ からインストーラーをダウンロード
2. インストール時にパスワードを設定
3. pgAdmin4が自動でインストールされます

#### macOS

```bash
brew install postgresql@16
brew services start postgresql@16
```

#### 設定

```bash
# データベース作成
psql -U postgres
CREATE DATABASE license_manager;
\q
```

**apps/api/.env を更新**
```bash
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/license_manager
```

**マイグレーション実行**
```bash
pnpm db:migrate
```

---

## ✅ どれを選ぶべき？

| 状況 | おすすめ |
|-----|---------|
| 最も簡単 | **Neon（開発用）** |
| オフライン開発 | Docker PostgreSQL |
| Dockerなし | ローカルインストール |

---

## 📊 本番との使い分け

```
開発環境
  ├─ Prisma（PostgreSQL設定）
  └─ Neon開発用 OR Docker OR ローカルPostgreSQL

本番環境（Vercel）
  ├─ Prisma（PostgreSQL設定） ← 同じ設定
  └─ Neon本番用
```

**重要**: Prismaの設定は統一されているので、環境変数（DATABASE_URL）を変えるだけで切り替わります。

---

## 🔄 環境の切り替え

### ローカル開発
```bash
# apps/api/.env
DATABASE_URL=postgresql://localhost:5432/license_manager_dev
```

### 本番（Vercel環境変数）
```bash
DATABASE_URL=postgresql://ep-xxx.neon.tech/license_manager_prod
```

**コードは一切変更不要！** 環境変数だけで切り替わります。

---

## ❓ よくある質問

### Q: SQLiteのdev.dbはどうなる？

使われなくなります。削除してもOKです。

### Q: データは移行できる？

手動でダンプ・リストアが必要ですが、通常は新規作成を推奨します。

### Q: Neon無料プランで2つのデータベースは使える？

✅ はい！無料プランで3プロジェクトまで作成可能です：
- 開発用: `license-manager-dev`
- 本番用: `license-manager-prod`
- 予備: 1つ余裕あり

---

## 🚀 推奨セットアップ（Neon使用）

```bash
# 1. Neonで開発用DB作成
# https://neon.tech → Create project → license-manager-dev

# 2. 接続文字列をコピーして.envに設定
DATABASE_URL=postgresql://...

# 3. マイグレーション実行
pnpm db:migrate

# 4. 開発サーバー起動
pnpm dev
```

これで完了！Prismaが本番でも開発でも使えます。
