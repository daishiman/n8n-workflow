# 目的

Step060の詳細設計書に基づき、Group [N]のノード群をn8nにインポート可能な完全なJSON形式で生成する。トークン最適化のため、1グループ=5-15ノードに制限し、API安全範囲内で生成する。

# 背景

グループ単位（5-15ノード）でJSON生成を行うことで、トークン消費を最適化し、APIフリーズを防止する。各グループは機能的なまとまりを持ち、独立して生成・検証可能な設計となっている。

# 言葉の定義

- **Group [N]**: 処理するグループ番号（例: Group 1, Group 2, ...）
- **完全JSON**: n8nにインポート可能な、nodes配列とconnectionsオブジェクトを含むJSON
- **トークン最適化**: 1グループ=1500-2000トークンを目標とする設計
- **API安全範囲**: 1リクエストあたり2500トークン以下を維持
- **ノード接続**: connectionsオブジェクトでノード間のデータフローを定義
- **_comment**: ノードの説明フィールド、素人が理解できる説明を記述
- **notes**: ノードのメモフィールド、設定の補足情報を記述

# 制約

- 出力制約: Group [N] JSONを出力後、ユーザーに確認を求め、承認後に次ステップ（配置調整）へ進む
- グループサイズ厳守: 5-15ノード/グループ（Sticky Note含む）
- トークン制限厳守: 1グループ=2500トークン以下
- 完全JSON必須: nodes、connections、すべてのパラメータを含むこと
- デフォルト値禁止: すべてのパラメータを明示的に設定すること
- コメント必須: すべてのノードに`_comment`と`notes`を追加すること
- Sticky Note必須: グループに1つ、ノード名リストを含むSticky Noteを必ず追加すること
- 出力ディレクトリ: `./{業務目的}/step070_Group[N]_JSON/` に成果物を格納すること

# 処理手順

## 処理手順の全体フロー

```
開始（Step060詳細設計書）
  ↓
1. Group [N]の設計情報を抽出
  ↓
2. nodesセクションの生成
  ↓
3. connectionsセクションの生成
  ↓
4. _comment・notesフィールドの追加
  ↓
5. Sticky Noteの追加
  ↓
6. JSON完全性の検証
  ↓
7. Group [N] JSONの出力
  ↓
完了（配置調整ステップへ）
```

## 処理手順1: Group [N]の設計情報を抽出

- 目的: Step060からGroup [N]に関する設計情報をすべて抽出する
- 背景: 設計書の該当グループ部分のみを使用してJSON生成する
- エージェント名: データ抽出スペシャリスト
- 役割: 設計書から必要な情報を正確に抽出する
- 責務: Group [N]設計情報の抽出
- 処理詳細手順:
  1. Step060の詳細設計書を確認
  2. Group [N]のノードリスト詳細設計を抽出
  3. Group [N]のExpression設計を抽出
  4. Group [N]のノード配置設計を抽出
  5. Group [N]のSticky Note設計を抽出
  6. 抽出した情報を整理
- 評価・判断基準:
  - Group [N]のすべてのノード情報が抽出されていること
  - Expression、配置情報が揃っていること
- 出力テンプレート:
```markdown
### Group [N]設計情報

**グループ名**: [グループ名]
**ノード数**: [X]個（Sticky Note含む）
**責務**: [Step040より]

**ノードリスト**:
1. [ノードID]: [ノード名] - [ノードタイプ]
2. [ノードID]: [ノード名] - [ノードタイプ]
...
```

## 処理手順2: nodesセクションの生成

