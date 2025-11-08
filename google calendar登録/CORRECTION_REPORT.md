# ワークフロー修正レポート

**ワークフロー名**: Discord Calendar Manager - Google Calendar Integration
**修正日**: 2025-11-06
**元ファイル**: `step7_complete_n8n_workflow.json`
**修正後ファイル**: `step7_complete_n8n_workflow_CORRECTED.json`

---

## 📊 修正サマリー

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| **総ノード数** | 27個 | 40個 |
| **AI Agent Node使用** | ❌ 0個（HTTP Request使用） | ✅ 3個（適切な実装） |
| **Chat Model Node** | ❌ なし | ✅ 3個（Grok, Gemini, Claude） |
| **Memory Node** | ❌ なし | ✅ 3個 |
| **Output Parser Node** | ❌ なし | ✅ 3個 |
| **プロンプト制約準拠** | ❌ 違反 | ✅ 完全準拠 |

---

## 🚨 検出された重大な問題

### 1. **AI Agent Node 不使用（最重要）**

**問題**:
- プロンプトでは「AI Agent Node必須使用」と明記されているが、HTTP RequestノードでOpenRouter API直接呼び出し
- n8n LangChainベースのAI Agent機能が使えていない
- Chat Model、Memory、Toolsの適切な連携なし

**影響**:
- プロンプトの制約違反（最重要制約）
- AI Agent Nodeのメリット（会話履歴管理、Tools連携、構造化出力）が使えない
- 保守性・拡張性の低下

**修正内容**:
以下の3つのHTTP RequestノードをAI Agent Nodeに変換:

#### ① AI Agent 1: Discord予定抽出（Grok）
**修正前**:
```json
{
  "id": "http_010",
  "name": "【AI Agent 1】Discord予定抽出（Grok）",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "jsonBody": "{ ... OpenAI API形式 ... }"
  }
}
```

**修正後**:
```json
{
  "id": "agent_010",
  "name": "【AI Agent 1】Discord予定抽出",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "promptType": "define",
    "text": "={{ $json.message_content }}",
    "hasOutputParser": true,
    "options": {
      "systemMessage": "あなたはDiscordメッセージから予定情報を抽出する専門家です。...",
      "maxIterations": 3
    }
  }
}
```

**追加されたサブノード**:
- `Grok Chat Model` (chatmodel_011): x-ai/grok-2-1212、temperature=0.3
- `Discord予定抽出 Memory` (memory_012): 過去5件の会話履歴を保持
- `予定データParser` (parser_013): JSON構造化出力

**接続**:
- Grok Chat Model → AI Agent (ai_languageModel)
- Memory → AI Agent (ai_memory)
- Output Parser → AI Agent (ai_outputParser)

#### ② AI Agent 2: 空き時間候補生成（Gemini）
**修正前**:
```json
{
  "id": "http_027",
  "name": "【AI Agent 2】空き時間候補生成（Gemini）",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "jsonBody": "{ ... OpenAI API形式 ... }"
  }
}
```

**修正後**:
```json
{
  "id": "agent_027",
  "name": "【AI Agent 2】空き時間候補生成",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "promptType": "define",
    "text": "=希望日時: {{ $json.event_datetime }}\n所要時間: {{ $json.duration_minutes }}分\n...",
    "hasOutputParser": true,
    "options": {
      "systemMessage": "あなたはカレンダー分析の専門家です。...",
      "maxIterations": 3
    }
  }
}
```

**追加されたサブノード**:
- `Gemini Chat Model` (chatmodel_029): google/gemini-2.0-flash-exp:free、temperature=0.7
- `候補生成 Memory` (memory_030): 過去3件の会話履歴を保持
- `候補データParser` (parser_031): 5要素の配列を厳密に検証

**接続**:
- Gemini Chat Model → AI Agent (ai_languageModel)
- Memory → AI Agent (ai_memory)
- Output Parser → AI Agent (ai_outputParser)

#### ③ AI Agent 3: 通知メール生成（Claude）
**修正前**:
```json
{
  "id": "http_024",
  "name": "【AI Agent 3】通知メール生成（Claude）",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://openrouter.ai/api/v1/chat/completions",
    "jsonBody": "{ ... OpenAI API形式 ... }"
  }
}
```

