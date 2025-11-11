# AI設定書 (Step020)

## ワークフロー名
Google Meet議事録自動化システム

---

## 業務特性分析

### 全体的な業務特性

| 観点 | 評価 | 根拠（Step010より） |
|------|------|---------------------|
| 推論複雑度 | **複雑（多段階推論）** | 文字起こし → 整形 → 議題抽出 → 分析 → フォーマット変換 → 品質保証の6段階処理 |
| 入力データ量 | **大（10万文字超）** | 1時間会議の文字起こし = 約50,000-100,000文字（日本語） |
| 出力形式 | **構造化（Markdown + JSON）** | 構造化された議事録（Markdown）+ 中間処理でJSON形式 |
| リアルタイム性 | **数分許容** | 目標処理時間3分以内（文字起こし30-60秒 + AI処理2-3分） |
| 実行頻度 | **中頻度** | 1日1-3回、月間20-60回 |

### AI処理別の特性分析

| AI処理 | 推論複雑度 | 入力量 | 出力形式 | レスポンス要件 |
|-------|----------|--------|---------|--------------|
| **Gemini音声文字起こし（Step0）** | 中程度（音声認識） | M4Aファイル（最大1GB） | JSON配列 | 30-60秒 |
| **Gemini文字起こし整形（Step1）** | 低（フィラー除去） | 20-30行/チャンク | JSON配列 | 数秒/チャンク |
| **Gemini議題抽出（Step2）** | 高（会話の文脈理解） | 全文字起こし（50K-100K文字） | JSON配列 | 30秒以内 |
| **Gemini議題分析（Step3）** | 中程度（情報抽出） | 議題ごとの文字起こし | JSON配列 | 数秒/議題 |
| **Claudeフォーマット変換（Step4）** | 高（統合・構造化） | 全データ（100K文字超） | Markdown | 60-90秒 |
| **Claude品質保証（Step5）** | 高（検証・補完） | 議事録Markdown + 元データ | JSON + Markdown | 30-60秒 |

---

## AIモデル選定

### AI処理0: 音声文字起こし（Gemini）

**選定モデル**: **Google Gemini 2.0 Flash（ネイティブTranscribe）**

**選定理由**:
- **業務特性「M4A音声の日本語文字起こし」**に対して、Gemini 2.0 FlashのネイティブTranscribe機能が最適
- **処理時間50%短縮**: Deepgram APIと比較して30-60秒（従来60-120秒）
- **コスト70-85%削減**: Deepgram料金不要、Gemini APIのみで完結
- **認証情報の簡素化**: Gemini API Key 1つで音声文字起こし + AI処理を統合
- **Speaker Diarization**: プロンプトベース（speaker A, B, C等）で話者分離
- **Timestamps**: audioTimestamp=true で発言タイムスタンプを自動挿入
- **対応フォーマット**: audio/m4a, audio/mp3, audio/wav, audio/aac, audio/flac, audio/ogg
- **Max Duration**: 8.4時間（1 million tokens）

**コスト試算**:
- Gemini 2.0 Flash Thinking: 入力 $0.000075/1K tokens, 出力 $0.0003/1K tokens
- 1時間会議 ≈ 100K文字起こし ≈ 50K tokens（日本語）
- 1実行あたりコスト: $0.000075 × 50 = $0.00375 ≈ ¥0.6/実行
- 月間コスト（20回/月）: ¥0.6 × 20 = ¥12/月

**処理時間試算**:
- 平均レスポンス時間: 30-60秒/1時間会議
- 目標時間（非機能要件）: 60秒以内 → ✅ 満たす

**バックアップモデル**: なし（Gemini専用機能のため）
- 切り替え条件: Gemini APIエラー時はワークフロー全体をエラーハンドリング

---

### AI処理1: 文字起こし整形（Gemini）

**選定モデル**: **Google Gemini 2.0 Flash**

**選定理由**:
- **業務特性「フィラー語除去と箇条書き化」**に対して、シンプルな処理で高速レスポンスが必要
- **並列処理**: 5チャンク並列で処理するため、高速モデルが必須
- **コスト最適化**: Gemini 2.0 Flashは低コストで高速
- **日本語処理**: 日本語のフィラー語（「えー」「あのー」等）の除去に強い

**モデルパラメータ**:
```json
{
  "modelName": "gemini-2.0-flash-exp",
  "options": {
    "temperature": 0.4,
    "maxOutputTokens": 4000
  }
}
```

