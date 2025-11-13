# Step170: Sticky Note完成

## 目的

ワークフロー内のすべてのSticky Noteに詳細な説明、ノード一覧、目的、背景、処理の流れを追加し、視覚的ドキュメンテーションを完成させます。v4.0で定義された2つのテンプレート（パターン1: 全体フロー用、パターン2: グループごと）を使用して、統一された形式でSticky Noteを生成します。

**最終成果物:**
- パターン1（全体フロー用）Sticky Note 1個
- パターン2（グループごと）Sticky Note 複数個（グループ数に応じて）
- Sticky Note設計ドキュメント

---

## 背景

### Sticky Noteの重要性

1. **視覚的ドキュメンテーション**: n8nキャンバス上で直接ドキュメントを表示
2. **即時理解**: ワークフローを開いた瞬間に全体構造と各グループの役割が理解できる
3. **保守性向上**: 修正時に影響範囲と依存関係がすぐに分かる
4. **デバッグ効率化**: エラー発生時に該当グループの責務と期待動作が明確
5. **チーム協業**: 新しいメンバーでもワークフローの意図を理解できる

### v4.0におけるSticky Noteの位置づけ

```
Phase 3: 統合・検証・出力 (Step150-190)
├─ Step150: グループ間接続統合 ✅
├─ Step160: ワークフロー全体検証 ✅
├─ Step170: Sticky Note完成 ← 現在のステップ
├─ Step180: 配置最適化
└─ Step190: 最終出力
```

### v4.0のSticky Noteテンプレート

v4.0では、以下の2つのSticky Noteテンプレートを使用:

1. **パターン1: 全体フロー用Sticky Note**（ワークフロー冒頭に配置、1個のみ）
2. **パターン2: グループごとのSticky Note**（各処理グループに配置、グループ数分）

---

## 言葉の定義

### Sticky Noteテンプレート種類とブロック構造

#### 共通ルール
- Sticky Noteのcolorは必ず明示設定し、白（color未設定）は禁止
- ノード/グループはMarkdownブロックでまとめ、どのノードがどのノートに含まれているか視覚的に判断できるようにする
- `height` / `width` は全文が折り返し表示される十分な値を設定し、見切れた場合はサイズを広げるかノートを追加

#### パターン1: 全体フロー用Sticky Note

**目的**: ワークフロー全体の構造・流れ・ノード関係を 1 枚で理解できるようにする  
**配置**: [100, 50]（キャンバス左上）  
**サイズ**: 最低 700px × 650px（必要に応じて拡張）  
**色**: 7（薄ピンク固定）

**必須要素**:
- ワークフロー名 / ノード総数 / グループ総数
- 全ノード一覧（名前 + タイプ）
- グループブロック（ID・主要ノード・ハンドオフ・担当）
- 目的 / 背景 / 従来の課題 / 解決策
- 全体の流れ（1-5ステップ）
- ノードブロック（ノード単位の役割・入出力・所属グループ）
- フロー復元チェックリスト
- 達成したいこと

**Markdownテンプレート**:
```markdown
# 【{{WORKFLOW_NAME}} - 全体フロー】

## このワークフローに含まれる全ノード（{{TOTAL_NODE_COUNT}}個）
📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})
📌 **{{NODE_2_NAME}}** ({{NODE_2_TYPE}})
...

## グループブロック（再現サマリ）
> ### {{GROUP_ID}} {{GROUP_NAME}}
> - ノード: {{GROUP_NODE_SUMMARY}}
> - ハンドオフ: {{GROUP_HANDOFF}}
> - 主担当: {{GROUP_OWNER}}

## このワークフローの目的
{{WORKFLOW_PURPOSE}}

## 背景
{{WORKFLOW_BACKGROUND}}

従来の課題:
- {{PROBLEM_1}}
- {{PROBLEM_2}}
- {{PROBLEM_3}}

このワークフローにより、{{SOLUTION_SUMMARY}}

## 全体の流れ
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. {{STEP_4}}
5. {{STEP_5}}

## ノードブロック（視覚リンク）
> #### {{NODE_N_NAME}} ({{NODE_N_TYPE}})
> - 所属グループ: {{NODE_N_GROUP}}
> - 役割: {{NODE_N_ROLE}}
> - 入力 / 出力: {{NODE_N_IO}}

## フロー復元チェックリスト
1. {{CHECK_1}}
2. {{CHECK_2}}
3. {{CHECK_3}}

## 達成したいこと
{{WORKFLOW_GOAL}}
```

**JSONテンプレート**:
```json
{
  "parameters": {
    "content": "# 【{{WORKFLOW_NAME}} - 全体フロー】\n\n## このワークフローに含まれる全ノード（{{TOTAL_NODE_COUNT}}個）\n📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})\n...\n\n## グループブロック（再現サマリ）\n> ### {{GROUP_ID}} {{GROUP_NAME}}\n> - ノード: {{GROUP_NODE_SUMMARY}}\n> - ハンドオフ: {{GROUP_HANDOFF}}\n> - 主担当: {{GROUP_OWNER}}\n\n## このワークフローの目的\n{{WORKFLOW_PURPOSE}}\n\n## 背景\n{{WORKFLOW_BACKGROUND}}\n\n従来の課題:\n- {{PROBLEM_1}}\n- {{PROBLEM_2}}\n\nこのワークフローにより、{{SOLUTION_SUMMARY}}\n\n## 全体の流れ\n1. {{STEP_1}}\n2. {{STEP_2}}\n...\n\n## ノードブロック（視覚リンク）\n> #### {{NODE_N_NAME}} ({{NODE_N_TYPE}})\n> - 所属グループ: {{NODE_N_GROUP}}\n> - 役割: {{NODE_N_ROLE}}\n> - 入力 / 出力: {{NODE_N_IO}}\n\n## フロー復元チェックリスト\n1. {{CHECK_1}}\n2. {{CHECK_2}}\n3. {{CHECK_3}}\n\n## 達成したいこと\n{{WORKFLOW_GOAL}}",
    "height": 650,
    "width": 700,
    "color": 7
  },
  "id": "sticky_overview_uuid",
  "name": "Sticky Note - ワークフロー全体フロー",
  "type": "n8n-nodes-base.stickyNote",
  "typeVersion": 1,
  "position": [100, 50]
}
```

