# Step 2: 構造化フェーズ - 8層フレームワーク適用

## 業務要件の8層構造への分解

### レイヤー0: トリガー層 (Trigger Layer)

#### タスク0-1: Webhook受信
- **タスク名**: Discord Bot Webhook受信
- **種類**: Webhook Trigger (POST)
- **詳細**:
  - エンドポイント: `/webhook/discord-calendar`
  - HTTPメソッド: POST
  - 認証: Basic Auth（推奨）またはNone（開発時）
  - 受信データ:
    ```json
    {
      "user_id": "Discord User ID",
      "channel_id": "Discord Channel ID",
      "message_content": "自然言語の予定情報",
      "timestamp": "ISO 8601",
      "callback_url": "Discord返信用のWebhook URL"
    }
    ```
- **データ形式**: JSON
- **トリガー頻度**: リアルタイム（1日10回以上、制限なし）

---

### レイヤー1: データ取得層 (Fetch Layer)

#### タスク1-1: Discordメッセージデータ取得
- **タスク名**: Webhookボディからメッセージ抽出
- **ソース**: Webhook Triggerノードの出力
- **取得データ**:
  - `message_content`（予定の自然言語説明）
  - `user_id`（ユーザー識別）
  - `callback_url`（返信先）
- **データ形式**: JSON Object
- **ノードタイプ**: Set Node（フィールド抽出）

#### タスク1-2: Googleカレンダー既存予定取得
- **タスク名**: 指定日時周辺の既存予定を取得
- **ソース**: Google Calendar API
- **APIエンドポイント**: `GET /calendars/primary/events`
- **取得条件**:
  - `timeMin`: 予定開始時刻 - 24時間
  - `timeMax`: 予定開始時刻 + 48時間
  - `singleEvents`: true（繰り返し予定を個別イベントに展開）
  - `orderBy`: startTime
- **取得データ**:
  ```json
  {
    "items": [
      {
        "id": "event_id",
        "summary": "予定タイトル",
        "start": {"dateTime": "2025-01-15T10:00:00+09:00"},
        "end": {"dateTime": "2025-01-15T11:00:00+09:00"}
      }
    ]
  }
  ```
- **データ形式**: JSON Array
- **ノードタイプ**: HTTP Request Node（Google Calendar API）
- **認証**: OAuth2（Google Calendar）

#### タスク1-3: 過去のユーザー選択状態取得（重複時のみ）
- **タスク名**: 前回のWebhook呼び出しで保存した一時データを取得
- **ソース**: n8n Static Data または PostgreSQL
- **取得条件**: `user_id`で検索
- **取得データ**:
  ```json
  {
    "original_request": {
      "event_title": "...",
      "event_datetime": "...",
      "attendee_emails": []
    },
    "proposed_alternatives": [
      {"slot_datetime": "...", "reason": "..."}
    ],
    "status": "awaiting_selection"
  }
  ```
- **データ形式**: JSON Object
- **ノードタイプ**: Code Node（Static Data読み取り）またはPostgreSQL Node

---

### レイヤー2: データ検証層 (Validate Layer)

#### タスク2-1: Webhookデータ検証
- **タスク名**: 必須フィールドの存在確認
- **検証ルール**:
  - `message_content`が空でないこと
  - `user_id`が存在すること
  - `callback_url`が有効なURL形式であること
- **検証方法**: IF Node（条件分岐）
- **失敗時**: Discordに「無効なリクエストです」エラー返信 → ワークフロー終了

#### タスク2-2: AI抽出結果の検証
- **タスク名**: Grok抽出結果が有効なJSON形式か確認
- **検証ルール**:
  - `event_title`が存在
  - `event_datetime`が有効なISO 8601形式
  - `duration_minutes`が正の整数
  - `attendee_emails`が配列（空でもOK）
- **検証方法**: Code Node（JSONスキーマ検証）
- **失敗時**: Discordに「予定情報を認識できませんでした。もう一度お試しください」 → ワークフロー終了

#### タスク2-3: Googleカレンダーレスポンス検証
- **タスク名**: API呼び出しが成功したか確認
- **検証ルール**:
  - HTTPステータスコード200
  - `items`配列が存在（空でもOK）