- 目的: Group [N]の全ノードをnodes配列として生成する
- 背景: n8n JSONのnodesセクションを構築する
- エージェント名: JSONジェネレーター
- 役割: ノード定義をJSON形式で生成する
- 責務: nodes配列の完全な生成
- 処理詳細手順:
  1. Step060のノードリスト詳細設計を確認
  2. 各ノードについて、以下の構造でJSONを生成:
     ```json
     {
       "id": "[ノードID]",
       "type": "[ノードタイプ]",
       "name": "[ノード名]",
       "parameters": {
         // Step060の設計通りにパラメータを設定
       },
       "typeVersion": [typeVersion],
       "position": [X, Y],  // Step060の配置設計通り
       "_comment": "[素人が理解できる説明]",
       "notes": "[設定の補足情報]"
     }
     ```

### AI Agent Node生成時の絶対必須要件

**🔴 重要**: AI処理を行う場合、AI Agentノードと必須サブノード（Language Model、Memory、Tools）を**自動的に**生成してください。

  3. AI Agent Node + サブノードの完全構成を生成:

     **a) AI Agent メインノード**:
     ```json
     {
       "id": "ai_agent_main",
       "type": "@n8n/n8n-nodes-langchain.agent",  // ← 必須、これ以外は使用禁止
       "name": "AI Agent: [責務]",
       "parameters": {
         "promptType": "define",
         "text": "={{ $json.chatInput }}",
         "options": {
           "systemMessage": "[Step050で定義したSystem Prompt]",
           "maxIterations": 10
         }
       },
       "typeVersion": 3,
       "position": [X, Y],
       "_comment": "[説明]",
       "notes": "[補足]"
     }
     ```

     **b) Language Model サブノード（必須）**:

     Step020のAI設定書に基づいて、以下のいずれかを生成：

     **Gemini 2.5 Flash用**:
     ```json
     {
       "id": "lm_gemini_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
       "name": "Gemini 2.5 Flash",
       "parameters": {
         "modelName": "gemini-2.5-flash-exp",
         "options": {
           "temperature": 0.4,
           "maxOutputTokens": 4000
         }
       },
       "typeVersion": 1,
       "position": [X-200, Y-100],
       "_comment": "Gemini 2.5 Flash言語モデル",
       "notes": "temperature: 0.4（精度重視）、maxOutputTokens: 4000"
     }
     ```

     **Claude 4.5 Sonnet用**:
     ```json
     {
       "id": "lm_claude_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
       "name": "Claude 4.5 Sonnet",
       "parameters": {
         "model": "claude-4-5-sonnet-20250929",
         "options": {
           "temperature": 0.7,
           "maxTokens": 8000
         }
       },
       "typeVersion": 1,
       "position": [X-200, Y-100],
       "_comment": "Claude 4.5 Sonnet言語モデル",
       "notes": "temperature: 0.7（バランス型）、maxTokens: 8000"
     }
     ```

     **OpenAI GPT-4o用**:
     ```json
     {
       "id": "lm_openai_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
       "name": "OpenAI GPT-5-mini",
       "parameters": {
         "model": "gpt-5-mini",
         "options": {
           "temperature": 0.7,
           "maxTokens": 2000
         }
       },
       "typeVersion": 1,
       "position": [X-200, Y-100],
       "_comment": "OpenAI GPT-4o言語モデル",
       "notes": "temperature: 0.7、maxTokens: 2000"
     }
     ```

     **c) Memory サブノード（推奨）**:

     会話履歴を保持する場合に生成：

     **Simple Memory（開発環境用）**:
     ```json
     {
       "id": "memory_simple_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
       "name": "Simple Memory",
       "parameters": {
         "sessionKey": "={{ $json.sessionId }}",
         "contextWindowLength": 10
       },
       "typeVersion": 1.3,
       "position": [X-200, Y],
       "_comment": "会話履歴を保持（最新10ターン）",
       "notes": "sessionKey: ユーザーIDやセッションIDで識別"
     }
     ```

     **Redis Chat Memory（本番環境用）**:
     ```json
     {
       "id": "memory_redis_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.memoryRedisChat",
       "name": "Redis Chat Memory",
       "parameters": {
         "sessionKey": "={{ $json.sessionId }}",
         "sessionTimeToLive": 3600,
         "contextWindowLength": 10
       },
       "credentials": {
         "redis": "Redis認証情報"
       },
       "typeVersion": 1,
       "position": [X-200, Y],
       "_comment": "Redis経由で会話履歴を永続化",
       "notes": "sessionTimeToLive: 3600秒（1時間）、本番環境推奨"
     }
     ```

     **d) Tool サブノード（任意）**:

     AI Agentが外部ツールを使用する場合に生成：

     **Calculator Tool**:
     ```json
     {
       "id": "tool_calculator_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.toolCalculator",
       "name": "Calculator",
       "parameters": {},
       "typeVersion": 1,
       "position": [X-200, Y+100],
       "_comment": "計算機能を提供",
       "notes": "数値計算や算術演算をAIに提供"
     }
     ```

     **HTTP Request Tool**:
     ```json
     {
       "id": "tool_http_[group_id]",
       "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
       "name": "HTTP Request Tool",
       "parameters": {
         "name": "weather_api",
         "description": "指定された都市の天気情報を取得する",
         "method": "GET",
         "url": "https://api.weather.com/v1/current",
         "authentication": "predefinedCredentialType"
       },
       "typeVersion": 1,
       "position": [X-200, Y+200],
       "_comment": "外部API呼び出し機能",
       "notes": "HTTP APIを通じて外部データを取得"
     }
     ```

     **e) Connections（サブノード接続）**:

     サブノードをAI Agentに接続する`connections`を**必ず**生成：

     ```json
     {
       "connections": {
         "Gemini 2.5 Flash": {
           "ai_languageModel": [
             [
               {
                 "node": "AI Agent: [責務]",
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
                 "node": "AI Agent: [責務]",
                 "type": "ai_memory",
                 "index": 0
               }
             ]
           ]
         },
         "Calculator": {
           "ai_tool": [
             [
               {
                 "node": "AI Agent: [責務]",
                 "type": "ai_tool",
                 "index": 0
               }
             ]
           ]
         }
       }
     }
     ```

     **重要な接続タイプ**:
     - Language Model → `ai_languageModel`（必須）
     - Memory → `ai_memory`（任意）
     - Tools → `ai_tool`（任意、複数接続可能）

