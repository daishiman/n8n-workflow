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

**Pattern 5: Feedback Loop Patterns**（反復処理・品質向上時）

フィードバックループは、処理結果を評価し、基準を満たすまで処理を繰り返すパターンです。AI品質判定、回数制御、スコアベース判定など、様々な制御構造を組み合わせて実装します。

**Pattern 5-1: AI品質判定ループ**（AI評価による反復）
```
AI処理結果を評価し、品質基準を満たすまでループ

[入力データ] → [Counter: iteration=0]
    ↓
[AI Agent: コンテンツ生成]
    ↓
[AI Agent: 品質評価] → スコア算出（0-100点）
    ↓
[IF: スコア判定]
    ├─ ≥80点 → [Set: 結果確定] → 次処理
    └─ <80点 → [IF: 再試行チェック]
                  ├─ iteration < 5 → [Counter: +1] → [AI Agent: コンテンツ生成]（ループ）
                  └─ iteration ≥ 5 → [Set: ベスト結果採用] → 次処理

実装パラメータ:
- 品質閾値: 80点（AI Agentのoutput.scoreで評価）
- 最大反復: 5回
- Expression: `={{ $json.score >= 80 }}`（品質判定）
- Expression: `={{ $json.iteration < 5 }}`（回数判定）
```

**Pattern 5-2: 回数指定ループ**（固定回数の反復処理）
```
指定回数だけ処理を繰り返す単純ループ

[Set: counter=0, maxIterations=10]
    ↓
[Loop Start]
    ↓
[処理実行: データ加工]
    ↓
[Set: counter += 1, results.push(output)]
    ↓
[IF: ループ継続判定]
    ├─ counter < maxIterations → [Loop Start]（ループ）
    └─ counter ≥ maxIterations → [Merge: 結果集約] → 次処理

実装パラメータ:
- Expression: `={{ $json.counter < $json.maxIterations }}`
- ループカウンタをSet Nodeで管理
```

**Pattern 5-3: スコアベース品質ループ**（複数条件による判定）
```
複数の品質指標を評価し、すべてが基準を満たすまでループ

[入力データ] → [Set: attempt=0]
    ↓
[AI Agent: コンテンツ生成]
    ↓
[Code: 品質スコア算出]
    → readability_score（0-100）
    → accuracy_score（0-100）
    → completeness_score（0-100）
    ↓
[IF: 複合品質判定]
    条件: readability ≥ 75 AND accuracy ≥ 80 AND completeness ≥ 85
    ├─ 合格 → [Set: 最終出力] → 次処理
    └─ 不合格 → [Switch: 改善戦略分岐]
                  ├─ readability不足 → [Set: プロンプト調整A] → ループ
                  ├─ accuracy不足 → [Set: プロンプト調整B] → ループ
                  ├─ completeness不足 → [Set: プロンプト調整C] → ループ
                  └─ attempt ≥ 5 → [Set: ベスト結果] → 次処理

実装パラメータ:
- Expression: `={{ $json.readability >= 75 && $json.accuracy >= 80 && $json.completeness >= 85 }}`
- 改善戦略をSwitch Nodeで分岐
```

**Pattern 5-4: IF条件分岐ループ**（条件に基づく動的フロー）
```
IF文による条件分岐とループ制御の組み合わせ

[入力データ]
    ↓
[Set: retryCount=0, maxRetries=3]
    ↓
[処理実行: API呼び出し]
    ↓
[IF: 成功判定]
    ├─ response.status === 200 → [Set: 成功結果] → 次処理
    └─ response.status !== 200 → [IF: リトライ判定]
                                    ├─ retryCount < maxRetries → [Wait: 2秒]
                                    │                             ↓
                                    │                          [Set: retryCount += 1]
                                    │                             ↓
                                    │                          [処理実行]（ループ）
                                    └─ retryCount ≥ maxRetries → [Error Trigger]

実装パラメータ:
- IF条件: `={{ $json.response.status === 200 }}`
- リトライ条件: `={{ $json.retryCount < $json.maxRetries }}`
- Wait Node: 2000ms（指数バックオフも可能）
```

