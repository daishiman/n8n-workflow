# Discord Calendar Manager - 完全実装手順書

**ワークフロー名**: Discord Calendar Manager - Google Calendar Integration
**バージョン**: 2.0.0（AI Agent Node対応版）
**作成日**: 2025-11-06
**対象**: n8n初心者〜中級者

---

## 📋 目次

1. [事前準備](#1-事前準備)
2. [ワークフローのインポート](#2-ワークフローのインポート)
3. [接続確認（重要）](#3-接続確認重要)
4. [認証情報の設定](#4-認証情報の設定)
5. [AI Agent接続の確認](#5-ai-agent接続の確認)
6. [テスト実行](#6-テスト実行)
7. [本番デプロイ](#7-本番デプロイ)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 事前準備

### 1.1 必要な環境変数

このワークフローでは以下の環境変数が必要です：

| 環境変数名 | 説明 | 取得元 |
|-----------|------|--------|
| `OPENROUTER_API_KEY` | OpenRouter API キー | [OpenRouter](https://openrouter.ai/keys) |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google Calendar OAuth2 クライアントID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google Calendar OAuth2 クライアントシークレット | [Google Cloud Console](https://console.cloud.google.com/) |
| `GMAIL_CLIENT_ID` | Gmail OAuth2 クライアントID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth2 クライアントシークレット | [Google Cloud Console](https://console.cloud.google.com/) |

### 1.2 必要な認証情報

n8nの認証情報ストアに以下を登録してください：

#### 1.2.1 OpenRouter API Key

**手順**:
1. [OpenRouter](https://openrouter.ai/)にアクセス
2. アカウント作成またはログイン
3. APIキーページ（https://openrouter.ai/keys）に移動
4. 「Create Key」をクリック
5. キー名を入力（例: `n8n-discord-calendar`）
6. 生成されたAPIキーをコピー

**n8n設定**:
- 認証情報タイプ: `OpenAI API`（OpenRouter互換）
- 認証情報名: `OpenRouter API`
- API Key: `[コピーしたAPIキー]`
- Base URL: `https://openrouter.ai/api/v1`

#### 1.2.2 Google Calendar OAuth2

**手順**:
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth クライアント ID」を選択
5. アプリケーションの種類: `ウェブアプリケーション`
6. 名前: `n8n Discord Calendar`
7. 承認済みのリダイレクト URI: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
8. 「作成」をクリック
9. クライアントIDとクライアントシークレットをコピー

**n8n設定**:
- 認証情報タイプ: `Google Calendar OAuth2 API`
- 認証情報名: `Google Calendar OAuth2`
- Client ID: `[コピーしたクライアントID]`
- Client Secret: `[コピーしたクライアントシークレット]`
- Scopes: `https://www.googleapis.com/auth/calendar` (デフォルト)

**OAuth認証の実行**:
1. n8nで認証情報を保存
2. 「Connect my account」をクリック
3. Googleアカウントでログイン
4. カレンダーへのアクセスを許可

#### 1.2.3 Gmail OAuth2

**手順**:
1. Google Calendar OAuth2と同じプロジェクトを使用
2. 「APIとサービス」→「ライブラリ」に移動
3. 「Gmail API」を検索して有効化
4. 既存のOAuth クライアントIDを使用（または新規作成）

**n8n設定**:
- 認証情報タイプ: `Gmail OAuth2`
- 認証情報名: `Gmail OAuth2`
- Client ID: `[Google Cloud ConsoleのクライアントID]`
- Client Secret: `[Google Cloud Consoleのクライアントシークレット]`
- Scopes: `https://www.googleapis.com/auth/gmail.send` (デフォルト)

**OAuth認証の実行**:
1. n8nで認証情報を保存
2. 「Connect my account」をクリック
3. Googleアカウントでログイン
4. Gmailへのアクセスを許可

---

## 2. ワークフローのインポート

### 2.1 メインワークフローのインポート

1. n8n右上の「⋮」メニューをクリック
2. 「Import from File」を選択
3. `step7_complete_n8n_workflow_CORRECTED.json`を選択
4. 「Import」をクリック

**確認ポイント**:
- ✅ ワークフロー名: `Discord Calendar Manager - Google Calendar Integration (Corrected)`
- ✅ ノード数: 40個
- ✅ AI Agent Node: 3個（Discord予定抽出、空き時間候補生成、通知メール生成）

### 2.2 Error Workflowのインポート

1. n8n右上の「⋮」メニューをクリック
2. 「Import from File」を選択
3. `step8_error_workflow_CORRECTED.json`を選択
4. 「Import」をクリック

**確認ポイント**:
- ✅ ワークフロー名: `Discord Calendar Manager - Error Handling`
- ✅ ノード数: 10個
- ✅ Error Trigger: 1個

### 2.3 Error Workflowの紐付け

メインワークフローで以下を確認:

1. メインワークフローを開く
2. 右上の「⋮」メニュー→「Settings」を選択
3. 「Error Workflow」セクションで以下を確認:
   ```
   Error Workflow: Discord Calendar Manager - Error Handling
   ```
4. 既に設定されていることを確認（自動設定済み）

---

## 3. 接続確認（重要）⭐

### 3.1 視覚的な接続確認

ワークフローキャンバスで以下を確認してください。

#### トリガーノードの確認

- [ ] `Discord Bot Webhook`が配置されているか
- [ ] トリガーから線が伸びているか（Webhookデータ抽出へ）

#### AI Agent Nodeとサブノードの接続確認

**AI Agent 1: Discord予定抽出**
- [ ] `Grok Chat Model` → `【AI Agent 1】Discord予定抽出` (ai_languageModel接続)
- [ ] `Discord予定抽出 Memory` → `【AI Agent 1】Discord予定抽出` (ai_memory接続)
- [ ] `予定データParser` → `【AI Agent 1】Discord予定抽出` (ai_outputParser接続)

**AI Agent 2: 空き時間候補生成**
- [ ] `Gemini Chat Model` → `【AI Agent 2】空き時間候補生成` (ai_languageModel接続)
- [ ] `候補生成 Memory` → `【AI Agent 2】空き時間候補生成` (ai_memory接続)
- [ ] `候補データParser` → `【AI Agent 2】空き時間候補生成` (ai_outputParser接続)

**AI Agent 3: 通知メール生成**
- [ ] `Claude Chat Model` → `【AI Agent 3】通知メール生成` (ai_languageModel接続)
- [ ] `メール生成 Memory` → `【AI Agent 3】通知メール生成` (ai_memory接続)
- [ ] `メールデータParser` → `【AI Agent 3】通知メール生成` (ai_outputParser接続)

#### 全ノードの接続確認

メインフローの接続を確認:

1. [ ] `Discord Bot Webhook` → `Webhookデータ抽出`
2. [ ] `Webhookデータ抽出` → `ステート確認`
3. [ ] `ステート確認` → `フロー振り分け`
4. [ ] `フロー振り分け` → `Webhookデータ検証` (初回フロー)
5. [ ] `フロー振り分け` → `保存済みステート読み込み` (選択フロー)
6. [ ] `Webhookデータ検証` → `【AI Agent 1】Discord予定抽出`
7. [ ] `【AI Agent 1】Discord予定抽出` → `AI抽出結果検証`
8. [ ] `AI抽出結果検証` → `検証結果チェック`
9. [ ] `検証結果チェック` → `タイムスタンプ計算` (成功)
10. [ ] `タイムスタンプ計算` → `Googleカレンダー既存予定取得`
11. [ ] `Googleカレンダー既存予定取得` → `カレンダーレスポンス整形`
12. [ ] `カレンダーレスポンス整形` → `予定重複判定`
13. [ ] `予定重複判定` → `重複有無で分岐`
14. [ ] `重複有無で分岐` → `Googleカレンダー予定登録` (重複なし)
15. [ ] `重複有無で分岐` → `【AI Agent 2】空き時間候補生成` (重複あり)
16. [ ] `Googleカレンダー予定登録` → `メール送信要否判定`
17. [ ] `メール送信要否判定` → `【AI Agent 3】通知メール生成` (参加者あり)
18. [ ] `メール送信要否判定` → `Discord成功返信` (参加者なし)
19. [ ] `【AI Agent 3】通知メール生成` → `メールデータ整形`
20. [ ] `メールデータ整形` → `Gmail送信`
21. [ ] `Gmail送信` → `Discord成功返信`
22. [ ] `Discord成功返信` → `ワークフロー終了`

### 3.2 JSON定義での接続確認

より正確な確認のため、JSON定義をチェック:

1. ワークフローの「⋮」メニュー→「Export workflow」を選択
2. JSONをテキストエディタで開く
3. `connections`オブジェクトを確認
4. AI Agent接続の例:

```json
"Grok Chat Model": {
  "ai_languageModel": [
    [
      {
        "node": "【AI Agent 1】Discord予定抽出",
        "type": "ai_languageModel",
        "index": 0
      }
    ]
  ]
},
"Discord予定抽出 Memory": {
  "ai_memory": [
    [
      {
        "node": "【AI Agent 1】Discord予定抽出",
        "type": "ai_memory",
        "index": 0
      }
    ]
  ]
}
```

---

## 4. 認証情報の設定

### 4.1 認証情報の紐付け

各ノードをクリックして、認証情報を確認・設定してください。

#### OpenRouter API（AI Agent用）

以下のノードで使用:
- `Grok Chat Model`
- `Gemini Chat Model`
- `Claude Chat Model`

**設定手順**:
1. 各Chat Modelノードをクリック
2. 「Credential to connect with」→「OpenRouter API」を選択
3. 認証情報が表示されない場合:
   - 「+ Create New」をクリック
   - 「OpenAI API」を選択（OpenRouter互換）
   - 認証情報名: `OpenRouter API`
   - API Key: `[OpenRouter APIキー]`
   - Base URL: `https://openrouter.ai/api/v1`
   - 「Create」をクリック

**確認**:
- [ ] `Grok Chat Model`: OpenRouter API設定済み
- [ ] `Gemini Chat Model`: OpenRouter API設定済み
- [ ] `Claude Chat Model`: OpenRouter API設定済み
- [ ] エラー表示がないか

#### Google Calendar OAuth2

以下のノードで使用:
- `Googleカレンダー既存予定取得`
- `Googleカレンダー予定登録`

**設定手順**:
1. 各ノードをクリック
2. 「Credential to connect with」→「Google Calendar OAuth2」を選択
3. OAuth認証が完了していることを確認
4. 「Test」ボタンをクリックして接続をテスト

**確認**:
- [ ] `Googleカレンダー既存予定取得`: OAuth認証済み
- [ ] `Googleカレンダー予定登録`: OAuth認証済み
- [ ] テスト接続成功

#### Gmail OAuth2

以下のノードで使用:
- `Gmail送信`

**設定手順**:
1. `Gmail送信`ノードをクリック
2. 「Credential to connect with」→「Gmail OAuth2」を選択
3. OAuth認証が完了していることを確認
4. 「Test」ボタンをクリックして接続をテスト

**確認**:
- [ ] `Gmail送信`: OAuth認証済み
- [ ] テスト接続成功

---

## 5. AI Agent接続の確認

### 5.1 AI Agent 1の接続確認

**ノード**: `【AI Agent 1】Discord予定抽出`

**確認項目**:

1. **Chat Model接続**:
   ```
   ai_languageModel: Grok Chat Model
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_languageModel`

2. **Memory接続**:
   ```
   ai_memory: Discord予定抽出 Memory
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_memory`

3. **Output Parser接続**:
   ```
   ai_outputParser: 予定データParser
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_outputParser`

**パラメータ確認**:
- [ ] Prompt Type: `define`
- [ ] Text: `={{ $json.message_content }}`
- [ ] Has Output Parser: `true`
- [ ] System Message: Discord予定抽出の責務が記載されている

### 5.2 AI Agent 2の接続確認

**ノード**: `【AI Agent 2】空き時間候補生成`

**確認項目**:

1. **Chat Model接続**:
   ```
   ai_languageModel: Gemini Chat Model
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_languageModel`

2. **Memory接続**:
   ```
   ai_memory: 候補生成 Memory
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_memory`

3. **Output Parser接続**:
   ```
   ai_outputParser: 候補データParser
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_outputParser`

**パラメータ確認**:
- [ ] Prompt Type: `define`
- [ ] Text: 希望日時、所要時間、既存予定のExpression
- [ ] Has Output Parser: `true`
- [ ] System Message: カレンダー分析の責務が記載されている

### 5.3 AI Agent 3の接続確認

**ノード**: `【AI Agent 3】通知メール生成`

**確認項目**:

1. **Chat Model接続**:
   ```
   ai_languageModel: Claude Chat Model
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_languageModel`

2. **Memory接続**:
   ```
   ai_memory: メール生成 Memory
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_memory`

3. **Output Parser接続**:
   ```
   ai_outputParser: メールデータParser
   ```
   - [ ] 接続線が表示されている
   - [ ] 接続タイプが`ai_outputParser`

**パラメータ確認**:
- [ ] Prompt Type: `define`
- [ ] Text: 予定情報のExpression
- [ ] Has Output Parser: `true`
- [ ] System Message: ビジネスメール作成の責務が記載されている

---

## 6. テスト実行

### 6.1 Webhookトリガーの設定

1. `Discord Bot Webhook`ノードをクリック
2. Webhook URLをコピー:
   ```
   https://your-n8n-instance.com/webhook/discord-calendar
   ```
3. Discord Botの設定でこのURLを使用

### 6.2 初回フローのテスト（予定登録）

**テストデータ**:
```bash
curl -X POST https://your-n8n-instance.com/webhook/discord-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "channel_id": "test_channel_456",
    "message_content": "明日の14時から1時間、田中さん(tanaka@example.com)とミーティング",
    "callback_url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
    "timestamp": "2025-11-06T12:00:00+09:00"
  }'
```

**確認ポイント**:
1. [ ] Webhookが受信される
2. [ ] `【AI Agent 1】Discord予定抽出`が実行される
3. [ ] AI Agent 1の出力を確認:
   ```json
   {
     "event_title": "田中さんとミーティング",
     "event_datetime": "2025-11-07T14:00:00+09:00",
     "duration_minutes": 60,
     "attendee_emails": ["tanaka@example.com"],
     "description": ""
   }
   ```
4. [ ] `AI抽出結果検証`が成功
5. [ ] `Googleカレンダー既存予定取得`が実行される
6. [ ] 重複がない場合、`Googleカレンダー予定登録`が実行される
7. [ ] 参加者がいる場合、`【AI Agent 3】通知メール生成`が実行される
8. [ ] `Gmail送信`が実行される
9. [ ] `Discord成功返信`が実行される
10. [ ] ワークフローが正常終了

### 6.3 重複フローのテスト（代替案提示）

**前提**: 先ほどのテストで明日14時に予定が登録されている

**テストデータ**:
```bash
curl -X POST https://your-n8n-instance.com/webhook/discord-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "channel_id": "test_channel_456",
    "message_content": "明日の14時から1時間、佐藤さんとミーティング",
    "callback_url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
    "timestamp": "2025-11-06T12:01:00+09:00"
  }'
```

**確認ポイント**:
1. [ ] Webhookが受信される
2. [ ] `【AI Agent 1】Discord予定抽出`が実行される
3. [ ] `予定重複判定`で重複が検出される
4. [ ] `【AI Agent 2】空き時間候補生成`が実行される
5. [ ] AI Agent 2の出力を確認:
   ```json
   {
     "alternative_slots": [
       {"slot_datetime": "2025-11-07T10:00:00+09:00", "reason": "午前中で集中しやすい"},
       {"slot_datetime": "2025-11-07T15:00:00+09:00", "reason": "既存予定の直後で移動不要"},
       {"slot_datetime": "2025-11-07T16:00:00+09:00", "reason": "午後の作業時間帯"},
       {"slot_datetime": "2025-11-08T10:00:00+09:00", "reason": "翌日午前で余裕がある"},
       {"slot_datetime": "2025-11-08T14:00:00+09:00", "reason": "翌日同時刻で調整しやすい"}
     ]
   }
   ```
6. [ ] `ステート保存`が実行される
7. [ ] `Discord重複返信`で5つの候補が提示される
8. [ ] ワークフローが正常終了

### 6.4 選択フローのテスト（番号入力）

**前提**: 重複フローで5つの候補が提示されている

**テストデータ**:
```bash
curl -X POST https://your-n8n-instance.com/webhook/discord-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "channel_id": "test_channel_456",
    "message_content": "2",
    "callback_url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
    "timestamp": "2025-11-06T12:02:00+09:00"
  }'
```

**確認ポイント**:
1. [ ] `ステート確認`で保存済み状態を検出
2. [ ] `フロー振り分け`で選択フローに分岐
3. [ ] `保存済みステート読み込み`が実行される
4. [ ] `ユーザー選択番号解析`が実行される
5. [ ] 選択された候補（2番目）の`slot_datetime`が抽出される
6. [ ] `選択番号検証`が成功
7. [ ] `ステートクリア`が実行される
8. [ ] `タイムスタンプ計算`以降、通常の予定登録フローが実行される
9. [ ] `Googleカレンダー予定登録`が実行される
10. [ ] `Discord成功返信`が実行される
11. [ ] ワークフローが正常終了

### 6.5 エラーフローのテスト

**意図的なエラー発生**:

**方法1: 無効なWebhook URL**
```bash
curl -X POST https://your-n8n-instance.com/webhook/discord-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "channel_id": "test_channel_456",
    "message_content": "明日の14時から1時間、ミーティング",
    "callback_url": "https://invalid-url",
    "timestamp": "2025-11-06T12:03:00+09:00"
  }'
```

**確認ポイント**:
1. [ ] `Webhookデータ検証`でエラー
2. [ ] Error Workflowが自動実行される
3. [ ] `エラー情報整形`が実行される
4. [ ] 重要度が`ERROR`と判定される
5. [ ] `Discord管理者通知`が送信される
6. [ ] エラーログが記録される
7. [ ] Error Workflowが正常終了

---

## 7. 本番デプロイ

### 7.1 本番データでの検証

1. **小規模テスト**:
   - 実際のDiscord Botから1件だけ予定を登録
   - 予定がGoogleカレンダーに正しく登録されるか確認
   - メール通知が正しく送信されるか確認

2. **パフォーマンス確認**:
   - 実行時間を確認（通常30秒〜1分程度）
   - メモリ使用量を確認
   - API呼び出し回数を確認

### 7.2 トリガーの有効化

1. `Discord Bot Webhook`ノードをクリック
2. Webhook URLを本番Discord Botに設定
3. ワークフローを「Active」状態にする（右上のトグルスイッチ）

### 7.3 監視設定

#### Error Workflowの確認

1. Error Workflowを開く
2. `Discord管理者通知`ノードの`url`パラメータを確認
3. 管理者用Discord Webhook URLを設定:
   ```json
   "url": "https://discord.com/api/webhooks/YOUR_ADMIN_CHANNEL_ID/YOUR_WEBHOOK_TOKEN"
   ```
4. Error Workflowを「Active」状態にする

#### 実行履歴の確認

1. n8nの「Executions」タブを開く
2. 定期的にチェック:
   - 成功率
   - エラー発生頻度
   - 実行時間

#### ログファイルの確認

Error Workflowが動作している場合:
```bash
# n8nサーバーで実行
tail -f /tmp/n8n_discord_calendar_errors.jsonl
```

---

## 8. トラブルシューティング

### 8.1 AI Agent関連の問題

#### 問題: AI Agentが応答しない

**原因**:
- Chat Modelとの接続が切れている
- OpenRouter APIキーが無効

**対処**:
1. AI AgentノードとChat Modelノードの接続を確認
2. Chat Modelノードをクリック→認証情報を確認
3. OpenRouter APIキーが有効か確認:
   ```bash
   curl https://openrouter.ai/api/v1/auth/key \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
4. 接続タイプが`ai_languageModel`であることを確認
5. ワークフローを再保存して接続を更新

---

#### 問題: AI Agentの出力が不正

**原因**:
- Output Parserとの接続が切れている
- JSONスキーマが不適切

**対処**:
1. AI AgentノードとOutput Parserノードの接続を確認
2. Output Parserノードをクリック→JSONスキーマを確認
3. AI Agentの`hasOutputParser`が`true`であることを確認
4. System Messageが正しく設定されているか確認

---

#### 問題: Memoryが機能しない

**原因**:
- Memoryとの接続が切れている
- Context Window Lengthが0

**対処**:
1. AI AgentノードとMemoryノードの接続を確認
2. Memoryノードをクリック→`contextWindowLength`を確認
3. 接続タイプが`ai_memory`であることを確認

---

### 8.2 認証関連の問題

#### 問題: Google Calendar APIエラー

**エラーメッセージ**: `401 Unauthorized` または `403 Forbidden`

**対処**:
1. OAuth認証を再実行:
   - n8nの認証情報を開く
   - 「Reconnect」をクリック
   - Googleアカウントでログイン
2. Google Cloud Consoleで以下を確認:
   - Calendar APIが有効化されているか
   - OAuth同意画面が設定されているか
   - リダイレクトURIが正しく設定されているか

---

#### 問題: Gmail送信エラー

**エラーメッセージ**: `Insufficient Permission`

**対処**:
1. OAuth認証のスコープを確認:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
2. OAuth認証を再実行
3. Google Cloud ConsoleでGmail APIが有効化されているか確認

---

#### 問題: OpenRouter APIエラー

**エラーメッセージ**: `Invalid API Key` または `Rate Limit Exceeded`

**対処**:
1. APIキーが正しく設定されているか確認
2. OpenRouterアカウントの残高を確認
3. レート制限に達している場合:
   - しばらく待つ
   - プランをアップグレード
4. Base URLが正しく設定されているか確認:
   ```
   https://openrouter.ai/api/v1
   ```

---

### 8.3 ワークフロー実行の問題

#### 問題: Webhookが受信されない

**原因**:
- ワークフローが無効（Inactive）
- Webhook URLが間違っている
- Discord Botの設定が間違っている

**対処**:
1. ワークフローが「Active」状態か確認
2. Webhook URLをコピーし直す
3. Discord Botの設定でWebhook URLを確認
4. curlコマンドで直接テスト:
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/discord-calendar \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

---

#### 問題: 予定が重複判定されない

**原因**:
- タイムゾーンの不一致
- タイムスタンプ計算のバグ

**対処**:
1. ワークフローの`settings`で`timezone`を確認:
   ```json
   "timezone": "Asia/Tokyo"
   ```
2. `タイムスタンプ計算`ノードの出力を確認
3. `予定重複判定`ノードのJavaScriptコードをデバッグ

---

#### 問題: 選択フローでステートが見つからない

**エラーメッセージ**: `No saved state found for user`

**原因**:
- グローバルステートがクリアされた
- ユーザーIDが一致しない
- 時間が経過しすぎた

**対処**:
1. 重複フローから選択フローまでの時間を短くする
2. `ステート保存`ノードの出力を確認
3. `保存済みステート読み込み`ノードでユーザーIDが一致しているか確認
4. n8nを再起動していないか確認（再起動でグローバルステートがクリア）

---

### 8.4 パフォーマンスの問題

#### 問題: 実行が遅い

**原因**:
- AI Agentの応答が遅い
- APIのタイムアウト設定が長い

**対処**:
1. AI Agentの`maxIterations`を減らす（デフォルト: 3）
2. HTTP Requestノードの`timeout`を確認
3. 並列実行を増やす（現在は順次実行）

---

#### 問題: メモリ使用量が多い

**原因**:
- Memoryの`contextWindowLength`が大きい
- 大量のデータを保持

**対処**:
1. Memoryの`contextWindowLength`を減らす:
   - AI Agent 1: 5 → 3
   - AI Agent 2: 3 → 2
   - AI Agent 3: 3 → 2
2. ワークフローの実行履歴を定期的に削除

---

### 8.5 Error Workflow関連の問題

#### 問題: Error Workflowが実行されない

**原因**:
- メインワークフローのsettingsにerrorWorkflowが設定されていない
- Error Workflowが無効（Inactive）

**対処**:
1. メインワークフローのsettingsを確認:
   ```json
   "errorWorkflow": "Discord Calendar Manager - Error Handling"
   ```
2. Error Workflowの名前が完全一致しているか確認
3. Error Workflowが「Active」状態か確認

---

#### 問題: エラーログが記録されない

**原因**:
- `/tmp/`ディレクトリへの書き込み権限がない
- ディスクスペースが不足

**対処**:
1. ディレクトリの権限を確認:
   ```bash
   ls -ld /tmp
   ```
2. ディスクスペースを確認:
   ```bash
   df -h /tmp
   ```
3. ログファイルパスを変更:
   ```json
   "fileName": "/var/log/n8n/discord_calendar_errors.jsonl"
   ```

---

## 9. ベストプラクティス

### 9.1 セキュリティ

1. **認証情報の管理**:
   - APIキーをハードコードしない
   - n8nの認証情報ストアを使用
   - 定期的にAPIキーをローテーション

2. **Webhook URL**:
   - Webhook URLを公開しない
   - Discord Botのみがアクセスできるように制限
   - 必要に応じて認証を追加

3. **エラー情報**:
   - ユーザーには技術的詳細を見せない
   - 管理者には詳細なエラー情報を送信
   - ログファイルのアクセス権限を制限

### 9.2 パフォーマンス

1. **並列実行**:
   - 独立したノードは並列実行を検討
   - 現在は順次実行だが、パフォーマンス要件次第で変更可能

2. **キャッシュ**:
   - Memoryノードでコンテキストをキャッシュ
   - Googleカレンダーの予定取得結果をキャッシュ（将来的に）

3. **レート制限**:
   - OpenRouter APIのレート制限に注意
   - Google Calendar APIのクォータを監視

### 9.3 監視とメンテナンス

1. **定期的な確認**:
   - 週次: 実行履歴とエラー率を確認
   - 月次: APIクォータと残高を確認
   - 四半期: ワークフローの最適化を検討

2. **ログ分析**:
   - エラーログを定期的に分析
   - 頻発するエラーを特定して対処
   - エラー統計を確認（Error Workflowのオプション機能）

3. **バックアップ**:
   - ワークフローJSONを定期的にエクスポート
   - Gitで管理することを推奨
   - 認証情報の設定手順をドキュメント化

---

## 10. FAQ

### Q1: AI Agentノードとは何ですか？

**A**: n8n AI Agent Nodeは、LangChainベースの自律型AIシステムです。Chat Model（LLM）、Tools（外部システム連携）、Memory（会話履歴管理）を接続して、複雑なタスクを自動実行できます。

従来のHTTP Request経由のAPI呼び出しと比べて、以下のメリットがあります：
- 構造化出力の自動生成（Output Parser）
- 会話履歴の自動管理（Memory）
- 外部ツールとの連携（Tools）
- エラーハンドリングの自動化

---

### Q2: なぜ3つのAI Agentに分けているのですか？

**A**: 単一責務の原則に従っています。各AI Agentは1つの明確な責務を持つことで、以下のメリットがあります：

- **保守性**: 各AI Agentの動作を独立して改善可能
- **テスト**: 各AI Agentを個別にテスト可能
- **デバッグ**: 問題の特定が容易
- **拡張性**: 新しいAI Agentを追加しやすい

---

### Q3: OpenRouterを使う理由は？

**A**: OpenRouterを使用する理由：
- **統一API**: 1つのAPIキーで複数のLLM（Grok、Gemini、Claude）を使用
- **コスト最適化**: タスクごとに最適なモデルを選択可能
- **フォールバック**: あるモデルが利用不可の場合、自動で別モデルに切り替え
- **OpenAI互換**: n8nのOpenAI Chat Modelノードをそのまま使用可能

---

### Q4: Memoryノードの役割は？

**A**: Memoryノードは会話履歴を保存・管理します：

- **コンテキスト保持**: 過去の会話を参照して一貫した応答
- **効率化**: 重複する情報を再度送信する必要がない
- **ユーザー体験**: 文脈を理解した自然な対話

各AI Agentで異なる`contextWindowLength`を設定:
- AI Agent 1（予定抽出）: 5件（多様な表現を学習）
- AI Agent 2（候補生成）: 3件（最近の候補パターンを参照）
- AI Agent 3（メール生成）: 3件（一貫したトーン維持）

---

### Q5: グローバルステートとは？

**A**: n8nのグローバルステートは、ワークフロー実行間でデータを共有する仕組みです。

このワークフローでは以下の用途で使用：
- **選択フロー**: ユーザーの選択待ち状態を保存
- **エラー統計**: エラー発生回数とパターンを蓄積

注意点：
- n8n再起動でクリアされる
- 永続化が必要な場合はデータベースを使用

---

### Q6: Error Workflowの重要度判定はどう動作しますか？

**A**: エラーメッセージのキーワードで自動判定：

**CRITICAL**:
- `authentication` → 認証エラー
- `API` → API障害
- 対応: 全チャネルで即時通知

**ERROR**:
- 上記以外の一般的なエラー
- 対応: 管理者とユーザーに通知

**WARNING**:
- `timeout` / `ETIMEDOUT` → タイムアウト
- `validation` / `Invalid` → バリデーションエラー
- 対応: ログ記録のみ、通知なし

カスタマイズ可能：
`エラー情報整形`ノードのJavaScriptコードを編集して判定ロジックを変更できます。

---

## 11. 参考資料

- [n8n公式ドキュメント](https://docs.n8n.io/)
- [n8n AI Agent Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [n8n LangChain Integration](https://docs.n8n.io/integrations/builtin/cluster-nodes/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Gmail API](https://developers.google.com/gmail/api/guides)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)

---

## ✅ 実装完了チェックリスト

### 事前準備
- [ ] OpenRouter APIキーを取得
- [ ] Google Cloud Consoleでプロジェクト作成
- [ ] Google Calendar OAuth2設定
- [ ] Gmail OAuth2設定

### インポート
- [ ] メインワークフローをインポート
- [ ] Error Workflowをインポート
- [ ] Error Workflowの紐付け確認

### 認証情報
- [ ] OpenRouter API認証情報を作成
- [ ] Google Calendar OAuth2認証情報を作成
- [ ] Gmail OAuth2認証情報を作成
- [ ] 全Chat ModelノードにOpenRouter認証を設定
- [ ] GoogleカレンダーノードにOAuth認証を設定
- [ ] Gmail送信ノードにOAuth認証を設定

### 接続確認
- [ ] AI Agent 1とサブノードの接続確認
- [ ] AI Agent 2とサブノードの接続確認
- [ ] AI Agent 3とサブノードの接続確認
- [ ] メインフローの全接続確認
- [ ] JSON定義で接続を確認

### テスト
- [ ] 初回フロー（予定登録）のテスト
- [ ] 重複フロー（代替案提示）のテスト
- [ ] 選択フロー（番号入力）のテスト
- [ ] エラーフローのテスト
- [ ] すべてのテストケースが成功

### 本番デプロイ
- [ ] Discord Botにてbhook URLを設定
- [ ] Error Workflow管理者通知URLを設定
- [ ] ワークフローを「Active」状態にする
- [ ] Error Workflowを「Active」状態にする
- [ ] 本番データで検証
- [ ] 監視設定完了

---

**実装完了おめでとうございます！**

このワークフローにより、Discordからの自然言語メッセージでGoogleカレンダー予定を自動登録できるようになりました。AI Agent Nodeを活用した最新のn8n実装をお楽しみください！

---

**作成者**: Claude Code (n8n Workflow Designer)
**完了日時**: 2025-11-06