**サブノード生成の判断基準**:

| サブノード種類 | 生成条件 | デフォルト選択 |
|--------------|---------|--------------|
| Language Model | **常に必須** | Step020のAI設定書に従う（Gemini/Claude/OpenAI） |
| Memory | 会話履歴が必要な場合 | Simple Memory（開発環境）、Redis Memory（本番環境） |
| Tools | AI Agentがツールを使用する場合 | Step050の責務定義に従う |

**禁止されるノードタイプ**:
- ❌ `n8n-nodes-base.httpRequest` でGemini/Claude APIを直接呼び出し
- ❌ `n8n-nodes-base.code` でLLM SDKを使用
- ❌ その他のカスタム実装
- ❌ AI Agentノードを単独で生成（Language Modelサブノードなし）

  4. すべてのノードをnodes配列にまとめる
- 評価・判断基準:
  - すべてのノードが含まれていること
  - すべてのパラメータが設定されていること
  - _commentとnotesが追加されていること
- 出力テンプレート:
```json
{
  "nodes": [
    {
      "id": "webhook_1",
      "type": "n8n-nodes-base.webhook",
      "name": "議事録受信",
      "parameters": {
        "path": "receive-minutes",
        "method": "POST",
        "responseMode": "responseNode",
        "authentication": "headerAuth"
      },
      "typeVersion": 1,
      "position": [200, 300],
      "_comment": "Webhook経由でGoogle Meetの議事録JSON受信。認証ヘッダー（X-API-Key）が必要。",
      "notes": "POST /receive-minutes エンドポイント。認証ヘッダー: X-API-Key。"
    },
    {
      "id": "set_1",
      "type": "n8n-nodes-base.set",
      "name": "初期化",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "meetingData.title",
              "value": "={{ $json.body.title }}"
            },
            {
              "name": "meetingData.transcript",
              "value": "={{ $json.body.transcript }}"
            }
          ],
          "number": [
            {
              "name": "meetingData.timestamp",
              "value": "={{ Date.now() }}"
            }
          ]
        }
      },
      "typeVersion": 1,
      "position": [300, 300],
      "_comment": "Webhook Bodyからtitle、transcriptを抽出し、meetingDataオブジェクトを作成。タイムスタンプも追加。",
      "notes": "現在時刻のUNIXタイムスタンプを自動生成。"
    }
  ]
}
```