- **検証方法**: HTTP Request Nodeのエラーハンドリング
- **失敗時**: Discordに「カレンダー確認エラーが発生しました」 → Error Workflow

---

### レイヤー3: データ変換層 (Transform Layer)

#### タスク3-1: Discord自然言語 → 構造化データ変換（AI Agent 1）
- **タスク名**: Grok 2による予定抽出
- **変換ロジック**:
  1. OpenRouter APIにPOSTリクエスト
     - エンドポイント: `https://openrouter.ai/api/v1/chat/completions`
     - モデル: `x-ai/grok-2-1212`
     - プロンプト:
       ```
       以下のDiscordメッセージから予定情報を抽出し、JSON形式で出力してください。

       メッセージ: "{{ $json.message_content }}"

       出力形式:
       {
         "event_title": "予定のタイトル",
         "event_datetime": "YYYY-MM-DDTHH:MM:SS+09:00（ISO 8601形式）",
         "duration_minutes": 所要時間（分、整数）,
         "attendee_emails": ["email1@example.com", "email2@example.com"],
         "description": "補足説明（あれば）"
       }

       注意:
       - 日時は日本時間（+09:00）で出力
       - 時刻が指定されていない場合は9:00とする
       - 所要時間が不明な場合は60分とする
       - メールアドレスがない場合は空配列
       ```
  2. レスポンスからJSON部分を抽出（Code Node）
  3. パース結果を次のノードに渡す
- **入力**: `message_content`（文字列）
- **出力**: 構造化JSONオブジェクト
- **ノードタイプ**: HTTP Request Node + Code Node

#### タスク3-2: カレンダーイベントリストの整形
- **タスク名**: Google Calendar APIのレスポンスを重複チェック用に整形
- **変換ロジック**:
  1. `items`配列から各イベントの開始時刻・終了時刻を抽出
  2. ISO 8601文字列をタイムスタンプ（Unix time）に変換
  3. 以下の形式に整形:
     ```json
     [
       {
         "title": "既存予定1",
         "start_timestamp": 1705284000000,
         "end_timestamp": 1705287600000
       }
     ]
     ```
- **入力**: Google Calendar APIレスポンス
- **出力**: 整形済み配列
- **ノードタイプ**: Code Node（JavaScript）

#### タスク3-3: 重複判定のためのタイムスタンプ計算
- **タスク名**: 新規予定の開始・終了時刻をタイムスタンプに変換
- **変換ロジック**:
  1. `event_datetime`（ISO 8601）をパース
  2. `duration_minutes`を加算して終了時刻を計算
  3. 開始・終了をUnix timestampに変換
- **入力**: AI抽出結果の`event_datetime`と`duration_minutes`
- **出力**: `{start_ts, end_ts}`
- **ノードタイプ**: Code Node（JavaScript Date処理）

#### タスク3-4: メール送信用データ整形
- **タスク名**: Gmail API用のRFC 2822形式メール作成
- **変換ロジック**:
  1. Claude生成のメール本文（HTML）を取得
  2. 以下の形式に整形:
     ```
     From: your-email@gmail.com
     To: attendee1@example.com, attendee2@example.com
     Subject: 【予定通知】{{ event_title }}
     Content-Type: text/html; charset=UTF-8

     {{ email_body_html }}
     ```
  3. Base64エンコード
- **入力**: Claudeのメール本文 + 参加者メールアドレス
- **出力**: Base64エンコード済みメール
- **ノードタイプ**: Code Node（Base64エンコード）

---

### レイヤー4: 判断層 (Decision Layer)

#### タスク4-1: 初回実行 vs 選択フロー判定
- **タスク名**: Webhookが初回の予定登録リクエストか、重複後の選択リクエストか判定
- **条件**:
  - Static Dataに`user_id`のエントリが存在 → 選択フロー
  - 存在しない → 初回実行
- **判定方法**: IF Node
- **分岐**:
  - TRUE（選択フロー）: タスク1-3（状態取得）→ タスク5-7（選択反映）
  - FALSE（初回実行）: タスク3-1（AI抽出）→ 以降の通常フロー

