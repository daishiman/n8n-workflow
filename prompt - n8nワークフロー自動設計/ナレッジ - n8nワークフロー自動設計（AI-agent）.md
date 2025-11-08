# n8n AI Agent Node 徹底解説レポート

**最新の情報に基づき、n8n AI Agent Node の全機能、設定方法、実装例を網羅的に解説します。**n8n の AI Agent Node は、LangChain フレームワークをベースとした自律型 AI システムで、自然言語を理解し、複数のツールを使いこなし、複雑なタスクを自動実行できる強力なノードです。2024 年のバージョン 1.82.0 で大幅な仕様変更があり、全ての AI Agent が**Tools Agent**として統一されました。

## AI Agent Node の正体と進化の歴史

n8n AI Agent Node の正式な技術識別子は**@n8n/n8n-nodes-langchain.agent**で、「クラスターノード」と呼ばれるルートノード型のコンポーネントです。現在のバージョンは**Version 3（typeVersion: 3）**で、2024 年後半から 2025 年にかけて継続的に改善されています。

クラスターノードとは、ルートノード（AI Agent 本体）と複数のサブノード（Chat Model、Tools、Memory、Output Parser など）が連携して動作するノードグループのことです。この設計により、モジュール式の柔軟な構成が可能になっています。

2024 年 4 月のバージョン 1.82.0 では、従来 5 種類あったエージェントタイプ（Tools Agent、Conversational Agent、OpenAI Functions Agent、ReAct Agent、Plan and Execute Agent）が**Tools Agent**に統一されました。この変更により、最も推奨され頻繁に使用されていた Tools Agent のみがサポートされるようになり、インターフェースが大幅に簡素化されました。既存のワークフローで Tools Agent を使用していた場合は、そのまま動作します。

さらに 2025 年 4 月のバージョン 1.97.0 では、**AI Agent Tool**ノードが導入され、マルチエージェントオーケストレーション（複数の AI Agent を階層的に管理する仕組み）が 1 つのキャンバス上で実現できるようになりました。親エージェントが複数の専門エージェントに作業を委譲し、結果を統合するという複雑な構造を、サブワークフローを使わずに構築できます。

## サポートされている AI プロバイダーと認証設定

AI Agent Node は 10 以上の AI プロバイダーに対応しており、Chat Model サブノードを通じて接続します。各プロバイダーの詳細な設定方法を以下に示します。

### OpenAI（GPT-4o、GPT-3.5-turbo 等）

**認証方法**: API キー認証

**API キーの取得手順**：

1. https://platform.openai.com/signup/ でアカウント作成
2. https://platform.openai.com/api-keys で API キーページにアクセス
3. 「Create new secret key」をクリック
4. キーに名前を付ける（例：n8n-integration）
5. 生成されたキーをコピー

**n8n 設定項目**：

- **API Key**（必須）：取得した OpenAI API キーを貼り付け
- **Organization ID**（任意）：複数組織に所属している場合のみ必要（https://platform.openai.com/account/organization で確認）

**利用可能なモデル**：gpt-4o、gpt-4o-mini、gpt-4-turbo、gpt-3.5-turbo など。アカウントのアクセス権限に基づいてモデルリストが動的にロードされます。

**特徴**：カスタム Base URL をサポートしているため、OpenAI 互換 API も利用可能です。Web Search、MCP Servers、File Search、Code Interpreter などの組み込みツールも使えます。

### Anthropic Claude

**認証方法**: API キー認証

**API キーの取得手順**：

1. https://console.anthropic.com でアカウント作成
2. Settings → API Keys（https://console.anthropic.com/settings/keys）にアクセス
3. 「+ Create Key」をクリック
4. キーに名前を付ける
5. 「Copy Key」で取得

**n8n 設定項目**：

- **API Key**（必須）：取得した Anthropic の API キーを貼り付け

**利用可能なモデル**：Claude 3 ファミリー（Claude 3.7 Sonnet、Claude 4 Opus、Claude 4 Sonnet など）。アカウントのアクセス権限に基づいて動的にロードされます。

### Google Gemini

**認証方法**: Google AI Studio API キー

**API キーの取得手順**：

1. https://cloud.google.com/ で Google Cloud アカウント作成
2. Google Cloud プロジェクトを作成
3. https://aistudio.google.com/apikey にアクセス
4. 「Create API Key」をクリック
5. 新規または既存の Google Cloud プロジェクトを選択
6. 生成された API キーをコピー

**n8n 設定項目**：

- **API Host URL**：デフォルトは https://generativelanguage.googleapis.com
- **API Key**（必須）：取得した Google AI Studio API キーを貼り付け

**重要な注意点**：Google Gemini API は**カスタムホストやプロキシをサポートしていません**。デフォルトの API ホストを使用する必要があります。無料枠が用意されており、テストには十分なクォータが提供されています。

### Azure OpenAI

**認証方法**: API キーまたは Azure Entra ID（OAuth2）

**API キー認証の設定手順**：

1. Azure サブスクリプションを作成
2. Azure OpenAI へのアクセス権をリクエスト（必要な場合）
3. Azure OpenAI Service リソースをデプロイ
4. リソース名を取得
5. 「Keys and Endpoint」セクションから API Key（Key 1）を取得
6. API バージョンを確認

**n8n 設定項目**：

- **Resource Name**：Azure リソース名
- **API Key**：Azure ポータルから取得した Key 1
- **API Version**：適切なバージョンを選択

**注意点**：ノードでモデル名を指定する際は、**Deployment name**（デプロイメント名）を使用します。このノードは NO_PROXY 環境変数をサポートしていません。

### Mistral Cloud

**認証方法**: API キー認証

**API キーの取得手順**：

1. https://mistral.ai でアカウント作成
2. **支払い情報を追加し、支払いを有効化**（必須）
3. https://console.mistral.ai/api-keys にアクセス
4. 「Create new key」をクリック
5. API キーをコピー

**n8n 設定項目**：

- **API Key**（必須）：取得した Mistral API キーを貼り付け

**重要な注意点**：Mistral では**API キー生成のために支払いアクティベーションが必須**です。Safe Mode 機能により、不適切なコンテンツを防ぐことができます。

### Ollama（ローカル/セルフホスト）

**認証方法**: Basic 認証（任意）

**設定手順**：

1. ローカルまたはサーバーに Ollama をインストールして実行
2. 必要なモデルをプル（例：ollama pull llama2）
3. Ollama インスタンスの URL を確認

**n8n 設定項目**：

- **Base URL**：Ollama インスタンスのアドレス（デフォルト：http://localhost:11434）
- **Username**（任意）：Basic 認証用
- **Password**（任意）：Basic 認証用

**利用可能なモデル**：Ollama インスタンスにインストールされた全モデル（https://ollama.ai/library で利用可能なモデル一覧を確認可能）

**最適な用途**：セルフホスト型 AI ソリューション、ローカル開発、エアギャップ環境での利用に最適です。

### Groq

**認証方法**: API キー認証

**API キーの取得手順**：

1. https://groq.com でアカウント作成
2. https://console.groq.com/keys にアクセス
3. 「Create API Key」をクリック
4. 表示名を入力（例：n8n integration）
5. 「Submit」をクリックして生成されたキーをコピー

**n8n 設定項目**：

- **API Key**（必須）：取得した Groq API キーを貼り付け

**特徴**：API キーは組織に紐づけられます（個人ユーザーではない）。非常に高速な推論速度で知られています。

