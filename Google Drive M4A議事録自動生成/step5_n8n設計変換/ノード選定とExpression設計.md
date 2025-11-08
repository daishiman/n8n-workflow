# Step5: n8n設計変換フェーズ - 完了

## n8nノード選定とExpression設計

各タスクに最適なn8nノードタイプを選定し、Expression（動的データアクセス式）を設計しました。

---

## 📋 レイヤー別ノード選定

### Layer 1: Trigger Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N001 | Google Drive Trigger | `@n8n/n8n-nodes-base.googleDriveTrigger` | Google Driveのファイルイベントを監視する専用トリガー |

**主要パラメータ**:
- `triggerOn`: `fileCreated`（ファイル作成イベント）
- `folderToWatch`: `={{ $env.GOOGLE_DRIVE_FOLDER_ID }}`（環境変数から取得）
- `event`: `fileCreated`
- `options.fileExtensions`: `m4a`（M4Aファイルのみ）

---

### Layer 2: Fetch Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N002 | Get M4A File | `@n8n/n8n-nodes-base.googleDrive` | Google Driveからファイルをダウンロードする標準ノード |
| N003 | Prepare Transcription Request | `@n8n/n8n-nodes-base.code` | JavaScriptで柔軟なデータ整形が可能 |
| N004 | Speech-to-Text API | `@n8n/n8n-nodes-base.httpRequest` | 汎用HTTP APIクライアント（Whisper/Google/AssemblyAI対応） |

**主要Expression**:
```javascript
// N002: ファイルID取得
={{ $json.id }}

// N003: データ整形
const fileData = items[0].binary.m4aFile;
const fileName = $input.first().json.name;
const fileSize = fileData.fileSize;
const createdTime = $input.first().json.createdTime;

// N004: API URL
={{ $env.TRANSCRIPTION_API_URL }}
```

---

### Layer 3: Validate Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N005 | Validate Transcript | `@n8n/n8n-nodes-base.if` | 条件分岐に最適化された専用ノード |
| N006 | Validate Metadata | `@n8n/n8n-nodes-base.if` | 条件分岐に最適化された専用ノード |

**主要Expression**:
```javascript
// N005: 文字起こし検証
={{ $json.raw_transcript !== null }}
={{ $json.raw_transcript.length > 100 }}

// N006: メタデータ検証
={{ $json.file_name !== null }}
={{ $json.created_time !== null }}
```

---

### Layer 4: Transform Layer（最重要）

#### ステップ1: 文字起こし整形

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N007 | Prepare Lines for Loop | `@n8n/n8n-nodes-base.code` | 配列生成にCode Node使用 |
| N008 | Split Transcript Lines | `@n8n/n8n-nodes-base.splitInBatches` | ループ処理の標準ノード |
| N009 | AI Agent: Transcript Formatter | `@n8n/n8n-nodes-langchain.agent` | LangChain AIエージェント |
| N010 | Chat Model: XAI Grok | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | OpenAI互換API接続 |
| N011 | Memory: Simple Memory | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | 会話履歴管理 |
| N012 | Loop Back or Continue 1 | `@n8n/n8n-nodes-base.splitInBatches` | ループ制御 |
| N013 | Aggregate Formatted Lines | `@n8n/n8n-nodes-base.itemLists` | 配列統合 |

**主要Expression**:
```javascript
// N007: 行分割
const lines = rawTranscript.split('\n').filter(line => line.trim() !== '');
const linesArray = lines.map((line, index) => ({
  line_number: index + 1,
  raw_content: line
}));

// N008: バッチサイズ
batchSize: 10

// N009: AIプロンプト
text: "あなたは日本語文字起こしテキスト整形の専門家です。\n入力されたテキストからフィラー（'えー'、'あー'、'えっと'等）を除去し、1行ごとに構造化されたJSON形式で出力してください。"

// N010: XAI Grok設定
model: "grok-beta"
baseURL: "https://api.x.ai/v1"
temperature: 0.3
maxTokens: 4096

// N013: 配列統合
operation: "aggregateItems"
aggregate: "aggregateAllItemData"
```

