# AI 設定書 (Step120)

## ワークフロー名

Google Meet 議事録自動化システム

## 業務特性分析

### AI 処理全体の特性評価

| 観点           | 評価               | 根拠（Step110 より）                                                                                                        |
| -------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 推論複雑度     | 複雑（多段階推論） | 音声 → 文字起こし → 整形 → 議題抽出 → 議題分析 → 議題別マッピング → フォーマット変換 → 品質保証の7段階処理。各段階でコンテキスト理解と判断が必要 |
| 入力データ量   | 大（10 万文字超）  | 1 時間会議の M4A 音声ファイル（最大 1GB）、文字起こし後は数千行（推定 5-10 万文字）                                         |
| 出力形式       | 構造化・詳細       | Markdown フォーマット、議題、決定事項、宿題事項、参加者、日時等を構造化して出力                                             |
| リアルタイム性 | 数分許容           | 目標 3 分以内（文字起こし 30-60 秒 + AI 処理 2-3 分）、5 分以内であれば許容                                                 |
| 実行頻度       | 中頻度             | 1 日 1-3 回、1 週間 5-15 回、1 ヶ月 20-60 回                                                                                |

### 各 AI 処理ステップの特性

#### Step1: Fireworks AI Whisper API 音声文字起こし

- **複雑度**: 高（音声 → テキスト変換、話者分離、タイムスタンプ付与）
- **入力**: M4A バイナリ（最大 1GB、1 時間会議）
- **出力**: 日本語テキスト（話者分離、タイムスタンプ付き）
- **処理時間要件**: 30-60 秒

#### Step2: Gemini 文字起こし整形

- **複雑度**: 中（フィラー除去、箇条書き化）
- **入力**: 文字起こしチャンク（20-30 行 + 前後 6 行のオーバーラップ）
- **出力**: 整形済み JSON 配列
- **処理時間要件**: 30-60 秒（並列処理、5 チャンク同時）

#### Step3: Gemini 議題抽出

- **複雑度**: 高（会話の流れから議題を自動抽出、構造化）
- **入力**: 統合済み文字起こし（全行、5-10 万文字）
- **出力**: 議題リスト（タイトル、該当行番号）
- **処理時間要件**: 20-30 秒

#### Step4: Gemini 議題分析

- **複雑度**: 高（決定事項、宿題、保留事項の抽出・分類）
- **入力**: 議題ごとの文字起こし
- **出力**: 決定事項・宿題・保留事項のリスト
- **処理時間要件**: 30-60秒（並列処理、3議題同時）

#### Step5: Claude議題別文字起こしマッピング（新規追加）

- **複雑度**: 高（全文字起こしから各議題への正確な割り当て、抜け漏れチェック）
- **入力**: Step3の議題リスト、Step4の議題分析結果、全文字起こし（5-10万文字）
- **出力**: 議題ごとに完全にマッピングされた文字起こしデータ（JSON形式）
- **処理時間要件**: 30-60秒（並列処理、3議題同時）
- **重要性**: 各議題に該当する文字起こしを正確に抽出・割り当て、フォーマット変換の精度を向上

#### Step6: Claudeフォーマット変換

- **複雑度**: 中（Step5でマッピング済みデータを受け取るため、処理は簡潔化）
- **入力**: Step5の議題別マッピングデータ、ファイルメタデータ
- **出力**: 業務要件定義書フォーマットのMarkdown（詳細）
- **処理時間要件**: 30-60秒

#### Step7: Claude品質保証（強化版）

- **複雑度**: 高（議事録の完全性検証、全体整合性チェック、不足項目補完）
- **入力**: 生成済み議事録、Step5のマッピングデータ、全文字起こし
- **出力**: 補完済み議事録 + 警告リスト + 整合性チェック結果
- **処理時間要件**: 30-50秒
- **強化点**: 議題マッピングとの整合性確認、全文字起こしとの相違チェック

## AI モデル選定

### 選定方針

業務特性分析の結果、以下の 3 つの重要要件が明確になりました：

1. **大規模コンテキスト処理能力**: 1 時間会議の全文字起こし（5-10 万文字）を処理
2. **日本語処理の高精度**: 日本語会議の文字起こし、議題抽出、分析が中心
3. **コスト効率**: 月間 20-60 回実行、複数 AI モデルを使用するため、コスト最適化が必須

### Step1: Fireworks AI Whisper v3

**選定理由**:

- **超高速処理**: 1時間音声を約4秒で処理（従来Deepgram比95%高速化、Gemini比90%高速化）
- **業界最安コスト**: \$0.0021/分（Diarization込み）、1時間=\$0.126（従来Deepgram比99%削減）
- **Speaker Diarization対応**: 話者分離機能をネイティブサポート（+40%サーチャージ込み）
- **日本語対応**: Whisper v3は日本語文字起こしに最適化
- **M4A直接対応**: 音声ファイルを直接処理、変換不要
- **高精度**: OpenAI Whisper v3ベース、業界標準の精度
- **コスト効率**:
  - Pre-recorded Transcription: \$0.0015/分
  - Diarization: +40%サーチャージ
  - **実質コスト**: \$0.0021/分（1時間=\$0.126）
  - 従来のDeepgram（\$0.0043/秒 = 1時間=\$15.48）比**99%削減**

**バックアップモデル**: OpenAI Whisper API

- 切り替え条件: Fireworks APIがレート制限またはエラー時
- 理由: 同じWhisper v3ベース、\$0.006/分（1時間=\$0.36）

### Step2-4: Gemini 2.5 Flash

**選定理由**:

- **大規模コンテキスト**: 100万トークン対応、1時間会議の全文字起こし（5-10万文字）を余裕で処理
- **日本語特化**: Geminiは日本語理解力が高く、議題抽出・分析に最適
- **高速レスポンス**: AI処理は各ステップ20-60秒
- **コスト効率**:
  - Input: \$0.000075/1K tokens
  - Output: \$0.0003/1K tokens
  - Step2-3合計: 約\$0.011/実行
- **並列処理対応**: Step2（5チャンク並列）、Step4（3議題並列）で高速化

**バックアップモデル**: GPT-4o-mini

- 切り替え条件: Gemini APIがレート制限またはエラー時
- 理由: 高速レスポンス、低コスト、日本語対応

### Step5-5: Claude Sonnet 4.5

**選定理由**:

- **大規模コンテキスト処理**: 200Kトークン対応、全議題分析結果 + 文字起こし全文（5-10万文字）を統合処理
- **高精度マッピング**: Step5で全文字起こしから各議題への正確な割り当てを実行
- **高品質Markdown生成**: Step6で複雑な構造化ドキュメント生成が得意
- **全体整合性チェック**: Step5で議事録の完全性検証、マッピングとの整合性確認、不足項目の補完提案が高精度
- **Temperature制御**: 0.7で創造性と正確性のバランスを取る
- **コスト効率**:
  - Input: \$0.003/1K tokens
  - Output: \$0.015/1K tokens
  - Step5-5の合計: 推定30K input + 8K output = \$0.210/実行
- **品質重視**: 議題マッピングの正確性と最終出力（議事録）の品質が最重要、Claudeの高精度が必須

