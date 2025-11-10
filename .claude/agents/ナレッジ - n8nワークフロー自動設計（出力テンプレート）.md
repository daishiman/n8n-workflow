# n8nワークフロー自動設計 - 標準出力テンプレート

このドキュメントは、n8nワークフロー自動設計エージェント（step030, step070等）が使用する標準出力テンプレートを定義します。

## Step030: タスク分解 - 出力テンプレート

```json
{
  "workflow_metadata": {
    "name": "{{WORKFLOW_NAME}}",
    "total_nodes": {{TOTAL_NODE_COUNT}},
    "total_groups": {{TOTAL_GROUP_COUNT}},
    "ai_nodes": {{AI_NODE_COUNT}},
    "subnode_count": {{SUBNODE_COUNT}},
    "chat_model": "{{SELECTED_CHAT_MODEL}}",
    "estimated_time": "{{ESTIMATED_EXECUTION_TIME}}",
    "complexity": "{{WORKFLOW_COMPLEXITY}}",
    "data_volume": "{{EXPECTED_DATA_VOLUME}}"
  },
  "groups": [
    {
      "group_id": "{{GROUP_ID}}",
      "group_name": "{{GROUP_NAME}}",
      "group_purpose": "{{GROUP_PURPOSE}}",
      "group_description": "{{GROUP_DESCRIPTION}}",
      "sticky_note_color": {{STICKY_NOTE_COLOR}},
      "estimated_duration": "{{GROUP_ESTIMATED_DURATION}}",
      "execution_pattern": "{{sequential|parallel|loop|conditional}}",
      "tasks": [
        {
          "id": "{{TASK_ID}}",
          "name": "{{TASK_NAME}}",
          "description": "{{TASK_DESCRIPTION}}",
          "layer": "{{LAYER_TYPE}}",
          "node_type": "{{N8N_NODE_TYPE}}",
          "execution_mode": "{{EXECUTION_MODE}}",
          "dependencies": [{{DEPENDENCY_TASK_IDS}}],
          "ai_required": {{AI_REQUIRED_BOOLEAN}},
          "ai_responsibility": "{{AI_RESPONSIBILITY_IF_APPLICABLE}}",
          "estimated_duration": "{{TASK_DURATION}}",
          "data_transformation": "{{DATA_TRANSFORMATION_LOGIC}}",
          "error_handling": {
            "strategy": "{{ERROR_STRATEGY}}",
            "fallback": "{{FALLBACK_ACTION}}"
          },
          "subnodes": [
            {
              "subnode_id": "{{SUBNODE_ID}}",
              "subnode_name": "{{SUBNODE_NAME}}",
              "subnode_type": "{{SUBNODE_TYPE}}",
              "connection_type": "{{ai_languageModel|ai_memory|ai_outputParser|ai_tool}}",
              "parameters": {{SUBNODE_PARAMETERS}},
              "description": "{{SUBNODE_DESCRIPTION}}"
            }
          ]
        }
      ]
    }
  ],
  "group_connections": [
    {
      "from_group": "{{SOURCE_GROUP_ID}}",
      "to_group": "{{TARGET_GROUP_ID}}",
      "connection_description": "{{CONNECTION_DESCRIPTION}}",
      "data_flow": "{{DATA_FLOW_SUMMARY}}"
    }
  ]
}
```

## Step070: 完全JSON生成 - グループ別JSON構造

### 個別グループJSON構造

```json
{
  "name": "{{GROUP_NAME}} (Part of {{WORKFLOW_NAME}})",
  "nodes": [
    {
      "parameters": {
        "content": "📌 このグループに含まれるノード:\n- {{NODE_1_NAME}}\n- {{NODE_2_NAME}}\n\n目的: {{GROUP_PURPOSE}}\n背景: {{GROUP_DESCRIPTION}}\n処理の流れ: {{PROCESSING_FLOW}}",
        "height": 350,
        "width": 500,
        "color": {{STICKY_NOTE_COLOR}}
      },
      "id": "{{STICKY_UUID}}",
      "name": "Sticky Note - {{GROUP_NAME}}",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [{{X}}, {{Y}}]
    },
    {
      "parameters": {{NODE_PARAMETERS}},
      "id": "{{NODE_UUID}}",
      "name": "{{NODE_NAME}}",
      "type": "{{NODE_TYPE}}",
      "typeVersion": {{TYPE_VERSION}},
      "position": [{{X}}, {{Y}}],
      "credentials": {{CREDENTIALS}},
      "_comment": "{{COMMENT}}",
      "notes": "{{NOTES}}"
    }
  ],
  "connections": {
    "{{SOURCE_NODE_NAME}}": {
      "main": [[{"node": "{{TARGET_NODE_NAME}}", "type": "main", "index": 0}]],
      "ai_languageModel": [[{"node": "{{AI_AGENT_NAME}}", "type": "ai_languageModel", "index": 0}]]
    }
  }
}
```

### 統合ワークフローJSON構造

```json
{
  "name": "{{WORKFLOW_NAME}}",
  "nodes": [
    ...全グループのnodesを統合...
  ],
  "connections": {
    ...全グループのconnectionsをマージ + グループ間接続を追加...
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "saveExecutionProgress": true,
    "timezone": "Asia/Tokyo"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": {{TRIGGER_COUNT}},
  "updatedAt": "{{ISO_TIMESTAMP}}",
  "versionId": "1"
}
```

## workflow-temp.json との対応関係

| workflow-temp.json | step030出力 | step070出力 |
|-------------------|------------|------------|
| `workflow_structure.nodes[].group` | `groups[].group_name` | Sticky Note name |
| `workflow_structure.nodes[].pattern` | `groups[].execution_pattern` | グループ実行パターン |
| `workflow_structure.nodes[].nodes[]` | `groups[].tasks[]` | n8nノード |
| `workflow_structure.nodes[].nodes[].sub_nodes[]` | `tasks[].subnodes[]` | AI Agentサブノード |
| `connections.connection_types` | - | n8n connections構造 |
| `connections.pattern_examples` | - | 接続パターンガイド |

## ベストプラクティス

### 1. グループ設計

- **最小グループ数**: 3グループ（入力、処理、出力）
- **推奨グループ数**: 5-7グループ
- **最大グループ数**: 10グループ（これ以上は複雑化）

### 2. グループ間接続

- **明示的な定義**: `group_connections`配列で明確に定義
- **データフロー記述**: 各接続でやり取りされるデータを明記
- **検証可能性**: 接続の整合性をn8n-MCPで検証可能

### 3. AI Agent構造

- **必須サブノード**: Chat Model, Memory（最低2個）
- **推奨サブノード**: + Output Parser（構造化出力の場合）
- **オプション**: Tools（外部システム連携の場合）

### 4. Sticky Note設計

- **必須項目**: ノードリスト、目的、背景、処理の流れ
- **色分け**: グループごとに異なる色（1-7）
- **サイズ**: 幅500px、高さ350px（標準）
- **配置**: グループノードの左上（オフセット-100px程度）

---

**作成日**: 2025-01-09
**バージョン**: v1.0
**用途**: n8nワークフロー自動設計エージェントの標準出力フォーマット
