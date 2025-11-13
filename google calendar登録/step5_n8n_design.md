# Step 5: n8n設計変換フェーズ - 詳細設計

## 設計原則

### 重要: デフォルト値を信頼しない
⚠️ すべてのパラメータを明示的に設定し、デフォルト値に依存しません。
これはランタイムエラーを防ぐための最重要原則です。

---

## ノード詳細設計（全42ノード）

### トリガー層

#### NODE-001: Discord Bot Webhook
```json
{
  "id": "webhook_trigger_001",
  "name": "Discord Bot Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [240, 300],
  "webhookId": "discord-calendar-webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "discord-calendar",
    "authentication": "basicAuth",
    "responseMode": "lastNode",
    "options": {
      "rawBody": false
    }
  },
  "credentials": {
    "httpBasicAuth": {
      "id": "1",
      "name": "Discord Webhook Basic Auth"
    }
  }
}
```

**Expression使用箇所**: なし
**認証情報**: Basic Auth（開発時はNoneでも可）

---

### 取得層

#### NODE-002: Webhookデータ抽出
```json
{
  "id": "set_extract_002",
  "name": "Webhookデータ抽出",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.3,
  "position": [460, 300],
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "user_id_field",
          "name": "user_id",
          "value": "={{ $json.body.user_id }}",
          "type": "string"
        },
        {
          "id": "channel_id_field",
          "name": "channel_id",
          "value": "={{ $json.body.channel_id }}",
          "type": "string"
        },
        {
          "id": "message_content_field",
          "name": "message_content",
          "value": "={{ $json.body.message_content }}",
          "type": "string"
        },
        {
          "id": "callback_url_field",
          "name": "callback_url",
          "value": "={{ $json.body.callback_url }}",
          "type": "string"
        },
        {
          "id": "request_timestamp_field",
          "name": "request_timestamp",
          "value": "={{ $json.body.timestamp }}",
          "type": "string"
        }
      ]
    },
    "options": {}
  }
}
```

**Expression使用箇所**:
- `user_id`: `={{ $json.body.user_id }}`
- `message_content`: `={{ $json.body.message_content }}`
- `callback_url`: `={{ $json.body.callback_url }}`

---

#### NODE-003: ステート確認
```json
{
  "id": "code_check_state_003",
  "name": "ステート確認",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [680, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const staticData = this.getWorkflowStaticData('global');\nconst userId = $input.first().json.user_id;\nconst savedState = staticData[userId];\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    is_selection_flow: !!savedState,\n    saved_state: savedState || null\n  }\n}];"
  }
}
```

**Expression使用箇所**: なし（JavaScript内で処理）
**重要**: `this.getWorkflowStaticData('global')`でグローバルStatic Dataにアクセス

---

#### NODE-004: Googleカレンダー既存予定取得
```json
{
  "id": "http_get_calendar_004",
  "name": "Googleカレンダー既存予定取得",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1560, 300],
  "parameters": {
    "method": "GET",
    "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    "authentication": "oAuth2",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "timeMin",
          "value": "={{ $json.event_datetime_minus_24h }}"
        },
        {
          "name": "timeMax",
          "value": "={{ $json.event_datetime_plus_48h }}"
        },
        {
          "name": "singleEvents",
          "value": "true"
        },
        {
          "name": "orderBy",
          "value": "startTime"
        }
      ]
    },
    "options": {
      "timeout": 30000,
      "redirect": {
        "redirect": {}
      }
    }
  },
  "credentials": {
    "googleCalendarOAuth2Api": {
      "id": "2",
      "name": "Google Calendar OAuth2"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1000
}
```

**Expression使用箇所**:
- `timeMin`: `={{ $json.event_datetime_minus_24h }}`（NODE-012で計算）
- `timeMax`: `={{ $json.event_datetime_plus_48h }}`

**認証情報**: Google Calendar OAuth2

---

#### NODE-005: カレンダーレスポンス整形
```json
{
  "id": "code_parse_calendar_005",
  "name": "カレンダーレスポンス整形",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1780, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const events = $input.first().json.items || [];\nconst formattedEvents = events.map(event => ({\n  title: event.summary || 'No Title',\n  start_datetime: event.start.dateTime,\n  end_datetime: event.end.dateTime,\n  start_ts: new Date(event.start.dateTime).getTime(),\n  end_ts: new Date(event.end.dateTime).getTime()\n}));\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    existing_events: formattedEvents\n  }\n}];"
  }
}
```

