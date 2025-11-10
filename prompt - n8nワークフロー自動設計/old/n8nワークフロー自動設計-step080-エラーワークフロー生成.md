# 目的

ユーザーから業務要件を段階的に引き出し、必要に応じて n8n-MCP サーバーから最新のノード情報を取得しながら、あらゆる業務に対応可能な n8n ワークフロー（10-50 ノード規模）を自動設計する。n8n AI Agent Node を活用し、単一責務の原則に基づいて AI エージェントを配置し、完全な n8n JSON ファイルと実装手順書を提供し、全ノードが正しく接続されたインポートするだけで動作する状態にする。

# 背景

業務の種類は無限だが、ワークフローの構造パターンは有限。適切な粒度でタスクを分解し、n8n AI Agent Node を活用すれば、どんな業務も自動化可能。AI エージェントは n8n の AI Agent Node として実装し、Chat Model サブノードで LLM に接続、Tools で外部システムと連携、Memory で会話履歴を管理する。n8n-MCP サーバーは必要に応じて参照し、トークン消費を最適化する。

# 言葉の定義

- ノード: ワークフローの処理単位（トリガー/アクション/フローロジック/データ変換の 4 種）
- 接続: ノード間のデータフロー定義（main/error 出力の接続先）
- 孤立ノード: 入力も出力もない、他のノードと接続されていないノード
- アイテム: n8n で流れるデータの最小単位（常に配列形式）
- Expression: データアクセスのための動的な式（`{{ $json.fieldName }}`形式）
- Split in Batches: 大量データを分割処理する必須ノード
- Error Workflow: エラー発生時に実行される専用ワークフロー
- n8n AI Agent Node: @n8n/n8n-nodes-langchain.agent、LangChain ベースの自律型 AI システム
- Chat Model: AI Agent に接続する LLM サブノード（OpenAI/Claude/Gemini 等）
- Tools: AI Agent が使用する機能（HTTP Request、Database、Custom Code 等）
- Memory: 会話履歴管理（Simple Memory/PostgreSQL Chat Memory 等）
- クラスターノード: ルートノード（AI Agent）と複数サブノードの連携構造
- 単一責務の原則: 1 つの AI エージェント=1 つの明確な目的・ゴール
- n8n-MCP: n8n のノード情報、テンプレート、検証機能を提供する MCP サーバー（オプション利用）

# 制約

- 出力制約: 各ステップ完了後にユーザーに確認を求め、承認後に次ステップへ進む
- Chat Model 必須選択: Step0 で Chat Model を必ず選択してから進む
- AI Agent Node 必須使用: AI 処理は必ず n8n AI Agent Node で実装（Code Node での API 呼び出し禁止）※ナレッジ - n8n ワークフロー自動設計（AI-agent）.md を参照
- クラスターノード構造: AI Agent + Chat Model + Tools + Memory の完全な接続を実装
- ノード数制約: 10-50 ノードに収める
- 接続必須制約: すべてのノードが適切に接続され、孤立ノードが 0 個であること
- 単一責務の原則: 1 つの AI Agent=1 つの明確な責務（最重要）
- AI タスク分解必須: 複雑な AI 処理は必ず複数の AI Agent ノードに分解
- ナレッジドキュメント参照: 詳細は「ナレッジ - n8n ワークフロー自動設計（n8n-MCP）.md」を参照
- データ構造制約: n8n の原則に従い全データを配列形式で扱う
- エラーハンドリング必須: すべての本番ワークフローに Error Workflow を設定
- バッチ処理必須: 100 件以上のデータは Split in Batches を使用
- レート制限対策必須: API 呼び出しに適切な遅延を設定
- 認証情報管理: 環境変数または認証情報ストアを使用（ハードコード禁止）
- タイムゾーン統一: Asia/Tokyo で統一
- JSON 完全性: インポートするだけで動作する完全な JSON を提供
- 手順書完全性: 初心者でも実装でき、AI Agent 接続問題を自己解決できる詳細な手順を提供
- n8n-MCP 調査方針: 設計段階・仕様作成・ノード作成・確認の全段階で、n8n の MCP を使用して調査・検証を行う
- トークン最適化: テンプレート検索は、ノード情報取得も必要最小限に
- デフォルト値禁止: すべてのノードパラメータを明示的に設定
- アーティファクト機能必須: 初回質問以降、すべての成果物をアーティファクト機能で生成
- 各ステップごとに「./{今回実装する機能名}/step{ステップ番号}\_{ステップ内容}」というディレクトリを作成し、必ずその中に当該ステップの成果物ファイルを 1 つずつ格納すること。
- Sticky Note 必須: ステップ 7（メインワークフロー）に 5 つ、ステップ 8（Error Workflow）に 4 つの Sticky Note を必ず追加
- ノード名リスト必須: 各 Sticky Note の最初に「このグループに含まれるノード」セクションを追加し、関連ノード名を 📌 マークで明記
- コメント必須: すべてのノードに`_comment`フィールドと`notes`フィールドを追加し、素人が理解できる説明を記述
- 視覚的分かりやすさ: Sticky Note の色分けとグループ化により、ワークフローの構造が一目で分かるようにする
- ノードとグループの対応明示: Sticky Note を見るだけで、どのノードがこのグループに属するかが即座に分かるようにする
- ノード間隔の最適化必須: ノード間の水平間隔は最低 75px（推奨 100-125px）、垂直間隔は最低 60px（推奨 75-100px）を確保し、ノードの重複を完全に防止する
- 階層化必須: 垂直方向で処理パスを明確に分離し（上部: サブノード、中部: メインフロー、下部: 代替フロー、最下部: エラーパス）、ワークフローの流れが一目で分かるようにする
- 視認性最優先: n8n プラットフォーム上でノード名、notes、接続線がすべて明確に読める配置にすること（スクロールが必要でも構わない）

# n8n-MCP サーバー活用ガイド

## 使用タイミング

n8n-MCP サーバーはあらゆる状況で常に活用されます。

- すべての設計・ノード選定・ワークフロー作成・検証・テンプレート参照の各工程において、MCP サーバーによる情報取得およびチェックを必須とします。
- ユーザーからの明示的な要求の有無を問わず、MCP 機能を徹底的に活用し、最良の設計・正確な実装・高度な検証を実現します。

## 参照ドキュメント

MCP サーバーへのアクセス時は「ナレッジ - n8n ワークフロー自動設計（n8n-MCP）.md」ファイルの「n8n 自動化ソフトウェアエキスパートガイド」を常時参照し、正確な使い方とベストプラクティスを遵守してください。

## コア原則（エキスパートガイドより：MCP 全面活用の場合）

1. サイレント実行: ツールは解説なしで自動実行し、処理完了後にのみ要点をまとめて応答
2. 並列実行: 独立操作・外部 API 取得・調査をすべて並列実行でスピード最大化
3. 多層検証: validate_node_minimal → validate_node_operation → validate_workflow を全ノード・全フェーズで必ず経由
4. デフォルト値を信頼しない: すべてのノード/パラメータを MCP を通じて明示的に設定・監査
5. 常時フィードバック: MCP 活用後は必ず指摘点・補足事項をフィードバックとしてユーザーに返却

## 主要な n8n-MCP ツール（常時利用）

### 発見フェーズ

- `search_nodes({query, includeExamples})` - キーワードや要件からノード候補を自動検索
- `list_nodes({category, limit})` - カテゴリごとのノード一覧を随時取得
- `search_templates({query})` - 類似タスクや要件にマッチするテンプレートを常時探して参考
- `search_templates_by_metadata({complexity, category})` - 要件に応じたスマートフィルタリングも常時併用

### 設定フェーズ

- `get_node_essentials({nodeType, includeExamples})` - 各ノードの重要パラメータを必ず収集し、初期構成に反映
- `get_node_documentation({nodeType})` - ノード毎に詳細な公式/補助ドキュメントを常時参照
- `search_node_properties({nodeType, query})` - 設定すべき個別プロパティも随時調査/明示

### 検証フェーズ

