# Step180: Sticky Note完成

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
├─ Step170: 配置最適化 ✅
├─ Step180: Sticky Note完成 ← 現在のステップ
└─ Step190: 最終出力
```

### v4.0のSticky Noteテンプレート

v4.0では、以下の2つのSticky Noteテンプレートを使用:

1. **パターン1: 全体フロー用Sticky Note**（ワークフロー冒頭に配置、1個のみ）
2. **パターン2: グループごとのSticky Note**（各処理グループに配置、グループ数分）

---

## 言葉の定義

### Sticky Noteテンプレート種類

#### パターン1: 全体フロー用Sticky Note

**目的**: ワークフロー全体の概要を示す
**配置**: キャンバス左上（[100, 50]）
**サイズ**: 700px × 600px
**色**: 7（薄ピンク色）

**必須要素**:
- ワークフロー名
- このワークフローに含まれる全ノード（ノード総数）
- ワークフローの目的
- 背景（従来の課題とソリューション）
- 全体の流れ（1-5ステップ）
- 達成したいこと

**Markdownテンプレート**:
```markdown
# 【{{WORKFLOW_NAME}} - 全体フロー】

## このワークフローに含まれる全ノード（{{TOTAL_NODE_COUNT}}個）
📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})
📌 **{{NODE_2_NAME}}** ({{NODE_2_TYPE}})
📌 **{{NODE_3_NAME}}** ({{NODE_3_TYPE}})
...（全ノードをリスト化）

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

