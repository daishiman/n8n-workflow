# Step060: AIエージェント配置設計

**実施日**: 2025-01-09
**エージェント**: n8n AIアーキテクト
**ワークフローバージョン**: v1.1（Gemini直接文字起こし）

---

## 🎯 AI Agent配置概要

### 総AI処理ノード数

- **Gemini Transcribeノード**: 1ノード（node_005）
- **AI Agentノード**: 5ノード（node_008, 011, 014, 016, 017）
- **Chat Modelサブノード**: 5ノード
- **Memoryサブノード**: 3ノード（Step2, 4, 5のみ）

**合計**: 6 AI処理ノード + 8サブノード = **14ノード**

---

## 📋 AI要否判定結果

### AI処理が必要なタスク ✅

| Node ID | ノード名 | AI必要性 | 理由 |
|---------|---------|---------|------|
| node_005 | Gemini Transcribe | ✅ 必須 | 音声→テキスト変換、話者分離、タイムスタンプ付与 |
| node_008 | AI Agent Step1 | ✅ 必須 | フィラー除去と箇条書き化（自然言語処理） |
| node_011 | AI Agent Step2 | ✅ 必須 | 議題抽出（文脈理解と分類） |
| node_014 | AI Agent Step3 | ✅ 必須 | 決定事項・宿題・保留事項の抽出（意図理解） |
| node_016 | AI Agent Step4 | ✅ 必須 | Markdown議事録生成（長文生成） |
| node_017 | AI Agent Step5 | ✅ 必須 | 品質保証（完全性検証と補完） |

### AI処理が不要なタスク ❌

| Node ID | ノード名 | 代替手段 | 理由 |
|---------|---------|---------|------|
| node_001-004 | トリガー&ファイル取得 | Google Drive, Filter | 単純なデータ取得と検証 |
| node_006 | チャンク分割 | Code Node | 定型的な配列操作 |
| node_007, 013 | Split in Batches | Built-in Node | バッチ処理ロジック |
| node_009, 015 | Loop Back | Built-in Node | ループ制御 |
| node_010, 012 | データ統合・再構成 | Code Node | 定型的な配列操作 |
| node_018 | IF判定 | IF Node | 条件分岐 |
| node_019-020 | Google Drive保存・移動 | Google Drive | ファイル操作 |
| node_021 | Discord通知 | HTTP Request | Webhook送信 |

---

## 🤖 AI Agent詳細配置設計

### Agent 0: Gemini Transcribe（音声文字起こし）

**基本情報**:
- **Node ID**: node_005
- **Node Name**: Google Gemini: Transcribe Audio
- **Node Type**: `@n8n/n8n-nodes-langchain.googleGemini`
- **Resource**: audio
- **Operation**: transcribe

**責務**:
> M4A音声ファイルを文字起こしし、話者分離とタイムスタンプを付与する

**ゴール**:
> JSON配列形式の構造化された文字起こしデータを生成する（各発言に line_id, content, speaker, timestamp, start_time, end_time を含む）

**System Message**: N/A（Transcribe操作はSystem Message不使用）

**Prompt Design**:
```
以下のM4A音声ファイルを文字起こししてください：

【指示】
1. 話者を識別し、speaker A, speaker B, speaker C等でラベル付け
2. タイムスタンプを付与（HH:MM:SS形式）
3. 句読点を自動挿入
4. 各発言を1行ずつ区切って出力
5. 発言の開始時刻と終了時刻を秒単位で記録
6. line_idを1から順に採番

【出力形式】
JSON配列で返してください：
[
  {
    "line_id": 1,
    "content": "発言内容",
    "speaker": "A",
    "timestamp": "00:01:20",
    "start_time": 80.5,
    "end_time": 85.2
  },
  ...
]
```

**Connected Components**:
- **Chat Model**: N/A（Transcribe操作は直接実行）
- **Tools**: N/A
- **Memory**: N/A

**Parameters**:
```json
{
  "resource": "audio",
  "operation": "transcribe",
  "modelId": {
    "__rl": true,
    "mode": "list",
    "value": "models/gemini-2.0-flash-exp"
  },
  "inputBinary": "data",
  "text": "{{ プロンプト }}",
  "options": {
    "temperature": 0.2,
    "maxTokens": 100000,
    "audioTimestamp": true
  }
}
```

