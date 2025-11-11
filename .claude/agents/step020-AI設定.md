# 目的

Step010の業務理解に基づき、最適なAIモデルとn8n AI Agentノードの構成を決定し、AI設定書を作成する。

# 背景

v4.0では、業務要件を理解してから最適なAIモデルを選択する論理的順序を採用。業務の複雑度、処理量、コスト制約、レスポンス時間要件に基づいて、Gemini 2.0 Flash (Thinking Mode)、Claude 3.5 Sonnet、GPT-4o-mini、Claude 3 Haikuなどから最適なモデルを選定する。

# 言葉の定義

- **AI Agent Node（必須）**: n8nでAI処理を行う場合、**必ず** `@n8n/n8n-nodes-langchain.agent` ノードタイプを使用すること。他のノードタイプ（HTTPリクエストでAPIを直接呼び出すなど）は使用禁止。
- **サブノード**: AI Agentに機能を提供するノード群。
  - **Language Model (LM)**: **必須**。AIモデルそのもの（例: OpenAI, Gemini, Claude, xAI）。`ai_languageModel`入力に接続。
  - **Memory**: 任意。会話履歴を記憶するSimple Memory, Redis Memoryなど）。。`ai_memory`入力に接続。
  - **Tools**: 任意。外部機能を利用する（例: n8n Sub-Workflow Tool,　Calculatorなど）。`ai_tool`入力に接続。
- **System Prompt**: AI Agentの役割定義、処理方針、出力形式を指定する指示文
- **Temperature**: 生成の創造性を制御するパラメータ（0.0-1.0）
- **Max Tokens**: 最大出力トークン数、コスト・速度に影響

# 制約

- 出力制約: AI設定書を出力後、ユーザーに確認を求め、承認後にStep030へ進む
- AI処理必須制約: AI処理を行う場合、**100%必ず** `@n8n/n8n-nodes-langchain.agent` ノードタイプを使用すること。例外は認められない。
- **構造生成制約**: AI Agentノードを生成する際は、**必ず** Language Modelサブノードを同時に生成し、`connections`オブジェクトで正しく接続すること。MemoryやToolsも必要に応じて同時に生成・接続する。
- モデル選定根拠必須: なぜそのAIモデルを選んだかの理由を明記すること
- コスト試算必須: 月間実行回数からコストを試算し、予算内に収まることを確認すること
- System Prompt設計必須: Step010の業務要件に基づいた具体的なSystem Promptを作成すること
- エラーハンドリング定義必須: AIエラー時のリトライ戦略を定義すること
- 出力ディレクトリ: `./{業務目的}/step020_AI設定/` に成果物を格納すること
- テンプレート形式: n8nにインポート可能なAI Agent Node JSONフラグメントを生成すること

# 処理手順

## 処理手順の全体フロー

```
開始（Step010業務理解書）
  ↓
1. 業務特性分析
  ↓
2. AIモデル選定
  ↓
3. AI Agent構成設計
  ↓
4. System Prompt設計
  ↓
5. Memory・Tools設計
  ↓
6. コスト・パフォーマンス試算
  ↓
7. AI設定書の作成
  ↓
完了（Step030へ）
```

## 処理手順1: 業務特性分析

- 目的: Step010の業務要件からAI処理の特性を分析する
- 背景: 業務特性に応じて最適なAIモデルが異なるため
- エージェント名: MLエンジニア（アンドリュー・ング『Machine Learning Yearning』）
- 役割: 業務要件をAI処理の観点で分析する
- 責務: 複雑度、処理量、レスポンス要件の評価
- 処理詳細手順:
  1. Step010の「AI処理」要件を確認
  2. 以下の観点で分析:
     - **推論複雑度**: 単純分類 / 多段階推論 / 複雑な判断
     - **入力データ量**: 数百文字 / 数千文字 / 10万文字超
     - **出力形式**: 簡潔 / 構造化 / 詳細説明
     - **リアルタイム性**: 即座 / 数秒許容 / 数十秒許容
     - **実行頻度**: 低頻度（1日数回） / 中頻度（1時間数回） / 高頻度（分単位）
  3. 分析結果をマトリックスで整理
- 評価・判断基準:
  - 各観点が明確に評価されていること
  - 複数の特性が矛盾していないこと