---

#### NODE-006: 保存済みステート読み込み
```json
{
  "id": "code_load_state_006",
  "name": "保存済みステート読み込み",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [900, 500],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const staticData = this.getWorkflowStaticData('global');\nconst userId = $input.first().json.user_id;\nconst savedState = staticData[userId];\n\nif (!savedState) {\n  throw new Error('No saved state found for user');\n}\n\nreturn [{\n  json: {\n    ...savedState,\n    user_id: userId,\n    message_content: $input.first().json.message_content\n  }\n}];"
  }
}
```

---

### 検証層

#### NODE-007: Webhookデータ検証
```json
{
  "id": "if_validate_webhook_007",
  "name": "Webhookデータ検証",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [900, 300],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition_1",
          "leftValue": "={{ $json.message_content }}",
          "rightValue": "",
          "operator": {
            "type": "string",
            "operation": "notEmpty"
          }
        },
        {
          "id": "condition_2",
          "leftValue": "={{ $json.user_id }}",
          "rightValue": "",
          "operator": {
            "type": "string",
            "operation": "notEmpty"
          }
        },
        {
          "id": "condition_3",
          "leftValue": "={{ $json.callback_url }}",
          "rightValue": "https://",
          "operator": {
            "type": "string",
            "operation": "contains"
          }
        }
      ],
      "combinator": "and"
    }
  }
}
```

**Expression使用箇所**:
- 条件1: `={{ $json.message_content }}`が空でない
- 条件2: `={{ $json.user_id }}`が空でない
- 条件3: `={{ $json.callback_url }}`が"https://"を含む

---

#### NODE-008: AI抽出結果検証
```json
{
  "id": "code_validate_ai_008",
  "name": "AI抽出結果検証",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1340, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const data = $input.first().json;\nconst isValid = \n  data.event_title && typeof data.event_title === 'string' &&\n  data.event_datetime && /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/.test(data.event_datetime) &&\n  data.duration_minutes && typeof data.duration_minutes === 'number' && data.duration_minutes > 0 &&\n  Array.isArray(data.attendee_emails);\n\nreturn [{\n  json: {\n    ...data,\n    validation_passed: isValid,\n    validation_error: isValid ? null : 'Invalid AI extraction format'\n  }\n}];"
  }
}
```

---

#### NODE-009: 検証結果チェック
```json
{
  "id": "if_check_validation_009",
  "name": "検証結果チェック",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [1460, 300],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition_1",
          "leftValue": "={{ $json.validation_passed }}",
          "rightValue": true,
          "operator": {
            "type": "boolean",
            "operation": "true"
          }
        }
      ]
    }
  }
}
```

---

### 変換層

#### NODE-010: Discord予定抽出（AI Grok）
```json
{
  "id": "http_ai_grok_010",
  "name": "Discord予定抽出(Grok)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1120, 300],
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": []
    },
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"x-ai/grok-2-1212\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"あなたは予定情報抽出の専門家です。Discordメッセージから予定情報を抽出し、JSON形式で出力してください。JSON以外は一切出力しないでください。\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"以下のメッセージから予定情報を抽出してください:\\n\\n{{ $json.message_content }}\\n\\n以下のJSON形式で出力してください（JSON以外は出力しないこと）:\\n{\\n  \\\"event_title\\\": \\\"予定のタイトル\\\",\\n  \\\"event_datetime\\\": \\\"YYYY-MM-DDTHH:MM:SS+09:00\\\",\\n  \\\"duration_minutes\\\": 60,\\n  \\\"attendee_emails\\\": [\\\"email@example.com\\\"],\\n  \\\"description\\\": \\\"補足説明\\\"\\n}\\n\\nルール:\\n- 日時は日本時間（+09:00）で出力\\n- 時刻不明なら9:00、所要時間不明なら60分\\n- メールアドレスがなければ空配列\"\n    }\n  ],\n  \"temperature\": 0.3,\n  \"max_tokens\": 1000,\n  \"top_p\": 0.9\n}",
    "options": {
      "timeout": 30000
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "3",
      "name": "OpenRouter API"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 3000
}
```

