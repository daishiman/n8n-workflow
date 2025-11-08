# Step 7: 完全n8n JSON生成フェーズ - ワークフロー実装ガイド

## 概要

このドキュメントは、Discord Calendar Manager - Google Calendar Integrationワークフローの完全なn8n JSON実装ガイドです。

## ワークフロー仕様

### 基本情報

```json
{
  "name": "Discord Calendar Manager - Google Calendar Integration",
  "version": "1.0.0",
  "総ノード数": 31,
  "AI Agent数": 3,
  "実装方式": "HTTP Request経由でOpenRouter APIを使用",
  "推定実行時間": "15-30秒"
}
```

### AI Agent構成

このワークフローは、**n8n AI Agent Node**を使用せず、**HTTP Request Node**経由でOpenRouter APIに直接リクエストを送信します。

#### AI Agent 1: Discord予定抽出（Grok 2）

**NODE-010: 【AI Agent 1】Discord予定抽出（Grok）**

- **Model**: `x-ai/grok-2-1212`
- **責務**: Discordの自然言語メッセージから予定情報を抽出
- **入力**: Discord message content（自然言語）
- **出力**:
  ```json
  {
    "event_title": "予定タイトル",
    "event_datetime": "ISO 8601形式（+09:00）",
    "duration_minutes": 60,
    "attendee_emails": ["email@example.com"],
    "description": "説明"
  }
  ```
- **パラメータ**:
  - `temperature`: 0.3（正確性重視）
  - `max_tokens`: 1000
  - `top_p`: 0.9

#### AI Agent 2: 空き時間候補生成（Gemini 2.0 Flash）

**NODE-027: 【AI Agent 2】空き時間候補生成（Gemini）**

- **Model**: `google/gemini-2.0-flash-exp:free`
- **責務**: カレンダー分析と空き時間候補5つの提案
- **入力**:
  ```json
  {
    "event_datetime": "希望日時",
    "duration_minutes": 60,
    "existing_events": [...]
  }
  ```
- **出力**:
  ```json
  {
    "alternative_slots": [
      {
        "slot_datetime": "YYYY-MM-DDTHH:MM:SS+09:00",
        "reason": "推奨理由"
      }
    ]
  }
  ```
- **パラメータ**:
  - `temperature`: 0.7（バランス型）
  - `max_tokens`: 2000
  - `top_p`: 0.95

#### AI Agent 3: 通知メール生成（Claude 3.5 Sonnet）

**NODE-024: 【AI Agent 3】通知メール生成（Claude）**

- **Model**: `anthropic/claude-3.5-sonnet:beta`
- **責務**: 予定情報から参加者向けの通知メールを生成
- **入力**:
  ```json
  {
    "event_title": "予定タイトル",
    "event_datetime": "日時",
    "duration_minutes": 60,
    "attendee_emails": [...],
    "description": "説明"
  }
  ```
- **出力**:
  ```json
  {
    "email_subject": "【予定通知】...",
    "email_body_html": "<html>...</html>",
    "email_body_plain": "..."
  }
  ```
- **パラメータ**:
  - `temperature`: 0.8（創造性重視）
  - `max_tokens`: 1500
  - `top_p`: 0.9

---

## ワークフローアーキテクチャ

### フロー全体図

