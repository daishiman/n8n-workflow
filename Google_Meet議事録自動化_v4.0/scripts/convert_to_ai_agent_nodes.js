#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// AI Agent Node定義（各Stepごと）
const aiAgentConfigs = {
  // Step1: Gemini文字起こし整形
  step1: {
    type: "@n8n/n8n-nodes-langchain.agent",
    name: "Gemini: 文字起こし整形 (Step1)",
    systemPrompt: `あなたは文字起こし整形専門AIです。チャンク化された文字起こしテキストを受け取り、フィラー語を除去して箇条書き化します。

処理:
1. フィラー語除去（"えー"、"あのー"、"その"、"まあ"等）
2. 冗長な言い回しを簡潔化
3. line_id、speaker、timestampは維持
4. main_textのみ整形（overlapは参考情報）

入力: チャンクJSON（$json形式）
出力形式: JSON配列 lines[{line_id, content, speaker, timestamp, start_time, end_time}]`,
    modelType: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    modelName: "gemini-2.0-flash-exp",
    temperature: 0.4,
    maxTokens: 4000,
    memory: null
  },

  // Step2: Gemini議題抽出
  step2: {
    type: "@n8n/n8n-nodes-langchain.agent",
    name: "Gemini: 議題抽出 (Step2 + Memory)",
    systemPrompt: `あなたは会議議題抽出専門AIです。統合された文字起こしから会議の議題を自動抽出します。

処理:
1. 会話の流れを理解し、議題の区切りを検出
2. 各議題にタイトルを付与
3. 議題に該当する行番号を記録（line_idsフィールド）
4. 会議全体の名前を推測

出力形式（JSON）:
{
  "meeting_name": "会議名",
  "agendas": [
    {
      "agenda_id": 1,
      "title": "議題タイトル",
      "line_ids": [1, 2, 3, ..., 50]
    }
  ]
}`,
    modelType: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    modelName: "gemini-2.0-flash-exp",
    temperature: 0.4,
    maxTokens: 4000,
    memory: {
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      sessionKey: "step2_memory",
      contextWindowLength: 10
    }
  },

  // Step3: Gemini議題分析
  step3: {
    type: "@n8n/n8n-nodes-langchain.agent",
    name: "Gemini: 議題分析 (Step3)",
    systemPrompt: `あなたは議題分析専門AIです。議題ごとの文字起こしから決定事項・宿題・保留事項を抽出します。

処理:
1. 決定事項抽出（decisions）: 会議で決定されたこと
2. 宿題抽出（todos）: 誰が何をするか
3. 保留事項抽出（pending）: 未決定・次回持ち越し

出力形式（JSON）:
{
  "agenda_id": 1,
  "title": "議題タイトル",
  "decisions": ["決定1", "決定2"],
  "todos": [{"assignee": "担当者", "task": "タスク", "deadline": "期限"}],
  "pending": ["保留1", "保留2"]
}`,
    modelType: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    modelName: "gemini-2.0-flash-exp",
    temperature: 0.4,
    maxTokens: 4000,
    memory: null
  },

  // Step4: Claudeフォーマット変換
  step4: {
    type: "@n8n/n8n-nodes-langchain.agent",
    name: "Claude: フォーマット変換 (Step4 + Memory)",
    systemPrompt: `あなたはMarkdown議事録生成専門AIです。全データを統合し、業務要件定義書フォーマットのMarkdown議事録を生成します。

処理:
1. データ統合（meeting_name, agendas[]）
2. Markdown生成（見出し、箇条書き、表）
3. フォーマット適用

入力: JSON形式の全議題データ
出力: Markdown形式の議事録（業務要件定義書準拠）`,
    modelType: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
    modelName: "claude-sonnet-4-5-20250929",
    temperature: 0.7,
    maxTokens: 8000,
    memory: {
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      sessionKey: "step4_memory",
      contextWindowLength: 5
    }
  },

  // Step5: Claude品質保証
  step5: {
    type: "@n8n/n8n-nodes-langchain.agent",
    name: "Claude: 品質保証 (Step5 + Memory)",
    systemPrompt: `あなたは議事録品質保証専門AIです。生成された議事録の完全性を検証し、不足項目を補完します。

処理:
1. 完全性検証（全議題・決定事項・宿題が含まれているか）
2. 不足項目補完（元データと照合）
3. 警告生成（重要な欠落がある場合）

出力形式（JSON）:
{
  "markdown": "補完後のMarkdown",
  "warnings": ["警告1", "警告2"]
}`,
    modelType: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
    modelName: "claude-sonnet-4-5-20250929",
    temperature: 0.7,
    maxTokens: 8000,
    memory: {
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      sessionKey: "step5_memory",
      contextWindowLength: 5
    }
  }
};

