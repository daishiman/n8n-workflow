# Step000: n8n AI エージェント設定確定書

## 📋 設定概要

Google Meet議事録自動化ワークフローで使用するAI Agent Nodeの設定を確定しました。

**設定日**: 2025-01-09（更新: チャンク並列処理要件を追加）
**ワークフロー名**: Google Meet議事録自動化
**AI Agent使用箇所**: 5ステップ（Step1-5）
**並列処理**: Step1（チャンク並列）、Step3（議題並列）

---

## 🎯 Chat Model構成（ハイブリッドモデル）

### 構成戦略

業務要件の特性に基づき、処理内容ごとに最適なモデルを使い分けます。

```
Step1-3: 高速・コスト効率重視 → Google Gemini Flash 2.5
Step4-5: 品質・構造化重視 → Claude Sonnet 4.5
```

### Step1-3: Google Gemini Flash 2.5

**使用箇所**:
- **Step1**: 文字起こし整形（並列チャンク処理、フィラー除去、箇条書き化）
- **Step2**: 議題抽出（統合JSONから議題をグループ化）
- **Step3**: 議題分析（並列議題処理、決定事項、宿題、保留事項の抽出）

**選定理由**:
1. **高速処理**: パフォーマンス要件（1時間会議→5分以内処理）を満たす
2. **コスト効率**: 高頻度処理（5分ごとポーリング）に最適
3. **日本語処理能力**: Enhanced Japanese Modelとの相性が良い
4. **JSON出力**: 構造化データ生成が得意

**ノード情報**:
- **nodeType**: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
- **displayName**: Google Gemini Chat Model

**推奨パラメータ**:
```json
{
  "model": "models/gemini-2.5-flash-exp",
  "temperature": 0.4,
  "maxTokens": 4000,
  "topK": 40,
  "topP": 0.9
}
```

