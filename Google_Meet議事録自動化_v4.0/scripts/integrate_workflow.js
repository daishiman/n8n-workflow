#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('=== ワークフロー統合処理開始 ===\n');

// グループJSONファイルのパス
const groupFiles = [
  { path: 'step070_Group1_JSON/Group1_トリガー&ファイル取得.json', name: 'Group 1' },
  { path: 'step072_Group2_JSON/Group2_バリデーション.json', name: 'Group 2' },
  { path: 'step074_Group3_JSON/Group3_Gemini音声文字起こし.json', name: 'Group 3' },
  { path: 'step076_Group4_JSON/Group4_チャンク分割.json', name: 'Group 4' },
  { path: 'step078_Group5_JSON/Group5_チャンク並列処理.json', name: 'Group 5' },
  { path: 'step080_Group6_JSON/Group6_チャンク統合.json', name: 'Group 6' },
  { path: 'step082_Group7_JSON/Group7_議題抽出.json', name: 'Group 7' },
  { path: 'step084_Group8_JSON/Group8_議題データ再構成.json', name: 'Group 8' },
  { path: 'step086_Group9_JSON/Group9_議題並列処理.json', name: 'Group 9' },
  { path: 'step088_Group10_JSON/Group10_議題統合とフォーマット変換.json', name: 'Group 10' },
  { path: 'step090_Group11_JSON/Group11_品質保証と議事録保存.json', name: 'Group 11' },
  { path: 'step092_Group12_JSON/Group12_ファイル移動と通知.json', name: 'Group 12' },
  { path: 'step094_ErrorGroup1_JSON/ErrorGroup1_エラーハンドリング.json', name: 'Error Group 1' }
];

// すべてのノードと接続を統合
let allNodes = [];
let allConnections = {};

groupFiles.forEach(({ path: filePath, name }) => {
  try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // ノードを追加
    allNodes = allNodes.concat(workflow.nodes);

    // 接続を追加
    Object.assign(allConnections, workflow.connections);

    console.log(`✅ ${name}: ${workflow.nodes.length}ノード読み込み`);
  } catch (error) {
    console.log(`❌ ${name}: エラー - ${error.message}`);
  }
});

console.log(`\n📊 総ノード数: ${allNodes.length}`);
console.log(`📊 グループ内接続数: ${Object.keys(allConnections).length}\n`);

// グループ間接続を追加
console.log('🔗 グループ間接続を追加中...\n');

const interGroupConnections = [
  // Group 1 → Group 2
  { from: 'Google Drive: M4Aダウンロード', to: 'IF: ファイル検証', output: 0 },

  // Group 2 → Group 3 (True path)
  { from: 'IF: ファイル検証', to: 'Gemini: 音声文字起こし (Step0)', output: 0 },

  // Group 2 → Error Group 1 (False path)
  { from: 'IF: ファイル検証', to: 'Error Trigger: ファイル検証失敗', output: 1 },

  // Group 3 → Group 4
  { from: 'Code: 文字起こし結果パース', to: 'Code: チャンク分割', output: 0 },

  // Group 4 → Group 5
  { from: 'Code: チャンク分割', to: 'Split in Batches: チャンク並列処理', output: 0 },

  // Group 5 → Group 6 (Merge loop)
  { from: 'Code: Step1結果パース', to: 'Merge: チャンク統合', output: 0 },

  // Group 6 → Group 7
  { from: 'Merge: チャンク統合', to: 'Gemini: 議題抽出 (Step2 + Memory)', output: 0 },

  // Group 7 → Group 8
  { from: 'Code: Step2結果パース', to: 'Code: 議題データ再構成', output: 0 },

  // Group 8 → Group 9
  { from: 'Code: 議題データ再構成', to: 'Split in Batches: 議題並列処理', output: 0 },

  // Group 9 → Group 10 (Merge loop)
  { from: 'Code: Step3結果パース', to: 'Merge: 議題統合', output: 0 },

  // Group 10 → Group 11
  { from: 'Code: Step4結果パース', to: 'Claude: 品質保証 (Step5 + Memory)', output: 0 },

  // Group 11 → Group 12
  { from: 'Google Drive: 議事録保存', to: 'Google Drive: M4Aを/processed/に移動', output: 0 }
];

interGroupConnections.forEach(({ from, to, output }) => {
  if (!allConnections[from]) {
    allConnections[from] = { main: [] };
  }
  if (!allConnections[from].main[output]) {
    allConnections[from].main[output] = [];
  }
  allConnections[from].main[output].push({
    node: to,
    type: 'main',
    index: 0
  });
  console.log(`  ${from} → ${to} (output: ${output})`);
});

console.log(`\n📊 総接続数: ${Object.keys(allConnections).length}\n`);

// 統合ワークフローJSONを作成
const integratedWorkflow = {
  name: 'Google Meet議事録自動化システム',
  nodes: allNodes,
  connections: allConnections,
  settings: {
    executionOrder: 'v1'
  },
  tags: [
    { id: '1', name: 'v4.0' },
    { id: '2', name: 'auto-generated' },
    { id: '3', name: 'meeting-minutes' },
    { id: '4', name: 'ai-agent-nodes' }
  ],
  meta: {
    templateCredsSetupCompleted: true,
    instanceId: 'n8n-local'
  }
};

// 統合JSONを保存
const outputPath = 'step150_統合JSON/Google_Meet議事録自動化システム_workflow_integrated_v4.json';
fs.writeFileSync(outputPath, JSON.stringify(integratedWorkflow, null, 2), 'utf8');

console.log('✅ 統合ワークフローJSON生成完了\n');
console.log(`📁 出力ファイル: ${outputPath}`);
console.log(`📊 総ノード数: ${allNodes.length}`);
console.log(`📊 総接続数: ${Object.keys(allConnections).length}`);
console.log(`📊 タグ: v4.0, auto-generated, meeting-minutes, ai-agent-nodes\n`);

// ワークフローメタデータを更新
console.log('📝 ワークフローメタデータを更新中...\n');

const metadataPath = 'step190_最終成果物/workflow_metadata.json';
if (fs.existsSync(metadataPath)) {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // AI Agent Nodeの数をカウント
  const aiAgentNodeCount = allNodes.filter(n => n.type === '@n8n/n8n-nodes-langchain.agent').length;

  // ノード数とAI Agent Node数を更新
  metadata.statistics.total_nodes = allNodes.length;
  metadata.statistics.ai_agent_nodes = aiAgentNodeCount;
  metadata.version = 'v4.0 (AI Agent Nodes)';

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`✅ メタデータ更新完了`);
  console.log(`   AI Agent Node数: ${aiAgentNodeCount}`);
  console.log(`   総ノード数: ${allNodes.length}`);
  console.log(`   総接続数: ${Object.keys(allConnections).length}\n`);
}

console.log('=== ワークフロー統合処理完了 ===');