// グループごとの処理設定
const groups = [
  { dir: 'step078_Group5_JSON', file: 'Group5_チャンク並列処理.json', oldId: 'http_request_gemini_step1', newId: 'ai_agent_gemini_step1', step: 'step1' },
  { dir: 'step082_Group7_JSON', file: 'Group7_議題抽出.json', oldId: 'http_request_gemini_step2', newId: 'ai_agent_gemini_step2', step: 'step2' },
  { dir: 'step086_Group9_JSON', file: 'Group9_議題並列処理.json', oldId: 'http_request_gemini_step3', newId: 'ai_agent_gemini_step3', step: 'step3' },
  { dir: 'step088_Group10_JSON', file: 'Group10_議題統合とフォーマット変換.json', oldId: 'http_request_claude_step4', newId: 'ai_agent_claude_step4', step: 'step4' },
  { dir: 'step090_Group11_JSON', file: 'Group11_品質保証と議事録保存.json', oldId: 'http_request_claude_step5', newId: 'ai_agent_claude_step5', step: 'step5' }
];

console.log('=== AI Agent Node置き換え処理開始 ===\n');

groups.forEach(({ dir, file, oldId, newId, step }) => {
  const filePath = path.join('./', dir, file);

  try {
    // JSONを読み取り
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // httpRequestノードを見つける
    const nodeIndex = workflow.nodes.findIndex(n => n.id === oldId);

    if (nodeIndex === -1) {
      console.log(`❌ ${file}: ${oldId} ノードが見つかりません`);
      return;
    }

    const oldNode = workflow.nodes[nodeIndex];
    const config = aiAgentConfigs[step];

    // AI Agent Nodeを作成
    const aiAgentNode = {
      id: newId,
      type: config.type,
      name: config.name,
      parameters: {
        agent: "conversationalAgent",
        promptType: "define",
        text: config.systemPrompt
      },
      typeVersion: 1.7,
      position: oldNode.position,
      _comment: `AI Agent Nodeに変換済み（旧: ${oldId}）`,
      notes: `Model: ${config.modelName}。Temperature: ${config.temperature}。Max Tokens: ${config.maxTokens}。${config.memory ? `Memory: ${config.memory.sessionKey}（Window: ${config.memory.contextWindowLength}）` : 'Memory: なし'}`,
      subnodes: {
        chatModel: {
          type: config.modelType,
          parameters: config.modelType.includes('Gemini') ? {
            modelName: config.modelName,
            options: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens
            }
          } : {
            model: config.modelName,
            options: {
              temperature: config.temperature,
              maxTokens: config.maxTokens
            }
          }
        },
        memory: config.memory ? {
          type: config.memory.type,
          parameters: {
            sessionKey: config.memory.sessionKey,
            contextWindowLength: config.memory.contextWindowLength
          }
        } : null,
        tools: []
      }
    };

    // ノードを置き換え
    workflow.nodes[nodeIndex] = aiAgentNode;

    // ファイルに書き込み
    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');

    console.log(`✅ ${file}: AI Agent Node置き換え完了`);
    console.log(`   旧ノード: ${oldId} → 新ノード: ${newId}`);
    console.log(`   Model: ${config.modelName}`);
    console.log(`   Memory: ${config.memory ? config.memory.sessionKey : 'なし'}\n`);

  } catch (error) {
    console.log(`❌ ${file}: エラー - ${error.message}\n`);
  }
});

console.log('=== AI Agent Node置き換え処理完了 ===');