**バックアップモデル**: Claude 3.7 Opus

- 切り替え条件: Sonnet 3.7 がエラー時
- 理由: より高精度な品質保証、コスト増加（\$0.015 input, \$0.075 output）

## コスト・パフォーマンス試算

### 前提条件

- 月間実行回数: 20 回/月（Step110 ユースケースより）
- 1 時間会議を基準

### Step1: Fireworks AI Whisper v3 音声文字起こし

**処理時間試算**:

- 音声入力: 1時間 = 60分
- 処理時間: 約4秒（Fireworks公式：1時間音声を4秒で処理）
- 文字起こし出力: 推定5万文字（日本語テキスト、話者分離・タイムスタンプ付き）

**コスト計算**:

- Pre-recorded Transcription: 60分 × \$0.0015/分 = \$0.09
- Diarization（話者分離）: \$0.09 × 40% = \$0.036
- **合計: \$0.126/実行**

**従来比較**:
- Gemini 2.5 Flash: \$0.465/実行 → **73%削減**
- Deepgram: \$15.48/実行 → **99%削減**

### Step2: Gemini 文字起こし整形

**トークン試算**:

- Input: 5 チャンク × (30 行 + 前後 6 行オーバーラップ) × 50 文字/行 = 約 10,500 文字 = 10.5K tokens
- Output: 整形済み 5 チャンク × 1,500 文字 = 7,500 文字 = 7.5K tokens

**コスト計算**:

- Input: 10.5K × \$0.000075/1K = \$0.00079
- Output: 7.5K × \$0.0003/1K = \$0.00225
- **合計: \$0.003/実行**

### Step3: Gemini 議題抽出

**トークン試算**:

- Input: 統合済み文字起こし（50K tokens） + プロンプト（0.5K） = 50.5K tokens
- Output: 議題リスト（推定 10 議題 × 50 文字） = 500 文字 = 0.5K tokens

**コスト計算**:

- Input: 50.5K × \$0.000075/1K = \$0.00379
- Output: 0.5K × \$0.0003/1K = \$0.00015
- **合計: \$0.00394/実行**

### Step4: Gemini 議題分析

**トークン試算**:

- Input: 3 議題 × (議題文字起こし平均 1.5 万文字 + プロンプト 0.5K) = 約 47K tokens
- Output: 3 議題 × (決定事項・宿題・保留 合計 500 文字) = 1,500 文字 = 1.5K tokens

**コスト計算**:

- Input: 47K × \$0.000075/1K = \$0.00353
- Output: 1.5K × \$0.0003/1K = \$0.00045
- **合計: \$0.00398/実行**

### Step5: Claude議題別文字起こしマッピング（新規追加）

**トークン試算**:

- Input: 3議題 × (Step3議題情報0.5K + Step4分析結果0.5K + 全文字起こし50K + プロンプト1K) = 約156K tokens
- Output: 3議題 × (マッピング済みJSON 2K) = 6K tokens

**コスト計算**:

- Input: 156K × \$0.003/1K = \$0.468
- Output: 6K × \$0.015/1K = \$0.09
- **合計: \$0.558/実行**

**処理詳細**:
- 並列処理（3議題同時）
- 各議題に該当する文字起こし行を正確に抽出
- 抜け漏れがないか全体チェック
- 重複割り当てがないか検証

### Step6: Claudeフォーマット変換

**トークン試算**:

- Input: Step5マッピング済みデータ（15K） + ファイルメタデータ（1K） + プロンプト（1K） = 17K tokens
- Output: Markdown議事録（推定3,000文字） = 3K tokens

**コスト計算**:

- Input: 17K × \$0.003/1K = \$0.051
- Output: 3K × \$0.015/1K = \$0.045
- **合計: \$0.096/実行**

**処理の簡潔化**:
- Step5で議題別マッピングが完了しているため、全文字起こしを再度処理する必要がない
- 入力トークンが大幅削減（56K → 17K、70%削減）
- コストも大幅削減（\$0.213 → \$0.096、55%削減）

### Step7: Claude品質保証（強化版）

**トークン試算**:

- Input: 生成済み議事録（3K） + Step5マッピングデータ（15K） + 全文字起こし（50K） + プロンプト（2K） = 70K tokens
- Output: 補完済み議事録（推定4.5K tokens） + 警告リスト（0.5K） + 整合性チェック結果（1K） = 5K tokens

**コスト計算**:

- Input: 70K × \$0.003/1K = \$0.210
- Output: 5K × \$0.015/1K = \$0.075
- **合計: \$0.285/実行**

**強化内容**:
- 議題マッピングとの整合性確認（Step5のデータと比較）
- 全文字起こしとの相違チェック（抜け漏れ検出）
- 必須項目の完全性検証
- 不足項目の補完提案

### 総コスト試算

**1実行あたりのコスト**:

- Step1（Fireworks Whisper）: \$0.126
- Step2（Gemini整形）: \$0.003
- Step3（Gemini議題抽出）: \$0.00394
- Step4（Gemini議題分析）: \$0.00398
- **Step5（Claude議題別マッピング）**: \$0.558 ← 新規追加
- Step6（Claudeフォーマット変換）: \$0.096（従来\$0.213から55%削減）
- Step7（Claude品質保証・強化版）: \$0.285（従来\$0.132から強化）
- **合計: \$1.076/実行**

**月間コスト**（20回/月）:

- \$1.076 × 20 = **\$21.52/月**

**年間コスト**:

- \$21.52 × 12 = **\$258.24/年**

**コスト変更の内訳**:
- Step5追加により: +\$0.558/実行
- Step6削減により: -\$0.117/実行
- Step5強化により: +\$0.153/実行
- **正味増加**: +\$0.594/実行（月間+\$11.88、年間+\$142.56）

### 従来コスト（Deepgram + AI 処理）との比較

**従来コスト**（Deepgram 音声処理）:

- Deepgram: 3600 秒 × \$0.0043/秒 = \$15.48
- AI 処理（Step2-5）: \$0.352
- **合計: \$15.832/実行**
- **月間: \$316.64/月**
- **年間: \$3,799.68/年**

**コスト削減**:

- 削減額: \$316.64 - \$21.52 = **\$295.12/月削減（93%削減）**
- 年間削減額: **\$3,541.44/年削減**

**品質向上効果**:
- Step5追加により議題マッピングの正確性が向上
- Step5強化により全体整合性チェックを実現
- コスト増（+\$11.88/月）に対して、議事録の品質と信頼性が大幅向上

### 処理時間試算

**目標処理時間**: 3 分以内（Step110 非機能要件 3.1 より）

**各ステップの処理時間**:

- Step1（Fireworks Whisper文字起こし）: **4秒**（1時間音声を4秒で処理）
- Step2（Gemini整形、並列5チャンク）: 30-60秒（平均45秒）
- Step3（Gemini議題抽出）: 20-30秒（平均25秒）
- Step4（Gemini議題分析、並列3議題）: 30-60秒（平均45秒）
- **Step5（Claude議題別マッピング、並列3議題）**: 30-60秒（平均45秒） ← 新規追加
- Step6（Claudeフォーマット変換）: 20-40秒（平均30秒、Step5により簡潔化）
- Step7（Claude品質保証・強化版）: 30-50秒（平均40秒、整合性チェック追加）
- Google Drive保存・移動: 10秒

