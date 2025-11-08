---
tags:
notetoolbar: srs
---

# Prompt 作成シート（汎用版）

## Next Action

- [x] 汎用的なフォーマットで設計シート作成
- [ ] ユーザーから業務要件をヒアリング
- [ ] タスク分解とワークフロー設計を実行
- [ ] JSON/Mermaid 形式で出力

## プロンプト名

**n8n 汎用ワークフロー自動設計エンジン - あらゆる業務を DX 化する**

## プロンプトの想定利用者

- あらゆる業務の自動化・DX 化を検討している人
- 業種・職種を問わず、反復作業を効率化したい人
- ローコードツール（n8n）でシステム構築したい非エンジニア〜エンジニア
- AI エージェントを活用したワークフロー構築に興味がある人

## プロンプト作成の目的

業務内容やドメインに依存せず、ユーザーの要件を段階的に引き出し、適切な粒度でタスク分解を行い、n8n で実装可能な中規模ワークフロー（10-30 ノード）を自動設計すること。各ノードに AI エージェント（メタプロンプト）を配置可能な構造を提供する。

## プロンプト作成の背景

- 業務の種類は無限にあるが、ワークフローの「構造パターン」は有限
- タスクを適切な粒度に分解すれば、どんな業務もワークフロー化できる
- AI エージェントに丸投げせず、各ノードに専用エージェントを配置することで精度向上
- n8n の思想に基づいた設計により、実装ギャップを最小化

## 完了条件（成功基準）

以下がすべて満たされた状態：

1. ユーザーの業務要件が構造化されている
2. タスクが 10-30 ノードの適切な粒度に分解されている
3. 並列実行、ループ、条件分岐が適切に設計されている
4. n8n 互換の JSON 形式でワークフローが出力されている
5. Mermaid 図で視覚的に表現されている
6. 各ノードの AI エージェントの役割が明確に定義されている
7. データフロー、エラーハンドリング、認証が設計されている

## 目的達成のための手順

### Step1: 業務要件の構造化ヒアリング

ユーザーから以下を**業務ドメインに依存しない形**で引き出す：

1. **Input（入力）**: 何がトリガーになるか、どこからデータが来るか
2. **Process（処理）**: データをどう変換・判断・操作するか
3. **Output（出力）**: 最終的に何を生成するか、どこに送るか
4. **Conditions（条件）**: どんな場合分けがあるか
5. **Volume（規模）**: データ量、実行頻度
6. **Constraints（制約）**: セキュリティ、性能、コスト

### Step2: タスク分解フレームワークの適用

以下の汎用的なフレームワークでタスクを分解：

1. **トリガー層**: 何が起点か（時間/イベント/手動）
2. **取得層**: データをどこから取得するか
3. **検証層**: データは正しいか
4. **変換層**: データをどう加工するか
5. **判断層**: 条件分岐はどこか
6. **実行層**: 実際のアクションは何か
7. **統合層**: 複数データをどう結合するか
8. **出力層**: 結果をどこに送るか
9. **記録層**: ログ・履歴をどう保存するか

### Step3: ワークフローパターンの適用

タスクの依存関係から以下を判定：

- **Sequential（直列）**: A → B → C
- **Parallel（並列）**: A → [B, C, D] → Merge
- **Loop（ループ）**: A → [B → C] × N 回 → D
- **Conditional（条件分岐）**: A → 判定 → [B or C or D] → Merge
- **Hybrid（複合）**: 上記の組み合わせ

### Step4: n8n 設計への変換

n8n の思想に基づき最適化：

- データ構造（配列形式）の設計
- 適切なノードタイプの選定
- Expression（式）の設計
- エラーハンドリングの実装
- 認証・セキュリティの考慮

### Step5: AI エージェント配置戦略

各ノードに対して：

- AI が必要か不要かを判定
- 必要な場合、役割を明確化
- 必要なコンテキスト情報を定義
- 入出力形式を規定

### Step6: JSON/Mermaid 生成

実装可能な形式で出力

## 出力フォーマット

### Step1: 業務要件サマリー

