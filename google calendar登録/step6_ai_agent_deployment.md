# Step 6: AIエージェント配置フェーズ - AI処理の詳細設計

## 重要な前提条件

### OpenRouter経由の実装方式
このワークフローでは、**n8n AI Agent Node**を使用せず、**HTTP Request Node**を通じてOpenRouter APIに直接リクエストを送信します。

**理由**:
- OpenRouterは複数のLLMプロバイダーを統一APIで利用可能
- n8nのAI Agent Nodeは単一プロバイダー向け
- HTTP Requestで柔軟に異なるモデルを使い分け可能（Grok/Gemini/Claude）

---

## AI Agent配置戦略

### 単一責務の原則

各AI Agentは明確に1つの責務のみを持ちます：

✅ **AI Agent 1（Grok 2）**: Discord自然言語メッセージ → 構造化JSON変換
✅ **AI Agent 2（Gemini 2.5 Flash）**: カレンダー分析 → 空き時間候補5つ提案
✅ **AI Agent 3（Claude 4.5 Sonnet）**: 予定情報 → 通知メール文章生成

---

## AI Agent 1: Discord予定抽出エージェント（Grok）

### 配置情報

```json
{
  "agent_id": "ai_agent_001",
  "node_id": "NODE-010",
  "node_name": "【AI Agent 1】Discord予定抽出（Grok）",
  "responsibility": "Discordの自然言語メッセージから予定情報を抽出し、構造化されたJSON形式に変換する",
  "goal": "event_title、event_datetime、duration_minutes、attendee_emails、descriptionを正確に抽出",
  "expected_output": "構造化されたJSON（5つのフィールド）"
}
```

### システムメッセージ（責務定義）

```
あなたはDiscordメッセージから予定情報を抽出する専門家です。

【責務】
- ユーザーが送信した自然言語のメッセージから、予定のタイトル、日時、所要時間、参加者のメールアドレス、説明を抽出する
- 抽出結果を正確なJSON形式で出力する

【ゴール】
以下の5つのフィールドを含むJSONを生成すること：
1. event_title: 予定のタイトル（文字列）
2. event_datetime: 予定の開始日時（ISO 8601形式、日本時間+09:00）
3. duration_minutes: 所要時間（分単位の整数）
4. attendee_emails: 参加者のメールアドレスリスト（配列、なければ空配列）
5. description: 補足説明（文字列、なければ空文字列）

【重要な制約】
- 日時が指定されていない場合は、今日の9:00とする
- 時刻のみ指定の場合は、今日の日付とする
- 所要時間が不明な場合は60分とする
- メールアドレスが記載されていない場合は空配列
- JSON以外の文章は出力しない（JSONのみを返す）
```

### ノード実装詳細

#### NODE-010: HTTP Request (OpenRouter API)

**ノードタイプ**: `n8n-nodes-base.httpRequest`

**パラメータ設定**:
```json
{
  "id": "http_ai_grok_010",
  "name": "【AI Agent 1】Discord予定抽出（Grok）",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1000, 300],
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.openRouterApi.apiKey }}"
        },
        {
          "name": "HTTP-Referer",
          "value": "https://n8n.io"
        },
        {
          "name": "X-Title",
          "value": "n8n Discord Calendar Manager"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "x-ai/grok-2-1212"
        },
        {
          "name": "messages",
          "value": "={{ JSON.stringify([{role: 'system', content: 'あなたはDiscordメッセージから予定情報を抽出する専門家です。\\n\\n【責務】\\n- ユーザーが送信した自然言語のメッセージから、予定のタイトル、日時、所要時間、参加者のメールアドレス、説明を抽出する\\n- 抽出結果を正確なJSON形式で出力する\\n\\n【ゴール】\\n以下の5つのフィールドを含むJSONを生成すること：\\n1. event_title: 予定のタイトル（文字列）\\n2. event_datetime: 予定の開始日時（ISO 8601形式、日本時間+09:00）\\n3. duration_minutes: 所要時間（分単位の整数）\\n4. attendee_emails: 参加者のメールアドレスリスト（配列、なければ空配列）\\n5. description: 補足説明（文字列、なければ空文字列）\\n\\n【重要な制約】\\n- 日時が指定されていない場合は、今日の9:00とする\\n- 時刻のみ指定の場合は、今日の日付とする\\n- 所要時間が不明な場合は60分とする\\n- メールアドレスが記載されていない場合は空配列\\n- JSON以外の文章は出力しない（JSONのみを返す）'}, {role: 'user', content: '以下のDiscordメッセージから予定情報を抽出してください。\\n\\nメッセージ: ' + $json.message_content + '\\n\\n出力形式（JSON以外は出力禁止）:\\n{\\n  \"event_title\": \"...\",\\n  \"event_datetime\": \"YYYY-MM-DDTHH:MM:SS+09:00\",\\n  \"duration_minutes\": 60,\\n  \"attendee_emails\": [],\\n  \"description\": \"...\"\\n}'}]) }}"
        },
        {
          "name": "temperature",
          "value": "0.3"
        },
        {
          "name": "max_tokens",
          "value": "1000"
        },
        {
          "name": "top_p",
          "value": "0.9"
        }
      ]
    },
    "options": {
      "timeout": 30000,
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "3",
      "name": "OpenRouter API Key"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 3000
}
```