**合計処理時間**: 4 + 45 + 25 + 45 + 45 + 30 + 40 + 10 = **244秒（約4分4秒）**

**目標達成度**: ⚠️ 目標3分以内に対し、約4分4秒（目標超過1分4秒）

**処理時間変更の内訳**:
- Step5追加により: +45秒
- Step6短縮により: -15秒（45秒 → 30秒）
- Step5増加により: +10秒（30秒 → 40秒）
- **正味増加**: +40秒

**改善効果**:
- Fireworks Whisper採用効果: 41秒短縮（Gemini 45秒 → 4秒、91%削減）
- 従来Deepgram比: 56秒短縮（60秒 → 4秒、93%削減）

### 最適化提案

#### パフォーマンス最適化

1. **並列処理の拡大**（必須：目標3分以内達成のため）:
   - Step2のバッチサイズを5→8に増やす（45秒→30秒に短縮）
   - Step4のバッチサイズを3→5に増やす（45秒→30秒に短縮）
   - **Step5のバッチサイズを3→5に増やす（45秒→30秒に短縮）** ← 新規追加
   - **効果**: 合計45秒短縮 → **199秒（3分19秒）に改善、目標3分以内に近づく**

2. **Temperature最適化**:
   - Step2-3のTemperatureを0.2に固定（精度向上、生成トークン削減）
   - **効果**: 出力トークン15%削減 → 各ステップ5秒短縮 → **総合計184秒（3分4秒）**

3. **さらなる最適化** (目標3分以内達成):
   - Step5とStep6を統合して1ステップにする（マッピングとフォーマット変換を同時実行）
   - **効果**: 30秒短縮 → **154秒（2分34秒）で目標達成**
   - **トレードオフ**: 処理の複雑化、デバッグの難易度上昇

#### コスト最適化

1. **バッチサイズ調整後のコスト**:
   - 並列処理拡大による追加API呼び出しなし（並列度のみ変更）
   - **コスト増加なし**

2. **長期的なコスト削減策**:
   - 月間60回超の場合、Fireworks Batch API（40%割引）を検討
   - 2時間超の会議も分割不要（Fireworks Whisperは高速処理可能）

#### Step5追加による改善効果まとめ

**コスト面**（Step5追加後）:
- 1実行あたり: \$0.482 → \$1.076（品質向上のため+\$0.594）
- 月間コスト: \$9.64 → \$21.52（+\$11.88）
- 年間コスト: \$115.68 → \$258.24（+\$142.56）
- **従来Deepgram比**: 93%削減（依然として大幅削減）

**処理時間面**（Step5追加後）:
- 文字起こし: Gemini 45秒 → Fireworks 4秒（91%削減）
- 総処理時間: 204秒 → 244秒（Step5追加で+40秒）
- **最適化後**: 184秒（3分4秒）で目標3分以内をほぼ達成

**品質面**（大幅向上）:
- **Step5追加**: 議題別文字起こしマッピングの正確性向上、抜け漏れ防止
- **Step5強化**: 全体整合性チェック、マッピングとの相違検出
- **信頼性向上**: 議事録の完全性と正確性が大幅に向上
- Fireworks Whisper v3: 業界標準の高精度、Speaker Diarization対応、日本語最適化

**トレードオフ**:
- コスト+\$11.88/月（+123%）vs 議事録品質の大幅向上
- 処理時間+40秒 vs 議題マッピングの正確性向上
- **推奨**: 品質重視の場合はStep5追加を採用、コスト重視の場合は従来構成を維持

## AI Agent 構成設計

### 全体構成

本ワークフローでは、7つのAI処理ステップがあり、それぞれに適切なAI Agentノードを配置します。

**AI Agent配置マップ**:

1. Step1（音声文字起こし）: ❌ AI Agentは使用しない（Fireworks AI Whisper API直接呼び出し）
2. Step2（文字起こし整形）: ✅ Gemini 2.5 Flash AI Agent × 5（並列処理）
3. Step3（議題抽出）: ✅ Gemini 2.5 Flash AI Agent × 1
4. Step4（議題分析）: ✅ Gemini 2.5 Flash AI Agent × 3（並列処理）
5. **Step5（議題別マッピング）**: ✅ Claude Sonnet 4.5 AI Agent × 3（並列処理）
6. Step6（フォーマット変換）: ✅ Claude Sonnet 4.5 AI Agent × 1
7. Step7（品質保証・強化版）: ✅ Claude Sonnet 4.5 AI Agent × 1

**重要**: Step1（音声文字起こし）は、Fireworks AI Whisper v3 APIを使用するため、AI Agentノードではなく、HTTP RequestノードでFireworks APIを直接呼び出します。

### Step1: Fireworks AI Whisper v3 実装方法

**ノードタイプ**: `n8n-nodes-base.httpRequest`

**実装概要**:
- M4Aファイルをバイナリデータとして取得
- Fireworks AI Audio Transcription APIに送信
- JSON形式で文字起こし結果を受信（話者分離、タイムスタンプ付き）

**APIエンドポイント**:
```
POST https://api.fireworks.ai/v1/audio/transcriptions
```

**必須パラメータ**:
- `file`: M4Aバイナリデータ
- `model`: `whisper-v3-large`
- `language`: `ja`（日本語）
- `response_format`: `verbose_json`
- `timestamp_granularities`: `["word", "segment"]`
- `diarization`: `true`（話者分離を有効化）

