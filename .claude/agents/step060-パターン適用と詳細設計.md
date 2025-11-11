# 目的

n8nのベストプラクティスパターンを適用し、ノード配置・Expression設計・詳細パラメータを含む完全な詳細設計書を作成する。Step070以降のJSON生成の直接の基礎となる最終設計フェーズ。

# 背景

ここまでの設計（業務要件、AI設定、技術要件、グループ化、AI責務）を統合し、n8nの実装パターンを適用することで、実装品質を向上させる。Error-First Design、AI Agent with Tool Workflow、Batch Processing、Conditional Routingなどのパターンを適用する。

# 言葉の定義

- **ベストプラクティスパターン**: n8nで実証済みの効果的な実装パターン
- **Error-First Design**: すべてのノードにエラーハンドリングを組み込む設計
- **AI Agent with Tool Workflow**: AI Agentに外部ツールを接続する設計
- **Batch Processing**: 大量データを分割処理する設計（Split In Batches使用）
- **Conditional Routing**: AI判断に基づく動的ルーティング設計
- **Expression設計**: n8nの動的データアクセス構文（`{{ $json.fieldName }}`）の設計
- **ノード配置設計**: 各ノードのposition（x, y座標）の設計
- **Sticky Note設計**: グループ説明・ログ記録用ノードの配置とコンテンツ設計

# 制約

- 出力制約: 詳細設計書を出力後、ユーザーに確認を求め、承認後にStep070へ進む
- パターン適用必須: 少なくとも1つのベストプラクティスパターンを適用すること
- Expression完全性必須: すべての動的データアクセスをExpression形式で定義すること
- ノード配置最適化必須: ノード間隔75px以上、階層化された配置設計
- Sticky Note必須: 各グループに1つ、ノード名リストを含むSticky Noteを配置すること
- n8n-MCP検証必須: すべてのノード設定をn8n-MCPで検証すること
- 出力ディレクトリ: `./{業務目的}/step060_パターン適用/` に成果物を格納すること

# 処理手順

## 処理手順の全体フロー

```
開始（Step010-050の全成果物）
  ↓
1. 適用パターンの選定
  ↓
2. ノードリスト詳細設計
  ↓
3. Expression設計
  ↓
4. ノード配置設計
  ↓
5. Sticky Note設計
  ↓
6. n8n-MCP検証
  ↓
7. 詳細設計書の作成
  ↓
完了（Step070へ）
```

## 処理手順1: 適用パターンの選定

- 目的: ワークフローの特性に応じたベストプラクティスパターンを選定する
- 背景: パターン適用により、実装品質・保守性・信頼性が向上する
- エージェント名: n8nアーキテクト
- 役割: 適用すべきパターンを特定し、設計に組み込む
- 責務: パターン適用計画の作成
- 処理詳細手順:
  1. ワークフローの特性を分析
  2. 適用可能なパターンをリストアップ:

**Pattern 1: Error-First Design**（必須）
```
すべてのノードにエラーハンドリングを組み込む

実装:
[任意のノード] → (エラー発生) → [Error Trigger]
                                    ↓
                                [IF: エラー種類判定]
                                    ↓
                ┌─────────────────┼─────────────────┐
                ↓                 ↓                 ↓
        [リトライ可能]      [通知必要]        [無視可能]
                ↓                 ↓                 ↓
        [Wait] → [再実行]   [Slack通知]      [ログ記録]
```

**Pattern 2: AI Agent with Sub-Nodes and Tools**（AI使用時必須）

AI Agentノードは、Chat Model、Memory、Toolsといったサブノードと連携して動作します。このパターンでは、AI Agentノードとそれらのサブノードを一体として設計し、接続まで含めて定義します。

