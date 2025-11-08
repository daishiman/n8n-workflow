# Sticky Note ノード名リスト追加ガイド

## 目的
各Sticky Noteに「このグループに含まれるノード」セクションを追加することで、Sticky Noteとノードの対応関係を明確にします。

## 背景
現在のSticky Noteには目的や処理の流れが記載されていますが、「このグループはどのノードのことを言っているのか」が不明確でした。ノード名リストを追加することで、視覚的に対応関係が即座に分かるようになります。

## 修正が必要なファイル

1. **step7_complete_n8n_workflow_NATIVE_NODES_v2.json**
2. **step8_error_workflow_CORRECTED_v2.json**

## 修正内容

### step7（メインワークフロー）の各Sticky Note

#### Sticky Note 1: ワークフロー全体説明
**追加する内容**:
```markdown
## このワークフローに含まれる全ノード
📌 **全ノード一覧**:
  - Discord Bot Webhook (Webhook)
  - Webhookデータ抽出 (Set)
  - ステート確認 (Code)
  - フロー振り分け (IF)
  - Webhookデータ検証 (IF)
  - 【AI Agent 1】Discord予定抽出 (AI Agent)
  - Grok Chat Model (Chat Model)
  - Discord予定抽出 Memory (Memory)
  - 予定データParser (Output Parser)
  - AI抽出結果検証 (Code)
  - 検証結果チェック (IF)
  - タイムスタンプ計算 (Code)
  - Googleカレンダー既存予定取得 (Google Calendar)
  - カレンダーレスポンス整形 (Code)
  - 予定重複判定 (Code)
  - 重複有無で分岐 (IF)
  - Googleカレンダー予定登録 (Google Calendar)
  - メール送信要否判定 (IF)
  - 【AI Agent 3】通知メール生成 (AI Agent)
  - Claude Chat Model (Chat Model)
  - メール生成 Memory (Memory)
  - メールデータParser (Output Parser)
  - Gmail送信 (Gmail)
  - Discord成功返信 (Discord)
  - 【AI Agent 2】空き時間候補生成 (AI Agent)
  - Gemini Chat Model (Chat Model)
  - 候補生成 Memory (Memory)
  - 候補データParser (Output Parser)
  - ステート保存 (Code)
  - Discord重複返信 (Discord)
  - 保存済みステート読み込み (Code)
  - ユーザー選択番号解析 (Code)
  - 選択番号検証 (IF)
  - ステートクリア (Code)
  - Discordエラー返信 (Discord)
  - ワークフロー終了 (NoOp)
```

#### Sticky Note 2: グループ1 - Discord入力受付
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **Discord Bot Webhook** (Webhook)
📌 **Webhookデータ抽出** (Set)
📌 **ステート確認** (Code)
📌 **フロー振り分け** (IF)
📌 **Webhookデータ検証** (IF)
```

#### Sticky Note 3: グループ2 - AI予定抽出
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **メインノード**:
  - 【AI Agent 1】Discord予定抽出 (AI Agent)

📌 **サブノード**:
  - Grok Chat Model (Chat Model)
  - Discord予定抽出 Memory (Memory)
  - 予定データParser (Output Parser)

📌 **検証ノード**:
  - AI抽出結果検証 (Code)
  - 検証結果チェック (IF)
```

#### Sticky Note 4: グループ3 - カレンダー処理
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **タイムスタンプ計算** (Code)
📌 **Googleカレンダー既存予定取得** (Google Calendar)
📌 **カレンダーレスポンス整形** (Code)
📌 **予定重複判定** (Code)
📌 **重複有無で分岐** (IF)
```

#### Sticky Note 5: グループ4 - 予定登録・通知
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **Googleカレンダー予定登録** (Google Calendar)
📌 **メール送信要否判定** (IF)
📌 **【AI Agent 3】通知メール生成** (AI Agent)
  - Claude Chat Model (Chat Model)
  - メール生成 Memory (Memory)
  - メールデータParser (Output Parser)
📌 **Gmail送信** (Gmail)
📌 **Discord成功返信** (Discord)
```

#### Sticky Note 6: グループ5 - AI代替案生成
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **【AI Agent 2】空き時間候補生成** (AI Agent)
  - Gemini Chat Model (Chat Model)
  - 候補生成 Memory (Memory)
  - 候補データParser (Output Parser)
📌 **ステート保存** (Code)
📌 **Discord重複返信** (Discord)
```

#### Sticky Note 7: グループ6 - 選択フロー処理
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **保存済みステート読み込み** (Code)
📌 **ユーザー選択番号解析** (Code)
📌 **選択番号検証** (IF)
📌 **ステートクリア** (Code)
```