**Expression使用箇所**:
- `messages`: システムメッセージ + ユーザーメッセージ（`$json.message_content`を動的挿入）

**入力データ**:
- `message_content`: Discordメッセージ（自然言語）

**期待される出力データ**:
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"event_title\":\"...\",\"event_datetime\":\"...\",\"duration_minutes\":60,\"attendee_emails\":[...],\"description\":\"...\"}"
      }
    }
  ]
}
```

---

### ノード接続

```
NODE-007 (Webhookデータ検証) → TRUE分岐
    ↓
NODE-010 (AI Agent 1: Grok)
    ↓
NODE-011 (Grokレスポンス解析)
    ↓
NODE-008 (AI抽出結果検証)
```

---

## AI Agent 2: カレンダー分析・候補提案エージェント（Gemini）

### 配置情報

```json
{
  "agent_id": "ai_agent_002",
  "node_id": "NODE-027",
  "node_name": "【AI Agent 2】空き時間候補生成（Gemini）",
  "responsibility": "既存予定を分析し、重複しない空き時間の候補を5つ提案する",
  "goal": "今日と明日の2日分から、営業時間内（9:00-18:00）を優先し、理由付きで5つの候補を生成",
  "expected_output": "alternative_slots配列（5要素、各要素にslot_datetimeとreasonを含む）"
}
```

### システムメッセージ（責務定義）

```
あなたはカレンダー分析の専門家です。

【責務】
- ユーザーの既存予定リストを分析し、希望日時に重複がある場合に代替候補を提案する
- 既存予定と重複しない時間帯のみを提案する
- 営業時間内（9:00-18:00）を優先する

【ゴール】
以下の形式で5つの候補を生成すること：
{
  "alternative_slots": [
    {
      "slot_datetime": "YYYY-MM-DDTHH:MM:SS+09:00",
      "reason": "推奨理由（50文字以内）"
    }
  ]
}