**構造図**:
```
┌───────────────────────┐
│ Chat Model            │
│ (e.g., lmChatOpenAi)  │
└───────────┬───────────┘
            │ ai_languageModel (必須)
┌───────────▼───────────┐
│ AI Agent              │
│ (@n8n/n8n-nodes-      │
│  langchain.agent)     │
└───────────┬───────────┘
            │─────────────────────────┐
┌───────────┴───────────┐ ┌───────────┴───────────┐
│           │           │ │           │           │
│ ai_memory │           │ │           │ ai_tool   │
┌───────────▼───────────┐ ┌───────────▼───────────┐
│ Memory                │ │ Tool(s)               │
│ (e.g., memoryBuffer)  │ │ (e.g., toolCalculator)│
└───────────────────────┘ └───────────────────────┘
```

**🔴 必須ノードタイプと接続構造**: AI処理を行う場合、**必ず**以下の完全なJSON構造を使用します。

```json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "あなたは親切なアシスタントです。ユーザーの質問に答え、必要に応じてツールを使用してください。",
        "options": {
          "systemMessage": "あなたは日本語で応答する親切なAIアシスタントです。",
          "maxIterations": 10
        }
      },
      "id": "ai_agent_main",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [1040, 480]
    },
    {
      "parameters": {
        "model": "gpt-4o",
        "options": {
          "temperature": 0.7
        }
      },
      "id": "lm_chat_model",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "position": [800, 360],
      "credentials": {
        "openAiApi": {
          "id": "YOUR_CREDENTIAL_ID",
          "name": "YOUR_CREDENTIAL_NAME"
        }
      }
    },
    {
      "parameters": {
        "sessionKey": "={{ $json.sessionId }}",
        "contextWindowLength": 10
      },
      "id": "memory_buffer_window",
      "name": "Simple Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [800, 480]
    },
    {
      "parameters": {
        "description": "Googleカレンダーにイベントを登録します",
        "source": "database",
        "workflowId": "123"
      },
      "id": "tool_calendar",
      "name": "Calendar Tool",
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 1.1,
      "position": [800, 600]
    }
  ],
  "connections": {
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          {
            "node": "AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "Calendar Tool": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**禁止事項**:
- ❌ `n8n-nodes-base.httpRequest` でGemini/Claude APIを直接呼び出し
- ❌ `n8n-nodes-base.code` でLLM SDKを使用
- ❌ カスタムノードでの独自実装

**Pattern 3: Batch Processing with Token Optimization**（大量データ時）
```
大量データを分割処理してトークン消費を最適化

[Split In Batches: 10 items]
    ↓
[Loop Over Items]
    ↓
[AI Agent: バッチ処理]
    ↓
[Merge: 結果集約]
    ↓
[Set: 最終出力]

各バッチ: 5-15ノード、推定2000トークン
```

**Pattern 4: Conditional Routing with AI Decision**（AI判断分岐時）
```
AI判断に基づく動的ルーティング

[AI Agent: 分類判断]
    ↓
[Switch: カテゴリ別ルーティング]
    ├─ Case A: 緊急 → [Slack即時通知]
    ├─ Case B: 通常 → [Database保存]
    └─ Case C: 低優先度 → [Queue追加]
```

  3. 選定したパターンの適用箇所を明記

- 評価・判断基準:
  - 少なくとも Error-First Design が適用されていること
  - AI使用時は Pattern 2 が適用されていること
  - パターン適用箇所が明確であること
- 出力テンプレート:
```markdown
### 適用パターンの選定

| パターン名 | 適用理由 | 適用箇所 | 効果 |
|-----------|---------|---------|------|
| Error-First Design | すべてのワークフローで必須 | 全グループ | 信頼性向上、エラー通知 |
| AI Agent with Tool Workflow | AI処理でデータベース検索が必要 | Group 3 | AI精度向上、外部連携 |

**パターン適用計画**:

**Pattern 1: Error-First Design**
- Group 1-4の各ノードにError Triggerを接続
- Error Group 1-3で種類別ハンドリング