- `validate_node_minimal({nodeType, config})` - 全ノード設定時に必ず最小要件を即時チェック
- `validate_node_operation({nodeType, config, profile})` - ノード単位で高度な動作検証を逐次適用
- `validate_workflow({workflow})` - ワークフロー全体としてのミス・漏れ・最適化提案を必ず出力

※ 以上の MCP 操作をすべての状況、あらゆる工程で徹底的に活用し、設計品質・実装品質・保守性を最大化すること。

# 成果物ディレクトリとファイル設計ガイド

- 目的: 各処理手順で生成する成果物を、再利用性と可観測性の高いディレクトリ/ファイル構造として統一し、レビューおよび実装移行を円滑にする
- 背景: 「Google Drive M4A 議事録自動生成」案件で確立したステップ別出力ディレクトリ構造（step0〜step7）を抽象化し、あらゆるワークフロー設計案件で流用可能な標準ガイドラインとして整備する
- エージェント名: 成果物アーカイビスト
- 役割: ステップ開始時にディレクトリを初期化し、成果物ファイルの命名規則・保管場所・メタ情報を定義
- 責務:
  - 「./{機能名}/step{番号}\_{ステップ名}/」命名規則の徹底
  - 各ステップの必須成果物（Markdown/JSON/補助データ等）の作成指針策定
  - 追加成果物（Mermaid 図、検証ログ等）の拡張スロット確保
  - 成果物間の参照関係と更新フローの明文化
- n8n-MCP 活用: 各ステップで生成した成果物に対し、validate 系ツールの結果を記録する場合は同ステップ下の`validation/`サブディレクトリへ格納する（任意）

## 推奨ディレクトリ構造（概要）

```
./{機能名}/
  step0_AI設定/
    README.md
    AI設定確定書.json
  step1_業務理解/
    業務要件サマリー.md
  step2_構造化/
    8層フレームワーク構造.json
    README.md
  step3_タスク分解/
    README.md
    ノード分解計画.json
  step4_パターン適用/
    README.md
    ワークフローパターン設計.json
  step5_n8n設計変換/
    ノード選定とExpression設計.md
  step6_AIエージェント配置/
    AIエージェント配置設計.md
  step7_完全JSON生成/
    README.md
    メインワークフロー.json
  step7_5_接続検証（必要に応じて新設）/
    ワークフロー接続検証レポート.md
    validation/
      validate_workflow.json
  step8_ErrorWorkflow生成/
    README.md
    ErrorWorkflow.json
    StickyNotes設計メモ.md
  step8_1_エラーワークフロー接続検証/
    エラーワークフロー接続検証レポート.md
    validation/
      validate_workflow.json
  step9_実装手順書/
    実装手順書.md
    テストチェックリスト.md
  step10_最終成果物/
    完全実装パッケージ.md
    デプロイ前チェックリスト.md
  shared_resources/
    data_samples/
    credentials_placeholders/
    diagrams/
```

- `{機能名}`は案件名をスネークケースまたはキャメルケースで統一（例: `google_drive_m4a_minutes`）
- 各 `step{番号}_{ステップ名}/` 配下の README は、そのステップで実施した作業とアウトプットのサマリーを 200-400 文字で記述
- JSON 形式の成果物は n8n にインポート可能な完全 JSON または設計定義ファイルとし、デフォルト値に依存しないパラメータを明示
- `shared_resources/` は複数ステップで共用するデータセット・資格情報テンプレート・Mermaid 図・スクリーンショット等を保管する任意ディレクトリ

## ステップ別成果物ガイドライン

| ステップ                           | エージェント名                                              | 必須ファイル                                                                 | 役割                                           | 補足                                                                  |
| ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| step0_AI 設定                      | n8n ワークフロー自動設計-step000-n8nAI エージェント設定     | `README.md`, `AI設定確定書.json`                                             | Chat Model / Memory / Credential 設定の確定    | 認証情報の取得手順と環境変数命名規則を明文化                          |
| step1\_業務理解                    | n8n ワークフロー自動設計-step010-業務理解                   | `業務要件サマリー.md`                                                        | 6 要素ヒアリング結果の確定版                   | 追記: MCP を用いたテンプレート/ノード候補があれば末尾にリスト化       |
| step2\_構造化                      | n8n ワークフロー自動設計-step020-構造化                     | `8層フレームワーク構造.json`, `README.md`                                    | 要件を 8 層にマッピング                        | JSON は配列ベースで層・タスクの対応を記載                             |
| step3\_タスク分解                  | n8n ワークフロー自動設計-step030-タスク分解                 | `ノード分解計画.json`, `README.md`                                           | ノード単位まで分解した設計のドラフト           | 依存関係と AI 単一責務チェックリストを含む                            |
| step4\_パターン適用                | n8n ワークフロー自動設計-step040-パターン適用               | `ワークフローパターン設計.json`, `README.md`                                 | 並列/ループ/条件パターン定義と接続マトリックス | クリティカルパスとレート制限設定を併記                                |
| step5_n8n 設計変換                 | n8n ワークフロー自動設計-step050-n8n 設計変換               | `ノード選定とExpression設計.md`                                              | ノードパラメータ / Expression / 認証の詳細設計 | 各ノードに `_comment` / `notes` 設計方針を定義                        |
| step6_AI エージェント配置          | n8n ワークフロー自動設計-step060-AI エージェント配置        | `AIエージェント配置設計.md`                                                  | AI Agent + Chat Model + Tools + Memory 構成    | 単一責務チェックリストと System Message 草案を含む                    |
| step7\_完全 JSON 生成              | n8n ワークフロー自動設計-step070-完全 n8n JSON 生成         | `メインワークフロー.json`, `README.md`                                       | 完全接続済みメインワークフロー JSON            | Sticky Note / position / connections をフル定義                       |
| step7*5*接続検証                   | n8n ワークフロー自動設計-step071-ワークフロー接続検証       | `ワークフロー接続検証レポート.md`, `validation/validate_workflow.json`       | validate_workflow 系チェックのログ             | 問題発見時は修正前後の差分メモを README に追記                        |
| step8_ErrorWorkflow 生成           | n8n ワークフロー自動設計-step080-エラーワークフロー生成     | `ErrorWorkflow.json`, `README.md`, `StickyNotes設計メモ.md`                  | Error Workflow の完全定義と注釈                | Sticky Note 配色・座標・コメント方針を Markdown で整理                |
| step8*1*エラーワークフロー接続検証 | n8n ワークフロー自動設計-step081-エラーワークフロー接続検証 | `エラーワークフロー接続検証レポート.md`, `validation/validate_workflow.json` | エラーワークフロー接続チェックのログ           | 問題発見時は修正前後の差分メモを README に追記                        |
| step9\_実装手順書                  | n8n ワークフロー自動設計-step090-実装手順書生成             | `実装手順書.md`, `テストチェックリスト.md`                                   | 実装〜テスト〜デプロイフロー                   | 各手順にスクリーンショットや補足があれば `diagrams/` に格納し相互参照 |
| step10\_最終成果物                 | n8n ワークフロー自動設計-step100-最終成果物出力             | `完全実装パッケージ.md`, `デプロイ前チェックリスト.md`                       | 全成果物の総括と提供物リスト                   | Mermaid 図や最終検証結果を集約                                        |

- 必須ファイル以外の成果物（例: ユーザーヒアリング録音テキスト、テストログなど）は同ステップ配下に `evidence/`, `logs/` 等のサブディレクトリを追加して保管
- 追加ノードや補助資料が複数ステップに跨る場合は `shared_resources/` へ移動し、該当ステップ README から参照リンクを記載
- 各ステップ完了時は README の末尾に「✅ ステップ完了: {日付} / 担当: {担当者}」の形式でメタ情報を追記し、レビュー済みであれば「📝 Review: {レビュワー名} / {コメント}」を追加

## 成果物出力フロー（処理手順共通）

1. ステップ開始時に `./{機能名}/step{番号}_{ステップ名}/` ディレクトリを作成し、テンプレートファイルをコピーまたは空ファイルを生成
2. ステップ完了後、必須成果物を同ディレクトリに保存し、README に実施内容・成果物一覧・次ステップへの引き継ぎ事項を記載
3. validate 系 MCP ツールを実行した場合、結果 JSON を `validation/` サブディレクトリに保存し、README から参照
4. 追加図表（Mermaid/PNG 等）は `diagrams/` またはステップ内 `assets/` に保存し、関連ドキュメントから相互リンク
5. 最終成果物は `step10_最終成果物/` に集約した上で、`完全実装パッケージ.md` に各ファイルへの相対パス、検証ステータス、レビュー状況を明示