**認証情報**:
- **環境変数**: `GOOGLE_API_KEY`
- **取得方法**: [Google AI Studio](https://makersuite.google.com/app/apikey)でAPI Keyを生成

### Step4-5: Claude Sonnet 4.5

**使用箇所**:
- **Step4**: フォーマット変換（全データをMarkdown議事録に変換）
- **Step5**: 品質保証（議事録の完全性検証、補完提案）

**選定理由**:
1. **長文生成**: Markdown議事録の高品質な生成
2. **構造化能力**: 複雑なフォーマット要件への対応
3. **分析能力**: 品質保証に必要な検証・補完能力
4. **日本語品質**: 自然な日本語生成

**ノード情報**:
- **nodeType**: `@n8n/n8n-nodes-langchain.lmChatAnthropic`
- **displayName**: Anthropic Chat Model

**推奨パラメータ**:
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "temperature": 0.7,
  "maxTokens": 8000,
  "topK": 40,
  "topP": 0.9
}
```

**認証情報**:
- **環境変数**: `ANTHROPIC_API_KEY`
- **取得方法**: [Anthropic Console](https://console.anthropic.com/)でAPI Keyを生成

---

## 💾 Memory設定

### Simple Memory（並列処理対応設計）

**Memory使用方針**:

| ステップ | Memory使用 | 理由 |
|---------|-----------|------|
| Step1（並列チャンク処理） | ❌ なし | 各チャンクは独立処理、オーバーラップで文脈確保 |
| Step2（議題抽出） | ✅ あり | 全体を1回処理、統合JSONの文脈保持が必要 |
| Step3（並列議題分析） | ❌ なし | 各議題は独立処理、該当文字起こしを全て渡す |
| Step4（フォーマット変換） | ✅ あり | 全データ統合、文脈保持が必要 |
| Step5（品質保証） | ✅ あり | Step4からの連続処理、検証に文脈が必要 |

**選定理由**:
1. **並列処理最適化**: 独立処理ではMemoryを使わず、並列性能を最大化
2. **文脈保持**: 統合処理ではMemoryで文脈を保持
3. **オーバーラップ方式**: チャンク処理では前後3チャンクのオーバーラップで文脈確保
4. **シンプル設計**: 開発・テストが容易

**ノード情報**:
- **nodeType**: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- **displayName**: Simple Memory

**推奨パラメータ**:
```json
{
  "sessionIdType": "customKey",
  "sessionKey": "{{ $workflow.id }}_{{ $execution.id }}_step{{ $node.position }}",
  "contextWindowLength": 10
}
```

**Session Key設計**:
- Step1: Memoryなし（並列チャンク処理のため）
- `step2_memory`: Step2用（議題抽出、全体文脈が必要）
- Step3: Memoryなし（並列議題処理のため）
- `step4_memory`: Step4用（フォーマット変換）
- `step5_memory`: Step5用（品質保証）

**並列処理とMemoryの関係**:
- **並列処理**: 各タスクが独立している場合、Memoryは共有されない
- **文脈確保**:
  - チャンク処理: 前後3チャンクのオーバーラップテキストを含める
  - 議題処理: 該当する全文字起こしを入力として渡す

**注意事項**:
- ⚠️ **queue mode使用時**: Postgres Chat Memoryへの切り替えが必要
- ⚠️ **ワークフロー再起動**: メモリ内容が消失します
- ⚠️ **並列処理**: Split in Batchesで並列実行時、各バッチ間でMemoryは共有されません

### Postgres Chat Memory（本番環境移行時）

**移行タイミング**:
- queue modeを有効化する場合
- 会話履歴の永続化が必要になった場合
- 複数ワークフローで会話履歴を共有する場合

**ノード情報**:
- **nodeType**: `@n8n/n8n-nodes-langchain.memoryPostgresChat`
- **displayName**: Postgres Chat Memory

**必要な準備**:
1. PostgreSQLデータベースの準備
2. n8nにPostgres認証情報を登録
3. Session Keyの設計変更

---

## 🔑 認証情報セットアップ

### 必要な環境変数

Railway環境変数に以下を設定してください：

```bash
# Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Deepgram API（既存）
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Google Drive（既存、OAuth2）
# n8nのCredentials画面で設定
```

### API Key取得手順

#### 1. Google Gemini API Key

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. 「Get API Key」をクリック
4. 「Create API Key」を選択
5. 生成されたAPI Keyをコピー
6. Railwayの環境変数 `GOOGLE_API_KEY` に設定

**料金**:
- 無料枠: 月間15リクエスト/分（Flash 2.5）
- 有料: $0.075 / 1M input tokens, $0.30 / 1M output tokens

#### 2. Anthropic Claude API Key

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. アカウント作成またはログイン
3. 「API Keys」セクションに移動
4. 「Create Key」をクリック
5. 生成されたAPI Keyをコピー
6. Railwayの環境変数 `ANTHROPIC_API_KEY` に設定

**料金**:
- Claude Sonnet 4.5: $3.00 / 1M input tokens, $15.00 / 1M output tokens

---

## 📊 コスト試算

### 1時間の会議処理（想定）

**前提**:
- 文字起こしテキスト: 約10,000文字（約7,000トークン）
- 処理回数: 月間20回（週5回想定）

**Gemini Flash 2.5（Step1-3）**:
```
Input: 7,000 tokens × 3 steps × 20回 = 420,000 tokens/月
Output: 2,000 tokens × 3 steps × 20回 = 120,000 tokens/月

月間コスト:
Input: 420,000 × $0.075 / 1,000,000 = $0.03
Output: 120,000 × $0.30 / 1,000,000 = $0.04
合計: $0.07/月
```

**Claude Sonnet 4.5（Step4-5）**:
```
Input: 10,000 tokens × 2 steps × 20回 = 400,000 tokens/月
Output: 3,000 tokens × 2 steps × 20回 = 120,000 tokens/月

月間コスト:
Input: 400,000 × $3.00 / 1,000,000 = $1.20
Output: 120,000 × $15.00 / 1,000,000 = $1.80
合計: $3.00/月
```

**総コスト**: 約 $3.07/月（≈ ¥450/月）

---

## 🔄 処理フロー詳細（並列チャンク処理対応）

### 全体フロー

```
[Deepgram API: 文字起こし]
         ↓