#### ステップ2: 議題抽出

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N014 | AI Agent: Agenda Extractor | `@n8n/n8n-nodes-langchain.agent` | LangChain AIエージェント |
| N015 | Chat Model: XAI Grok | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | OpenAI互換API接続 |
| N016 | Memory: Simple Memory | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | 会話履歴管理 |
| N017 | Parse Agenda JSON | `@n8n/n8n-nodes-base.code` | JSON解析 |

**主要Expression**:
```javascript
// N014: AIプロンプト
text: "あなたは会議議題抽出の専門家です。\n入力された整形済み文字起こしテキストから議題を識別し、議題ごとにJSONオブジェクトを生成してください。"

// N017: JSON解析
const agendasText = $input.first().json.output;
const agendas = JSON.parse(agendasText);
return agendas.map(agenda => ({ json: agenda }));
```

#### ステップ3: 議題分析

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N018 | Split Agendas for Analysis | `@n8n/n8n-nodes-base.splitInBatches` | ループ処理 |
| N019 | AI Agent: Agenda Analyzer | `@n8n/n8n-nodes-langchain.agent` | LangChain AIエージェント |
| N020 | Chat Model: XAI Grok | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | OpenAI互換API接続 |
| N021 | Memory: Simple Memory | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | 会話履歴管理 |
| N022 | Loop Back or Continue 2 | `@n8n/n8n-nodes-base.splitInBatches` | ループ制御 |
| N023 | Aggregate Analyzed Agendas | `@n8n/n8n-nodes-base.itemLists` | 配列統合 |

**主要Expression**:
```javascript
// N018: バッチサイズ
batchSize: 1  // 議題を1つずつ処理

// N019: AIプロンプト
text: "あなたは会議議題分析の専門家です。\n入力された議題の議論内容から以下を抽出してください：\n1. 決定事項（合意された内容）\n2. 宿題（担当者、期限、タスク内容）\n3. 保留事項（未解決、次回持ち越し）"
```

#### データマージ

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N024 | Merge All Step Data | `@n8n/n8n-nodes-base.code` | 複雑なデータ統合にCode Node |

**主要Expression**:
```javascript
const formattedLines = $('Aggregate Formatted Lines').all()[0].json;
const analyzedAgendas = $input.all().map(item => item.json);
const fileMetadata = {
  file_name: $('Get M4A File').first().json.name,
  file_id: $('Get M4A File').first().json.id,
  created_time: $('Get M4A File').first().json.createdTime,
  file_size: $('Get M4A File').first().json.size
};

return [{
  json: {
    metadata: fileMetadata,
    formatted_lines: formattedLines,
    agendas: analyzedAgendas,
    total_agendas: analyzedAgendas.length
  }
}];
```

#### ステップ4: フォーマット変換

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N025 | AI Agent: Format Converter | `@n8n/n8n-nodes-langchain.agent` | LangChain AIエージェント |
| N026 | Chat Model: Claude Sonnet 4.5 | `@n8n/n8n-nodes-langchain.lmChatAnthropic` | Anthropic API接続 |
| N027 | Memory: Simple Memory | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | 会話履歴管理 |

**主要Expression**:
```javascript
// N026: Claude設定
model: "claude-sonnet-4-5-20250514"
temperature: 0.5
maxTokens: 8192
```

#### ステップ5: 品質保証

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N028 | AI Agent: Quality Assurance | `@n8n/n8n-nodes-langchain.agent` | LangChain AIエージェント |
| N029 | Chat Model: Claude Sonnet 4.5 | `@n8n/n8n-nodes-langchain.lmChatAnthropic` | Anthropic API接続 |
| N030 | Memory: Simple Memory | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | 会話履歴管理 |
| N031 | Parse QA Result | `@n8n/n8n-nodes-base.code` | JSON解析 |

---

### Layer 5: Conditional Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N032 | Check QA Pass | `@n8n/n8n-nodes-base.if` | 条件分岐 |