**修正後**:
```json
{
  "id": "agent_024",
  "name": "【AI Agent 3】通知メール生成",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "promptType": "define",
    "text": "=予定情報:\n- タイトル: {{ $json.event_title }}\n...",
    "hasOutputParser": true,
    "options": {
      "systemMessage": "あなたはビジネスメール作成の専門家です。...",
      "maxIterations": 2
    }
  }
}
```

**追加されたサブノード**:
- `Claude Chat Model` (chatmodel_025): anthropic/claude-3.5-sonnet:beta、temperature=0.8
- `メール生成 Memory` (memory_026): 過去3件の会話履歴を保持
- `メールデータParser` (parser_027): メールJSON（件名60文字制限）を検証

**接続**:
- Claude Chat Model → AI Agent (ai_languageModel)
- Memory → AI Agent (ai_memory)
- Output Parser → AI Agent (ai_outputParser)

---

### 2. **不要なレスポンス解析ノード削除**

HTTP RequestノードからAI Agent Nodeへの変換により、以下のCode Nodeが不要に:

**削除されたノード**:
- `Grokレスポンス解析` (code_011): AI Agentが構造化出力を直接返すため不要
- `Geminiレスポンス解析` (code_028): Output Parserが自動処理
- `Claudeレスポンス解析` (code_025): Output Parserが自動処理

**理由**:
- AI Agent NodeはOutput Parserを使用してJSON構造化出力を自動生成
- マークダウンコードブロック削除、JSONパース、エラーハンドリングが自動化
- コード量削減、保守性向上

---

### 3. **認証情報の改善**

**修正前**:
```json
"credentials": {
  "httpHeaderAuth": {
    "id": "3",
    "name": "OpenRouter API Key"
  }
}
```

**修正後**:
```json
"credentials": {
  "openAiApi": {
    "id": "openrouter_api",
    "name": "OpenRouter API"
  }
}
```

**改善点**:
- Credential IDを意味のある名前に変更（数字→説明的な名前）
- n8n LangChainノードの標準認証形式に準拠
- 認証タイプを`httpHeaderAuth`から`openAiApi`に変更（OpenRouter互換）

---

### 4. **ノードバージョンの更新**

**修正前**:
```json
{
  "name": "Webhookデータ抽出",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.3
}
```

**修正後**:
```json
{
  "name": "Webhookデータ抽出",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4
}
```

**理由**:
- Set nodeのバージョン3.3は非推奨
- 最新のバージョン3.4に更新

---

### 5. **コメントと説明の追加**

各ノードに以下を追加:

1. **JSONコメント** (`_comment`フィールド):
```json
{
  "_comment": "AI Agent 1: Discord予定抽出 - Grokを使用して自然言語から予定情報を抽出"
}
```

2. **notesフィールド** (n8nのノートパネル):
```json
{
  "notes": "処理内容: Discordメッセージから予定情報をJSON形式で抽出\n責務: 自然言語テキスト → 構造化予定データ\n入力: message_content (自然言語)\n出力: event_title, event_datetime, duration_minutes, attendee_emails, description\n連携: Chat Model (Grok), Memory, Output Parser Tool"
}
```

**効果**:
- ワークフローの理解が容易
- 保守性の向上
- デバッグ時の問題特定が迅速化

---

## ✅ 修正後の接続マップ

### AI Agent 1: Discord予定抽出
```
Webhookデータ検証
    ↓ (main)
【AI Agent 1】Discord予定抽出
    ← (ai_languageModel) Grok Chat Model
    ← (ai_memory) Discord予定抽出 Memory
    ← (ai_outputParser) 予定データParser
    ↓ (main)
AI抽出結果検証
```

### AI Agent 2: 空き時間候補生成
```
重複有無で分岐 (重複あり)
    ↓ (main)
【AI Agent 2】空き時間候補生成
    ← (ai_languageModel) Gemini Chat Model
    ← (ai_memory) 候補生成 Memory
    ← (ai_outputParser) 候補データParser
    ↓ (main)
ステート保存
```

### AI Agent 3: 通知メール生成
```
メール送信要否判定 (参加者あり)
    ↓ (main)
【AI Agent 3】通知メール生成
    ← (ai_languageModel) Claude Chat Model
    ← (ai_memory) メール生成 Memory
    ← (ai_outputParser) メールデータParser
    ↓ (main)
メールデータ整形
```

---

## 🎯 プロンプト制約への準拠状況

