# Step 1: 業務理解フェーズ - 業務要件サマリー

## 業務要件サマリー

### 業務名
Discord Bot経由のGoogleカレンダー予定管理自動化システム

### 目的
Discord上で自然言語で予定を入力するだけで、Googleカレンダーの重複チェック、予定登録、参加者への通知メールまでを完全自動化する

### トリガー
- **種類**: Webhook（POST）
- **トリガー元**: Discord Bot（Railway上のPythonアプリ）
- **具体的条件**: DiscordにメッセージがポストされたらPythonアプリがn8n WebhookにPOSTリクエストを送信
- **頻度**: 1日10回以上（最大制限なし）
- **実行タイミング**: リアルタイム（メッセージ受信即座）

### データソース

#### 1. Discord Bot（Pythonアプリ経由）
- **取得データ**: 
  - ユーザーID
  - チャンネルID
  - メッセージ内容（自然言語）
  - タイムスタンプ
- **取得方法**: WebhookのPOSTリクエストボディから取得
- **データ形式**: JSON

#### 2. Google Calendar API
- **取得データ**: 
  - ユーザーの既存予定リスト
  - 予定の開始時刻・終了時刻
  - 予定の件名・説明
- **取得方法**: Google Calendar APIのevents.listエンドポイント
- **認証**: OAuth2.0
- **データ形式**: JSON（Google Calendar API形式）

#### 3. OpenRouter API（3つのLLM）
- **Grok 2**: Discord自然言語メッセージから構造化データ抽出
- **Gemini 2.0 Flash**: カレンダー重複分析・代替候補生成
- **Claude 3.5 Sonnet**: 通知メール文章生成
- **取得方法**: HTTP Request (POST) to OpenRouter API
- **認証**: API Key (Bearer Token)

### 主要処理

#### フェーズ1: 予定抽出（AI Agent 1 - Grok）
1. Discordメッセージ（自然言語）を受信
2. OpenRouter経由でGrok 2に送信
3. 以下を抽出:
   - 予定のタイトル
   - 日時（ISO 8601形式）
   - 所要時間（分）
   - 参加者のメールアドレスリスト
   - 説明

#### フェーズ2: 重複チェック
1. Google Calendar APIで指定日時周辺の既存予定を取得
2. 抽出した日時と既存予定の時間帯を比較
3. 重複判定（開始時刻～終了時刻の重なりをチェック）

#### フェーズ3-A: 重複なしの場合
1. Google Calendar APIで予定を登録
2. OpenRouter経由でClaude 3.5 Sonnetに通知メール文章生成を依頼
3. Gmail APIで参加者全員にメール送信
4. Discord Botに「予定登録完了」メッセージを送信

#### フェーズ3-B: 重複ありの場合
1. OpenRouter経由でGemini 2.0 Flashに代替候補生成を依頼
   - 今日と明日の2日分から5つの候補を提案
   - 各候補の理由を添える
2. Discord Botに「重複あり + 候補5つ」を返信
3. ユーザーからの選択を待つ（次のDiscordメッセージ）
4. 選択された候補で予定登録（フェーズ3-Aと同じ流れ）

#### フェーズ4: エラーハンドリング
- AI抽出失敗 → Discordに「予定情報を認識できませんでした」
- Calendar API失敗 → Discordに「カレンダー確認エラー」
- Gmail送信失敗 → Discordに「メール送信失敗（予定は登録済み）」

### 出力先

#### 1. Discord Bot（返信）
- **出力データ**: 
  - 成功: 「予定を登録しました: [タイトル] [日時]」
  - 重複: 「重複があります。以下の候補から選択してください: 1. [候補1] 2. [候補2]...」
  - エラー: 「エラーが発生しました: [エラー内容]」
- **送信方法**: Discord Webhook（PythonアプリにコールバックするエンドポイントをPython側で用意）または、n8nから直接Discord APIに送信
- **データ形式**: JSON（Discord Embed形式推奨）

#### 2. Google Calendar
- **出力データ**: 新規予定イベント
- **送信方法**: Google Calendar API events.insertエンドポイント
- **データ形式**: JSON（Google Calendar Event形式）

#### 3. Gmail
- **出力データ**: 通知メール
- **宛先**: 参加者のメールアドレスリスト
- **件名**: 「【予定通知】[タイトル]」
- **本文**: Claude 3.5 Sonnetが生成した丁寧な文章（HTML形式）
- **送信方法**: Gmail API messages.sendエンドポイント
- **データ形式**: RFC 2822形式（base64エンコード）

### データ規模
- **実行頻度**: 1日10回以上（最大制限なし）
- **1回あたりのデータ量**: 
  - Discord入力: 数百文字（予定の自然言語説明）
  - Calendar API: 10-50イベント（1日分の予定）
  - メール送信: 1-10通（参加者数に依存）
