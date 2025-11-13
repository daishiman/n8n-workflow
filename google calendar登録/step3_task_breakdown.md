# Step 3: タスク分解フェーズ - ノード最適化と単一責務分解

## ワークフローメタデータ

```json
{
  "workflow_metadata": {
    "name": "Discord Calendar Manager with Multi-LLM",
    "total_nodes": 42,
    "ai_nodes": 3,
    "chat_model": "OpenRouter (HTTP Request実装)",
    "estimated_time": "15-30秒/実行",
    "complexity": "高（複数LLM、ステート管理、条件分岐）",
    "data_volume": "小（1予定/実行、1-10メール/実行）"
  }
}
```

---

## タスク詳細一覧（全42ノード）

### レイヤー0: トリガー層 (1ノード)

#### NODE-001: Discord Webhook Trigger
- **ID**: node_001_webhook_trigger
- **名前**: Discord Bot Webhook
- **説明**: Discord BotからのPOSTリクエストを受信
- **レイヤー**: トリガー
- **ノードタイプ**: n8n-nodes-base.webhook
- **実行モード**: Trigger
- **依存関係**: なし
- **AI必須**: いいえ
- **推定実行時間**: 即座
- **パラメータ**:
  ```json
  {
    "httpMethod": "POST",
    "path": "discord-calendar",
    "authentication": "basicAuth",
    "responseMode": "lastNode"
  }
  ```
- **出力データ**:
  ```json
  {
    "user_id": "string",
    "channel_id": "string",
    "message_content": "string",
    "timestamp": "string (ISO 8601)",
    "callback_url": "string (Discord Webhook URL)"
  }
  ```
- **エラーハンドリング**: なし（トリガーは常に成功）

---

### レイヤー1: データ取得層 (5ノード)

#### NODE-002: Extract Webhook Data
- **ID**: node_002_extract_webhook
- **名前**: Webhookデータ抽出
- **説明**: Webhookボディから必要なフィールドを抽出・整形
- **レイヤー**: 取得
- **ノードタイプ**: n8n-nodes-base.set
- **実行モード**: Run once for all items
- **依存関係**: [NODE-001]
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **データ変換**:
  ```javascript
  {
    "user_id": "={{ $json.body.user_id }}",
    "channel_id": "={{ $json.body.channel_id }}",
    "message_content": "={{ $json.body.message_content }}",
    "callback_url": "={{ $json.body.callback_url }}",
    "request_timestamp": "={{ $json.body.timestamp }}"
  }
  ```
- **エラーハンドリング**:
  - 戦略: continueOnFail
  - フォールバック: Discordにエラー返信

#### NODE-003: Check State (Is Selection Flow?)
- **ID**: node_003_check_state
- **名前**: ステート確認（選択フローか判定）
- **説明**: Static Dataにユーザーの一時保存データがあるか確認
- **レイヤー**: 取得
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-002]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **コードロジック**:
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
- **エラーハンドリング**: continueOnFail