### その他のプロバイダー

- **Google Vertex AI**：Google Cloud のサービスアカウント（OAuth2）による認証。gemini-1.5-flash-001、gemini-1.5-pro-001 などのモデルに対応
- **OpenRouter**：OpenAI 互換 API で複数の AI プロバイダーにアクセス可能
- **Hugging Face**：API トークン（hf_xxx 形式）による認証で、数千のオープンソースモデルにアクセス

## 環境変数による認証情報管理

セルフホスト環境では、環境変数を使用して認証情報を管理できます。

### 方法 1：Credential Overwrites（推奨）

```bash
# 直接設定（本番環境には非推奨）
CREDENTIALS_OVERWRITE_DATA='{"openAiApi":{"apiKey":"sk-xxx"}}'

# ファイルから読み込み（推奨）
CREDENTIALS_OVERWRITE_DATA_FILE=/path/to/credentials.json

# RESTエンドポイント経由（最も安全）
CREDENTIALS_OVERWRITE_ENDPOINT=/credentials-overwrite
CREDENTIALS_OVERWRITE_ENDPOINT_AUTH_TOKEN=secure-token
```

### JSON フォーマット例

```json
{
  "openAiApi": {
    "apiKey": "sk-your-api-key",
    "organizationId": "org-xxx"
  },
  "anthropicApi": {
    "apiKey": "sk-ant-xxx"
  },
  "googleAi": {
    "apiKey": "AIzaSyXXX"
  }
}
```

### セキュリティのベストプラクティス

1. **認証情報をバージョン管理システムにコミットしない**
2. **機密データには\_FILE サフィックスを使用**して別ファイルに保存
3. **外部シークレット管理システムを使用**（HashiCorp Vault、AWS Secrets Manager など）
4. **N8N_ENCRYPTION_KEY を設定**（保存された認証情報を暗号化）
5. **CREDENTIALS_OVERWRITE_ENDPOINT を認証トークンと共に使用**して動的な認証情報ロードを実現

## AI Agent Node のパラメータと設定

### コアパラメータ（ノード設定）

#### **Prompt（プロンプト）** - 必須

- **タイプ**: ドロップダウン
- **選択肢**: 「Take from previous node automatically（前のノードから自動取得）」または「Define below（以下で定義）」
- **デフォルト**: 「Take from previous node automatically」
- **説明**: エージェントがユーザー入力を受け取る方法。自動取得モードでは、前のノードから`chatInput`フィールドを期待します

#### **Require Specific Output Format（特定の出力形式を要求）**

- **タイプ**: ブール値トグル
- **デフォルト**: OFF
- **説明**: 有効にすると、出力パーサーサブノードを接続するよう促されます。接続したパーサーに従って構造化された出力を強制します

### ノードオプション（詳細設定）

#### **System Message（システムメッセージ）**

- **タイプ**: 文字列（複数行テキスト）
- **デフォルト**: "You are a helpful assistant"
- **説明**: 会話前の指示でエージェントの振る舞い、個性、制約を定義します
- **データ型**: String

**ベストプラクティス例**：

```
あなたはAcme Corpのカスタマーサポートエージェントです。
プロフェッショナルで、共感的、簡潔な対応を心がけてください。
必要に応じて利用可能なツールを使用して注文情報を検索してください。
機密データを共有する前に必ず顧客の身元を確認してください。
```

#### **Max Iterations（最大反復回数）**

- **タイプ**: 数値（整数）
- **デフォルト**: 10
- **範囲**: 1 ～無制限（実用的な上限は約 50）
- **説明**: 停止するまでのエージェント実行サイクルの最大回数。無限ループを防ぎ、トークン使用量を制御します
- **データ型**: Integer

#### **Return Intermediate Steps（中間ステップを返す）**

- **タイプ**: ブール値トグル
- **デフォルト**: OFF
- **説明**: エージェントの推論ステップとツール呼び出しを出力に含めます
- **出力構造**: レスポンスに`intermediateSteps`配列を追加
- **用途**: デバッグ、ワークフロー改善、透明性向上

#### **Automatically Passthrough Binary Images（バイナリ画像を自動パススルー）**

- **タイプ**: ブール値トグル
- **デフォルト**: ON
- **説明**: バイナリ画像を画像タイプメッセージに自動変換します
- **要件**: ビジョン対応モデル（GPT-4o、Claude 3+など）が必要

#### **Enable Streaming（ストリーミングを有効化）**

- **タイプ**: ブール値トグル
- **デフォルト**: ON
- **説明**: エージェントが出力を生成する際にリアルタイムでレスポンスをストリーミング
- **要件**: Chat Trigger ノードまたは Webhook ノード（Response Mode = Streaming）
- **用途**: 長時間実行される生成処理、ユーザーエクスペリエンス向上

### LLM パラメータ（Chat Model 設定）

#### OpenAI Chat Model の主要パラメータ

**Sampling Temperature（サンプリング温度）**

- **範囲**: 0.0 ～ 2.0（OpenAI は最大 2.0 まで許可）
- **デフォルト**: 1.0
- **説明**: ランダム性/創造性を制御
  - 0.0-0.3: 決定論的、事実重視
  - 0.7: バランス型（推奨開始点）
  - 1.5-2.0: 創造的、多様性高、幻覚リスク増
- **データ型**: Float
- **注意**: temperature または top_p のどちらか一方のみを変更することを推奨

**Maximum Number of Tokens（最大トークン数）**

- **説明**: 応答の最大トークン数（レスポンス長を制限）
- **目安**: 英語テキストの場合、1 トークン ≈ 4 文字
- **データ型**: Integer

**Top P（ニュークリアスサンプリング）**

- **範囲**: 0.0 ～ 1.0
- **デフォルト**: 1.0
- **説明**: トークン選択のための累積確率閾値
  - 0.5: 確率質量の上位 50%を考慮
  - 1.0: すべてのトークンを考慮
- **ベストプラクティス**: temperature と top_p の両方ではなく、どちらか一方を調整

**Frequency Penalty（頻度ペナルティ）**

- **範囲**: 0.0 ～ 2.0
- **デフォルト**: 0.0
- **説明**: トークン頻度に基づく繰り返しを削減。高い値ほど繰り返しが少なくなります

**Presence Penalty（存在ペナルティ）**

- **範囲**: 0.0 ～ 2.0
- **デフォルト**: 0.0
- **説明**: 新しいトピックを促進。高い値ほど新しい話題について議論しやすくなります

**Response Format（レスポンス形式）**

- **選択肢**: "Text" | "JSON" | "JSON Schema"
- **デフォルト**: "Text"
- **説明**: 出力形式を強制。構造化データには**JSON Schema 推奨**

#### Anthropic Chat Model の主要パラメータ

**Sampling Temperature（サンプリング温度）**

- **範囲**: 0.0 ～ 1.0（Anthropic は OpenAI と異なる範囲を使用）
- **デフォルト**: 1.0
- **説明**: OpenAI の temperature と同様の機能

**Max Tokens to Sample（サンプリング最大トークン）**

- **説明**: レスポンスの最大長をトークン単位で指定

**Enable Thinking（思考を有効化）** - Claude 3.7 以降

- **説明**: 拡張思考/推論機能を有効化。特定のメッセージフォーマットが必要

## 入力データの渡し方と出力データの受け取り方

### 入力データの処理方法

#### 前のノードから自動取得

Chat Trigger ノードからの期待される構造：