#### タスク4-2: 予定重複判定
- **タスク名**: 既存予定と新規予定の時間帯が重複しているか判定
- **条件**:
  ```javascript
  // 重複条件: 新規予定の開始時刻が既存予定の範囲内、または新規予定の終了時刻が既存予定の範囲内
  for (const existing of existingEvents) {
    if (
      (newStart >= existing.start && newStart < existing.end) ||
      (newEnd > existing.start && newEnd <= existing.end) ||
      (newStart <= existing.start && newEnd >= existing.end)
    ) {
      return { hasConflict: true, conflictEvent: existing };
    }
  }
  return { hasConflict: false };
  ```
- **判定方法**: Code Node（JavaScript）
- **分岐**:
  - TRUE（重複あり）: タスク5-4（候補生成AI呼び出し）
  - FALSE（重複なし）: タスク5-1（予定登録）

#### タスク4-3: メール送信要否判定
- **タスク名**: 参加者メールアドレスが存在するか判定
- **条件**: `attendee_emails.length > 0`
- **判定方法**: IF Node
- **分岐**:
  - TRUE: タスク5-2（メール生成AI呼び出し）→ タスク5-3（Gmail送信）
  - FALSE: タスク5-6（Discord成功返信）のみ

---

### レイヤー5: 実行層 (Action Layer)

#### タスク5-1: Google Calendar予定登録
- **タスク名**: 新規イベントを登録
- **アクション**: Google Calendar API `events.insert`
- **APIエンドポイント**: `POST /calendars/primary/events`
- **リクエストボディ**:
  ```json
  {
    "summary": "{{ $json.event_title }}",
    "description": "{{ $json.description }}",
    "start": {
      "dateTime": "{{ $json.event_datetime }}",
      "timeZone": "Asia/Tokyo"
    },
    "end": {
      "dateTime": "{{ 計算された終了時刻 }}",
      "timeZone": "Asia/Tokyo"
    },
    "attendees": [
      {"email": "{{ $json.attendee_emails[0] }}"},
      {"email": "{{ $json.attendee_emails[1] }}"}
    ],
    "reminders": {
      "useDefault": true
    }
  }
  ```
- **ノードタイプ**: HTTP Request Node（Google Calendar API）
- **認証**: OAuth2

#### タスク5-2: 通知メール文章生成（AI Agent 3）
- **タスク名**: Claude 3.5 Sonnetによるメール本文作成
- **アクション**: OpenRouter APIにPOSTリクエスト
- **APIエンドポイント**: `https://openrouter.ai/api/v1/chat/completions`
- **モデル**: `anthropic/claude-3.5-sonnet:beta`
- **プロンプト**:
  ```
  以下の予定情報をもとに、参加者への通知メールを作成してください。

  予定情報:
  - タイトル: {{ $json.event_title }}
  - 日時: {{ $json.event_datetime }}（日本時間）
  - 所要時間: {{ $json.duration_minutes }}分
  - 参加者: {{ $json.attendee_emails.join(', ') }}
  - 説明: {{ $json.description }}

  以下のJSON形式で出力してください:
  {
    "email_subject": "件名（60文字以内）",
    "email_body_html": "HTML形式の本文（丁寧でビジネスライクな文体）",
    "email_body_plain": "プレーンテキスト版の本文"
  }

  要件:
  - 件名は「【予定通知】」で始める
  - 本文には日時・場所（オンラインの場合はその旨）・所要時間を明記
  - 参加者への配慮を含める（例: ご都合が悪い場合はご連絡ください）
  - HTML本文は<html><body>タグで囲む
  ```
- **ノードタイプ**: HTTP Request Node + Code Node（JSONパース）

#### タスク5-3: Gmail送信
- **タスク名**: 参加者全員に通知メールを送信
- **アクション**: Gmail API `messages.send`
- **APIエンドポイント**: `POST /users/me/messages/send`
- **リクエストボディ**:
  ```json
  {
    "raw": "{{ Base64エンコード済みメール }}"
  }
  ```
- **ループ処理**: 参加者が複数の場合、Loop Over Itemsで1通ずつ送信
- **ノードタイプ**: HTTP Request Node（Gmail API） + Loop Over Items
- **認証**: OAuth2

