# CHANGELOG - v12 抽象化・一般化アップデート

## 📅 更新日時
2025-11-07

## 🎯 更新の目的
プロンプトv12の出力テンプレートに残っていた具体的な記述を完全に抽象化・一般化し、あらゆる業務に対応可能な汎用テンプレートに進化させる。

## ✨ 主な変更内容

### 1. ステップ7（メインワークフロー）出力テンプレートの抽象化

#### 変更前（具体的な記述）
```json
"_comment": "ワークフロー全体説明: {{WORKFLOW_PURPOSE}}",
"name": "Chat Trigger",
"notes": "処理内容: {{CHAT_TRIGGER_DETAILED_DESCRIPTION}}\n入力: ユーザーからのメッセージ\n出力: AI Agentへメッセージを送信"
```

#### 変更後（完全抽象化）
```json
"_comment": "{{WORKFLOW_OVERVIEW_COMMENT}}",
"name": "{{TRIGGER_NODE_NAME}}",
"notes": "{{TRIGGER_NODE_NOTES}}"
```

### 2. Sticky Noteコンテンツの抽象化

#### 変更前
```
"# 【グループ1: ユーザー対話開始】\n\n例: Chat Trigger"
```

#### 変更後
```
"# {{GROUP1_TITLE}}\n\n## このグループに含まれるノード\n📌 {{GROUP1_NODE_LIST}}"
```

### 3. ノードパラメータの完全抽象化

#### 変更前
```json
"parameters": {
  "public": true,
  "mode": "{{CHAT_MODE}}",
  "authentication": "{{AUTH_TYPE}}"
}
```

#### 変更後
```json
"parameters": {
  {{TRIGGER_NODE_PARAMETERS}}
}
```

### 4. 接続定義の抽象化

#### 変更前
```json
"connections": {
  "_comment": "接続定義: 各ノード間のデータフローを定義。main=通常のデータフロー、ai_*=AIサブノード接続",
  "Chat Trigger": {
    "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
  }
}
```

#### 変更後
```json
"connections": {
  "_comment": "{{CONNECTIONS_COMMENT}}",
  {{CONNECTION_DEFINITIONS}}
}
```

### 5. ガイドラインの抽象化

#### Sticky Note配置ルール
- 変更前: `グループ1〜5の計5つ`
- 変更後: `{{STICKY_NOTE_COUNT}}個`

#### ノード間隔
- 変更前: `最低300px、推奨400-500px`
- 変更後: `最低{{MIN_HORIZONTAL_SPACING}}px、推奨{{RECOMMENDED_HORIZONTAL_SPACING}}px`

#### 階層定義
- 変更前: 具体的なY座標範囲（`上部（-200〜200）: サブノード（Chat Model等）`）
- 変更後: `{{LAYER_DEFINITIONS}}`

### 6. ステップ8（Error Workflow）の完全抽象化

#### 新規作成ファイル
`error_workflow_template_abstracted.json`を作成し、Error Workflow用の完全抽象化テンプレートを提供。

#### 主な抽象化変数
```
{{ERROR_WORKFLOW_NAME}}
{{ERROR_WORKFLOW_OVERVIEW_COMMENT}}
{{ERROR_STICKY_NOTE_OVERVIEW_COMMENT}}
{{ERROR_GROUP1_TITLE}}
{{ERROR_GROUP1_PURPOSE}}
{{ERROR_GROUP1_BACKGROUND}}
{{ERROR_TRIGGER_NODE_NAME}}
{{ERROR_FORMAT_NODE_NAME}}
{{ERROR_NOTIFICATION_NODE_NAME}}
{{ERROR_CONNECTION_DEFINITIONS}}
{{ERROR_WORKFLOW_SETTINGS}}
```

## 📊 抽象化による効果

### メリット

1. **完全な汎用性**:
   - AI対話システム以外の業務（データ処理、API統合、バッチ処理等）にも対応可能
   - トリガータイプ、ノードタイプ、接続パターンを問わず適用可能

2. **メンテナンス性向上**:
   - 具体的な文言の変更が不要
   - テンプレート構造のみをメンテナンス

3. **可読性向上**:
   - 変数名が役割を明確に表現
   - テンプレート構造が理解しやすい

4. **拡張性**:
   - 新しいノードタイプ、接続タイプに容易に対応
   - カスタマイズポイントが明確

### 適用範囲

- ✅ メインワークフロー（ステップ7）
- ✅ Error Workflow（ステップ8）
- ✅ Sticky Noteコンテンツ
- ✅ ノードコメント（`_comment`、`notes`）
- ✅ 接続定義
- ✅ ワークフロー設定
- ✅ ガイドライン（配置ルール、間隔定義）