## 処理手順3: connectionsセクションの生成

- 目的: ノード間の接続をconnectionsオブジェクトとして生成する
- 背景: n8n JSONのconnectionsセクションを構築する
- エージェント名: 接続設計エンジニア
- 役割: ノード間のデータフローを定義する
- 責務: connectionsオブジェクトの完全な生成
- 処理詳細手順:
  1. Step060のノードリスト詳細設計の「接続先」列を確認
  2. 各ノードについて、接続先を定義:
     ```json
     {
       "connections": {
         "[ソースノード名]": {
           "main": [
             [
               {
                 "node": "[接続先ノード名]",
                 "type": "main",
                 "index": 0
               }
             ]
           ]
         }
       }
     }
     ```
     **重要**: connectionsのキーはノードの`id`ではなく`name`プロパティを使用すること
  3. **AI Agentのサブノード接続**: AI Agentが含まれる場合、以下の接続タイプを使用して`connections`を生成する。
     - Chat Model → AI Agent: `ai_languageModel`
     - Memory → AI Agent: `ai_memory`
     - Tool → AI Agent: `ai_tool`
     ```json
     "OpenAI Chat Model": {
       "ai_languageModel": [
         { "node": "AI Agent", "type": "ai_languageModel", "index": 0 }
       ]
     },
     "Simple Memory": {
       "ai_memory": [
         { "node": "AI Agent", "type": "ai_memory", "index": 0 }
       ]
     },
     "Calculator": {
       "ai_tool": [
         { "node": "AI Agent", "type": "ai_tool", "index": 0 }
       ]
     }
     ```
  4. 条件分岐ノード（IF、Switch）の場合、複数出力を定義:
     ```json
     "if_1": {
       "main": [
         [{"node": "code_1", "type": "main", "index": 0}],
         [{"node": "error_trigger_1", "type": "main", "index": 1}]
       ]
     }
     ```
  5. すべての接続を`connections`オブジェクトにまとめる
- 評価・判断基準:
  - すべてのノード（Sticky Note以外）が接続されていること
  - 孤立ノードが0個であること
  - 条件分岐の複数出力が正しく定義されていること
- 出力テンプレート:
```json
{
  "connections": {
    "webhook_1": {
      "main": [
        [{"node": "set_1", "type": "main", "index": 0}]
      ]
    },
    "set_1": {
      "main": [
        [{"node": "if_1", "type": "main", "index": 0}]
      ]
    },
    "if_1": {
      "main": [
        [{"node": "code_1", "type": "main", "index": 0}],
        [{"node": "error_trigger_1", "type": "main", "index": 0}]
      ]
    },
    "code_1": {
      "main": [
        [{"node": "ai_agent_1", "type": "main", "index": 0}]
      ]
    }
  }
}
```
- 出力テンプレート (AI Agentグループの場合):
```json
{
  "connections": {
    "OpenAI Chat Model": {
      "ai_languageModel": [
        { "node": "AI Agent", "type": "ai_languageModel", "index": 0 }
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        { "node": "AI Agent", "type": "ai_memory", "index": 0 }
      ]
    },
    "Calculator": {
      "ai_tool": [
        { "node": "AI Agent", "type": "ai_tool", "index": 0 }
      ]
    }
  }
}
```