```javascript
{
  "chatInput": "ユーザーのメッセージテキストがここに入ります"
}
```

#### 式を使用した手動入力

```javascript
// 前のノードのデータを参照
{
  {
    $json.message;
  }
}
{
  {
    $json.query;
  }
}
{
  {
    $("previous_node").item.json.userInput;
  }
}
```

#### サブノードでの式解決の注意点

**重要**: サブノード（Chat Model を含む）は式を異なる方法で解決します：

- **ルートノード**: すべてのアイテムを処理し、式は各アイテムごとに解決
- **サブノード**: 式は**常に最初のアイテムのみに解決**

### 出力データの構造と取得方法

#### デフォルトの出力形式

```json
[
  {
    "output": "エージェントのレスポンステキストがここに入ります"
  }
]
```

#### 中間ステップを有効化した場合

```json
[
  {
    "output": "最終レスポンス",
    "intermediateSteps": [
      {
        "action": "tool_call_name",
        "observation": "ツールからの結果"
      }
    ]
  }
]
```

#### 構造化出力パーサーを使用した場合

```json
[
  {
    "output": {
      "field1": "value1",
      "field2": "value2",
      "customStructure": "スキーマに従って解析"
    }
  }
]
```

### 次のノードでの出力アクセス

```javascript
// 基本的な出力アクセス
{
  {
    $json.output;
  }
}

// 構造化出力へのアクセス
{
  {
    $json.output.fieldName;
  }
}
{
  {
    $json.output.nestedObject.property;
  }
}

// 中間ステップへのアクセス
{
  {
    $json.intermediateSteps[0].action;
  }
}
{
  {
    $json.intermediateSteps[0].observation;
  }
}
```

## JSON での定義例と実装パターン

### 基本的な AI Agent Node 定義

```json
{
  "name": "AI Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "text": "={{ $('Chat Trigger').item.json.chatInput }}",
    "options": {
      "systemMessage": "You are a helpful assistant.",
      "maxIterations": 10
    },
    "promptType": "define"
  },
  "typeVersion": 1.7,
  "position": [800, 300]
}
```

### 完全なワークフロー例（シンプルなチャットエージェント）

```json
{
  "name": "シンプルAIチャットエージェント",
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [460, 300],
      "parameters": {
        "promptType": "auto",
        "options": {
          "systemMessage": "あなたは常にフレンドリーな態度で返答する親切なアシスタントです。"
        }
      }
    },
    {
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "position": [460, 480],
      "parameters": {
        "model": "gpt-4o-mini",
        "options": {
          "temperature": 0.7
        }
      },
      "credentials": {
        "openAiApi": {
          "id": "1",
          "name": "OpenAI account"
        }
      }
    },
    {
      "name": "Window Buffer Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.2,
      "position": [460, 100],
      "parameters": {
        "sessionKey": "chat_{{ $('Chat Trigger').first().json.sessionId }}"
      }
    }
  ],
  "connections": {
    "Chat Trigger": {
      "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]
      ]
    },
    "Window Buffer Memory": {
      "ai_memory": [[{ "node": "AI Agent", "type": "ai_memory", "index": 0 }]]
    }
  }
}
```

### 実用的なワークフローパターン

#### パターン 1: マルチツール Telegram ボット

**構成**: Telegram Trigger → AI Agent → OpenAI Model + Memory + Tools（HTTP Request、Telegram ノード）

**$fromAI()を使用したツール設定例**：

```json
{
  "name": "Send Document",
  "type": "@n8n/n8n-nodes-base.telegram",
  "parameters": {
    "resource": "message",
    "operation": "sendDocument",
    "chatId": "={{ $('Telegram Trigger').first().json.message.from.id }}",
    "document": "={{ $fromAI('url', '画像の有効なURL', 'string', ' ') }}"
  }
}
```

#### パターン 2: RAG（Retrieval-Augmented Generation）エージェント

**セットアップフェーズ**: Manual Trigger → Google Drive → Pinecone Vector Store → Embeddings Model

**チャットフェーズ**: Chat Trigger → AI Agent → OpenAI Model + Vector Store Tool

**Vector Store Tool 設定**：

```json
{
  "name": "Knowledge Base",
  "type": "@n8n/n8n-nodes-langchain.toolVectorStore",
  "parameters": {
    "description": "製品、ポリシー、手順に関する情報を会社のナレッジベースから検索します",
    "topK": 5
  }
}
```

### ベストプラクティス

#### プロンプトエンジニアリングのベストプラクティス

1. **明確な役割定義**：

```text
## 役割
あなたは[特定の役割]で、[ドメイン]の専門知識を持っています

## 機能
- エージェントができることをリスト
- 利用可能なツールを記載
- 境界を設定

## 振る舞い
- どのように応答するか
- トーンとスタイル
- エラー処理のアプローチ
```

2. **ツール説明の具体性**：各ツールをいつ使用するかを具体的に記述します

3. **コンテキスト管理**：

- セッション固有のメモリキーを使用：`chat_{{ $('Trigger').first().json.userId }}`
- 適切なウィンドウサイズを設定（チャットの場合 5-10、複雑なタスクの場合はより少なく）

4. **出力フォーマット**：一貫した JSON 応答のために構造化出力パーサーを使用

#### パフォーマンス最適化

1. **トークン使用量削減**：

   - LLM に送信する前にコンテキストを圧縮
   - 単純なタスクには小さなモデルを使用
   - 繰り返しクエリにキャッシングを実装

2. **モデル選択**：
   - GPT-4o: 複雑な推論、マルチモーダル
   - GPT-4o-mini: 高速、コスト効率的
   - Claude: 長いコンテキスト、分析
   - Gemini: 無料枠、良好なパフォーマンス

## Code Node と AI Agent Node の違い

### Code Node（コードノード）

**目的**: ワークフローステップとしてカスタム JavaScript または Python コードを実行

**主な使用ケース**：

- データ変換と操作
- カスタムビジネスロジック
- ループによる複数アイテムの処理
- 数学的計算
- JSON のパースと再構築

**主要機能**：

- 2 つの実行モード：「すべてのアイテムに対して 1 回実行」または「各アイテムに対して 1 回実行」
- JavaScript と Python をサポート
- 組み込みの n8n メソッドと変数にアクセス可能
- AI 推論なしで直接的なデータ操作が可能

**制限事項**：

- セキュリティ制限のあるサンドボックス環境で実行
- 外部 npm モジュールは n8n Cloud では利用不可（セルフホストのみ）
- ファイルシステムへのアクセスや HTTP リクエストを直接行えない
- 実行間で状態を保持しない（ステートレス）
- AI 推論や意思決定機能なし

### AI Agent Node（AI エージェントノード）

**目的**: 意思決定を行い、ツールを使用してタスクを完了する自律型 AI システム

**主な使用ケース**：

- 自然言語でのインタラクション
- 動的なツール選択と実行
- 複雑な意思決定ワークフロー
- マルチステップ推論タスク
- チャットベースのインターフェース

**主要機能**：

- LangChain フレームワークをベースに構築
- 複数のツールを接続可能（HTTP Request、Database、Custom Code など）
- メモリをサポート（Simple Memory またはデータベース経由）
- リアルタイムストリーミング応答
- どのツールを使用するかを自律的に決定

**制限事項**：

- Chat Model 接続が必須（OpenAI、Claude など）
- LLM プロバイダーのレート制限とトークン制限の対象
- Code Node より決定論的でない
- LLM 推論によるレイテンシが高い
- 幻覚や誤ったツール選択の可能性
- API コストによりより高価