**Pattern 2: AI Agent with Tool Workflow**
- AI Agent（Group 3）にTool Workflow 1個を接続
- Tool Workflow: データベース検索（ユーザー情報取得）
```

## 処理手順2: ノードリスト詳細設計

- 目的: 各グループの全ノードを詳細に設計する
- 背景: Step070のJSON生成の直接の基礎となる
- エージェント名: n8n実装エンジニア
- 役割: ノード単位で詳細パラメータを設計する
- 責務: ノード詳細設計表の作成
- 処理詳細手順:
  1. Step040のグループ構成表を確認
  2. 各グループのノードを詳細設計:
     - ノードID（例: `webhook_1`、`ai_agent_main`）
     - ノードタイプ（例: `n8n-nodes-base.webhook`）
     - ノード名（例: 「議事録受信」）
     - typeVersion（n8n-MCPで確認）
     - パラメータ（必須・推奨すべて）
     - 接続先（次のノードID）
     - コメント（`_comment`フィールド内容）
     - ノート（`notes`フィールド内容）
  3. n8n-MCPで各ノードを検証:
     ```
     validate_node_minimal({nodeType: "n8n-nodes-base.webhook", config: {...}})
     ```
  4. ノードリスト詳細設計表を作成

- 評価・判断基準:
  - すべてのノードが詳細設計されていること
  - パラメータがデフォルト値に依存していないこと
  - n8n-MCPで検証済みであること
- 出力テンプレート:
```markdown
### ノードリスト詳細設計（Group 1: データ受信・初期化）

| ノードID | ノードタイプ | ノード名 | typeVersion | パラメータ | 接続先 | コメント | ノート |
|---------|------------|---------|------------|-----------|-------|---------|-------|
| webhook_1 | n8n-nodes-base.webhook | 議事録受信 | 1 | path: "receive-minutes", method: "POST", responseMode: "responseNode", authentication: "headerAuth" | set_1 | Webhook経由でGoogle Meetの議事録JSON受信 | 認証ヘッダー: X-API-Key |
| set_1 | n8n-nodes-base.set | 初期化 | 1 | values: {meetingData.title, meetingData.transcript, meetingData.timestamp} | if_1 | meetingDataオブジェクト作成 | timestampはDate.now()で生成 |
| if_1 | n8n-nodes-base.if | 必須チェック | 1 | conditions: [{value1: "={{ $json.meetingData.title }}", operation: "isNotEmpty"}] | code_1 (true), error_trigger_1 (false) | title必須フィールド確認 | 空の場合はエラーフローへ |
| code_1 | n8n-nodes-base.code | テキスト前処理 | 1 | jsCode: "transcript.replace(/\\[\\d{2}:\\d{2}\\]/g, '').trim()" | sticky_1 | タイムスタンプ削除、整形 | 不要な文字を削除 |
| sticky_1 | n8n-nodes-base.stickyNote | ログ: 受信完了 | 1 | content: "## Group 1: データ受信\\n\\n📌 **このグループに含まれるノード**:\\n- webhook_1\\n- set_1\\n- if_1\\n- code_1\\n\\n処理完了", height: 200, width: 300 | - | グループ1のログ・説明 | - |

**n8n-MCP検証結果**:
- webhook_1: ✅ validate_node_minimal 成功
- set_1: ✅ validate_node_minimal 成功
- if_1: ✅ validate_node_minimal 成功
- code_1: ✅ validate_node_minimal 成功
```

## 処理手順3: Expression設計

- 目的: すべての動的データアクセスをn8n Expression形式で設計する
- 背景: Expression設計の誤りはワークフロー失敗の主要原因
- エージェント名: n8nデータエンジニア
- 役割: データフローを追跡し、正確なExpressionを設計する
- 責務: Expression設計表の作成
- 処理詳細手順:
  1. 各ノードの入力データを追跡
  2. Expression構文を設計:
     - 基本形式: `={{ $json.fieldName }}`
     - 配列アクセス: `={{ $json.items[0].field }}`
     - 前ノード参照: `={{ $('ノード名').item.json.field }}`
     - 関数使用: `={{ $json.text.toLowerCase() }}`
  3. Expression一覧表を作成
  4. テストケースを設計

- 評価・判断基準:
  - すべての動的データアクセスがExpression形式であること
  - Expression構文が正しいこと
- 出力テンプレート:
```markdown
### Expression設計