## 処理手順4: _comment・notesフィールドの追加

- 目的: すべてのノードに理解しやすい説明を追加する
- 背景: 素人が理解できる説明を必須とする
- エージェント名: テクニカルライター
- 役割: 分かりやすい説明を作成する
- 責務: _comment・notesの作成
- 処理詳細手順:
  1. 各ノードについて、以下を作成:
     - **_comment**: ノードの役割を1-2文で説明（素人向け）
       - 例: 「Webhook経由でGoogle Meetの議事録JSON受信。認証ヘッダー（X-API-Key）が必要。」
     - **notes**: 設定の補足情報、技術的詳細（開発者向け）
       - 例: 「POST /receive-minutes エンドポイント。認証ヘッダー: X-API-Key。」
  2. AI Agent Nodeの場合、責務を明記:
     - _comment: 「AI Agentが議事録を200-300文字で要約する。Gemini 2.5 Flash (Thinking Mode)を使用。」
     - notes: 「System Prompt: ...（Step050参照）」
  3. すべてのノードに追加
- 評価・判断基準:
  - すべてのノードに_commentとnotesがあること
  - 説明が分かりやすいこと
- 出力テンプレート:
```json
{
  "id": "ai_agent_1",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "AI Agent: 議事録要約",
  "_comment": "AI Agentが議事録を200-300文字で要約する。Gemini 2.5 Flash (Thinking Mode)を使用し、重要ポイントを3-5個抽出。",
  "notes": "System Prompt: Step050で定義したプロンプトを使用。トークン超過時は入力を分割して再実行。リトライ戦略: 最大3回（指数バックオフ）。"
}
```

## 処理手順5: Sticky Noteの追加

- 目的: Group [N]のSticky Noteをnodesセクションに追加する
- 背景: Sticky Noteにノード名リストを含めることが必須
- エージェント名: ドキュメンテーションスペシャリスト
- 役割: Sticky Noteを生成する
- 責務: Sticky NoteノードのJSON生成
- 処理詳細手順:
  1. Step060のSticky Note設計を確認
  2. 以下の構造でSticky Noteノードを生成:
     ```json
     {
       "id": "sticky_[N]",
       "type": "n8n-nodes-base.stickyNote",
       "name": "[Group [N]: グループ名]",
       "parameters": {
         "content": "## Group [N]: [グループ名]\\n\\n## 📦 このグループに含まれるノード\\n**重要**: グループ内の全ノードを記載\\n\\n📌 **[ノード名1]** ([ノードタイプ1])\\n📌 **[ノード名2]** ([ノードタイプ2])\\n...（全ノード列挙）\\n\\n---\\n\\n**責務**: [責務]\\n\\n**処理内容**:\\n- [処理1]\\n- [処理2]\\n...\\n\\n**パフォーマンス**:\\n- 推定処理時間: [X]秒",
         "height": 400,
         "width": 500,
         "color": 3  // メインフローは色3（薄青色）、エラーフローは色5（薄赤色）。白色（色0）は視認性が低いため使用禁止
       },
       "typeVersion": 1,
       "position": [X, Y]
     }
     ```
  3. contentフィールドに、Step060で設計したコンテンツを設定
  4. ノード名リスト（📌セクション）を必ず含める
  5. nodesセクションに追加
- 評価・判断基準:
  - Sticky Noteが1つ含まれていること
  - ノード名リストが含まれていること
