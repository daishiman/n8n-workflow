#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workflow = JSON.parse(fs.readFileSync('./step150_統合JSON/Google_Meet議事録自動化システム_workflow_integrated_v4.json', 'utf8'));

console.log('=== 接続確認: 孤立ノード検出 ===\n');

const allNodeNames = workflow.nodes.map(n => n.name);
const connectedNodes = new Set();

// connectionsで接続されているノード名を収集
Object.keys(workflow.connections || {}).forEach(sourceName => {
  connectedNodes.add(sourceName);
  const conn = workflow.connections[sourceName];
  if (conn.main) {
    conn.main.forEach(outputs => {
      outputs.forEach(output => {
        if (output && output.node) {
          connectedNodes.add(output.node);
        }
      });
    });
  }
});

// Sticky Noteを除く孤立ノードを検出
const orphanedNodes = workflow.nodes.filter(n =>
  !connectedNodes.has(n.name) && n.type !== 'n8n-nodes-base.stickyNote'
);

console.log(`総ノード数: ${workflow.nodes.length}`);
console.log(`Sticky Note数: ${workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote').length}`);
console.log(`接続されているノード数: ${connectedNodes.size}`);
console.log(`\n孤立ノード（Sticky Note除く）: ${orphanedNodes.length}個\n`);

if (orphanedNodes.length > 0) {
  console.log('【孤立ノードリスト】:');
  orphanedNodes.forEach((n, i) => {
    console.log(`  ${i+1}. ${n.name}`);
    console.log(`     type: ${n.type}`);
    console.log(`     id: ${n.id}`);
  });

  console.log('\n【修正が必要】');
} else {
  console.log('✅ 孤立ノードなし（すべて正しく接続されています）');
}