- **同時処理**: 想定しない（1ユーザーの逐次実行）
- **API制限対策**: 
  - OpenRouter: リクエスト制限に注意（トークン使用量）
  - Google Calendar API: 1秒あたり10リクエストまで（十分）
  - Gmail API: 1日あたり2000通まで（十分）

### 制約

#### セキュリティ制約
- Discord Bot Token、OpenRouter API Key、Google OAuth2認証情報を安全に管理
- 環境変数で認証情報を管理（ハードコード禁止）
- Railway環境変数に保存

#### 性能制約
- OpenRouter APIのレスポンス時間: 5-15秒（LLM推論時間）
- ユーザー体験: Discord返信まで20秒以内を目標
- タイムアウト設定: 各HTTP Request 30秒

#### 技術制約
- Railway環境でn8nとPythonアプリを稼働
- n8nはOpenRouter直接対応していないため、HTTP Requestノードで実装
- Discord Bot（Python）とn8nの連携はWebhook経由

#### ビジネス制約
- コスト: OpenRouterの無料枠 + 低コストモデル（Gemini 2.0 Flash: free）
- 可用性: Railway無料プランの制限（550時間/月）に注意
- スケーラビリティ: 現状は1ユーザー想定、将来的に複数ユーザー対応の可能性

#### データ制約
- タイムゾーン: Asia/Tokyo（日本時間）で統一
- 対応する予定: 今日と明日の2日分のみ（候補提案時）
- 言語: 日本語（Discordメッセージ、メール本文）

#### エラーハンドリング制約
- すべてのエラーをDiscordに返信（ユーザーへのフィードバック必須）
- Error Workflowで管理者に通知（Discord Webhook推奨）
- エラーログの保存（n8n実行履歴に依存）

---

## 実装アーキテクチャサマリー

```
┌─────────────────────┐
│   Discord User      │
│   (自然言語入力)    │
└──────────┬──────────┘
           │ メッセージ
           ▼
┌─────────────────────┐
│  Discord Bot        │
│  (Python/Railway)   │
│  - メッセージ受信   │
│  - Webhook POST     │
└──────────┬──────────┘
           │ HTTP POST
           ▼
┌─────────────────────────────────────────────────────────┐
│              n8n Workflow (Railway)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [1] Webhook Trigger                                     │
│       ↓                                                  │
│  [2] AI予定抽出 (HTTP → OpenRouter → Grok 2)            │
│       ↓                                                  │
│  [3] Google Calendar 予定取得                            │
│       ↓                                                  │
│  [4] 重複チェック (IF Node)                              │
│       ├─ 重複なし → [5A] 予定登録                        │
│       │              ↓                                  │
│       │            [6A] メール生成 (HTTP → Claude 3.5)  │
│       │              ↓                                  │
│       │            [7A] Gmail送信                        │
│       │              ↓                                  │
│       │            [8A] Discord返信「登録完了」          │
│       │                                                  │
│       └─ 重複あり → [5B] 候補生成 (HTTP → Gemini 2.0)   │
│                      ↓                                  │
│                    [6B] Discord返信「候補5つ」          │
│                      ↓                                  │
│                    [7B] ユーザー選択待ち（次回実行）     │
│                      ↓                                  │
│                    [8B] 選択候補で予定登録（5A以降）     │
│                                                           │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  External Services  │
│  - Google Calendar  │
│  - Gmail API        │
│  - OpenRouter       │
└─────────────────────┘
```

---

## 重要な設計方針

### 1. AI処理の単一責務
- **AI Agent 1（Grok）**: 予定抽出のみ
- **AI Agent 2（Gemini）**: カレンダー分析・候補提案のみ
- **AI Agent 3（Claude）**: メール文章生成のみ

### 2. Discord Bot完結
- Chat Triggerは使用しない
- すべてのやり取りはDiscord上で完結
- PythonアプリはDiscord ↔ n8nの橋渡し役

### 3. ステートレス設計の課題
- 「重複時の候補提案 → ユーザー選択 → 登録」の流れは2回のWebhook呼び出しが必要
- 解決策: 
  - 1回目のWebhook: 元の予定情報をn8nのStatic Dataまたは外部DBに一時保存
  - 2回目のWebhook: 保存された情報を取得して予定登録

### 4. エラーハンドリング
- すべてのエラーをDiscordに返信
- Error Workflowで管理者に通知
- 各フェーズごとにtry-catchパターン

---

✅ **ユーザー確認**: この業務理解で正しいですか？修正点があれば教えてください。

承認いただければ、**Step 2: 構造化フェーズ**に進みます！