### 使い分けのガイドライン

**Code Node を使用すべき場合**：

- 決定論的で予測可能な結果が必要
- AI 推論なしでデータ変換を実行
- 大規模データセットを効率的に処理
- カスタムビジネスロジックを記述
- 実行フローを完全に制御したい
- コストが主要な懸念事項（API 料金なし）
- 速度が重要（LLM レイテンシなし）

**AI Agent Node を使用すべき場合**：

- 自然言語理解が必要なタスク
- 動的な意思決定が必要
- 会話型インターフェースの構築
- 複雑なマルチステップ推論が必要
- ツール選択を自律的に行いたい
- 非構造化入力を扱う
- 多様なリクエストを柔軟に処理する必要

### ハイブリッドアプローチ

AI Agent で Custom Code Tool を使用することで、両方の利点を組み合わせることができます。AI がコードをいつ使用するかを決定し、コードは決定論的な操作を処理します。

## AI Agent Node の制約事項

### レート制限

レート制限とは、API プロバイダー（OpenAI、Claude など）によって課されるリクエスト頻度の制限です。

**一般的なレート制限エラー**：

- エラー 429: "Too many requests"
- "Rate limit reached for [model] in organization"
- "Rate limit exceeded: free-models-per-day"

**プロバイダー別の制限例**：

**OpenAI**：

- 無料枠: 3 リクエスト/分、40,000 トークン/分
- GPT-4o: 30,000 トークン/分（一般的な制限）
- サブスクリプション階層により異なる

**Claude（Anthropic）**：

- トークン制限はプランによって異なる
- 140k トークンのリクエストで制限に達することがよくある

**レート制限処理戦略**：

1. **Retry On Fail Method（失敗時に再試行）**：

   - ノードの Settings で有効化
   - 「Wait Between Tries (ms)」をレート制限期間より長く設定
   - 例：1 リクエスト/秒制限の場合は 1000ms

2. **Loop Over Items + Wait ノード**：

   - API 呼び出し前に入力アイテムをバッチ化
   - API 呼び出し後に Wait ノードを追加
   - 複数のアイテムを処理する際に効果的

3. **AI Agent のバッチ処理（組み込み）**：
   - AI Agent Tool ノードで利用可能
   - 並列処理のための「Batch Size」を設定
   - 「Delay Between Batches」をミリ秒単位で設定

### トークン制限

**コンテキストウィンドウの制約**：
各 LLM には最大トークン制限（コンテキストウィンドウ）があります

- GPT-4: バージョンにより 8k-128k トークン
- Claude: 100k-200k トークン
- 小型モデル: 4k-16k トークン

**トークン構成要素**：

- ユーザープロンプト
- システムメッセージ
- ツール説明
- メモリ/会話履歴
- ツールレスポンス
- エージェント推論ステップ

**一般的なトークン問題**：

- "This model's maximum context length is X tokens. However, your messages resulted in Y tokens"
- "Bad request - please check your parameters"
- ツールが大きな JSON レスポンスを返す際のデータ切り捨て

**トークン最適化戦略**：

1. **コンテキストサイズ削減**：

   - メモリウィンドウサイズを制限（Simple Memory）
   - 保持する最近のメッセージ数を削減
   - 履歴が不要な場合はコンテキストアイテムを 0 に設定

2. **データの前処理**：

   - AI に渡す前に大規模データセットを要約
   - 生データの代わりに集計を使用（例：768 行ではなく「Total Spend」）
   - HTML を Markdown に変換（トークンを大幅に削減）
   - コンテンツを最初の N 文字にトリミング

3. **メモリ管理**：
   - 構造化ストレージに PostgreSQL Chat Memory を使用
   - 呼び出しごとのトークン消費を監視
   - コンテキストトリミングを実装

### その他の注意点

**コスト考慮事項**：

- AI Agent Node: トークンごとに API コストが発生（入力+出力）
- Code Node: API コストなし（計算のみ）
- 大きなコンテキストウィンドウ = リクエストごとのコストが高い
- メモリは各インタラクションでトークン使用量を増加させる

**パフォーマンス制約**：

- AI Agent Node: LLM API 呼び出しによる高レイテンシ
- 複数の反復により応答時間が増加
- API プロバイダーへのネットワークレイテンシ
- クエリごとに複数のツール呼び出しが可能
- Max Iterations 設定により無限ループを防止

**セキュリティ考慮事項**：

- Code Node: サンドボックス環境で実行、制限された Node.js API
- AI Agent Node: データがサードパーティ API（OpenAI、Anthropic など）に送信される
- プロンプトインジェクション攻撃の可能性
- 適切に制約されていない場合、意図しないアクションを実行する可能性

## AI Agent Node に接続される主要サブノード群の詳細

AI Agent Node は単体では機能せず、複数のサブノードと連携して初めて完全な AI システムとして動作します。以下、各カテゴリのサブノードについて詳細に解説します。

---

## Memory Nodes（メモリノード群）

メモリノードは、会話履歴を保存・管理し、AI Agent にコンテキストを提供する重要なコンポーネントです。

### 1. Simple Memory（シンプルメモリ）

**正式名称**: `@n8n/n8n-nodes-langchain.memoryBufferWindow`

**旧名称**: Window Buffer Memory（バージョン 1.2 以前）

**概要**: ワークフローの実行中にチャット履歴をメモリ内に保持する最もシンプルなメモリ実装です。

**主要パラメータ**:

- **Session Key（セッションキー）**: 必須パラメータ。異なるユーザー/セッションを区別するための一意の識別子

  - Chat Trigger から自動取得: `={{ $('Chat Trigger').first().json.sessionId }}`
  - 手動指定の例: `chat_{{ $json.userId }}`
  - テスト用固定値: `my_test_session`

- **Context Window Length（コンテキストウィンドウ長）**: 保持する過去のインタラクション数
  - デフォルト: 5（最新の 5 往復の会話を保持）
  - 推奨範囲: 3-10（チャットボット）、1-3（タスク特化型エージェント）
  - 設定値が大きいほどトークン消費量が増加

**使用例**:

```json
{
  "name": "Simple Memory",
  "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
  "typeVersion": 1.2,
  "position": [460, 100],
  "parameters": {
    "sessionKey": "={{ $('Chat Trigger').first().json.sessionId }}",
    "contextWindowLength": 5
  }
}
```

**接続方法**:

- AI Agent Node の `ai_memory` コネクタに接続
- Chat Trigger Node の `ai_memory` コネクタにも接続（Load Previous Session 有効時）

**重要な制約事項**:

1. **Queue Mode 非互換**: n8n インスタンスがキューモードで動作している場合、本番環境では使用不可。リクエストが異なるワーカーに振り分けられる可能性があるため、メモリの一貫性が保証されません。
2. **永続性なし**: ワークフロー実行が終了するとメモリは消失。セッション間でデータを保持したい場合は、PostgreSQL/Redis/MongoDB Chat Memory を使用してください。
3. **複数メモリインスタンス**: 同じワークフローに複数の Simple Memory ノードを配置する場合、異なる Session Key を設定しないと、すべてが同じメモリインスタンスにアクセスします。

### 2. PostgreSQL Chat Memory（PostgreSQL チャットメモリ）

**正式名称**: `@n8n/n8n-nodes-langchain.memoryPostgresChat`