```
Discord Bot Webhook (NODE-001)
    ↓
Webhookデータ抽出 (NODE-002)
    ↓
ステート確認 (NODE-003)
    ↓
フロー振り分け (NODE-017)
    ├─ TRUE（新規予定登録フロー）→ Webhookデータ検証 (NODE-007)
    │       ↓
    │   AI Agent 1: Discord予定抽出（Grok） (NODE-010)
    │       ↓
    │   Grokレスポンス解析 (NODE-011)
    │       ↓
    │   AI抽出結果検証 (NODE-008)
    │       ↓
    │   検証結果チェック (NODE-009)
    │       ├─ TRUE（検証成功）→ タイムスタンプ計算 (NODE-012)
    │       │       ↓
    │       │   Googleカレンダー既存予定取得 (NODE-004)
    │       │       ↓
    │       │   カレンダーレスポンス整形 (NODE-005)
    │       │       ↓
    │       │   予定重複判定 (NODE-018)
    │       │       ↓
    │       │   重複有無で分岐 (NODE-019)
    │       │       ├─ TRUE（重複なし）→ Googleカレンダー予定登録 (NODE-023)
    │       │       │       ↓
    │       │       │   メール送信要否判定 (NODE-020)
    │       │       │       ├─ TRUE（メール必要）→ AI Agent 3: メール生成（Claude） (NODE-024)
    │       │       │       │       ↓
    │       │       │       │   Claudeレスポンス解析 (NODE-025)
    │       │       │       │       ↓
    │       │       │       │   メールデータ整形 (NODE-013)
    │       │       │       │       ↓
    │       │       │       │   Gmail送信 (NODE-026)
    │       │       │       │       ↓
    │       │       │       │   Discord成功返信 (NODE-036)
    │       │       │       └─ FALSE（メール不要）→ Discord成功返信 (NODE-036)
    │       │       │
    │       │       └─ FALSE（重複あり）→ AI Agent 2: 候補生成（Gemini） (NODE-027)
    │       │               ↓
    │       │           Geminiレスポンス解析 (NODE-028)
    │       │               ↓
    │       │           ステート保存 (NODE-029)
    │       │               ↓
    │       │           Discord重複返信 (NODE-037)
    │       │
    │       └─ FALSE（検証失敗）→ Discordエラー返信 (NODE-038)
    │
    └─ FALSE（選択フロー）→ 保存済みステート読み込み (NODE-006)
            ↓
        ユーザー選択番号解析 (NODE-014)
            ↓
        選択番号検証 (NODE-021)
            ├─ TRUE（有効な選択）→ ステートクリア (NODE-030)
            │       ↓
            │   タイムスタンプ計算 (NODE-012) ※ここから通常フローに合流
            │
            └─ FALSE（無効な選択）→ Discordエラー返信 (NODE-038)

ワークフロー終了 (NODE-042)
```

---

## ノード詳細仕様

### トリガー層

#### NODE-001: Discord Bot Webhook

```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "discord-calendar",
    "authentication": "none",
    "responseMode": "lastNode"
  }
}
```

**期待される入力データ**:
```json
{
  "body": {
    "user_id": "Discord User ID",
    "channel_id": "Discord Channel ID",
    "message_content": "自然言語の予定情報",
    "callback_url": "Discord Webhook URL",
    "timestamp": "ISO 8601 Timestamp"
  }
}
```

---

### 取得層

#### NODE-002: Webhookデータ抽出

**タイプ**: `n8n-nodes-base.set`

**役割**: Webhookから受信したデータを抽出し、後続ノードで使いやすい形式に整形

**Expressionマッピング**:
```javascript
user_id: ={{ $json.body.user_id }}
channel_id: ={{ $json.body.channel_id }}
message_content: ={{ $json.body.message_content }}
callback_url: ={{ $json.body.callback_url }}
request_timestamp: ={{ $json.body.timestamp }}
```

---

#### NODE-003: ステート確認

**タイプ**: `n8n-nodes-base.code`

**役割**: ユーザーの選択待ちステートがあるかどうかを確認

**実装コード**:
```javascript
const staticData = this.getWorkflowStaticData('global');
const userId = $input.first().json.user_id;
const savedState = staticData[userId];

return [{
  json: {
    ...($input.first().json),
    is_selection_flow: !!savedState,
    saved_state: savedState || null
  }
}];
```

**出力データ**:
```json
{
  "user_id": "...",
  "message_content": "...",
  "is_selection_flow": false,
  "saved_state": null
}
```

---

#### NODE-004: Googleカレンダー既存予定取得

**タイプ**: `n8n-nodes-base.httpRequest`

**認証**: Google Calendar OAuth2

**エンドポイント**: `GET https://www.googleapis.com/calendar/v3/calendars/primary/events`