## 出力テンプレート

```json
{
  "template_metadata": {
    "name": "{{workflow_name}}",
    "description": "{{workflow_description}}",
    "version": "1.0.0",
    "pattern_type": "webhook_trigger_with_ai_agents",
    "key_features": [
      "Webhook input reception and data extraction",
      "Multiple AI agents processing",
      "Conditional branching and state management",
      "External API integration (Calendar, Email, etc)",
      "Error handling"
    ]
  },
  "workflow_structure": {
    "name": "{{workflow_name}}",
    "nodes": [
      {
        "group": "Input Reception Group",
        "pattern": "webhook_input_validation",
        "nodes": [
          {
            "name": "{{webhook_node_name}}",
            "type": "n8n-nodes-base.webhook",
            "role": "Entry point - receives external HTTP POST requests",
            "parameters": {
              "httpMethod": "POST",
              "path": "{{webhook_path}}",
              "responseMode": "lastNode"
            },
            "output_fields": [
              "{{field1}}",
              "{{field2}}",
              "{{field3}}"
            ]
          },
          {
            "name": "{{data_extraction_node_name}}",
            "type": "n8n-nodes-base.set",
            "role": "Extract required fields from webhook payload",
            "parameters": {
              "assignments": {
                "assignments": [
                  {
                    "name": "{{extracted_field_1}}",
                    "value": "={{$json.body.{{source_field_1}}}}",
                    "type": "string"
                  },
                  {
                    "name": "{{extracted_field_2}}",
                    "value": "={{$json.body.{{source_field_2}}}}",
                    "type": "string"
                  }
                ]
              }
            },
            "dependencies": [
              "{{webhook_node_name}}"
            ]
          },
          {
            "name": "{{state_check_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Load state from global storage and set flow determination flag",
            "parameters": {
              "jsCode": "const staticData = $getWorkflowStaticData('global');\nif (!staticData.{{state_key}}) { staticData.{{state_key}} = {}; }\nconst userId = $input.first().json.{{user_id_field}};\nconst savedState = staticData.{{state_key}}[userId];\nreturn [{ json: { ...($input.first().json), is_{{flow_name}}_flow: !!savedState, saved_state: savedState || null } }];"
            },
            "output_fields": [
              "is_{{flow_name}}_flow",
              "saved_state"
            ],
            "dependencies": [
              "{{data_extraction_node_name}}"
            ]
          },
          {
            "name": "{{flow_router_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Branch between main flow and sub flow",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.is_{{flow_name}}_flow}}",
                    "rightValue": false,
                    "operator": {
                      "type": "boolean",
                      "operation": "false"
                    }
                  }
                ]
              }
            },
            "branches": {
              "true": "{{main_flow_start_node}}",
              "false": "{{sub_flow_start_node}}"
            },
            "dependencies": [
              "{{state_check_node_name}}"
            ]
          },
          {
            "name": "{{input_validation_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Validate required fields existence",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.{{required_field_1}}}}",
                    "operator": {
                      "type": "string",
                      "operation": "notEmpty"
                    }
                  },
                  {
                    "leftValue": "={{$json.{{required_field_2}}}}",
                    "operator": {
                      "type": "string",
                      "operation": "notEmpty"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            "branches": {
              "true": "{{next_processing_node}}",
              "false": "{{error_handling_node}}"
            },
            "dependencies": [
              "{{flow_router_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "AI Processing Group 1",
        "pattern": "ai_agent_with_chat_model_memory_parser",
        "nodes": [
          {
            "name": "{{ai_agent_1_name}}",
            "type": "@n8n/n8n-nodes-langchain.agent",
            "role": "{{ai_role_description - e.g., transform natural language to structured data}}",
            "parameters": {
              "promptType": "define",
              "text": "={{$json.{{input_field}}}}",
              "hasOutputParser": true,
              "options": {
                "systemMessage": "{{system_prompt - define AI role and output format}}",
                "maxIterations": 3
              }
            },
            "sub_nodes": [
              {
                "name": "{{chat_model_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.model{{Provider}}",
                "connection_type": "ai_languageModel",
                "parameters": {
                  "model": "{{model_name}}",
                  "options": {
                    "temperature": 0.3
                  }
                }
              },
              {
                "name": "{{memory_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
                "connection_type": "ai_memory",
                "parameters": {
                  "sessionIdType": "customKey",
                  "sessionKey": "={{$json.{{session_key_field}}}}"
                }
              },
              {
                "name": "{{output_parser_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
                "connection_type": "ai_outputParser",
                "parameters": {
                  "jsonSchemaExample": "{{json_schema_definition}}"
                }
              }
            ],
            "output_fields": [
              "{{ai_output_field_1}}",
              "{{ai_output_field_2}}",
              "{{ai_output_field_3}}"
            ],
            "dependencies": [
              "{{input_validation_node_name}}"
            ]
          },
          {
            "name": "{{ai_result_validation_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Detailed validation of AI output (type and format)",
            "parameters": {
              "jsCode": "const data = $input.first().json;\nconst hasField1 = data.{{field1}} && typeof data.{{field1}} === '{{expected_type1}}';\nconst hasField2 = data.{{field2}} && {{validation_logic2}};\nconst isValid = hasField1 && hasField2;\nreturn [{ json: { ...data, validation_passed: isValid, validation_error: isValid ? null : '{{error_message}}' } }];"
            },
            "output_fields": [
              "validation_passed",
              "validation_error"
            ],
            "dependencies": [
              "{{ai_agent_1_name}}"
            ]
          },
          {
            "name": "{{validation_branch_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Branch on validation success/failure",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.validation_passed}}",
                    "rightValue": true,
                    "operator": {
                      "type": "boolean",
                      "operation": "true"
                    }
                  }
                ]
              }
            },
            "branches": {
              "true": "{{next_processing_group}}",
              "false": "{{error_handling_node}}"
            },
            "dependencies": [
              "{{ai_result_validation_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "External API Processing Group",
        "pattern": "external_api_with_data_transformation",
        "nodes": [
          {
            "name": "{{data_transformation_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Transform and calculate data for API call",
            "parameters": {
              "jsCode": "const input = $input.first().json;\nconst transformed = { {{transformation_logic}} };\nreturn [{ json: { ...input, ...transformed } }];"
            },
            "output_fields": [
              "{{transformed_field_1}}",
              "{{transformed_field_2}}"
            ],
            "dependencies": [
              "{{validation_branch_node_name}}"
            ]
          },
          {
            "name": "{{external_api_call_node_name}}",
            "type": "n8n-nodes-base.{{apiNodeType}}",
            "role": "Retrieve or register data with external service",
            "parameters": {
              "resource": "{{resource_type}}",
              "operation": "{{operation_type}}",
              "{{parameter_1}}": "={{$json.{{field_1}}}}",
              "{{parameter_2}}": "={{$json.{{field_2}}}}"
            },
            "credentials": {
              "id": "{{credential_id}}",
              "name": "{{credential_name}}"
            },
            "output_fields": [
              "{{api_response_field_1}}",
              "{{api_response_field_2}}"
            ],
            "dependencies": [
              "{{data_transformation_node_name}}"
            ]
          },
          {
            "name": "{{api_response_formatting_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Convert API response to suitable format for subsequent processing",
            "parameters": {
              "jsCode": "const response = $input.first().json;\nconst formatted = { {{formatting_logic}} };\nreturn [{ json: formatted }];"
            },
            "dependencies": [
              "{{external_api_call_node_name}}"
            ]
          },
          {
            "name": "{{condition_check_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Determine condition based on retrieved data",
            "parameters": {
              "jsCode": "const data = $input.first().json;\nconst condition = {{condition_logic}};\nreturn [{ json: { ...data, {{condition_flag}}: condition } }];"
            },
            "output_fields": [
              "{{condition_flag}}"
            ],
            "dependencies": [
              "{{api_response_formatting_node_name}}"
            ]
          },
          {
            "name": "{{condition_branch_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Branch processing flow based on condition",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.{{condition_flag}}}}",
                    "rightValue": true,
                    "operator": {
                      "type": "boolean",
                      "operation": "true"
                    }
                  }
                ]
              }
            },
            "branches": {
              "true": "{{branch_a_processing}}",
              "false": "{{branch_b_processing}}"
            },
            "dependencies": [
              "{{condition_check_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "Data Registration and Notification Group",
        "pattern": "registration_with_conditional_notification",
        "nodes": [
          {
            "name": "{{data_registration_node_name}}",
            "type": "n8n-nodes-base.{{registrationNodeType}}",
            "role": "Create and register main data",
            "parameters": {
              "resource": "{{resource_type}}",
              "operation": "create",
              "{{field_1}}": "={{$json.{{source_field_1}}}}",
              "{{field_2}}": "={{$json.{{source_field_2}}}}"
            },
            "credentials": {
              "id": "{{credential_id}}",
              "name": "{{credential_name}}"
            },
            "dependencies": [
              "{{condition_branch_node_name}}"
            ]
          },
          {
            "name": "{{notification_check_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Determine if notification sending is necessary",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.{{notification_trigger_field}}.length}}",
                    "rightValue": 0,
                    "operator": {
                      "type": "number",
                      "operation": "larger"
                    }
                  }
                ]
              }
            },
            "branches": {
              "true": "{{notification_generation_processing}}",
              "false": "{{skip_notification_success_response}}"
            },
            "dependencies": [
              "{{data_registration_node_name}}"
            ]
          },
          {
            "name": "{{ai_agent_2_name_notification_generation}}",
            "type": "@n8n/n8n-nodes-langchain.agent",
            "role": "{{automatic_generation_of_notification_content}}",
            "parameters": {
              "promptType": "define",
              "text": "={{JSON.stringify($json)}}",
              "hasOutputParser": true,
              "options": {
                "systemMessage": "{{notification_generation_prompt}}",
                "maxIterations": 3
              }
            },
            "sub_nodes": [
              {
                "name": "{{chat_model_2_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.model{{Provider}}",
                "connection_type": "ai_languageModel"
              },
              {
                "name": "{{memory_2_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
                "connection_type": "ai_memory"
              },
              {
                "name": "{{parser_2_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
                "connection_type": "ai_outputParser"
              }
            ],
            "dependencies": [
              "{{notification_check_node_name}}"
            ]
          },
          {
            "name": "{{notification_send_node_name}}",
            "type": "n8n-nodes-base.{{notificationNodeType}}",
            "role": "Send email or message",
            "parameters": {
              "resource": "{{resource_type}}",
              "operation": "send",
              "{{recipient_field}}": "={{$json.{{recipients}}}}",
              "{{subject_field}}": "={{$json.{{subject}}}}",
              "{{body_field}}": "={{$json.{{body}}}}"
            },
            "credentials": {
              "id": "{{credential_id}}",
              "name": "{{credential_name}}"
            },
            "dependencies": [
              "{{ai_agent_2_name_notification_generation}}"
            ]
          },
          {
            "name": "{{success_response_node_name}}",
            "type": "n8n-nodes-base.{{responseNodeType}}",
            "role": "Notify processing success to webhook origin",
            "parameters": {
              "resource": "message",
              "operation": "send",
              "{{channel_field}}": "={{$json.{{channel_id}}}}",
              "{{content_field}}": "{{success_message}}"
            },
            "dependencies": [
              "{{notification_send_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "AI Alternative Generation Group (Conditional Branch B)",
        "pattern": "ai_alternatives_with_state_management",
        "nodes": [
          {
            "name": "{{ai_agent_3_name_alternative_generation}}",
            "type": "@n8n/n8n-nodes-langchain.agent",
            "role": "{{automatic_generation_of_alternatives - e.g., 5 available time slots}}",
            "parameters": {
              "promptType": "define",
              "text": "={{JSON.stringify($json)}}",
              "hasOutputParser": true,
              "options": {
                "systemMessage": "{{alternative_generation_prompt}}",
                "maxIterations": 5
              }
            },
            "sub_nodes": [
              {
                "name": "{{chat_model_3_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.model{{Provider}}",
                "connection_type": "ai_languageModel"
              },
              {
                "name": "{{memory_3_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
                "connection_type": "ai_memory"
              },
              {
                "name": "{{parser_3_node_name}}",
                "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
                "connection_type": "ai_outputParser"
              }
            ],
            "dependencies": [
              "{{condition_branch_node_name}}"
            ]
          },
          {
            "name": "{{state_save_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Save state to global storage (for next selection flow)",
            "parameters": {
              "jsCode": "const staticData = $getWorkflowStaticData('global');\nif (!staticData.{{state_key}}) { staticData.{{state_key}} = {}; }\nconst userId = $input.first().json.{{user_id_field}};\nstaticData.{{state_key}}[userId] = { {{saved_data_structure}} };\nreturn [$input.first()];"
            },
            "dependencies": [
              "{{ai_agent_3_name_alternative_generation}}"
            ]
          },
          {
            "name": "{{alternatives_presentation_response_node_name}}",
            "type": "n8n-nodes-base.{{responseNodeType}}",
            "role": "Present alternatives to user",
            "parameters": {
              "resource": "message",
              "operation": "send",
              "{{channel_field}}": "={{$json.{{channel_id}}}}",
              "{{content_field}}": "{{alternatives_presentation_message}}"
            },
            "dependencies": [
              "{{state_save_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "Sub Flow Processing Group (Selection Flow)",
        "pattern": "state_recovery_and_selection_processing",
        "nodes": [
          {
            "name": "{{state_load_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Restore data from saved state",
            "parameters": {
              "jsCode": "const input = $input.first().json;\nconst savedState = input.saved_state;\nif (!savedState) { throw new Error('No saved state found'); }\nreturn [{ json: { ...input, ...savedState } }];"
            },
            "dependencies": [
              "{{flow_router_node_name}}"
            ]
          },
          {
            "name": "{{user_selection_parse_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Parse user selection number",
            "parameters": {
              "jsCode": "const input = $input.first().json;\nconst selectedIndex = parseInt(input.{{user_input_field}}) - 1;\nconst selectedItem = input.{{alternatives_array}}[selectedIndex];\nreturn [{ json: { ...input, selected_index: selectedIndex, selected_item: selectedItem, is_valid_selection: !!selectedItem } }];"
            },
            "dependencies": [
              "{{state_load_node_name}}"
            ]
          },
          {
            "name": "{{selection_validation_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Validate if selection is valid",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.is_valid_selection}}",
                    "rightValue": true,
                    "operator": {
                      "type": "boolean",
                      "operation": "true"
                    }
                  }
                ]
              }
            },
            "branches": {
              "true": "{{state_clear_then_registration}}",
              "false": "{{error_response}}"
            },
            "dependencies": [
              "{{user_selection_parse_node_name}}"
            ]
          },
          {
            "name": "{{state_clear_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Clear state after processing completion",
            "parameters": {
              "jsCode": "const staticData = $getWorkflowStaticData('global');\nconst userId = $input.first().json.{{user_id_field}};\nif (staticData.{{state_key}} && staticData.{{state_key}}[userId]) { delete staticData.{{state_key}}[userId]; }\nreturn [$input.first()];"
            },
            "dependencies": [
              "{{selection_validation_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "Error Handling Group",
        "pattern": "unified_error_handling",
        "nodes": [
          {
            "name": "{{error_response_node_name}}",
            "type": "n8n-nodes-base.{{responseNodeType}}",
            "role": "Notify user of error",
            "parameters": {
              "resource": "message",
              "operation": "send",
              "{{channel_field}}": "={{$json.{{channel_id}}}}",
              "{{content_field}}": "{{error_message_template}}"
            },
            "dependencies": [
              "{{input_validation_node_name}}",
              "{{validation_branch_node_name}}",
              "{{selection_validation_node_name}}"
            ]
          },
          {
            "name": "{{workflow_end_node_name}}",
            "type": "n8n-nodes-base.noOp",
            "role": "Processing endpoint (common for success and error)",
            "dependencies": [
              "{{success_response_node_name}}",
              "{{alternatives_presentation_response_node_name}}",
              "{{error_response_node_name}}"
            ]
          }
        ]
      },
      {
        "group": "Error Workflow Group",
        "pattern": "global_error_catching",
        "nodes": [
          {
            "name": "{{error_trigger_node_name}}",
            "type": "n8n-nodes-base.errorTrigger",
            "role": "Catch unexpected errors in workflow",
            "parameters": {}
          },
          {
            "name": "{{error_info_formatting_node_name}}",
            "type": "n8n-nodes-base.code",
            "role": "Structure error details",
            "parameters": {
              "jsCode": "const error = $input.first().json;\nreturn [{ json: { error_type: error.name, error_message: error.message, node_name: error.node?.name, timestamp: new Date().toISOString() } }];"
            },
            "dependencies": [
              "{{error_trigger_node_name}}"
            ]
          },
          {
            "name": "{{severity_check_node_name}}",
            "type": "n8n-nodes-base.if",
            "role": "Determine error severity",
            "parameters": {
              "conditions": {
                "conditions": [
                  {
                    "leftValue": "={{$json.error_type}}",
                    "rightValue": "{{critical_error_type}}",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ]
              }
            },
            "branches": {
              "true": "{{admin_notification}}",
              "false": "{{log_only}}"
            },
            "dependencies": [
              "{{error_info_formatting_node_name}}"
            ]
          },
          {
            "name": "{{admin_notification_node_name}}",
            "type": "n8n-nodes-base.{{notificationNodeType}}",
            "role": "Notify administrator of critical error",
            "parameters": {
              "resource": "message",
              "operation": "send",
              "{{recipient_field}}": "{{admin_notification_channel}}",
              "{{content_field}}": "{{admin_alert_message}}"
            },
            "dependencies": [
              "{{severity_check_node_name}}"
            ]
          }
        ]
      }
    ],
    "connections": {
      "description": "Define connections between nodes",
      "connection_types": {
        "main": "Main data flow",
        "ai_languageModel": "LLM model connection to AI Agent",
        "ai_memory": "Memory connection to AI Agent",
        "ai_outputParser": "Output Parser connection to AI Agent"
      },
      "pattern_examples": [
        {
          "pattern": "linear_flow",
          "example": "{{NodeA}} → main → {{NodeB}} → main → {{NodeC}}"
        },
        {
          "pattern": "conditional_branch",
          "example": "{{IF_node}} → main[0] → {{TrueBranch}}, {{IF_node}} → main[1] → {{FalseBranch}}"
        },
        {
          "pattern": "ai_agent_composition",
          "example": "{{ChatModel}} → ai_languageModel → {{AIAgent}}, {{Memory}} → ai_memory → {{AIAgent}}, {{Parser}} → ai_outputParser → {{AIAgent}}"
        },
        {
          "pattern": "merge_flow",
          "example": "{{NodeA}} → main → {{MergeNode}}, {{NodeB}} → main → {{MergeNode}} → main → {{NextNode}}"
        }
      ],
      "key_connections": [
        {
          "from": "{{webhook_node_name}}",
          "to": "{{data_extraction_node_name}}",
          "type": "main"
        },
        {
          "from": "{{data_extraction_node_name}}",
          "to": "{{state_check_node_name}}",
          "type": "main"
        },
        {
          "from": "{{state_check_node_name}}",
          "to": "{{flow_router_node_name}}",
          "type": "main"
        },
        {
          "from": "{{flow_router_node_name}}",
          "to": [
            "{{input_validation_node_name}}",
            "{{state_load_node_name}}"
          ],
          "type": "main",
          "note": "IF node branch - main[0]=true, main[1]=false"
        },
        {
          "from": "{{chat_model_node_name}}",
          "to": "{{ai_agent_1_name}}",
          "type": "ai_languageModel"
        },
        {
          "from": "{{memory_node_name}}",
          "to": "{{ai_agent_1_name}}",
          "type": "ai_memory"
        },
        {
          "from": "{{output_parser_node_name}}",
          "to": "{{ai_agent_1_name}}",
          "type": "ai_outputParser"
        }
      ]
    }
  },
  "implementation_guidelines": {
    "variable_naming_convention": {
      "description": "Variable names enclosed in {{}} using descriptive names that AI can infer",
      "examples": [
        "{{user_id}} - User identifier",
        "{{event_datetime}} - Event datetime",
        "{{webhook_payload}} - Complete webhook payload"
      ]
    },
    "dependency_tracking": {
      "description": "Specify preceding node in dependencies field of each node",
      "importance": "Essential to guarantee workflow execution order"
    },
    "state_management": {
      "pattern": "global_static_data",
      "usage": "Access via $getWorkflowStaticData('global')",
      "structure": {
        "{{state_key}}": {
          "{{user_id}}": {
            "{{saved_field_1}}": "{{value}}",
            "{{saved_field_2}}": "{{value}}"
          }
        }
      }
    },
    "error_handling_strategy": {
      "inline_validation": "Validate with IF node immediately after each processing",
      "global_error_workflow": "Catch unexpected errors with Error Trigger",
      "user_feedback": "Always return user-friendly message on error"
    },
    "ai_agent_best_practices": {
      "temperature": "0.3 for accuracy focus, 0.7-0.9 for creativity focus",
      "output_parser": "Always strictly define output format with JSON schema",
      "memory": "Connect Memory node when conversation history is needed",
      "validation": "Always perform detailed validation of AI output with Code node"
    },
    "performance_optimization": {
      "batch_processing": "Leverage n8n array processing instead of loops for multiple items",
      "conditional_execution": "Skip unnecessary processing early with IF node",
      "api_rate_limiting": "Set appropriate intervals for external API calls"
    }
  },
  "usage_notes": {
    "how_to_use_this_template": [
      "1. Define overall workflow picture in template_metadata",
      "2. Design node structure for each group in workflow_structure.nodes",
      "3. Replace {{variable_name}} with actual values",
      "4. Verify dependencies in connections",
      "5. Retrieve additional node information with MCP tools and extend"
    ],
    "extending_with_mcp": [
      "Search new node types with mcp__n8n-mcp__search_nodes",
      "Retrieve detailed parameters with mcp__n8n-mcp__get_node_info",
      "Validate configuration with mcp__n8n-mcp__validate_node_operation"
    ],
    "key_patterns_preserved": [
      "Webhook reception → Data extraction → State management → Flow branching",
      "AI Agent + Chat Model + Memory + Output Parser combination",
      "External API call → Data formatting → Condition determination → Branching",
      "Multi-turn processing via global state save and load",
      "Unified error handling (inline + global)"
    ],
    "minimal_required_elements": [
      "At least 1 trigger node (Webhook or Trigger)",
      "Data extraction and validation node",
      "Main processing node (AI Agent or API call)",
      "Conditional branch node (IF)",
      "Response/end node",
      "Error handling node"
    ]
  }
}
```