**Input Schema**:
```typescript
type Input = {
  data: Buffer;  // M4Aバイナリデータ
}
```

**Output Schema**:
```typescript
type Output = Array<{
  line_id: number;
  content: string;
  speaker: string;  // "A", "B", "C", etc.
  timestamp: string;  // "HH:MM:SS"
  start_time: number;  // 秒単位
  end_time: number;  // 秒単位
}>;
```

**単一責務チェック**: ✅ **PASS**
- 音声文字起こしのみを実行
- 他の責務（整形、分析等）は含まない

**n8n-MCP検証結果**:
```json
{
  "nodeType": "@n8n/n8n-nodes-langchain.googleGemini",
  "valid": true,
  "features": ["M4Aネイティブ対応", "話者分離", "タイムスタンプ", "最大8.4時間"]
}
```

---

### Agent 1: Step1 文字起こし整形エージェント

**基本情報**:
- **Node ID**: node_008
- **Node Name**: AI Agent: Step1 文字起こし整形
- **Node Type**: `@n8n/n8n-nodes-langchain.agent`

**責務**:
> 文字起こしテキストからフィラー語を除去し、意味のある文章単位で箇条書き化する

**ゴール**:
> 読みやすく整形された文字起こしJSON配列を生成する

**System Message**:
```
あなたは日本語の文字起こしテキストを整形する専門家です。

【あなたの責務】
フィラー語（「えー」「あのー」「その」「まあ」「ええと」等）を除去し、意味のある文章単位で箇条書き化することです。

【注意事項】
- 話者情報とタイムスタンプは必ず保持してください
- メインテキストのみを整形し、前後の文脈は参考にするだけです
- 各発言のline_idは元のままで、contentのみを整形してください
- 発言の意味を変えないように注意してください

【出力形式】
JSON配列形式で返してください。
```

**Prompt (User Message)**:
```
以下の文字起こしテキストを整形してください：

【メインテキスト（このチャンクで整形する部分）】
{{ $json.main_text }}

【前後の文脈（参考用、出力には含めない）】
前の文脈: {{ $json.overlap_before }}
後の文脈: {{ $json.overlap_after }}

【指示】
1. フィラー語を除去（「えー」「あのー」「その」「まあ」「ええと」等）
2. 意味のある文章単位で1行ずつ箇条書き化
3. 話者情報（speaker）とタイムスタンプ（timestamp）を保持
4. 前後の文脈は参考にするだけで、出力には含めない
5. メインテキストのみを整形して返す

【出力形式】
JSON配列で返してください（メインテキストのみ）：
[
  {
    "line_id": 1,
    "content": "整形後の文章",
    "speaker": "A",
    "timestamp": "00:01:20"
  },
  ...
]
```

**Connected Components**:
- **Chat Model**: Google Gemini Chat Model
  - Model: `models/gemini-2.0-flash-exp`
  - Temperature: 0.4（一貫性重視）
  - Max Tokens: 4000
- **Tools**: なし
- **Memory**: なし（並列処理のため、会話履歴不要）

**Input Schema**:
```typescript
type Input = {
  chunk_id: number;
  main_text: Array<{line_id: number; content: string; speaker: string; timestamp: string}>;
  overlap_before: Array<{...}> | null;
  overlap_after: Array<{...}> | null;
};
```

**Output Schema**:
```typescript
type Output = Array<{
  line_id: number;
  content: string;  // 整形済み
  speaker: string;
  timestamp: string;
}>;
```

**単一責務チェック**: ✅ **PASS**
- フィラー除去と箇条書き化のみ
- 議題抽出や分析は含まない

---

### Agent 2: Step2 議題抽出エージェント

**基本情報**:
- **Node ID**: node_011
- **Node Name**: AI Agent: Step2 議題抽出
- **Node Type**: `@n8n/n8n-nodes-langchain.agent`

**責務**:
> 統合された文字起こし全体から、会議の議題を自動抽出し、各議題に該当するline_idsを記録する

**ゴール**:
> 会議名と議題一覧（各議題のタイトルとline_idsを含む）をJSON形式で出力する