**クエリパラメータ**:
```javascript
timeMin: ={{ $json.event_datetime_minus_24h }}
timeMax: ={{ $json.event_datetime_plus_48h }}
singleEvents: true
orderBy: startTime
```

**レスポンス例**:
```json
{
  "items": [
    {
      "summary": "既存の予定",
      "start": { "dateTime": "2025-11-07T10:00:00+09:00" },
      "end": { "dateTime": "2025-11-07T11:00:00+09:00" }
    }
  ]
}
```

---

#### NODE-005: カレンダーレスポンス整形

**タイプ**: `n8n-nodes-base.code`

**役割**: Google Calendar APIのレスポンスを整形し、重複判定しやすい形式に変換

**実装コード**:
```javascript
const events = $input.first().json.items || [];
const formattedEvents = events.map(event => ({
  title: event.summary || 'No Title',
  start_datetime: event.start.dateTime,
  end_datetime: event.end.dateTime,
  start_ts: new Date(event.start.dateTime).getTime(),
  end_ts: new Date(event.end.dateTime).getTime()
}));

return [{
  json: {
    ...($input.first().json),
    existing_events: formattedEvents
  }
}];
```

---

### 検証層

#### NODE-007: Webhookデータ検証

**タイプ**: `n8n-nodes-base.if`

**検証条件**:
1. `message_content`が空でない
2. `user_id`が空でない
3. `callback_url`が"https://"を含む

**分岐**:
- **TRUE**: AI Agent 1に進む
- **FALSE**: Discordエラー返信

---

#### NODE-008: AI抽出結果検証

**タイプ**: `n8n-nodes-base.code`

**役割**: Grokから抽出されたデータの妥当性を検証

**検証ロジック**:
```javascript
const data = $input.first().json;
const isValid =
  data.event_title && typeof data.event_title === 'string' &&
  data.event_datetime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.event_datetime) &&
  data.duration_minutes && typeof data.duration_minutes === 'number' && data.duration_minutes > 0 &&
  Array.isArray(data.attendee_emails);

return [{
  json: {
    ...data,
    validation_passed: isValid,
    validation_error: isValid ? null : 'Invalid AI extraction format'
  }
}];
```

---

#### NODE-009: 検証結果チェック

**タイプ**: `n8n-nodes-base.if`

**条件**: `validation_passed === true`

**分岐**:
- **TRUE**: タイムスタンプ計算に進む
- **FALSE**: Discordエラー返信

---

### 変換層

#### NODE-010: 【AI Agent 1】Discord予定抽出（Grok）

詳細は前述のAI Agent構成を参照

---

#### NODE-011: Grokレスポンス解析

**タイプ**: `n8n-nodes-base.code`

**役割**: OpenRouter APIレスポンスからJSON contentを抽出してパース

**実装コード**:
```javascript
const response = $input.first().json;
let content = response.choices[0].message.content;

// マークダウンコードブロックを削除
content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// JSONパース
let parsedData;
try {
  parsedData = JSON.parse(content);
} catch (error) {
  return [{
    json: {
      error: true,
      error_message: 'AI response JSON parse failed: ' + error.message,
      raw_content: content
    }
  }];
}

return [{
  json: {
    ...($input.first().json),
    ...parsedData,
    ai_response_raw: content
  }
}];
```

---

#### NODE-012: タイムスタンプ計算

**タイプ**: `n8n-nodes-base.code`

**役割**: 予定の開始・終了タイムスタンプ、カレンダー取得範囲を計算

**実装コード**:
```javascript
const data = $input.first().json;
const startDate = new Date(data.event_datetime);
const endDate = new Date(startDate.getTime() + data.duration_minutes * 60 * 1000);

return [{
  json: {
    ...data,
    start_timestamp: startDate.getTime(),
    end_timestamp: endDate.getTime(),
    end_datetime: endDate.toISOString(),
    event_datetime_minus_24h: new Date(startDate.getTime() - 24*60*60*1000).toISOString(),
    event_datetime_plus_48h: new Date(startDate.getTime() + 48*60*60*1000).toISOString()
  }
}];
```

---

### 判断層