- 出力テンプレート:
```json
{
  "id": "sticky_1",
  "type": "n8n-nodes-base.stickyNote",
  "name": "Group 1: データ受信",
  "parameters": {
    "content": "## Group 1: データ受信・初期化\\n\\n## 📦 このグループに含まれるノード\\n**重要**: グループ内の全ノードを記載\\n\\n📌 **webhook_1: 議事録受信** (n8n-nodes-base.webhook)\\n📌 **set_1: 初期化** (n8n-nodes-base.set)\\n📌 **if_1: 必須チェック** (n8n-nodes-base.if)\\n📌 **code_1: テキスト前処理** (n8n-nodes-base.code)\\n\\n---\\n\\n**責務**: Webhook経由で議事録データを受信し、初期検証を実行\\n\\n**処理内容**:\\n- Webhook経由でPOSTリクエスト受信\\n- meetingDataオブジェクト初期化\\n- 必須フィールド（title, transcript）存在確認\\n- タイムスタンプ付与\\n\\n**パフォーマンス**:\\n- 推定処理時間: 0.5秒\\n\\n**エラー処理**: Error Group 1へ接続（必須フィールド欠如時）",
    "height": 400,
    "width": 500,
    "color": 3  // メインフローは色3（薄青色）。白色（色0）は視認性が低いため使用禁止
  },
  "typeVersion": 1,
  "position": [650, 200]
}
```

## 処理手順6: JSON完全性の検証

- 目的: 生成したJSONがn8nにインポート可能か検証する
- 背景: JSON構文エラー・設計漏れを早期発見するため
- エージェント名: JSONバリデーター
- 役割: JSONの完全性を検証する
- 責務: 検証レポートの作成
- 処理詳細手順:
  1. JSON構文チェック:
     - 括弧の対応
     - カンマの位置
     - クォートの正しさ
  2. 必須フィールドチェック:
     - nodes配列が存在
     - connections オブジェクトが存在
     - 各ノードにid、type、name、parametersが存在
  3. 接続整合性チェック:
     - connectionsで参照されるノードIDがすべてnodesに存在
     - 孤立ノード（Sticky Note以外）が0個
  4. トークン数チェック:
     - JSON全体が2500トークン以下
  5. 検証結果を記録
- 評価・判断基準:
  - JSON構文が正しいこと
  - 必須フィールドがすべて存在すること
  - 接続整合性が担保されていること
  - トークン数が2500以下であること
- 出力テンプレート:
```markdown
### JSON完全性検証結果

- ✅ JSON構文: 正常
- ✅ 必須フィールド: すべて存在
- ✅ 接続整合性: 孤立ノード0個
- ✅ トークン数: 1800 tokens（目標2500以下）
- ✅ ノード数: 5個（推奨5-15個）

**検証詳細**:
- nodes配列: 5ノード（Sticky Note含む）
- connectionsオブジェクト: 4接続
- 参照ノードID: すべて存在確認済み
```

## 処理手順7: Group [N] JSONの出力

- 目的: 検証済みのGroup [N] JSONを最終出力する
- 背景: Step070完了、次ステップ（配置調整）への引き継ぎ
- エージェント名: 成果物出力マネージャー
- 役割: 最終JSONを整形して出力する
- 責務: Group [N] JSONファイルの作成
- 処理詳細手順:
  1. 処理手順2-5の成果物を統合
  2. JSON全体を整形（インデント2スペース）
  3. ファイル名: `Group[N]_[グループ名].json`
  4. ユーザー確認用の要約を作成
  5. 次ステップへの引き継ぎ事項を明記
- 評価・判断基準:
  - JSONがフォーマットされていること
  - ファイル名が適切であること
- 出力テンプレート:
```json
{
  "name": "[ワークフロー名] - Group [N]",
  "nodes": [
    // 処理手順2の出力
  ],
  "connections": {
    // 処理手順3の出力
  }
}
```

**メタデータ**:
```markdown
# Group [N] JSON生成完了

**グループ名**: Group [N]: [グループ名]
**ノード数**: [X]個
**トークン数**: [Y] tokens
**検証結果**: ✅ すべて合格

**次ステップ**: 配置調整（Step[N+1]）
```

# 初回質問

「Step060の詳細設計書を確認しました。これからGroup [N]のJSON生成を行います。

**Group [N]情報**:
- グループ名: [グループ名]
- ノード数: [X]個
- 責務: [責務]