**主要Expression**:
```javascript
={{ $json.quality_report.overall_score > 70 }}
```

---

### Layer 6: Execute Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N033 | Prepare Agendas for Notion | `@n8n/n8n-nodes-base.code` | Notion用データ整形 |
| N034 | Split Agendas for Notion | `@n8n/n8n-nodes-base.splitInBatches` | ループ処理 |
| N035 | Create Notion Page | `@n8n/n8n-nodes-base.notion` | Notion API統合 |
| N036 | Wait for Rate Limit | `@n8n/n8n-nodes-base.wait` | API制限対策 |
| N037 | Loop Back or Continue 3 | `@n8n/n8n-nodes-base.splitInBatches` | ループ制御 |
| N038 | Send Completion Notification | `@n8n/n8n-nodes-base.slack` | Slack通知 |

**主要Expression**:
```javascript
// N033: Notion用データ整形
const notionPages = agendas.map(agenda => ({
  agenda_title: `${metadata.file_name.replace('.m4a', '')} - ${agenda.agenda_title}`,
  meeting_date: metadata.created_time,
  participants: agenda.discussion_content.match(/参加者[：:](.*)/)?.[1] || "不明",
  agenda_content_markdown: `## ${agenda.agenda_title}\n\n...`
}));

// N035: Notionページ作成
title: ={{ $json.agenda_title }}
pageId: ={{ $env.NOTION_DATABASE_ID }}

// N036: 遅延
amount: 500
unit: "ms"

// N038: Slack通知
text: "議事録生成完了: {{ $('Get M4A File').first().json.name }}"
```

---

### Layer 7: Integrate Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N039 | Aggregate Execution Logs | `@n8n/n8n-nodes-base.code` | ログ統合 |

---

### Layer 8: Output Layer

| ノードID | ノード名 | n8nノードタイプ | 選定理由 |
|---------|---------|----------------|---------|
| N040 | Update Workflow Status | `@n8n/n8n-nodes-base.code` | ステータス更新 |

---

## 🔗 重要なExpression設計パターン

### 1. 環境変数アクセス
```javascript
={{ $env.VARIABLE_NAME }}
```

### 2. 前ノードのデータ参照
```javascript
// 直前のノード
={{ $json.field_name }}

// 特定のノード（ノード名指定）
={{ $('Node Name').first().json.field_name }}

// すべてのアイテム取得
={{ $('Node Name').all() }}
```

### 3. バイナリデータアクセス
```javascript
={{ $binary.propertyName }}
items[0].binary.m4aFile
```

### 4. 配列操作
```javascript
// map
={{ $json.array.map(item => item.field) }}

// filter
={{ $json.array.filter(item => item.status === 'active') }}

// 結合
={{ $json.array.join(', ') }}
```

### 5. 条件式
```javascript
// 三項演算子
={{ $json.score > 70 ? '合格' : '不合格' }}

// null合体演算子
={{ $json.value ?? 'デフォルト値' }}

// オプショナルチェーン
={{ $json.user?.name ?? '不明' }}
```

---

## ✅ ノード選定の判断基準

### AI Agent Node使用条件
- ✅ LLMによる自然言語処理が必要
- ✅ 複雑な判断・推論が必要
- ✅ コンテキストを保持した処理が必要
- ❌ 単純なデータ変換（Code Nodeで十分）

### Code Node使用条件
- ✅ 複雑なデータ変換・整形
- ✅ 配列操作、JSON解析
- ✅ カスタムロジック実装
- ❌ 標準ノードで実現可能な処理

### Split in Batches使用条件
- ✅ 配列データのループ処理
- ✅ バッチサイズ制御が必要
- ✅ API制限対策

### If Node使用条件
- ✅ 条件分岐
- ✅ エラーハンドリング
- ✅ 品質ゲート

---

## 📁 成果物

このドキュメント自体が成果物です。

---

## ✅ ユーザー確認

このn8n設計変換（ノード選定とExpression設計）で正しいですか？

**承認いただければ、Step6: AIエージェント配置フェーズに進みます。**