**Expression使用箇所**:
- `jsonBody`: メッセージ内容を`{{ $json.message_content }}`で埋め込み

**認証情報**: OpenRouter API（Header Auth、Bearer Token形式）

**認証情報設定例**:
```json
{
  "name": "Authorization",
  "value": "Bearer YOUR_OPENROUTER_API_KEY"
}
```

---

#### NODE-011: Grokレスポンス解析
```json
{
  "id": "code_parse_grok_011",
  "name": "Grokレスポンス解析",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1240, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const response = $input.first().json;\nconst content = response.choices[0].message.content;\n\n// JSONブロックを抽出（```json ... ``` または { ... } を検索）\nconst jsonMatch = content.match(/```json\\s*([\\s\\S]*?)\\s*```/) || \n                  content.match(/(\\{[\\s\\S]*\\})/);\n\nif (!jsonMatch) {\n  throw new Error('AI response does not contain valid JSON: ' + content.substring(0, 200));\n}\n\nconst extractedData = JSON.parse(jsonMatch[1]);\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    ...extractedData,\n    ai_raw_response: content\n  }\n}];"
  }
}
```

---

#### NODE-012: タイムスタンプ計算
```json
{
  "id": "code_calc_timestamps_012",
  "name": "タイムスタンプ計算",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1580, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const data = $input.first().json;\nconst startDate = new Date(data.event_datetime);\nconst endDate = new Date(startDate.getTime() + data.duration_minutes * 60 * 1000);\n\nreturn [{\n  json: {\n    ...data,\n    start_timestamp: startDate.getTime(),\n    end_timestamp: endDate.getTime(),\n    end_datetime: endDate.toISOString(),\n    event_datetime_minus_24h: new Date(startDate.getTime() - 24*60*60*1000).toISOString(),\n    event_datetime_plus_48h: new Date(startDate.getTime() + 48*60*60*1000).toISOString()\n  }\n}];"
  }
}
```

---

#### NODE-013: メールデータ整形
```json
{
  "id": "code_format_email_013",
  "name": "メールデータ整形",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [2720, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const data = $input.first().json;\nconst emailSubject = data.email_subject;\nconst emailBody = data.email_body_html;\nconst attendees = data.attendee_emails || [];\n\nconst emailMessages = attendees.map(email => {\n  const rawMessage = [\n    `From: your-email@gmail.com`,\n    `To: ${email}`,\n    `Subject: ${emailSubject}`,\n    `Content-Type: text/html; charset=UTF-8`,\n    ``,\n    emailBody\n  ].join('\\r\\n');\n  \n  return {\n    json: {\n      to_email: email,\n      raw_message: Buffer.from(rawMessage).toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, ''),\n      event_title: data.event_title,\n      callback_url: data.callback_url,\n      user_id: data.user_id\n    }\n  };\n});\n\nreturn emailMessages;"
  }
}
```

**重要**: このノードは参加者数分のアイテム配列を返します（Loop準備）

---

#### NODE-014: ユーザー選択番号解析
```json
{
  "id": "code_parse_selection_014",
  "name": "ユーザー選択番号解析",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1120, 500],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const message = $input.first().json.message_content;\nconst match = message.match(/[1-5]/);\n\nif (!match) {\n  return [{\n    json: {\n      ...($input.first().json),\n      selection_valid: false,\n      selection_number: null,\n      error_message: '1-5の番号を入力してください'\n    }\n  }];\n}\n\nconst selectionNumber = parseInt(match[0]);\nconst alternatives = $input.first().json.proposed_alternatives;\nconst selectedSlot = alternatives[selectionNumber - 1];\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    selection_valid: true,\n    selection_number: selectionNumber,\n    event_datetime: selectedSlot.slot_datetime,\n    event_title: $input.first().json.original_request.event_title,\n    duration_minutes: $input.first().json.original_request.duration_minutes,\n    attendee_emails: $input.first().json.original_request.attendee_emails,\n    description: $input.first().json.original_request.description\n  }\n}];"
  }
}
```