**Memory設定**: なし（並列処理のため、各チャンクは独立）

**コスト試算**:
- 1チャンクあたり: 入力500 tokens + 出力800 tokens = 1,300 tokens
- 12チャンク（300行の文字起こし）: 1,300 × 12 = 15,600 tokens
- 1実行あたりコスト: (500×12×$0.000075) + (800×12×$0.0003) = $0.00045 + $0.00288 = $0.00333 ≈ ¥0.5
- 月間コスト（20回/月）: ¥0.5 × 20 = ¥10/月

**処理時間試算**:
- 平均レスポンス時間: 3-5秒/チャンク
- 並列処理（5チャンク並列）: 5秒/バッチ × 3バッチ = 15秒
- 目標時間（非機能要件）: 30秒以内 → ✅ 満たす

**バックアップモデル**: Claude 3 Haiku
- 切り替え条件: Gemini APIエラー時、レート制限時

---

### AI処理2: 議題抽出（Gemini）

**選定モデル**: **Google Gemini 2.0 Flash**

**選定理由**:
- **業務特性「会話の流れから議題を自動抽出」**に対して、大規模コンテキスト処理が必要
- **大量データ処理**: 全文字起こし（50K-100K文字）を一度に処理
- **文脈理解**: 会話の自然な区切りを検出するため、文脈理解能力が重要
- **Memory使用**: 会話履歴を保持するためSimple Memoryを使用

**モデルパラメータ**:
```json
{
  "modelName": "gemini-2.0-flash-exp",
  "options": {
    "temperature": 0.4,
    "maxOutputTokens": 4000
  }
}
```

**Memory設定**:
- **Memory Type**: Simple Memory（n8nベースのメモリ管理）
- **Session Key**: `step2_memory`
- **選定理由**: 議題抽出時に会話全体の文脈を保持する必要があるため

**コスト試算**:
- 1実行あたり: 入力50,000 tokens + 出力500 tokens = 50,500 tokens
- 1実行あたりコスト: (50,000×$0.000075) + (500×$0.0003) = $0.00375 + $0.00015 = $0.0039 ≈ ¥0.6
- 月間コスト（20回/月）: ¥0.6 × 20 = ¥12/月

**処理時間試算**:
- 平均レスポンス時間: 20-30秒/実行
- 目標時間（非機能要件）: 30秒以内 → ✅ 満たす

**バックアップモデル**: Claude 3.5 Sonnet
- 切り替え条件: Gemini APIエラー時、レート制限時

---

### AI処理3: 議題分析（Gemini）

**選定モデル**: **Google Gemini 2.0 Flash**

**選定理由**:
- **業務特性「決定事項、宿題、保留事項の抽出」**に対して、情報抽出タスクに最適
- **並列処理**: 3議題並列で処理するため、高速モデルが必須
- **コスト最適化**: Gemini 2.0 Flashは低コストで高速

**モデルパラメータ**:
```json
{
  "modelName": "gemini-2.0-flash-exp",
  "options": {
    "temperature": 0.4,
    "maxOutputTokens": 4000
  }
}
```

**Memory設定**: なし（並列処理のため、各議題は独立）

**コスト試算**:
- 1議題あたり: 入力1,500 tokens + 出力500 tokens = 2,000 tokens
- 3議題（平均）: 2,000 × 3 = 6,000 tokens
- 1実行あたりコスト: (1,500×3×$0.000075) + (500×3×$0.0003) = $0.00034 + $0.00045 = $0.00079 ≈ ¥0.12
- 月間コスト（20回/月）: ¥0.12 × 20 = ¥2.4/月

**処理時間試算**:
- 平均レスポンス時間: 3-5秒/議題
- 並列処理（3議題並列）: 5秒/バッチ = 5秒
- 目標時間（非機能要件）: 10秒以内 → ✅ 満たす

**バックアップモデル**: Claude 3 Haiku
- 切り替え条件: Gemini APIエラー時、レート制限時

---

### AI処理4: フォーマット変換（Claude）

**選定モデル**: **Claude Sonnet 4.5**

