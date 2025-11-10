# Step020: 構造化フェーズ - 8層フレームワーク分解

## 📋 概要

業務要件を8層フレームワーク（Trigger/Fetch/Validate/Transform/Decision/Action/Merge/Output）に分解し、n8nワークフロー設計の基盤を構築しました。

**実施日**: 2025-01-09
**エージェント**: システムアーキテクト
**成果物**: 8層フレームワーク構造JSON

---

## 🎯 8層フレームワーク概要

### フレームワークの目的

業務要件を実装可能な構造に変換し、n8nノード設計の基盤を提供します。

### 8層の定義

| 層 | 英名 | 役割 | タスク数 |
|----|------|------|---------|
| 1 | Trigger Layer | ワークフロー起動 | 1 |
| 2 | Fetch Layer | データ取得 | 2 |
| 3 | Validate Layer | データ検証 | 1 |
| 4 | Transform Layer | データ変換・AI処理 | 12 |
| 5 | Decision Layer | 条件分岐 | 1 |
| 6 | Action Layer | 実行アクション | 2 |
| 7 | Merge Layer | データ統合 | 2 |
| 8 | Output Layer | 出力・通知 | 1 |

**合計タスク数**: 22タスク
**推定ノード数**: 27ノード（AI Agent 5 + サブノード 10 + その他 12）

---

## 📊 各層の詳細設計

### Layer 1: Trigger Layer（トリガー層）

**T1-01: Google Drive新規ファイル検知**

```
ノードタイプ: Google Drive Trigger
トリガー方式: Polling（5分ごと）
監視フォルダ: 1Ddh7AFQooIcogKZeLNnWPqzrq2DX97QH
フィルタ条件:
  - 拡張子: .m4a
  - 新規ファイルのみ
  - 処理済み除外: [処理済], processed

出力データ:
{
  fileId: "xxx",
  fileName: "会議録.m4a",
  mimeType: "audio/m4a",
  createdTime: "2025-01-09T10:00:00Z",
  size: 123456789
}
```

**参考テンプレート**: Template 3076の`On File Created Trigger`

---

### Layer 2: Fetch Layer（データ取得層）

**T2-01: M4Aファイル情報取得**

```
ノードタイプ: Google Drive
操作: Get File Info
取得項目:
  - fileId
  - fileName
  - mimeType
  - createdTime
  - size
  - downloadUrl

出力: ファイルメタデータ
```

**T2-02: M4A音声ファイルダウンロード**

```
ノードタイプ: Google Drive
操作: Download File
入力: T2-01のfileId
出力: M4Aバイナリデータ

並列実行可能性: ❌（T2-01に依存）
```

**参考テンプレート**: Template 3076の`Download audio file`

---

### Layer 3: Validate Layer（検証層）

**T3-01: ファイル形式検証**

```
ノードタイプ: Filter Node
検証ルール:
  - mimeType === 'audio/m4a' OR 'audio/mp4'
  - size > 0
  - fileName !== null

エラー時の処理:
  - エラーフローへルーティング
  - エラーログ記録
  - Discord通知

出力: 検証済みファイル情報
```

**参考テンプレート**: Template 3076の`Filter by .m4a extension`

---

### Layer 4: Transform Layer（変換層）

**最重要層**: AI処理とデータ変換を含む12タスク

#### T4-01: Deepgram API文字起こし

```
ノードタイプ: HTTP Request
API: Deepgram API
エンドポイント: https://api.deepgram.com/v1/listen
メソッド: POST

パラメータ:
  - model: enhanced
  - language: ja
  - diarize: true（話者分離）
  - punctuate: true（句読点）
  - timestamps: true

認証: DEEPGRAM_API_KEY

入力: M4Aバイナリデータ
出力: {
  transcript: "全文字起こし",
  words: [{word, start, end, speaker}, ...],
  speakers: [0, 1, 2]
}
```

**処理時間**: 1-2分（1時間会議の場合）

#### T4-02: 文字起こしテキストのチャンク分割