| ノードID | フィールド | Expression | データソース | 説明 |
|---------|----------|-----------|------------|------|
| set_1 | meetingData.title | `={{ $json.body.title }}` | webhook_1の出力 | Webhook Bodyからtitleを抽出 |
| set_1 | meetingData.transcript | `={{ $json.body.transcript }}` | webhook_1の出力 | Webhook Bodyからtranscriptを抽出 |
| set_1 | meetingData.timestamp | `={{ Date.now() }}` | システム関数 | 現在時刻のUNIXタイムスタンプ |
| if_1 | conditions[0].value1 | `={{ $json.meetingData.title }}` | set_1の出力 | titleの存在確認 |
| code_1 | jsCode内 | `items[0].json.meetingData.transcript` | if_1の出力 | Code Node内でのアクセス |
| ai_agent_1 | text（System Prompt） | `={{ $json.systemPrompt }}` | 前処理の出力 | AI Agentへのプロンプト渡し |
| slack_1 | text | `={{ $json.summary }}` | ai_agent_1の出力 | AI生成要約をSlackに投稿 |

**テストケース**:

**入力データ（webhook_1）**:
```json
{
  "body": {
    "title": "2025年Q1営業戦略会議",
    "transcript": "[00:01] 本日の会議では..."
  }
}
```

**各Expressionの評価結果**:
- `={{ $json.body.title }}` → "2025年Q1営業戦略会議"
- `={{ Date.now() }}` → 1699999999999
- `={{ $json.meetingData.title }}` → "2025年Q1営業戦略会議"
```

## 処理手順4: ノード配置設計

- 目的: 各ノードの座標（position）を設計し、視認性を最適化する
- 背景: ノード重複・配置の乱れは可読性を著しく低下させる
- エージェント名: UIデザイナー
- 役割: 視認性を最大化する配置設計
- 責務: ノード座標設計表の作成
- 処理詳細手順:
  1. 配置ルールを適用:
     - **水平間隔**: 最低75px、推奨100-125px
     - **垂直間隔**: 最低60px、推奨75-100px
     - **階層化**: 上部（サブノード）、中部（メインフロー）、下部（代替フロー）、最下部（エラーパス）
  2. グループ単位で配置設計:
     - Group 1: x=200から開始、y=300（メインフロー）
     - Group 2: x=1000から開始、y=300
     - Error Group 1: x=200から開始、y=800（メインフロー + 500px）
  3. Sticky Noteは各グループの右上に配置
  4. 座標計算表を作成

- 評価・判断基準:
  - すべてのノードが75px以上の間隔で配置されていること
  - 階層化が明確であること
  - ノード重複がゼロであること
- 出力テンプレート:
```markdown
### ノード配置設計

#### 配置ルール
- 水平間隔: 100px
- 垂直間隔: 75px
- グループ間隔: 400px
- メインフローY座標: 300
- エラーフローY座標: 800

#### Group 1: データ受信・初期化

| ノードID | X座標 | Y座標 | 配置理由 |
|---------|------|------|---------|
| webhook_1 | 200 | 300 | グループ開始ノード |
| set_1 | 300 | 300 | webhook_1の100px右 |
| if_1 | 400 | 300 | set_1の100px右 |
| code_1 | 500 | 300 | if_1の100px右（trueパス） |
| sticky_1 | 650 | 200 | グループ右上、メインフローより100px上 |

#### Error Group 1: 入力エラー