#### パターン2: グループごとのSticky Note

**目的**: グループ単位で必要なノード・フロー・入出力情報を即時確認できるようにする
**配置**: 各グループの左上（Step180で決定）
**サイズ**: 520px × 420px（最低値 / ノード数に応じて拡張）
**色**: メインフロー=2/3/4/6（青、緑、紫、オレンジ）から選択、エラーフロー=5（薄赤）

**色分けルール拡張**（画像のような多色対応）:
- **全体フロー**: 色7（薄ピンク） - 固定
- **メインフローグループ**: 色2/3/4/6から選択
  - 色2（薄緑）: データ収集・入力グループ
  - 色3（薄青）: データ変換・処理グループ
  - 色4（薄紫）: AI処理・分析グループ
  - 色6（薄オレンジ）: 出力・通知グループ
- **エラーフローグループ**: 色5（薄赤） - 固定
- **色0/1（白/黄）**: 使用禁止（視認性が低い）

**色選択アルゴリズム**:
```javascript
function selectGroupColor(groupInfo) {
  // エラーグループは常に色5
  if (groupInfo.groupId.startsWith('E')) return 5;

  // グループの役割に応じて色を選択
  const roleColorMap = {
    'collection': 2,    // データ収集 → 薄緑
    'transform': 3,     // データ変換 → 薄青
    'ai_processing': 4, // AI処理 → 薄紫
    'output': 6         // 出力 → 薄オレンジ
  };

  return roleColorMap[groupInfo.role] || 6; // デフォルトは薄オレンジ
}
```

**サイズ自動計算の詳細**:
```javascript
function calculateStickyDimensions(groupInfo) {
  const nodeCount = groupInfo.nodes.length;
  const contentLength = groupInfo.content.length;

  // 高さ計算: ノード数とコンテンツ量に応じて
  const minHeight = 420;
  const nodeHeight = nodeCount * 60; // 各ノードで60px
  const contentHeight = Math.ceil(contentLength / 50) * 20; // 50文字で20px
  const height = Math.max(minHeight, nodeHeight, contentHeight);

  // 幅計算: ノード名の最大長とコンテンツ幅に応じて
  const minWidth = 520;
  const maxNodeNameLength = Math.max(...groupInfo.nodes.map(n => n.name.length));
  const nodeWidth = maxNodeNameLength * 10 + 100; // 文字幅 + マージン
  const width = Math.max(minWidth, nodeWidth);

  return { width, height };
}
```

**必須要素**:
- グループID / グループ名
- ノード一覧 + ノードブロック（役割・入力・出力）
- 目的 / 背景
- グループ内フロー
- フロー再現ガイド
- 達成したいこと
- 次のステップ（接続先 + 渡すデータ）

**Markdownテンプレート**:
```markdown
# 【グループ{{GROUP_ID}}: {{GROUP_NAME}}】

## このグループに含まれるノード
📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})
📌 **{{NODE_2_NAME}}** ({{NODE_2_TYPE}})
...

## ノードブロック（視覚リンク）
> ### {{NODE_1_NAME}} ({{NODE_1_TYPE}})
> - 役割: {{NODE_1_ROLE}}
> - 入力: {{NODE_1_INPUT}}
> - 出力: {{NODE_1_OUTPUT}}

## 目的
{{GROUP_PURPOSE}}

## 背景
{{GROUP_BACKGROUND}}

## グループ内フロー
1. {{PROCESSING_STEP_1}}
2. {{PROCESSING_STEP_2}}
3. {{PROCESSING_STEP_3}}

## フロー再現ガイド
1. {{REBUILD_STEP_1}}
2. {{REBUILD_STEP_2}}

## 達成したいこと
{{GROUP_GOAL}}

## 次のステップ
→ {{NEXT_GROUP_NAME}}へ（{{CONNECTION_DESCRIPTION}}）
```