#### NODE-004: Get Calendar Events
- **ID**: node_004_get_calendar
- **名前**: Googleカレンダー既存予定取得
- **説明**: 指定日時±48時間の既存予定を取得
- **レイヤー**: 取得
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-010] (AI予定抽出後)
- **AI必須**: いいえ
- **推定実行時間**: 1-3秒
- **APIリクエスト**:
  ```json
  {
    "method": "GET",
    "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    "authentication": "oAuth2",
    "qs": {
      "timeMin": "={{ $json.event_datetime_minus_24h }}",
      "timeMax": "={{ $json.event_datetime_plus_48h }}",
      "singleEvents": true,
      "orderBy": "startTime"
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (3回)
  - フォールバック: Error Workflow

#### NODE-005: Parse Calendar Response
- **ID**: node_005_parse_calendar
- **名前**: カレンダーレスポンス整形
- **説明**: Google Calendar APIレスポンスを重複チェック用に整形
- **レイヤー**: 取得
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-004]
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **コードロジック**:
  ```javascript
  const events = $input.first().json.items || [];
  const formattedEvents = events.map(event => ({
    title: event.summary,
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
- **エラーハンドリング**: continueOnFail

#### NODE-006: Load Saved State (Selection Flow)
- **ID**: node_006_load_state
- **名前**: 保存済みステート読み込み
- **説明**: 重複後のユーザー選択フロー用の保存データを取得
- **レイヤー**: 取得
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-003] (選択フローの場合のみ)
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **コードロジック**:
  ```javascript
  const staticData = this.getWorkflowStaticData('global');
  const userId = $input.first().json.user_id;
  const savedState = staticData[userId];

  return [{
    json: {
      ...savedState,
      user_id: userId,
      message_content: $input.first().json.message_content
    }
  }];
  ```
- **エラーハンドリング**: continueOnFail

---

### レイヤー2: データ検証層 (4ノード)

#### NODE-007: Validate Webhook Data
- **ID**: node_007_validate_webhook
- **名前**: Webhookデータ検証
- **説明**: 必須フィールドの存在確認
- **レイヤー**: 検証
- **ノードタイプ**: n8n-nodes-base.if
- **実行モード**: Run once for all items
- **依存関係**: [NODE-002]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **検証条件**:
  ```json
  {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.message_content }}",
          "operation": "isNotEmpty"
        },
        {
          "value1": "={{ $json.user_id }}",
          "operation": "isNotEmpty"
        },
        {
          "value1": "={{ $json.callback_url }}",
          "operation": "contains",
          "value2": "https://"
        }
      ]
    },
    "combineOperation": "all"
  }
  ```
- **エラーハンドリング**: FALSE分岐 → NODE-038（エラー返信）

#### NODE-008: Validate AI Extraction
- **ID**: node_008_validate_ai
- **名前**: AI抽出結果検証
- **説明**: Grok抽出結果のスキーマ検証
- **レイヤー**: 検証
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-010] (AI予定抽出後)
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **検証ロジック**:
  ```javascript
  const data = $input.first().json;
  const isValid =
    data.event_title && typeof data.event_title === 'string' &&
    data.event_datetime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.event_datetime) &&
    data.duration_minutes && typeof data.duration_minutes === 'number' &&
    Array.isArray(data.attendee_emails);

  return [{
    json: {
      ...data,
      validation_passed: isValid,
      validation_error: isValid ? null : "Invalid AI extraction format"
    }
  }];
  ```
- **エラーハンドリング**: validation_passed=false → NODE-038（エラー返信）

#### NODE-009: Check Validation Result
- **ID**: node_009_check_validation
- **名前**: 検証結果チェック
- **説明**: AI抽出結果の検証が成功したか確認
- **レイヤー**: 検証
- **ノードタイプ**: n8n-nodes-base.if
- **実行モード**: Run once for all items
- **依存関係**: [NODE-008]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **条件**:
  ```json
  {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.validation_passed }}",
          "value2": true
        }
      ]
    }
  }
  ```
- **エラーハンドリング**: FALSE → NODE-038（エラー返信）

#### NODE-010: (参照先: AI予定抽出は後述)

---

### レイヤー3: データ変換層 (7ノード)

#### NODE-010: AI Schedule Extraction (Grok)
- **ID**: node_010_ai_grok
- **名前**: 【AI Agent 1】Discord予定抽出（Grok）
- **説明**: OpenRouter経由でGrok 2を呼び出し、自然言語メッセージから予定情報を抽出
- **レイヤー**: 変換
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-007] (検証OK後)
- **AI必須**: はい
- **AI責務**: Discordメッセージ（自然言語）→ 構造化JSON変換（予定タイトル、日時、所要時間、参加者抽出）
- **推定実行時間**: 5-10秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "headerAuth",
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.openRouter.apiKey }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "x-ai/grok-2-1212"
        },
        {
          "name": "messages",
          "value": [
            {
              "role": "system",
              "content": "あなたは予定情報抽出の専門家です。Discordメッセージから予定情報を抽出し、JSON形式で出力してください。"
            },
            {
              "role": "user",
              "content": "以下のメッセージから予定情報を抽出してください:\n\n{{ $json.message_content }}\n\n以下のJSON形式で出力してください（JSON以外は出力しないこと）:\n{\n  \"event_title\": \"予定のタイトル\",\n  \"event_datetime\": \"YYYY-MM-DDTHH:MM:SS+09:00\",\n  \"duration_minutes\": 60,\n  \"attendee_emails\": [\"email@example.com\"],\n  \"description\": \"補足説明\"\n}\n\nルール:\n- 日時は日本時間（+09:00）で出力\n- 時刻不明なら9:00、所要時間不明なら60分\n- メールアドレスがなければ空配列"
            }
          ]
        },
        {
          "name": "temperature",
          "value": 0.3
        },
        {
          "name": "max_tokens",
          "value": 1000
        }
      ]
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (2回)
  - フォールバック: NODE-038（エラー返信）