| ノードID | X座標 | Y座標 | 配置理由 |
|---------|------|------|---------|
| error_trigger_1 | 200 | 800 | エラーフロー開始（メインより500px下） |
| if_error_1 | 300 | 800 | error_trigger_1の100px右 |
| slack_error_1 | 400 | 800 | if_error_1の100px右 |
| sticky_error_1 | 550 | 700 | エラーグループ右上 |

#### 配置検証
- 最小水平間隔: 100px ✅
- 最小垂直間隔: 500px（メイン↔エラー） ✅
- ノード重複: 0個 ✅
```

## 処理手順5: Sticky Note設計

- 目的: 各グループのSticky Noteのコンテンツを設計する
- 背景: Sticky NoteはワークフローのドキュメントとログRecordの役割を持つ
- エージェント名: テクニカルライター
- 役割: 分かりやすいSticky Noteコンテンツを作成する
- 責務: Sticky Note設計表の作成
- 処理詳細手順:
  1. 各Sticky Noteに以下を含める:
     ```markdown
     ## Group [N]: [グループ名]

     📌 **このグループに含まれるノード**:
     - [ノード名1]
     - [ノード名2]
     - ...

     **責務**: [グループの役割]

     **処理内容**:
     - [処理1]
     - [処理2]

     **入力**: [前グループからの入力データ]
     **出力**: [次グループへの出力データ]

     **パフォーマンス**:
     - 推定処理時間: [X]秒
     - 推定トークン: [Y] tokens（AI使用時）

     **エラー処理**: Error Group [N]へ接続
     ```
  2. Sticky Noteの色分け:
     - メインフローグループ: 色4（青系）
     - エラーフローグループ: 色3（赤系）
  3. サイズ: width=300px、height=200px

- 評価・判断基準:
  - すべてのSticky Noteにノード名リストが含まれていること
  - 責務・処理内容が明確であること
- 出力テンプレート:
```markdown
### Sticky Note設計

#### Sticky Note 1（Group 1: データ受信・初期化）

**ノードID**: `sticky_1`
**position**: [650, 200]
**サイズ**: width=300, height=200
**背景色**: 4（青系）

**コンテンツ**:
```
## Group 1: データ受信・初期化

📌 **このグループに含まれるノード**:
- webhook_1: 議事録受信
- set_1: 初期化
- if_1: 必須チェック
- code_1: テキスト前処理

**責務**: Webhook経由で議事録データを受信し、初期検証を実行

**処理内容**:
- Webhook経由でPOSTリクエスト受信
- meetingDataオブジェクト初期化
- 必須フィールド（title, transcript）存在確認
- タイムスタンプ付与

**入力**:
```json
{
  "title": "会議タイトル",
  "transcript": "議事録テキスト"
}
```

**出力**:
```json
{
  "meetingData": {
    "title": "...",
    "transcript": "...",
    "timestamp": 1699999999999
  }
}
```

**パフォーマンス**:
- 推定処理時間: 0.5秒

**エラー処理**: Error Group 1へ接続（必須フィールド欠如時）
```
```

#### Sticky Note Error 1（Error Group 1: 入力エラー）

**ノードID**: `sticky_error_1`
**position**: [550, 700]
**サイズ**: width=300, height=200
**背景色**: 3（赤系）

**コンテンツ**:
```
## Error Group 1: 入力エラー

📌 **このグループに含まれるノード**:
- error_trigger_1: 入力エラー検知
- if_error_1: エラー種類判定
- slack_error_1: エラー通知
- respond_error_1: エラーレスポンス

**対象グループ**: Group 1-2

**エラー条件**:
- 必須フィールド欠如（title, transcript）
- データ形式不正

**処理内容**:
1. エラー種類判定
2. Slack #errorsに通知
3. 400 Bad Requestレスポンス返却

**通知先**: Slack #errors
```
```

## 処理手順6: n8n-MCP検証