**JSONテンプレート**:
```json
{
  "parameters": {
    "content": "# 【グループ{{GROUP_ID}}: {{GROUP_NAME}}】\n\n## このグループに含まれるノード\n📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})\n...\n\n## ノードブロック（視覚リンク）\n> ### {{NODE_1_NAME}} ({{NODE_1_TYPE}})\n> - 役割: {{NODE_1_ROLE}}\n> - 入力: {{NODE_1_INPUT}}\n> - 出力: {{NODE_1_OUTPUT}}\n\n## 目的\n{{GROUP_PURPOSE}}\n\n## 背景\n{{GROUP_BACKGROUND}}\n\n## グループ内フロー\n1. {{STEP_1}}\n2. {{STEP_2}}\n\n## フロー再現ガイド\n1. {{REBUILD_STEP_1}}\n2. {{REBUILD_STEP_2}}\n\n## 達成したいこと\n{{GROUP_GOAL}}\n\n## 次のステップ\n→ {{NEXT_GROUP_NAME}}へ（{{CONNECTION_DESCRIPTION}}）",
    "height": 420,
    "width": 520,
    "color": {{STICKY_NOTE_COLOR}}
  },
  "id": "sticky_{{GROUP_ID}}_uuid",
  "name": "Sticky Note - {{GROUP_NAME}}",
  "type": "n8n-nodes-base.stickyNote",
  "typeVersion": 1,
  "position": [{{X}}, {{Y}}]
}
```
### テンプレート変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `{{WORKFLOW_NAME}}` | ワークフロー名（業務目的） | "カスタマーサポートAI自動応答" |
| `{{TOTAL_NODE_COUNT}}` | ノード総数 | "87" |
| `{{TOTAL_GROUP_COUNT}}` | グループ総数 | "35" |
| `{{NODE_N_NAME}}` | ノード名 | "Webhook Trigger" |
| `{{NODE_N_TYPE}}` | ノードタイプ | "n8n-nodes-base.webhook" |
| `{{WORKFLOW_PURPOSE}}` | ワークフローの目的 | "顧客からの問い合わせに対してAIが自動的に回答を生成..." |
| `{{WORKFLOW_BACKGROUND}}` | 背景説明 | "従来は手動対応で時間がかかっていた..." |
| `{{PROBLEM_N}}` | 従来の課題 | "対応に平均30分かかる" |
| `{{SOLUTION_SUMMARY}}` | ソリューション概要 | "AIによる自動応答で5分以内に回答" |
| `{{STEP_N}}` | 処理ステップ | "ユーザーからの問い合わせを受付" |
| `{{WORKFLOW_GOAL}}` | 達成したいこと | "顧客満足度90%以上、応答時間5分以内" |
| `{{GROUP_ID}}` | グループID | "G001", "E001" |
| `{{GROUP_NAME}}` | グループ名 | "入力受付グループ" |
| `{{GROUP_PURPOSE}}` | グループの目的 | "ユーザーリクエストの受付と基本検証" |
| `{{GROUP_BACKGROUND}}` | グループの背景 | "すべての処理の起点となるため..." |
| `{{GROUP_NODE_SUMMARY}}` | グループ内の主要ノード要約 | "Webhook Trigger / Input Validation" |
| `{{GROUP_HANDOFF}}` | 次グループへの受け渡し情報 | "G002へvalidatedPayloadを渡す" |
| `{{GROUP_OWNER}}` | グループの責任部署・担当 | "Ops Squad" |
| `{{PROCESSING_STEP_N}}` | 処理ステップ | "Webhookでリクエスト受信" |
| `{{GROUP_GOAL}}` | グループで達成したいこと | "バリデーション済みデータの出力" |
| `{{NEXT_GROUP_NAME}}` | 次のグループ名 | "データ変換グループ" |
| `{{CONNECTION_DESCRIPTION}}` | 接続の説明 | "検証済みデータを渡す" |
| `{{NODE_N_GROUP}}` | ノードが所属するグループID | "G001" |
| `{{NODE_N_ROLE}}` | ノードの役割説明 | "Deepgram APIで文字起こし" |
| `{{NODE_N_INPUT}}` | ノードの主入力 | "items[0].binary.audio" |
| `{{NODE_N_OUTPUT}}` | ノードの主出力 | "transcriptionText" |
| `{{NODE_N_IO}}` | 入出力要約 | "Audio → Transcript JSON" |
| `{{REBUILD_STEP_N}}` | フロー再現手順 | "G001ノートを左上に配置" |
| `{{CHECK_N}}` | フロー復元チェック項目 | "全ノードに所属タグが付くか" |
| `{{STICKY_NOTE_COLOR}}` | Sticky Noteの色番号（明示設定必須） | 6=メイン（薄オレンジ）、5=エラー（薄赤）、7=全体 |
| `{{X}}`, `{{Y}}` | 配置座標 | [100, -50] |

---

## 制約

### Sticky Note設計の制約

1. **テンプレート準拠**
   - パターン1/2のテンプレートに従い、必須セクションを省略しない

2. **Markdown形式**
   - 見出し、箇条書き、太字、📌マーカー、引用を用いて視覚的に階層化

3. **ノード一覧の完全性**
   - パターン1: 全ノードを名前+タイプで列挙
   - パターン2: グループ内の全ノードを列挙し、ノードブロックで役割/入出力を記載

4. **サイズと表示**
   - パターン1: 最低 700×650px。表示が足りなければ拡張またはノートを追加
   - パターン2: 最低 520×420px。ノードブロック数に応じて `max(420, nodeBlocks×60)` を適用
   - n8n上でノートを開き、全文が折り返し表示されることを必ず確認する

5. **色とアクセシビリティ**
   - 全体フロー=7、メイン=6、エラー=5。color未設定（白）は使用禁止
   - 設計ドキュメントにも色 Legend を明記しておく

6. **配置**
   - パターン1: [100, 50]
   - パターン2: Step180で算出した各グループ左上座標

---

## 処理手順

### ステップ1: ワークフロー情報収集

**目的**: パターン1（全体フロー用Sticky Note）を生成するための情報収集

**処理内容**:

1. **ワークフロー基本情報の取得**
   - ワークフロー名: Step010の業務理解書から取得
   - ノード総数: nodes配列の長さ
   - 全ノードリスト: nodes配列からname、typeを抽出

2. **業務要件情報の取得**
   - ワークフローの目的: Step010の業務理解書から
   - 背景: Step010の「従来の課題」から
   - 達成したいこと: Step010の「ビジネス目標」から

3. **全体の流れの抽出**
   - Step040のグループ構成表から主要なグループ名を抽出
   - 5つの主要ステップに要約（例: 入力 → 検証 → AI処理 → 出力 → 通知）

4. **グループブロック情報の整理**
   - Step040/Step050の成果物から、各グループのID・主要ノード・ハンドオフ・担当を抽出し`groupBlocks`としてまとめる
   - 接続順序がわかるよう、`G001 → G010`のように矢印で記載

5. **ノードブロック情報の整理**
   - nodes配列とStep060の詳細設計（`_comment.role`, `input`, `output`）を突き合わせ、`nodeBlocks`に `{ name, type, group, role, input, output }` を格納
   - フロー復元時に必要な情報（例: 主な入出力カラム名）もここで補完