**Pattern 5-5: Switch多分岐ループ**（複数ケースによる分岐制御）
```
Switch文による多方向分岐とループ制御

[AI Agent: カテゴリ分類] → category（A/B/C/D）
    ↓
[Switch: カテゴリ別処理]
    ├─ Case A: 簡易処理 → [Set: 結果A] → 次処理
    ├─ Case B: 中等処理 → [AI Agent: 詳細生成]
    │                      ↓
    │                   [IF: 品質チェック]
    │                      ├─ 合格 → 次処理
    │                      └─ 不合格 → [Switch: カテゴリ別処理]（ループ）
    ├─ Case C: 複雑処理 → [Batch Processing: 分割処理]
    │                      ↓
    │                   [Loop Over Items]
    │                      ↓
    │                   [IF: 各アイテム検証]
    │                      ├─ 全合格 → 次処理
    │                      └─ 一部不合格 → [Switch]（ループ）
    └─ Default: 未分類 → [AI Agent: 再分類] → [Switch]（ループ）

実装パラメータ:
- Switch Mode: "Expression"
- Expression: `={{ $json.category }}`
- 各Caseで異なるフロー + ループ条件
```

**Pattern 5-6: 複合制御フローループ**（While/For/Do-Whileの疑似実装）
```
プログラミング言語の制御構造をn8nで再現

【While風ループ】
[Set: condition=true, counter=0]
    ↓
[IF: While条件チェック（前判定）]
    ├─ condition === true → [処理実行]
    │                         ↓
    │                      [Code: 条件更新]
    │                         ↓
    │                      [IF: While条件]（ループ）
    └─ condition === false → 次処理

【Do-While風ループ】
[処理実行]（必ず1回実行）
    ↓
[Code: 条件評価]
    ↓
[IF: Do-While条件チェック（後判定）]
    ├─ condition === true → [処理実行]（ループ）
    └─ condition === false → 次処理

【For風ループ（配列反復）】
[Set: items=[...], index=0]
    ↓
[IF: For条件（index < items.length）]
    ├─ true → [Code: items[index]を処理]
    │          ↓
    │       [Set: index += 1]
    │          ↓
    │       [IF: For条件]（ループ）
    └─ false → 次処理

【Break/Continue風制御】
[Loop処理]
    ↓
[IF: Break条件]
    ├─ true → 次処理（ループ脱出）
    └─ false → [IF: Continue条件]
                  ├─ true → [Loop処理]（スキップしてループ継続）
                  └─ false → [通常処理] → [Loop処理]（ループ継続）

実装パラメータ:
- While: `={{ $json.condition === true }}`
- For: `={{ $json.index < $json.items.length }}`
- Break: 特定条件で次処理へ直接接続
- Continue: IFのtrueパスをループ開始に接続
```

**Pattern 5統合設計ガイドライン**:

1. **ループカウンタ管理**: 必ずSet Nodeでカウンタ初期化・更新
2. **無限ループ防止**: 最大反復回数（maxIterations）を必ず設定
3. **終了条件の明確化**: IF/Switch Nodeで明示的な終了条件を定義
4. **状態管理**: ループ内で状態変数（score, attempt, condition）を追跡
5. **エラー処理**: 最大反復到達時のフォールバック処理を実装
6. **パフォーマンス考慮**: Wait Nodeで適切な遅延を設定（APIレート制限対策）
7. **デバッグ支援**: 各ループでSticky Noteにカウンタ・スコアをログ記録

**適用例**:
- ドキュメント生成でAI品質が不安定 → Pattern 5-1（品質判定ループ）
- データ処理を10回繰り返す → Pattern 5-2（回数指定ループ）
- 複数指標で評価 → Pattern 5-3（スコアベースループ）
- API呼び出しリトライ → Pattern 5-4（IF条件分岐ループ）
- カテゴリ別処理 + ループ → Pattern 5-5（Switch多分岐ループ）
- 複雑な制御フロー → Pattern 5-6（複合制御ループ）

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
| Feedback Loop Patterns | AI生成品質を反復改善 | Group 4 | 出力品質向上、基準達成 |

**パターン適用計画**:

**Pattern 1: Error-First Design**
- Group 1-4の各ノードにError Triggerを接続
- Error Group 1-3で種類別ハンドリング

**Pattern 2: AI Agent with Tool Workflow**
- AI Agent（Group 3）にTool Workflow 1個を接続
- Tool Workflow: データベース検索（ユーザー情報取得）

**Pattern 5: Feedback Loop Patterns**（適用時のみ記載）
- 適用パターン: Pattern 5-1（AI品質判定ループ）
- 適用箇所: Group 4（コンテンツ生成グループ）
- ループ条件: スコア ≥ 80点または反復回数 ≥ 5回
- 最大反復: 5回
- 品質評価: AI Agent（品質評価専用）でスコア算出
- フォールバック: 最大反復時はベスト結果を採用
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
| sticky_1 | n8n-nodes-base.stickyNote | ログ: 受信完了 | 1 | content: "## Group 1: データ受信\\n\\n### ノードブロック\\n```nodes\\n- webhook_1 (webhook / webhook_1)\\n- set_1 (set / set_1)\\n- if_1 (if / if_1)\\n- code_1 (code / code_1)\\n```\\n\\n処理完了", height: 320, width: 480 | - | グループ1のログ・説明 | - |

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