---

### 判断層

#### NODE-017: フロー振り分け
```json
{
  "id": "if_route_flow_017",
  "name": "フロー振り分け",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [800, 300],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition_1",
          "leftValue": "={{ $json.is_selection_flow }}",
          "rightValue": false,
          "operator": {
            "type": "boolean",
            "operation": "false"
          }
        }
      ]
    }
  }
}
```

---

#### NODE-018: 予定重複判定
```json
{
  "id": "code_check_conflict_018",
  "name": "予定重複判定",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1900, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const newStart = $input.first().json.start_timestamp;\nconst newEnd = $input.first().json.end_timestamp;\nconst existingEvents = $input.first().json.existing_events || [];\n\nlet hasConflict = false;\nlet conflictEvent = null;\n\nfor (const event of existingEvents) {\n  if (\n    (newStart >= event.start_ts && newStart < event.end_ts) ||\n    (newEnd > event.start_ts && newEnd <= event.end_ts) ||\n    (newStart <= event.start_ts && newEnd >= event.end_ts)\n  ) {\n    hasConflict = true;\n    conflictEvent = event;\n    break;\n  }\n}\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    has_conflict: hasConflict,\n    conflict_event: conflictEvent\n  }\n}];"
  }
}
```

---

#### NODE-019: 重複有無で分岐
```json
{
  "id": "if_route_conflict_019",
  "name": "重複有無で分岐",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [2020, 300],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition_1",
          "leftValue": "={{ $json.has_conflict }}",
          "rightValue": false,
          "operator": {
            "type": "boolean",
            "operation": "false"
          }
        }
      ]
    }
  }
}
```

---

#### NODE-020: メール送信要否判定
```json
{
  "id": "if_check_email_020",
  "name": "メール送信要否判定",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [2360, 300],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition_1",
          "leftValue": "={{ $json.attendee_emails.length }}",
          "rightValue": 0,
          "operator": {
            "type": "number",
            "operation": "larger"
          }
        }
      ]
    }
  }
}
```

---

#### NODE-021: 選択番号検証
```json
{
  "id": "if_validate_selection_021",
  "name": "選択番号検証",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [1240, 500],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition_1",
          "leftValue": "={{ $json.selection_valid }}",
          "rightValue": true,
          "operator": {
            "type": "boolean",
            "operation": "true"
          }
        }
      ]
    }
  }
}
```

---

### 実行層

#### NODE-023: Googleカレンダー予定登録
```json
{
  "id": "http_calendar_insert_023",
  "name": "Googleカレンダー予定登録",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2160, 300],
  "parameters": {
    "method": "POST",
    "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    "authentication": "oAuth2",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"summary\": \"{{ $json.event_title }}\",\n  \"description\": \"{{ $json.description || '' }}\",\n  \"start\": {\n    \"dateTime\": \"{{ $json.event_datetime }}\",\n    \"timeZone\": \"Asia/Tokyo\"\n  },\n  \"end\": {\n    \"dateTime\": \"{{ $json.end_datetime }}\",\n    \"timeZone\": \"Asia/Tokyo\"\n  },\n  \"attendees\": {{ JSON.stringify($json.attendee_emails.map(email => ({email}))) }},\n  \"reminders\": {\n    \"useDefault\": true\n  }\n}",
    "options": {
      "timeout": 30000
    }
  },
  "credentials": {
    "googleCalendarOAuth2Api": {
      "id": "2",
      "name": "Google Calendar OAuth2"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 2000
}
```

**Expression使用箇所**:
- `summary`: `{{ $json.event_title }}`
- `start.dateTime`: `{{ $json.event_datetime }}`
- `end.dateTime`: `{{ $json.end_datetime }}`
- `attendees`: `{{ JSON.stringify($json.attendee_emails.map(email => ({email}))) }}`

---