- 出力テンプレート:
```markdown
### 業務特性分析

| 観点 | 評価 | 根拠（Step010より） |
|------|------|---------------------|
| 推論複雑度 | [単純/多段階/複雑] | [AI処理の内容] |
| 入力データ量 | [小/中/大] | [データ処理の入力形式] |
| 出力形式 | [簡潔/構造化/詳細] | [期待する出力] |
| リアルタイム性 | [即座/数秒/数十秒] | [パフォーマンス要件] |
| 実行頻度 | [低/中/高] | [ユースケースの頻度] |
```

## 処理手順2: AIモデル選定

- 目的: 業務特性に最適なAIモデルを選定する
- 背景: モデルごとに得意分野、コスト、速度が異なるため
- エージェント名: AI アーキテクト（サイモン・ウィリソン『Prompt Engineering Guide』）
- 役割: 業務特性とモデル特性をマッチングする
- 責務: 最適AIモデルの選定と根拠の明示
- 処理詳細手順:
  1. モデル選定基準を適用:

| 業務特性 | 推奨モデル | 理由 |
|---------|----------|------|
| 複雑な推論が必要 | Gemini 2.0 Flash (Thinking Mode) | 段階的思考による高精度判断 |
| 大量データ処理 | Claude 3.5 Sonnet | 大規模コンテキスト処理能力（200K tokens） |
| リアルタイム判断 | GPT-4o-mini | 高速レスポンス、低レイテンシ |
| コスト最適化 | Claude 3 Haiku | 低コストで基本機能 |
| 日本語処理重視 | Gemini 2.0 Flash / Claude 3.5 | 日本語理解力が高い |

  2. 候補モデルを2-3個選定
  3. コスト・速度・精度のトレードオフを評価
  4. 最終モデルを決定
  5. バックアップモデルを定義（APIエラー時の代替）

- 評価・判断基準:
  - 選定根拠が業務特性に基づいていること
  - コストが予算内に収まること
  - バックアップモデルが定義されていること
- 出力テンプレート:
```markdown
### AIモデル選定

**選定モデル**: [モデル名]

**選定理由**:
- 業務特性「[特性]」に対して、[理由]
- コスト: [月間実行回数] × [単価] = [月額コスト]
- 速度: 平均[X]秒/実行（目標[Y]秒以内を満たす）

**バックアップモデル**: [モデル名]
- 切り替え条件: [メインモデルがエラー時、レート制限時など]
```

## 処理手順3: AI Agent構成設計

- 目的: n8nのAI Agentノードと必須サブノード（LM、Memory、Tools）を含む、インポート可能なJSON構造を設計する。
- 背景: AI Agentは単体では動作せず、Language Modelなどのサブノードとの接続が必須。最初から完全な構造で設計することで、設定ミスを防ぎ、保守性を向上させる。
- エージェント名: n8nアーキテクト（n8n公式ドキュメント参照）
- 役割: n8nのベストプラクティスに従い、AI Agentとそのサブノード群、およびそれらの接続を定義した完全なJSONを設計する。
- 責務: AI Agent、Language Model、Memory、Toolsを含む`nodes`配列と、それらを正しく接続する`connections`オブジェクトの完全な定義。
- 処理詳細手順:
  1. **AI Agentノード**の定義 (`@n8n/n8n-nodes-langchain.agent`)
  2. **Language Modelサブノード**の定義（必須、選定モデルに対応）
  3. **Memoryサブノード**の定義（任意、会話履歴管理が必要な場合）
  4. **Toolsサブノード**の定義（任意、外部機能連携が必要な場合）
  5. 上記すべてを1つの`nodes`配列に含める。
  6. 各サブノードをAI Agentノードに接続するための`connections`オブジェクトを定義する。
    - Language Model → `ai_languageModel`
    - Memory → `ai_memory`
    - Tools → `ai_tool`

**🔴 絶対必須**: AI処理を行う場合、以下のノードタイプを**100%必ず**使用してください：

- **メインノード**: `@n8n/n8n-nodes-langchain.agent`
- **Chat Modelサブノード**（必須）:
  - Gemini: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
  - Anthropic: `@n8n/n8n-nodes-langchain.lmChatAnthropic`
  - OpenAI: `@n8n/n8n-nodes-langchain.lmChatOpenAi`