【重要な制約】
- 候補数は必ず5つ
- 対象期間は今日と明日の2日分のみ
- 営業時間内（9:00-18:00）を優先（ただし営業時間外も提案可）
- 既存予定と重複しないことを必ず確認
- 理由は具体的に（例: 午前中で集中しやすい、既存予定の前後で移動不要）
- JSON以外の文章は出力しない（JSONのみを返す）
```

### ノード実装詳細

#### NODE-027: HTTP Request (OpenRouter API)

**ノードタイプ**: `n8n-nodes-base.httpRequest`

**パラメータ設定**:
```json
{
  "id": "http_ai_gemini_027",
  "name": "【AI Agent 2】空き時間候補生成（Gemini）",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2200, 500],
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.openRouterApi.apiKey }}"
        },
        {
          "name": "HTTP-Referer",
          "value": "https://n8n.io"
        },
        {
          "name": "X-Title",
          "value": "n8n Discord Calendar Manager"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "google/gemini-2.5-flash-exp:free"
        },
        {
          "name": "messages",
          "value": "={{ JSON.stringify([{role: 'system', content: 'あなたはカレンダー分析の専門家です。\\n\\n【責務】\\n- ユーザーの既存予定リストを分析し、希望日時に重複がある場合に代替候補を提案する\\n- 既存予定と重複しない時間帯のみを提案する\\n- 営業時間内（9:00-18:00）を優先する\\n\\n【ゴール】\\n以下の形式で5つの候補を生成すること：\\n{\\n  \"alternative_slots\": [\\n    {\\n      \"slot_datetime\": \"YYYY-MM-DDTHH:MM:SS+09:00\",\\n      \"reason\": \"推奨理由（50文字以内）\"\\n    }\\n  ]\\n}\\n\\n【重要な制約】\\n- 候補数は必ず5つ\\n- 対象期間は今日と明日の2日分のみ\\n- 営業時間内（9:00-18:00）を優先（ただし営業時間外も提案可）\\n- 既存予定と重複しないことを必ず確認\\n- 理由は具体的に（例: 午前中で集中しやすい、既存予定の前後で移動不要）\\n- JSON以外の文章は出力しない（JSONのみを返す）'}, {role: 'user', content: '以下の情報をもとに、空き時間の候補を5つ提案してください。\\n\\n希望日時: ' + $json.event_datetime + '\\n所要時間: ' + $json.duration_minutes + '分\\n既存予定: ' + JSON.stringify($json.existing_events) + '\\n対象期間: 今日と明日（' + $now.toFormat('yyyy-MM-dd') + 'から' + $now.plus({days: 1}).toFormat('yyyy-MM-dd') + '）\\n\\n出力形式（JSON以外は出力禁止）:\\n{\\n  \"alternative_slots\": [\\n    {\"slot_datetime\": \"YYYY-MM-DDTHH:MM:SS+09:00\", \"reason\": \"...\"}\\n  ]\\n}'}]) }}"
        },
        {
          "name": "temperature",
          "value": "0.7"
        },
        {
          "name": "max_tokens",
          "value": "2000"
        },
        {
          "name": "top_p",
          "value": "0.95"
        }
      ]
    },
    "options": {
      "timeout": 30000,
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "3",
      "name": "OpenRouter API Key"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 3000
}
```

**Expression使用箇所**:
- `messages`: システムメッセージ + ユーザーメッセージ（`$json.event_datetime`, `$json.duration_minutes`, `$json.existing_events`を動的挿入）

**入力データ**:
- `event_datetime`: 希望日時（ISO 8601）
- `duration_minutes`: 所要時間（分）
- `existing_events`: 既存予定リスト（配列）

**期待される出力データ**:
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"alternative_slots\":[{\"slot_datetime\":\"...\",\"reason\":\"...\"},{...}]}"
      }
    }
  ]
}
```

---

### ノード接続

```
NODE-019 (重複有無で分岐) → FALSE分岐（重複あり）
    ↓
NODE-027 (AI Agent 2: Gemini)
    ↓
NODE-028 (Geminiレスポンス解析)
    ↓
NODE-029 (ステート保存)
    ↓
NODE-037 (Discord重複返信)
```

---

## AI Agent 3: 通知メール文章生成エージェント（Claude）

### 配置情報

```json
{
  "agent_id": "ai_agent_003",
  "node_id": "NODE-024",
  "node_name": "【AI Agent 3】通知メール生成（Claude）",
  "responsibility": "予定情報から、参加者向けの丁寧で明確な通知メールを自動生成する",
  "goal": "件名、HTML本文、プレーンテキスト本文の3つを含む完全なメール文章を作成",
  "expected_output": "email_subject、email_body_html、email_body_plainの3フィールドを含むJSON"
}
```

### システムメッセージ（責務定義）

```
あなたはビジネスメール作成の専門家です。

【責務】
- 予定情報（タイトル、日時、所要時間、参加者、説明）から、参加者向けの通知メールを作成する
- 件名、HTML本文、プレーンテキスト本文の3つを生成する
- 丁寧でビジネスライクな文体を使用する

【ゴール】
以下の形式で完全なメール文章を生成すること：
{
  "email_subject": "件名（60文字以内）",
  "email_body_html": "HTML形式の本文",
  "email_body_plain": "プレーンテキスト版の本文"
}

【重要な制約】
- 件名は「【予定通知】」で始める
- HTML本文は<html><body>タグで囲む
- 本文には以下を必ず含める:
  - 予定のタイトル
  - 日時（日本時間）
  - 所要時間
  - 場所またはオンラインの旨
  - 参加者への配慮（ご都合が悪い場合はご連絡くださいなど）
- プレーンテキスト版はHTML版と同じ内容だがタグなし
- JSON以外の文章は出力しない（JSONのみを返す）
```

### ノード実装詳細

#### NODE-024: HTTP Request (OpenRouter API)

**ノードタイプ**: `n8n-nodes-base.httpRequest`