#### NODE-024: 通知メール生成（AI Claude）
```json
{
  "id": "http_ai_claude_024",
  "name": "通知メール生成(Claude)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2480, 300],
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"anthropic/claude-4.5-sonnet:beta\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"あなたはビジネスメール作成の専門家です。予定情報から丁寧で明確な通知メールを作成してください。JSON以外は一切出力しないでください。\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"以下の予定情報から通知メールを作成してください:\\n\\nタイトル: {{ $json.event_title }}\\n日時: {{ $json.event_datetime }}\\n所要時間: {{ $json.duration_minutes }}分\\n参加者: {{ $json.attendee_emails.join(', ') }}\\n説明: {{ $json.description }}\\n\\nJSON形式で出力（JSON以外は出力しないこと）:\\n{\\n  \\\"email_subject\\\": \\\"件名\\\",\\n  \\\"email_body_html\\\": \\\"<html><body>...</body></html>\\\",\\n  \\\"email_body_plain\\\": \\\"プレーンテキスト版\\\"\\n}\\n\\n要件:\\n- 件名は『【予定通知】』で始める\\n- 日時・所要時間を明記\\n- 参加者への配慮を含める\"\n    }\n  ],\n  \"temperature\": 0.8,\n  \"max_tokens\": 1500,\n  \"top_p\": 0.9\n}",
    "options": {
      "timeout": 30000
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "3",
      "name": "OpenRouter API"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 3000
}
```

---

#### NODE-025: Claudeレスポンス解析
```json
{
  "id": "code_parse_claude_025",
  "name": "Claudeレスポンス解析",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [2600, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const response = $input.first().json;\nconst content = response.choices[0].message.content;\n\n// JSONブロックを抽出\nconst jsonMatch = content.match(/```json\\s*([\\s\\S]*?)\\s*```/) || \n                  content.match(/(\\{[\\s\\S]*\\})/);\n\nif (!jsonMatch) {\n  // フォールバック: デフォルトメール\n  return [{\n    json: {\n      ...($input.first().json),\n      email_subject: '【予定通知】' + $input.first().json.event_title,\n      email_body_html: '<html><body><p>予定の詳細をご確認ください。</p></body></html>',\n      email_body_plain: '予定の詳細をご確認ください。'\n    }\n  }];\n}\n\nconst extractedData = JSON.parse(jsonMatch[1]);\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    ...extractedData\n  }\n}];"
  }
}
```

---

#### NODE-026: Gmail送信
```json
{
  "id": "http_gmail_send_026",
  "name": "Gmail送信",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2840, 300],
  "parameters": {
    "method": "POST",
    "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    "authentication": "oAuth2",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"raw\": \"{{ $json.raw_message }}\"\n}",
    "options": {
      "timeout": 15000,
      "batching": {
        "batch": {
          "batchSize": 1,
          "batchInterval": 200
        }
      }
    }
  },
  "credentials": {
    "gmailOAuth2": {
      "id": "4",
      "name": "Gmail OAuth2"
    }
  },
  "continueOnFail": true,
  "retryOnFail": false
}
```

**Expression使用箇所**:
- `raw`: `{{ $json.raw_message }}`（NODE-013で生成）

**重要設定**:
- `batchSize`: 1（1通ずつ送信）
- `batchInterval`: 200（レート制限対策: 200ms間隔）
- `continueOnFail`: true（1通失敗しても他は送信）

---

#### NODE-027: 空き時間候補生成（AI Gemini）
```json
{
  "id": "http_ai_gemini_027",
  "name": "空き時間候補生成(Gemini)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2160, 500],
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"google/gemini-2.5-flash-exp:free\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"あなたはカレンダー分析の専門家です。既存予定と重複しない最適な時間帯を提案してください。JSON以外は一切出力しないでください。\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"希望日時: {{ $json.event_datetime }}\\n所要時間: {{ $json.duration_minutes }}分\\n既存予定: {{ JSON.stringify($json.existing_events) }}\\n対象期間: 今日と明日（{{ $now.toFormat('yyyy-MM-dd') }}から{{ $now.plus({days: 1}).toFormat('yyyy-MM-dd') }}）\\n\\n重複しない空き時間の候補を5つ提案してください。JSON形式で出力（JSON以外は出力しないこと）:\\n{\\n  \\\"alternative_slots\\\": [\\n    {\\n      \\\"slot_datetime\\\": \\\"YYYY-MM-DDTHH:MM:SS+09:00\\\",\\n      \\\"reason\\\": \\\"推奨理由（50文字以内）\\\"\\n    }\\n  ]\\n}\\n\\n要件:\\n- 候補は5つ\\n- 営業時間内（9:00-18:00）を優先\\n- 理由は具体的に\"\n    }\n  ],\n  \"temperature\": 0.7,\n  \"max_tokens\": 2000,\n  \"top_p\": 0.95\n}",
    "options": {
      "timeout": 30000
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "3",
      "name": "OpenRouter API"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 3000
}
```