#### NODE-017: フロー振り分け

**タイプ**: `n8n-nodes-base.if`

**条件**: `is_selection_flow === false`

**分岐**:
- **TRUE**: 新規予定登録フロー（Webhookデータ検証へ）
- **FALSE**: 選択フロー（保存済みステート読み込みへ）

---

#### NODE-018: 予定重複判定

**タイプ**: `n8n-nodes-base.code`

**役割**: 新規予定と既存予定の時間重複を判定

**実装コード**:
```javascript
const newStart = $input.first().json.start_timestamp;
const newEnd = $input.first().json.end_timestamp;
const existingEvents = $input.first().json.existing_events || [];

let hasConflict = false;
let conflictEvent = null;

for (const event of existingEvents) {
  if (
    (newStart >= event.start_ts && newStart < event.end_ts) ||
    (newEnd > event.start_ts && newEnd <= event.end_ts) ||
    (newStart <= event.start_ts && newEnd >= event.end_ts)
  ) {
    hasConflict = true;
    conflictEvent = event;
    break;
  }
}

return [{
  json: {
    ...($input.first().json),
    has_conflict: hasConflict,
    conflict_event: conflictEvent
  }
}];
```

---

#### NODE-019: 重複有無で分岐

**タイプ**: `n8n-nodes-base.if`

**条件**: `has_conflict === false`

**分岐**:
- **TRUE（重複なし）**: Googleカレンダー予定登録へ
- **FALSE（重複あり）**: AI Agent 2（空き時間候補生成）へ

---

#### NODE-020: メール送信要否判定

**タイプ**: `n8n-nodes-base.if`

**条件**: `attendee_emails.length > 0`

**分岐**:
- **TRUE**: AI Agent 3（メール生成）へ
- **FALSE**: Discord成功返信へ

---

#### NODE-021: 選択番号検証

**タイプ**: `n8n-nodes-base.if`

**条件**: `selection_valid === true`

**分岐**:
- **TRUE**: ステートクリアへ
- **FALSE**: Discordエラー返信へ

---

### 実行層

#### NODE-023: Googleカレンダー予定登録

**タイプ**: `n8n-nodes-base.httpRequest`

**認証**: Google Calendar OAuth2

**エンドポイント**: `POST https://www.googleapis.com/calendar/v3/calendars/primary/events`

**リクエストボディ（Expression）**:
```json
{
  "summary": "={{ $json.event_title }}",
  "description": "={{ $json.description || '' }}",
  "start": {
    "dateTime": "={{ $json.event_datetime }}",
    "timeZone": "Asia/Tokyo"
  },
  "end": {
    "dateTime": "={{ $json.end_datetime }}",
    "timeZone": "Asia/Tokyo"
  },
  "attendees": "={{ JSON.stringify($json.attendee_emails.map(email => ({email}))) }}",
  "reminders": {
    "useDefault": true
  }
}
```

---

#### NODE-024: 【AI Agent 3】通知メール生成（Claude）

詳細は前述のAI Agent構成を参照

---

#### NODE-025: Claudeレスポンス解析

**タイプ**: `n8n-nodes-base.code`

**役割**: ClaudeのレスポンスからJSON contentを抽出（フォールバック付き）

**実装コード**:
```javascript
const response = $input.first().json;
let content = response.choices[0].message.content;

// マークダウンコードブロックを削除
content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// JSONパース
let parsedData;
try {
  parsedData = JSON.parse(content);
} catch (error) {
  // フォールバック: デフォルトメール
  return [{
    json: {
      ...($input.first().json),
      email_subject: '【予定通知】' + $input.first().json.event_title,
      email_body_html: '<html><body><p>予定の詳細をご確認ください。</p></body></html>',
      email_body_plain: '予定の詳細をご確認ください。'
    }
  }];
}

return [{
  json: {
    ...($input.first().json),
    ...parsedData
  }
}];
```

---

#### NODE-013: メールデータ整形

**タイプ**: `n8n-nodes-base.code`

**役割**: Gmail API用のRFC 2822形式メールを参加者ごとに生成