- 目的: すべてのノード設定をn8n-MCPサーバーで検証する
- 背景: 設計ミス・設定漏れを早期発見するため
- エージェント名: n8n QAエンジニア
- 役割: n8n-MCPを使ってノード設定を検証する
- 責務: 検証レポートの作成
- 処理詳細手順:
  1. 各ノードに対して以下を実行:
     ```
     validate_node_minimal({nodeType: "...", config: {...}})
     validate_node_operation({nodeType: "...", config: {...}, profile: "runtime"})
     ```
  2. 検証結果を記録
  3. エラーがあれば修正してfrom再検証
  4. 全ノード合格するまで繰り返す

- 評価・判断基準:
  - すべてのノードがvalidate_node_minimal合格
  - すべてのノードがvalidate_node_operation合格
- 出力テンプレート:
```markdown
### n8n-MCP検証結果

| ノードID | validate_node_minimal | validate_node_operation | 検証メッセージ |
|---------|---------------------|----------------------|--------------|
| webhook_1 | ✅ 合格 | ✅ 合格 | すべての必須パラメータ設定済み |
| set_1 | ✅ 合格 | ✅ 合格 | values設定済み |
| if_1 | ✅ 合格 | ⚠️ 警告 | conditions配列が1つのみ、複数条件推奨 |
| code_1 | ✅ 合格 | ✅ 合格 | jsCode検証済み |
| ai_agent_1 | ✅ 合格 | ✅ 合格 | Chat Model、Memory設定済み |

**修正事項**:
- if_1: 警告を確認したが、業務要件上1条件で十分なため対応不要
```

## 処理手順7: 詳細設計書の作成

- 目的: 上記すべての情報を統合した詳細設計書を作成する
- 背景: Step070のJSON生成の直接の基礎資料とするため
- エージェント名: テクニカルライター
- 役割: 詳細設計書の完全性・一貫性の担保
- 責務: 詳細設計書の作成
- 処理詳細手順:
  1. 処理手順1-6の成果物を統合
  2. 詳細設計書テンプレートに記入
  3. ユーザー確認用の要約を作成
  4. 次ステップへの引き継ぎ事項を明記
- 評価・判断基準:
  - すべてのノードが詳細設計されていること
  - パターンが適用されていること
  - n8n-MCP検証済みであること
- 出力テンプレート:
```markdown
# 詳細設計書 (Step060)

## ワークフロー名
[Step010で定義したワークフロー名]

## 適用パターン
[処理手順1の出力]

## ノードリスト詳細設計
[処理手順2の出力（全グループ分）]

## Expression設計
[処理手順3の出力]

## ノード配置設計
[処理手順4の出力（全グループ分）]

## Sticky Note設計
[処理手順5の出力（全グループ分）]

## n8n-MCP検証結果
[処理手順6の出力]

## 実装準備完了チェックリスト
- ✅ 全ノード詳細設計完了
- ✅ Expression設計完了
- ✅ ノード配置設計完了
- ✅ Sticky Note設計完了
- ✅ n8n-MCP検証合格
- ✅ パターン適用完了

## 次ステップへの引き継ぎ事項
- 総ノード数: 24ノード
- 総グループ数: メイン4 + エラー3 = 7グループ
- Step070-076で順次JSON生成
- JSON生成順序: Group 1 → Group 2 → Group 3 → Group 4 → Error Group 1 → Error Group 2 → Error Group 3
- 特記事項: [その他重要事項]
```

# 初回質問

「Step010-050の全設計成果物を確認しました。これからベストプラクティスパターンを適用し、詳細設計を行います。

**適用可能なパターン**:
1. Error-First Design（必須）
2. AI Agent with Tool Workflow（AI使用時）
3. Batch Processing（大量データ時）
4. Conditional Routing（分岐処理時）

**ワークフロー特性から推奨パターン**: [自動表示]

このパターン適用で進めてよろしいですか？

（選択肢）
1. 推奨パターンで進める
2. パターンを追加/削除する
3. パターンを確認してから決定する」
