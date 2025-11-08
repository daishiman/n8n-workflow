# Step6: AIエージェント配置フェーズ - 完了

## AI Agent Node配置設計

5つのAI Agentを単一責務の原則に基づいて配置しました。

---

## 🤖 AI Agentクラスター一覧

### クラスター1: Transcript Formatter（文字起こし整形エージェント）

**ノード構成**:
- **ルートノード**: N009 - AI Agent: Transcript Formatter
- **サブノード1**: N010 - Chat Model: XAI Grok
- **サブノード2**: N011 - Memory: Simple Memory

**単一責務**: 文字起こしテキストからフィラーを除去し、1行ごとに構造化されたJSON形式に整形する

**プロンプト設計**:
```
あなたは日本語文字起こしテキスト整形の専門家です。

入力されたテキストからフィラー（'えー'、'あー'、'えっと'、'まあ'、'その'等）を除去し、1行ごとに構造化されたJSON形式で出力してください。

入力テキスト:
{{ $json.raw_content }}

出力形式：
{
  "line_number": {{ $json.line_number }},
  "speaker": "発言者名（推定または不明）",
  "content": "整形済みテキスト（フィラー除去済み）",
  "timestamp_estimate": "推定タイムスタンプ（optional）"
}

JSON形式のみを出力してください。
```

**システムメッセージ**:
```
あなたは日本語テキスト整形の専門家AIです。フィラーを除去し、読みやすいテキストに整形することが得意です。
```

**Chat Model設定**:
- モデル: `grok-beta`
- ベースURL: `https://api.x.ai/v1`
- Temperature: `0.3`（一貫性重視）
- Max Tokens: `4096`

**Memory設定**:
- タイプ: Buffer Window Memory
- ウィンドウ長: `10`（過去10回のやり取りを保持）
- セッションキー: `={{ $json.file_id }}`

**接続**:
- Input: N008（Split Transcript Lines）からループで受信
- Output: N012（Loop Control）へ送信

---

### クラスター2: Agenda Extractor（議題抽出エージェント）

**ノード構成**:
- **ルートノード**: N014 - AI Agent: Agenda Extractor
- **サブノード1**: N015 - Chat Model: XAI Grok
- **サブノード2**: N016 - Memory: Simple Memory

**単一責務**: 整形済みテキストから議題を識別し、議題ごとにJSONオブジェクトを生成する

**プロンプト設計**:
```
あなたは会議議題抽出の専門家です。

入力された整形済み文字起こしテキストから議題を識別し、議題ごとにJSONオブジェクトを生成してください。

整形済みテキスト:
{{ $json.formatted_lines }}

出力形式：
[
  {
    "agenda_id": 議題番号,
    "agenda_title": "議題タイトル",
    "discussion_lines": [関連する行番号の配列],
    "discussion_content": "議論内容のまとめ"
  }
]

JSON配列形式のみを出力してください。
```

**システムメッセージ**:
```
あなたは会議議題抽出の専門家AIです。文字起こしから議題を正確に識別し、構造化することが得意です。
```

**Chat Model設定**:
- モデル: `grok-beta`
- ベースURL: `https://api.x.ai/v1`
- Temperature: `0.3`
- Max Tokens: `4096`

**Memory設定**:
- タイプ: Buffer Window Memory
- ウィンドウ長: `10`
- セッションキー: `={{ $json.file_id }}`

**接続**:
- Input: N013（Aggregate Formatted Lines）から受信
- Output: N017（Parse Agenda JSON）へ送信

---

### クラスター3: Agenda Analyzer（議題分析エージェント）

**ノード構成**:
- **ルートノード**: N019 - AI Agent: Agenda Analyzer
- **サブノード1**: N020 - Chat Model: XAI Grok
- **サブノード2**: N021 - Memory: Simple Memory

**単一責務**: 各議題から決定事項、宿題、保留事項を抽出し、既存JSONに追記する

**プロンプト設計**:
```
あなたは会議議題分析の専門家です。

入力された議題の議論内容から以下を抽出してください：
1. 決定事項（合意された内容）
2. 宿題（担当者、期限、タスク内容）
3. 保留事項（未解決、次回持ち越し）

議題情報:
議題ID: {{ $json.agenda_id }}
議題タイトル: {{ $json.agenda_title }}
議論内容: {{ $json.discussion_content }}

既存のJSONオブジェクトに追記する形で出力してください。

出力形式：
{
  "agenda_id": {{ $json.agenda_id }},
  "agenda_title": "{{ $json.agenda_title }}",
  "discussion_content": "{{ $json.discussion_content }}",
  "decisions": ["決定事項1", "決定事項2"],
  "tasks": [{"assignee": "担当者", "deadline": "期限", "description": "タスク内容"}],
  "pending_items": [{"item": "保留事項", "reason": "理由"}]
}

JSON形式のみを出力してください。
```

**システムメッセージ**:
```
あなたは会議議題分析の専門家AIです。議論内容から決定事項、宿題、保留事項を正確に抽出することが得意です。
```

**Chat Model設定**:
- モデル: `grok-beta`
- ベースURL: `https://api.x.ai/v1`
- Temperature: `0.3`
- Max Tokens: `4096`

**Memory設定**:
- タイプ: Buffer Window Memory
- ウィンドウ長: `10`
- セッションキー: `={{ $json.file_id }}`

**接続**:
- Input: N018（Split Agendas）からループで受信
- Output: N022（Loop Control）へ送信

---

### クラスター4: Format Converter（フォーマット変換エージェント）