```markdown
# 業務要件定義書

## 1. 業務概要

**業務名**: {{業務名}}
**目的**: {{この業務で達成したいこと}}
**現状の課題**: {{なぜ自動化が必要か}}

## 2. Input（入力）

### トリガー

- **種類**: {{Schedule/Webhook/Polling/Manual/Other}}
- **条件**: {{具体的な実行条件}}
- **頻度**: {{実行頻度}}

### データソース

| ソース名    | 種類                | 認証         | データ形式       | データ量        |
| ----------- | ------------------- | ------------ | ---------------- | --------------- |
| {{ソース1}} | {{API/DB/File/etc}} | {{認証方式}} | {{JSON/CSV/etc}} | {{件数/サイズ}} |
| {{ソース2}} | {{種類}}            | {{認証方式}} | {{形式}}         | {{規模}}        |

## 3. Process（処理）

### 主要な処理ステップ

1. {{処理1の説明}}
2. {{処理2の説明}}
3. {{処理3の説明}}

### 条件分岐

| 条件      | 真の場合  | 偽の場合  |
| --------- | --------- | --------- |
| {{条件1}} | {{処理A}} | {{処理B}} |
| {{条件2}} | {{処理C}} | {{処理D}} |

### ループ処理

- **対象**: {{何を繰り返すか}}
- **条件**: {{いつまで繰り返すか}}
- **バッチサイズ**: {{一度に処理する件数}}

## 4. Output（出力）

### 最終成果物

| 出力先      | 形式     | 内容     | 頻度     |
| ----------- | -------- | -------- | -------- |
| {{出力先1}} | {{形式}} | {{内容}} | {{頻度}} |
| {{出力先2}} | {{形式}} | {{内容}} | {{頻度}} |

### 通知

- **成功時**: {{通知先と内容}}
- **エラー時**: {{通知先と内容}}

## 5. Constraints（制約）

- **セキュリティ**: {{機密情報の扱い、認証要件}}
- **性能**: {{処理時間、レート制限}}
- **依存関係**: {{他システムとの連携制約}}
- **コスト**: {{API呼び出し上限など}}

## 6. データ規模

- **1 回の処理件数**: {{件数}}
- **実行頻度**: {{頻度}}
- **ピーク時の負荷**: {{最大負荷}}
```

### Step2: タスク分解結果（JSON 形式）

```json
{
  "workflow_metadata": {
    "name": "{{ワークフロー名}}",
    "description": "{{説明}}",
    "domain": "{{業務ドメイン}}",
    "complexity": "medium",
    "estimated_nodes": {{10-30の数値}},
    "estimated_execution_time": "{{予想実行時間}}",
    "version": "1.0"
  },

  "task_breakdown": [
    {
      "task_id": "{{T001}}",
      "task_name": "{{タスク名}}",
      "layer": "{{trigger/fetch/validate/transform/decision/action/merge/output/log}}",
      "description": "{{詳細説明}}",
      "node_type": "{{n8n-nodes-base.xxx}}",
      "execution_mode": "{{sequential/parallel/loop}}",
      "dependencies": ["{{依存タスクID}}"],
      "estimated_processing_time": "{{秒}}",

      "ai_agent": {
        "required": {{true/false}},
        "role": "{{AIエージェントの役割}}",
        "complexity": "{{low/medium/high}}",
        "context_requirements": [
          "{{必要なコンテキスト1}}",
          "{{必要なコンテキスト2}}"
        ],
        "meta_prompt_category": "{{data_extraction/validation/transformation/analysis/generation/routing}}",
        "input_schema": {
          "type": "{{データ型}}",
          "structure": "{{構造の説明}}"
        },
        "output_schema": {
          "type": "{{データ型}}",
          "structure": "{{構造の説明}}"
        }
      },

      "data_flow": {
        "input": {
          "source": "{{前のノードID}}",
          "format": "{{データ形式}}",
          "validation": "{{検証ルール}}"
        },
        "output": {
          "format": "{{データ形式}}",
          "target": ["{{次のノードID}}"]
        }
      },

      "error_handling": {
        "strategy": "{{stop/continue/retry}}",
        "retry_count": {{数値}},
        "retry_interval": {{秒}},
        "fallback_action": "{{フォールバック処理}}"
      },

      "authentication": {
        "required": {{true/false}},
        "type": "{{OAuth2/API_Key/Basic/None}}",
        "credential_name": "{{認証情報名}}"
      }
    }
  ],

  "workflow_patterns": {
    "parallel_groups": [
      {
        "group_id": "{{P001}}",
        "description": "{{並列処理の説明}}",
        "tasks": ["{{T002}}", "{{T003}}", "{{T004}}"],
        "merge_strategy": "{{append/combine/match}}",
        "merge_node": "{{T005}}"
      }
    ],

    "loop_groups": [
      {
        "loop_id": "{{L001}}",
        "description": "{{ループ処理の説明}}",
        "tasks": ["{{T006}}", "{{T007}}"],
        "batch_size": {{数値}},
        "max_iterations": {{数値}},
        "exit_condition": "{{終了条件}}"
      }
    ],

    "conditional_branches": [
      {
        "branch_id": "{{B001}}",
        "decision_node": "{{T008}}",
        "branches": [
          {
            "condition": "{{条件式}}",
            "tasks": ["{{T009}}", "{{T010}}"],
            "label": "{{ブランチ名}}"
          },
          {
            "condition": "{{条件式}}",
            "tasks": ["{{T011}}"],
            "label": "{{ブランチ名}}"
          }
        ],
        "merge_node": "{{T012}}"
      }
    ]
  },

  "data_structures": {
    "main_data_model": {
      "description": "{{メインデータモデルの説明}}",
      "schema": {
        "{{field1}}": "{{type}}",
        "{{field2}}": "{{type}}",
        "nested_object": {
          "{{field3}}": "{{type}}"
        }
      }
    },

    "intermediate_transformations": [
      {
        "stage": "{{T003}}",
        "transformation": "{{変換内容}}",
        "schema": {
          "{{field1}}": "{{type}}"
        }
      }
    ]
  },

  "performance_considerations": {
    "rate_limits": [
      {
        "service": "{{サービス名}}",
        "limit": "{{制限値}}",
        "strategy": "{{対応策}}"
      }
    ],
    "batching_strategy": "{{バッチ処理の戦略}}",
    "caching_strategy": "{{キャッシュ戦略}}"
  }
}
```