```
ノードタイプ: Code Node
処理ロジック:

const lines = transcript.split('\n');
const chunkSize = 25;  // 20-30行の中央値
const overlapSize = 6;  // 前後3チャンク

const chunks = [];
for (let i = 0; i < lines.length; i += chunkSize) {
  chunks.push({
    chunk_id: Math.floor(i / chunkSize) + 1,
    main_text: lines.slice(i, i + chunkSize).join('\n'),
    overlap_before: i > 0 ? lines.slice(i - overlapSize, i).join('\n') : null,
    overlap_after: i + chunkSize < lines.length ?
      lines.slice(i + chunkSize, i + chunkSize + overlapSize).join('\n') : null,
    line_range: [i + 1, Math.min(i + chunkSize, lines.length)]
  });
}

return chunks;

出力例（300行の場合）:
[
  {chunk_id: 1, main_text: "...", overlap_before: null, overlap_after: "...", line_range: [1, 25]},
  {chunk_id: 2, main_text: "...", overlap_before: "...", overlap_after: "...", line_range: [26, 50]},
  ...
  {chunk_id: 12, main_text: "...", overlap_before: "...", overlap_after: null, line_range: [276, 300]}
]
```

**テンプレートには存在しない新規タスク**

#### T4-03: チャンク並列処理開始

```
ノードタイプ: Split in Batches
バッチサイズ: 5
リセットモード: true

出力: 5チャンクのバッチ
```

#### T4-04: Step1 - 文字起こし整形（並列AI処理）

```
ノードタイプ: AI Agent Node
Chat Model: Google Gemini Flash 2.0
Memory: なし（並列処理のため）

System Prompt:
「以下の文字起こしテキストを整形してください：

【メインテキスト】
{{ $json.main_text }}

【前後の文脈（参考用）】
前: {{ $json.overlap_before }}
後: {{ $json.overlap_after }}

【指示】
1. フィラー語を除去（「えー」「あのー」「その」「まあ」等）
2. 意味のある文章単位で1行ずつ箇条書き化
3. 話者情報があれば保持
4. タイムスタンプを保持

【出力形式】
JSON配列で返してください：
[
  {
    "line_id": 1,
    "content": "整形後の文章",
    "speaker": 0,
    "timestamp": "00:01:20"
  },
  ...
]」

パラメータ:
  - temperature: 0.4
  - maxTokens: 4000
  - topK: 40
  - topP: 0.9

処理時間: 10-20秒/チャンク × 12チャンク ÷ 5並列 = 24-48秒

出力: 整形済みJSON配列（チャンク単位）
```

**並列実行**: ✅ 5チャンク同時処理

#### T4-05: チャンク統合と重複除去

```
ノードタイプ: Merge Node + Code Node

Mergeノード:
  - Mode: Append
  - 全バッチの出力を統合

Code Node（重複除去）:
const allLines = [];
for (const chunk of $input.all()) {
  const chunkData = chunk.json;
  // main_text のみを抽出（オーバーラップは除外）
  allLines.push(...chunkData.lines);
}

// line_id でソート
allLines.sort((a, b) => a.line_id - b.line_id);

// 重複削除（同じ line_id は1つのみ）
const uniqueLines = Array.from(
  new Map(allLines.map(line => [line.line_id, line])).values()
);

return [{ json: { lines: uniqueLines } }];

出力: 統合JSON配列（全文字起こし、重複なし）
```

**参考テンプレート**: Template 3076の`Merge All Paths`

#### T4-06: Step2 - 議題抽出（AI処理）

```
ノードタイプ: AI Agent Node
Chat Model: Google Gemini Flash 2.0
Memory: あり（Simple Memory、session_key: step2_memory）

System Prompt:
「以下の整形済み文字起こしから、会議の議題を抽出してください：

{{ $json.lines }}

【指示】
1. 会話の流れから自然な議題の区切りを見つける
2. 各議題に適切なタイトルを付ける
3. 各議題に該当する行番号（line_id）を記録
4. 会議名も推測して抽出

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
}」

パラメータ:
  - temperature: 0.4
  - maxTokens: 4000

処理時間: 20-30秒

出力: 議題JSON
```

**参考テンプレート**: Template 3076の`Summarize to JSON`（AI Agent化）

#### T4-07: 議題ごとのデータ再構成