**出力例**:
```json
{
  "workflowName": "カスタマーサポートAI自動応答",
  "totalNodeCount": 87,
  "allNodes": [
    { "name": "Webhook Trigger", "type": "n8n-nodes-base.webhook" },
    { "name": "Input Validation", "type": "n8n-nodes-base.set" }
  ],
  "purpose": "顧客からの問い合わせに対してAIが自動的に回答を生成し、24時間365日対応を実現",
  "background": "従来は手動対応で時間がかかり、夜間・休日は対応不可だった",
  "problems": [
    "対応に平均30分かかる",
    "夜間・休日は対応不可",
    "対応品質が担当者により異なる"
  ],
  "solution": "AIによる自動応答で5分以内に24時間対応、品質も統一",
  "overallFlow": [
    "ユーザーからの問い合わせ受付（Webhook）",
    "入力検証とデータ変換",
    "AI Agentによる回答生成",
    "回答の整形と出力",
    "ログ記録と通知"
  ],
  "groupBlocks": [
    {
      "groupId": "G001",
      "groupName": "入力受付",
      "nodeSummary": "Webhook Trigger / Input Validation",
      "handoff": "G002へvalidatedPayloadを渡す",
      "owner": "Ops Squad"
    },
    {
      "groupId": "G050",
      "groupName": "AI議事録生成",
      "nodeSummary": "AI Agent / Merge / Topic Extraction",
      "handoff": "G060へformattedMinutesを渡す",
      "owner": "AI Platform"
    }
  ],
  "nodeBlocks": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "group": "G001",
      "role": "Google Driveで新規M4Aを検知",
      "input": "Drive Watch Event",
      "output": "normalizedPayload"
    },
    {
      "name": "AI Agent - Chunk Formatter",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "group": "G050",
      "role": "Gemini Flashでチャンク整形",
      "input": "transcriptChunk",
      "output": "formattedChunkJson"
    }
  ],
  "goal": "顧客満足度90%以上、応答時間5分以内、対応漏れゼロ"
}
```

---

### ステップ2: グループ情報収集

**目的**: パターン2（グループごとSticky Note）を生成するための情報収集

**処理内容**:

1. **グループ別ノード収集**
   ```javascript
   const groupNodes = {};
   nodes.forEach(node => {
     if (node._comment && node._comment.group) {
       const group = node._comment.group;
       if (!groupNodes[group]) groupNodes[group] = [];
       groupNodes[group].push({
         name: node.name,
         type: node.type
       });
     }
   });
   ```

2. **グループ目的・背景の抽出**
   - Step050のAIエージェント責務定義書から各グループの目的を抽出
   - Step060の詳細設計書から背景情報を抽出

3. **処理の流れの抽出**
   - Step060の詳細設計書から各グループの処理手順を抽出
   - 1-4ステップに要約

4. **次のステップの特定**
   - connectionsから次のグループを特定
   - 接続の意味（何を渡すか）を _comment.dataFlow から取得

5. **フロー再現ガイド作成**
   - Step180の座標計画とStep060の接続メモを参照し、`REBUILD_STEP`2-3行で復元手順を文章化

6. **ノードブロック詳細の整理**
   - Step060のノード設計メモや`node._comment.role`から役割/入力/出力を抽出
   - 各ノードに `{ role, input, output }` を紐付けて`nodeBlocks`を更新

7. **カラーコードの決定**
   - `groupId` が `E` で始まる場合は5（薄赤）、それ以外は6（薄オレンジ）
   - 設定漏れを防ぐため `groupInfo.color` を必須プロパティにする

**出力例**:
```json
{
  "G001": {
    "groupId": "G001",
    "groupName": "入力受付グループ",
    "nodes": [
      { "name": "Webhook Trigger", "type": "n8n-nodes-base.webhook" },
      { "name": "Input Validation", "type": "n8n-nodes-base.set" }
    ],
    "nodeBlocks": [
      { "name": "Webhook Trigger", "role": "Google Drive監視のトリガーを受信", "input": "Drive payload", "output": "normalizedPayload" },
      { "name": "Input Validation", "role": "必須フィールドと拡張子の検証", "input": "normalizedPayload", "output": "validatedPayload" }
    ],
    "purpose": "ユーザーからのHTTPリクエストを受付け、基本的な入力検証を実施",
    "background": "すべての処理の起点となるため、不正なリクエストを早期に検出することが重要",
    "processingSteps": [
      "Webhookでユーザーリクエスト受信",
      "必須フィールド（userId、query）の存在確認",
      "データ型の検証",
      "タイムスタンプの付与"
    ],
    "rebuildSteps": [
      "Drive TriggerとFilterを左上に配置",
      "Metadata NormalizerをFilterの下に配置しvalidatedPayloadを生成",
      "normalizedPayloadをG010 Deepgramノードへ接続"
    ],
    "goal": "バリデーション済みの正規化データを次のグループに渡す",
    "nextGroup": {
      "name": "データ変換グループ",
      "connection": "検証済みリクエストデータを渡す"
    },
    "color": 6
  },
  "G010": {
    "groupId": "G010",
    "groupName": "AI処理グループ",
    "nodes": [
      { "name": "AI Agent - User Query", "type": "@n8n/n8n-nodes-langchain.agent" },
      { "name": "Context Retrieval Tool", "type": "@n8n/n8n-nodes-langchain.toolWorkflow" },
      { "name": "Response Generator", "type": "n8n-nodes-base.set" }
    ],
    "nodeBlocks": [
      { "name": "AI Agent - User Query", "role": "Gemini/Claudeで回答案を生成", "input": "validatedPayload", "output": "draftAnswer" },
      { "name": "Context Retrieval Tool", "role": "議事録コンテキストを検索", "input": "draftAnswer.query", "output": "contextSnippets" }
    ],
    "purpose": "ユーザークエリに対してAI Agentが適切なツールを選択し、コンテキストを取得して回答を生成",
    "background": "AIによる高品質な回答生成がワークフローの中核機能であり、慎重な設計が必要",
    "processingSteps": [
      "AI Agentがユーザークエリを分析",
      "Context Retrieval ToolでベクトルDB検索",
      "取得したコンテキストと合わせて回答生成",
      "回答の信頼度スコア計算"
    ],
    "rebuildSteps": [
      "AI Agentをグループ中央に配置し入力をG009/G020から受ける",
      "Context Retrieval Toolを左下に置きTool呼び出し経路を確保",
      "Response GeneratorでdraftAnswerを整形しG011へ送る"
    ],
    "goal": "ユーザークエリに対する正確で有用な回答を生成する",
    "nextGroup": {
      "name": "回答整形グループ",
      "connection": "AI生成回答と信頼度スコアを渡す"
    },
    "color": 6
  }
}
```