### Step3: n8n ワークフロー設計（JSON 形式）

```json
{
  "name": "{{ワークフロー名}}",
  "nodes": [
    {
      "parameters": {
        "{{param1}}": "{{value1}}",
        "{{param2}}": "{{value2}}"
      },
      "id": "{{uuid}}",
      "name": "{{ノード表示名}}",
      "type": "{{n8n-nodes-base.xxx}}",
      "typeVersion": 1,
      "position": [{{x}}, {{y}}],
      "credentials": {
        "{{credentialType}}": {
          "id": "{{credentialId}}",
          "name": "{{credentialName}}"
        }
      },
      "onError": "{{continueRegularOutput/continueErrorOutput/stopWorkflow}}",
      "retryOnFail": {{true/false}},
      "maxTries": {{数値}},
      "waitBetweenTries": {{秒}},
      "alwaysOutputData": {{true/false}},
      "notes": "{{ノードの説明とAIエージェントの役割}}"
    }
  ],
  "connections": {
    "{{NodeName1}}": {
      "main": [
        [
          {
            "node": "{{NodeName2}}",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "saveExecutionProgress": true,
    "timezone": "Asia/Tokyo"
  },
  "staticData": null,
  "tags": ["{{tag1}}", "{{tag2}}"],
  "pinData": {},
  "versionId": "{{uuid}}"
}
```

### Step4: Mermaid 図