```
ノードタイプ: Code Node

処理ロジック:
const agendas = $input.first().json.agendas;
const allLines = $('Step1 Merge').first().json.lines;

const reconstructedAgendas = agendas.map(agenda => {
  // 該当する line_ids の文字起こしを収集
  const lines = agenda.line_ids.map(id => {
    return allLines.find(line => line.line_id === id);
  }).filter(line => line !== undefined);

  // タイムスタンプから duration を計算
  const duration = calculateDuration(lines);

  return {
    agenda_id: agenda.agenda_id,
    title: agenda.title,
    lines: lines,
    context: {
      total_lines: lines.length,
      duration: duration
    }
  };
});

return reconstructedAgendas.map(agenda => ({ json: agenda }));

出力: 議題別JSON（各議題に該当する全文字起こしを含む）
```

**テンプレートには存在しない新規タスク**

#### T4-08: 議題並列処理開始

```
ノードタイプ: Split in Batches
バッチサイズ: 3
リセットモード: true

出力: 3議題のバッチ
```

#### T4-09: Step3 - 議題分析（並列AI処理）

```
ノードタイプ: AI Agent Node
Chat Model: Google Gemini Flash 2.0
Memory: なし（並列処理のため）

System Prompt:
「以下の議題に関する文字起こしから、決定事項、宿題、保留事項を抽出してください：

【議題】
{{ $json.title }}

【文字起こし】
{{ $json.lines }}

【指示】
1. 決定事項（decisions）: 明確に決まったこと
2. 宿題（todos）: 誰かが実施すべきタスク
3. 保留事項（pending）: 決定されなかった、または次回に持ち越す事項

【出力形式】
JSON形式で返してください：
{
  "agenda_id": {{ $json.agenda_id }},
  "decisions": ["決定事項1", "決定事項2"],
  "todos": ["宿題1", "宿題2"],
  "pending": ["保留事項1"]
}」

パラメータ:
  - temperature: 0.4
  - maxTokens: 4000

処理時間: 20-40秒/議題 × N議題 ÷ 3並列 = (20-40秒 × N / 3)

出力: 分析JSON（議題単位）
```

**並列実行**: ✅ 3議題同時処理

#### T4-10: 議題統合

```
ノードタイプ: Merge Node
統合方法: Append
ソート: agenda_id でソート

出力: 全議題の分析結果JSON
```

#### T4-11: Step4 - フォーマット変換（AI処理）

```
ノードタイプ: AI Agent Node
Chat Model: Claude Sonnet 4.5
Memory: あり（Simple Memory、session_key: step4_memory）

System Prompt:
「以下のデータから、指定フォーマットのMarkdown議事録を生成してください：

【データ】
- 会議名: {{ $('Step2').first().json.meeting_name }}
- ファイル作成日時: {{ $('Trigger').first().json.createdTime }}
- 会議時間: 計算して挿入
- 議題一覧: {{ $('Step3 Merge').all() }}
- 全文字起こし: {{ $('Step1 Merge').first().json.lines }}

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
4. 宿題事項: 全議題の todos を統合
5. 決定事項: 全議題の decisions を統合
6. 次回の日時: 文字起こしから次回日程を抽出、なければ「未定」
7. 本日の議題: 議題一覧をチェックボックス付きで記載
8. 議題N: 各議題の詳細を該当文字起こしから抽出

【出力】
完全なMarkdownテキストを返してください。」

パラメータ:
  - temperature: 0.7
  - maxTokens: 8000

処理時間: 30-45秒

出力: Markdown議事録
```

**参考テンプレート**: Template 3076の`Convert JSON to Markdown`（AI Agent化）

#### T4-12: Step5 - 品質保証（AI処理）