#### NODE-011: Parse Grok Response
- **ID**: node_011_parse_grok
- **名前**: Grokレスポンス解析
- **説明**: OpenRouterレスポンスからJSON部分を抽出・パース
- **レイヤー**: 変換
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-010]
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **コードロジック**:
  ```javascript
  const response = $input.first().json;
  const content = response.choices[0].message.content;

  // JSONブロックを抽出（```json ... ``` または { ... } を検索）
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                    content.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error("AI response does not contain valid JSON");
  }

  const extractedData = JSON.parse(jsonMatch[1]);

  return [{
    json: {
      ...($input.first().json),
      ...extractedData,
      ai_raw_response: content
    }
  }];
  ```
- **エラーハンドリング**: continueOnFail → NODE-038（エラー返信）

#### NODE-012: Calculate Timestamps
- **ID**: node_012_calc_timestamps
- **名前**: タイムスタンプ計算
- **説明**: 予定の開始・終了時刻をUnix timestampに変換
- **レイヤー**: 変換
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-011]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **コードロジック**:
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
- **エラーハンドリング**: continueOnFail

#### NODE-013: Format Email Data
- **ID**: node_013_format_email
- **名前**: メールデータ整形
- **説明**: Gmail送信用のRFC 2822形式データ準備（Base64エンコード前）
- **レイヤー**: 変換
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-025] (Claude生成後)
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **コードロジック**:
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
        raw_message: Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    };
  });

  return emailMessages;
  ```
- **エラーハンドリング**: continueOnFail

#### NODE-014: Parse Selection Number
- **ID**: node_014_parse_selection
- **名前**: ユーザー選択番号解析
- **説明**: Discordメッセージから選択番号（1-5）を抽出
- **レイヤー**: 変換
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-006] (選択フロー時)
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **コードロジック**:
  ```javascript
  const message = $input.first().json.message_content;
  const match = message.match(/[1-5]/);

  if (!match) {
    return [{
      json: {
        ...($input.first().json),
        selection_valid: false,
        selection_number: null
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
- **エラーハンドリング**: selection_valid=false → NODE-038（エラー返信）

#### NODE-015: (予約 - 追加の変換ノード用)
#### NODE-016: (予約 - 追加の変換ノード用)

---

### レイヤー4: 判断層 (6ノード)

#### NODE-017: Route: Initial or Selection
- **ID**: node_017_route_flow
- **名前**: フロー振り分け（初回 or 選択）
- **説明**: Webhookが初回実行か選択フローか判定
- **レイヤー**: 判断
- **ノードタイプ**: n8n-nodes-base.if
- **実行モード**: Run once for all items
- **依存関係**: [NODE-003]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **条件**:
  ```json
  {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.is_selection_flow }}",
          "value2": false
        }
      ]
    }
  }
  ```
- **分岐**:
  - TRUE: 初回フロー → NODE-007（検証）
  - FALSE: 選択フロー → NODE-006（ステート読み込み）

#### NODE-018: Check Conflict
- **ID**: node_018_check_conflict
- **名前**: 予定重複判定
- **説明**: 既存予定と新規予定の時間帯が重複しているか判定
- **レイヤー**: 判断
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-012, NODE-005]
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **判定ロジック**:
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
- **エラーハンドリング**: continueOnFail

#### NODE-019: Route: Conflict or No Conflict
- **ID**: node_019_route_conflict
- **名前**: 重複有無で分岐
- **説明**: 重複判定結果に基づいてフローを振り分け
- **レイヤー**: 判断
- **ノードタイプ**: n8n-nodes-base.if
- **実行モード**: Run once for all items
- **依存関係**: [NODE-018]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **条件**:
  ```json
  {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.has_conflict }}",
          "value2": false
        }
      ]
    }
  }
  ```
- **分岐**:
  - TRUE (重複なし): NODE-020（予定登録）
  - FALSE (重複あり): NODE-023（候補生成AI）

#### NODE-020: Check Email Needed
- **ID**: node_020_check_email
- **名前**: メール送信要否判定
- **説明**: 参加者メールアドレスが存在するか確認
- **レイヤー**: 判断
- **ノードタイプ**: n8n-nodes-base.if
- **実行モード**: Run once for all items
- **依存関係**: [NODE-021] (Calendar登録後)
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **条件**:
  ```json
  {
    "conditions": {
      "number": [
        {
          "value1": "={{ $json.attendee_emails.length }}",
          "operation": "larger",
          "value2": 0
        }
      ]
    }
  }
  ```
- **分岐**:
  - TRUE: NODE-024（メール生成AI）
  - FALSE: NODE-035（Discord成功返信）

#### NODE-021: Validate Selection
- **ID**: node_021_validate_selection
- **名前**: 選択番号検証
- **説明**: ユーザーの選択が1-5の範囲内か確認
- **レイヤー**: 判断
- **ノードタイプ**: n8n-nodes-base.if
- **実行モード**: Run once for all items
- **依存関係**: [NODE-014]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **条件**:
  ```json
  {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.selection_valid }}",
          "value2": true
        }
      ]
    }
  }
  ```
- **分岐**:
  - TRUE: NODE-022（Calendar登録）
  - FALSE: NODE-038（エラー返信）

#### NODE-022: (予約 - 追加の判断ノード用)

---

### レイヤー5: 実行層 (12ノード)

#### NODE-023: Google Calendar Insert
- **ID**: node_023_calendar_insert
- **名前**: Googleカレンダー予定登録
- **説明**: 新規イベントをカレンダーに追加
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-019 (重複なし) または NODE-021 (選択後)]
- **AI必須**: いいえ
- **推定実行時間**: 1-2秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    "authentication": "oAuth2",
    "body": {
      "summary": "={{ $json.event_title }}",
      "description": "={{ $json.description }}",
      "start": {
        "dateTime": "={{ $json.event_datetime }}",
        "timeZone": "Asia/Tokyo"
      },
      "end": {
        "dateTime": "={{ $json.end_datetime }}",
        "timeZone": "Asia/Tokyo"
      },
      "attendees": "={{ $json.attendee_emails.map(email => ({email})) }}",
      "reminders": {
        "useDefault": true
      }
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (2回)
  - フォールバック: Error Workflow + Discord返信

#### NODE-024: AI Email Generation (Claude)
- **ID**: node_024_ai_claude
- **名前**: 【AI Agent 3】通知メール生成（Claude）
- **説明**: OpenRouter経由でClaude 4.5 Sonnetを呼び出し、メール本文を生成
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-020 (メール必要時)]
- **AI必須**: はい
- **AI責務**: 予定情報 → 丁寧でビジネスライクな通知メール文章生成（件名・HTML本文・プレーンテキスト）
- **推定実行時間**: 5-10秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "headerAuth",
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.openRouter.apiKey }}"
        }
      ]
    },
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "anthropic/claude-4.5-sonnet:beta"
        },
        {
          "name": "messages",
          "value": [
            {
              "role": "system",
              "content": "あなたはビジネスメール作成の専門家です。予定情報から丁寧で明確な通知メールを作成してください。"
            },
            {
              "role": "user",
              "content": "以下の予定情報から通知メールを作成してください:\n\nタイトル: {{ $json.event_title }}\n日時: {{ $json.event_datetime }}\n所要時間: {{ $json.duration_minutes }}分\n参加者: {{ $json.attendee_emails.join(', ') }}\n説明: {{ $json.description }}\n\nJSON形式で出力（JSON以外は出力しないこと）:\n{\n  \"email_subject\": \"件名\",\n  \"email_body_html\": \"<html><body>...</body></html>\",\n  \"email_body_plain\": \"プレーンテキスト版\"\n}\n\n要件:\n- 件名は「【予定通知】」で始める\n- 日時・所要時間を明記\n- 参加者への配慮を含める"
            }
          ]
        },
        {
          "name": "temperature",
          "value": 0.8
        },
        {
          "name": "max_tokens",
          "value": 1500
        }
      ]
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (2回)
  - フォールバック: デフォルトメール本文を使用