**選定理由**:
- **業務特性「全データ統合と指定フォーマットMarkdown生成」**に対して、大規模コンテキスト処理と高品質な文章生成が必要
- **大規模コンテキスト**: 全データ（100K文字超）を統合してMarkdownを生成
- **構造化出力**: 業務要件定義書フォーマットへの厳密な変換が必要
- **高品質文章**: Claudeは日本語の文章生成品質が高い
- **Memory使用**: 統合処理時の文脈保持のためSimple Memoryを使用

**モデルパラメータ**:
```json
{
  "modelName": "claude-sonnet-4-5-20250929",
  "options": {
    "temperature": 0.7,
    "maxOutputTokens": 8000
  }
}
```

**Memory設定**:
- **Memory Type**: Simple Memory
- **Session Key**: `step4_memory`
- **選定理由**: 全データ統合時に文脈を保持する必要があるため

**コスト試算**:
- Claude Sonnet 4.5: 入力 $3/1M tokens, 出力 $15/1M tokens
- 1実行あたり: 入力100,000 tokens + 出力5,000 tokens = 105,000 tokens
- 1実行あたりコスト: (100,000×$0.000003) + (5,000×$0.000015) = $0.3 + $0.075 = $0.375 ≈ ¥60
- 月間コスト（20回/月）: ¥60 × 20 = ¥1,200/月

**処理時間試算**:
- 平均レスポンス時間: 60-90秒/実行
- 目標時間（非機能要件）: 90秒以内 → ✅ 満たす

**バックアップモデル**: Claude 3.5 Sonnet
- 切り替え条件: Claude Sonnet 4.5 APIエラー時、レート制限時

---

### AI処理5: 品質保証（Claude）

**選定モデル**: **Claude Sonnet 4.5**

**選定理由**:
- **業務特性「議事録の完全性検証と不足項目補完」**に対して、高度な推論と検証能力が必要
- **検証タスク**: 生成された議事録の完全性を検証し、不足項目を補完
- **高品質文章**: 補完時の文章品質が重要
- **Memory使用**: 検証時の文脈保持のためSimple Memoryを使用

**モデルパラメータ**:
```json
{
  "modelName": "claude-sonnet-4-5-20250929",
  "options": {
    "temperature": 0.7,
    "maxOutputTokens": 8000
  }
}
```

**Memory設定**:
- **Memory Type**: Simple Memory
- **Session Key**: `step5_memory`
- **選定理由**: 検証時に元データとの整合性を確認する必要があるため

**コスト試算**:
- Claude Sonnet 4.5: 入力 $3/1M tokens, 出力 $15/1M tokens
- 1実行あたり: 入力80,000 tokens + 出力3,000 tokens = 83,000 tokens
- 1実行あたりコスト: (80,000×$0.000003) + (3,000×$0.000015) = $0.24 + $0.045 = $0.285 ≈ ¥45
- 月間コスト（20回/月）: ¥45 × 20 = ¥900/月

**処理時間試算**:
- 平均レスポンス時間: 30-60秒/実行
- 目標時間（非機能要件）: 60秒以内 → ✅ 満たす

**バックアップモデル**: Claude 3.5 Sonnet
- 切り替え条件: Claude Sonnet 4.5 APIエラー時、レート制限時

---

## 全体コスト・パフォーマンス試算

### 前提条件
- 月間実行回数: 20回/月（Step010ユースケースより）
- 1時間会議を想定: 文字起こし約50,000-100,000文字

### 総コスト試算（月額）

| AI処理 | モデル | 1実行コスト | 月額コスト（20回） |
|-------|--------|------------|-------------------|
| Step0: 音声文字起こし | Gemini 2.0 Flash | ¥0.6 | ¥12 |
| Step1: 文字起こし整形 | Gemini 2.0 Flash | ¥0.5 | ¥10 |
| Step2: 議題抽出 | Gemini 2.0 Flash | ¥0.6 | ¥12 |
| Step3: 議題分析 | Gemini 2.0 Flash | ¥0.12 | ¥2.4 |
| Step4: フォーマット変換 | Claude Sonnet 4.5 | ¥60 | ¥1,200 |
| Step5: 品質保証 | Claude Sonnet 4.5 | ¥45 | ¥900 |
| **合計** | - | **¥106.82** | **¥2,136.4/月** |

### 年間コスト
- 年間コスト = ¥2,136.4 × 12 = **¥25,637/年**

### コスト削減効果
- **従来手動作業**: 1時間会議 × 60分議事録作成 × 20回/月 = 1,200分/月 = 20時間/月
- **人件費削減**: 20時間/月 × ¥3,000/時間 = ¥60,000/月
- **ROI**: (¥60,000 - ¥2,136) / ¥2,136 = **2,708%**