## 達成したいこと
{{WORKFLOW_GOAL}}
```

**JSONテンプレート**:
```json
{
  "parameters": {
    "content": "# 【{{WORKFLOW_NAME}} - 全体フロー】\n\n## このワークフローに含まれる全ノード（{{TOTAL_NODE_COUNT}}個）\n📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})\n📌 **{{NODE_2_NAME}}** ({{NODE_2_TYPE}})\n...\n\n## このワークフローの目的\n{{WORKFLOW_PURPOSE}}\n\n## 背景\n{{WORKFLOW_BACKGROUND}}\n\n従来の課題:\n- {{PROBLEM_1}}\n- {{PROBLEM_2}}\n\nこのワークフローにより、{{SOLUTION}}\n\n## 全体の流れ\n1. {{STEP_1}}\n2. {{STEP_2}}\n...\n\n## 達成したいこと\n{{GOAL}}",
    "height": 600,
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

**目的**: 各グループの役割と処理詳細を示す
**配置**: 各グループの左上（Step170で決定済み）
**サイズ**: 500px × 350px
**色**: グループ種類により異なる（メインフロー: デフォルト、エラーフロー: 5（薄赤色））

**必須要素**:
- グループID（G001, E001など）
- グループ名
- このグループに含まれるノード（ノード一覧）
- 目的
- 背景
- 処理の流れ（1-4ステップ）
- 達成したいこと
- 次のステップ（接続先グループ）

**Markdownテンプレート**:
```markdown
# 【グループ{{GROUP_ID}}: {{GROUP_NAME}}】

## このグループに含まれるノード
📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})
📌 **{{NODE_2_NAME}}** ({{NODE_2_TYPE}})
📌 **{{NODE_3_NAME}}** ({{NODE_3_TYPE}})

## 目的
{{GROUP_PURPOSE}}

## 背景
{{GROUP_BACKGROUND}}

## 処理の流れ
1. {{PROCESSING_STEP_1}}
2. {{PROCESSING_STEP_2}}
3. {{PROCESSING_STEP_3}}
4. {{PROCESSING_STEP_4}}

## 達成したいこと
{{GROUP_GOAL}}

## 次のステップ
→ {{NEXT_GROUP_NAME}}へ（{{CONNECTION_DESCRIPTION}}）
```

**JSONテンプレート**:
```json
{
  "parameters": {
    "content": "# 【グループ{{GROUP_ID}}: {{GROUP_NAME}}】\n\n## このグループに含まれるノード\n📌 **{{NODE_1_NAME}}** ({{NODE_1_TYPE}})\n📌 **{{NODE_2_NAME}}** ({{NODE_2_TYPE}})\n...\n\n## 目的\n{{GROUP_PURPOSE}}\n\n## 背景\n{{GROUP_BACKGROUND}}\n\n## 処理の流れ\n1. {{STEP_1}}\n2. {{STEP_2}}\n...\n\n## 達成したいこと\n{{GOAL}}\n\n## 次のステップ\n→ {{NEXT_GROUP}}へ",
    "height": 350,
    "width": 500,
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
| `{{PROCESSING_STEP_N}}` | 処理ステップ | "Webhookでリクエスト受信" |
| `{{GROUP_GOAL}}` | グループで達成したいこと | "バリデーション済みデータの出力" |
| `{{NEXT_GROUP_NAME}}` | 次のグループ名 | "データ変換グループ" |
| `{{CONNECTION_DESCRIPTION}}` | 接続の説明 | "検証済みデータを渡す" |
| `{{STICKY_NOTE_COLOR}}` | Sticky Noteの色番号 | 0-7（0: グレー、7: 薄ピンク） |
| `{{X}}`, `{{Y}}` | 配置座標 | [100, -50] |

---

## 制約

### Sticky Note設計の制約

1. **テンプレート準拠**
   - パターン1とパターン2のテンプレートに厳密に従う
   - 必須要素をすべて含める
   - セクション順序を変更しない

2. **Markdown形式**
   - すべてのコンテンツはMarkdownで記述
   - 見出し（#）、箇条書き（-）、太字（**）、絵文字（📌）を使用

3. **ノード一覧の完全性**
   - パターン1: ワークフロー内のすべてのノードをリスト化
   - パターン2: グループ内のすべてのノードをリスト化
   - ノード名とノードタイプの両方を記載（例: `📌 **Webhook Trigger** (n8n-nodes-base.webhook)`）

4. **サイズとデザイン**
   - パターン1: 700px × 600px、色7（薄ピンク）
   - パターン2: 500px × 350px、色は種類により変動
     - メインフローグループ: デフォルト（色指定なし）
     - エラーフローグループ: 色5（薄赤色）

5. **配置**
   - パターン1: [100, 50]（キャンバス左上）
   - パターン2: Step170で決定された各グループの左上位置

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

**出力例**:
```json
{
  "workflowName": "カスタマーサポートAI自動応答",
  "totalNodeCount": 87,
  "allNodes": [
    { "name": "Webhook Trigger", "type": "n8n-nodes-base.webhook" },
    { "name": "Input Validation", "type": "n8n-nodes-base.set" },
    ...
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
    "purpose": "ユーザーからのHTTPリクエストを受付け、基本的な入力検証を実施",
    "background": "すべての処理の起点となるため、不正なリクエストを早期に検出することが重要",
    "processingSteps": [
      "Webhookでユーザーリクエスト受信",
      "必須フィールド（userId、query）の存在確認",
      "データ型の検証",
      "タイムスタンプの付与"
    ],
    "goal": "バリデーション済みの正規化されたデータを次のグループに渡す",
    "nextGroup": {
      "name": "データ変換グループ",
      "connection": "検証済みリクエストデータを渡す"
    }
  },
  "G010": {
    "groupId": "G010",
    "groupName": "AI処理グループ",
    "nodes": [
      { "name": "AI Agent - User Query", "type": "@n8n/n8n-nodes-langchain.agent" },
      { "name": "Context Retrieval Tool", "type": "@n8n/n8n-nodes-langchain.toolWorkflow" },
      { "name": "Response Generator", "type": "n8n-nodes-base.set" }
    ],
    "purpose": "ユーザークエリに対してAI Agentが適切なツールを選択し、コンテキストを取得して回答を生成",
    "background": "AIによる高品質な回答生成がワークフローの中核機能であり、慎重な設計が必要",
    "processingSteps": [
      "AI Agentがユーザークエリを分析",
      "Context Retrieval ToolでベクトルDB検索",
      "取得したコンテキストと合わせて回答生成",
      "回答の信頼度スコア計算"
    ],
    "goal": "ユーザークエリに対する正確で有用な回答を生成する",
    "nextGroup": {
      "name": "回答整形グループ",
      "connection": "AI生成回答と信頼度スコアを渡す"
    }
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
${allNodes.map(node => `📌 **${node.name}** (${node.type})`).join('\n')}

## このワークフローの目的
${purpose}

## 背景
${background}

従来の課題:
${problems.map(p => `- ${p}`).join('\n')}

このワークフローにより、${solution}

## 全体の流れ
${overallFlow.map((step, i) => `${i+1}. ${step}`).join('\n')}

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
       "height": 600,
       "width": 700,
       "color": 7
     }
   }
   ```

**出力例**:
```markdown
# 【カスタマーサポートAI自動応答 - 全体フロー】

## このワークフローに含まれる全ノード（87個）
📌 **Webhook Trigger** (n8n-nodes-base.webhook)
📌 **Input Validation** (n8n-nodes-base.set)
📌 **Data Transform** (n8n-nodes-base.code)
📌 **AI Agent - User Query** (@n8n/n8n-nodes-langchain.agent)
📌 **Context Retrieval Tool** (@n8n/n8n-nodes-langchain.toolWorkflow)
📌 **Response Generator** (n8n-nodes-base.set)
📌 **Format Response** (n8n-nodes-base.code)
📌 **Send Response** (n8n-nodes-base.webhook)
📌 **Log to Database** (n8n-nodes-base.postgres)
📌 **Send Notification** (n8n-nodes-base.slack)
...（全87ノード）

## このワークフローの目的
顧客からの問い合わせに対してAIが自動的に回答を生成し、24時間365日の迅速な対応を実現します。

## 背景
従来は手動対応で時間がかかり、夜間・休日は対応不可能でした。また、担当者によって対応品質にばらつきがありました。

従来の課題:
- 対応に平均30分かかる
- 夜間・休日は対応不可
- 対応品質が担当者により異なる

このワークフローにより、AIによる自動応答で5分以内に24時間対応し、品質も統一されます。

## 全体の流れ
1. ユーザーからの問い合わせ受付（Webhook）
2. 入力検証とデータ変換
3. AI Agentによる回答生成
4. 回答の整形と出力
5. ログ記録と通知

## 達成したいこと
顧客満足度90%以上、応答時間5分以内、対応漏れゼロを実現し、カスタマーサポートの品質向上とコスト削減を図ります。
```

---

### ステップ4: パターン2 Sticky Note生成（グループごと）

**目的**: 各グループ情報を使って、パターン2テンプレートに従ったSticky Noteコンテンツを生成

**処理内容**:

1. **グループごとのコンテンツ生成**
   ```javascript
   function generateGroupSticky(groupInfo) {
     const content = `# 【グループ${groupInfo.groupId}: ${groupInfo.groupName}】

## このグループに含まれるノード
${groupInfo.nodes.map(node => `📌 **${node.name}** (${node.type})`).join('\n')}

## 目的
${groupInfo.purpose}

## 背景
${groupInfo.background}

## 処理の流れ
${groupInfo.processingSteps.map((step, i) => `${i+1}. ${step}`).join('\n')}

## 達成したいこと
${groupInfo.goal}

## 次のステップ
→ ${groupInfo.nextGroup.name}へ（${groupInfo.nextGroup.connection}）`;

     return content;
   }
   ```

2. **Sticky Note JSONオブジェクト作成**
   ```javascript
   const groupSticky = {
     "id": `sticky_${groupId}_{{UUID}}`,
     "name": `Sticky Note - ${groupName}`,
     "type": "n8n-nodes-base.stickyNote",
     "typeVersion": 1,
     "position": [x, y], // Step170で決定済み
     "parameters": {
       "content": generatedContent,
       "height": 350,
       "width": 500,
       "color": groupId.startsWith('E') ? 5 : null // エラーグループは色5
     }
   };
   ```

**出力例（G001の場合）**:
```markdown
# 【グループG001: 入力受付グループ】

## このグループに含まれるノード
📌 **Webhook Trigger** (n8n-nodes-base.webhook)
📌 **Input Validation** (n8n-nodes-base.set)

## 目的
ユーザーからのHTTPリクエストを受付け、基本的な入力検証を実施します。

## 背景
すべての処理の起点となるため、不正なリクエストを早期に検出することが重要です。不正なデータが後続の処理に渡ると、エラーやセキュリティリスクが発生する可能性があります。

## 処理の流れ
1. Webhookでユーザーリクエスト受信
2. 必須フィールド（userId、query）の存在確認
3. データ型の検証
4. タイムスタンプの付与

## 達成したいこと
バリデーション済みの正規化されたデータを次のグループに渡し、後続処理がスムーズに実行できる状態にします。

## 次のステップ
→ データ変換グループへ（検証済みリクエストデータを渡す）
```

**出力例（G010の場合、AI Agentグループ）**:
```markdown
# 【グループG010: AI処理グループ】

## このグループに含まれるノード
📌 **AI Agent - User Query** (@n8n/n8n-nodes-langchain.agent)
📌 **Context Retrieval Tool** (@n8n/n8n-nodes-langchain.toolWorkflow)
📌 **Response Generator** (n8n-nodes-base.set)

## 目的
ユーザークエリに対してAI Agentが適切なツールを選択し、コンテキストを取得して高品質な回答を生成します。

## 背景
AIによる高品質な回答生成がワークフローの中核機能であり、慎重な設計が必要です。ユーザーの質問意図を正確に理解し、関連するコンテキストを取得することで、的確な回答を提供できます。

## 処理の流れ
1. AI Agentがユーザークエリを分析（Model: gpt-4o、Temperature: 0.7）
2. Context Retrieval Toolでベクトルデータベース検索を実行
3. 取得したコンテキストと合わせてAIが回答を生成
4. 回答の信頼度スコア計算（0-1の範囲）

## 達成したいこと
ユーザークエリに対する正確で有用な回答を生成し、顧客満足度の向上に貢献します。

## 次のステップ
→ 回答整形グループへ（AI生成回答と信頼度スコアを渡す）
```

**出力例（E001の場合、エラーグループ）**:
```markdown
# 【グループE001: 入力エラー処理グループ】

## このグループに含まれるノード
📌 **Error Logger** (n8n-nodes-base.postgres)
📌 **Error Notification** (n8n-nodes-base.slack)
📌 **Default Response** (n8n-nodes-base.webhook)

## 目的
入力検証エラーが発生した場合にエラーを記録し、通知を送信し、ユーザーに適切なエラーメッセージを返します。

## 背景
不正なリクエストや必須フィールドの欠落などのエラーは、早期に検出して適切に処理する必要があります。エラーの詳細をログに記録することで、後から原因を分析できます。

## 処理の流れ
1. エラー詳細をデータベースにログ記録
2. 開発チームにSlack通知を送信
3. ユーザーに「リクエストが無効です」というエラーメッセージを返却
4. エラー統計を更新

## 達成したいこと
エラーを適切に処理し、ユーザーには分かりやすいエラーメッセージを返し、開発チームには詳細な情報を提供します。

## 次のステップ
→ 処理終了（エラーレスポンスを返却後、ワークフロー終了）
```

---

### ステップ5: Sticky Note JSONへの適用

**目的**: 生成したコンテンツを各Sticky Nodeのparameters.contentに設定

**処理内容**:

1. **パターン1 Sticky Noteの追加**
   ```javascript
   const overviewSticky = {
     "id": generateUUID(),
     "name": "Sticky Note - ワークフロー全体フロー",
     "type": "n8n-nodes-base.stickyNote",
     "typeVersion": 1,
     "position": [100, 50],
     "parameters": {
       "content": overviewContent,
       "height": 600,
       "width": 700,
       "color": 7
     }
   };

   // ワークフローJSONのnodesの先頭に追加
   workflow.nodes.unshift(overviewSticky);
   ```

2. **パターン2 Sticky Notesの更新/追加**
   ```javascript
   // 既存のSticky Noteを更新
   workflow.nodes.forEach(node => {
     if (node.type === "@n8n/n8n-nodes-base.stickyNote" &&
         node._comment && node._comment.group) {
       const groupId = node._comment.group;
       const groupInfo = groupsInfo[groupId];
       node.parameters.content = generateGroupSticky(groupInfo);
       node.parameters.height = 350;
       node.parameters.width = 500;
       node.parameters.color = groupId.startsWith('E') ? 5 : null;
     }
   });

   // 新規Sticky Noteを追加（既存がない場合）
   Object.keys(groupsInfo).forEach(groupId => {
     const existingSticky = workflow.nodes.find(
       n => n.type === "@n8n/n8n-nodes-base.stickyNote" &&
            n._comment?.group === groupId
     );

     if (!existingSticky) {
       const newSticky = {
         "id": generateUUID(),
         "name": `Sticky Note - ${groupsInfo[groupId].groupName}`,
         "type": "n8n-nodes-base.stickyNote",
         "typeVersion": 1,
         "position": groupPositions[groupId], // Step170から取得
         "parameters": {
           "content": generateGroupSticky(groupsInfo[groupId]),
           "height": 350,
           "width": 500,
           "color": groupId.startsWith('E') ? 5 : null
         },
         "_comment": {
           "group": groupId,
           "purpose": "グループドキュメント"
         }
       };
       workflow.nodes.push(newSticky);
     }
   });
   ```

---

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
   - サイズ: 700px × 600px
   - 色: 7（薄ピンク）

2. **パターン2（グループごと）**: 35個
   - メインフローグループ: 30個（G001-G030）
   - エラーフローグループ: 5個（E001-E005）
   - サイズ: 500px × 350px
   - 色: メインフロー=デフォルト、エラーフロー=5（薄赤）

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
- **サイズ**: 700px × 600px
- **色**: 7（薄ピンク）
- **内容**: ワークフロー名、全ノードリスト（87個）、目的、背景、全体の流れ、達成したいこと

### パターン2: グループごと

#### G001: 入力受付グループ
- **配置**: [100, -50]
- **サイズ**: 500px × 350px
- **色**: デフォルト
- **ノード数**: 2
- **内容**: Webhook受付と入力検証

#### G010: AI処理グループ
- **配置**: [100, 850]
- **サイズ**: 500px × 350px
- **色**: デフォルト
- **ノード数**: 3
- **内容**: AI Agent処理とコンテキスト取得

#### E001: 入力エラー処理グループ
- **配置**: [1900, -50]
- **サイズ**: 500px × 350px
- **色**: 5（薄赤）
- **ノード数**: 3
- **内容**: エラーログ記録と通知

（以下、全Sticky Noteの情報を記載）
```

---

## 初回質問

Step180を開始する前に、以下を確認させてください:

### 1. 入力ファイルの確認

**質問**: Step170で出力された配置最適化済みワークフローJSONファイルのパスを教えてください。

**回答例**:
```
ファイルパス: ./output/optimized_workflow.json
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

Step180完了後、最終ステップに進みます:

1. **Step190: 最終出力**
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
  "height": 600,
  "width": 700,
  "color": 7
})

// パターン2（グループごと）検証
validate_node_minimal("nodes-base.stickyNote", {
  "height": 350,
  "width": 500,
  "color": 1  // またはエラーグループの場合は 5
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
    "height": 600,
    "width": 700,
    "backgroundColor": 7  // ← 間違い
  }
}

// ✅ 正しい
{
  "parameters": {
    "content": "...",
    "height": 600,
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
    "height": 600,
    "width": 700
    // color が欠落
  }
}
```

**n8n-MCP検証結果**:
```javascript
validate_node_minimal("nodes-base.stickyNote", {"height": 600, "width": 700})
→ {"valid": false, "missingRequiredFields": ["Color"]}
```

**対処法**: 必ず `color` を追加（デフォルト値: 1）

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