**概要**: PostgreSQL データベースに会話履歴を永続化するメモリ実装。本番環境での推奨メモリ方式です。

**主要パラメータ**:

- **Session Key**: Simple Memory と同様
- **Context Window Length**: 保持する過去のインタラクション数
- **Table Name（テーブル名）**: チャット履歴を保存する PostgreSQL テーブル名（デフォルト: `n8n_chat_histories`）

**認証情報**: PostgreSQL 認証情報が必要

**利点**:

- セッション間でデータが永続化される
- キューモードに対応
- 複数の n8n インスタンス間でメモリを共有可能
- 大規模なチャット履歴の管理が可能

**使用例**:

```json
{
  "name": "Postgres Chat Memory",
  "type": "@n8n/n8n-nodes-langchain.memoryPostgresChat",
  "typeVersion": 1,
  "position": [460, 100],
  "parameters": {
    "sessionKey": "={{ $('Chat Trigger').first().json.sessionId }}",
    "contextWindowLength": 10,
    "tableName": "chat_history"
  },
  "credentials": {
    "postgres": {
      "id": "1",
      "name": "PostgreSQL account"
    }
  }
}
```

### 3. Redis Chat Memory（Redis チャットメモリ）

**正式名称**: `@n8n/n8n-nodes-langchain.memoryRedisChat`

**概要**: Redis データベースに会話履歴を保存。高速アクセスが必要な場合に最適。

**特徴**:

- PostgreSQL よりも高速な読み書き
- TTL（Time To Live）設定により自動的に古いセッションを削除可能
- キューモード対応

**主要パラメータ**: PostgreSQL Chat Memory と同様

### 4. MongoDB Chat Memory（MongoDB チャットメモリ）

**正式名称**: `@n8n/n8n-nodes-langchain.memoryMongochat`

**概要**: MongoDB に会話履歴を保存。NoSQL ベースの柔軟なスキーマが必要な場合に使用。

### 5. Chat Memory Manager（チャットメモリマネージャー）

**正式名称**: `@n8n/n8n-nodes-langchain.memoryManager`

**概要**: メモリの内容を直接操作するための管理ノード。通常のワークフローではなく、メンテナンス用途で使用。

**操作モード**:

- **Get Messages**: 特定のセッションのメッセージ履歴を取得
- **Delete Messages**: 特定のセッションのメッセージを削除
- **Override All Messages**: セッション全体のメッセージを上書き（危険な操作）

**注意**: 同じメモリインスタンスにアクセスする複数のメモリノードがある場合、override 操作は全てに影響します。

---

## Tools Nodes（ツールノード群）

ツールノードは、AI Agent が外部システムと対話したり、特定の機能を実行したりするための手段を提供します。

### 1. Custom Code Tool（カスタムコードツール）

**正式名称**: `@n8n/n8n-nodes-langchain.toolCode`

**概要**: JavaScript コードを実行できるツール。AI エージェントに完全なプログラミング能力を与えます。

**主要パラメータ**:

- **Name**: ツールの名前（AI がツールを識別する際に使用）
- **Description**: ツールの説明（AI がいつこのツールを使うべきかを判断するための重要な情報）
  - 例: "Call this tool to calculate mathematical expressions. Input should be a valid math expression like '5 \* (3 + 2)'"
- **Code**: 実行する JavaScript コード
- **Specify Input Schema**: 入力スキーマを定義して AI に期待される入力形式を伝える

**コード例**:

```javascript
// 数学計算ツール
const expression = $input.first().json.query;
try {
  const result = eval(expression);
  return [{ json: { result: result, expression: expression } }];
} catch (error) {
  return [{ json: { error: error.message } }];
}
```

**ベストプラクティス**:

- Description を具体的かつ明確に記述（AI の判断精度が向上）
- 入力検証を含める（セキュリティとエラー防止）
- エラーハンドリングを実装

### 2. Calculator（計算機）

**正式名称**: `@n8n/n8n-nodes-langchain.toolCalculator`

**概要**: 数学計算専用のツール。Custom Code Tool よりも安全で、数式評価に特化。

**機能**:

- 四則演算
- べき乗、平方根
- 三角関数
- 対数関数

**使用例**:

```json
{
  "name": "Calculator",
  "type": "@n8n/n8n-nodes-langchain.toolCalculator",
  "typeVersion": 1,
  "position": [660, 480],
  "parameters": {
    "name": "calculator",
    "description": "Use this to perform mathematical calculations. Input should be a math expression."
  }
}
```

### 3. Call n8n Workflow Tool（n8n ワークフロー呼び出しツール）

**正式名称**: `@n8n/n8n-nodes-langchain.toolWorkflow`

**概要**: 他の n8n ワークフローを呼び出すツール。複雑なロジックをサブワークフローに分離できます。

**主要パラメータ**:

- **Name**: ツール名
- **Description**: ツールの説明（必須）
- **Workflow**: 呼び出すワークフローを選択
- **Fields to Send**: AI から受け取るパラメータの定義

**$fromAI()関数の使用**:

`$fromAI()`は、AI がツールのパラメータを動的に決定できる特殊な関数です。

**構文**:

```javascript
$fromAI(key, description, type, defaultValue);
```

**パラメータ**:

- `key`: パラメータ名
- `description`: AI に対する説明
- `type`: データ型（string, number, boolean, json）
- `defaultValue`: デフォルト値（オプション）

**使用例**:

```javascript
// Discordに画像を送信するツール
{
  "chatId": "={{ $('Telegram Trigger').first().json.message.from.id }}",
  "document": "={{ $fromAI('imageUrl', '画像の有効なURL', 'string', '') }}"
}
```

### 4. HTTP Request Tool（HTTP リクエストツール）

**概要**: n8n の通常の HTTP Request ノードをツールとして使用。外部 API を呼び出せます。

**使用パターン**:

- REST API からデータ取得
- Webhook へのデータ送信
- サードパーティサービスとの統合

**$fromAI()の活用例**:

```json
{
  "url": "https://api.example.com/users",
  "queryParameters": {
    "parameters": [
      {
        "name": "userId",
        "value": "={{ $fromAI('userId', 'ユーザーID', 'string') }}"
      }
    ]
  }
}
```

### 5. Vector Store Tool（ベクトルストアツール）

**正式名称**: `@n8n/n8n-nodes-langchain.toolVectorStore`

**概要**: ベクトルデータベースから関連ドキュメントを検索するツール。RAG（Retrieval-Augmented Generation）の中核。

**主要パラメータ**:

- **Name**: ツール名
- **Description**: 検索対象の説明（例: "会社のナレッジベースから製品情報を検索"）
- **Top K**: 返す結果の数（デフォルト: 4）

**接続先**: Pinecone Vector Store、Simple Vector Store、Qdrant 等の Vector Store ノード

**使用例**:

```json
{
  "name": "Knowledge Base Search",
  "type": "@n8n/n8n-nodes-langchain.toolVectorStore",
  "typeVersion": 1,
  "position": [660, 480],
  "parameters": {
    "name": "knowledge_base",
    "description": "製品ドキュメント、FAQ、ポリシーを検索します",
    "topK": 5
  }
}
```

### 6. その他の汎用ツール

n8n のほぼすべてのノードをツールとして使用可能です：