#### Sticky Note 8: グループ7 - エラー処理
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **Discordエラー返信** (Discord)
📌 **ワークフロー終了** (NoOp)
```

### step8（Error Workflow）の各Sticky Note

#### Sticky Note 1: エラーワークフロー全体説明
**追加する内容**:
```markdown
## このワークフローに含まれる全ノード
📌 **全ノード一覧**:
  - Error Trigger (Error Trigger)
  - エラー情報整形 (Code)
  - 重要度判定 (IF)
  - Discord管理者通知 (HTTP Request)
  - ユーザー通知要否判定 (IF)
  - Discordユーザーエラー通知 (HTTP Request)
  - エラーログ記録 (Write File)
  - Slack通知（オプション）(HTTP Request)
  - エラー統計更新（オプション）(Code)
  - Error Workflow完了 (NoOp)
```

#### Sticky Note 2: グループ1 - エラー検知
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **Error Trigger** (Error Trigger)
```

#### Sticky Note 3: グループ2 - エラー情報整形
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **エラー情報整形** (Code)
```

#### Sticky Note 4: グループ3 - 重要度判定・通知送信
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **重要度判定** (IF)
📌 **Discord管理者通知** (HTTP Request)
📌 **ユーザー通知要否判定** (IF)
📌 **Discordユーザーエラー通知** (HTTP Request)
📌 **Slack通知（オプション）** (HTTP Request)
```

#### Sticky Note 5: グループ4 - ログ記録・統計
**追加する内容**:
```markdown
## このグループに含まれるノード
📌 **エラーログ記録** (Write File)
📌 **エラー統計更新（オプション）** (Code)
📌 **Error Workflow完了** (NoOp)
```

## 修正方法

### 手動修正の場合
1. 各JSONファイルをテキストエディタで開く
2. 各Sticky Noteの`content`フィールドを見つける
3. `# 【グループX:...】`の直下に「## このグループに含まれるノード」セクションを追加
4. 上記のノード名リストをコピー&ペーストして`\n`（改行）で連結

### 自動修正の場合
プロンプト「プロンプト - n8nワークフロー自動設計v12(Sticky Noteにノード名を記述).md」を使用して、新しいワークフローを生成すると、自動的にノード名リストが含まれたSticky Noteが生成されます。

## ノード名リストの記載ルール

1. **📌マークを使用**: 各ノード名の前に📌を付けて視覚的に強調
2. **ノードタイプを括弧で明記**: 例: "Discord Bot Webhook (Webhook)"
3. **AI Agentグループの場合**:
   - メインノード（AI Agent）とサブノード（Chat Model, Memory, Output Parser）を分けて記載
   - インデント（2スペース）でサブノードを表示
4. **オプションノードの明記**: ノード名に「（オプション）」を含める
5. **リスト形式**: 箇条書き（`-`または改行）で見やすく

## 効果

### 改善前の問題
- ❌ Sticky Noteを見ても、どのノードがこのグループに属するか分からない
- ❌ ノードを1つ1つクリックして確認する必要がある
- ❌ グループの範囲が不明確

### 改善後の利点
- ✅ Sticky Noteを読むだけで、関連ノードが即座に分かる
- ✅ グループの範囲が明確になる
- ✅ 初心者でも「このノードはこのグループに属する」と理解できる
- ✅ ワークフロー全体の構造を素早く把握できる

## テンプレート変数

プロンプトv12では、以下のテンプレート変数を使用してノード名リストを動的に生成します:

### メインワークフロー
- `{{GROUP1_NODE_LIST}}`: グループ1のノード名リスト
- `{{AI_AGENT_NODE_NAME}}`: AI Agentのノード名
- `{{CHAT_MODEL_NODE_NAME}}`: Chat Modelのノード名
- `{{MEMORY_NODE_NAME}}`: Memoryのノード名
- `{{TOOLS_NODE_NAMES}}`: Toolsのノード名リスト

### Error Workflow
- `{{ERROR_TRIGGER_NODE_NAME}}`: Error Triggerのノード名
- `{{ERROR_FORMAT_NODE_NAME}}`: エラー整形ノードの名前
- `{{ERROR_NOTIFICATION_NODE_NAMES}}`: 通知ノードのリスト
- `{{ERROR_LOG_NODE_NAME}}`: ログ記録ノードの名前

## 次のステップ

### プロンプトv12の使用推奨
今後、新しいワークフローを生成する際は、**プロンプト - n8nワークフロー自動設計v12(Sticky Noteにノード名を記述).md** を使用してください。このプロンプトを使用すると、自動的にノード名リストが含まれたSticky Noteが生成されます。

### 既存ファイルの更新（オプション）
もし、step7_v2.json と step8_v2.json にもノード名リストを追加したい場合は、上記の「修正内容」セクションを参考に、各Sticky Noteのcontentフィールドに「## このグループに含まれるノード」セクションを追加してください。

## まとめ

- ✅ プロンプトv12にノード名リスト記載のルールを追加済み
- ✅ 処理手順7と8にノード名リスト追加の指示を明記
- ✅ ガイドラインセクションにノード名リスト構造を追加
- ✅ 制約セクションにノード名リスト必須を追加

**今後生成されるワークフローには、自動的にノード名リストが含まれます。**