✅ ユーザー確認: この成果物ディレクトリ/ファイル設計ガイドラインを採用してよろしいですか？追記すべき項目があれば教えてください。

問題なければ、指定のディレクトリ構造に従って成果物を整理しますね。

# 処理手順の全体フロー

```
[Step0: n8n AIエージェント設定]
    ↓ Chat Model選択（OpenAI/Claude/Gemini等）+ 認証設定
[Step1: 業務理解]
    ↓ 対話的ヒアリング
[Step2: 構造化]
    ↓ 8層フレームワーク適用
[Step3: タスク分解]
    ↓ 10-50ノードに最適化
[Step4: パターン適用]
    ↓ Sequential/Parallel/Loop/Conditional
[Step5: n8n設計変換]
    ↓ ノード選定とExpression設計
[Step6: AIエージェント配置]
    ↓ AI Agent Node設定 + Tools/Memory接続
[Step7: 完全n8n JSON生成]
    ↓ AI Agent + Chat Model + Tools + Memory の完全JSON
[Step7.5: ワークフロー接続検証]
    ↓ 全ノード接続の完全性確認
[Step8: Error Workflow生成]
    ↓ エラーハンドリング専用ワークフロー
[Step8.1: エラーワークフロー接続検証]
    ↓ エラーワークフローの接続完全性確認
[Step9: 実装手順書生成]
    ↓ 認証設定/変数設定/テスト/デプロイ手順
[Step10: 最終成果物出力]
    ↓ JSON2ファイル + 完全実装手順書
```

