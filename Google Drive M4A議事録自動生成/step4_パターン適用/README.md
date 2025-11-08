# Step4: パターン適用フェーズ - 完了

## 適用したワークフローパターン

4つの主要パターンを適用しました：**Sequential**, **Loop**, **Conditional**, **Parallel**

---

## 📋 パターン別適用箇所

### 1️⃣ Sequential（順次実行）- メインフロー全体

**説明**: データが前ノードの出力に依存する一連の処理

**適用箇所**:
- メインフロー全体: N001 → N002 → ... → N040
- AI処理5ステップ: ステップ1 → ステップ2 → ステップ3 → マージ → ステップ4 → ステップ5

**理由**: 各レイヤー・ステップは前の出力に依存するため順次実行必須

**接続**: main output → main input（mainチャンネル）

---

### 2️⃣ Loop（ループ処理）- 3箇所

**説明**: 配列データを1つずつまたはバッチで繰り返し処理

#### Loop1: 文字起こし整形ループ（N008-N013）
```
N007 (行配列生成)
  ↓
N008 (Split in Batches, batchSize=10) ← ループ開始
  ↓
N009-N011 (AI Agent: Formatter + Grok + Memory)
  ↓
N012 (Loop Control) → 残りがあればN009に戻る
  ↓
N013 (Aggregate Items) ← ループ終了
```

**理由**: 大量の文字起こし行を10行ずつバッチ処理

#### Loop2: 議題分析ループ（N018-N023）
```
N018 (Split in Batches, batchSize=1) ← ループ開始
  ↓
N019-N021 (AI Agent: Analyzer + Grok + Memory)
  ↓
N022 (Loop Control) → 残りがあればN019に戻る
  ↓
N023 (Aggregate Items) ← ループ終了
```

**理由**: 各議題を個別にAI分析

#### Loop3: Notion出力ループ（N034-N037）
```
N033 (議題準備)
  ↓
N034 (Split in Batches, batchSize=1) ← ループ開始
  ↓
N035 (Create Notion Page)
  ↓
N036 (Wait 0.5秒) ← API制限対策
  ↓
N037 (Loop Control) → 残りがあればN035に戻る
```

**理由**: Notion API制限（3リクエスト/秒）を回避

---

### 3️⃣ Conditional（条件分岐）- 3箇所

**説明**: 条件に基づいて処理を分岐

#### Branch1: 文字起こし検証分岐（N005）
- **条件**: `文字起こし結果が有効か（空でない、最小文字数満たす）`
- **true**: N006（次の検証へ）
- **false**: ERROR_WORKFLOW（エラー処理）

#### Branch2: メタデータ検証分岐（N006）
- **条件**: `ファイルメタデータが完全か（ファイル名、日時が存在）`
- **true**: N007（AI処理開始）
- **false**: ERROR_WORKFLOW（エラー処理）

#### Branch3: 品質検証分岐（N032）
- **条件**: `品質保証スコアが70点以上か`
- **true**: N033（Notion出力へ）
- **false**: ERROR_WORKFLOW（再処理または手動レビュー）

---

### 4️⃣ Parallel（並列実行）- 1箇所（限定的）

**説明**: 独立した複数の処理を同時実行

#### Parallel1: オプション処理の並列実行（N037後）
```
N037 (Notion出力ループ終了)
  ├─→ N038 (Send Notification) ← オプション
  └─→ N039 (Aggregate Logs) ← 必須
```

**理由**: 通知とログ統合は互いに独立しているため並列実行可能

**注意**: このワークフローではAI処理が前ステップ依存のため、Parallelは最小限

---

## 🎯 パターン組み合わせ戦略

### 全体フロー
**Sequential（骨格） + Loop（3箇所） + Conditional（3箇所） + Parallel（1箇所、限定的）**

### 優先順位
1. **Sequential**: メインフローの骨格として全体を貫く
2. **Loop**: AI処理とNotion出力で配列データを効率的に処理
3. **Conditional**: 検証ゲートとして品質を保証
4. **Parallel**: オプション処理のみで限定的に使用

### 設計哲学
データ依存性を重視し、Sequentialを基本としつつ、配列処理にLoopを適用、品質ゲートにConditionalを配置

---

## 🔗 パターン間のデータ受け渡し

### Sequential → Loop
- **例**: N007（行配列生成）→ N008（Split in Batches開始）
- **データ形式**: 配列を`$json`に格納
- **Expression**: `={{ $json.lines }}`

### Loop → Sequential
- **例**: N013（Aggregate Items）→ N014（AI Agent: Agenda Extractor）
- **データ形式**: 統合された配列を次のシーケンシャル処理に渡す
- **Expression**: `={{ $json.formatted_lines }}`

### Conditional (true) → Sequential
- **例**: N006（Validate Metadata true）→ N007（Transform Layer開始）
- **接続**: true出力 → main入力

### Conditional (false) → Error
- **例**: N005（Validate Transcript false）→ ERROR_WORKFLOW
- **接続**: false出力 → エラーハンドリングノード

---

## 🚨 エラーハンドリングパターン

### トリガー
Conditionalパターンのfalse分岐から発動

### エラー発生源
1. N005 false: 文字起こし検証失敗
2. N006 false: メタデータ検証失敗
3. N032 false: 品質検証失敗

### Error Workflowアクション
- エラーログ記録
- 管理者に通知（Slack/Email）
- ファイルを「要手動確認」フォルダに移動
- エラーレポート生成

**詳細**: Step8で完全なError Workflowを設計

---

## 📁 成果物

**[ワークフローパターン設計.json](./ワークフローパターン設計.json)**
- 4パターンの詳細適用仕様
- パターン別ノード接続
- データ受け渡しロジック

---

## ✅ ユーザー確認

このパターン適用（Sequential + Loop×3 + Conditional×3 + Parallel×1）で正しいですか？

**承認いただければ、Step5: n8n設計変換フェーズに進みます。**