#### NODE-025: Parse Claude Response
- **ID**: node_025_parse_claude
- **名前**: Claudeレスポンス解析
- **説明**: OpenRouterレスポンスからJSON部分を抽出・パース
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-024]
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **コードロジック**: (NODE-011と同様のJSON抽出ロジック)
- **エラーハンドリング**: continueOnFail → デフォルトメール使用

#### NODE-026: Gmail Send
- **ID**: node_026_gmail_send
- **名前**: Gmail送信
- **説明**: 参加者全員に通知メールを送信
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for each item (Loop)
- **依存関係**: [NODE-013 (データ整形後)]
- **AI必須**: いいえ
- **推定実行時間**: 1-2秒/メール
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    "authentication": "oAuth2",
    "body": {
      "raw": "={{ $json.raw_message }}"
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: continueOnFail
  - フォールバック: エラーは記録するが処理続行

#### NODE-027: AI Alternative Generation (Gemini)
- **ID**: node_027_ai_gemini
- **名前**: 【AI Agent 2】空き時間候補生成（Gemini）
- **説明**: OpenRouter経由でGemini 2.5 Flashを呼び出し、代替候補を提案
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-019 (重複あり時)]
- **AI必須**: はい
- **AI責務**: 既存予定リスト + 希望日時 → 重複しない空き時間候補を5つ提案（今日・明日の2日分、営業時間内優先、理由付き）
- **推定実行時間**: 5-10秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "headerAuth",
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.openRouter.apiKey }}"
        }
      ]
    },
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "google/gemini-2.5-flash-exp:free"
        },
        {
          "name": "messages",
          "value": [
            {
              "role": "system",
              "content": "あなたはカレンダー分析の専門家です。既存予定と重複しない最適な時間帯を提案してください。"
            },
            {
              "role": "user",
              "content": "希望日時: {{ $json.event_datetime }}\n所要時間: {{ $json.duration_minutes }}分\n既存予定: {{ JSON.stringify($json.existing_events) }}\n対象期間: 今日と明日（{{ $now.toFormat('yyyy-MM-dd') }}から{{ $now.plus({days: 1}).toFormat('yyyy-MM-dd') }}）\n\n重複しない空き時間の候補を5つ提案してください。JSON形式で出力（JSON以外は出力しないこと）:\n{\n  \"alternative_slots\": [\n    {\n      \"slot_datetime\": \"YYYY-MM-DDTHH:MM:SS+09:00\",\n      \"reason\": \"推奨理由（50文字以内）\"\n    }\n  ]\n}\n\n要件:\n- 候補は5つ\n- 営業時間内（9:00-18:00）を優先\n- 理由は具体的に"
            }
          ]
        },
        {
          "name": "temperature",
          "value": 0.7
        },
        {
          "name": "max_tokens",
          "value": 2000
        }
      ]
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (2回)
  - フォールバック: Error Workflow