## 処理手順4: ノード配置設計（視覚的整列配置）

- 目的: 各ノードの座標（position）を設計し、視認性を最適化する（画像のような綺麗な構成を実現）
- 背景: ノード重複・配置の乱れは可読性を著しく低下させる。グループごとの整列配置により視覚的に明確な構成を実現する
- エージェント名: UIデザイナー
- 役割: 視認性を最大化する配置設計
- 責務: ノード座標設計表の作成
- 処理詳細手順:
  1. **グループ整列パターンの選定**（Step170で詳細化）:
     - **横一列配置**: ノード間隔300px、同一Y座標
       - 適用: 全体フローSticky Note、シーケンシャルフロー
     - **縦一列配置**: ノード間隔180px、同一X座標
       - 適用: AI処理グループ、エラー処理グループ
     - **グリッド配置**: 水平300px、垂直180px
       - 適用: 複雑なグループ（並列処理 + 後続処理）

  2. **グループ間分離戦略**の決定:
     - **水平分離**: グループ間隔500px（左から右へ配置）
     - **垂直分離**: グループ間隔500px（上から下へ配置）
     - **ハイブリッド分離**: 水平・垂直組み合わせ（2×2グリッド等）

  3. グループ単位で配置設計:
     - **全体フロー**: (100, 50) - 横長Sticky Noteで全体像を表示
     - **Group 1**: (100, 400) - 縦一列配置、色2（薄緑）
     - **Group 2**: (600, 400) - 縦一列配置、色3（薄青）
     - **Group 3**: (100, 900) - 縦一列配置、色4（薄紫）
     - **Group 4**: (600, 900) - 縦一列配置、色6（薄オレンジ）
     - **Error Group 1**: (1100, 400) - 縦一列配置、色5（薄赤）

  4. **Sticky Note配置ルール**:
     - 各グループの左上に配置（グループ基準座標から左50px、上50px）
     - グループ全体を包含するサイズに自動調整（calculateStickyDimensionsで算出）
     - 色はグループの役割に応じて自動選択（selectGroupColorで決定）

  5. 座標計算表を作成（グループ配置マトリックス）

- 評価・判断基準:
  - すべてのノードが75px以上の間隔で配置されていること
  - 階層化が明確であること
  - ノード重複がゼロであること