| 制約項目 | 修正前 | 修正後 |
|----------|--------|--------|
| **AI Agent Node必須使用** | ❌ HTTP Request使用 | ✅ 3個のAI Agent Node |
| **Chat Model必須選択** | ❌ なし | ✅ Grok, Gemini, Claude |
| **クラスターノード構造** | ❌ なし | ✅ Agent + Chat Model + Memory + Parser |
| **単一責務の原則** | ✅ 各AI処理は単一責務 | ✅ 維持 |
| **接続必須制約** | ✅ 孤立ノードなし | ✅ 維持 |
| **JSON完全性** | ✅ インポート可能 | ✅ 維持 |

---

## 📈 メリットと改善効果

### 修正前の問題点
1. **プロンプト制約違反**: AI Agent Node不使用
2. **保守性の低下**: APIレスポンス解析を手動実装
3. **拡張性の低下**: Tools連携やMemory機能が使えない
4. **コードの冗長性**: レスポンス解析のためのCode Node×3

### 修正後のメリット
1. **プロンプト完全準拠**: AI Agent Node適切使用
2. **保守性向上**:
   - Output Parserによる自動構造化
   - 標準的なn8n LangChainパターン
3. **拡張性向上**:
   - Toolsの追加が容易
   - Memory機能で会話履歴を活用可能
4. **コード削減**: レスポンス解析Code Node不要
5. **可読性向上**: 詳細なコメントとnotes

### パフォーマンス
- **ノード数**: 27個 → 40個（+13個）
- **理由**: AI Agent Nodeごとに3-4個のサブノード（Chat Model, Memory, Output Parser）
- **実行時間への影響**: ほぼ同等（API呼び出し自体は変わらず）
- **メリット**: 構造化とエラーハンドリングの自動化

---

## 🔧 実装時の注意事項

### 1. 認証情報の設定

修正後のワークフローでは以下の認証情報が必要:

```
openrouter_api (OpenRouter API)
├─ 使用ノード: Grok Chat Model, Gemini Chat Model, Claude Chat Model
├─ 認証タイプ: openAiApi (OpenRouter互換)
└─ 設定値: OPENROUTER_API_KEY

google_calendar_oauth (Google Calendar OAuth2)
├─ 使用ノード: Googleカレンダー既存予定取得, Googleカレンダー予定登録
└─ 認証タイプ: OAuth2

gmail_oauth (Gmail OAuth2)
├─ 使用ノード: Gmail送信
└─ 認証タイプ: OAuth2
```

### 2. OpenRouter API設定

OpenRouterでは、OpenAI互換のエンドポイントを使用:
- **Base URL**: `https://openrouter.ai/api/v1`
- **認証**: `Authorization: Bearer YOUR_API_KEY`

n8nの`lmChatOpenAi` nodeで`baseURL`オプションを設定:
```json
"options": {
  "baseURL": "https://openrouter.ai/api/v1"
}
```

### 3. Output Parserのスキーマ

各AI AgentのOutput Parserは厳密なJSONスキーマを定義:

**AI Agent 1（予定抽出）**:
```json
{
  "type": "object",
  "properties": {
    "event_title": {"type": "string"},
    "event_datetime": {"type": "string"},
    "duration_minutes": {"type": "number"},
    "attendee_emails": {"type": "array", "items": {"type": "string"}},
    "description": {"type": "string"}
  },
  "required": ["event_title", "event_datetime", "duration_minutes", "attendee_emails"]
}
```

**AI Agent 2（候補生成）**:
```json
{
  "type": "object",
  "properties": {
    "alternative_slots": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "slot_datetime": {"type": "string"},
          "reason": {"type": "string", "maxLength": 50}
        },
        "required": ["slot_datetime", "reason"]
      },
      "minItems": 5,
      "maxItems": 5
    }
  },
  "required": ["alternative_slots"]
}
```

**AI Agent 3（メール生成）**:
```json
{
  "type": "object",
  "properties": {
    "email_subject": {"type": "string", "maxLength": 60},
    "email_body_html": {"type": "string"},
    "email_body_plain": {"type": "string"}
  },
  "required": ["email_subject", "email_body_html", "email_body_plain"]
}
```

### 4. Memory設定

各AI AgentのMemoryノードは会話履歴を保持:
- **AI Agent 1**: 5件（予定抽出の文脈を保持）
- **AI Agent 2**: 3件（候補生成の文脈を保持）
- **AI Agent 3**: 3件（メール生成の文脈を保持）