```mermaid
graph TB
    subgraph "トリガー層"
        T001[{{トリガー名}}<br/>📍 {{種類}}]:::trigger
    end

    subgraph "取得・検証層"
        T002[{{データ取得1}}<br/>🤖 AI: {{役割}}]:::fetch
        T003[{{データ取得2}}<br/>🤖 AI: {{役割}}]:::fetch
        T004[{{データ検証}}<br/>🤖 AI: {{役割}}]:::validate
    end

    subgraph "変換・判断層"
        T005[{{データ変換}}<br/>🤖 AI: {{役割}}]:::transform
        T006{{{条件分岐}}}<br/>📊 {{条件}}]:::decision
    end

    subgraph "並列実行ブロック P001"
        T007[{{処理A}}<br/>🤖 AI: {{役割}}]:::action
        T008[{{処理B}}<br/>🤖 AI: {{役割}}]:::action
        T009[{{処理C}}<br/>🤖 AI: {{役割}}]:::action
    end

    subgraph "ループ処理 L001"
        T010[{{バッチ分割}}<br/>📦 Batch: {{サイズ}}]:::loop
        T011[{{個別処理}}<br/>🤖 AI: {{役割}}]:::action
        T012[{{集約}}<br/>🤖 AI: {{役割}}]:::merge
    end

    subgraph "出力・記録層"
        T013[{{結果出力}}<br/>🤖 AI: {{役割}}]:::output
        T014[{{ログ記録}}<br/>💾 {{保存先}}]:::log
        T015[{{通知}}<br/>📢 {{通知先}}]:::notify
    end

    T001 --> T002
    T001 --> T003
    T002 --> T004
    T003 --> T004
    T004 --> T005
    T005 --> T006

    T006 -->|条件A| T007
    T006 -->|条件B| T008
    T006 -->|条件C| T009

    T007 --> T010
    T008 --> T010
    T009 --> T010

    T010 --> T011
    T011 --> T012
    T012 -->|Next Batch| T010
    T012 -->|Complete| T013

    T013 --> T014
    T013 --> T015

    T002 -.エラー.-> Error[エラーハンドリング<br/>🚨]:::error
    T004 -.エラー.-> Error
    T011 -.エラー.-> Error

    Error --> ErrorNotify[エラー通知<br/>📧]:::error

    classDef trigger fill:#90EE90,stroke:#2d5016,stroke-width:3px,color:#000
    classDef fetch fill:#87CEEB,stroke:#104e8b,stroke-width:2px,color:#000
    classDef validate fill:#FFB6C1,stroke:#8b2252,stroke-width:2px,color:#000
    classDef transform fill:#DDA0DD,stroke:#68228b,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#8b7500,stroke-width:3px,color:#000
    classDef action fill:#98FB98,stroke:#2e8b57,stroke-width:2px,color:#000
    classDef loop fill:#FFA07A,stroke:#8b3626,stroke-width:2px,color:#000
    classDef merge fill:#B0C4DE,stroke:#27408b,stroke-width:2px,color:#000
    classDef output fill:#F0E68C,stroke:#8b864e,stroke-width:2px,color:#000
    classDef log fill:#D3D3D3,stroke:#4a4a4a,stroke-width:2px,color:#000
    classDef notify fill:#FFDAB9,stroke:#8b7355,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#8b0000,stroke-width:3px,color:#fff
```

### Step5: AI エージェント配置マップ

```json
{
  "ai_agent_deployment": {
    "total_nodes": {{10-30}},
    "ai_enabled_nodes": {{数値}},
    "ai_coverage": "{{割合}}%",

    "agent_by_category": {
      "data_extraction": [
        {
          "node_id": "{{T002}}",
          "role": "{{役割}}",
          "complexity": "{{low/medium/high}}",
          "meta_prompt_template": "{{テンプレート種類}}"
        }
      ],
      "validation": [
        {
          "node_id": "{{T004}}",
          "role": "{{役割}}",
          "complexity": "{{low/medium/high}}",
          "meta_prompt_template": "{{テンプレート種類}}"
        }
      ],
      "transformation": [
        {
          "node_id": "{{T005}}",
          "role": "{{役割}}",
          "complexity": "{{low/medium/high}}",
          "meta_prompt_template": "{{テンプレート種類}}"
        }
      ],
      "analysis": [
        {
          "node_id": "{{T006}}",
          "role": "{{役割}}",
          "complexity": "{{low/medium/high}}",
          "meta_prompt_template": "{{テンプレート種類}}"
        }
      ],
      "generation": [
        {
          "node_id": "{{T008}}",
          "role": "{{役割}}",
          "complexity": "{{low/medium/high}}",
          "meta_prompt_template": "{{テンプレート種類}}"
        }
      ]
    },

    "context_flow": [
      {
        "from_node": "{{T002}}",
        "to_node": "{{T004}}",
        "context_passed": ["{{コンテキスト1}}", "{{コンテキスト2}}"],
        "importance": "{{critical/important/optional}}"
      }
    ],

    "notes": "各ノードのメタプロンプトは別途設計が必要"
  }
}
```

### Step6: 実装ガイド

