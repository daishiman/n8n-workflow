# Git ワークフローガイド

## 概要

このドキュメントは、n8n-workflowプロジェクトにおける標準的なGitワークフローを定義します。

## ブランチ戦略

### メインブランチ
- `main`: 本番環境対応コード（常にデプロイ可能な状態）

### フィーチャーブランチ命名規則
```
feature/[機能名]-[YYYYMMDD]
```

**例:**
- `feature/add-user-authentication-20251111`
- `feature/implement-ai-agent-workflow-20251111`

### 機能名の命名ガイドライン
- 3-4単語の英語で記述
- ハイフン区切り（kebab-case）
- 動詞で始める（add, fix, update, refactor, remove）

## ワークフロー手順

### 1. ブランチの作成
```bash
git checkout main
git pull origin main
git checkout -b feature/[機能名]-[YYYYMMDD]
```

### 2. コミットの作成

#### コミットメッセージ規約
```
[種別]: [変更内容の要約]
```

**種別一覧:**
- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント変更のみ
- `style`: コードフォーマット変更（機能に影響なし）
- `refactor`: リファクタリング（機能追加・バグ修正なし）
- `test`: テスト追加・修正
- `chore`: ビルドプロセス、補助ツールの変更

#### コミットのベストプラクティス
- **1コミット = 1つの完結した変更**
- ファイル追加のみ、修正のみ、削除のみで分ける
- 異なる機能の変更は別コミットにする

```bash
git add [変更したファイル]
git commit -m "feat: ログインフォームのコンポーネントを追加"
```

### 3. リモートへのプッシュ
```bash
git push origin feature/[機能名]-[YYYYMMDD]
```

### 4. プルリクエストの作成

#### タイトル
```
[種別] [変更内容の要約]
```

#### 本文テンプレート
```markdown
## 変更内容
- [変更点1]
- [変更点2]

## 変更理由
[なぜこの変更が必要か]

## 確認事項
- [ ] テスト実施済み
- [ ] コードレビュー依頼済み
```

### 5. マージの実行
1. プルリクエストの承認を確認
2. GitHub上で「Merge」ボタンをクリック
3. マージ完了を確認

### 6. ローカルの更新とクリーンアップ
```bash
git checkout main
git pull origin main
git branch -d feature/[機能名]-[YYYYMMDD]
```

## ブランチのクリーンアップ

### マージ済みローカルブランチの削除
```bash
# マージ済みブランチの確認
git branch --merged main

# マージ済みブランチの一括削除
git branch --merged main | grep -v "^\*" | grep -v "main" | xargs git branch -d
```

### リモート追跡ブランチのクリーンアップ
```bash
git remote prune origin
```

## 実行例

```bash
# 1. ブランチ作成
git checkout main
git pull origin main
git checkout -b feature/add-login-form-20251110

# 2. 作業とコミット
git add src/components/LoginForm.tsx
git commit -m "feat: ログインフォームのコンポーネントを追加"

# 3. プッシュ
git push origin feature/add-login-form-20251110

# 4. WebでPR作成（タイトル：feat ログインフォーム実装）

# 5. WebでMerge実行

# 6. ローカル更新
git checkout main
git pull origin main
git branch -d feature/add-login-form-20251110
```

## トラブルシューティング

### ブランチが多すぎる場合
定期的にマージ済みブランチをクリーンアップしましょう。

### コンフリクトが発生した場合
```bash
# mainブランチの最新を取り込む
git checkout feature/your-branch
git merge main

# コンフリクトを解決してコミット
git add .
git commit -m "fix: コンフリクトを解決"
git push origin feature/your-branch
```

## 参考資料
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
