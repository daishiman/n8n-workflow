# Discord設定ガイド - n8n Discord Calendar Manager

このガイドでは、n8n Discord Calendar Managerワークフローで使用するDiscordノードの設定方法を詳しく説明します。

---

## 📋 目次

1. [Discord Bot作成](#1-discord-bot作成)
2. [n8nでのDiscord認証情報設定](#2-n8nでのdiscord認証情報設定)
3. [メインワークフロー - Discordエラー返信ノード](#3-メインワークフロー---discordエラー返信ノード)
4. [メインワークフロー - Discord成功返信ノード](#4-メインワークフロー---discord成功返信ノード)
5. [メインワークフロー - Discord重複返信ノード](#5-メインワークフロー---discord重複返信ノード)
6. [Error Workflow - Discord管理者通知ノード](#6-error-workflow---discord管理者通知ノード)
7. [Error Workflow - Discordユーザーエラー通知ノード](#7-error-workflow---discordユーザーエラー通知ノード)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. Discord Bot作成

### ステップ1: Discord Developer Portalにアクセス

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 右上の「New Application」ボタンをクリック
3. アプリケーション名を入力（例: "Calendar Manager Bot"）
4. 利用規約に同意して「Create」をクリック

### ステップ2: Botを作成

1. 左メニューから「Bot」を選択
2. 「Add Bot」→「Yes, do it!」をクリック
3. Bot名を設定（例: "Calendar Manager"）
4. 「Reset Token」をクリックしてBot Tokenを生成
5. **重要**: 表示されたトークンをコピーして安全に保存
   - このトークンは二度と表示されません
   - 例: `YOUR_BOT_TOKEN_HERE`

### ステップ3: Bot権限を設定

1. 「Bot」タブで以下の権限を有効化:
   - ✅ **Privileged Gateway Intents**:
     - `MESSAGE CONTENT INTENT` (メッセージ内容の読み取り)
   - ✅ **Bot Permissions**:
     - `Send Messages` (メッセージ送信)
     - `Read Messages/View Channels` (メッセージ読み取り)
     - `Read Message History` (メッセージ履歴読み取り)

### ステップ4: BotをDiscordサーバーに招待

1. 左メニューから「OAuth2」→「URL Generator」を選択
2. **SCOPES**で`bot`を選択
3. **BOT PERMISSIONS**で以下を選択:
   - `Send Messages`
   - `Read Messages/View Channels`
   - `Read Message History`
4. 生成されたURLをコピーしてブラウザで開く
5. Botを招待するサーバーを選択して「認証」をクリック

### ステップ5: チャンネルIDを取得

1. Discordで「ユーザー設定」→「詳細設定」→「開発者モード」を有効化
2. Bot を使用するチャンネルを右クリック
3. 「IDをコピー」を選択
4. **管理者チャンネルID**を保存（例: `1234567890123456789`）

---

## 2. n8nでのDiscord認証情報設定

### ステップ1: 認証情報を作成

1. n8n画面右上の「Credentials」→「New」をクリック
2. 検索欄に「Discord」と入力
3. 「Discord API」を選択
4. 以下を入力:
   - **Name**: `Discord Bot Token`（わかりやすい名前）
   - **Bot Token**: ステップ1-2で取得したBot Token
5. 「Save」をクリック

### ステップ2: 接続をテスト

1. 作成した認証情報をクリック
2. 「Test Credentials」ボタンをクリック
3. ✅ "Connection successful" が表示されればOK

---

## 3. メインワークフロー - Discordエラー返信ノード

### 概要
ユーザーが無効なメッセージを送信した際にエラーメッセージを返信するノードです。

### 設定内容

```json
{
  "resource": "message",
  "operation": "send",
  "channelId": "={{ $json.channel_id }}",
  "content": "=❌ エラーが発生しました\n\n{{ $json.error_message || $json.validation_error || '予期しないエラーです' }}\n\nもう一度お試しいただくか、管理者にお問い合わせください。"
}
```

### パラメータ説明

| パラメータ | 値 | 説明 |
|----------|-----|------|
| **Resource** | `message` | メッセージリソースを操作 |
| **Operation** | `send` | メッセージ送信操作 |
| **Channel ID** | `={{ $json.channel_id }}` | Webhookから受け取ったチャンネルID（動的） |
| **Content** | エラーメッセージテンプレート | ❌絵文字 + エラー内容 + 対処方法 |

### n8nでの設定手順

1. ワークフローに「Discord」ノードを追加
2. **Credentials**で「Discord Bot Token」を選択
3. **Resource**を「Message」に設定
4. **Operation**を「Send」に設定
5. **Channel ID**に`={{ $json.channel_id }}`を入力
6. **Content**に上記のエラーメッセージテンプレートを入力
7. 「Execute Node」でテスト実行

### 送信されるメッセージ例

```
❌ エラーが発生しました

予定情報を正しく抽出できませんでした。以下の形式で入力してください。

もう一度お試しいただくか、管理者にお問い合わせください。
```

---

## 4. メインワークフロー - Discord成功返信ノード

### 概要
Googleカレンダーに予定を正常に登録した後、成功メッセージを返信するノードです。

### 設定内容

```json
{
  "resource": "message",
  "operation": "send",
  "channelId": "={{ $json.channel_id }}",
  "content": "=✅ 予定を登録しました！\n\n📅 タイトル: {{ $json.event_title }}\n🕐 日時: {{ $json.event_datetime }}\n⏱️ 所要時間: {{ $json.duration_minutes }}分\n👥 参加者: {{ $json.attendee_emails.length }}名\n\n📧 通知メールを送信しました。"
}
```

### パラメータ説明

| パラメータ | 値 | 説明 |
|----------|-----|------|
| **Resource** | `message` | メッセージリソースを操作 |
| **Operation** | `send` | メッセージ送信操作 |
| **Channel ID** | `={{ $json.channel_id }}` | ユーザーのチャンネルID（動的） |
| **Content** | 成功メッセージテンプレート | ✅絵文字 + 登録内容 + 確認情報 |

### 送信されるメッセージ例

```
✅ 予定を登録しました！

📅 タイトル: チーム定例会議
🕐 日時: 2025-11-08 14:00
⏱️ 所要時間: 60分
👥 参加者: 3名

📧 通知メールを送信しました。
```

---

## 5. メインワークフロー - Discord重複返信ノード

### 概要
予定が重複している場合に、代替候補5つを番号付きで提案するノードです。

### 設定内容

```json
{
  "resource": "message",
  "operation": "send",
  "channelId": "={{ $json.channel_id }}",
  "content": "=⚠️ 予定が重複しています\n\n希望日時: {{ $json.event_datetime }}\n\n以下の空き時間候補から選択してください（番号で返信）:\n\n{{ $json.alternative_slots.map((slot, i) => `${i+1}. ${slot.datetime} (${slot.duration}分)`).join('\\n') }}\n\n1-5の番号で返信してください。"
}
```

### パラメータ説明

| パラメータ | 値 | 説明 |
|----------|-----|------|
| **Resource** | `message` | メッセージリソースを操作 |
| **Operation** | `send` | メッセージ送信操作 |
| **Channel ID** | `={{ $json.channel_id }}` | ユーザーのチャンネルID（動的） |
| **Content** | 代替候補テンプレート | ⚠️絵文字 + 5つの代替候補 + 選択指示 |

### 送信されるメッセージ例

```
⚠️ 予定が重複しています

希望日時: 2025-11-08 14:00

以下の空き時間候補から選択してください（番号で返信）:

1. 2025-11-08 10:00 (60分)
2. 2025-11-08 15:00 (60分)
3. 2025-11-08 16:30 (60分)
4. 2025-11-09 09:00 (60分)
5. 2025-11-09 11:00 (60分)

1-5の番号で返信してください。
```

---

## 6. Error Workflow - Discord管理者通知ノード

### 概要
メインワークフローでエラーが発生した際、管理者チャンネルに詳細なエラー情報を送信するノードです。

### 設定内容

```json
{
  "operation": "sendMessage",
  "channelId": "YOUR_ADMIN_CHANNEL_ID",
  "content": "={{ $json.discord_message }}",
  "options": {}
}
```

### ⚠️ 重要: 管理者チャンネルIDの設定

**必ず以下の手順で管理者チャンネルIDを設定してください:**

1. Discordで管理者専用チャンネルを作成（例: `#calendar-errors`）
2. チャンネルを右クリック→「IDをコピー」
3. n8nのこのノードを開く
4. **Channel ID**フィールドの`YOUR_ADMIN_CHANNEL_ID`を実際のIDに置き換え
   - 例: `1234567890123456789`

### パラメータ説明

| パラメータ | 値 | 説明 |
|----------|-----|------|
| **Operation** | `sendMessage` | メッセージ送信操作 |
| **Channel ID** | `YOUR_ADMIN_CHANNEL_ID` | **要設定**: 管理者チャンネルID |
| **Content** | `={{ $json.discord_message }}` | エラー情報整形ノードで生成された詳細メッセージ |

### 送信されるメッセージ例

```
🚨 **エラー発生** [ERROR]

**ワークフロー**: Discord Calendar Manager
**エラー発生ノード**: AI抽出結果検証
**エラーメッセージ**: Invalid date format in event_datetime
**実行ID**: abc123def456
**発生時刻**: 2025-11-07 14:23:45
**ユーザーID**: user_12345
**メッセージ内容**: 明日の14時から会議

**スタックトレース**:
```
Error: Invalid date format
  at Code.execute (/node_modules/n8n/...)
  at Workflow.runNode (/node_modules/n8n/...)
```

管理者に報告してください。
```

---

## 7. Error Workflow - Discordユーザーエラー通知ノード

### 概要
メインワークフローでエラーが発生した際、ユーザーに簡潔で分かりやすいエラーメッセージを送信するノードです。

### 設定内容

```json
{
  "operation": "sendMessage",
  "channelId": "={{ $json.callback_url }}",
  "content": "=❌ エラーが発生しました\\n\\n予定の登録に失敗しました。\\nエラー内容: {{ $json.error_message }}\\n\\n管理者に報告済みです。しばらく待ってから再度お試しください。\\n\\n実行ID: {{ $json.execution_id }}",
  "options": {}
}
```

### パラメータ説明

| パラメータ | 値 | 説明 |
|----------|-----|------|
| **Operation** | `sendMessage` | メッセージ送信操作 |
| **Channel ID** | `={{ $json.callback_url }}` | ユーザーのチャンネルID（動的） |
| **Content** | ユーザー向けエラーメッセージ | ❌絵文字 + 簡潔な状況 + 対処方法 |

### 送信されるメッセージ例

```
❌ エラーが発生しました

予定の登録に失敗しました。
エラー内容: 日時の形式が無効です

管理者に報告済みです。しばらく待ってから再度お試しください。

実行ID: abc123def456
```

---

## 8. トラブルシューティング

### 問題1: "Missing credentials" エラー

**原因**: Discord認証情報が設定されていない

**解決策**:
1. Discordノードを開く
2. 「Credentials」ドロップダウンで「Discord Bot Token」を選択
3. 認証情報が表示されない場合は、[2. n8nでのDiscord認証情報設定](#2-n8nでのdiscord認証情報設定)を実行

### 問題2: "Unknown Channel" エラー

**原因**: チャンネルIDが無効または、Botがそのチャンネルにアクセスできない

**解決策**:
1. チャンネルIDが正しいか確認（18-19桁の数字）
2. DiscordでBotがそのチャンネルにアクセス権限を持っているか確認
3. Botをサーバーに再招待（[1. Discord Bot作成](#1-discord-bot作成) ステップ4）

### 問題3: "Missing Access" エラー

**原因**: Bot権限が不足している

**解決策**:
1. Discord Developer PortalでBot権限を確認
2. 以下の権限が有効か確認:
   - `Send Messages`
   - `Read Messages/View Channels`
   - `Read Message History`
3. 「Privileged Gateway Intents」の`MESSAGE CONTENT INTENT`が有効か確認

### 問題4: メッセージが送信されない

**原因**: チャンネルIDの式が正しくない

**解決策**:
1. `{{ $json.channel_id }}`の前に`=`記号があるか確認
2. 正しい形式: `={{ $json.channel_id }}`
3. 前のノードで`channel_id`フィールドが正しく渡されているか確認

### 問題5: Bot Tokenが無効

**原因**: Bot Tokenが間違っているか、リセットされた

**解決策**:
1. Discord Developer Portalで「Reset Token」を実行
2. 新しいトークンをコピー
3. n8nの認証情報を更新
4. すべてのDiscordノードで認証情報を再選択

---

## 📝 チェックリスト

設定が完了したら、以下をチェックしてください:

### Discord Bot設定
- [ ] Discord Developer PortalでBot作成済み
- [ ] Bot Tokenを安全に保存済み
- [ ] Bot権限（Send Messages等）を有効化済み
- [ ] Privileged Gateway Intentsを有効化済み
- [ ] BotをDiscordサーバーに招待済み
- [ ] 管理者チャンネルIDを取得済み

### n8n設定
- [ ] Discord認証情報「Discord Bot Token」を作成済み
- [ ] 認証情報のテスト成功
- [ ] すべてのDiscordノードで認証情報を選択済み
- [ ] Error Workflowの「Discord管理者通知」ノードで`YOUR_ADMIN_CHANNEL_ID`を実際のIDに置き換え済み

### テスト
- [ ] メインワークフローの「Discordエラー返信」ノードをテスト実行
- [ ] メインワークフローの「Discord成功返信」ノードをテスト実行
- [ ] メインワークフローの「Discord重複返信」ノードをテスト実行
- [ ] Error Workflowの「Discord管理者通知」ノードをテスト実行
- [ ] Error Workflowの「Discordユーザーエラー通知」ノードをテスト実行

---

## 🎯 次のステップ

Discord設定が完了したら:

1. **Webhook設定**: Discord BotからのWebhook URLを設定
2. **Google Calendar設定**: Google Calendar APIの認証
3. **Gmail設定**: Gmail APIの認証（通知メール用）
4. **テスト実行**: エンドツーエンドテストを実行

詳細は「step9_implementation_guide.md」を参照してください。

---

## 📚 参考リンク

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Bot作成ガイド（日本語）](https://discordpy.readthedocs.io/ja/latest/discord.html)
- [n8n Discord Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.discord/)

---

**最終更新**: 2025-11-07
**バージョン**: 1.0.0