**System Message**:
```
あなたは会議の議事録作成の専門家です。

【あなたの責務】
文字起こしテキスト全体を分析し、会議の議題を自動抽出することです。

【注意事項】
- 会話の流れから自然な議題の区切りを見つけてください
- 各議題に適切で分かりやすいタイトルを付けてください
- 各議題に該当する行番号（line_id）を配列で正確に記録してください
- 会議名も推測して抽出してください（ファイル名やメタデータも参考にしてください）

【出力形式】
JSON形式で返してください。
```

**Prompt (User Message)**:
```
以下の整形済み文字起こしから、会議の議題を抽出してください：

{{ $json.lines }}

【指示】
1. 会話の流れから自然な議題の区切りを見つける
2. 各議題に適切なタイトルを付ける
3. 各議題に該当する行番号（line_id）を配列で記録
4. 会議名も推測して抽出（ファイル名やメタデータも参考にする）

【出力形式】
JSON形式で返してください：
{
  "meeting_name": "会議名（音声から抽出、なければファイル名から推測）",
  "agendas": [
    {
      "agenda_id": 1,
      "title": "議題タイトル",
      "line_ids": [1, 2, 3, 15, 16, 17]
    },
    ...
  ]
}
```

**Connected Components**:
- **Chat Model**: Google Gemini Chat Model
  - Model: `models/gemini-2.0-flash-exp`
  - Temperature: 0.4
  - Max Tokens: 4000
- **Tools**: なし
- **Memory**: Simple Memory
  - Session ID Type: customKey
  - Session Key: `step2_memory`
  - Context Window Length: 10

**Input Schema**:
```typescript
type Input = {
  lines: Array<{
    line_id: number;
    content: string;
    speaker: string;
    timestamp: string;
  }>;
  total_lines: number;
};
```

**Output Schema**:
```typescript
type Output = {
  meeting_name: string;
  agendas: Array<{
    agenda_id: number;
    title: string;
    line_ids: number[];
  }>;
};
```

**単一責務チェック**: ✅ **PASS**
- 議題抽出のみ
- 議題の分析や要約は含まない

---

### Agent 3: Step3 議題分析エージェント

**基本情報**:
- **Node ID**: node_014
- **Node Name**: AI Agent: Step3 議題分析
- **Node Type**: `@n8n/n8n-nodes-langchain.agent`

**責務**:
> 各議題に関する文字起こしから、決定事項、宿題、保留事項を抽出する

**ゴール**:
> 各議題ごとに、決定事項、宿題、保留事項をJSON形式で出力する

**System Message**:
```
あなたは会議の分析専門家です。

【あなたの責務】
議題ごとに、決定事項、宿題、保留事項を正確に抽出することです。

【注意事項】
- 決定事項（decisions）: 明確に決まったことのみを抽出
- 宿題（todos）: 誰かが実施すべきタスクを抽出（担当者と期限を含む）
- 保留事項（pending）: 決定されなかった、または次回に持ち越す事項を抽出
- 推測で決定事項を追加しないでください
- 宿題は具体的なアクションを含むもののみを抽出してください

【出力形式】
JSON形式で返してください。
```

**Prompt (User Message)**:
```
以下の議題に関する文字起こしから、決定事項、宿題、保留事項を抽出してください：

【議題】
{{ $json.title }}

【文字起こし】
{{ $json.lines }}

【指示】
1. 決定事項（decisions）: 明確に決まったこと
2. 宿題（todos）: 誰かが実施すべきタスク（担当者と期限を含む）
3. 保留事項（pending）: 決定されなかった、または次回に持ち越す事項

【出力形式】
JSON形式で返してください：
{
  "agenda_id": {{ $json.agenda_id }},
  "title": "{{ $json.title }}",
  "decisions": ["決定事項1", "決定事項2"],
  "todos": ["宿題1", "宿題2"],
  "pending": ["保留事項1"]
}
```

**Connected Components**:
- **Chat Model**: Google Gemini Chat Model
  - Model: `models/gemini-2.0-flash-exp`
  - Temperature: 0.4
  - Max Tokens: 4000
- **Tools**: なし
- **Memory**: なし（並列処理のため）

**Input Schema**:
```typescript
type Input = {
  agenda_id: number;
  title: string;
  lines: Array<{line_id: number; content: string; speaker: string; timestamp: string}>;
  context: {
    total_lines: number;
    duration: string;
  };
};
```

**Output Schema**:
```typescript
type Output = {
  agenda_id: number;
  title: string;
  decisions: string[];
  todos: string[];
  pending: string[];
};
```