**パラメータ設定**:
```json
{
  "id": "http_ai_claude_024",
  "name": "【AI Agent 3】通知メール生成（Claude）",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2600, 300],
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.openRouterApi.apiKey }}"
        },
        {
          "name": "HTTP-Referer",
          "value": "https://n8n.io"
        },
        {
          "name": "X-Title",
          "value": "n8n Discord Calendar Manager"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "anthropic/claude-4.5-sonnet:beta"
        },
        {
          "name": "messages",
          "value": "={{ JSON.stringify([{role: 'system', content: 'あなたはビジネスメール作成の専門家です。\\n\\n【責務】\\n- 予定情報（タイトル、日時、所要時間、参加者、説明）から、参加者向けの通知メールを作成する\\n- 件名、HTML本文、プレーンテキスト本文の3つを生成する\\n- 丁寧でビジネスライクな文体を使用する\\n\\n【ゴール】\\n以下の形式で完全なメール文章を生成すること：\\n{\\n  \"email_subject\": \"件名（60文字以内）\",\\n  \"email_body_html\": \"HTML形式の本文\",\\n  \"email_body_plain\": \"プレーンテキスト版の本文\"\\n}\\n\\n【重要な制約】\\n- 件名は「【予定通知】」で始める\\n- HTML本文は<html><body>タグで囲む\\n- 本文には以下を必ず含める:\\n  - 予定のタイトル\\n  - 日時（日本時間）\\n  - 所要時間\\n  - 場所またはオンラインの旨\\n  - 参加者への配慮（ご都合が悪い場合はご連絡くださいなど）\\n- プレーンテキスト版はHTML版と同じ内容だがタグなし\\n- JSON以外の文章は出力しない（JSONのみを返す）'}, {role: 'user', content: '以下の予定情報をもとに、参加者への通知メールを作成してください。\\n\\n予定情報:\\n- タイトル: ' + $json.event_title + '\\n- 日時: ' + $json.event_datetime + '（日本時間）\\n- 所要時間: ' + $json.duration_minutes + '分\\n- 参加者: ' + $json.attendee_emails.join(', ') + '\\n- 説明: ' + $json.description + '\\n\\n出力形式（JSON以外は出力禁止）:\\n{\\n  \"email_subject\": \"...\",\\n  \"email_body_html\": \"...\",\\n  \"email_body_plain\": \"...\"\\n}'}]) }}"
        },
        {
          "name": "temperature",
          "value": "0.8"
        },
        {
          "name": "max_tokens",
          "value": "1500"
        },
        {
          "name": "top_p",
          "value": "0.9"
        }
      ]
    },
    "options": {
      "timeout": 30000,
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "3",
      "name": "OpenRouter API Key"
    }
  },
  "continueOnFail": false,
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 3000
}
```

**Expression使用箇所**:
- `messages`: システムメッセージ + ユーザーメッセージ（`$json.event_title`, `$json.event_datetime`, `$json.duration_minutes`, `$json.attendee_emails`, `$json.description`を動的挿入）

**入力データ**:
- `event_title`: 予定タイトル
- `event_datetime`: 予定日時（ISO 8601）
- `duration_minutes`: 所要時間（分）
- `attendee_emails`: 参加者メールアドレスリスト
- `description`: 補足説明

**期待される出力データ**:
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"email_subject\":\"【予定通知】...\",\"email_body_html\":\"<html><body>...</body></html>\",\"email_body_plain\":\"...\"}"
      }
    }
  ]
}
```

---

### ノード接続

```
NODE-020 (メール送信要否判定) → TRUE分岐（メール必要）
    ↓
NODE-024 (AI Agent 3: Claude)
    ↓
NODE-025 (Claudeレスポンス解析)
    ↓
NODE-013 (メールデータ整形)
    ↓
NODE-026 (Gmail送信)
```

---

## AIレスポンス解析の共通パターン

すべてのAI Agentノードの後には、レスポンスを解析するCode Nodeが必要です。

### NODE-011: Grokレスポンス解析
### NODE-025: Claudeレスポンス解析
### NODE-028: Geminiレスポンス解析

**共通のコードロジック**:
```javascript
// OpenRouter APIレスポンスからJSONコンテンツを抽出
const response = $input.first().json;
let content = response.choices[0].message.content;

// マークダウンコードブロックを削除（```json...```形式）
content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// JSONパース
let parsedData;
try {
  parsedData = JSON.parse(content);
} catch (error) {
  // パース失敗時のエラーハンドリング
  return [{
    json: {
      error: true,
      error_message: 'AI response JSON parse failed: ' + error.message,
      raw_content: content
    }
  }];
}