**実装コード**:
```javascript
const data = $input.first().json;
const emailSubject = data.email_subject;
const emailBody = data.email_body_html;
const attendees = data.attendee_emails || [];

const emailMessages = attendees.map(email => {
  const rawMessage = [
    `From: your-email@gmail.com`,
    `To: ${email}`,
    `Subject: ${emailSubject}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    emailBody
  ].join('\r\n');

  return {
    json: {
      to_email: email,
      raw_message: Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      event_title: data.event_title,
      callback_url: data.callback_url,
      user_id: data.user_id
    }
  };
});

return emailMessages;
```

**重要**: このノードは参加者数分のアイテム配列を返します（Loop準備）

---

#### NODE-026: Gmail送信

**タイプ**: `n8n-nodes-base.httpRequest`

**認証**: Gmail OAuth2

**エンドポイント**: `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`

**リクエストボディ（Expression）**:
```json
{
  "raw": "={{ $json.raw_message }}"
}
```

**重要設定**:
- `batchSize`: 1（1通ずつ送信）
- `batchInterval`: 200（レート制限対策: 200ms間隔）
- `continueOnFail`: true（1通失敗しても他は送信）

---

#### NODE-027: 【AI Agent 2】空き時間候補生成（Gemini）

詳細は前述のAI Agent構成を参照

---

#### NODE-028: Geminiレスポンス解析

**タイプ**: `n8n-nodes-base.code`

**役割**: GeminiのレスポンスからJSON contentを抽出

**実装コード**:
```javascript
const response = $input.first().json;
let content = response.choices[0].message.content;

// マークダウンコードブロックを削除
content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// JSONパース
let parsedData;
try {
  parsedData = JSON.parse(content);
} catch (error) {
  throw new Error('Gemini response does not contain valid JSON: ' + content.substring(0, 200));
}

return [{
  json: {
    ...($input.first().json),
    ...parsedData
  }
}];
```

---

#### NODE-029: ステート保存

**タイプ**: `n8n-nodes-base.code`

**役割**: ユーザーの選択待ちステートをワークフローのStatic Dataに保存

**実装コード**:
```javascript
const staticData = this.getWorkflowStaticData('global');
const userId = $input.first().json.user_id;

staticData[userId] = {
  original_request: {
    event_title: $input.first().json.event_title,
    duration_minutes: $input.first().json.duration_minutes,
    attendee_emails: $input.first().json.attendee_emails,
    description: $input.first().json.description
  },
  proposed_alternatives: $input.first().json.alternative_slots,
  status: 'awaiting_selection',
  timestamp: Date.now()
};

return [{
  json: {
    ...($input.first().json),
    state_saved: true
  }
}];
```

---

#### NODE-030: ステートクリア

**タイプ**: `n8n-nodes-base.code`

**役割**: ユーザーが選択を完了したらステートを削除

**実装コード**:
```javascript
const staticData = this.getWorkflowStaticData('global');
const userId = $input.first().json.user_id;
delete staticData[userId];

return [{
  json: {
    ...($input.first().json),
    state_cleared: true
  }
}];
```

---

#### NODE-006: 保存済みステート読み込み

**タイプ**: `n8n-nodes-base.code`

**役割**: 選択フローでステートを復元

**実装コード**:
```javascript
const staticData = this.getWorkflowStaticData('global');
const userId = $input.first().json.user_id;
const savedState = staticData[userId];

if (!savedState) {
  throw new Error('No saved state found for user');
}

return [{
  json: {
    ...savedState,
    user_id: userId,
    message_content: $input.first().json.message_content
  }
}];
```

---

#### NODE-014: ユーザー選択番号解析

**タイプ**: `n8n-nodes-base.code`

**役割**: ユーザーが入力した1-5の番号を解析し、対応する候補を選択

**実装コード**:
```javascript
const message = $input.first().json.message_content;
const match = message.match(/[1-5]/);

if (!match) {
  return [{
    json: {
      ...($input.first().json),
      selection_valid: false,
      selection_number: null,
      error_message: '1-5の番号を入力してください'
    }
  }];
}

