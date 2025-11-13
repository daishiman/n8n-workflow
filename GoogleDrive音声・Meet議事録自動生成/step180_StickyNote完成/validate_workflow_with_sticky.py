import json
import sys

# ワークフローJSONを読み込み
with open('../step150_統合JSON/GoogleDrive音声Meet議事録自動生成_workflow_integrated_v4.json', 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# JSONをstdoutに出力（n8n-MCPに渡すため）
print(json.dumps(workflow, ensure_ascii=False))
