# Step3: タスク分解フェーズ - 完了

## ノード分解結果

8層フレームワークを**41ノード**に分解しました（制約の10-50ノード内）。

---

## 📊 レイヤー別ノード数

| レイヤー | ノード数 | 主要ノード |
|---------|---------|-----------|
| **1. Trigger** | 1 | Google Drive Trigger |
| **2. Fetch** | 3 | M4Aファイル取得、文字起こしAPI |
| **3. Validate** | 2 | 文字起こし検証、メタデータ検証 |
| **4. Transform** ★ | **25** | AI処理5ステップ（詳細下記） |
| **5. Conditional** | 1 | 品質検証分岐 |
| **6. Execute** | 6 | Notion出力ループ、通知 |
| **7. Integrate** | 1 | ログ統合 |
| **8. Output** | 1 | ステータス更新 |
| **合計** | **41** | - |

---

## 🤖 AI Agent クラスターノード構造（5つ）

各AI Agentは**クラスターノード**として実装（AI Agent + Chat Model + Memory）

### クラスター1: Transcript Formatter（文字起こし整形）
- **N009**: AI Agent: Transcript Formatter
  - **N010**: Chat Model: XAI Grok
  - **N011**: Memory: Simple Memory
- **責務**: フィラー除去、1行ごとJSON化（ループ処理）

### クラスター2: Agenda Extractor（議題抽出）
- **N014**: AI Agent: Agenda Extractor
  - **N015**: Chat Model: XAI Grok
  - **N016**: Memory: Simple Memory
- **責務**: 議題識別、タイトル付与、グループ化

### クラスター3: Agenda Analyzer（議題分析）
- **N019**: AI Agent: Agenda Analyzer
  - **N020**: Chat Model: XAI Grok
  - **N021**: Memory: Simple Memory
- **責務**: 決定事項/宿題/保留事項抽出（ループ処理）

### クラスター4: Format Converter（フォーマット変換）
- **N025**: AI Agent: Format Converter
  - **N026**: Chat Model: Claude Sonnet 4.5
  - **N027**: Memory: Simple Memory
- **責務**: 統合JSONを議事録Markdownに変換

### クラスター5: Quality Assurance（品質保証）
- **N028**: AI Agent: Quality Assurance
  - **N029**: Chat Model: Claude Sonnet 4.5
  - **N030**: Memory: Simple Memory
- **責務**: 全ステップ検証、完全性確認

---

## 🔁 3つのループ処理実装

### ループ1: 文字起こし整形（N008-N013）
```
N007 (行分割準備)
  ↓
N008 (Split in Batches) ← ループ開始
  ↓
N009 (AI Agent: Formatter) + N010 (Grok) + N011 (Memory)
  ↓
N012 (Loop Control)
  ↓ (次のバッチまたは終了)
N013 (Aggregate Items) ← ループ終了
```

### ループ2: 議題分析（N018-N023）
```
N018 (Split in Batches) ← ループ開始
  ↓
N019 (AI Agent: Analyzer) + N020 (Grok) + N021 (Memory)
  ↓
N022 (Loop Control)
  ↓
N023 (Aggregate Items) ← ループ終了
```

### ループ3: Notion出力（N034-N037）
```
N033 (議題準備)
  ↓
N034 (Split in Batches) ← ループ開始
  ↓
N035 (Notion Create Page)
  ↓
N036 (Wait 0.5秒) ← API制限回避
  ↓
N037 (Loop Control) ← ループ終了
```

---

## 📋 Transform Layer詳細（25ノード）

| ステップ | ノード数 | ノードID範囲 | AIモデル |
|---------|---------|-------------|----------|
| ステップ1: 整形 | 7 | N007-N013 | XAI Grok |
| ステップ2: 抽出 | 4 | N014-N017 | XAI Grok |
| ステップ3: 分析 | 6 | N018-N023 | XAI Grok |
| データマージ | 1 | N024 | - |
| ステップ4: 変換 | 3 | N025-N027 | Claude Sonnet 4.5 |
| ステップ5: 品質保証 | 4 | N028-N031 | Claude Sonnet 4.5 |

---

## 🎯 単一責務の原則遵守

各AI Agentは明確な単一責務を持つ：

1. **Transcript Formatter**: 文字起こしテキストの整形のみ
2. **Agenda Extractor**: 議題の抽出のみ
3. **Agenda Analyzer**: 議題の分析（決定事項等）のみ
4. **Format Converter**: フォーマット変換のみ
5. **Quality Assurance**: 品質検証のみ

---

## 📁 成果物

**[ノード分解計画.json](./ノード分解計画.json)**
- 全41ノードの詳細仕様
- AI Agentクラスター構造
- ループ処理実装詳細

---

## ✅ ユーザー確認

このノード分解（41ノード、5つのAI Agentクラスター）で正しいですか？

**承認いただければ、Step4: パターン適用フェーズに進みます。**