const selectionNumber = parseInt(match[0]);
const alternatives = $input.first().json.proposed_alternatives;
const selectedSlot = alternatives[selectionNumber - 1];

return [{
  json: {
    ...($input.first().json),
    selection_valid: true,
    selection_number: selectionNumber,
    event_datetime: selectedSlot.slot_datetime,
    event_title: $input.first().json.original_request.event_title,
    duration_minutes: $input.first().json.original_request.duration_minutes,
    attendee_emails: $input.first().json.original_request.attendee_emails,
    description: $input.first().json.original_request.description
  }
}];
```

---

### 出力層

#### NODE-036: Discord成功返信

**タイプ**: `n8n-nodes-base.httpRequest`

**エンドポイント**: `POST ={{ $json.callback_url }}`

**リクエストボディ（Expression）**:
```json
{
  "content": "✅ 予定を登録しました！\n\n📅 タイトル: {{ $json.event_title }}\n🕐 日時: {{ $json.event_datetime }}\n⏱️ 所要時間: {{ $json.duration_minutes }}分\n👥 参加者: {{ $json.attendee_emails.length }}名\n\n📧 通知メールを送信しました。"
}
```

---

#### NODE-037: Discord重複返信

**タイプ**: `n8n-nodes-base.httpRequest`

**エンドポイント**: `POST ={{ $json.callback_url }}`

**リクエストボディ（Expression）**:
```json
{
  "content": "⚠️ 予定が重複しています\n\n以下の候補から選択してください（番号で返信）:\n\n1️⃣ {{ $json.alternative_slots[0].slot_datetime }} - {{ $json.alternative_slots[0].reason }}\n2️⃣ {{ $json.alternative_slots[1].slot_datetime }} - {{ $json.alternative_slots[1].reason }}\n3️⃣ {{ $json.alternative_slots[2].slot_datetime }} - {{ $json.alternative_slots[2].reason }}\n4️⃣ {{ $json.alternative_slots[3].slot_datetime }} - {{ $json.alternative_slots[3].reason }}\n5️⃣ {{ $json.alternative_slots[4].slot_datetime }} - {{ $json.alternative_slots[4].reason }}\n\n番号（1-5）で返信してください。"
}
```

---

#### NODE-038: Discordエラー返信

**タイプ**: `n8n-nodes-base.httpRequest`

**エンドポイント**: `POST ={{ $json.callback_url }}`

**リクエストボディ（Expression）**:
```json
{
  "content": "❌ エラーが発生しました\n\n{{ $json.error_message || $json.validation_error || '予期しないエラーです' }}\n\nもう一度お試しいただくか、管理者にお問い合わせください。"
}
```

**重要設定**:
- `continueOnFail`: true（エラー時でもワークフロー終了を保証）
- `retryOnFail`: false（即座にフィードバック）

---

#### NODE-042: ワークフロー終了

**タイプ**: `n8n-nodes-base.noOp`

**役割**: すべてのブランチを統合してワークフローを終了

---

## 認証情報設定

### 1. OpenRouter API Key

**認証タイプ**: HTTP Header Authentication

**設定方法**:
1. n8n右上の「Settings」→「Credentials」
2. 「Create New」→「HTTP Header Auth」を選択
3. 以下のように設定:
   ```
   Name: OpenRouter API Key
   Header Name: Authorization
   Header Value: Bearer YOUR_OPENROUTER_API_KEY
   ```
4. 「Save」をクリック

**API Key取得方法**:
1. https://openrouter.ai/ にアクセス
2. 「Sign Up」でアカウント作成（無料）
3. ダッシュボード → Settings → Keys
4. 「Create New Key」をクリック
5. 生成されたキーをコピー（`sk-or-...`形式）

**重要な注意事項**:
- OpenRouterは従量課金制（Gemini freeモデルは無料）
- 使用量上限を設定することを推奨（Settings → Limits）
- 各モデルの料金: https://openrouter.ai/docs/models

---

### 2. Google Calendar OAuth2

**認証タイプ**: OAuth2

**設定方法**:
1. Google Cloud Console → APIとサービス → 認証情報
2. OAuth 2.0クライアントIDを作成
3. スコープ: `https://www.googleapis.com/auth/calendar`
4. n8nの認証情報に「Google Calendar OAuth2」として登録