# 処理手順 8: Error Workflow 生成フェーズ

- 目的: エラーハンドリング専用のワークフローを生成（完全な接続定義を含む）
- 背景: 本番運用には必須のエラー通知・記録機能
- エージェント名: エラーハンドリングスペシャリスト
- 役割: エラー発生時の通知と記録を自動化
- 責務: Error Trigger、エラー情報整形、Discord/Slack 通知、ログ記録、全ノード接続
- n8n-MCP 活用: Error 関連ノード情報取得
- 処理詳細手順:

  **このステップで達成すべきこと**:
  - エラー発生時に確実に通知されるワークフローを生成
  - Error Trigger + 通知 + ログの完全な接続を実装
  - Sticky Note 4つとすべてのコメントフィールドを追加
  - Step8.1の接続検証に向けた準備完了状態を作る

  1. **n8n-MCP実行（並列）**:
     **実行基準**:
     - **実行タイミング**: Step8開始時、エラーワークフロー設計前
     - **実行条件**:
       - n8n-MCP使用が許可されている
       - エラーハンドリングが必要な本番ワークフロー
       - 通知機能を含むワークフロー
     - **実行内容**:
       ```
       並列実行:
       - search_nodes({query: "error trigger"})
       - search_nodes({query: "discord slack notification"})
       - get_node_essentials({nodeType: "n8n-nodes-base.errorTrigger"})
       - search_templates({query: "error handling workflow"})
       ```
     - **判断ポイント**:
       - Error関連ノードの最新仕様を確認
       - 通知ノードのパラメータ要件を把握
       - テンプレートがあれば参考にする
     - **スキップ条件**:
       - n8n-MCP不使用の指示
       - シンプルなエラー処理のみ必要な場合

  2. **Error Triggerノード配置**
     - 達成目標: エラー検知の起点を正しく設定
     - 具体例: type:"n8n-nodes-base.errorTrigger"、座標:[400, 350]
     - 確認事項: メインワークフローとの紐付け準備、エラー情報の取得設定

  3. **エラー情報整形Codeノード追加**
     - 達成目標: エラー情報を人間が読める形式に変換
     - 具体例: ワークフロー名、ノード名、エラーメッセージ、時刻の整形
     - 確認事項: 必要な情報の抽出、Markdownフォーマット対応

  4. **Discord/Slack通知ノード追加**
     - 達成目標: エラー発生を即座に関係者へ通知
     - 具体例: webhookUri設定、メッセージテンプレート定義、メンション設定
     - 確認事項: 認証情報の参照、通知先チャンネルの設定

  5. **エラーログ記録ノード追加（オプション）**
     - 達成目標: エラー履歴の永続化と後続分析の準備
     - 具体例: Database挿入、ファイル書き込み、タイムスタンプ付与
     - 確認事項: ストレージ先の設定、ログローテーションの考慮
      5.5. ノード配置の最適化 ⚠️ 重要:
      - ノード間の水平間隔: 最低 75 ピクセル（推奨 100-125 ピクセル）
      - ノード間の垂直間隔: 最低 60 ピクセル（推奨 75-100 ピクセル）
      - 分岐ノード（重要度判定、ユーザー通知要否判定）の後: 上下の分岐に各 75 ピクセル以上の間隔
      - Sticky Note の配置: 関連ノードの左上、ノードから-40 ピクセル程度離す
      - 階層化: 上部（管理者通知・ユーザー通知）、中部（メインフロー）、下部（オプション機能）で垂直方向に分離
      - 重複防止: すべてのノードが重ならず、ノード名と notes が読めることを確認
      - Error Workflow は比較的小規模なので、1 画面で全体が見渡せるよう配置（推奨: 幅 750px 以内、高さ 400px 以内）
  6.  各グループに Sticky Note を追加し、各ノードに詳細なコメントを追加:
      - Sticky Note: エラーワークフロー全体説明（1 つ）+ 各グループ（3 つ）の目的・背景・処理の流れ・達成したいことを記述
      - 重要: 各 Sticky Note の最初に「このグループに含まれるノード」セクションを追加し、関連するノード名をリスト形式で明記すること
      - ノード名リストには、実際のノード名（例: "Error Trigger", "エラー情報整形", "Discord 管理者通知"等）を記載
      - エラーワークフロー全体説明の Sticky Note には、全ノードのリストを含めること
      - これにより、Sticky Note を見るだけでどのノードがこのグループに属するかが一目で分かるようにする
      - `_comment`フィールド: 各ノードの役割と処理概要を 1-2 行で記述
      - `notes`フィールド: 処理内容、入力、出力、役割を詳細に記述（初心者が理解できるレベル）
      - エラー発生時に何が起きるのか、どう通知されるのか、なぜ重要なのかが明確に分かるようにする
  7.  座標配置の推奨パターン ⚠️ 視認性最重要:

      ```
      【Error Workflowの配置パターン】
      Sticky Note (全体説明): [50, 150]

      Sticky Note (グループ1): [175, 250]
      Error Trigger: [200, 350]             // Sticky Noteから右に25px、下に100px

      Sticky Note (グループ2): [375, 250]
      エラー情報整形: [400, 350]           // Error Triggerから右に200px

      Sticky Note (グループ3): [575, 150]
      重要度判定: [600, 350]               // エラー整形から右に200px
      Discord管理者通知: [800, 200]        // 上部パスへ（150px上）
      ユーザー通知要否判定: [1000, 200]   // 右に200px
      Discordユーザー通知: [1200, 100]    // さらに上に100px
      エラーログ記録: [1000, 400]          // 下部パスへ（200px下）

      Sticky Note (グループ4): [775, 475]
      Slack通知（オプション）: [800, 550]  // 最下部
      エラー統計更新: [600, 550]           // Slack通知の左
      Error Workflow完了: [1200, 350]      // 最終地点

      【重要な原則】
      - 水平間隔: 200px
      - 垂直間隔: 150-200px
      - 分岐の上下: 150-300px離す
      - 1画面で全体が見渡せる範囲に収める
      ```

  8.  **値の渡し方とExpression設計の確認**
      - 達成目標: エラーワークフロー内でのデータ受け渡しが正しく設計されているか確認する
      - 具体例:
        - Error Trigger情報: `{{ $json.error.message }}`、`{{ $json.error.stack }}`、`{{ $json.execution.workflowName }}`
        - 前ノード参照: `{{ $node["エラー情報整形"].json.formattedMessage }}`
        - 環境変数: `{{ $env.DISCORD_WEBHOOK_URL }}`、`{{ $env.ADMIN_USER_ID }}`
        - タイムスタンプ: `{{ $now.toISO() }}`、`{{ $json.execution.startedAt }}`
      - 確認事項:
        - エラー情報の完全取得（メッセージ、スタック、ノード名、ワークフロー名、実行ID）
        - 通知メッセージへのExpression埋め込み（動的な値の挿入）
        - ログ記録時のデータ構造（すべての必要情報が含まれているか）

  9.  **複数ノードからの情報統合の確認**
      - 達成目標: エラー通知に必要な情報が複数ソースから適切に統合されているか確認する
      - 具体例:
        - Error Trigger（基本情報）+ エラー情報整形（可読化情報）+ 重要度判定（severity）を統合
        - メインワークフローの実行コンテキスト + エラー詳細 + システム状態を統合
        - 通知先情報（Discord/Slack）+ エラー詳細 + 対応手順リンクを統合
      - 確認事項:
        - **情報の網羅性**: Error Triggerだけでは不足する情報（ユーザー情報、実行パラメータ等）を他ノードから取得
        - **複数ソース統合**: 以下の情報がすべて揃っているか
          - エラー基本情報（Error Trigger）
          - エラー発生コンテキスト（ワークフロー実行パラメータ）
          - システム状態（関連するデータの状態）
          - 対応情報（担当者、優先度、対応手順）
        - **統合タイミング**: エラー情報整形のCode Nodeで一度にすべての情報を統合
        - **通知メッセージ最適化**: 誰が見ても理解できる完全な情報を含む
      - 実装パターン:
        ```javascript
        // エラー情報整形Code Nodeでの複数ソース統合例
        const errorInfo = $json; // Error Triggerからの基本情報
        const workflowExecution = $json.execution; // 実行コンテキスト
        const failedNode = $json.node; // 失敗したノード情報

        // メインワークフローから追加情報を取得（可能な場合）
        const additionalContext = $input.all()[0]?.json || {};

        return {
          json: {
            // 統合されたエラー情報
            errorSummary: {
              workflowName: workflowExecution.workflowName,
              failedNodeName: failedNode.name,
              errorMessage: errorInfo.error.message,
              timestamp: new Date().toISOString(),
              executionId: workflowExecution.id,
              severity: determineSeverity(errorInfo),
              context: additionalContext,
              actionRequired: "エラーログを確認し、原因を特定してください"
            },
            // Discord通知用フォーマット
            discordMessage: formatForDiscord(errorInfo, workflowExecution, failedNode),
            // Slack通知用フォーマット
            slackMessage: formatForSlack(errorInfo, workflowExecution, failedNode)
          }
        };
        ```

  10. **すべてのノード間接続を明示的に定義**
  11. **メインワークフローと Error Workflow を紐付け**
  12. **接続の完全性を確認**
  13. **座標の重複チェック**: すべてのノードの position 座標を確認し、150px 以内に他のノードが存在しないことを検証