### 処理時間試算（1時間会議）

| AI処理 | 処理時間 | 並列処理 |
|-------|---------|---------|
| Step0: 音声文字起こし | 30-60秒 | - |
| Step1: 文字起こし整形 | 15秒 | 5チャンク並列 |
| Step2: 議題抽出 | 20-30秒 | - |
| Step3: 議題分析 | 5秒 | 3議題並列 |
| Step4: フォーマット変換 | 60-90秒 | - |
| Step5: 品質保証 | 30-60秒 | - |
| **合計** | **160-260秒** | **2分40秒-4分20秒** |

**目標時間（非機能要件）**: 3分以内 → ⚠️ ギリギリ達成（平均3分30秒）

### 最適化提案
1. **Step4のトークン削減**: 入力データを要約してから渡すことで、処理時間を30秒短縮可能
2. **並列処理の拡大**: Step1のバッチサイズを5→10に増やすことで、10秒短縮可能
3. **キャッシング活用**: Claudeのプロンプトキャッシング機能を活用し、コスト50%削減可能

---

## AI Agent構成（JSON）

### AI Agent 0: Gemini音声文字起こし

```json
{
  "id": "gemini_transcribe",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "Gemini: 音声文字起こし",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.systemPrompt }}"
  },
  "typeVersion": 1.7,
  "position": [600, 300],
  "subnodes": {
    "chatModel": {
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "parameters": {
        "modelName": "gemini-2.0-flash-exp",
        "options": {
          "temperature": 0.3,
          "maxOutputTokens": 100000,
          "audioTimestamp": true
        }
      }
    },
    "memory": null,
    "tools": []
  }
}
```

### AI Agent 1: Gemini文字起こし整形

```json
{
  "id": "gemini_step1",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "Gemini: 文字起こし整形",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.systemPrompt }}"
  },
  "typeVersion": 1.7,
  "position": [1200, 300],
  "subnodes": {
    "chatModel": {
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "parameters": {
        "modelName": "gemini-2.0-flash-exp",
        "options": {
          "temperature": 0.4,
          "maxOutputTokens": 4000
        }
      }
    },
    "memory": null,
    "tools": []
  }
}
```

### AI Agent 2: Gemini議題抽出

```json
{
  "id": "gemini_step2",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "Gemini: 議題抽出",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.systemPrompt }}"
  },
  "typeVersion": 1.7,
  "position": [1800, 300],
  "subnodes": {
    "chatModel": {
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "parameters": {
        "modelName": "gemini-2.0-flash-exp",
        "options": {
          "temperature": 0.4,
          "maxOutputTokens": 4000
        }
      }
    },
    "memory": {
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "parameters": {
        "sessionKey": "step2_memory",
        "contextWindowLength": 10
      }
    },
    "tools": []
  }
}
```

### AI Agent 3: Gemini議題分析

```json
{
  "id": "gemini_step3",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "Gemini: 議題分析",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.systemPrompt }}"
  },
  "typeVersion": 1.7,
  "position": [2400, 300],
  "subnodes": {
    "chatModel": {
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "parameters": {
        "modelName": "gemini-2.0-flash-exp",
        "options": {
          "temperature": 0.4,
          "maxOutputTokens": 4000
        }
      }
    },
    "memory": null,
    "tools": []
  }
}
```

### AI Agent 4: Claudeフォーマット変換

```json
{
  "id": "claude_step4",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "Claude: フォーマット変換",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.systemPrompt }}"
  },
  "typeVersion": 1.7,
  "position": [3000, 300],
  "subnodes": {
    "chatModel": {
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "parameters": {
        "model": "claude-sonnet-4-5-20250929",
        "options": {
          "temperature": 0.7,
          "maxTokens": 8000
        }
      }
    },
    "memory": {
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "parameters": {
        "sessionKey": "step4_memory",
        "contextWindowLength": 5
      }
    },
    "tools": []
  }
}
```

### AI Agent 5: Claude品質保証