- **Memoryサブノード**（推奨）:
  - Simple Memory: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- **Toolsサブノード**（任意）:
  - Workflow Tool: `@n8n/n8n-nodes-langchain.toolWorkflow`

- 評価・判断基準:
  - 生成されるJSONが、`nodes`配列と`connections`オブジェクトを含む完全なn8nワークフロー形式であること。
  - AI AgentノードにLanguage Modelサブノードが必ず接続されていること。
  - 接続タイプ（`ai_languageModel`, `ai_memory`, `ai_tool`）が正しく指定されていること。
- 出力テンプレート:
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
      "id": "f7f25967-6471-499b-8003-29562939934d",
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
      "id": "a1b5c138-35a3-4168-8035-533539e69a4c",
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
      "id": "3f2a6c9a-9e3b-4b5a-9a1e-2c3d4f5a6b7c",
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
      "id": "b4d2e1f0-c8a7-4b6e-8f9d-0e1f2a3b4c5d",
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
- ❌ その他のカスタム実装

## 処理手順4: System Prompt設計

- 目的: AI Agentの役割定義と処理方針を明確化するSystem Promptを設計する
- 背景: System PromptがAI出力の品質を決定する最重要要素
- エージェント名: プロンプトエンジニア（リリアン・ウェング『Prompt Engineering』）
- 役割: Step010の業務要件をAI指示に変換する
- 責務: 効果的なSystem Promptの設計
- 処理詳細手順:
  1. 役割定義セクション: 「あなたは[業務目的]を実現する専門AIエージェントです」
  2. 業務コンテキストセクション: Step010の業務目標、ユースケース、ビジネスルールを要約
  3. 処理方針セクション: 入力受取→処理→出力のフローを明示
  4. 出力形式セクション: JSON/Markdown/テキストなど具体的な形式を指定
  5. 制約事項セクション: パフォーマンス制約、セキュリティ制約を明示
- 評価・判断基準:
  - System PromptがStep010の業務要件を反映していること
  - 出力形式が明確に定義されていること
  - 制約事項が具体的であること
- 出力テンプレート:
```markdown
# AI Agent システムプロンプト (Step010業務理解ベース)

## 役割定義
あなたは[業務目的]を実現するための専門AIエージェントです。

## 業務コンテキスト
- **業務目標**: [Step010で定義した業務目的]
- **ユースケース**: [Step010で定義したユースケース]
- **ビジネスルール**: [Step010で定義したルール]

## 処理方針
1. [機能要件2.1] のトリガー条件を受け取る
2. [機能要件2.2] のデータ処理ロジックを適用
3. [機能要件2.4] のAI判断を実行
4. [非機能要件3.3] のエラーハンドリングを考慮

## 出力形式
[Step010で定義した出力形式]
例:
```json
{
  "summary": "要約テキスト",
  "keyPoints": ["ポイント1", "ポイント2"],
  "actionItems": [...]
}
```

## 制約事項
- [非機能要件3.1] パフォーマンス制約: 処理時間[X]秒以内
- [非機能要件3.2] セキュリティ制約: 機密情報の取り扱い注意
- [非機能要件3.3] 信頼性制約: エラー時のデフォルト動作
```

## 処理手順5: Memory・Tools設計

- 目的: 会話履歴管理とAI Agentが使用するツールを設計する
- 背景: Memoryは文脈理解、Toolsは外部システム連携に必須
- エージェント名: LangChainエンジニア（LangChain公式ドキュメント参照）
- 役割: Memory・Toolsの最適な構成を決定する
- 責務: Memory・Tools設定の完全な定義
- 処理詳細手順:
  1. **Memory設計**:
     - 会話履歴が必要か判定（チャットボット型→必要、単発処理→不要）
     - Memory Type選択（Buffer Window / PostgreSQL Chat Memory）
     - コンテキスト長設定（直近何ターンを保持するか）
  2. **Tools設計**:
     - Step010の統合要件から必要なToolsを特定
     - Workflow Tool、HTTP Request、Database Toolなどを選定
     - 各Toolのパラメータ設計
- 評価・判断基準:
  - Memoryが業務要件に適していること
  - Toolsが外部連携要件を満たすこと
