# Step0: n8n AIエージェント設定確定

## ✅ AI設定サマリー

### 使用するChat Model

#### 1. XAI Grok Chat Model (ステップ1,2,3用)
- **ノードタイプ**: `@n8n/n8n-nodes-langchain.lmChatOpenAi`
- **モデル**: `grok-beta`
- **ベースURL**: `https://api.x.ai/v1`
- **認証方式**: API Key (OpenAI互換)
- **用途**:
  - ステップ1: 文字起こし整形（フィラー除去、1行ごとJSON化）
  - ステップ2: 議題抽出（議題ごとにJSONオブジェクト生成）
  - ステップ3: 議題分析（決定事項、宿題、保留事項抽出）

#### 2. Claude Sonnet 4.5 Chat Model (ステップ4,5用)
- **ノードタイプ**: `@n8n/n8n-nodes-langchain.lmChatAnthropic`
- **モデル**: `claude-sonnet-4-5-20250514`
- **認証方式**: Anthropic API Key
- **用途**:
  - ステップ4: 議事録フォーマット変換（全ステップ情報統合）
  - ステップ5: 品質保証（全ステップ検証、議事録完全性確認）

### Memory設定

- **ノードタイプ**: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- **表示名**: Simple Memory
- **目的**: 各AIエージェントの会話履歴管理

---

## 📋 議事録フォーマット

### デフォルトフォーマット構造

```
タイトル: [ファイル名から自動生成]
日時: [ファイル作成日時]
参加者: [音声から推定または手動入力]

## 議題1: [議題タイトル]
### 議論内容
- [箇条書き]

### 決定事項
- [箇条書き]

### 宿題
- [担当者] [期限] [タスク内容]

### 保留事項
- [理由付き箇条書き]

---

## 議題2: ...
[同様の構造]

---

## 全体サマリー
[品質保証AIが生成]
```

---

## 🔑 必要な認証情報

### 1. XAI API (OpenAI互換)
```
認証情報名: xAiApi
API Key変数: XAI_API_KEY
ベースURL: https://api.x.ai/v1
```

**取得手順**:
1. https://console.x.ai/ にアクセス
2. APIキーを生成
3. n8nで「OpenAI」認証情報を選択
4. Base URLに `https://api.x.ai/v1` を設定
5. APIキーを入力

### 2. Anthropic API
```
認証情報名: anthropicApi
API Key変数: ANTHROPIC_API_KEY
```

**取得手順**:
1. https://console.anthropic.com/ にアクセス
2. APIキーを生成
3. n8nで「Anthropic」認証情報を選択
4. APIキーを入力

### 3. Google Drive OAuth2
```
認証情報名: googleDriveOAuth2Api
```

**取得手順**:
1. Google Cloud Consoleでプロジェクト作成
2. Google Drive APIを有効化
3. OAuth 2.0クライアントIDを作成
4. n8nで「Google Drive OAuth2 API」を選択
5. 認証フローを完了

### 4. Notion API
```
認証情報名: notionApi
API Key変数: NOTION_API_KEY
Database ID変数: NOTION_DATABASE_ID
```

**取得手順**:
1. https://www.notion.so/my-integrations にアクセス
2. 新しいインテグレーションを作成
3. Internal Integration Tokenを取得
4. 議事録用データベースを作成
5. データベースをインテグレーションに共有
6. データベースIDを取得（URLの最後の32文字）
7. n8nで「Notion API」を選択
8. APIキーを入力

---

## 🎯 ワークフロー概要

### トリガー
Google Driveの指定フォルダにM4Aファイルが保存された時

### 処理ステップ
1. **文字起こし整形** (XAI Grok)
   - フィラー除去、1行ごとJSON化
   - 全データループ処理

2. **議題抽出** (XAI Grok)
   - 議題ごとにJSONオブジェクト生成

3. **議題分析** (XAI Grok)
   - 決定事項、宿題、保留事項を抽出してJSONに追記

4. **フォーマット変換** (Claude Sonnet 4.5)
   - 指定フォーマットに変換
   - 全ステップ情報統合

5. **品質保証** (Claude Sonnet 4.5)
   - 全ステップ読込
   - 議事録完全性検証

### 出力
Notionデータベースに議題ごとにページ作成（ループ処理でAPI制限回避）

---

## ✅ 次のステップへの準備完了

このAI設定で進めてよろしいですか？

**承認いただければ、Step1: 業務理解フェーズに進みます。**