```
ノードタイプ: AI Agent Node
Chat Model: Claude Sonnet 4.5
Memory: あり（Simple Memory、session_key: step5_memory）

System Prompt:
「以下の議事録の完全性を検証し、不足項目があれば補完してください：

【生成された議事録】
{{ $('Step4').first().json.markdown }}

【元データ】
- 全議題: {{ $('Step3 Merge').all() }}
- 全文字起こし: {{ $('Step1 Merge').first().json.lines }}

【検証項目】
1. 必須項目が揃っているか（目的・背景、日時、参加者、宿題事項、決定事項、議事内容）
2. 各議題の内容が適切に記載されているか
3. 決定事項と宿題が漏れなく記載されているか
4. 文字起こしの重要な内容が抜けていないか

【指示】
- 問題がなければ、議事録をそのまま返す
- 不足があれば、補完した議事録を返す
- 重大な問題があれば、警告メッセージを含める

【出力形式】
{
  "status": "ok" | "補完実施" | "警告",
  "markdown": "最終議事録",
  "warnings": ["警告メッセージ1", ...]
}」

パラメータ:
  - temperature: 0.7
  - maxTokens: 8000

処理時間: 20-30秒

出力: 最終Markdown（検証済み）+ ステータス
```

**テンプレートには存在しない新規タスク**

---

### Layer 5: Decision Layer（判断層）

**T5-01: 品質保証ステータス判定**

```
ノードタイプ: IF Node
条件: {{ $json.status }} === 'ok' OR 'completed'

True Path: 議事録保存フローへ（T6-01）
False Path: エラー通知フローへ（Error Workflow）

出力: 分岐判定結果
```

---

### Layer 6: Action Layer（実行層）

**T6-01: 議事録Markdownファイル保存**

```
ノードタイプ: Google Drive: Upload File
操作: Upload File
保存先フォルダ: 議事録_出力/
ファイル名: minutes - {{ $now.format('YYYY-MM-DD') }} - {{ $('Step2').first().json.meeting_name }}.md
MIME Type: text/markdown
文字コード: UTF-8

入力: {{ $('Step5').first().json.markdown }}

出力: 保存されたファイルのメタデータ
```

**参考テンプレート**: Template 3076の`Save Markdown file to Google Drive`

**T6-02: 元のM4Aファイルを移動**

```
ノードタイプ: Google Drive: Move File
操作: Move File
移動元: {{ $('Trigger').first().json.fileId }}
移動先フォルダ: processed/

目的: 処理済みファイルを区別、再処理を防ぐ

出力: 移動後のファイル情報
```

**テンプレートには存在しない新規タスク**

---

### Layer 7: Merge Layer（統合層）

**T7-01: チャンク統合（Step1後）**

```
場所: T4-05
ノードタイプ: Merge Node
統合対象: 全チャンクの整形結果
統合方法: 配列結合 + line_idソート + 重複除去

出力: 統合JSON配列（全文字起こし）
```

**T7-02: 議題統合（Step3後）**

```
場所: T4-10
ノードタイプ: Merge Node
統合対象: 全議題の分析結果
統合方法: 配列結合 + agenda_idソート

出力: 全議題の分析結果JSON
```

**参考テンプレート**: Template 3076の`Merge All Paths`

---

### Layer 8: Output Layer（出力層）

**T8-01: 完了通知（Discord、オプション）**

```
ノードタイプ: Discord Webhook (HTTP Request)
送信先: Discord管理者チャンネル
通知内容:
  - 処理完了ファイル名: {{ $('Trigger').first().json.fileName }}
  - 議事録保存先URL: {{ $('Save Minutes').first().json.webViewLink }}
  - 合計処理時間: {{ $workflow.duration }}
  - AI処理ステータス: Step1-5の成功/失敗状況

出力: 通知送信結果
```

**参考テンプレート**: Template 3076の`Send Telegram Message`（Discordに変更）

---

## 🔄 データフローサマリー

### Stage 1: トリガー → ファイル取得 → 検証

```
[T1-01: Google Drive Trigger]
    ↓
[T2-01: Get File Info]
    ↓
[T2-02: Download File]
    ↓
[T3-01: Validate File]
```

### Stage 2: 文字起こし → チャンク並列処理

```
[T4-01: Deepgram API]
    ↓
[T4-02: チャンク分割]
    ↓
[T4-03: Split in Batches (5並列)]
    ↓
[T4-04: Step1 AI Agent (並列)] ← 5チャンク同時処理
    ↓
[T4-05: チャンク統合 + 重複除去]
```

### Stage 3: 議題抽出 → 議題並列処理