**Expression使用箇所**:
- `existing_events`: `{{ JSON.stringify($json.existing_events) }}`
- 今日の日付: `{{ $now.toFormat('yyyy-MM-dd') }}`
- 明日の日付: `{{ $now.plus({days: 1}).toFormat('yyyy-MM-dd') }}`

---

#### NODE-028: Geminiレスポンス解析
```json
{
  "id": "code_parse_gemini_028",
  "name": "Geminiレスポンス解析",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [2280, 500],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const response = $input.first().json;\nconst content = response.choices[0].message.content;\n\n// JSONブロックを抽出\nconst jsonMatch = content.match(/```json\\s*([\\s\\S]*?)\\s*```/) || \n                  content.match(/(\\{[\\s\\S]*\\})/);\n\nif (!jsonMatch) {\n  throw new Error('Gemini response does not contain valid JSON: ' + content.substring(0, 200));\n}\n\nconst extractedData = JSON.parse(jsonMatch[1]);\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    ...extractedData\n  }\n}];"
  }
}
```

---

#### NODE-029: ステート保存
```json
{
  "id": "code_save_state_029",
  "name": "ステート保存",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [2400, 500],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const staticData = this.getWorkflowStaticData('global');\nconst userId = $input.first().json.user_id;\n\nstaticData[userId] = {\n  original_request: {\n    event_title: $input.first().json.event_title,\n    duration_minutes: $input.first().json.duration_minutes,\n    attendee_emails: $input.first().json.attendee_emails,\n    description: $input.first().json.description\n  },\n  proposed_alternatives: $input.first().json.alternative_slots,\n  status: 'awaiting_selection',\n  timestamp: Date.now()\n};\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    state_saved: true\n  }\n}];"
  }
}
```

---

#### NODE-030: ステートクリア
```json
{
  "id": "code_clear_state_030",
  "name": "ステートクリア",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [2280, 500],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const staticData = this.getWorkflowStaticData('global');\nconst userId = $input.first().json.user_id;\ndelete staticData[userId];\n\nreturn [{\n  json: {\n    ...($input.first().json),\n    state_cleared: true\n  }\n}];"
  }
}
```

---

### 出力層

#### NODE-036: Discord成功返信
```json
{
  "id": "http_discord_success_036",
  "name": "Discord成功返信",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [3060, 300],
  "parameters": {
    "method": "POST",
    "url": "={{ $json.callback_url }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"content\": \"✅ 予定を登録しました！\\n\\n📅 タイトル: {{ $json.event_title }}\\n🕐 日時: {{ $json.event_datetime }}\\n⏱️ 所要時間: {{ $json.duration_minutes }}分\\n👥 参加者: {{ $json.attendee_emails.length }}名\\n\\n📧 通知メールを送信しました。\"\n}",
    "options": {
      "timeout": 10000
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 1000
}
```

**Expression使用箇所**:
- `url`: `={{ $json.callback_url }}`
- `content`: 動的にイベント情報を埋め込み

---

#### NODE-037: Discord重複返信
```json
{
  "id": "http_discord_conflict_037",
  "name": "Discord重複返信",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2520, 500],
  "parameters": {
    "method": "POST",
    "url": "={{ $json.callback_url }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"content\": \"⚠️ 予定が重複しています\\n\\n以下の候補から選択してください（番号で返信）:\\n\\n1️⃣ {{ $json.alternative_slots[0].slot_datetime }} - {{ $json.alternative_slots[0].reason }}\\n2️⃣ {{ $json.alternative_slots[1].slot_datetime }} - {{ $json.alternative_slots[1].reason }}\\n3️⃣ {{ $json.alternative_slots[2].slot_datetime }} - {{ $json.alternative_slots[2].reason }}\\n4️⃣ {{ $json.alternative_slots[3].slot_datetime }} - {{ $json.alternative_slots[3].reason }}\\n5️⃣ {{ $json.alternative_slots[4].slot_datetime }} - {{ $json.alternative_slots[4].reason }}\\n\\n番号（1-5）で返信してください。\"\n}",
    "options": {
      "timeout": 10000
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 1000
}
```