**単一責務チェック**: ✅ **PASS**
- 決定事項・宿題・保留事項の抽出のみ
- フォーマット変換や品質保証は含まない

---

### Agent 4: Step4 フォーマット変換エージェント

**基本情報**:
- **Node ID**: node_016
- **Node Name**: AI Agent: Step4 フォーマット変換
- **Node Type**: `@n8n/n8n-nodes-langchain.agent`

**責務**:
> 全データ（議題分析結果、文字起こし、ファイルメタデータ）を統合し、指定フォーマットのMarkdown議事録を生成する

**ゴール**:
> 完全なMarkdown形式の議事録を生成する（目的・背景、日時、参加者、宿題事項、決定事項、次回の日時、議事内容を含む）

**System Message**:
```
あなたは議事録作成の専門家です。

【あなたの責務】
指定されたフォーマットに従って、読みやすく完全な議事録をMarkdown形式で作成することです。

【注意事項】
- 指定フォーマットを必ず遵守してください
- 目的・背景は文字起こしから会議の目的を推測してください
- 日時はファイル作成日時を使用し、終了時刻は音声の長さから計算してください
- 参加者は話者情報から推測し、「万壽本」は必ず含めてください
- 宿題事項と決定事項は全議題から統合してリスト化してください
- 次回の日時は文字起こしから抽出し、なければ「未定」としてください
- 本日の議題はチェックボックス付きリストで記載してください
- 各議題の詳細は該当文字起こしから抽出して箇条書き化してください

【出力形式】
完全なMarkdownテキストを返してください。
```

**Prompt (User Message)**:
```
以下のデータから、指定フォーマットのMarkdown議事録を生成してください：

【データ】
- 会議名: {{ $('AI Agent: Step2 議題抽出').first().json.meeting_name }}
- ファイル作成日時: {{ $('Google Drive: Get File Info').first().json.createdTime }}
- 議題一覧: {{ $input.all() }}
- 全文字起こし: {{ $('Code: チャンク統合+重複除去').first().json.lines }}

【指定フォーマット】
# 目的・背景

{AIが抽出した会議の目的}

# 日時

{YYYY} 年 {MM} 月 {DD} 日（{曜日}） {HH}:{mm} 〜 {HH}:{mm}

# 参加者

{AIが抽出した参加者}、万壽本

# 宿題事項

- {宿題1}
- {宿題2}

# 決定事項

- {決定事項1}
- {決定事項2}

# 次回の日時

{YYYY} 年 {MM} 月 {DD} 日（{曜日}） {HH}:{mm} 〜 {HH}:{mm}

# 議事内容

## 本日の議題

- [ ] 議題1：{議題タイトル1}
- [ ] 議題2：{議題タイトル2}

## 議題1：{議題タイトル1}

- {箇条書き内容1}
- {箇条書き内容2}

（以下、各議題ごとに繰り返し）

【指示】
1. 目的・背景: 文字起こしから会議の目的を推測
2. 日時: ファイル作成日時を使用、終了時刻は音声の長さから計算
3. 参加者: 話者情報から推測、「万壽本」は必ず含める
4. 宿題事項: 全議題の todos を統合してリスト化
5. 決定事項: 全議題の decisions を統合してリスト化
6. 次回の日時: 文字起こしから次回日程を抽出、なければ「未定」
7. 本日の議題: 議題一覧をチェックボックス付きリストで記載
8. 議題N: 各議題の詳細を該当文字起こしから抽出して箇条書き化

【出力】
完全なMarkdownテキストを返してください。
```

**Connected Components**:
- **Chat Model**: Anthropic Chat Model
  - Model: `claude-sonnet-4-5-20250929`
  - Temperature: 0.7（創造性とバランス）
  - Max Tokens: 8000
- **Tools**: なし
- **Memory**: Simple Memory
  - Session ID Type: customKey
  - Session Key: `step4_memory`
  - Context Window Length: 10

**Input Schema**:
```typescript
type Input = {
  // 複数ソースから統合
  meeting_name: string;  // from Step2
  file_created_time: string;  // from Get File Info
  agendas: Array<{agenda_id: number; title: string; decisions: string[]; todos: string[]; pending: string[]}>;  // from Step3
  all_lines: Array<{line_id: number; content: string; speaker: string; timestamp: string}>;  // from Step1
};
```