## 🔧 使用方法

### テンプレート変数の置き換え

プロンプト実行時に、以下の変数を業務要件に応じた具体的な値で置き換える：

#### ワークフロー全体
```
{{WORKFLOW_NAME}} → 実際のワークフロー名
{{WORKFLOW_OVERVIEW_COMMENT}} → ワークフローの概要説明
{{WORKFLOW_SETTINGS}} → executionOrder, timezone等の設定
```

#### ノード定義
```
{{TRIGGER_NODE_NAME}} → トリガーノードの名前
{{TRIGGER_NODE_TYPE}} → ノードタイプ（例: @n8n/n8n-nodes-langchain.chatTrigger）
{{TRIGGER_NODE_PARAMETERS}} → ノード固有のパラメータ定義
{{TRIGGER_NODE_NOTES}} → ノードの詳細説明
```

#### Sticky Note
```
{{GROUP1_TITLE}} → グループのタイトル
{{GROUP1_NODE_LIST}} → このグループに含まれるノードのリスト
{{GROUP1_PURPOSE}} → グループの目的
{{GROUP1_BACKGROUND}} → グループの背景
{{GROUP1_PROCESSING_STEPS}} → 処理の流れ
{{GROUP1_GOAL}} → 達成したいこと
```

#### 配置・間隔
```
{{MIN_HORIZONTAL_SPACING}} → 最小水平間隔（例: 300）
{{RECOMMENDED_HORIZONTAL_SPACING}} → 推奨水平間隔（例: 400-500）
{{STICKY_NOTE_COUNT}} → Sticky Noteの数（例: 5）
{{GROUP_COLOR_DEFINITIONS}} → グループごとの色定義
```

## 🔄 変更されていない要素

以下の要素は構造的に重要なため、抽象化せず維持：

1. **ノードタイプの基本構造**:
   - `n8n-nodes-base.stickyNote`
   - `n8n-nodes-base.errorTrigger`
   - `@n8n/n8n-nodes-langchain.*`

2. **接続タイプ**:
   - `main`
   - `ai_languageModel`
   - `ai_tool`
   - `ai_memory`

3. **JSON構造**:
   - `nodes`配列
   - `connections`オブジェクト
   - `settings`オブジェクト
   - `staticData`, `tags`, `pinData`, `versionId`

## 📝 今後の課題

### 残っている具体的記述（低優先度）

1. **n8nプラットフォーム固有の用語**:
   - "n8n AI Agent Node"
   - "Chat Model"
   - "Tools"
   - "Memory"

   → これらはn8nの公式用語のため、抽象化すると逆に分かりにくくなる可能性

2. **処理手順0-9の説明文**:
   - 各ステップの目的、背景、エージェント名等

   → これらはプロンプトの構造説明のため、抽象化の優先度は低い

3. **ガイドライン内の例示**:
   - "Chat Model等"
   - "Discord/Slack"

   → 理解を助ける例示のため、維持が望ましい

## ✅ 検証チェックリスト

- [x] ステップ7の出力テンプレート完全抽象化
- [x] ステップ8の出力テンプレート完全抽象化
- [x] Sticky Noteコンテンツの抽象化
- [x] ノードパラメータの抽象化
- [x] 接続定義の抽象化
- [x] ガイドライン（配置ルール）の抽象化
- [x] 新規ファイル作成（error_workflow_template_abstracted.json）
- [ ] プロンプト全体の整合性確認（ユーザー次第）
- [ ] テンプレート変数リスト作成（ユーザー次第）

## 🎓 学習ポイント

### テンプレート設計の原則

1. **抽象化レベルの適切性**:
   - 技術用語は適度に維持（n8n固有用語）
   - 業務固有の記述は完全抽象化（"ユーザー対話"→変数化）

2. **変数命名規則**:
   - 大文字スネークケース（`{{VARIABLE_NAME}}`）
   - 階層構造を反映（`{{GROUP1_PURPOSE}}`）
   - 役割が明確（`{{ERROR_TRIGGER_NODE_NAME}}`）

3. **テンプレートの再利用性**:
   - 汎用テンプレートと業務固有テンプレートの分離
   - 変数による柔軟なカスタマイズ

## 📚 参考情報

- 元ファイル: `プロンプト - n8nワークフロー自動設計v12(Sticky Noteにノード名を記述).md`
- 新規作成: `error_workflow_template_abstracted.json`
- 関連ドキュメント: `CHANGELOG_v12.md`