[Code: 20-30チャンクに分割 + オーバーラップ追加]
         ↓
[Split in Batches: チャンク並列処理（5並列）]
         ↓
[AI Agent (Gemini): Step1 - チャンク整形（並列）] ← Memory なし
  - 入力: 1チャンク + 前後3チャンクのオーバーラップ
  - 処理: フィラー除去、箇条書き化
  - 出力: JSON配列（チャンク単位）
         ↓
[Merge: 全チャンク統合 + 重複除去]
         ↓
[AI Agent (Gemini): Step2 - 議題抽出] ← Memory あり
  - 入力: 統合JSON配列（全文字起こし）
  - 処理: 議題グループ化
  - 出力: 議題JSON
         ↓
[Code: 議題ごとに文字起こしを再構成]
         ↓
[Split in Batches: 議題並列処理（3並列）]
         ↓
[AI Agent (Gemini): Step3 - 議題分析（並列）] ← Memory なし
  - 入力: 1議題 + 該当する全文字起こし
  - 処理: 決定事項、宿題、保留事項の抽出
  - 出力: 分析JSON（議題単位）
         ↓
[Merge: 全議題統合]
         ↓
[AI Agent (Claude): Step4 - フォーマット変換] ← Memory あり
  - 入力: 全議題 + 全文字起こし + メタデータ
  - 処理: Markdown議事録生成
  - 出力: Markdown
         ↓
[AI Agent (Claude): Step5 - 品質保証] ← Memory あり
  - 入力: Markdown + 全データ
  - 処理: 完全性検証、補完
  - 出力: 最終Markdown
         ↓
[Google Drive: 保存]
```

### チャンク分割とオーバーラップの仕組み

**目的**: 精度向上と文脈保持の両立

```
元の文字起こし（300行の例）:
├─ Chunk 1: 行1-30   + オーバーラップ（行31-36）
├─ Chunk 2: 行21-50  + オーバーラップ（行16-20, 51-56）
├─ Chunk 3: 行41-70  + オーバーラップ（行36-40, 71-76）
├─ ...
└─ Chunk 10: 行271-300 + オーバーラップ（行266-270）

各チャンクの構造:
{
  "chunk_id": 1,
  "main_text": "行1-30の内容",
  "overlap_before": null,  // Chunk 1は前がない
  "overlap_after": "行31-36の内容",
  "line_range": [1, 30]
}
```

**重複除去のロジック**:
1. 各チャンクの`main_text`のみを抽出
2. `overlap_before`と`overlap_after`は文脈理解用、最終出力には含めない
3. Mergeノードで`line_range`を基準に統合

### 議題ごとのデータ再構成

**目的**: 各議題に該当する全文字起こしを収集

```
Step2の出力（議題JSON）:
[
  {
    "agenda_id": 1,
    "title": "プロジェクト進捗報告",
    "line_ids": [1, 2, 3, 15, 16, 17, 25, 26]
  },
  {
    "agenda_id": 2,
    "title": "次回タスク確認",
    "line_ids": [30, 31, 32, 33, 40, 41]
  }
]

Code Nodeで再構成:
[
  {
    "agenda_id": 1,
    "title": "プロジェクト進捗報告",
    "lines": [
      {"line_id": 1, "content": "...", "timestamp": "00:01:20"},
      {"line_id": 2, "content": "...", "timestamp": "00:01:25"},
      ...
    ],
    "context": {
      "total_lines": 8,
      "duration": "5分30秒"
    }
  },
  {
    "agenda_id": 2,
    "title": "次回タスク確認",
    "lines": [...]
  }
]
```

**Step3への入力**（並列処理）:
- バッチ1: 議題1-3
- バッチ2: 議題4-6
- バッチ3: 議題7-9

各AI Agentは1議題の全データを受け取り、独立して分析を実行します。

## 🔧 n8nでの設定方法

### AI Agent Nodeの基本構成

各AI Agent Nodeは以下のクラスター構造を持ちます：

```
AI Agent Node (Root)
├─ Chat Model (Sub-node)
│   └─ 認証情報を設定
├─ Memory (Sub-node)
│   └─ Session Keyを設定
└─ Tools (Sub-node)
    └─ 必要に応じて追加