```json
{
  "id": "claude_step5",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "Claude: 品質保証",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.systemPrompt }}"
  },
  "typeVersion": 1.7,
  "position": [3600, 300],
  "subnodes": {
    "chatModel": {
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "parameters": {
        "model": "claude-sonnet-4-5-20250929",
        "options": {
          "temperature": 0.7,
          "maxTokens": 8000
        }
      }
    },
    "memory": {
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "parameters": {
        "sessionKey": "step5_memory",
        "contextWindowLength": 5
      }
    },
    "tools": []
  }
}
```

---

## System Prompt設計

### AI Agent 0: Gemini音声文字起こし

```markdown
# あなたの役割
あなたは、Google Meet会議録音（M4Aファイル）から日本語文字起こしを生成する専門AIエージェントです。

# 業務コンテキスト
- **業務目標**: 1時間会議の録音から、高精度な日本語文字起こしを30-60秒以内に生成
- **入力**: M4Aバイナリデータ（最大1GB、最大8.4時間）
- **出力**: 話者分離・タイムスタンプ付きの文字起こしJSON配列

# 処理方針
1. M4A音声データを受け取る
2. Gemini 2.0 FlashのネイティブTranscribe機能で文字起こし
3. Speaker Diarization（話者分離）: speaker A, B, C 等で識別
4. Timestamps: 各発言の開始・終了時刻を記録（audioTimestamp=true）
5. Punctuation: 句読点を自動挿入
6. JSON形式で構造化して出力

# 出力形式
JSON配列で返してください：
```json
{
  "lines": [
    {
      "line_id": 1,
      "content": "発言内容",
      "speaker": "A",
      "timestamp": "00:01:20",
      "start_time": 80.5,
      "end_time": 85.2
    }
  ],
  "total_lines": 300
}
```

# 制約事項
- 処理時間: 30-60秒以内（1時間会議）
- 対応フォーマット: audio/m4a, audio/mp3, audio/wav, audio/aac, audio/flac, audio/ogg
- Max Duration: 8.4時間
- 日本語特有の言い回しを正確に認識すること
```

### AI Agent 1: Gemini文字起こし整形

```markdown
# あなたの役割
あなたは、文字起こしテキストを整形する専門AIエージェントです。

# 業務コンテキスト
- **業務目標**: 文字起こしチャンクからフィラー語を除去し、箇条書き化
- **入力**: 文字起こしチャンク（20-30行 + 前後6行のオーバーラップ）
- **出力**: 整形済みJSON配列

# 処理方針
1. メインテキスト（20-30行）を中心に処理
2. フィラー語を除去：「えー」「あのー」「その」「まあ」「なんか」等
3. 意味のある文章単位で1行ずつ箇条書き化
4. 話者情報を保持
5. タイムスタンプを保持
6. 前後のオーバーラップは参考のみ、出力には含めない

# 入力データ
```json
{
  "chunk_id": 1,
  "main_text": "行1-25の内容...",
  "overlap_before": "行-6-0の内容...",
  "overlap_after": "行26-31の内容...",
  "line_range": [1, 25]
}
```

# 出力形式
JSON配列で返してください：
```json
[
  {
    "line_id": 1,
    "content": "整形後の文章",
    "speaker": 0,
    "timestamp": "00:01:20"
  }
]
```

# 制約事項
- 処理時間: 3-5秒以内/チャンク
- 並列処理: 5チャンク同時処理（独立して処理）
- 重複除去: line_id が重複しないこと
```

### AI Agent 2: Gemini議題抽出

```markdown
# あなたの役割
あなたは、会議の文字起こしから議題を自動抽出する専門AIエージェントです。

# 業務コンテキスト
- **業務目標**: 統合された文字起こしから、会議の議題を自然な区切りで抽出
- **入力**: 整形済み全文字起こし（50K-100K文字、300-500行）
- **出力**: 議題リスト（タイトル、該当行番号）

# 処理方針
1. 全文字起こしを読み、会話の流れを理解
2. 自然な議題の区切りを見つける：
   - 話題の転換点
   - 「次に〜について」等の明示的な区切り
   - 議論の収束点
3. 各議題に適切なタイトルを付ける（簡潔で具体的）
4. 各議題に該当する行番号（line_id）をリストアップ
5. 会議名を推測して抽出（ファイル名または会話内容から）

# 出力形式
JSON形式で返してください：
```json
{
  "meeting_name": "会議名（音声から抽出、なければファイル名から推測）",
  "agendas": [
    {
      "agenda_id": 1,
      "title": "議題タイトル",
      "line_ids": [1, 2, 3, 15, 16, 17]
    }
  ]
}
```

# 制約事項
- 処理時間: 20-30秒以内
- 議題数: 通常2-5個（会議の長さによる）
- Memory使用: 会話全体の文脈を保持（session_key: step2_memory）
```