```markdown
# 実装ガイド

## 1. 事前準備

### 必要な認証情報

- [ ] {{サービス1}}: {{認証方式}}
- [ ] {{サービス2}}: {{認証方式}}
- [ ] {{サービス3}}: {{認証方式}}

### n8n 環境設定

- タイムゾーン: Asia/Tokyo
- 実行順序: v1
- 手動実行の保存: 有効
- 実行進捗の保存: 有効

## 2. デプロイ手順

1. n8n に認証情報を登録
2. JSON ワークフローをインポート
3. 各ノードの接続を確認
4. テストデータで手動実行
5. エラーハンドリングを確認
6. 本番データで検証
7. トリガーを有効化

## 3. AI エージェント実装

各ノードのメタプロンプトを以下の順で実装：

1. データ検証ノード（{{T004}}）
2. データ変換ノード（{{T005}}）
3. 分析ノード（{{T006}}）
4. 生成ノード（{{T008}}）

## 4. 監視設定

- Error Workflow の設定
- Discord 通知の設定
- ログ記録の確認
- パフォーマンスモニタリング

## 5. 最適化ポイント

- {{最適化項目1}}
- {{最適化項目2}}
- {{最適化項目3}}
```

## 解決すべき課題

- あらゆる業務ドメインに対応する汎用性
- タスク分解の粒度を 10-30 ノードに最適化
- 並列、ループ、条件分岐の複雑な組み合わせ
- n8n の実装制約との整合性
- AI エージェントの適切な配置判断
- API/DB/ストレージなど多様な連携先への対応
- エラーハンドリングの網羅性

## 目的を達成するために必要な情報

### ユーザーから引き出す情報（汎用）

- **Input**: 何がきっかけで処理が始まるか
- **Data Source**: データはどこから来るか（API/DB/File/Manual）
- **Processing Logic**: データをどう処理するか（変換/判断/集約）
- **Conditions**: どんな条件分岐があるか
- **Output**: 結果をどこに送るか
- **Volume**: データ量と実行頻度
- **Error Handling**: エラー時の対応方針

### システム連携情報

- **API**: エンドポイント、認証方式、レート制限
- **Database**: 種類（PostgreSQL/MySQL/MongoDB）、接続情報
- **Cloud Storage**: サービス（S3/GCS/Azure Blob/Google Drive）
- **Discord**: Webhook URL、通知チャンネル
- **その他**: 連携先システムの仕様

### n8n 実装情報

- ノードタイプの選定根拠
- データ構造（常に配列形式）
- Expression（式）の設計
- 認証情報の管理方法
- エラーハンドリング戦略

## 注意点・制約条件

- **中規模限定**: 10-30 ノードに収める（複雑すぎる場合はサブワークフロー化）
- **n8n 思想**: すべてのデータは配列形式
- **エラーハンドリング必須**: Error Workflow 設定
- **バッチ処理**: 大量データは必ず Split in Batches を使用
- **レート制限**: API 呼び出しに遅延を追加
- **認証**: 環境変数で管理、ハードコード禁止
- **タイムゾーン**: Asia/Tokyo で統一
- **ノード命名**: 役割が明確にわかる名前
- **AI エージェント**: メタプロンプトは別途設計（今回は役割定義のみ）

## プロンプトに対する課題

- 業務ドメインの多様性への対応
- タスク分解の粒度判断の自動化
- n8n 全ノードタイプへの知識網羅
- 複雑なフローの最適化ロジック
- ユーザーの技術レベルへの適応

---

## 想定するユーザー入力 1

```
毎日データベースから顧客データを取得して、Discordに分析レポートを送信したい
```

## 期待される出力 1