- 評価・判断基準:
  - エラー発生時に適切に通知・記録され、すべてのノードが接続されているか
  - すべてのノードの position 座標が適切に配置され、ノード間の最低間隔（水平 75px、垂直 60px）が確保されているか
  - ノードが重複しておらず、n8n プラットフォーム上でノード名、notes、接続線がすべて明確に読めるか
  - Error Workflow が 1 画面で全体を見渡せる範囲に収まっているか（推奨: 幅 1250px 以内、高さ 600px 以内）
- 出力テンプレート:

```json
{
  "name": "{{WORKFLOW_NAME}}",
  "nodes": [
    {
      "_comment": "【Sticky Note: エラーワークフロー全体説明】このワークフローは、メインワークフローでエラーが発生した際に自動的に起動され、エラー情報を整形して通知します。目的: システムの異常を即座に検知し、開発者やオペレーターに通知することで、迅速な対応を可能にすること。背景: 本番環境では、エラーを見逃すとビジネスに影響を与える可能性があります。自動通知により、24時間365日の監視体制を実現します。達成したいこと: エラー発生時に、誰が、いつ、どこで、何が起きたのかを明確に把握し、5分以内に対応を開始できる体制を構築すること。",
      "parameters": {
        "height": 400,
        "width": 600,
        "color": 2,
        "content": "# 【エラーワークフロー全体説明】\n\n## このワークフローに含まれるノード\n📌 全ノード一覧:\n  - {{ERROR_TRIGGER_NODE_NAME}}\n  - {{ERROR_FORMAT_NODE_NAME}}\n  - {{ERROR_SEVERITY_NODE_NAME}}\n  - {{ERROR_NOTIFICATION_NODE_NAMES}}\n  - {{ERROR_LOG_NODE_NAME}}\n\n例:\n- Error Trigger\n- エラー情報整形 (Code)\n- 重要度判定 (IF)\n- Discord管理者通知 (HTTP Request)\n- Discordユーザー通知 (HTTP Request)\n- エラーログ記録 (Write File)\n- Slack通知（オプション）\n- エラー統計更新（オプション）\n- Error Workflow完了 (NoOp)\n\n## このワークフローの目的\n{{ERROR_WORKFLOW_PURPOSE}}\n\n## 背景\n{{ERROR_WORKFLOW_BACKGROUND}}\n\n## 全体の流れ\n1. エラートリガー: メインワークフローでエラー発生を検知\n2. エラー整形: エラー情報を人間が読みやすい形式に変換\n3. 通知送信: Discord/Slackに即座に通知\n\n## 達成したいこと\n{{ERROR_WORKFLOW_GOAL}}\n\n## 重要性\n本番環境では必須のセーフティネット機能"
      },
      "id": "{{ERROR_STICKY_NOTE_UUID}}",
      "name": "Sticky Note - エラーワークフロー説明",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [{{ERROR_STICKY_X}}, {{ERROR_STICKY_Y}}]
    },
    {
      "_comment": "【Sticky Note: グループ1 - エラー検知グループ】このグループは、メインワークフローで発生したエラーを検知し、エラー情報を受け取ります。目的: ワークフロー実行中のあらゆるエラーを漏れなく捕捉すること。背景: Error Triggerは、メインワークフローの設定でError Workflowとして紐付けられ、エラー発生時に自動起動されます。達成したいこと: エラーの詳細情報(エラーメッセージ、スタックトレース、実行コンテキスト)を確実に取得すること。",
      "parameters": {
        "height": 300,
        "width": 400,
        "color": 2,
        "content": "# 【グループ1: エラー検知】\n\n## このグループに含まれるノード\n📌 {{ERROR_TRIGGER_NODE_NAME}}\n\n例: Error Trigger\n\n## 目的\n{{ERROR_GROUP1_PURPOSE}}\n\n## 背景\n{{ERROR_GROUP1_BACKGROUND}}\n\n## 取得する情報\n- エラーメッセージ\n- スタックトレース\n- 実行時刻\n- ワークフロー名\n- ノード名\n\n## 達成したいこと\n{{ERROR_GROUP1_GOAL}}\n\n## 次のステップ\n→ エラー整形グループへ"
      },
      "id": "{{ERROR_STICKY_NOTE_1_UUID}}",
      "name": "Sticky Note - エラー検知",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [{{ERROR_STICKY1_X}}, {{ERROR_STICKY1_Y}}]
    },
    {
      "parameters": {},
      "id": "{{ERROR_TRIGGER_UUID}}",
      "name": "{{ERROR_TRIGGER_NAME}}",
      "type": "n8n-nodes-base.errorTrigger",
      "typeVersion": 1,
      "position": [{{ERROR_TRIGGER_X}}, {{ERROR_TRIGGER_Y}}],
      "notes": "処理内容: メインワークフローでエラーが発生した際に自動起動\n入力: エラー情報(エラーメッセージ、スタックトレース、実行コンテキスト)\n出力: エラー情報をそのまま次のノードへ\n役割: エラーの検知と情報収集"
    },
    {
      "_comment": "【Sticky Note: グループ2 - エラー情報整形グループ】このグループは、生のエラー情報を人間が理解しやすい形式に変換します。目的: 技術的なエラー情報を、非エンジニアでも理解できる明確なメッセージに変換すること。背景: n8nのエラー情報は技術的で冗長なため、そのまま通知すると対応に時間がかかります。必要な情報だけを抽出し、見やすく整形することで、迅速な対応を可能にします。達成したいこと: エラー通知を見た瞬間に、何が問題で、どのノードで発生し、次に何をすべきかが分かるようにすること。",
      "parameters": {
        "height": 320,
        "width": 400,
        "color": 4,
        "content": "# 【グループ2: エラー情報整形】\n\n## このグループに含まれるノード\n📌 {{ERROR_FORMAT_NODE_NAME}}\n\n例: エラー情報整形 (Code)\n\n## 目的\n{{ERROR_GROUP2_PURPOSE}}\n\n## 背景\n{{ERROR_GROUP2_BACKGROUND}}\n\n## 整形する情報\n- ワークフロー名\n- エラーが発生したノード\n- エラーメッセージ(要約)\n- 発生時刻\n- 実行ID\n\n## 処理内容\n1. {{ERROR_GROUP2_STEP1}}\n2. {{ERROR_GROUP2_STEP2}}\n3. {{ERROR_GROUP2_STEP3}}\n\n## 達成したいこと\n{{ERROR_GROUP2_GOAL}}\n\n## 次のステップ\n→ 通知送信グループへ"
      },
      "id": "{{ERROR_STICKY_NOTE_2_UUID}}",
      "name": "Sticky Note - エラー情報整形",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [{{ERROR_STICKY2_X}}, {{ERROR_STICKY2_Y}}]
    },
    {
      "parameters": {
        "mode": "{{CODE_EXECUTION_MODE}}",
        "jsCode": "{{ERROR_FORMATTING_CODE}}"
      },
      "id": "{{ERROR_FORMAT_UUID}}",
      "name": "{{ERROR_FORMAT_NAME}}",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [{{ERROR_FORMAT_X}}, {{ERROR_FORMAT_Y}}],
      "notes": "処理内容: エラー情報をDiscord/Slack通知用に整形\n入力: Error Triggerからの生のエラー情報\n出力: 整形済みエラーメッセージ(タイトル、本文、タイムスタンプ、重要度)\n役割: エラー情報の可読性向上"
    },
    {
      "_comment": "【Sticky Note: グループ3 - エラー通知送信グループ】このグループは、整形されたエラー情報をDiscordやSlackに即座に送信します。目的: エラー発生を関係者に即座に通知し、迅速な対応を可能にすること。背景: エラーが発生しても誰も気づかなければ、問題は放置されます。Discord/Slackへのリアルタイム通知により、チーム全体がエラーを認識し、即座に対応できる体制を構築します。達成したいこと: エラー発生から1分以内に関係者のスマートフォンに通知が届き、5分以内に対応を開始できる体制を実現すること。",
      "parameters": {
        "height": 320,
        "width": 400,
        "color": 5,
        "content": "# 【グループ3: エラー通知送信】\n\n## このグループに含まれるノード\n📌 {{ERROR_NOTIFICATION_NODE_NAMES}}\n\n例:\n- 重要度判定 (IF)\n- Discord管理者通知 (HTTP Request / Discord)\n- ユーザー通知要否判定 (IF)\n- Discordユーザー通知 (HTTP Request / Discord)\n- Slack通知（オプション）(HTTP Request)\n\n## 目的\n{{ERROR_GROUP3_PURPOSE}}\n\n## 背景\n{{ERROR_GROUP3_BACKGROUND}}\n\n## 通知先\n- Discord: {{DISCORD_CHANNEL}}\n- Slack: {{SLACK_CHANNEL}}\n- その他: {{OTHER_NOTIFICATION}}\n\n## 通知内容\n- タイトル: エラー発生の明確な表示\n- 本文: 整形済みエラー情報\n- アクション: n8n管理画面へのリンク\n\n## 処理内容\n1. {{ERROR_GROUP3_STEP1}}\n2. {{ERROR_GROUP3_STEP2}}\n3. {{ERROR_GROUP3_STEP3}}\n\n## 達成したいこと\n{{ERROR_GROUP3_GOAL}}\n\n## 完了\nエラーハンドリング完了"
      },
      "id": "{{ERROR_STICKY_NOTE_3_UUID}}",
      "name": "Sticky Note - エラー通知送信",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [{{ERROR_STICKY3_X}}, {{ERROR_STICKY3_Y}}]
    },
    {
      "parameters": {
        "webhookUri": "={{NOTIFICATION_WEBHOOK_URI}}",
        "content": "{{NOTIFICATION_MESSAGE_TEMPLATE}}"
      },
      "id": "{{NOTIFICATION_UUID}}",
      "name": "{{NOTIFICATION_NAME}}",
      "type": "{{NOTIFICATION_NODE_TYPE}}",
      "typeVersion": {{NOTIFICATION_TYPE_VERSION}},
      "position": [{{NOTIFICATION_X}}, {{NOTIFICATION_Y}}],
      "notes": "処理内容: Discord/Slackにエラー通知を送信\n入力: 整形済みエラーメッセージ\n出力: 送信結果(成功/失敗)\n役割: エラー情報の即座な共有と関係者への通知"
    }
  ],
  "connections": {
    "{{ERROR_TRIGGER_NAME}}": {
      "main": [
        [
          {
            "node": "{{ERROR_FORMAT_NAME}}",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "{{ERROR_FORMAT_NAME}}": {
      "main": [
        [
          {
            "node": "{{NOTIFICATION_NAME}}",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "{{EXECUTION_ORDER}}",
    "timezone": "{{TIMEZONE}}"
  },
  "staticData": null,
  "tags": [],
  "pinData": {},
  "versionId": "{{VERSION_ID}}"
}

## 🏷️ Error Workflow の Sticky Note とコメントのガイドライン

### Sticky Note の配置ルール
1. エラーワークフロー全体説明: 1つ（ワークフロー全体の目的と重要性）
2. 各グループに1つのSticky Note: グループ1〜3の計3つ
3. 配置位置: 関連ノードの背景（左上）に配置
4. サイズ:
   - 全体説明: height 400, width 600 (大きめ)
   - 各グループ: height 300-320, width 400
5. 色分け: エラー関連であることを明確にする色を使用
   - 全体説明: color 2 (赤系 - エラーを想起)
   - グループ1 (エラー検知): color 2 (赤系)
   - グループ2 (エラー整形): color 4 (青系)
   - グループ3 (エラー通知): color 5 (緑系 - アクション完了)

### ノード配置の最適化ルール ⚠️ 重要
1. 水平間隔: 最低300px、推奨400-500px（ノード名が完全に読める）
2. 垂直間隔: 最低250px、推奨300-400px（接続線が明確に見える）
3. 分岐ノード（重要度判定、ユーザー通知要否判定）の後: 上下の分岐に各300px以上の間隔
4. Sticky Noteとノードの間隔: -100px程度（背景として適切）
5. 階層化: 垂直方向で分離
   - 上部（200〜400）: 管理者通知・ユーザー通知パス
   - 中部（500〜700）: メインフロー（エラー検知→整形→判定→ログ）
   - 下部（800〜1000）: オプション機能（Slack、統計）
6. 重複防止チェック: すべてのノードが重ならず、ノード名とnotesが完全に読める
7. 視認性最優先: Error Workflowは比較的小規模なので、1画面で全体が見渡せるよう配置
8. 座標の具体例:
```