---

### 3. Gmail OAuth2

**認証タイプ**: OAuth2

**設定方法**:
1. Google Cloud Console → APIとサービス → 認証情報
2. OAuth 2.0クライアントIDを作成（Calendarと同じでOK）
3. スコープ: `https://www.googleapis.com/auth/gmail.send`
4. n8nの認証情報に「Gmail OAuth2」として登録

---

## ワークフロー設定

```json
{
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "saveExecutionProgress": true,
    "timezone": "Asia/Tokyo",
    "callerPolicy": "workflowsFromSameOwner",
    "executionTimeout": 300
  }
}
```

**重要設定**:
- `executionOrder`: "v1"（新しい実行順序）
- `timezone`: "Asia/Tokyo"（日本時間）
- `executionTimeout`: 300秒（5分）

---

## 接続マップ

### 接続の完全性確認

```json
{
  "connections": {
    "Discord Bot Webhook": {
      "main": [[{"node": "Webhookデータ抽出"}]]
    },
    "Webhookデータ抽出": {
      "main": [[{"node": "ステート確認"}]]
    },
    "ステート確認": {
      "main": [[{"node": "フロー振り分け"}]]
    },
    "フロー振り分け": {
      "main": [
        [{"node": "Webhookデータ検証"}],
        [{"node": "保存済みステート読み込み"}]
      ]
    }
  }
}
```

**孤立ノード**: 0個
**トリガーから到達可能**: 全31ノード
**全ブランチマージ**: ワークフロー終了（NODE-042）

---

## テストシナリオ

### シナリオ1: 新規予定登録（重複なし、参加者あり）

**入力**:
```json
{
  "body": {
    "user_id": "test_user_001",
    "channel_id": "test_channel",
    "message_content": "明日の14:00に1時間、会議をtest@example.comと予定したい",
    "callback_url": "https://discord.com/api/webhooks/...",
    "timestamp": "2025-11-06T12:00:00+09:00"
  }
}
```

**期待される動作**:
1. AI Agent 1が予定情報を抽出
2. カレンダーから既存予定を取得
3. 重複なしと判定
4. Googleカレンダーに登録
5. AI Agent 3がメール生成
6. Gmail送信
7. Discord成功返信

---

### シナリオ2: 新規予定登録（重複あり）

**入力**:
```json
{
  "body": {
    "user_id": "test_user_002",
    "channel_id": "test_channel",
    "message_content": "明日の10:00に会議",
    "callback_url": "https://discord.com/api/webhooks/...",
    "timestamp": "2025-11-06T12:00:00+09:00"
  }
}
```

**期待される動作**:
1. AI Agent 1が予定情報を抽出
2. カレンダーから既存予定を取得
3. 重複ありと判定
4. AI Agent 2が5つの候補を生成
5. ステート保存
6. Discord重複返信（候補5つ表示）

---

### シナリオ3: 候補選択

**入力**:
```json
{
  "body": {
    "user_id": "test_user_002",
    "channel_id": "test_channel",
    "message_content": "3",
    "callback_url": "https://discord.com/api/webhooks/...",
    "timestamp": "2025-11-06T12:05:00+09:00"
  }
}
```

**期待される動作**:
1. ステート読み込み
2. 選択番号解析（3番）
3. ステートクリア
4. タイムスタンプ計算（選択された候補で）
5. Googleカレンダー登録
6. Discord成功返信

---

## デバッグガイド

### 問題: AI Agentが応答しない

**原因**:
- OpenRouter API Keyが正しく設定されていない
- モデル名が間違っている
- レート制限に達している

**対処**:
1. 認証情報「OpenRouter API Key」を確認
2. モデル名が以下のいずれかであることを確認:
   - `x-ai/grok-2-1212`
   - `google/gemini-2.0-flash-exp:free`
   - `anthropic/claude-3.5-sonnet:beta`