```json
{
  "workflow_metadata": {
    "name": "日次顧客データ分析レポート自動送信",
    "complexity": "medium",
    "estimated_nodes": 12
  },
  "task_breakdown": [
    {
      "task_id": "T001",
      "task_name": "スケジュールトリガー",
      "layer": "trigger",
      "node_type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "task_id": "T002",
      "task_name": "DB接続・データ取得",
      "layer": "fetch",
      "node_type": "n8n-nodes-base.postgres",
      "ai_agent": { "required": false }
    },
    {
      "task_id": "T003",
      "task_name": "データ検証",
      "layer": "validate",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": { "required": true, "role": "データ品質チェックと異常検知" }
    },
    {
      "task_id": "T004",
      "task_name": "データクレンジング",
      "layer": "transform",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": { "required": true, "role": "欠損値補完と異常値処理" }
    },
    {
      "task_id": "T005",
      "task_name": "統計分析",
      "layer": "transform",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": { "required": true, "role": "トレンド分析と指標計算" }
    },
    {
      "task_id": "T006",
      "task_name": "インサイト生成",
      "layer": "action",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": {
        "required": true,
        "role": "ビジネスインサイトと推奨アクションの生成"
      }
    },
    {
      "task_id": "T007",
      "task_name": "レポート作成",
      "layer": "action",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": {
        "required": true,
        "role": "視覚的なレポートフォーマット生成"
      }
    },
    {
      "task_id": "T008",
      "task_name": "Discord送信",
      "layer": "output",
      "node_type": "n8n-nodes-base.discord",
      "ai_agent": { "required": false }
    },
    {
      "task_id": "T009",
      "task_name": "結果記録",
      "layer": "log",
      "node_type": "n8n-nodes-base.postgres"
    }
  ]
}
```

---

## 想定するユーザー入力 2

```
APIで注文データを受け取ったら、在庫確認して、在庫があれば承認、なければ仕入れ先APIに発注したい
```

## 期待される出力 2

```json
{
  "workflow_metadata": {
    "name": "注文自動処理＆在庫連動システム",
    "complexity": "medium",
    "estimated_nodes": 15
  },
  "workflow_patterns": {
    "conditional_branches": [
      {
        "branch_id": "B001",
        "decision_node": "T004",
        "branches": [
          { "condition": "在庫あり", "tasks": ["T005", "T006"] },
          { "condition": "在庫なし", "tasks": ["T007", "T008", "T009"] }
        ]
      }
    ]
  }
}
```

---

## 想定するユーザー入力 3

```
複数のクラウドストレージから毎時ファイルを取得して、内容を解析してデータベースに保存したい
```

## 期待される出力 3

```json
{
  "workflow_patterns": {
    "parallel_groups": [
      {
        "group_id": "P001",
        "tasks": ["T002", "T003", "T004"],
        "merge_strategy": "append"
      }
    ],
    "loop_groups": [
      {
        "loop_id": "L001",
        "tasks": ["T006", "T007"],
        "batch_size": 50
      }
    ]
  }
}
```

---

## 想定するユーザー入力 4

```
Discord Botでコマンドを受け取ったら、外部APIを複数呼び出して結果を集約して返信したい
```

## 期待される出力 4

```json
{
  "task_breakdown": [
    { "task_id": "T001", "node_type": "n8n-nodes-base.webhook" },
    {
      "task_id": "T002",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": { "required": true, "role": "コマンドパース" }
    },
    { "task_id": "T003", "node_type": "n8n-nodes-base.httpRequest" },
    { "task_id": "T004", "node_type": "n8n-nodes-base.httpRequest" },
    { "task_id": "T005", "node_type": "n8n-nodes-base.merge" },
    {
      "task_id": "T006",
      "node_type": "n8n-nodes-base.code",
      "ai_agent": { "required": true, "role": "結果統合と要約生成" }
    },
    { "task_id": "T007", "node_type": "n8n-nodes-base.discord" }
  ]
}
```

---

## 想定するユーザー入力 5

```
毎週月曜日に複数のデータベースとAPIからデータを集めて、比較分析してレポートをメールとDiscordに送りたい
```

## 期待される出力 5

```json
{
  "workflow_metadata": {
    "name": "週次マルチソースデータ比較分析レポート",
    "complexity": "medium",
    "estimated_nodes": 18
  },
  "workflow_patterns": {
    "parallel_groups": [
      {
        "group_id": "P001",
        "description": "複数ソースからの並列データ取得",
        "tasks": ["T002", "T003", "T004", "T005"]
      },
      {
        "group_id": "P002",
        "description": "レポート並列配信",
        "tasks": ["T012", "T013"]
      }
    ]
  }
}
```

---

これで、**どのような業務にも対応できる汎用的なプロンプト設計シート**が完成しました。

次に、この設計シートをベースに**実際に使用する完全なプロンプト（実行用）**を作成しましょうか？それとも、この設計シートに対して追加・修正のご要望はありますか？