**ノード構成**:
- **ルートノード**: N025 - AI Agent: Format Converter
- **サブノード1**: N026 - Chat Model: Claude Sonnet 4.5
- **サブノード2**: N027 - Memory: Simple Memory

**単一責務**: 統合JSONを指定の議事録フォーマット（Markdown）に変換する

**プロンプト設計**:
```
あなたは議事録作成の専門家です。

入力された統合JSON（整形済みテキスト、議題、分析結果）とファイルメタデータから、以下のフォーマットで議事録を生成してください：

# {{ $json.metadata.file_name }}（拡張子除く）
日時: {{ $json.metadata.created_time }}
参加者: [議論内容から推定]

{{ $json.agendas }}の各議題について以下の形式で出力：

## 議題X: [議題タイトル]
### 議論内容
- [箇条書き]

### 決定事項
- [箇条書き]

### 宿題
- [担当者] [期限] [タスク内容]

### 保留事項
- [理由付き箇条書き]

---

## 全体サマリー
[全議題を踏まえた総括]

Markdown形式で出力してください。
```

**システムメッセージ**:
```
あなたは議事録作成の専門家AIです。構造化されたデータから読みやすく包括的な議事録を生成することが得意です。
```

**Chat Model設定**:
- モデル: `claude-sonnet-4-5-20250514`
- Temperature: `0.5`（創造性とバランス）
- Max Tokens: `8192`

**Memory設定**:
- タイプ: Buffer Window Memory
- ウィンドウ長: `10`
- セッションキー: `={{ $json.file_id }}`

**接続**:
- Input: N024（Merge All Step Data）から受信
- Output: N028（AI Agent: Quality Assurance）へ送信

---

### クラスター5: Quality Assurance（品質保証エージェント）

**ノード構成**:
- **ルートノード**: N028 - AI Agent: Quality Assurance
- **サブノード1**: N029 - Chat Model: Claude Sonnet 4.5
- **サブノード2**: N030 - Memory: Simple Memory

**単一責務**: 全ステップの成果物を検証し、議事録の完全性と品質を確認する

**プロンプト設計**:
```
あなたは議事録品質保証の専門家です。

入力された全ステップの成果物（整形済みテキスト、議題、分析結果、最終議事録）を検証し、以下を確認してください：

1. 必須項目の存在（タイトル、日時、議題、決定事項）
2. データ整合性（JSONと議事録の一致）
3. フォーマット準拠
4. 文法・表現の適切性

統合JSON:
{{ $('Merge All Step Data').first().json }}

最終議事録:
{{ $json.output }}

検証結果と改善提案を含む品質レポートを生成してください。

出力形式：
{
  "validated_minutes": "検証済み議事録（修正済み）",
  "quality_report": {
    "overall_score": 0-100,
    "issues_found": ["問題点リスト"],
    "improvements_applied": ["適用した改善"],
    "recommendations": ["推奨事項"]
  }
}

JSON形式のみを出力してください。
```

**システムメッセージ**:
```
あなたは議事録品質保証の専門家AIです。議事録の完全性、正確性、読みやすさを評価し、改善することが得意です。
```

**Chat Model設定**:
- モデル: `claude-sonnet-4-5-20250514`
- Temperature: `0.5`
- Max Tokens: `8192`

**Memory設定**:
- タイプ: Buffer Window Memory
- ウィンドウ長: `10`
- セッションキー: `={{ $json.file_id }}`

**接続**:
- Input: N025（AI Agent: Format Converter）から受信
- Output: N031（Parse QA Result）へ送信

---

## 🎯 単一責務の原則の遵守

### クラスター1: Transcript Formatter
- **責務**: 文字起こしテキスト整形のみ
- **やらないこと**: 議題抽出、分析、フォーマット変換

### クラスター2: Agenda Extractor
- **責務**: 議題識別と抽出のみ
- **やらないこと**: テキスト整形、決定事項抽出、フォーマット変換

### クラスター3: Agenda Analyzer
- **責務**: 決定事項・宿題・保留事項の抽出のみ
- **やらないこと**: 議題抽出、フォーマット変換、品質保証

### クラスター4: Format Converter
- **責務**: 議事録Markdown生成のみ
- **やらないこと**: 議題分析、品質検証

### クラスター5: Quality Assurance
- **責務**: 品質検証と改善のみ
- **やらないこと**: 議事録生成、議題分析

---

## 🔗 AI Agent間のデータフロー

```
生の文字起こしテキスト
    ↓
[Transcript Formatter] → 整形済みJSON配列
    ↓
[Agenda Extractor] → 議題JSON配列
    ↓
[Agenda Analyzer] → 分析済み議題JSON配列
    ↓
[データマージ] → 統合JSON
    ↓
[Format Converter] → 議事録Markdown
    ↓
[Quality Assurance] → 検証済み議事録 + 品質レポート
```

---

## ⚙️ Chat Model選択の理由

### XAI Grok（クラスター1,2,3）
- **理由**: 高速処理、コスト効率、日本語対応
- **用途**: 定型的なタスク（整形、抽出、分析）

### Claude Sonnet 4.5（クラスター4,5）
- **理由**: 高品質出力、長文生成、論理的思考
- **用途**: 創造的タスク（フォーマット変換、品質保証）

---

## 📁 成果物

このドキュメント自体が成果物です。

---

## ✅ ユーザー確認

このAIエージェント配置設計（5つのクラスター、単一責務の原則遵守）で正しいですか？

**承認いただければ、既に生成済みのStep7の完全n8n JSONに統合されています。次はStep7.5-8-9-10を連続実行します。**