- 出力テンプレート:
```markdown
### ノード配置設計

#### 配置ルール（視覚的整列配置）
- **グループ整列パターン**: 縦一列配置（画像のような構成）
- **ノード間隔（グループ内）**: 垂直180px、水平0px（同一X座標）
- **グループ間隔**: 水平500px、垂直500px
- **全体フローSticky Note**: (100, 50) - 横長配置、色7（薄ピンク）
- **Sticky Noteマージン**: 左50px、上50px、右50px、下50px

#### グループ配置マトリックス

| グループID | 整列パターン | 基準座標(X, Y) | Sticky Note座標 | 色 | 役割 |
|-----------|------------|----------------|----------------|-----|------|
| 全体フロー | 横一列 | (100, 100) | (100, 50) | 7 | ワークフロー全体像 |
| G001 | 縦一列 | (100, 400) | (50, 350) | 2 | データ受信・初期化 |
| E001 | 縦一列 | (1100, 400) | (1050, 350) | 5 | 入力エラー処理 |

#### Group 1: データ受信・初期化（縦一列配置）

| ノードID | X座標 | Y座標 | 配置理由 |
|---------|------|------|---------|
| webhook_1 | 100 | 400 | グループ開始ノード（基準座標） |
| set_1 | 100 | 580 | webhook_1の180px下（縦一列） |
| if_1 | 100 | 760 | set_1の180px下（縦一列） |
| code_1 | 100 | 940 | if_1の180px下（縦一列） |
| sticky_1 | 50 | 350 | グループ左上、基準座標から左50px・上50px |

**Sticky Noteサイズ**: width=520px, height=650px（calculateStickyDimensionsで算出）
**Sticky Note色**: 2（薄緑） - データ収集・入力グループ

#### Error Group 1: 入力エラー（縦一列配置）

| ノードID | X座標 | Y座標 | 配置理由 |
|---------|------|------|---------|
| error_trigger_1 | 1100 | 400 | エラーフロー開始（右側に分離） |
| if_error_1 | 1100 | 580 | error_trigger_1の180px下（縦一列） |
| slack_error_1 | 1100 | 760 | if_error_1の180px下（縦一列） |
| sticky_error_1 | 1050 | 350 | エラーグループ左上、基準座標から左50px・上50px |

**Sticky Noteサイズ**: width=500px, height=480px（calculateStickyDimensionsで算出）
**Sticky Note色**: 5（薄赤） - エラーフロー固定

#### 配置検証
- グループ整列パターン: すべて縦一列配置 ✅
- グループ間の最小間隔: 1000px（水平分離）✅
- ノード間隔（グループ内）: 180px（垂直）✅
- Sticky Note包含: すべてのノードが包含範囲内 ✅
- 色の多様性: 3色使用（7, 2, 5） ✅
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
     # 【グループ[N]: [グループ名]}

     ## このグループに含まれるノード
     📌 **[ノード表示名1]** ([ノードタイプ1])
     📌 **[ノード表示名2]** ([ノードタイプ2])

     ## ノードブロック（視覚リンク）
     > ### [ノード表示名1] ([ノードタイプ1])
     > - 役割: [役割]
     > - 入力: [入力データ]
     > - 出力: [出力データ]

     ## 目的
     [グループの役割]

     ## 背景
     [なぜこのグループが必要か]

     ## グループ内フロー
     1. [処理1]
     2. [処理2]
     3. [処理3]

     ## フロー再現ガイド
     1. [ノード配置の指示]
     2. [接続の指示]

     ## 入力 / 出力
     - 入力: [前グループからの入力データ]
     - 出力: [次グループへの出力データ]

     ## パフォーマンス
     - 推定処理時間: [X]秒
     - 推定トークン: [Y] tokens（AI使用時）

     ## エラー処理
     Error Group [N]へ接続
     ```
  2. Sticky Noteの色分け:
     - メインフローグループ: 色6（薄オレンジ）。color=0/1（白/黄）は使用禁止
     - エラーフローグループ: 色5（薄赤）で視認性を確保
  3. サイズ: 最小 width=520px / height=420px。ノード数とMarkdown文字数に応じて `calculateStickyDimensions()`（Step180参照）で自動算出し、全文がスクロールなしで読めるようにする。

- 評価・判断基準:
  - すべてのSticky Noteに `nodes` ブロックでノード名/タイプ/Node IDが含まれていること
  - 責務・処理内容が明確であること
- 出力テンプレート:
```markdown
### Sticky Note設計

#### Sticky Note 1（Group 1: データ受信・初期化）

**ノードID**: `sticky_1`
**position**: [650, 200]
**サイズ**: width=520, height=420（calculateStickyDimensionsで算出）
**背景色**: 6（薄オレンジ / color=0/1禁止）

**コンテンツ**:
```
## Group 1: データ受信・初期化

### ノードブロック
```nodes
- webhook_1: 議事録受信 (n8n-nodes-base.webhook / webhook_1)
- set_1: 初期化 (n8n-nodes-base.set / set_1)
- if_1: 必須チェック (n8n-nodes-base.if / if_1)
- code_1: テキスト前処理 (n8n-nodes-base.code / code_1)
```

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
**サイズ**: width=460, height=300（calculateStickyDimensionsで算出）
**背景色**: 5（薄赤 / color=0禁止）

**コンテンツ**:
```
## Error Group 1: 入力エラー

### ノードブロック
```nodes
- error_trigger_1: 入力エラー検知 (n8n-nodes-base.errorTrigger / error_trigger_1)
- if_error_1: エラー種類判定 (n8n-nodes-base.if / if_error_1)
- slack_error_1: エラー通知 (n8n-nodes-base.slack / slack_error_1)
- respond_error_1: エラーレスポンス (n8n-nodes-base.respondToWebhook / respond_error_1)
```

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
5. Feedback Loop Patterns（反復処理・品質向上時）
   - 5-1: AI品質判定ループ
   - 5-2: 回数指定ループ
   - 5-3: スコアベース品質ループ
   - 5-4: IF条件分岐ループ
   - 5-5: Switch多分岐ループ
   - 5-6: 複合制御フローループ

**ワークフロー特性から推奨パターン**: [自動表示]

このパターン適用で進めてよろしいですか？

（選択肢）
1. 推奨パターンで進める
2. パターンを追加/削除する
3. パターンを確認してから決定する」