#### NODE-028: Parse Gemini Response
- **ID**: node_028_parse_gemini
- **名前**: Geminiレスポンス解析
- **説明**: OpenRouterレスポンスからJSON部分を抽出・パース
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-027]
- **AI必須**: いいえ
- **推定実行時間**: <100ms
- **コードロジック**: (NODE-011と同様のJSON抽出ロジック)
- **エラーハンドリング**: continueOnFail → Error Workflow

#### NODE-029: Save State to Static Data
- **ID**: node_029_save_state
- **名前**: ステート保存（重複時）
- **説明**: ユーザー選択待ち状態をStatic Dataに保存
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-028]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **コードロジック**:
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
- **エラーハンドリング**: continueOnFail

#### NODE-030: Clear State from Static Data
- **ID**: node_030_clear_state
- **名前**: ステートクリア（選択後）
- **説明**: 予定登録完了後、Static Dataから該当ユーザーのエントリを削除
- **レイヤー**: 実行
- **ノードタイプ**: n8n-nodes-base.code
- **実行モード**: Run once for all items
- **依存関係**: [NODE-023 (選択フロー時の登録後)]
- **AI必須**: いいえ
- **推定実行時間**: <50ms
- **コードロジック**:
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
- **エラーハンドリング**: continueOnFail