```

### Step1: Gemini Flash設定例（並列チャンク処理）

1. **AI Agent Node**を追加
2. **Chat Model**サブノードを接続:
   - ノード選択: `Google Gemini Chat Model`
   - Model: `models/gemini-2.5-flash-exp`
   - Temperature: `0.4`
   - Maximum Number of Tokens: `4000`
3. **Memory**: ❌ 接続しない（並列処理のため）
4. **配置**: Split in Batchesノードの後、Mergeノードの前

### Step2: Gemini Flash設定例（議題抽出）

1. **AI Agent Node**を追加
2. **Chat Model**サブノードを接続:
   - ノード選択: `Google Gemini Chat Model`
   - Model: `models/gemini-2.5-flash-exp`
   - Temperature: `0.4`
   - Maximum Number of Tokens: `4000`
3. **Simple Memory**サブノードを接続:
   - Session Key: `step2_memory`
   - Context Window Length: `10`

### Step3: Gemini Flash設定例（並列議題分析）

1. **AI Agent Node**を追加
2. **Chat Model**サブノードを接続:
   - ノード選択: `Google Gemini Chat Model`
   - Model: `models/gemini-2.5-flash-exp`
   - Temperature: `0.4`
   - Maximum Number of Tokens: `4000`
3. **Memory**: ❌ 接続しない（並列処理のため）
4. **配置**: Split in Batchesノードの後、Mergeノードの前

### Step4-5: Claude Sonnet設定例（フォーマット変換・品質保証）

1. **AI Agent Node**を追加
2. **Chat Model**サブノードを接続:
   - ノード選択: `Anthropic Chat Model`
   - Model: `claude-sonnet-4-5-20250929`
   - Temperature: `0.7`
   - Maximum Number of Tokens: `8000`
3. **Simple Memory**サブノードを接続:
   - Session Key: `step4_memory`（Step5は`step5_memory`）
   - Context Window Length: `10`

---

## ✅ 設定確認チェックリスト

### 認証情報

- [ ] Google Gemini API Keyを取得済み
- [ ] Anthropic Claude API Keyを取得済み
- [ ] Railwayの環境変数に `GOOGLE_API_KEY` を設定済み
- [ ] Railwayの環境変数に `ANTHROPIC_API_KEY` を設定済み
- [ ] n8nでGoogle Drive認証情報を設定済み（既存）
- [ ] n8nでDeepgram API認証情報を設定済み（既存）

### ノード設定

- [ ] Step1-3でGoogle Gemini Chat Modelを使用
- [ ] Step4-5でAnthropic Chat Modelを使用
- [ ] 各AI AgentにSimple Memoryを接続
- [ ] Session Keyが各ステップで一意に設定されている
- [ ] temperatureとmaxTokensが推奨値に設定されている

### 動作確認

- [ ] Step1のAI Agentが正常に動作する
- [ ] Step2のAI Agentが正常に動作する
- [ ] Step3のAI Agentが正常に動作する
- [ ] Step4のAI Agentが正常に動作する
- [ ] Step5のAI Agentが正常に動作する
- [ ] 全ステップのデータフローが正しく接続されている

---

## 📚 参考資料

### 公式ドキュメント

- [n8n AI Agent Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [n8n Memory Nodes](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memorybufferwindow/)

### ナレッジドキュメント

詳細な実装方法とトラブルシューティングは以下を参照：
- `ナレッジ - n8nワークフロー自動設計（AI-agent）.md`
- `ナレッジ - n8nワークフロー自動設計（n8n-MCP）.md`

---

## 🚀 次のステップ

Step000が完了しました。次は **Step010: 業務理解フェーズ** に進みます。

Step010では、業務要件定義書の内容を詳細にヒアリングし、n8nワークフロー設計に必要な情報を整理します。

**準備完了**: この設定で Step010 以降のワークフロー設計を進めてください。