- **Database Nodes**: PostgreSQL、MySQL、MongoDB 等（データベースクエリ実行）
- **Communication Nodes**: Gmail、Slack、Discord、Telegram（メッセージ送信）
- **File Storage Nodes**: Google Drive、Dropbox、S3（ファイル操作）
- **CRM Nodes**: Salesforce、HubSpot（顧客データ管理）
- **その他 400 以上のノード**

---

## Chat Trigger & Response Nodes（チャットトリガーと応答ノード群）

### Chat Trigger Node（チャットトリガーノード）

**正式名称**: `@n8n/n8n-nodes-langchain.chatTrigger`

**概要**: チャットインターフェースからの入力を受け取り、ワークフローを開始するトリガーノード。

**主要パラメータ**:

#### 1. **Public（公開設定）**

- **ON**: ワークフローをアクティベート後、外部からアクセス可能
- **OFF**: n8n 内部のテストチャットからのみアクセス可能（開発時に推奨）

#### 2. **Mode（モード）**

- **Hosted Chat**: n8n が提供するホスト型チャットインターフェース（推奨）
  - 設定不要で即座に利用可能
  - Chat URL が自動生成される
- **Embedded Chat**: 独自のチャットインターフェースに埋め込む
  - `@n8n/chat` npm パッケージを使用
  - Webhook エンドポイントをカスタム UI から呼び出す

#### 3. **Authentication（認証）**

- **None**: 認証なし（誰でもアクセス可能）
- **Basic Auth**: ユーザー名とパスワードによる認証
- **n8n User Auth**: n8n アカウントでログインしたユーザーのみアクセス可能（Hosted Chat のみ）

#### 4. **Response Mode（レスポンスモード）**

**a) When Last Node Finishes（最終ノード完了時）**

- ワークフローの最後のノードの出力を自動的にチャットに返す
- 最もシンプルで推奨される方式
- AI Agent または Chain ノードの`output`フィールドを自動的に検出

**b) Using Response Nodes（レスポンスノード使用時）**

- Respond to Chat ノードまたは Respond to Webhook ノードで明示的に応答を制御
- 複数の応答を送信したい場合や、ヒューマンインザループが必要な場合に使用

**c) Streaming Response（ストリーミングレスポンス）**

- リアルタイムで AI の応答をストリーミング
- AI Agent Node で`Enable Streaming`を ON にする必要あり
- ユーザーエクスペリエンス向上（ChatGPT ライクな体験）

#### 5. **Initial Messages（初期メッセージ）**

- チャット開始時に表示するウェルカムメッセージ
- ボットの機能説明や使い方を記載

**例**:

```
こんにちは！カスタマーサポートボットです。
製品情報、注文状況、技術サポートについてお答えします。
何かお困りですか？
```

#### 6. **Load Previous Session（前回セッションの読み込み）**

- **Off**: セッションを読み込まない（毎回新しい会話）
- **From Memory**: メモリノードから前回の会話履歴を読み込む
  - この設定を有効にするには、Chat Trigger と AI Agent 両方を同じ Memory ノードに接続する必要あり

**JSON 定義例**:

```json
{
  "name": "Chat Trigger",
  "type": "@n8n/n8n-nodes-langchain.chatTrigger",
  "typeVersion": 1.1,
  "position": [240, 300],
  "parameters": {
    "public": true,
    "mode": "hostedChat",
    "authentication": "none",
    "responseMode": "lastNode",
    "options": {
      "title": "カスタマーサポート",
      "subtitle": "24時間対応AIアシスタント",
      "initialMessages": "こんにちは！何かお手伝いできることはありますか？",
      "loadPreviousSession": "memory"
    }
  },
  "webhookId": "unique-webhook-id"
}
```

### Respond to Chat Node（チャット応答ノード）

**正式名称**: `@n8n/n8n-nodes-langchain.respondToChat`

**概要**: Chat Trigger ノードと連携して、ワークフロー内から明示的にチャットに応答を送信するノード。

**使用条件**: Chat Trigger の Response Mode が "Using Response Nodes" である必要があります。

**主要パラメータ**:

- **Message**: チャットに送信するメッセージ
- **Wait for Response**: ユーザーの返信を待つかどうか

  - **ON**: ユーザーが返信するまでワークフロー実行を一時停止（Human-in-the-Loop）
  - **OFF**: メッセージを送信してすぐに次のノードへ進む

- **Commit to Memory**: メッセージをメモリに保存するかどうか

**Human-in-the-Loop（ヒューマンインザループ）の実装例**:

```json
{
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "parameters": {
        "responseMode": "responseNode"
      }
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent"
    },
    {
      "name": "確認メッセージ",
      "type": "@n8n/n8n-nodes-langchain.respondToChat",
      "parameters": {
        "message": "この操作を実行してもよろしいですか？ (はい/いいえ)",
        "waitForResponse": true
      }
    },
    {
      "name": "IF",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.chatInput }}",
              "operation": "contains",
              "value2": "はい"
            }
          ]
        }
      }
    }
  ]
}
```

---

## Output Parser Nodes（出力パーサーノード群）

出力パーサーは、AI の応答を構造化されたデータ形式に変換します。

### 1. Structured Output Parser（構造化出力パーサー）

**正式名称**: `@n8n/n8n-nodes-langchain.outputParserStructured`

**概要**: JSON Schema に基づいて AI の出力を構造化します。

**主要パラメータ**:

- **Schema Type（スキーマタイプ）**:
  - **Manual**: 手動で JSON Schema を定義
  - **From JSON Example**: サンプル JSON から自動的にスキーマを生成

**手動スキーマ定義例**:

```json
{
  "type": "object",
  "properties": {
    "customerName": {
      "type": "string",
      "description": "顧客の氏名"
    },
    "orderNumber": {
      "type": "string",
      "description": "注文番号"
    },
    "issueType": {
      "type": "string",
      "enum": ["配送遅延", "商品不良", "返品希望", "その他"],
      "description": "問い合わせの種類"
    },
    "urgency": {
      "type": "string",
      "enum": ["低", "中", "高"],
      "description": "緊急度"
    }
  },
  "required": ["customerName", "issueType"]
}
```

**使用例**:

```json
{
  "name": "Structured Output Parser",
  "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
  "typeVersion": 1.2,
  "position": [660, 480],
  "parameters": {
    "schemaType": "manual",
    "jsonSchema": "{ /* 上記のスキーマ */ }"
  }
}
```

**接続方法**: AI Agent Node または Chain Node の `ai_outputParser` コネクタに接続

**重要な注意事項**:

1. **Markdown Code Block 問題**: AI が応答に`json...`のようなマークダウンコードブロックを含めると、パースエラーが発生する場合があります。System Message で明示的に指示してください。

例:

````
あなたの応答は、マークダウンコードブロック（```）を使わず、純粋なJSONのみを返してください。
````

2. **必須フィールドの指定**: `required`配列で必須フィールドを明示すると、AI がそれらを必ず含めるようになります。

### 2. Item List Output Parser（アイテムリスト出力パーサー）

**正式名称**: `@n8n/n8n-nodes-langchain.outputParserItemList`

**概要**: AI の応答をリスト形式に分割します。

**主要パラメータ**:

- **Number of Items**: 返す最大アイテム数（-1 で無制限）
- **Separator**: 分割に使用する区切り文字（デフォルト: 改行）

**使用例**:

```json
{
  "name": "Item List Output Parser",
  "type": "@n8n/n8n-nodes-langchain.outputParserItemList",
  "typeVersion": 1,
  "position": [660, 480],
  "parameters": {
    "numItems": 10,
    "separator": "\n"
  }
}
```

**活用シーン**:

- ブレインストーミング（アイデアリスト生成）
- タスクリスト作成
- 製品/サービスの列挙

### 3. Auto-fixing Output Parser（自動修正出力パーサー）

**正式名称**: `@n8n/n8n-nodes-langchain.outputParserAutoFixing`

**概要**: 別の Output Parser と組み合わせて使用し、パースエラーが発生した場合に自動的に修正を試みます。

**仕組み**:

1. 内部の Output Parser（例: Structured Output Parser）でパース試行
2. エラーが発生した場合、LLM にエラー内容を送信
3. LLM が修正版の出力を生成
4. 再度パース試行

**接続方法**:

- AI Agent → Auto-fixing Output Parser → Structured Output Parser

**注意**: 追加の LLM 呼び出しが発生するため、コストとレイテンシが増加します。

---

## Document Loader & Text Splitter Nodes（ドキュメントローダーとテキスト分割ノード群）

これらのノードは、RAG（Retrieval-Augmented Generation）システムを構築する際に使用します。

### 1. Default Data Loader（デフォルトデータローダー）

**正式名称**: `@n8n/n8n-nodes-langchain.documentDefaultDataLoader`

**概要**: バイナリファイル（PDF、Word、テキスト等）からテキストを抽出します。

**サポート形式**:

- PDF
- DOCX、DOC
- TXT
- CSV
- その他のテキストベースファイル

**使用例**:

```json
{
  "name": "Default Data Loader",
  "type": "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
  "typeVersion": 1,
  "position": [460, 300]
}
```

**前段ノード**: Google Drive、HTTP Request、Read Binary File 等のバイナリデータを出力するノード

### 2. Recursive Character Text Splitter（再帰的文字テキスト分割）

**正式名称**: `@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter`

**概要**: 大きなドキュメントを小さなチャンクに分割します。

**主要パラメータ**:

- **Chunk Size（チャンクサイズ）**: 各チャンクの文字数

  - 推奨: 500-1500 文字
  - 小さすぎる: コンテキストが失われる
  - 大きすぎる: 検索精度が低下

- **Chunk Overlap（チャンクオーバーラップ）**: 隣接するチャンク間で重複させる文字数
  - 推奨: チャンクサイズの 10-20%
  - 例: チャンクサイズ 1000 の場合、オーバーラップ 100-200

**使用例**:

```json
{
  "name": "Recursive Character Text Splitter",
  "type": "@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter",
  "typeVersion": 1,
  "position": [660, 300],
  "parameters": {
    "chunkSize": 1000,
    "chunkOverlap": 200
  }
}
```

**チャンキング戦略のベストプラクティス**:

1. **セマンティック境界を尊重**: 段落や文の途中で切らないようにする
2. **メタデータの付与**: チャンクに元のドキュメント名、ページ番号等を付与
3. **コンテキスト保持**: オーバーラップを設定してコンテキストの連続性を確保

---

## Embeddings Nodes（埋め込みノード群）

埋め込みノードは、テキストをベクトル表現に変換します。

### 1. Embeddings OpenAI

**正式名称**: `@n8n/n8n-nodes-langchain.embeddingsOpenAi`

**概要**: OpenAI の埋め込みモデルを使用してテキストをベクトル化。

**推奨モデル**:

- **text-embedding-3-small**: コストパフォーマンスに優れる（62K トークン/$1）
- **text-embedding-3-large**: 最高精度（9.6K トークン/$1）
- **text-embedding-ada-002**: レガシーモデル（非推奨）

**ベクトル次元数**:

- text-embedding-3-small: 1536 次元
- text-embedding-3-large: 3072 次元

**使用例**:

```json
{
  "name": "Embeddings OpenAI",
  "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
  "typeVersion": 1,
  "position": [860, 300],
  "parameters": {
    "model": "text-embedding-3-small"
  },
  "credentials": {
    "openAiApi": {
      "id": "1",
      "name": "OpenAI account"
    }
  }
}
```

### 2. Embeddings Ollama（ローカル埋め込み）

**正式名称**: `@n8n/n8n-nodes-langchain.embeddingsOllama`

**概要**: Ollama を使用してローカルで埋め込みを生成（API コストゼロ）。

**推奨モデル**:

- `nomic-embed-text`: 英語に最適化
- `multilingual-e5-large`: 多言語対応
- `mxbai-embed-large`: 高精度

**使用例**:

```json
{
  "name": "Embeddings Ollama",
  "type": "@n8n/n8n-nodes-langchain.embeddingsOllama",
  "typeVersion": 1,
  "position": [860, 300],
  "parameters": {
    "model": "nomic-embed-text"
  }
}
```

---

## Vector Store Nodes（ベクトルストアノード群）

ベクトルストアは、埋め込みベクトルを保存・検索するデータベースです。

### 1. Pinecone Vector Store

**正式名称**: `@n8n/n8n-nodes-langchain.vectorStorePinecone`

**概要**: Pinecone クラウドベクトルデータベースとの統合。本番環境での推奨ベクトルストア。

**操作モード**:

#### a) Insert Documents（ドキュメント挿入）

- 新しいドキュメントをベクトルデータベースに追加
- 前段: Document Loader → Text Splitter → Embeddings
- メタデータも一緒に保存可能

#### b) Get Many（複数取得）

- プロンプトに類似したドキュメントを検索
- 類似度スコア付きで結果を返す
- 後段: 取得したドキュメントを処理

#### c) Retrieve Documents (As Vector Store for Chain/Tool)

- Chain または Tool で使用するためのドキュメント取得
- Vector Store Retriever ノードと組み合わせて使用

#### d) Retrieve Documents (As Tool for AI Agent)

- AI Agent のツールとして直接使用
- Agent がいつ Vector Store を使うかを自動判断

#### e) Update Documents（ドキュメント更新）

- ID を指定してドキュメントを更新

**主要パラメータ**:

- **Pinecone Index**: 使用する Pinecone インデックス名
- **Namespace**: データの論理的な区分け（オプション）
- **Top K**: 返す結果の数（デフォルト: 4）
- **Metadata Filter**: メタデータによるフィルタリング

**メタデータフィルタリング例**:

```json
{
  "metadataFilterField": [
    {
      "name": "category",
      "value": "製品マニュアル"
    },
    {
      "name": "language",
      "value": "ja"
    }
  ]
}
```

**JSON 定義例（Insert Documents）**:

```json
{
  "name": "Pinecone Vector Store",
  "type": "@n8n/n8n-nodes-langchain.vectorStorePinecone",
  "typeVersion": 1,
  "position": [1060, 300],
  "parameters": {
    "mode": "insert",
    "pineconeIndex": {
      "__rl": true,
      "value": "company-knowledge-base",
      "mode": "list"
    },
    "namespace": "product-docs"
  },
  "credentials": {
    "pineconeApi": {
      "id": "1",
      "name": "Pinecone account"
    }
  }
}
```

### 2. Simple Vector Store（シンプルベクトルストア）

**正式名称**: `@n8n/n8n-nodes-langchain.vectorStoreInMemory`

**概要**: n8n のメモリ内にベクトルを保存。テストや小規模プロジェクトに最適。

**特徴**:

- セットアップ不要
- 外部サービス不要
- メモリ内保存（ワークフロー停止で消失）
- 本番環境には非推奨

**メモリ管理**:

- メモリ圧力が高まると古いベクトルストアを自動削除
- 非アクティブなストアを自動クリーンアップ

**使用例**:

```json
{
  "name": "Simple Vector Store",
  "type": "@n8n/n8n-nodes-langchain.vectorStoreInMemory",
  "typeVersion": 1,
  "position": [1060, 300],
  "parameters": {
    "mode": "insert",
    "memoryKey": "company-docs"
  }
}
```

### 3. その他の Vector Stores

- **Qdrant**: オープンソースのベクトルデータベース
- **Supabase**: PostgreSQL ベースのベクトルストア
- **Chroma**: ローカルまたはクラウドで動作

---

## RAG ワークフローの完全な実装例

以下は、Google Drive から PDF を読み込み、Pinecone に保存し、チャットで質問に答える RAG システムの完全な例です。

### フェーズ 1: ドキュメントのインデックス化

```json
{
  "name": "RAG Document Indexing",
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [240, 300]
    },
    {
      "name": "Google Drive",
      "type": "n8n-nodes-base.googleDrive",
      "position": [440, 300],
      "parameters": {
        "operation": "download",
        "fileId": {
          "__rl": true,
          "value": "folder-id",
          "mode": "list"
        }
      }
    },
    {
      "name": "Default Data Loader",
      "type": "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
      "position": [640, 300]
    },
    {
      "name": "Recursive Character Text Splitter",
      "type": "@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter",
      "position": [840, 300],
      "parameters": {
        "chunkSize": 1000,
        "chunkOverlap": 200
      }
    },
    {
      "name": "Embeddings OpenAI",
      "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
      "position": [1040, 480],
      "parameters": {
        "model": "text-embedding-3-small"
      }
    },
    {
      "name": "Pinecone Vector Store",
      "type": "@n8n/n8n-nodes-langchain.vectorStorePinecone",
      "position": [1040, 300],
      "parameters": {
        "mode": "insert",
        "pineconeIndex": "company-docs"
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "Google Drive", "type": "main", "index": 0 }]]
    },
    "Google Drive": {
      "main": [[{ "node": "Default Data Loader", "type": "main", "index": 0 }]]
    },
    "Default Data Loader": {
      "main": [
        [
          {
            "node": "Recursive Character Text Splitter",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Recursive Character Text Splitter": {
      "main": [
        [{ "node": "Pinecone Vector Store", "type": "main", "index": 0 }]
      ]
    },
    "Embeddings OpenAI": {
      "ai_embedding": [
        [
          {
            "node": "Pinecone Vector Store",
            "type": "ai_embedding",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### フェーズ 2: チャットインターフェース

```json
{
  "name": "RAG Chat Interface",
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "position": [240, 300],
      "parameters": {
        "public": true,
        "mode": "hostedChat",
        "options": {
          "title": "ドキュメント検索チャット",
          "initialMessages": "何かお調べしますか？",
          "loadPreviousSession": "memory"
        }
      }
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "position": [440, 300],
      "parameters": {
        "promptType": "auto",
        "options": {
          "systemMessage": "あなたはドキュメント検索アシスタントです。ナレッジベースから関連情報を検索して回答してください。"
        }
      }
    },
    {
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "position": [440, 480],
      "parameters": {
        "model": "gpt-4o-mini"
      }
    },
    {
      "name": "Simple Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "position": [440, 100],
      "parameters": {
        "sessionKey": "={{ $('Chat Trigger').first().json.sessionId }}",
        "contextWindowLength": 5
      }
    },
    {
      "name": "Vector Store Tool",
      "type": "@n8n/n8n-nodes-langchain.toolVectorStore",
      "position": [640, 480],
      "parameters": {
        "name": "knowledge_base",
        "description": "会社のドキュメントからを検索します",
        "topK": 5
      }
    },
    {
      "name": "Pinecone Vector Store",
      "type": "@n8n/n8n-nodes-langchain.vectorStorePinecone",
      "position": [840, 480],
      "parameters": {
        "mode": "retrieve",
        "pineconeIndex": "company-docs"
      }
    },
    {
      "name": "Embeddings OpenAI",
      "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
      "position": [840, 660],
      "parameters": {
        "model": "text-embedding-3-small"
      }
    }
  ],
  "connections": {
    "Chat Trigger": {
      "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          { "node": "AI Agent", "type": "ai_memory", "index": 0 },
          { "node": "Chat Trigger", "type": "ai_memory", "index": 0 }
        ]
      ]
    },
    "Vector Store Tool": {
      "ai_tool": [[{ "node": "AI Agent", "type": "ai_tool", "index": 0 }]]
    },
    "Pinecone Vector Store": {
      "ai_vectorStore": [
        [{ "node": "Vector Store Tool", "type": "ai_vectorStore", "index": 0 }]
      ]
    },
    "Embeddings OpenAI": {
      "ai_embedding": [
        [
          {
            "node": "Pinecone Vector Store",
            "type": "ai_embedding",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

## まとめと推奨事項

n8n AI Agent Node は、LangChain フレームワークをベースにした強力で柔軟な自律型 AI システム構築プラットフォームです。**主要な成果**：

**多様な LLM プロバイダーサポート** - OpenAI、Anthropic、Google、Groq、Mistral、Azure、Ollama（ローカル）など 10 以上のプロバイダーに対応しています。

**400 以上のツール統合** - HTTP Request、Database、Gmail、Slack など、n8n の全ノードを AI エージェントのツールとして使用可能です。

**高度なカスタマイズ** - temperature、max tokens、system message など、詳細なパラメータ設定により、用途に応じた最適化が可能です。

**包括的なメモリ管理** - Simple Memory（開発用）、PostgreSQL/Redis/MongoDB Chat Memory（本番用）により、あらゆるスケールでの会話履歴管理が可能です。

**柔軟なツールシステム** - Custom Code Tool、Calculator、Vector Store Tool、Call Workflow Tool、さらには任意の n8n ノードをツールとして使用でき、無限の拡張性を持ちます。

**完全な RAG サポート** - Document Loader、Text Splitter、Embeddings、Vector Store の完全なエコシステムにより、高度な知識ベースシステムを構築できます。

**構造化出力** - Structured Output Parser、Item List Output Parser、Auto-fixing Output Parser により、AI の出力を確実にアプリケーションで利用可能な形式に変換できます。

**本番環境での実用性** - バージョン 1.82.0 で Tools Agent に統一され、バージョン 1.97.0 でマルチエージェントオーケストレーションが追加されるなど、継続的な改善により本番環境での使用に最適化されています。

**効率的な開発プロセス**: シンプルなパターンから始め、Chat Trigger と基本的なツールで動作を確認し、徐々に複雑さを追加していくことを推奨します。ビジュアルインターフェースにより迅速なプロトタイピングが可能で、組み込みのチャットインターフェースとログによるデバッグも容易です。

**コスト最適化**: 適切なモデル選択（単純なタスクには GPT-4o-mini、複雑な推論には GPT-4o）、キャッシングの実装、トークン使用量の監視により、コストを効果的に管理できます。

**スケーラビリティ**: Simple Memory と Simple Vector Store で開発を開始し、本番環境では PostgreSQL Chat Memory と Pinecone Vector Store に移行することで、シームレスなスケーリングが可能です。

n8n のビジュアルワークフロー構築、豊富な統合、強力な AI 機能の組み合わせにより、迅速なプロトタイピングから本番デプロイまで、AI エージェント開発に最適なプラットフォームとなっています。