**Output Schema**:
```typescript
type Output = {
  markdown: string;  // 完全なMarkdownテキスト
};
```

**単一責務チェック**: ✅ **PASS**
- Markdown議事録生成のみ
- 品質検証は含まない

**コンテキスト情報の取得**:
- ✅ 会議名: `$('AI Agent: Step2 議題抽出').first().json.meeting_name`
- ✅ ファイル作成日時: `$('Google Drive: Get File Info').first().json.createdTime`
- ✅ 全議題: `$input.all()`
- ✅ 全文字起こし: `$('Code: チャンク統合+重複除去').first().json.lines`

**複数ソース統合**: ✅ 4つのノードから情報を統合

---

### Agent 5: Step5 品質保証エージェント

**基本情報**:
- **Node ID**: node_017
- **Node Name**: AI Agent: Step5 品質保証
- **Node Type**: `@n8n/n8n-nodes-langchain.agent`

**責務**:
> 生成された議事録の完全性を検証し、不足項目があれば補完する

**ゴール**:
> 検証済みの最終Markdown議事録と、ステータス（ok/補完実施/警告）、警告メッセージを出力する

**System Message**:
```
あなたは品質保証の専門家です。

【あなたの責務】
議事録の完全性を検証し、必要に応じて補完することです。

【注意事項】
- 必須項目が揃っているか確認してください（目的・背景、日時、参加者、宿題事項、決定事項、議事内容）
- 各議題の内容が適切に記載されているか確認してください
- 決定事項と宿題が漏れなく記載されているか確認してください
- 文字起こしの重要な内容が抜けていないか確認してください
- 日本語として自然で読みやすいか確認してください
- 問題がなければ、議事録をそのまま返してください
- 不足があれば、補完した議事録を返してください
- 重大な問題があれば、警告メッセージを含めてください

【出力形式】
JSON形式で返してください。
```

**Prompt (User Message)**:
```
以下の議事録の完全性を検証し、不足項目があれば補完してください：

【生成された議事録】
{{ $('AI Agent: Step4 フォーマット変換').first().json.output }}

【元データ】
- 全議題: {{ $('AI Agent: Step3 議題分析').all() }}
- 全文字起こし: {{ $('Code: チャンク統合+重複除去').first().json.lines }}

【検証項目】
1. 必須項目が揃っているか（目的・背景、日時、参加者、宿題事項、決定事項、議事内容）
2. 各議題の内容が適切に記載されているか
3. 決定事項と宿題が漏れなく記載されているか
4. 文字起こしの重要な内容が抜けていないか
5. 日本語として自然で読みやすいか

【指示】
- 問題がなければ、議事録をそのまま返す
- 不足があれば、補完した議事録を返す
- 重大な問題があれば、警告メッセージを含める

【出力形式】
JSON形式で返してください：
{
  "status": "ok" | "補完実施" | "警告",
  "markdown": "最終議事録",
  "warnings": ["警告メッセージ1", ...]
}
```

**Connected Components**:
- **Chat Model**: Anthropic Chat Model
  - Model: `claude-sonnet-4-5-20250929`
  - Temperature: 0.7
  - Max Tokens: 8000
- **Tools**: なし
- **Memory**: Simple Memory
  - Session ID Type: customKey
  - Session Key: `step5_memory`
  - Context Window Length: 10

**Input Schema**:
```typescript
type Input = {
  // 複数ソースから統合
  generated_markdown: string;  // from Step4
  all_agendas: Array<{agenda_id: number; title: string; decisions: string[]; todos: string[]; pending: string[]}>;  // from Step3
  all_lines: Array<{line_id: number; content: string; speaker: string; timestamp: string}>;  // from Step1
};
```

**Output Schema**:
```typescript
type Output = {
  status: "ok" | "補完実施" | "警告";
  markdown: string;  // 最終Markdown
  warnings: string[];
};
```

**単一責務チェック**: ✅ **PASS**
- 品質保証のみ
- 議事録生成は含まない

**コンテキスト情報の取得**:
- ✅ 生成された議事録: `$('AI Agent: Step4 フォーマット変換').first().json.output`
- ✅ 全議題: `$('AI Agent: Step3 議題分析').all()`
- ✅ 全文字起こし: `$('Code: チャンク統合+重複除去').first().json.lines`