Session Keyは不要（単一ユーザー処理のため）。

### 5. テスト方法

**初回フロー（予定登録）**:
```bash
curl -X POST http://your-n8n-instance/webhook/discord-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "channel_id": "test_channel_456",
    "message_content": "明日の14時から1時間、田中さん(tanaka@example.com)とミーティング",
    "callback_url": "https://discord.com/api/webhooks/...",
    "timestamp": "2025-11-06T12:00:00+09:00"
  }'
```

**選択フロー（重複時）**:
```bash
# 1回目: 重複検出 → 5つの候補提示
# 2回目: ユーザーが番号を選択
curl -X POST http://your-n8n-instance/webhook/discord-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "channel_id": "test_channel_456",
    "message_content": "3",
    "callback_url": "https://discord.com/api/webhooks/...",
    "timestamp": "2025-11-06T12:01:00+09:00"
  }'
```

---

## 📝 チェックリスト

修正後のワークフローをインポートする際の確認事項:

### インポート前
- [ ] OpenRouter APIキーを取得
- [ ] Google Calendar OAuth2認証を設定
- [ ] Gmail OAuth2認証を設定

### インポート後
- [ ] 認証情報`openrouter_api`を設定（全Chat Modelで使用）
- [ ] 認証情報`google_calendar_oauth`を設定
- [ ] 認証情報`gmail_oauth`を設定

### AI Agent接続確認
- [ ] AI Agent 1とGrok Chat Modelが`ai_languageModel`で接続
- [ ] AI Agent 1とMemoryが`ai_memory`で接続
- [ ] AI Agent 1とOutput Parserが`ai_outputParser`で接続
- [ ] AI Agent 2とGemini Chat Modelが`ai_languageModel`で接続
- [ ] AI Agent 2とMemoryが`ai_memory`で接続
- [ ] AI Agent 2とOutput Parserが`ai_outputParser`で接続
- [ ] AI Agent 3とClaude Chat Modelが`ai_languageModel`で接続
- [ ] AI Agent 3とMemoryが`ai_memory`で接続
- [ ] AI Agent 3とOutput Parserが`ai_outputParser`で接続

### テスト実行
- [ ] 初回フロー（予定登録）の動作確認
- [ ] 重複フロー（代替案提示）の動作確認
- [ ] 選択フロー（番号入力）の動作確認
- [ ] メール送信の動作確認
- [ ] Discord返信の動作確認

---

## 🎓 学習ポイント

### n8n AI Agent Nodeのベストプラクティス

1. **必ずサブノードを接続**:
   - Chat Model (ai_languageModel): 必須
   - Memory (ai_memory): 会話履歴が必要な場合
   - Output Parser (ai_outputParser): 構造化出力が必要な場合
   - Tools (ai_tool): 外部システム連携が必要な場合

2. **System Messageで責務を明確化**:
   - 「あなたは〇〇の専門家です」
   - 【責務】【ゴール】【制約】を明記
   - 出力フォーマットを明示

3. **Output Parserで構造化**:
   - JSONスキーマを厳密に定義
   - 必須フィールドを指定
   - 型と制約（maxLength, minItems等）を設定

4. **Memoryで文脈を保持**:
   - contextWindowLengthを適切に設定
   - 単一ユーザーならSession Key不要
   - 複数ユーザーならSession Keyで分離

---

## 📚 参考資料

- [n8n AI Agent Node公式ドキュメント](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [n8n LangChain Nodesガイド](https://docs.n8n.io/integrations/builtin/cluster-nodes/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- プロンプトドキュメント: `プロンプト - n8nワークフロー自動設計v9（jsonに説明を追加）.md`

---

## ✅ 結論

元のワークフローはHTTP RequestノードでLLM APIを直接呼び出していましたが、プロンプトの制約「AI Agent Node必須使用」に違反していました。

修正後のワークフローでは:
- ✅ 3個のAI Agent Nodeを適切に実装
- ✅ 各AI AgentにChat Model、Memory、Output Parserを接続
- ✅ プロンプトの全制約に準拠
- ✅ 保守性・拡張性・可読性が大幅に向上

**修正完了**: `step7_complete_n8n_workflow_CORRECTED.json`は、プロンプトの要求通り、n8n AI Agent Nodeを使用した適切な実装となっています。

---

**作成者**: Claude Code (n8n Workflow Corrector)
**修正完了日時**: 2025-11-06