#### タスク5-4: 空き時間候補生成（AI Agent 2）
- **タスク名**: Gemini 2.0 Flashによる代替候補提案
- **アクション**: OpenRouter APIにPOSTリクエスト
- **APIエンドポイント**: `https://openrouter.ai/api/v1/chat/completions`
- **モデル**: `google/gemini-2.0-flash-exp:free`
- **プロンプト**:
  ```
  以下の情報をもとに、予定が重複しない空き時間の候補を5つ提案してください。

  希望日時: {{ $json.event_datetime }}
  所要時間: {{ $json.duration_minutes }}分
  既存予定: {{ JSON.stringify($json.existing_events) }}
  対象期間: 今日と明日の2日分（{{ 今日の日付 }}から{{ 明日の日付 }}）

  以下のJSON形式で出力してください:
  {
    "alternative_slots": [
      {
        "slot_datetime": "YYYY-MM-DDTHH:MM:SS+09:00",
        "reason": "この時間帯を推奨する理由（50文字以内）"
      }
    ]
  }

  要件:
  - 候補は5つ
  - 既存予定と重複しない時間帯のみ
  - 営業時間内（9:00-18:00）を優先
  - 理由は具体的に（例: 午前中で集中しやすい、既存予定の前後で移動不要など）
  ```
- **ノードタイプ**: HTTP Request Node + Code Node（JSONパース）

#### タスク5-5: 一時状態保存（重複時のみ）
- **タスク名**: ユーザー選択待ち状態をStatic Dataに保存
- **アクション**:
  ```javascript
  const staticData = this.getWorkflowStaticData('global');
  staticData[userId] = {
    original_request: originalData,
    proposed_alternatives: alternatives,
    status: 'awaiting_selection',
    timestamp: Date.now()
  };
  ```
- **保存データ**:
  - 元の予定リクエスト
  - 提案された5つの候補
  - ステータス
  - タイムスタンプ
- **ノードタイプ**: Code Node（Static Data書き込み）

#### タスク5-6: Discord成功返信
- **タスク名**: 予定登録完了メッセージをDiscordに送信
- **アクション**:
  - 方法A: Pythonアプリのコールバックエンドポイントに通知
  - 方法B: Discord Webhook URLに直接POST
- **メッセージ内容**:
  ```
  ✅ 予定を登録しました！

  📅 タイトル: {{ event_title }}
  🕐 日時: {{ event_datetime }}（日本時間）
  ⏱️ 所要時間: {{ duration_minutes }}分
  👥 参加者: {{ attendee_emails.length }}名

  📧 通知メールを送信しました。
  ```
- **ノードタイプ**: HTTP Request Node（Discord Webhook）

#### タスク5-7: Discord重複返信
- **タスク名**: 重複メッセージ + 候補5つをDiscordに送信
- **アクション**: Discord Webhook URLにPOST
- **メッセージ内容**:
  ```
  ⚠️ 予定が重複しています

  以下の候補から選択してください（番号で返信）:

  1️⃣ {{ alternative_slots[0].slot_datetime }} - {{ alternative_slots[0].reason }}
  2️⃣ {{ alternative_slots[1].slot_datetime }} - {{ alternative_slots[1].reason }}
  3️⃣ {{ alternative_slots[2].slot_datetime }} - {{ alternative_slots[2].reason }}
  4️⃣ {{ alternative_slots[3].slot_datetime }} - {{ alternative_slots[3].reason }}
  5️⃣ {{ alternative_slots[4].slot_datetime }} - {{ alternative_slots[4].reason }}

  番号（1-5）で返信してください。
  ```
- **ノードタイプ**: HTTP Request Node（Discord Webhook）

#### タスク5-15: Discord選択反映
- **タスク名**: ユーザーの選択番号を受け取り、対応する候補で予定登録
- **アクション**:
  1. Discordメッセージから選択番号（1-5）を抽出
  2. Static Dataから保存された候補リストを取得
  3. 選択された候補を新しい`event_datetime`として設定
  4. タスク5-1（予定登録）以降を実行
  5. Static Dataから該当ユーザーのエントリを削除
- **ノードタイプ**: Code Node + IF Node（選択番号検証）

---

### レイヤー6: データ統合層 (Merge Layer)

#### タスク6-1: 並列処理の統合（該当なし）
- **タスク名**: （このワークフローでは並列処理がないため統合不要）
- **統合方法**: N/A