### AI Agent 3: Gemini議題分析

```markdown
# あなたの役割
あなたは、議題ごとの文字起こしから決定事項、宿題、保留事項を抽出する専門AIエージェントです。

# 業務コンテキスト
- **業務目標**: 各議題から決定事項、宿題、保留事項を明確に抽出
- **入力**: 議題ごとの文字起こし（議題タイトル + 該当文字起こし）
- **出力**: 決定事項・宿題・保留事項のリスト

# 処理方針
1. 議題タイトルと該当文字起こしを確認
2. 決定事項（decisions）: 明確に決まったことを抽出
   - 「〜に決定しました」「〜することにしました」等
3. 宿題（todos）: 誰かが実施すべきタスクを抽出
   - 「〜さんが〜までに〜する」等
4. 保留事項（pending）: 決定されなかった、または次回に持ち越す事項
   - 「次回に持ち越し」「保留」等

# 入力データ
```json
{
  "agenda_id": 1,
  "title": "プロジェクト進捗報告",
  "lines": [
    { "line_id": 1, "content": "...", "speaker": 0, "timestamp": "00:01:20" }
  ]
}
```

# 出力形式
JSON形式で返してください：
```json
{
  "agenda_id": 1,
  "decisions": ["決定事項1", "決定事項2"],
  "todos": ["宿題1", "宿題2"],
  "pending": ["保留事項1"]
}
```

# 制約事項
- 処理時間: 3-5秒以内/議題
- 並列処理: 3議題同時処理（独立して処理）
- 明確性: 曖昧な表現は保留事項に分類
```

### AI Agent 4: Claudeフォーマット変換

```markdown
# あなたの役割
あなたは、全データを統合し、業務要件定義書フォーマットのMarkdown議事録を生成する専門AIエージェントです。

# 業務コンテキスト
- **業務目標**: 全議題分析結果と文字起こしを統合し、指定フォーマットの議事録を生成
- **入力**: 会議名、議題分析結果、全文字起こし、ファイルメタデータ
- **出力**: 業務要件定義書フォーマットのMarkdown議事録

# 処理方針
1. 全入力データを確認：
   - meeting_name: 会議名
   - agendas: 全議題の分析結果（決定事項・宿題・保留事項）
   - all_lines: 全文字起こし
   - file_metadata: ファイル作成日時、会議時間
2. 議事録フォーマットに従って生成：
   - 目的・背景: 文字起こしから会議の目的を推測
   - 日時: ファイル作成日時を使用、終了時刻は duration から計算
   - 参加者: 話者情報から推測、「万壽本」は必ず含める
   - 宿題事項: 全議題の todos を統合してリスト化
   - 決定事項: 全議題の decisions を統合してリスト化
   - 次回の日時: 文字起こしから次回日程を抽出、なければ「未定」
   - 本日の議題: 議題一覧をチェックボックス付きリストで記載
   - 議題N: 各議題の詳細を all_lines から該当部分を抽出して箇条書き化
3. Memory使用: 統合処理時の文脈保持（session_key: step4_memory）

# 入力データ
```json
{
  "meeting_name": "プロジェクト定例会議",
  "agendas": [...],
  "all_lines": [...],
  "file_metadata": {
    "fileName": "会議録.m4a",
    "createdTime": "2025-01-09T10:00:00Z",
    "duration": "01:05:30"
  }
}
```

# 出力形式
完全なMarkdownテキストを返してください：
```markdown
# 目的・背景
...
# 日時
2025 年 01 月 09 日（木） 10:00 〜 11:05
# 参加者
田中（話者0）、佐藤（話者1）、鈴木（話者2）、万壽本
# 宿題事項
- 宿題1
- 宿題2
# 決定事項
- 決定事項1
- 決定事項2
# 次回の日時
2025 年 01 月 16 日（木） 10:00 〜 11:00
# 議事内容
## 本日の議題
- [ ] 議題1：プロジェクト進捗報告
- [ ] 議題2：次回までのタスク確認
## 議題1：プロジェクト進捗報告
- 内容1
- 内容2
```

# 制約事項
- 処理時間: 60-90秒以内
- フォーマット厳守: 業務要件定義書のフォーマットに厳密に従う
- 参加者: 必ず「万壽本」を含める
```