**複数ソース統合**: ✅ 3つのノードから情報を統合

---

## 🔗 クラスターノード構造設計

### Chat Model接続パターン

```
[AI Agent Node]
    ← ai_languageModel ←
[Chat Model Subnode]
```

**接続タイプ**: `ai_languageModel`

### Memory接続パターン

```
[AI Agent Node]
    ← ai_memory ←
[Memory Subnode]
```

**接続タイプ**: `ai_memory`

### 完全なクラスター例（node_011）

```
[AI Agent: Step2 議題抽出]
    ← ai_languageModel ← [Google Gemini Chat Model]
    ← ai_memory ← [Simple Memory]
```

---

## ✅ 単一責務の原則チェック結果

| AI Agent | 責務 | 他の責務が含まれていないか | ゴールが1文で表現できるか | 評価 |
|----------|------|------------------------|---------------------|------|
| **Gemini Transcribe** | 音声文字起こし | ✅ 含まない | ✅ 可能 | ✅ PASS |
| **Step1** | フィラー除去と箇条書き化 | ✅ 含まない | ✅ 可能 | ✅ PASS |
| **Step2** | 議題抽出 | ✅ 含まない | ✅ 可能 | ✅ PASS |
| **Step3** | 決定事項・宿題・保留事項の抽出 | ✅ 含まない | ✅ 可能 | ✅ PASS |
| **Step4** | Markdown議事録生成 | ✅ 含まない | ✅ 可能 | ✅ PASS |
| **Step5** | 品質保証 | ✅ 含まない | ✅ 可能 | ✅ PASS |

**結論**: すべてのAI Agentが単一責務の原則を100%遵守 ✅

---

## 🔍 n8n-MCP検証結果

### 検証実施内容

```json
{
  "validation_date": "2025-01-09",
  "validated_nodes": [
    {
      "nodeType": "@n8n/n8n-nodes-langchain.googleGemini",
      "resource": "audio",
      "operation": "transcribe",
      "valid": true,
      "errors": [],
      "warnings": [],
      "suggestions": []
    },
    {
      "nodeType": "@n8n/n8n-nodes-langchain.agent",
      "valid": true,
      "count": 5,
      "system_message_found": true,
      "system_message_property": "options.systemMessage",
      "default": "You are a helpful assistant"
    }
  ],
  "all_nodes_valid": true,
  "recommendation": "すべてのAI Agent設定が有効。System Messageを明示的に設定することを推奨。"
}
```

---

## 📊 AI Agent配置サマリー

### Gemini使用ノード

| Node | 用途 | Temperature | Max Tokens | Memory |
|------|------|------------|-----------|--------|
| node_005 | 音声文字起こし | 0.2 | 100000 | なし |
| node_008 | 文字起こし整形 | 0.4 | 4000 | なし |
| node_011 | 議題抽出 | 0.4 | 4000 | あり |
| node_014 | 議題分析 | 0.4 | 4000 | なし |

### Claude使用ノード

| Node | 用途 | Temperature | Max Tokens | Memory |
|------|------|------------|-----------|--------|
| node_016 | フォーマット変換 | 0.7 | 8000 | あり |
| node_017 | 品質保証 | 0.7 | 8000 | あり |

### Temperature設定理由

- **0.2（Gemini Transcribe）**: 一貫性最優先（文字起こしは正確性が重要）
- **0.4（Gemini Chat Model）**: 一貫性重視（構造化データ生成）
- **0.7（Claude Sonnet 4.5）**: 創造性とバランス（長文生成と品質保証）

---

## 🎯 次のステップ

**Step070: 完全JSON生成**では、このAI Agent配置設計を基に、n8nワークフローの完全なJSON（position、connections、Sticky Note含む）を生成します。

---

## 📝 メタ情報

✅ **ステップ完了**: 2025-01-09
🤖 **総AI処理ノード**: 6ノード（Gemini Transcribe 1 + AI Agent 5）
📊 **サブノード**: 8ノード（Chat Model 5 + Memory 3）
✅ **単一責務の原則**: 100%遵守
🔍 **n8n-MCP検証**: すべてのノードが有効
⚡ **複数ソース統合**: Step4とStep5で3-4ノードから情報統合