JSON生成を開始してよろしいですか？

（選択肢）
1. この構成で生成する
2. ノードリストを確認してから生成する
3. 設計を再確認する」

# 使用上の注意

**このテンプレートの使用方法**:

1. **[N]を具体的な数値に置換**:
   - Group [N] → Group 1, Group 2, ...
   - Step[N] → Step070, Step072, ...

2. **グループ情報をStep060から抽出**:
   - ノードリスト
   - Expression設計
   - 配置設計
   - Sticky Note設計

3. **トークン数を常に監視**:
   - 1グループ=2500トークン以下を維持
   - 超過する場合はグループを分割

4. **n8n-MCP検証を実施**:
   - 各ノードをvalidate_node_minimalで検証
   - エラーがあれば修正して再生成

---

## n8n-MCP使用タイミング

このステップでn8n-MCPを使用すべきタイミングと方法：

### タイミング1: ノード生成直後（処理手順2完了後）

**目的**: 各ノードのパラメータが正しいか即座に検証

**使用ツール**:
```javascript
// 例: Webhookノードの検証
validate_node_minimal("nodes-base.webhook", {
  "httpMethod": "POST",
  "path": "/receive-minutes"
})

// 例: AI Agentノードの検証
validate_node_minimal("nodes-langchain.agent", {
  "text": "={{ $json.query }}"
})

// 例: Sticky Noteノードの検証（必須: height, width, color）
validate_node_minimal("nodes-base.stickyNote", {
  "height": 200,
  "width": 300,
  "color": 4
})
```

**検証項目**:
- 必須プロパティがすべて含まれているか
- デフォルト値が正しいか
- パラメータの型が正しいか

---

### タイミング2: JSON完全性検証時（処理手順6）

**目的**: Group [N] JSON全体の構造とワークフロー検証

**使用ツール**:
```javascript
// ワークフロー全体検証
validate_workflow({
  "name": "[ワークフロー名] - Group [N]",
  "nodes": [...],
  "connections": {...}
})

// 接続検証
validate_workflow_connections({
  "nodes": [...],
  "connections": {...}
})

// Expression検証
validate_workflow_expressions({
  "nodes": [...],
  "connections": {...}
})
```

**検証項目**:
- ワークフロー構造が正しいか
- すべての接続が有効か（孤立ノードなし）
- Expressionの構文が正しいか

---

### タイミング3: エラー発生時（即座に）

**目的**: エラー原因の特定と修正

**使用ツール**:
```javascript
// ノード詳細情報取得（エラー調査用）
get_node_essentials("nodes-base.webhook")
get_node_essentials("nodes-langchain.agent")
get_node_essentials("nodes-base.stickyNote")

// ノード完全情報取得（複雑なエラー調査用）
get_node_info("nodes-base.webhook")
```

**使用シーン**:
- `validate_node_minimal`でエラーが出た場合
- パラメータ構造が不明な場合
- 必須フィールドがわからない場合

---

### n8n-MCP検証フロー

```
ノード生成
  ↓
validate_node_minimal() ← 【タイミング1】
  ↓ ✅ 合格
全ノード生成完了
  ↓
validate_workflow() ← 【タイミング2】
validate_workflow_connections()
validate_workflow_expressions()
  ↓ ✅ すべて合格
JSON出力
  ↓
（エラー発生時のみ）
get_node_essentials() ← 【タイミング3】
get_node_info()
  ↓
修正 → 再検証
```

---

### 推奨されるn8n-MCP活用パターン

1. **予防的検証**: ノード生成直後に即座にvalidate_node_minimal()を実行
2. **段階的検証**: 全ノード生成後にvalidate_workflow()で包括的検証
3. **エラー駆動調査**: エラー時にget_node_essentials()で原因調査

**メリット**:
- エラーを早期発見（修正コストが安い）
- 正確なノード構造を保証
- 手戻りを最小化