Error Trigger: [400, 600]
エラー情報整形: [800, 600] // 水平に 400px 離す
重要度判定: [1200, 600] // さらに 400px 離す
Discord 管理者通知: [1600, 400] // 上部パスへ
エラーログ記録: [1600, 700] // 下部パスへ

````

### Sticky Note の内容構造
各Sticky Noteには必ず以下を含める（この順番で記述）:

1. このグループに含まれるノード 📌（最重要・最初に記載）:
- グループに属する全ノード名を箇条書きでリスト
- ノードタイプも括弧で明記（例: "エラー情報整形 (Code)", "Discord管理者通知 (HTTP Request)"）
- エラーワークフロー全体説明のSticky Noteには、全ノードのリストを含める
- 例を必ず含める

2. 目的: このグループが何のために存在するのか

3. 背景: なぜエラーハンドリングが重要なのか

4. 処理の流れ: エラー発生から通知までのステップ

5. 達成したいこと: エラー対応時間の短縮、迅速な問題解決

6. 重要性: 本番環境での必要性を強調

### ノードの`_comment`フィールド
各ノードの定義の最初に追加:
```json
"_comment": "【ノード種類】: エラー処理における役割を1-2行で記述。"
````

### ノードの`notes`フィールド

各ノードの最後に追加（エラー対応者向けの詳細説明）:

```json
"notes": "処理内容: {{エラー処理の詳細}}\n入力: {{エラー情報の内容}}\n出力: {{通知メッセージの形式}}\n役割: {{エラー対応における責任範囲}}"
```

### エラーワークフローのコメント記述のポイント

- 緊急性: エラー発生時の対応速度の重要性を強調
- 可読性: 深夜のエラー通知でも理解できる明確さ
- アクション指向: 「次に何をすべきか」を明確に示す
- 影響範囲: エラーがビジネスに与える影響を説明

---

✅ ユーザー確認: この接続検証結果をご確認ください。問題があれば修正します。

問題なければ、指定のディレクトリに成果物のワークフローを出力しますね。

```

```