3. OpenRouterダッシュボードで使用量を確認

---

### 問題: JSONパースエラー

**原因**:
- AIが期待されたJSON形式で返していない
- マークダウンコードブロックが含まれている

**対処**:
1. `ai_response_raw`を確認してAIの実際のレスポンスを見る
2. レスポンス解析ノードのコードでマークダウン除去が機能しているか確認
3. temperatureを下げて（0.1-0.3）より確実なJSON出力を促す

---

### 問題: カレンダー登録失敗

**原因**:
- Google Calendar OAuth2認証が失敗している
- タイムゾーンが正しく設定されていない

**対処**:
1. 認証情報「Google Calendar OAuth2」を再設定
2. ワークフローの設定で`timezone: "Asia/Tokyo"`を確認
3. `event_datetime`、`end_datetime`が正しくISO 8601形式であることを確認

---

### 問題: メール送信失敗

**原因**:
- Gmail OAuth2認証が失敗している
- レート制限（1日2000通）に達している
- base64エンコードが正しくない

**対処**:
1. 認証情報「Gmail OAuth2」を再設定
2. Gmailダッシュボードで送信制限を確認
3. メールデータ整形ノードで`raw_message`が正しくエンコードされているか確認

---

### 問題: ステートが保存されない

**原因**:
- Static Dataの書き込み権限がない
- ユーザーIDが正しく抽出されていない

**対処**:
1. n8nのStatic Data設定を確認
2. `user_id`が各ノードで正しく伝播されているか確認
3. ステート保存ノードの実行ログを確認

---

## パフォーマンス最適化

### AI処理時間

- **Grok 2**: 5-10秒
- **Gemini 2.0 Flash**: 5-10秒
- **Claude 3.5 Sonnet**: 5-10秒

### 合計実行時間

- **重複なしフロー**: 15-25秒
  - AI Agent 1（Grok）: 5-10秒
  - カレンダー取得: 1-2秒
  - カレンダー登録: 1-2秒
  - AI Agent 3（Claude）: 5-10秒
  - Gmail送信: 1-3秒

- **重複ありフロー**: 15-20秒
  - AI Agent 1（Grok）: 5-10秒
  - カレンダー取得: 1-2秒
  - AI Agent 2（Gemini）: 5-10秒
  - ステート保存: <1秒

---

## セキュリティ考慮事項

### 認証情報の管理

- すべてのAPI KeyはRailway環境変数に保存
- n8nの認証情報ストアで暗号化保存
- ハードコード禁止

### Webhook認証

- 本番環境では`authentication: "basicAuth"`を有効化
- Discord Bot Tokenを環境変数で管理

### データプライバシー

- ユーザーのカレンダー情報はワークフロー実行時のみメモリに保存
- Static Dataのステート情報は選択完了後に削除
- メールコンテンツはGmail経由で送信され、n8nには保存されない

---

## 監視とログ

### n8n実行履歴

- n8nダッシュボード → Executions
- 各ノードの入出力を確認可能
- エラー発生時のスタックトレースを確認

### Error Workflow（オプション）

- 別途Error Workflowを作成してDiscord通知
- エラー情報をログファイルに保存

---

## スケーラビリティ

### 現状の制限

- **想定ユーザー数**: 1-10ユーザー
- **最大同時実行**: 1（ワークフローは逐次実行）
- **1日あたりの実行数**: 無制限（Railwayの制限による）

### スケールアップ時の考慮事項

- OpenRouterのレート制限（プランに依存）
- Gmail送信制限（1日2000通）
- n8nのワークフロー実行数制限（プランに依存）

---

## 次のステップ

✅ ステップ7完了：完全n8n JSON生成

次は**ステップ8: Error Workflow生成**に進みます。

---

## 参考情報

- n8n公式ドキュメント: https://docs.n8n.io/
- OpenRouter APIドキュメント: https://openrouter.ai/docs
- Google Calendar API: https://developers.google.com/calendar/api
- Gmail API: https://developers.google.com/gmail/api