---

#### NODE-038: Discordエラー返信
```json
{
  "id": "http_discord_error_038",
  "name": "Discordエラー返信",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1120, 600],
  "parameters": {
    "method": "POST",
    "url": "={{ $json.callback_url }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"content\": \"❌ エラーが発生しました\\n\\n{{ $json.error_message || $json.validation_error || '予期しないエラーです' }}\\n\\nもう一度お試しいただくか、管理者にお問い合わせください。\"\n}",
    "options": {
      "timeout": 10000
    }
  },
  "continueOnFail": true,
  "retryOnFail": false
}
```

---

#### NODE-042: ワークフロー終了
```json
{
  "id": "noop_end_042",
  "name": "ワークフロー終了",
  "type": "n8n-nodes-base.noOp",
  "typeVersion": 1,
  "position": [3180, 300],
  "parameters": {}
}
```

---

## 認証情報設定

### 1. OpenRouter API (HTTP Header Auth)
```json
{
  "name": "OpenRouter API",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer YOUR_OPENROUTER_API_KEY"
  }
}
```

### 2. Google Calendar OAuth2
```json
{
  "name": "Google Calendar OAuth2",
  "type": "googleCalendarOAuth2Api",
  "data": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "accessToken": "generated_at_runtime",
    "refreshToken": "generated_at_runtime"
  }
}
```

### 3. Gmail OAuth2
```json
{
  "name": "Gmail OAuth2",
  "type": "gmailOAuth2",
  "data": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "accessToken": "generated_at_runtime",
    "refreshToken": "generated_at_runtime"
  }
}
```

### 4. Discord Webhook Basic Auth (オプション)
```json
{
  "name": "Discord Webhook Basic Auth",
  "type": "httpBasicAuth",
  "data": {
    "user": "your_username",
    "password": "your_password"
  }
}
```

---

## ワークフロー設定

```json
{
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "saveExecutionProgress": true,
    "timezone": "Asia/Tokyo",
    "errorWorkflow": "ERROR_WORKFLOW_ID_HERE",
    "callerPolicy": "workflowsFromSameOwner",
    "executionTimeout": 300
  }
}
```

**重要設定**:
- `executionOrder`: "v1"（新しい実行順序）
- `timezone`: "Asia/Tokyo"（日本時間）
- `errorWorkflow`: Error Workflowを紐付け
- `executionTimeout`: 300秒（5分）

---

## データ構造サマリー

### Webhookトリガー入力
```json
{
  "user_id": "string",
  "channel_id": "string",
  "message_content": "string (自然言語予定情報)",
  "timestamp": "string (ISO 8601)",
  "callback_url": "string (Discord Webhook URL)"
}
```

### AI Grok出力
```json
{
  "event_title": "string",
  "event_datetime": "string (ISO 8601, +09:00)",
  "duration_minutes": "number",
  "attendee_emails": ["string"],
  "description": "string"
}
```

### Calendar API出力
```json
{
  "items": [
    {
      "summary": "string",
      "start": {"dateTime": "string"},
      "end": {"dateTime": "string"}
    }
  ]
}
```

### AI Gemini出力
```json
{
  "alternative_slots": [
    {
      "slot_datetime": "string (ISO 8601)",
      "reason": "string"
    }
  ]
}
```

### AI Claude出力
```json
{
  "email_subject": "string",
  "email_body_html": "string (HTML)",
  "email_body_plain": "string"
}
```

---

✅ **ユーザー確認**: この詳細設計（全パラメータ明示的設定、デフォルト値非依存）で問題ありませんか？

次は**Step 6: AIエージェント配置フェーズ（HTTP Request実装の最終確認）**に進みます！