### AI Agent 5: Claude品質保証

```markdown
# あなたの役割
あなたは、生成された議事録の完全性を検証し、不足項目を補完する専門AIエージェントです。

# 業務コンテキスト
- **業務目標**: 議事録の完全性を検証し、不足項目があれば補完
- **入力**: 生成済み議事録Markdown + 元データ（議題、文字起こし）
- **出力**: 補完済み議事録 + 警告リスト

# 処理方針
1. 生成済み議事録を確認
2. 元データ（議題、文字起こし）と照合
3. 検証項目をチェック：
   - 必須項目が揃っているか（目的・背景、日時、参加者、宿題事項、決定事項、議事内容）
   - 各議題の内容が適切に記載されているか
   - 決定事項と宿題が漏れなく記載されているか
   - 文字起こしの重要な内容が抜けていないか
4. 不足があれば補完、問題がなければそのまま
5. 重大な問題があれば警告メッセージを含める
6. Memory使用: 検証時の文脈保持（session_key: step5_memory）

# 入力データ
```json
{
  "markdown": "生成済み議事録",
  "agendas": [...],
  "all_lines": [...]
}
```

# 出力形式
JSON形式で返してください：
```json
{
  "status": "ok" | "補完実施" | "警告",
  "markdown": "最終議事録",
  "warnings": ["警告メッセージ1", ...]
}
```

# 制約事項
- 処理時間: 30-60秒以内
- 保守的検証: 重要な内容が漏れていないか厳格にチェック
- 補完品質: 補完時は元データに基づく正確な内容のみ追加
```

---

## エラーハンドリング戦略

### Gemini APIエラー時
- **リトライ回数**: 最大3回
- **リトライ間隔**: 5秒、10秒、20秒（Exponential Backoff）
- **タイムアウト設定**: 30秒/リクエスト
- **フォールバック**: なし（Gemini専用機能のため、エラー時はワークフロー全体をエラーハンドリング）

### Claude APIエラー時
- **リトライ回数**: 最大2回
- **リトライ間隔**: 3秒、10秒
- **タイムアウト設定**: 90秒/リクエスト
- **フォールバック**: Claude 3.5 Sonnetへ切り替え

### 全AI処理共通
- **エラーログ**: n8n実行ログに記録
- **エラー通知**: Discord Webhookで管理者に即座に通知
- **部分生成データの保存**: エラー時も部分生成された議事録を `[ERROR]minutes - ...` として保存

---

## 次ステップへの引き継ぎ事項

### AI Agent配置箇所（12層アーキテクチャ）
- **Layer 4: Data Transformation**: Step0（音声文字起こし）、Step1（整形）、Step2（議題抽出）
- **Layer 5: Core Logic**: Step3（議題分析）、Step4（フォーマット変換）、Step5（品質保証）

### 必要なCredentials
1. **Gemini API Key**: 環境変数 `GOOGLE_API_KEY`
2. **Anthropic API Key**: 環境変数 `ANTHROPIC_API_KEY`
3. **Google Drive OAuth2**: n8nで設定
4. **Discord Webhook URL**: 環境変数 `DISCORD_WEBHOOK_URL`（オプション）

### 特記事項
1. **Geminiネイティブ文字起こし採用**:
   - Gemini 2.0 FlashのネイティブTranscribe機能を使用
   - 処理時間50%短縮、コスト70-85%削減、認証情報1つ削減

2. **並列処理の重要性**:
   - Step1（チャンク並列処理）: 5チャンク同時処理
   - Step3（議題並列処理）: 3議題同時処理
   - APIレート制限を考慮したバッチサイズ設計

3. **Memory使用箇所**:
   - Step2（議題抽出）: Simple Memory（session_key: `step2_memory`）
   - Step4（フォーマット変換）: Simple Memory（session_key: `step4_memory`）
   - Step5（品質保証）: Simple Memory（session_key: `step5_memory`）

4. **コスト最適化の余地**:
   - Claudeプロンプトキャッシング機能を活用し、コスト50%削減可能
   - Step4の入力データを要約してから渡すことで、処理時間30秒短縮可能

5. **パフォーマンス目標**:
   - 現在の平均処理時間: 3分30秒
   - 目標処理時間: 3分以内
   - 最適化により目標達成可能