**HTTP Requestノード設定例**:
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://api.fireworks.ai/v1/audio/transcriptions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "file",
          "value": "={{ $binary.data }}"
        },
        {
          "name": "model",
          "value": "whisper-v3-large"
        },
        {
          "name": "language",
          "value": "ja"
        },
        {
          "name": "response_format",
          "value": "verbose_json"
        },
        {
          "name": "timestamp_granularities",
          "value": ["word", "segment"]
        },
        {
          "name": "diarization",
          "value": true
        }
      ]
    },
    "options": {
      "timeout": 120000
    }
  },
  "type": "n8n-nodes-base.httpRequest",
  "credentials": {
    "httpHeaderAuth": {
      "id": "FIREWORKS_API_KEY",
      "name": "Fireworks AI API Key"
    }
  }
}
```

**出力形式**:
```json
{
  "text": "全文字起こしテキスト",
  "segments": [
    {
      "id": 1,
      "start": 0.5,
      "end": 5.2,
      "text": "プロジェクトの進捗について報告します",
      "speaker": "SPEAKER_00"
    },
    ...
  ],
  "duration": 3600.0
}
```

### Step2: Gemini 文字起こし整形 AI Agent 構成

**ノードタイプ**: `@n8n/n8n-nodes-langchain.agent`

````json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.chunk_text }}",
        "options": {
          "systemMessage": "あなたは会議の文字起こしテキストを整形する専門AIです。\n\n【役割】\n- フィラー語（「えー」「あのー」「その」「えっと」等）を除去\n- 意味のある文章単位で箇条書き化\n- 話者情報とタイムスタンプを保持\n- 前後のオーバーラップ範囲は context として認識し、出力には含めない\n\n【入力形式】\nJSON形式で以下の構造:\n```json\n{\n  \"chunk_id\": 1,\n  \"lines\": [\n    { \"line_id\": 1, \"speaker\": \"A\", \"timestamp\": \"00:01:20\", \"content\": \"えー、プロジェクトの進捗について報告します\" },\n    ...\n  ],\n  \"context_before\": [ ... ],\n  \"context_after\": [ ... ]\n}\n```\n\n【処理方針】\n1. context_before と context_after は文脈理解のみに使用\n2. lines のみを整形対象とする\n3. フィラー語を削除: 「えー」「あのー」「その」「えっと」「まあ」等\n4. 意味のある文章単位で箇条書き化\n5. 話者情報、タイムスタンプ、line_id は必ず保持\n\n【出力形式】\nJSON配列で返すこと:\n```json\n[\n  {\n    \"line_id\": 1,\n    \"speaker\": \"A\",\n    \"timestamp\": \"00:01:20\",\n    \"content\": \"プロジェクトの進捗について報告します\"\n  },\n  ...\n]\n```\n\n【制約】\n- 必ずJSON形式で出力\n- context範囲は出力に含めない\n- フィラー語は完全に除去\n- 元の意味を変えない",
          "maxIterations": 5,
          "temperature": 0.2
        }
      },
      "id": "step1_ai_agent",
      "name": "Step2 - 文字起こし整形",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [1200, 300]
    },
    {
      "parameters": {
        "model": "gemini-2.5-flash",
        "options": {
          "temperature": 0.2,
          "maxOutputTokens": 4000
        }
      },
      "id": "step1_gemini_model",
      "name": "Gemini 2.5 Flash (Step2)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [1000, 200],
      "credentials": {
        "googleGeminiApi": {
          "id": "GOOGLE_GEMINI_CREDENTIAL_ID",
          "name": "Google Gemini API"
        }
      }
    }
  ],
  "connections": {
    "Gemini 2.5 Flash (Step2)": {
      "ai_languageModel": [
        [
          {
            "node": "Step2 - 文字起こし整形",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    }
  }
}
````

### Step3: Gemini 議題抽出 AI Agent 構成

**ノードタイプ**: `@n8n/n8n-nodes-langchain.agent`

````json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.all_lines_json }}",
        "options": {
          "systemMessage": "あなたは会議の文字起こしテキストから議題を自動抽出する専門AIです。\n\n【役割】\n- 会話の流れから議題を自動的に特定\n- 各議題に該当する行番号範囲を記録\n- 議題タイトルを簡潔に命名\n- 会議名を推測\n\n【入力形式】\n整形済み文字起こしJSON配列:\n```json\n[\n  { \"line_id\": 1, \"speaker\": \"A\", \"timestamp\": \"00:01:20\", \"content\": \"プロジェクト進捗について報告します\" },\n  ...\n]\n```\n\n【処理方針】\n1. 会話の話題転換を検出して議題を特定\n2. 各議題のタイトルを簡潔に命名（10-30文字）\n3. 議題ごとに該当する line_id の範囲を記録\n4. 会議名を音声内容またはファイル名から推測\n\n【出力形式】\nJSON形式で返すこと:\n```json\n{\n  \"meeting_name\": \"プロジェクト定例会議\",\n  \"topics\": [\n    {\n      \"topic_id\": 1,\n      \"title\": \"プロジェクト進捗報告\",\n      \"start_line_id\": 1,\n      \"end_line_id\": 50\n    },\n    {\n      \"topic_id\": 2,\n      \"title\": \"次回までのタスク確認\",\n      \"start_line_id\": 51,\n      \"end_line_id\": 100\n    }\n  ]\n}\n```\n\n【制約】\n- 必ずJSON形式で出力\n- 議題は最低1つ、最大20個\n- 議題タイトルは簡潔で具体的に\n- line_id範囲は重複しないこと",
          "maxIterations": 5,
          "temperature": 0.2
        }
      },
      "id": "step2_ai_agent",
      "name": "Step3 - 議題抽出",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [1600, 300]
    },
    {
      "parameters": {
        "model": "gemini-2.5-flash",
        "options": {
          "temperature": 0.2,
          "maxOutputTokens": 4000
        }
      },
      "id": "step2_gemini_model",
      "name": "Gemini 2.5 Flash (Step3)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [1400, 200],
      "credentials": {
        "googleGeminiApi": {
          "id": "GOOGLE_GEMINI_CREDENTIAL_ID",
          "name": "Google Gemini API"
        }
      }
    },
    {
      "parameters": {
        "sessionKey": "={{ $json.session_id }}",
        "contextWindowLength": 10
      },
      "id": "step2_memory",
      "name": "Simple Memory (Step3)",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [1400, 400]
    }
  ],
  "connections": {
    "Gemini 2.5 Flash (Step3)": {
      "ai_languageModel": [
        [
          {
            "node": "Step3 - 議題抽出",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory (Step3)": {
      "ai_memory": [
        [
          {
            "node": "Step3 - 議題抽出",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    }
  }
}
````

### Step4: Gemini 議題分析 AI Agent 構成

**ノードタイプ**: `@n8n/n8n-nodes-langchain.agent`

````json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.topic_transcript }}",
        "options": {
          "systemMessage": "あなたは会議議題ごとの決定事項、宿題、保留事項を抽出する専門AIです。\n\n【役割】\n- 議題ごとの文字起こしから決定事項を抽出\n- 宿題（TODO、アクションアイテム）を特定\n- 保留事項（次回への持ち越し）を識別\n\n【入力形式】\nJSON形式で以下の構造:\n```json\n{\n  \"topic_id\": 1,\n  \"title\": \"プロジェクト進捗報告\",\n  \"lines\": [\n    { \"line_id\": 1, \"speaker\": \"A\", \"timestamp\": \"00:01:20\", \"content\": \"リリース日を2月1日に確定しました\" },\n    { \"line_id\": 2, \"speaker\": \"B\", \"timestamp\": \"00:02:10\", \"content\": \"開発チームはテストを完了させる必要があります\" },\n    ...\n  ]\n}\n```\n\n【処理方針】\n1. **決定事項**: 「確定」「決定」「合意」などのキーワードを含む発言を抽出\n2. **宿題事項**: 「〜する」「〜してください」「タスク」などのアクションを含む発言を抽出\n3. **保留事項**: 「次回」「後ほど」「検討」などの持ち越し発言を抽出\n4. 各項目は簡潔な箇条書きで表現\n\n【出力形式】\nJSON形式で返すこと:\n```json\n{\n  \"topic_id\": 1,\n  \"title\": \"プロジェクト進捗報告\",\n  \"decisions\": [\n    \"リリース日を2月1日に確定\",\n    \"予算を100万円で承認\"\n  ],\n  \"todos\": [\n    \"開発チームがテストを完了させる（期限：1月31日）\",\n    \"デザインチームがUIレビューを実施\"\n  ],\n  \"pending\": [\n    \"マーケティング戦略は次回会議で議論\"\n  ]\n}\n```\n\n【制約】\n- 必ずJSON形式で出力\n- 各配列は空でも可（該当なしの場合は空配列 []）\n- 簡潔な箇条書き（1項目30文字以内）\n- 決定事項・宿題・保留を明確に分類",
          "maxIterations": 5,
          "temperature": 0.2
        }
      },
      "id": "step3_ai_agent",
      "name": "Step4 - 議題分析",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [2000, 300]
    },
    {
      "parameters": {
        "model": "gemini-2.5-flash",
        "options": {
          "temperature": 0.2,
          "maxOutputTokens": 4000
        }
      },
      "id": "step3_gemini_model",
      "name": "Gemini 2.5 Flash (Step4)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [1800, 200],
      "credentials": {
        "googleGeminiApi": {
          "id": "GOOGLE_GEMINI_CREDENTIAL_ID",
          "name": "Google Gemini API"
        }
      }
    }
  ],
  "connections": {
    "Gemini 2.5 Flash (Step4)": {
      "ai_languageModel": [
        [
          {
            "node": "Step4 - 議題分析",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    }
  }
}
````

### Step5: Claude 議題別文字起こしマッピング AI Agent 構成

**ノードタイプ**: `@n8n/n8n-nodes-langchain.agent`

````json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.mapping_input }}",
        "options": {
          "systemMessage": "あなたは会議の全文字起こしデータを各議題に正確にマッピングする専門AIです。\n\n【役割】\n- Step3の議題リストとStep4の議題分析結果を参照\n- 全文字起こしから各議題に該当する内容を正確に抽出・割り当て\n- 抜け漏れがないか全体をチェック\n- 重複割り当てがないか検証\n\n【入力形式】\nJSON形式で以下の構造:\n```json\n{\n  \"topic_info\": {\n    \"topic_id\": 1,\n    \"title\": \"プロジェクト進捗報告\",\n    \"start_line_id\": 1,\n    \"end_line_id\": 50\n  },\n  \"topic_analysis\": {\n    \"decisions\": [...],\n    \"todos\": [...],\n    \"pending\": [...]\n  },\n  \"all_transcript\": [\n    { \"line_id\": 1, \"speaker\": \"A\", \"timestamp\": \"00:01:20\", \"content\": \"...\" },\n    ...\n  ]\n}\n```\n\n【処理方針】\n1. **議題範囲抽出**: start_line_id から end_line_id までの文字起こしを抽出\n2. **コンテキスト拡張**: 議題の前後5行も参照して完全性を確保\n3. **内容検証**: 決定事項・宿題・保留事項が文字起こし内に存在するか確認\n4. **抜け漏れチェック**: 議題範囲内のすべての重要な発言が含まれているか確認\n5. **重複防止**: 他の議題と重複する内容がないか検証\n\n【出力形式】\nJSON形式で返すこと:\n```json\n{\n  \"topic_id\": 1,\n  \"title\": \"プロジェクト進捗報告\",\n  \"mapped_transcript\": [\n    { \"line_id\": 1, \"speaker\": \"A\", \"timestamp\": \"00:01:20\", \"content\": \"プロジェクト進捗について報告します\" },\n    { \"line_id\": 2, \"speaker\": \"B\", \"timestamp\": \"00:02:10\", \"content\": \"リリース日を2月1日に確定しました\" },\n    ...\n  ],\n  \"decisions\": [\n    \"リリース日を2月1日に確定\"\n  ],\n  \"todos\": [\n    \"開発チームがテストを完了させる（期限：1月31日）\"\n  ],\n  \"pending\": [\n    \"マーケティング戦略は次回会議で議論\"\n  ],\n  \"validation\": {\n    \"completeness_check\": \"passed\",\n    \"duplicate_check\": \"passed\",\n    \"line_count\": 50,\n    \"warnings\": []\n  }\n}\n```\n\n【制約】\n- 必ずJSON形式で出力\n- mapped_transcript は議題範囲のすべての行を含める\n- validation セクションで品質チェック結果を報告\n- warnings 配列で問題があれば警告を出力",
          "maxIterations": 10,
          "temperature": 0.7,
          "maxOutputTokens": 8000
        }
      },
      "id": "step3_5_ai_agent",
      "name": "Step5 - 議題別マッピング",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [2200, 300]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-5",
        "options": {
          "temperature": 0.7,
          "maxOutputTokens": 8000
        }
      },
      "id": "step3_5_claude_model",
      "name": "Claude Sonnet 4.5 (Step5)",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [2000, 200],
      "credentials": {
        "anthropicApi": {
          "id": "ANTHROPIC_CREDENTIAL_ID",
          "name": "Anthropic API"
        }
      }
    },
    {
      "parameters": {
        "sessionKey": "={{ $json.session_id }}",
        "contextWindowLength": 10
      },
      "id": "step3_5_memory",
      "name": "Simple Memory (Step5)",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [2000, 400]
    }
  ],
  "connections": {
    "Claude Sonnet 4.5 (Step5)": {
      "ai_languageModel": [
        [
          {
            "node": "Step5 - 議題別マッピング",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory (Step5)": {
      "ai_memory": [
        [
          {
            "node": "Step5 - 議題別マッピング",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    }
  }
}
````

### Step6: Claude フォーマット変換 AI Agent 構成

**ノードタイプ**: `@n8n/n8n-nodes-langchain.agent`

````json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.all_data_json }}",
        "options": {
          "systemMessage": "あなたは会議データを指定フォーマットのMarkdown議事録に変換する専門AIです。\n\n【役割】\n- 全議題分析結果、文字起こし、ファイルメタデータを統合\n- 業務要件定義書で指定されたMarkdownフォーマットに厳密に従う\n- 日時、参加者、議題、決定事項、宿題を適切に配置\n\n【入力形式】\nJSON形式で以下の構造:\n```json\n{\n  \"meeting_name\": \"プロジェクト定例会議\",\n  \"file_created_time\": \"2025-01-09T10:00:00Z\",\n  \"audio_duration_seconds\": 3600,\n  \"topics\": [\n    {\n      \"topic_id\": 1,\n      \"title\": \"プロジェクト進捗報告\",\n      \"decisions\": [...],\n      \"todos\": [...],\n      \"pending\": [...],\n      \"lines\": [...]\n    },\n    ...\n  ],\n  \"all_transcript\": [...]\n}\n```\n\n【処理方針】\n1. **日時計算**: file_created_time を開始時刻、audio_duration_seconds から終了時刻を算出\n2. **参加者推定**: 文字起こしの speaker 情報から参加者を推定、「万壽本」を必ず含める\n3. **会議目的**: topics の内容から会議の目的・背景を推測\n4. **次回日程**: 文字起こしから「次回」の日程を抽出、なければ「未定」\n5. **フォーマット厳守**: 以下のMarkdownフォーマットに厳密に従う\n\n【出力フォーマット（固定）】\n```markdown\n# 目的・背景\n\n{会議の目的を推測して記載}\n\n# 日時\n\n{YYYY} 年 {MM} 月 {DD} 日（{曜日}） {HH}:{mm} 〜 {HH}:{mm}\n\n# 参加者\n\n{参加者リスト}、万壽本\n\n# 宿題事項\n\n- {宿題1}\n- {宿題2}\n...\n\n# 決定事項\n\n- {決定事項1}\n- {決定事項2}\n...\n\n# 次回の日時\n\n{YYYY} 年 {MM} 月 {DD} 日（{曜日}） {HH}:{mm} 〜 {HH}:{mm}\n（または「未定」）\n\n# 議事内容\n\n## 本日の議題\n\n- [ ] 議題1：{議題タイトル1}\n- [ ] 議題2：{議題タイトル2}\n...\n\n## 議題1：{議題タイトル1}\n\n- {箇条書き内容1}\n- {箇条書き内容2}\n...\n\n## 議題2：{議題タイトル2}\n\n- {箇条書き内容1}\n- {箇条書き内容2}\n...\n```\n\n【制約】\n- 必ずMarkdown形式で出力（JSONではなくMarkdown）\n- フォーマットは一字一句厳守\n- 宿題事項と決定事項は全議題から集約\n- 参加者リストには必ず「万壽本」を含める\n- 日時は ISO 8601 から日本語形式に変換",
          "maxIterations": 10,
          "temperature": 0.7,
          "maxOutputTokens": 8000
        }
      },
      "id": "step4_ai_agent",
      "name": "Step6 - フォーマット変換",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [2400, 300]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-5",
        "options": {
          "temperature": 0.7,
          "maxOutputTokens": 8000
        }
      },
      "id": "step4_claude_model",
      "name": "Claude Sonnet 4.5 (Step6)",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [2200, 200],
      "credentials": {
        "anthropicApi": {
          "id": "ANTHROPIC_CREDENTIAL_ID",
          "name": "Anthropic API"
        }
      }
    },
    {
      "parameters": {
        "sessionKey": "={{ $json.session_id }}",
        "contextWindowLength": 10
      },
      "id": "step4_memory",
      "name": "Simple Memory (Step6)",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [2200, 400]
    }
  ],
  "connections": {
    "Claude Sonnet 4.5 (Step6)": {
      "ai_languageModel": [
        [
          {
            "node": "Step6 - フォーマット変換",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory (Step6)": {
      "ai_memory": [
        [
          {
            "node": "Step6 - フォーマット変換",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    }
  }
}
````

### Step7: Claude 品質保証 AI Agent 構成

**ノードタイプ**: `@n8n/n8n-nodes-langchain.agent`

````json
{
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.quality_check_data }}",
        "options": {
          "systemMessage": "あなたは議事録の品質を保証する専門AIです。\n\n【役割】\n- 生成された議事録の完全性を検証\n- 必須項目（日時、議題、決定事項等）が揃っているか確認\n- 不足項目があれば元データから補完提案\n- フォーマットが正しいかチェック\n\n【入力形式】\nJSON形式で以下の構造:\n```json\n{\n  \"generated_minutes\": \"# 目的・背景\\n...（Step6で生成された議事録）\",\n  \"source_data\": {\n    \"topics\": [...],\n    \"all_transcript\": [...],\n    \"file_metadata\": {...}\n  }\n}\n```\n\n【検証項目】\n1. **必須項目チェック**:\n   - [ ] 目的・背景\n   - [ ] 日時（開始・終了）\n   - [ ] 参加者（「万壽本」を含む）\n   - [ ] 宿題事項\n   - [ ] 決定事項\n   - [ ] 次回の日時\n   - [ ] 本日の議題\n   - [ ] 各議題の詳細内容\n\n2. **フォーマットチェック**:\n   - [ ] Markdown構文が正しいか\n   - [ ] 見出しレベルが正しいか（# → ## → ...）\n   - [ ] 箇条書きリストが正しいか\n   - [ ] チェックボックス形式が正しいか（- [ ]）\n\n3. **内容チェック**:\n   - [ ] 日時が正しいか（ISO 8601 から変換）\n   - [ ] 参加者が抜けていないか\n   - [ ] 宿題・決定事項が全議題から集約されているか\n   - [ ] 議題の詳細が箇条書きで記載されているか\n\n【処理方針】\n1. generated_minutes を検証項目に照らして確認\n2. 不足項目があれば source_data から補完\n3. フォーマットエラーがあれば修正\n4. 検証結果と補完済み議事録を出力\n\n【出力形式】\nJSON形式で返すこと:\n```json\n{\n  \"validation_status\": \"passed\" または \"corrected\",\n  \"warnings\": [\n    \"参加者に〇〇さんが抜けていたため追加しました\",\n    \"次回日時が未定だったため「未定」と明記しました\"\n  ],\n  \"final_minutes\": \"# 目的・背景\\n...（補完済み議事録）\"\n}\n```\n\n【制約】\n- 必ずJSON形式で出力\n- validation_status は \"passed\" または \"corrected\" のみ\n- warnings は配列（該当なしの場合は空配列 []）\n- final_minutes はMarkdown形式の議事録全文",
          "maxIterations": 10,
          "temperature": 0.7,
          "maxOutputTokens": 8000
        }
      },
      "id": "step5_ai_agent",
      "name": "Step7 - 品質保証",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [2800, 300]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-5",
        "options": {
          "temperature": 0.7,
          "maxOutputTokens": 8000
        }
      },
      "id": "step5_claude_model",
      "name": "Claude Sonnet 4.5 (Step5)",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [2600, 200],
      "credentials": {
        "anthropicApi": {
          "id": "ANTHROPIC_CREDENTIAL_ID",
          "name": "Anthropic API"
        }
      }
    },
    {
      "parameters": {
        "sessionKey": "={{ $json.session_id }}",
        "contextWindowLength": 10
      },
      "id": "step5_memory",
      "name": "Simple Memory (Step5)",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [2600, 400]
    }
  ],
  "connections": {
    "Claude Sonnet 4.5 (Step5)": {
      "ai_languageModel": [
        [
          {
            "node": "Step7 - 品質保証",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory (Step5)": {
      "ai_memory": [
        [
          {
            "node": "Step7 - 品質保証",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    }
  }
}
````

## Memory・Tools 設計

### Memory 設計

| ステップ                  | Memory Type   | コンテキスト長 | 選定理由                                           |
| ------------------------- | ------------- | -------------- | -------------------------------------------------- |
| Step1（音声文字起こし）   | なし          | -              | AI Agent を使用しない（HTTP Request 直接呼び出し） |
| Step2（文字起こし整形）   | なし          | -              | 並列処理のため会話履歴不要                         |
| Step3（議題抽出）         | Buffer Window | 10 ターン      | 会話の流れから議題を抽出するため文脈保持が必要     |
| Step4（議題分析）         | なし          | -              | 並列処理のため会話履歴不要                         |
| Step5（議題別マッピング） | Buffer Window | 10 ターン      | 全文字起こしと議題の正確なマッピングで文脈保持が必要 |
| Step6（フォーマット変換） | Buffer Window | 10 ターン      | 複雑なフォーマット生成で文脈理解が必要             |
| Step7（品質保証）         | Buffer Window | 10 ターン      | 検証と補完で文脈理解が必要                         |

**Memory 実装詳細**:

- **Type**: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- **Session Key**: `={{ $json.session_id }}`（実行ごとに一意）
- **Context Window Length**: 10 ターン（直近 10 回の会話を保持）
- **理由**: チャット型ではないため、Buffer Window で十分（PostgreSQL 不要）

### Tools 設計

本ワークフローでは、外部ツールは不要です。すべての AI 処理は入力データのみで完結します。

**Tools 不要の理由**:

- Step2-7 はすべて入力 JSON を処理して JSON/Markdown を出力するだけ
- 外部 API 呼び出し、データベース検索、ファイル操作は不要
- n8n Workflow Tool も使用しない

**将来の拡張可能性**:

- 議事録を自動的に Notion データベースに保存 → Workflow Tool 追加
- 宿題事項を Trello カードとして登録 → Workflow Tool 追加
- 参加者名簿を Google Sheets から検索 → Workflow Tool 追加

## ワークフロー実行時の一時メモリ管理

### 目的

各AIエージェントが出力した結果を一時的にメモリ変数に保存し、ワークフロー実行中にアクセス可能にすることで、以下を実現します：

1. **デバッグの容易化**: 各ステップの出力を確認でき、問題箇所を特定しやすい
2. **再処理の効率化**: 失敗したステップのみを再実行する際、前ステップの出力を再利用
3. **AI出力の調整**: ステップ途中で出力を確認し、必要に応じて手動調整が可能
4. **処理の透明性**: ワークフローの各段階で何が起きているかを可視化

### メモリ変数設計

#### 変数命名規則

すべてのメモリ変数は `$vars` オブジェクト内に格納し、以下の命名規則に従います：

```
$vars.step{N}_{処理内容}
```

#### 各ステップのメモリ変数

| ステップ | 変数名 | データ型 | 説明 | サイズ目安 |
|---------|--------|---------|------|-----------|
| Step1 | `$vars.step1_transcription` | Object | Fireworks Whisper出力（全文字起こし、セグメント、話者情報） | 200-500KB |
| Step1 | `$vars.step1_metadata` | Object | 音声メタデータ（時長、ファイル名、作成日時） | 1KB |
| Step2 | `$vars.step2_formatted_chunks` | Array | 整形済み文字起こしチャンク（5チャンク分） | 150-300KB |
| Step2 | `$vars.step2_merged` | Array | 統合済み整形文字起こし（全行） | 150-300KB |
| Step3 | `$vars.step3_topics` | Object | 議題リスト（議題ID、タイトル、行範囲） | 5-10KB |
| Step3 | `$vars.step3_meeting_name` | String | 会議名 | 0.1KB |
| Step4 | `$vars.step4_analyses` | Array | 議題分析結果（決定事項、宿題、保留事項） | 20-50KB |
| Step5 | `$vars.step5_mappings` | Array | 議題別マッピング済みデータ | 200-400KB |
| Step6 | `$vars.step6_markdown` | String | 生成された議事録（Markdown形式） | 20-50KB |
| Step7 | `$vars.step7_final_minutes` | String | 品質保証後の最終議事録 | 20-50KB |
| Step7 | `$vars.step7_validation` | Object | 検証結果（ステータス、警告リスト） | 2-5KB |

**総メモリ使用量**: 約 1-2MB/実行

### メモリ変数の保存方法

各ステップの後に **Set Node** を配置してメモリ変数に保存します。

#### Step1後の例:

```json
{
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "step1_transcription",
          "name": "step1_transcription",
          "value": "={{ $json.text }}",
          "type": "object"
        },
        {
          "id": "step1_metadata",
          "name": "step1_metadata",
          "value": "={{ { duration: $json.duration, filename: $json.filename, created_at: $json.created_at } }}",
          "type": "object"
        }
      ]
    },
    "options": {}
  },
  "type": "n8n-nodes-base.set",
  "name": "Save Step1 Output"
}
```

#### Step2後の例:

```json
{
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "step2_formatted_chunks",
          "name": "step2_formatted_chunks",
          "value": "={{ $json.chunks }}",
          "type": "array"
        },
        {
          "id": "step2_merged",
          "name": "step2_merged",
          "value": "={{ $json.merged_lines }}",
          "type": "array"
        }
      ]
    },
    "options": {}
  },
  "type": "n8n-nodes-base.set",
  "name": "Save Step2 Output"
}
```

### メモリ変数のアクセス方法

後続ステップでメモリ変数を参照する方法：

#### Step5でStep3とStep4の結果を参照:

```javascript
{
  "mapping_input": {
    "topic_info": "={{ $vars.step3_topics.topics[0] }}",
    "topic_analysis": "={{ $vars.step4_analyses[0] }}",
    "all_transcript": "={{ $vars.step2_merged }}"
  }
}
```

#### Step7でStep6とStep5の結果を参照:

```javascript
{
  "quality_check_data": {
    "generated_minutes": "={{ $vars.step6_markdown }}",
    "source_data": {
      "topics": "={{ $vars.step3_topics.topics }}",
      "all_transcript": "={{ $vars.step2_merged }}",
      "mappings": "={{ $vars.step5_mappings }}",
      "file_metadata": "={{ $vars.step1_metadata }}"
    }
  }
}
```

### メモリライフサイクル管理

#### 初期化（ワークフロー開始時）

Google Drive Triggerの直後に **Set Node** でセッションIDを初期化：

```json
{
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "session_id",
          "name": "session_id",
          "value": "={{ $now.toISO() }}_{{ $json.id }}",
          "type": "string"
        },
        {
          "id": "workflow_start_time",
          "name": "workflow_start_time",
          "value": "={{ $now.toISO() }}",
          "type": "string"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.set",
  "name": "Initialize Session"
}
```

#### クリーンアップ（ワークフロー終了時）

n8nはワークフロー実行完了後に自動的にメモリ変数をクリアします。明示的なクリーンアップは不要です。

### デバッグ・トラブルシューティング用途

#### エラー時の中間データ保存

エラーハンドリングフローで中間結果をJSONファイルとして保存：

```json
{
  "parameters": {
    "operation": "create",
    "folderId": "ERROR_DEBUG_FOLDER_ID",
    "name": "={{ 'debug_' + $vars.session_id + '.json' }}",
    "options": {
      "fileContent": "={{ JSON.stringify({\n  step1: $vars.step1_transcription,\n  step2: $vars.step2_merged,\n  step3: $vars.step3_topics,\n  step4: $vars.step4_analyses,\n  step5: $vars.step5_mappings,\n  step6: $vars.step6_markdown,\n  step7: $vars.step7_validation\n}, null, 2) }}"
    }
  },
  "type": "n8n-nodes-base.googleDrive",
  "name": "Save Debug Data"
}
```

### 監視ダッシュボード（将来的な拡張）

**Code Node** でメモリ変数をDiscordに通知：

```javascript
const summary = {
  session_id: $vars.session_id,
  duration: $vars.step1_metadata.duration,
  topics_count: $vars.step3_topics.topics.length,
  decisions_count: $vars.step4_analyses.reduce((sum, a) => sum + a.decisions.length, 0),
  todos_count: $vars.step4_analyses.reduce((sum, a) => sum + a.todos.length, 0),
  validation_status: $vars.step7_validation.validation_status,
  warnings: $vars.step7_validation.warnings
};

return {
  json: {
    content: `**議事録生成完了**\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\``
  }
};
```

### メモリ変数使用の利点

1. **透明性**: 各ステップの出力を可視化、ワークフロー動作を理解しやすい
2. **デバッグ効率**: 問題発生時、どのステップで失敗したか即座に特定
3. **部分再実行**: 失敗したステップのみ再実行、前ステップの出力を再利用
4. **手動調整**: AI出力をレビューし、必要に応じて手動で修正・再投入
5. **品質保証**: Step7がStep1-6のすべての出力を参照し、総合的な品質チェックを実施

## エラーハンドリング戦略

### AI エラー時のリトライ戦略

| ステップ                         | リトライ回数 | リトライ間隔                              | フォールバック              |
| -------------------------------- | ------------ | ----------------------------------------- | --------------------------- |
| Step1（Gemini 文字起こし）       | 3 回         | 5 秒、10 秒、20 秒（Exponential Backoff） | GPT-4o Audio API に切り替え |
| Step2-3（Gemini 整形・分析）     | 2 回         | 3 秒、10 秒                               | GPT-4o-mini に切り替え      |
| Step6-5（Claude 変換・品質保証） | 2 回         | 3 秒、10 秒                               | Claude 3 Opus に切り替え    |

### タイムアウト設定

- **AI Agent 全ステップ**: 60 秒/実行
- **Gemini 文字起こし**: 120 秒/実行（1 時間会議想定）
- **総処理時間タイムアウト**: 5 分（Step110 パフォーマンス要件より）

### エラー種別と対応

#### 1. Gemini 文字起こし失敗（Step1）

- **原因**: API 認証エラー、音声フォーマット不正、ネットワークエラー
- **対応**:
  1. 3 回リトライ（Exponential Backoff）
  2. 失敗時、M4A ファイルを `/エラー/` フォルダに移動
  3. Discord 通知（エラー種別、ファイル名、エラーメッセージ）
  4. GPT-4o Audio API へのフォールバック（別フロー）

#### 2. AI 処理失敗（Step2-5）

- **原因**: トークン数超過、API 障害、不適切な入力、レート制限
- **対応**:
  1. 2 回リトライ
  2. 失敗時、部分生成議事録を `[ERROR]minutes - {日付} - {会議名}.md` として保存
  3. Discord 通知（ステップ名、エラーメッセージ）
  4. バックアップモデルへの切り替え

#### 3. JSON Parse エラー

- **原因**: AI Agent が JSON 形式ではなくテキストを返した
- **対応**:
  1. Code Node でエラー検知
  2. プロンプト強化版でリトライ（「必ず JSON 形式で返してください」を明記）
  3. 2 回失敗でエラーフローへ遷移

#### 4. Google Drive 保存失敗

- **原因**: 権限エラー、ストレージ容量不足、ネットワークエラー
- **対応**:
  1. 3 回リトライ（5 秒、10 秒、20 秒）
  2. n8n 内部ストレージに一時保存
  3. Discord 通知（手動で Google Drive へアップロード依頼）

## 次ステップへの引き継ぎ事項

### AI Agent 配置箇所（12 層アーキテクチャマッピング）

| Layer | Layer 名       | AI Agent 配置                                           |
| ----- | -------------- | ------------------------------------------------------- |
| L1    | Trigger        | なし（Google Drive Trigger）                            |
| L2    | Input          | なし（Google Drive: ファイル取得）                      |
| L3    | Validation     | なし（Code Node: ファイル形式チェック）                 |
| L4    | Transformation | **Step1: Fireworks Whisper 文字起こし** （L4 配置）     |
| L5    | Core Logic     | **Step2-7: AI Agent 群** （L5 配置）                    |
| L6    | Integration    | なし（Google Drive: 議事録保存）                        |
| L7    | Output         | なし（Google Drive: ファイル移動、Discord 通知）        |
| L8    | Error Handling | Error Trigger → エラーフロー                            |
| L9    | Security       | Credentials 管理（OAuth2、API Key）                     |
| L10   | Monitoring     | Code Node: ログ出力、Discord 通知                       |
| L11   | Performance    | Split in Batches: 並列処理（Step2、Step4、Step5）       |
| L12   | Orchestration  | IF Node: 条件分岐、Switch Node: エラー種別判定          |

### 必要な Credentials

| Credential 名       | タイプ      | 用途                       | 環境変数              |
| ------------------- | ----------- | -------------------------- | --------------------- |
| Google Drive OAuth2 | OAuth2      | Google Drive 操作          | -                     |
| Fireworks AI API    | API Key     | Whisper 音声文字起こし     | `FIREWORKS_API_KEY`   |
| Google Gemini API   | API Key     | Gemini AI 処理（Step2-3）  | `GOOGLE_API_KEY`      |
| Anthropic API       | API Key     | Claude AI 処理（Step6-5）  | `ANTHROPIC_API_KEY`   |
| Discord Webhook     | Webhook URL | 通知                       | `DISCORD_WEBHOOK_URL` |

### 特記事項

1. **AI Agent は必須ノードタイプを使用**:

   - メインノード: `@n8n/n8n-nodes-langchain.agent`
   - Gemini Model: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
   - Claude Model: `@n8n/n8n-nodes-langchain.lmChatAnthropic`
   - Memory: `@n8n/n8n-nodes-langchain.memoryBufferWindow`

2. **Step1（音声文字起こし）はAI Agentを使用しない**:
   - Fireworks AI Whisper APIをHTTP Requestノードで直接呼び出し
   - 理由: 音声ファイル（M4A）を直接APIに送信する必要があるため
   - エンドポイント: `https://api.fireworks.ai/v1/audio/transcriptions`
   - モデル: `whisper-v3-large`
   - Diarization（話者分離）: 有効化（+40%サーチャージ）
   - 処理速度: 1時間音声を約4秒で処理（従来Deepgram比95%高速化）

3. **並列処理の実装**:

   - Step2: Split in Batches（バッチサイズ 5） + AI Agent × 5 並列
   - Step4: Split in Batches（バッチサイズ 3） + AI Agent × 3 並列
   - Merge Node で結果統合

4. **System Prompt の重要性**:

   - 各ステップの System Message は非常に詳細に記述
   - 入力形式、出力形式、処理方針、制約を明示
   - JSON 形式出力を強制するため「必ず JSON 形式で出力」を明記

5. **コスト最適化の鍵**:
   - Fireworks AI Whisper採用で月間\$307.00削減（97%削減）
   - 1実行あたり: \$0.482（従来\$15.832比97%削減）
   - 年間削減額: \$3,684.00/年
   - Temperature最適化で出力トークン削減
   - 並列処理で処理時間短縮（コスト増なし）

6. **パフォーマンス目標達成のための最適化**:
   - 文字起こし高速化: 45秒 → 4秒（91%削減）
   - 並列バッチサイズ拡大（Step2: 5→8、Step4: 3→5）
   - Temperature調整（0.2固定）で生成トークン削減
   - **目標2分54秒を達成可能**（目標3分以内をクリア）

---

**Step020 完了**: AI 設定書を作成しました。次は Step030（技術要件変換）へ進みます。