// パース成功時
return [{
  json: {
    ...($input.first().json), // 前のノードのデータを保持
    ...parsedData, // AIの出力を追加
    ai_response_raw: content // デバッグ用に生データも保持
  }
}];
```

**エラーハンドリング**:
- JSONパース失敗時: `error: true`フラグを設定
- 次の検証ノードでエラーフラグをチェック
- エラー時はDiscordにエラー返信（NODE-038）

---

## AI Agent配置サマリー

```json
{
  "ai_agent_deployment": {
    "total_ai_agents": 3,
    "implementation_method": "HTTP Request to OpenRouter API",
    "single_responsibility_check": "✅ 合格",
    "agents": [
      {
        "node_id": "NODE-010",
        "node_name": "【AI Agent 1】Discord予定抽出（Grok）",
        "responsibility": "自然言語 → 構造化JSON変換",
        "goal": "5フィールドの予定情報抽出",
        "expected_output": "event_title, event_datetime, duration_minutes, attendee_emails, description",
        "connected_model": {
          "provider": "OpenRouter",
          "model": "x-ai/grok-2-1212",
          "temperature": 0.3,
          "max_tokens": 1000
        },
        "input_from": "NODE-007 (Webhookデータ検証)",
        "output_to": "NODE-011 (Grokレスポンス解析)",
        "error_handling": "retry 2回 → Error Workflow",
        "estimated_cost": "$0.002/実行"
      },
      {
        "node_id": "NODE-027",
        "node_name": "【AI Agent 2】空き時間候補生成（Gemini）",
        "responsibility": "カレンダー分析 → 候補5つ提案",
        "goal": "重複しない空き時間を5つ推奨理由付きで提案",
        "expected_output": "alternative_slots配列（5要素）",
        "connected_model": {
          "provider": "OpenRouter",
          "model": "google/gemini-2.5-flash-exp:free",
          "temperature": 0.7,
          "max_tokens": 2000
        },
        "input_from": "NODE-019 (重複有無で分岐)",
        "output_to": "NODE-028 (Geminiレスポンス解析)",
        "error_handling": "retry 2回 → Error Workflow",
        "estimated_cost": "$0.00/実行（無料モデル）"
      },
      {
        "node_id": "NODE-024",
        "node_name": "【AI Agent 3】通知メール生成（Claude）",
        "responsibility": "予定情報 → メール文章生成",
        "goal": "件名・HTML本文・プレーン本文を含む完全なメール作成",
        "expected_output": "email_subject, email_body_html, email_body_plain",
        "connected_model": {
          "provider": "OpenRouter",
          "model": "anthropic/claude-4.5-sonnet:beta",
          "temperature": 0.8,
          "max_tokens": 1500
        },
        "input_from": "NODE-020 (メール送信要否判定)",
        "output_to": "NODE-025 (Claudeレスポンス解析)",
        "error_handling": "retry 2回 → continueOnFail（メール失敗でも予定は登録済み）",
        "estimated_cost": "$0.003/実行"
      }
    ],
    "total_estimated_cost_per_execution": "$0.005",
    "execution_time_breakdown": {
      "Grok": "5-10秒",
      "Gemini": "5-10秒",
      "Claude": "5-10秒"
    }
  }
}
```

---

## 認証情報設定

### OpenRouter API Key

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

## AIエージェント配置の検証項目

### 単一責務の確認

✅ **Grok**: 予定抽出のみ（他のタスクなし）
✅ **Gemini**: カレンダー分析・候補提案のみ（他のタスクなし）
✅ **Claude**: メール生成のみ（他のタスクなし）

### 入出力スキーマの明確性

✅ **Grok**: 入力=message_content、出力=5フィールドJSON
✅ **Gemini**: 入力=event_datetime+duration+existing_events、出力=alternative_slots配列
✅ **Claude**: 入力=event_title+datetime+duration+emails+description、出力=3フィールドJSON

### エラーハンドリング

✅ 各AI Nodeにretry設定（2回）
✅ レスポンス解析でJSONパース失敗を検出
✅ エラー時はDiscordにフィードバック（NODE-038）

### パフォーマンス最適化

✅ temperature設定を用途に応じて調整
  - Grok: 0.3（正確性重視）
  - Gemini: 0.7（バランス型）
  - Claude: 0.8（創造性重視）
✅ max_tokens設定で無駄なトークン消費を防止
✅ timeout設定（30秒）でハング防止

---

## 次のステップ

✅ **ユーザー確認**: このAI Agent配置（単一責務、OpenRouter経由HTTP実装）で問題ありませんか？

承認いただければ、**Step 7: 完全n8n JSON生成フェーズ**に進みます！