#### NODE-031-034: (予約 - 追加の実行ノード用)

---

### レイヤー6: データ統合層 (1ノード)

#### NODE-035: Merge Error Flows
- **ID**: node_035_merge_errors
- **名前**: エラーフロー統合
- **説明**: 各レイヤーのエラーを一箇所に集約（実際はError Workflow Triggerで対応）
- **レイヤー**: 統合
- **ノードタイプ**: (実装なし - Error Workflowで代替)
- **実行モード**: N/A
- **依存関係**: N/A
- **AI必須**: いいえ

---

### レイヤー7: 出力層 (6ノード)

#### NODE-036: Discord Reply Success
- **ID**: node_036_discord_success
- **名前**: Discord成功返信
- **説明**: 予定登録完了メッセージをDiscordに送信
- **レイヤー**: 出力
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-026 (メール送信後) または NODE-020 (メール不要時)]
- **AI必須**: いいえ
- **推定実行時間**: 1秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "={{ $json.callback_url }}",
    "body": {
      "content": "✅ 予定を登録しました！\n\n📅 タイトル: {{ $json.event_title }}\n🕐 日時: {{ $json.event_datetime }}\n⏱️ 所要時間: {{ $json.duration_minutes }}分\n👥 参加者: {{ $json.attendee_emails.length }}名\n\n📧 通知メールを送信しました。"
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (2回)
  - フォールバック: Error Workflow

#### NODE-037: Discord Reply Conflict
- **ID**: node_037_discord_conflict
- **名前**: Discord重複返信
- **説明**: 重複メッセージ + 候補5つをDiscordに送信
- **レイヤー**: 出力
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: [NODE-029 (ステート保存後)]
- **AI必須**: いいえ
- **推定実行時間**: 1秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "={{ $json.callback_url }}",
    "body": {
      "content": "⚠️ 予定が重複しています\n\n以下の候補から選択してください（番号で返信）:\n\n1️⃣ {{ $json.alternative_slots[0].slot_datetime }} - {{ $json.alternative_slots[0].reason }}\n2️⃣ {{ $json.alternative_slots[1].slot_datetime }} - {{ $json.alternative_slots[1].reason }}\n3️⃣ {{ $json.alternative_slots[2].slot_datetime }} - {{ $json.alternative_slots[2].reason }}\n4️⃣ {{ $json.alternative_slots[3].slot_datetime }} - {{ $json.alternative_slots[3].reason }}\n5️⃣ {{ $json.alternative_slots[4].slot_datetime }} - {{ $json.alternative_slots[4].reason }}\n\n番号（1-5）で返信してください。"
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: retry (2回)
  - フォールバック: Error Workflow

#### NODE-038: Discord Reply Error
- **ID**: node_038_discord_error
- **名前**: Discordエラー返信
- **説明**: エラーメッセージをDiscordに送信
- **レイヤー**: 出力
- **ノードタイプ**: n8n-nodes-base.httpRequest
- **実行モード**: Run once for all items
- **依存関係**: 各検証ノードのエラー分岐
- **AI必須**: いいえ
- **推定実行時間**: 1秒
- **APIリクエスト**:
  ```json
  {
    "method": "POST",
    "url": "={{ $json.callback_url }}",
    "body": {
      "content": "❌ エラーが発生しました\n\n{{ $json.error_message || '予期しないエラーです' }}\n\nもう一度お試しいただくか、管理者にお問い合わせください。"
    }
  }
  ```
- **エラーハンドリング**:
  - 戦略: continueOnFail
  - フォールバック: ログ記録のみ

#### NODE-039-041: (予約 - 追加の出力ノード用)

#### NODE-042: No Operation (Workflow End)
- **ID**: node_042_noop
- **名前**: ワークフロー終了
- **説明**: 処理完了を示すダミーノード
- **レイヤー**: 出力
- **ノードタイプ**: n8n-nodes-base.noOp
- **実行モード**: Run once for all items
- **依存関係**: [NODE-036, NODE-037, NODE-038]
- **AI必須**: いいえ

---

## タスク分解サマリー

### 統計情報
- **総ノード数**: 42個（適正範囲: 10-50 ✅）
- **AI使用ノード数**: 3個（Grok、Gemini、Claude）
- **推定実行時間**:
  - 重複なし: 20-30秒
  - 重複あり（候補提案まで）: 25-35秒
  - 選択後登録: 15-25秒
- **データ処理規模**: 小（1予定/実行、1-10メール）

### レイヤー別内訳

| レイヤー | ノード数 | 主要ノード | AI使用 |
|----------|----------|-----------|--------|
| 0. トリガー | 1 | Webhook Trigger | - |
| 1. 取得 | 5 | HTTP Request (Calendar), Code | - |
| 2. 検証 | 4 | IF, Code | - |
| 3. 変換 | 7 | HTTP Request (AI x3), Code | ✅ Grok |
| 4. 判断 | 6 | IF, Code | - |
| 5. 実行 | 12 | HTTP Request (Calendar/Gmail/AI x2), Code | ✅ Gemini, Claude |
| 6. 統合 | 1 | (Error Workflow代替) | - |
| 7. 出力 | 6 | HTTP Request (Discord x3) | - |

### AI単一責務の確認

✅ **AI Agent 1 (Grok)**: Discord自然言語 → 構造化JSON変換のみ
✅ **AI Agent 2 (Gemini)**: カレンダー分析・代替候補5つ提案のみ
✅ **AI Agent 3 (Claude)**: 通知メール文章生成のみ

各AIエージェントは明確に1つの責務のみを持ちます。

---

## ワークフロー接続マトリックス（簡易版）

```
NODE-001 (Webhook) → NODE-002 (Extract)
NODE-002 → NODE-003 (State Check)
NODE-003 → NODE-017 (Route Flow)
  ├─ TRUE (初回) → NODE-007 (Validate) → NODE-010 (AI Grok)
  └─ FALSE (選択) → NODE-006 (Load State) → NODE-014 (Parse Selection)

NODE-010 → NODE-011 (Parse) → NODE-012 (Calc) → NODE-004 (Get Calendar)
NODE-004 → NODE-005 (Parse Calendar) → NODE-018 (Check Conflict)
NODE-018 → NODE-019 (Route Conflict)
  ├─ TRUE (重複なし) → NODE-023 (Insert Calendar) → NODE-020 (Check Email)
  │                                                    ├─ TRUE → NODE-024 (AI Claude)
  │                                                    └─ FALSE → NODE-036 (Discord Success)
  └─ FALSE (重複あり) → NODE-027 (AI Gemini) → NODE-028 (Parse) → NODE-029 (Save State)
                                                                   → NODE-037 (Discord Conflict)

NODE-014 → NODE-021 (Validate Selection) → NODE-023 (Insert) → NODE-030 (Clear State)
                                                                → NODE-024 (AI Claude)

NODE-024 → NODE-025 (Parse) → NODE-013 (Format Email) → NODE-026 (Gmail Send)
                                                         → NODE-036 (Discord Success)

エラー → NODE-038 (Discord Error)
```

---

✅ **ユーザー確認**: このタスク分解（42ノード、AI単一責務）で問題ありませんか？

次は**Step 4: パターン適用フェーズ（並列/ループ/条件分岐の特定）**に進みます！