```
[T4-06: Step2 AI Agent]
    ↓
[T4-07: データ再構成]
    ↓
[T4-08: Split in Batches (3並列)]
    ↓
[T4-09: Step3 AI Agent (並列)] ← 3議題同時処理
    ↓
[T4-10: 議題統合]
```

### Stage 4: フォーマット変換 → 品質保証

```
[T4-11: Step4 AI Agent]
    ↓
[T4-12: Step5 AI Agent]
    ↓
[T5-01: IF判定]
```

### Stage 5: 保存 → 移動 → 通知

```
[T6-01: 議事録保存]
    ↓
[T6-02: M4A移動]
    ↓
[T8-01: Discord通知]
```

---

## 📈 並列処理による性能向上

### チャンク処理の並列化

**逐次処理の場合**:
- 12チャンク × 20秒/チャンク = 240秒（4分）

**並列処理の場合**:
- 12チャンク ÷ 5並列 = 2.4バッチ
- 2.4バッチ × 20秒/バッチ = 48秒

**性能向上**: 5倍高速化（240秒 → 48秒）

### 議題処理の並列化

**逐次処理の場合**:
- 6議題 × 30秒/議題 = 180秒（3分）

**並列処理の場合**:
- 6議題 ÷ 3並列 = 2バッチ
- 2バッチ × 30秒/バッチ = 60秒

**性能向上**: 3倍高速化（180秒 → 60秒）

### 総合性能

**逐次処理**: 約7分30秒
**並列処理**: 約4分30秒

**目標達成**: ✅ 5分以内を達成可能

---

## 🔗 テンプレート3076との比較

| 項目 | Template 3076 | Google Meet議事録自動化 |
|------|--------------|----------------------|
| トリガー | Google Drive Trigger | ✅ 同じ |
| ファイル取得 | Download audio file | ✅ 同じ |
| 文字起こし | OpenAI Whisper | ❌ Deepgram APIに変更 |
| AI処理 | OpenAI（2箇所） | ❌ AI Agent × 5（Gemini + Claude） |
| チャンク処理 | ❌ なし | ✅ 並列チャンク処理を追加 |
| 議題処理 | ❌ なし | ✅ 並列議題処理を追加 |
| 保存 | Google Drive | ✅ 同じ |
| 通知 | Telegram | ❌ Discordに変更 |
| ファイル移動 | ❌ なし | ✅ processed/に移動を追加 |

**カスタマイズ度**: 約60%（テンプレートベース + 大幅な拡張）

---

## ✅ 8層フレームワーク完了確認

### 各層の充足度

- ✅ **Layer 1 (Trigger)**: 1タスク定義完了
- ✅ **Layer 2 (Fetch)**: 2タスク定義完了
- ✅ **Layer 3 (Validate)**: 1タスク定義完了
- ✅ **Layer 4 (Transform)**: 12タスク定義完了（AI処理含む）
- ✅ **Layer 5 (Decision)**: 1タスク定義完了
- ✅ **Layer 6 (Action)**: 2タスク定義完了
- ✅ **Layer 7 (Merge)**: 2タスク定義完了
- ✅ **Layer 8 (Output)**: 1タスク定義完了

### 単一責務の原則チェック

- ✅ **AI-01**: フィラー除去と箇条書き化のみ
- ✅ **AI-02**: 議題抽出のみ
- ✅ **AI-03**: 議題分析のみ
- ✅ **AI-04**: フォーマット変換のみ
- ✅ **AI-05**: 品質保証のみ

### 依存関係の明確性

- ✅ クリティカルパスが明確
- ✅ 並列処理箇所が特定されている
- ✅ タスク間の依存関係が定義されている

---

## 🚀 次のステップ

**Step030: タスク分解フェーズ** に進みます。

8層構造をn8nノード単位に詳細分解し、各ノードのパラメータと設定を定義します。

---

## 📝 メタ情報

✅ **ステップ完了**: 2025-01-09
🔍 **n8n-MCP活用**: テンプレート検索（3件）、テンプレート詳細取得（1件）
📊 **タスク総数**: 22タスク
🎯 **推定ノード数**: 27ノード
⚡ **並列処理**: 2箇所（チャンク5並列、議題3並列）