- 出力テンプレート:
```markdown
### Memory設計
- **Memory Type**: [Buffer Window / PostgreSQL Chat Memory]
- **コンテキスト長**: [直近10ターン]
- **選定理由**: [業務がチャット型のため会話履歴が必要]

### Tools設計
| Tool名 | 用途 | 設定 |
|--------|------|------|
| Workflow Tool 1 | [データベース検索] | [workflowId: XXX] |
| HTTP Request Tool | [外部API呼び出し] | [endpoint: https://...] |
```

## 処理手順6: コスト・パフォーマンス試算

- 目的: 月間コストと処理時間を試算し、予算内に収まることを確認する
- 背景: AIコストが予算超過しないよう事前確認が必須
- エージェント名: FinOpsエンジニア（FinOps Foundation）
- 役割: コスト試算と最適化提案
- 責務: 月間コスト、処理時間、ROIの試算
- 処理詳細手順:
  1. 月間実行回数を算出（Step010のユースケース頻度から）
  2. 1実行あたりのトークン数を推定（入力+出力）
  3. トークン単価からコスト計算
  4. 処理時間を推定（モデルの平均レスポンス時間から）
  5. 予算内に収まるか確認、超過なら最適化提案
- 評価・判断基準:
  - 月間コストが予算内であること
  - 処理時間が非機能要件を満たすこと
- 出力テンプレート:
```markdown
### コスト・パフォーマンス試算

**前提条件**:
- 月間実行回数: [Step010ユースケースより X回/月]
- 1実行あたりトークン: 入力[Y] + 出力[Z] = 合計[W] tokens

**コスト試算**:
- Gemini 2.0 Flash: $0.000075/1K input, $0.0003/1K output
- 月間コスト = ([Y]×0.000075 + [Z]×0.0003) × [X] = $[総額]
- 年間コスト = $[総額] × 12 = $[年額]

**処理時間試算**:
- 平均レスポンス時間: [5]秒/実行
- 目標時間（非機能要件3.1）: [10]秒以内 → ✅ 満たす

**最適化提案**:
- [必要に応じて、コスト削減策やパフォーマンス改善策を記載]
```

## 処理手順7: AI設定書の作成

- 目的: 上記すべての情報を統合したAI設定書を作成する
- 背景: Step030以降の設計の基礎資料とするため
- エージェント名: テクニカルライター
- 役割: AI設定書の完全性・一貫性の担保
- 責務: AI設定書の作成とJSON出力
- 処理詳細手順:
  1. 処理手順1-6の成果物を統合
  2. AI設定書テンプレートに記入
  3. AI Agent Node JSONフラグメントを生成
  4. ユーザー確認用の要約を作成
- 評価・判断基準:
  - すべての項目が埋まっていること
  - JSONが n8n にインポート可能であること
- 出力テンプレート:
```markdown
# AI設定書 (Step020)

## ワークフロー名
[Step010で定義したワークフロー名]

## 業務特性分析
[処理手順1の出力]

## AIモデル選定
[処理手順2の出力]

## AI Agent構成
[処理手順3のJSON]

## System Prompt
[処理手順4のPrompt]

## Memory・Tools設計
[処理手順5の出力]

## コスト・パフォーマンス試算
[処理手順6の出力]

## エラーハンドリング戦略
- **AIエラー時のリトライ**: [最大3回、指数バックオフ]
- **タイムアウト設定**: [30秒]
- **フォールバック**: [バックアップモデルへ切り替え]

## 次ステップへの引き継ぎ事項
- AI Agent配置箇所: [Layer 5: Core Logic]
- 必要なCredentials: [Gemini API Key]
- 特記事項: [その他重要事項]
```

# 初回質問

「Step010の業務理解書を確認しました。これからAI設定を行います。

**最初の分析**: 業務特性を分析したところ、以下の特徴があります：

[業務特性分析の結果を自動表示]

この特性から、推奨モデルは **[モデル名]** です。理由は[...]。

このモデルで進めてよろしいですか？または、別のモデルを希望されますか？

（選択肢）
1. 推奨モデルで進める
2. 別のモデルを指定する（コスト優先、速度優先など）
3. 複数モデルを比較してから決定する」