---

### ステップ3: パターン1 Sticky Note生成（全体フロー用）

**目的**: 収集した情報を使って、パターン1テンプレートに従ったSticky Noteコンテンツを生成

**処理内容**:

1. **テンプレート変数の置換**
   ```javascript
   const overviewContent = `# 【${workflowName} - 全体フロー】

## このワークフローに含まれる全ノード（${totalNodeCount}個）
${allNodes.map(node => `📌 **${node.name}** (${node.type})`).join('
')}

## グループブロック（再現サマリ）
${groupBlocks.map(block => `> ### ${block.groupId} ${block.groupName}
> - ノード: ${block.nodeSummary}
> - ハンドオフ: ${block.handoff}
> - 主担当: ${block.owner}`).join('

')}

## このワークフローの目的
${purpose}

## 背景
${background}

従来の課題:
${problems.map(p => `- ${p}`).join('
')}

このワークフローにより、${solution}

## 全体の流れ
${overallFlow.map((step, i) => `${i + 1}. ${step}`).join('
')}

## ノードブロック（視覚リンク）
${nodeBlocks.map(node => `> #### ${node.name} (${node.type})
> - 所属グループ: ${node.group}
> - 役割: ${node.role}
> - 入力 / 出力: ${node.input} → ${node.output}`).join('

')}

## フロー復元チェックリスト
1. 全体フローとゴールを確認
2. グループブロック順にキャンバスへ枠を配置
3. ノードブロックの入出力を参照して接続線を再現

## 達成したいこと
${goal}`;
   ```

2. **Sticky Note JSONオブジェクト作成**
   ```json
   {
     "id": "sticky_overview_{{UUID}}",
     "name": "Sticky Note - ワークフロー全体フロー",
     "type": "n8n-nodes-base.stickyNote",
     "typeVersion": 1,
     "position": [100, 50],
     "parameters": {
       "content": "{{生成されたコンテンツ}}",
       "height": 650,
       "width": 700,
       "color": 7
     }
   }
   ```

**出力例**:
```markdown
# 【Google Meet議事録自動化 v4 - 全体フロー】

## このワークフローに含まれる全ノード（112個）
📌 **Google Drive Trigger** (n8n-nodes-base.googleDriveTrigger)
📌 **File Filter** (n8n-nodes-base.if)
📌 **Deepgram Transcribe** (n8n-nodes-base.httpRequest)
📌 **Transcript Chunker** (n8n-nodes-base.code)
📌 **AI Agent - Chunk Formatter** (@n8n/n8n-nodes-langchain.agent)
📌 **Merge Chunks** (n8n-nodes-base.merge)
📌 **AI Agent - Topic Extraction** (@n8n/n8n-nodes-langchain.agent)
📌 **AI Agent - Decision Analyzer** (@n8n/n8n-nodes-langchain.agent)
📌 **Minutes Formatter** (@n8n/n8n-nodes-langchain.agent)
📌 **Google Drive Upload** (n8n-nodes-base.googleDrive)
...（残りも同形式）

## グループブロック（再現サマリ）
> ### G001 収集・検知
> - ノード: Google Drive Trigger / File Filter
> - ハンドオフ: G010へ m4aFileMeta を渡す
> - 主担当: Infra Ops
>
> ### G050 AI議事録生成
> - ノード: AI Agent - Chunk Formatter / Merge Chunks / AI Agent - Topic Extraction
> - ハンドオフ: G060へ formattedMinutes を渡す
> - 主担当: AI Platform

## このワークフローの目的
Google Meetの音声を自動で議事録化し、AIによる要約・アクション抽出を即座に配信する。

## 背景
月200本の会議を手動で文字起こししており、担当者の稼働が逼迫している。Deepgramと複数AIモデルを連携させることで、品質と速度を両立させる必要がある。

従来の課題:
- 1本の議事録作成に平均90分かかる
- 話者情報が失われ、責任者特定に時間がかかる
- アクションアイテムの抜け漏れが発生

このワークフローにより、処理を完全自動化し、10分以内に高品質なMarkdown議事録を生成できる。

## 全体の流れ
1. Google Driveで新規M4Aを検知しメタ情報を取得
2. Deepgramで全文文字起こし → 行単位にチャンク分割
3. Gemini/Claudeが各チャンクを整形し議題を抽出
4. 決定事項・宿題・保留をAIで整理しMarkdownに整形
5. Google Driveへ保存し、元ファイルをprocessedへ移動

## ノードブロック（視覚リンク）
> #### Google Drive Trigger (n8n-nodes-base.googleDriveTrigger)
> - 所属グループ: G001
> - 役割: 監視フォルダで新規M4Aを検知
> - 入力 / 出力: Drive Watch → { fileId, name, mimeType }
>
> #### AI Agent - Chunk Formatter (@n8n/n8n-nodes-langchain.agent)
> - 所属グループ: G050
> - 役割: Gemini Flashで整形指示に従い見出し単位へ変換
> - 入力 / 出力: transcriptChunk → formattedChunkJson

## フロー復元チェックリスト
1. G001→G060の順でグループブロックを配置
2. ノードブロックの入出力を参照して接続線を敷設
3. エラーブロック（E001-003）も色5で配置し異常系を可視化

## 達成したいこと
議事録生成時間を90分→10分に短縮し、決定事項・宿題の抜け漏れゼロを維持する。
```

---

### ステップ4: パターン2 Sticky Note生成（グループごと）

**目的**: 各グループ情報を使って、パターン2テンプレートに従ったSticky Noteコンテンツを生成

**処理内容**:

1. **グループごとのコンテンツ生成**
   ```javascript
   function generateGroupSticky(groupInfo) {
     return `# 【グループ${groupInfo.groupId}: ${groupInfo.groupName}】

## このグループに含まれるノード
${groupInfo.nodes.map(node => `📌 **${node.name}** (${node.type})`).join('
')}

## ノードブロック（視覚リンク）
${groupInfo.nodeBlocks.map(node => `> ### ${node.name} (${node.type || 'n/a'})
> - 役割: ${node.role}
> - 入力: ${node.input}
> - 出力: ${node.output}`).join('

')}

## 目的
${groupInfo.purpose}

## 背景
${groupInfo.background}

## グループ内フロー
${groupInfo.processingSteps.map((step, i) => `${i + 1}. ${step}`).join('
')}

## フロー再現ガイド
${groupInfo.rebuildSteps.map((step, i) => `${i + 1}. ${step}`).join('
')}

## 達成したいこと
${groupInfo.goal}

## 次のステップ
→ ${groupInfo.nextGroup.name}へ（${groupInfo.nextGroup.connection}）`;
   }
   ```

2. **Sticky Note JSONオブジェクト作成**
   ```javascript
   const groupSticky = {
     id: `sticky_${groupInfo.groupId}_${generateUUID()}`,
     name: `Sticky Note - ${groupInfo.groupName}`,
     type: 'n8n-nodes-base.stickyNote',
     typeVersion: 1,
     position: groupInfo.position,
     parameters: {
       content: generateGroupSticky(groupInfo),
       height: Math.max(420, groupInfo.nodeBlocks.length * 60),
       width: 520,
       color: groupInfo.color // 6=メイン, 5=エラー
     }
   };
   ```

**出力例（G001の場合）**:
```markdown
# 【グループG001: M4A検知・前処理】

## このグループに含まれるノード
📌 **Google Drive Trigger** (n8n-nodes-base.googleDriveTrigger)
📌 **File Filter** (n8n-nodes-base.if)
📌 **Metadata Normalizer** (n8n-nodes-base.code)

## ノードブロック（視覚リンク）
> ### Google Drive Trigger (n8n-nodes-base.googleDriveTrigger)
> - 役割: 監視フォルダに追加されたM4Aを検知
> - 入力: Google Drive Watchイベント
> - 出力: { fileId, name, mimeType, parents }
>
> ### Metadata Normalizer (n8n-nodes-base.code)
> - 役割: Deepgram API向けpayloadを構築
> - 入力: fileId, downloadUrl
> - 出力: normalizedPayload（audioUrl, meetingDate, speakerHints）

## 目的
処理対象となるM4Aファイルのみを抽出し、以降のAI処理で利用できるメタ情報を整形する。

## 背景
Google Drive上には過去ファイルや別拠点の音声も混在しており、誤処理を防ぐために検知条件と初期整形を1ブロックにまとめている。

## グループ内フロー
1. Google Drive Triggerが新規M4Aを検知
2. File Filterで拡張子・processedラベルをチェック
3. Metadata NormalizerでDeepgram向けのURLと属性を生成

## フロー再現ガイド
1. Drive TriggerとFilterを左上（G001）に配置
2. Metadata NormalizerをFilter下に配置し `items[0].json` を連結
3. 出力`normalizedPayload`をG010 Deepgramノードへ接続

## 達成したいこと
Deepgram APIが処理可能なpayloadを作成し、不要なファイルを後段に流さない。

## 次のステップ
→ G010（Deepgram自動文字起こし）へ（normalizedPayloadを渡す）
```

---

### ステップ5: Sticky Note JSONへの適用

**目的**: 生成したコンテンツを各Sticky Noteの`parameters.content`へ設定し、サイズ/色を更新

**処理内容**:

1. **パターン1 Sticky Noteの追加**
   ```javascript
   const overviewSticky = {
     id: generateUUID(),
     name: 'Sticky Note - ワークフロー全体フロー',
     type: 'n8n-nodes-base.stickyNote',
     typeVersion: 1,
     position: [100, 50],
     parameters: {
       content: overviewContent,
       height: 650,
       width: 700,
       color: 7
     }
   };

   workflow.nodes.unshift(overviewSticky);
   ```

2. **パターン2 Sticky Notesの更新/追加**
   ```javascript
   workflow.nodes.forEach(node => {
     if (node.type === 'n8n-nodes-base.stickyNote' && node._comment?.group) {
       const info = groupsInfo[node._comment.group];
       if (!info) return;
       node.parameters.content = generateGroupSticky(info);
       node.parameters.height = Math.max(420, info.nodeBlocks.length * 60);
       node.parameters.width = 520;
       node.parameters.color = info.color;
     }
   });

   Object.entries(groupsInfo).forEach(([groupId, info]) => {
     const exists = workflow.nodes.some(
       node => node.type === 'n8n-nodes-base.stickyNote' && node._comment?.group === groupId
     );

     if (!exists) {
       workflow.nodes.push({
         id: generateUUID(),
         name: `Sticky Note - ${info.groupName}`,
         type: 'n8n-nodes-base.stickyNote',
         typeVersion: 1,
         position: info.position,
         parameters: {
           content: generateGroupSticky(info),
           height: Math.max(420, info.nodeBlocks.length * 60),
           width: 520,
           color: info.color
         },
         _comment: {
           group: groupId
         }
       });
     }
   });
   ```
### ステップ6: Sticky Note設計ドキュメント作成

**目的**: すべてのSticky Noteの目的と内容を文書化

**処理内容**:

1. **Sticky Note一覧作成**
   - パターン1: 1個（全体フロー）
   - パターン2: グループ数分（G001-G030、E001-E010など）

2. **各Sticky Noteの詳細記述**
   - 種類（パターン1 or パターン2）
   - 配置位置
   - サイズ
   - 色
   - コンテンツ概要

**出力例**:
```markdown
# Sticky Note設計ドキュメント

## 概要

このワークフローには以下のSticky Noteが配置されています:

### 種類別内訳

1. **パターン1（全体フロー用）**: 1個
   - 配置: [100, 50]
   - サイズ: 700px × 650px
   - 色: 7（薄ピンク）

2. **パターン2（グループごと）**: 35個
   - メインフローグループ: 30個（G001-G030）
   - エラーフローグループ: 5個（E001-E005）
   - サイズ: 520px × 420px
   - 色: メインフロー=6（薄オレンジ）、エラーフロー=5（薄赤）

**合計**: 36個のSticky Note

## 設計方針

### テンプレート準拠
- パターン1とパターン2の統一フォーマットを使用
- 必須要素をすべて含める
- セクション順序を厳守

### ノード一覧の完全性
- パターン1: ワークフロー内のすべてのノードをリスト化
- パターン2: グループ内のすべてのノードをリスト化
- ノード名とノードタイプの両方を記載

### 視覚的識別性
- パターン1: 薄ピンク（色7）で全体フローであることを強調
- エラーフローグループ: 薄赤（色5）でエラー処理であることを強調
- 📌マーカーで各ノードを視覚的に識別

## Sticky Note一覧

### パターン1: 全体フロー
- **名前**: Sticky Note - ワークフロー全体フロー
- **配置**: [100, 50]
- **サイズ**: 700px × 650px
- **色**: 7（薄ピンク）
- **内容**: ワークフロー名、全ノードリスト（87個）、目的、背景、全体の流れ、達成したいこと

### パターン2: グループごと

#### G001: 入力受付グループ
- **配置**: [100, -50]
- **サイズ**: 520px × 420px
- **色**: 6（薄オレンジ）
- **ノード数**: 2
- **内容**: Webhook受付と入力検証

#### G010: AI処理グループ
- **配置**: [100, 850]
- **サイズ**: 520px × 420px
- **色**: 6（薄オレンジ）
- **ノード数**: 3
- **内容**: AI Agent処理とコンテキスト取得

#### E001: 入力エラー処理グループ
- **配置**: [1900, -50]
- **サイズ**: 520px × 420px
- **色**: 5（薄赤）
- **ノード数**: 3
- **内容**: エラーログ記録と通知

（以下、全Sticky Noteの情報を記載）
```

---

## 初回質問

Step170を開始する前に、以下を確認させてください:

### 1. 入力ファイルの確認

**質問**: Step160で出力された統合ワークフローJSONファイルのパスを教えてください。
（注: Sticky Noteの配置座標はStep180で最終決定されます）

**回答例**:
```
ファイルパス: ./output/integrated_workflow.json
```

---

### 2. 業務要件ドキュメントの確認

**質問**: 以下のドキュメントのパスを教えてください（パターン1の全体フロー用Sticky Noteに使用）:

**必要なドキュメント**:
- Step010: 業務理解書（ワークフローの目的、背景、課題）
- Step040: グループ構成表（全体の流れ）
- Step050: AIエージェント責務定義書（各グループの目的）
- Step060: 詳細設計書（各グループの背景、処理の流れ）

**回答例**:
```
- 業務理解書: ./カスタマーサポートAI/step010_業務理解/業務理解書.md
- グループ構成表: ./カスタマーサポートAI/step040_タスク分解/グループ構成表.md
- AI責務定義書: ./カスタマーサポートAI/step050_AIエージェント責務/AIエージェント責務定義書.md
- 詳細設計書: ./カスタマーサポートAI/step060_パターン適用/詳細設計書.md
```

---

### 3. Sticky Note生成範囲の確認

**質問**: 以下のどのSticky Noteを生成しますか？

**選択肢**:
a) **パターン1のみ**: 全体フロー用Sticky Noteのみ（1個）
b) **パターン2のみ**: グループごとSticky Noteのみ（グループ数分）
c) **両方**: パターン1 + パターン2（推奨）

**推奨**: c) 両方（完全なドキュメンテーション）

**回答例**:
```
選択: c) 両方
```

---

### 4. エラーグループの色設定

**質問**: エラーフローグループのSticky Noteに色5（薄赤色）を適用しますか？

**背景**: エラー処理グループを視覚的に強調することで、保守時に識別しやすくなります。

**回答例**:
```
はい、エラーグループは色5を適用してください。
```

---

### 5. 全ノードリストの表示形式

**質問**: パターン1の「このワークフローに含まれる全ノード」セクションで、ノードタイプの表示方法を選択してください:

**選択肢**:
a) **完全表示**: `📌 **Webhook Trigger** (n8n-nodes-base.webhook)`
b) **簡略表示**: `📌 **Webhook Trigger**`（ノードタイプは省略）

**推奨**: a) 完全表示（技術的詳細が分かる）

**回答例**:
```
選択: a) 完全表示
```

---

## 次のステップ

Step170完了後、配置最適化に進みます:

1. **Step180: 配置最適化**
   - Sticky Noteの配置座標を決定
   - ノードの視覚的配置を最適化
   - グループ構造を視覚的に表現

2. **Step190: 最終出力**
   - 完成したワークフローJSONの最終出力
   - メタデータJSON作成
   - README.md作成
   - 実装ガイド作成
   - 検証レポート作成

---

## n8n-MCP使用タイミング

このステップでn8n-MCPを使用すべきタイミングと方法：

### タイミング1: Sticky Note生成直後（ステップ3, 4完了後）

**目的**: 生成したSticky Noteの必須プロパティが正しいか検証

**使用ツール**:
```javascript
// パターン1（全体フロー用）検証
validate_node_minimal("nodes-base.stickyNote", {
  "height": 650,
  "width": 700,
  "color": 7
})

// パターン2（グループごと）検証
validate_node_minimal("nodes-base.stickyNote", {
  "height": 420,
  "width": 520,
  "color": 6  // エラーグループの場合は 5
})
```

**検証項目**:
- ✅ `height`, `width`, `color` のすべてが含まれているか（必須プロパティ）
- ✅ `color` が `backgroundColor` になっていないか（よくある誤り）
- ✅ `color` の値が 0-7 の範囲内か
- ✅ `content` が Markdown 形式として妥当か

**重要**: Sticky Noteの3つのプロパティ（height, width, color）はすべて必須です。1つでも欠けると無効になります。

---

### タイミング2: ワークフロー全体検証時（ステップ6完了後）

**目的**: Sticky Note追加後のワークフロー全体を検証

**使用ツール**:
```javascript
// ワークフロー全体検証
validate_workflow({
  "name": "{{WORKFLOW_NAME}}",
  "nodes": [...],  // すべてのノード（Sticky Note含む）
  "connections": {...}
})

// ノード総数確認
console.log(`Total nodes: ${workflow.nodes.length}`);
console.log(`Sticky Notes: ${workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote').length}`);
```

**検証項目**:
- ✅ パターン1のSticky Noteが1つ存在するか
- ✅ パターン2のSticky Noteがグループ数分存在するか
- ✅ すべてのSticky Noteが有効な構造か
- ✅ ワークフロー全体の構造に問題がないか

---

### タイミング3: エラー発生時（即座に）

**目的**: Sticky Note生成エラーの原因調査

**使用ツール**:
```javascript
// Sticky Noteの詳細情報取得
get_node_essentials("nodes-base.stickyNote")
// → 必須プロパティ、デフォルト値、型情報を取得

// エラーが解決しない場合
get_node_info("nodes-base.stickyNote")
// → 完全なノード定義を取得（100KB+）
```

**使用シーン**:
- `validate_node_minimal` で `color` が必須と表示された場合
- Sticky Noteのサイズや色の仕様が不明な場合
- テンプレート構造に問題がある場合

---

### n8n-MCP検証フロー（Step180専用）

```
Sticky Note生成（パターン1）
  ↓
validate_node_minimal() ← 【タイミング1】
  ↓ ✅ 合格
Sticky Note生成（パターン2 × グループ数）
  ↓
validate_node_minimal() × グループ数 ← 【タイミング1】
  ↓ ✅ すべて合格
ワークフロー統合
  ↓
validate_workflow() ← 【タイミング2】
  ↓ ✅ 合格
Step180完了
  ↓
（エラー発生時のみ）
get_node_essentials() ← 【タイミング3】
  ↓
修正 → 再検証
```

---

### よくある検証エラーと対処法

#### エラー1: `backgroundColor` プロパティ使用
```json
// ❌ 間違い
{
  "parameters": {
    "content": "...",
    "height": 650,
    "width": 700,
    "backgroundColor": 7  // ← 間違い
  }
}

// ✅ 正しい
{
  "parameters": {
    "content": "...",
    "height": 650,
    "width": 700,
    "color": 7  // ← 正しい
  }
}
```

**n8n-MCP検証結果**:
```javascript
validate_node_minimal("nodes-base.stickyNote", {"backgroundColor": 7})
→ {"valid": false, "missingRequiredFields": ["Height", "Width", "Color"]}
```

#### エラー2: `color` プロパティ欠落
```json
// ❌ 間違い
{
  "parameters": {
    "content": "...",
    "height": 650,
    "width": 700
    // color が欠落
  }
}
```

**n8n-MCP検証結果**:
```javascript
validate_node_minimal("nodes-base.stickyNote", {"height": 650, "width": 700})
→ {"valid": false, "missingRequiredFields": ["Color"]}
```

**対処法**: 必ず `color` を追加（全体=7、メイン=6、エラー=5）

---

### 推奨されるn8n-MCP活用パターン

1. **生成即検証**: 各Sticky Note生成直後に即座にvalidate_node_minimal()実行
2. **バッチ検証**: すべてのSticky Note生成後にvalidate_workflow()で包括的検証
3. **エラー駆動学習**: エラー時にget_node_essentials()で正しい仕様を確認

**メリット**:
- Sticky Noteの必須プロパティ（height, width, color）の欠落を即座に検出
- `backgroundColor` → `color` の誤りを早期発見
- ワークフロー全体の整合性を保証

---

## 補足情報

### テンプレート使用のメリット

1. **統一性**: すべてのSticky Noteが同じフォーマットで一貫性がある
2. **完全性**: 必須要素が漏れなく含まれる
3. **可読性**: 決まった構造で情報が探しやすい
4. **保守性**: 将来の更新時にテンプレートに従えば良い
5. **スケーラビリティ**: 新しいグループを追加してもフォーマットが統一される

### n8n Sticky Noteの制約

- **Markdown対応**: 見出し、箇条書き、太字、コードブロック
- **改行**: `\n`で改行
- **サイズ**: parametersのheightとwidthで指定（px単位）
- **色**: 0-7の8色から選択可能

### Sticky Noteの色

- `0`: グレー（デフォルト）
- `1`: 薄黄色
- `2`: 薄緑色
- `3`: 薄青色
- `4`: 薄紫色
- `5`: 薄赤色（エラーグループ推奨）
- `6`: 薄オレンジ色
- `7`: 薄ピンク色（全体フロー推奨）

---

**このプロンプトを実行すると、Step180の処理が開始されます。上記の初回質問に回答することで、パターン1とパターン2のテンプレートに従った統一されたSticky Note設計が実現されます。**