#### タスク6-2: エラーフローの統合
- **タスク名**: 各レイヤーのエラーをError Workflowに集約
- **統合方法**:
  - すべてのノードで「On Error」を「Continue with Error Output」に設定
  - エラー発生時はError Workflowトリガー
  - Error Workflowで管理者に通知 + ユーザーにDiscord返信

---

### レイヤー7: 出力層 (Output Layer)

#### タスク7-1: Discord返信（成功）
- **タスク名**: 予定登録完了メッセージ
- **出力先**: Discord（Webhook URL）
- **出力形式**: JSON（Discord Embed形式推奨）
- **出力内容**: タスク5-6参照

#### タスク7-2: Discord返信（重複）
- **タスク名**: 候補5つ提示メッセージ
- **出力先**: Discord（Webhook URL）
- **出力形式**: JSON（Discord Embed形式推奨）
- **出力内容**: タスク5-7参照

#### タスク7-3: Discord返信（エラー）
- **タスク名**: エラーメッセージ
- **出力先**: Discord（Webhook URL）
- **出力形式**: JSON
- **出力内容**:
  ```
  ❌ エラーが発生しました

  {{ エラーの種類 }}

  もう一度お試しいただくか、管理者にお問い合わせください。
  ```

#### タスク7-4: Google Calendar予定登録
- **タスク名**: 新規イベント作成
- **出力先**: Google Calendar（primary calendar）
- **出力内容**: タスク5-1参照

#### タスク7-5: Gmail通知メール送信
- **タスク名**: 参加者への通知
- **出力先**: 参加者のメールアドレス
- **出力内容**: タスク5-2で生成されたメール本文

#### タスク7-6: Error Workflow通知
- **タスク名**: 管理者へのエラー通知
- **出力先**: Discord管理者チャンネル（または他の通知手段）
- **出力内容**:
  - エラー発生時刻
  - エラー箇所（ノード名）
  - エラーメッセージ
  - ユーザーID
  - 元のリクエスト内容

---

## 8層構造サマリー

| 層 | タスク数 | 主要ノードタイプ | 目的 |
|----|----------|------------------|------|
| 0. トリガー | 1 | Webhook Trigger | Discord Botからのリクエスト受信 |
| 1. 取得 | 3 | HTTP Request, Code Node | Discord・Calendar・State取得 |
| 2. 検証 | 3 | IF Node, Code Node | データの妥当性確認 |
| 3. 変換 | 4 | HTTP Request (AI), Code Node | AI抽出、整形、タイムスタンプ計算 |
| 4. 判断 | 3 | IF Node, Code Node | フロー分岐、重複判定 |
| 5. 実行 | 8 | HTTP Request, Code Node | Calendar登録、AI生成、Discord返信 |
| 6. 統合 | 1 | N/A（エラー統合のみ） | エラーハンドリング集約 |
| 7. 出力 | 6 | HTTP Request | Discord、Calendar、Gmail、Error通知 |

**合計タスク数**: 29タスク（実装時は35-45ノードになる見込み）

---

## データフロー図

```
[Webhook Trigger]
    ↓
[検証: リクエスト妥当性]
    ↓
[判断: 初回 or 選択フロー]
    ├─ 初回 → [AI予定抽出 (Grok)]
    │           ↓
    │        [Calendar既存予定取得]
    │           ↓
    │        [変換: タイムスタンプ計算]
    │           ↓
    │        [判断: 重複チェック]
    │           ├─ 重複なし → [実行: Calendar登録]
    │           │               ↓
    │           │            [判断: メール要否]
    │           │               ├─ 要 → [AI: メール生成 (Claude)]
    │           │               │        ↓
    │           │               │     [実行: Gmail送信]
    │           │               │        ↓
    │           │               └─ 不要 → [出力: Discord成功返信]
    │           │
    │           └─ 重複あり → [AI: 候補生成 (Gemini)]
    │                           ↓
    │                        [実行: State保存]
    │                           ↓
    │                        [出力: Discord候補返信]
    │
    └─ 選択 → [取得: State取得]
                ↓
             [変換: 選択番号→日時]
                ↓
             [実行: Calendar登録]
                ↓
             （以降は重複なしフローと同じ）
```

---

✅ **ユーザー確認**: この8層構造で問題ありませんか？

次は**Step 3: タスク分解フェーズ（10-50ノードへの最適化）**に進みます！
