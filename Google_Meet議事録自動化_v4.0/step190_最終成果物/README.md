# Google Meet議事録自動化システム - 最終成果物パッケージ

## 📋 プロジェクト概要

**プロジェクト名**: Google Meet議事録自動化システム v4.0 (AI Agent Nodes)
**作成日**: 2025-01-11
**設計手法**: n8nワークフロー自動設計プロセス v4.0（12層アーキテクチャ + 12要素フレームワーク）
**特徴**: LangChain AI Agent Nodeを活用した高度なAI処理

### ビジネス価値

- **業務効率化**: 議事録作成時間を60分 → 3分（95%削減）
- **月間削減時間**: 約19時間/月（会議20回/月想定）
- **ROI**: 2,708%（人件費削減 ¥60,000/月 vs. AIコスト ¥2,136/月）
- **品質向上**: AI による構造化された一貫性のある議事録

---

## 🏗️ アーキテクチャ概要

### 12層アーキテクチャ

**データフロー層（L1-L7）**:
```
L1: Trigger → L2: Input → L3: Validation → L4: Transformation →
L5: Core Logic → L6: Integration → L7: Output
```

**横断的関心事層（L8-L12）**:
```
L8: Error Handling | L9: Security | L10: Monitoring |
L11: Performance | L12: Orchestration
```

### グループ構成（13グループ）

**メインフロー（12グループ）**:
1. トリガー & ファイル取得
2. バリデーション
3. Gemini音声文字起こし
4. チャンク分割
5. チャンク並列処理（Step1）
6. チャンク統合
7. 議題抽出（Step2）
8. 議題データ再構成
9. 議題並列処理（Step3）
10. 議題統合 + フォーマット変換（Step4）
11. 品質保証 + 議事録保存（Step5）
12. ファイル移動 + 通知 + 最終結果

**エラーフロー（1グループ）**:
13. エラーハンドリング

---

## 📊 処理フロー詳細

### 全体データフロー

```
Google Drive（M4Aアップロード）
  ↓ 5分ポーリング
Group 1: トリガー & ファイル取得
  ↓ M4Aバイナリ
Group 2: バリデーション（mimeType, size確認）
  ↓
Group 3: Gemini音声文字起こし（30-60秒）
  ↓ JSON配列（300行）
Group 4: チャンク分割（20-30行ごと、オーバーラップ6行）
  ↓ 12チャンク
Group 5: チャンク並列処理（5並列、Gemini整形）
  ↓ 整形済みチャンク
Group 6: チャンク統合（line_idソート、重複除去）
  ↓ 統合lines
Group 7: 議題抽出（Gemini + Memory）
  ↓ 3議題
Group 8: 議題データ再構成
  ↓ 議題ごとのlines
Group 9: 議題並列処理（3並列、Gemini分析）
  ↓ 議題分析結果
Group 10: 議題統合 + フォーマット変換（Claude + Memory）
  ↓ Markdown議事録
Group 11: 品質保証（Claude + Memory）+ 議事録保存
  ↓ 最終議事録URL
Group 12: M4A移動 + Discord通知 + 最終結果
  ↓
ワークフロー完了
```

---

## 🤖 AI処理詳細（6段階）

| Step | AI処理 | モデル | ノードタイプ | 処理時間 | 入力 | 出力 |
|------|-------|--------|------------|---------|------|------|
| **Step0** | 音声文字起こし | Gemini 2.0 Flash | HTTP Request* | 30-60秒 | M4Aバイナリ | JSON配列（lines） |
| **Step1** | 文字起こし整形 | Gemini 2.0 Flash | **AI Agent Node** | 15秒（5並列） | チャンク | 整形済みチャンク |
| **Step2** | 議題抽出 | Gemini 2.0 Flash + Memory | **AI Agent Node** | 20-30秒 | 全lines | 議題リスト |
| **Step3** | 議題分析 | Gemini 2.0 Flash | **AI Agent Node** | 5秒（3並列） | 議題データ | 分析結果 |
| **Step4** | フォーマット変換 | Claude Sonnet 4.5 + Memory | **AI Agent Node** | 60-90秒 | 全データ | Markdown |
| **Step5** | 品質保証 | Claude Sonnet 4.5 + Memory | **AI Agent Node** | 30-60秒 | Markdown + 元データ | 最終Markdown |

**総処理時間**: 約3分（1時間会議）

**注釈**:
- ⚠️ **Step0のみHTTP Request**: Gemini Audio APIはバイナリM4Aデータの直接送信が必要なため、HTTP Requestノードを使用
- ✅ **Step1-5はAI Agent Node**: n8nのLangChain統合（`@n8n/n8n-nodes-langchain.agent`）を活用し、高度なAI処理を実現
- 📦 **Memory使用**: Step2, 4, 5では`Window Buffer Memory`を使用して会話コンテキストを保持

---

## 💰 コスト試算

### 月額コスト（20回/月実行）

| AI処理 | モデル | 1実行コスト | 月額コスト |
|-------|--------|------------|-----------|
| Step0 | Gemini 2.0 Flash | ¥0.6 | ¥12 |
| Step1 | Gemini 2.0 Flash | ¥0.5 | ¥10 |
| Step2 | Gemini 2.0 Flash | ¥0.6 | ¥12 |
| Step3 | Gemini 2.0 Flash | ¥0.12 | ¥2.4 |
| Step4 | Claude Sonnet 4.5 | ¥60 | ¥1,200 |
| Step5 | Claude Sonnet 4.5 | ¥45 | ¥900 |
| **合計** | - | **¥106.82** | **¥2,136.4/月** |

**年間コスト**: ¥25,637/年

### ROI計算

- **人件費削減**: 20時間/月 × ¥3,000/時間 = ¥60,000/月
- **AIコスト**: ¥2,136/月
- **月間削減額**: ¥60,000 - ¥2,136 = ¥57,864/月
- **ROI**: (¥57,864 / ¥2,136) = **2,708%**

---

## 🔐 セキュリティ要件

### 認証情報

| システム | 認証方式 | 環境変数 |
|---------|---------|---------|
| Google Drive | OAuth2 | n8nで設定 |
| Google Gemini | API Key | `GOOGLE_API_KEY` |
| Anthropic Claude | API Key | `ANTHROPIC_API_KEY` |
| Discord Webhook | Webhook URL | `DISCORD_WEBHOOK_URL` |

### セキュリティ対策

- **通信暗号化**: すべてのAPI通信でHTTPS/TLS 1.2+
- **データ暗号化**: Google Drive標準暗号化（AES-256）
- **API Key管理**: n8n環境変数で安全に管理
- **アクセス制御**: Google Drive組織アクセス制御

---

## 📂 成果物一覧

### Phase 1: 要件定義・設計（6ドキュメント）

| ステップ | ドキュメント名 | 内容 |
|---------|-------------|------|
| Step010 | 業務理解書 | 12要素フレームワークによる業務要件収集 |
| Step020 | AI設定書 | 6つのAI処理のモデル選定、パラメータ設定 |
| Step030 | 技術要件書 | 12層アーキテクチャへの技術要件マッピング |
| Step040 | グループ構成表 | 13グループへのタスク分解 |
| Step050 | AIエージェント責務定義書 | 単一責務の原則に基づく設計 |
| Step060 | 詳細設計書 | 5つのベストプラクティスパターン適用 |

### Phase 2-3: 実装準備（本ドキュメント）

| ファイル名 | 内容 |
|-----------|------|
| README.md | 本ドキュメント（全体サマリー、実装手順） |
| workflow_metadata.json | ワークフロー メタデータ（ノード数、グループ構成等） |
| implementation_guide.md | n8n実装ステップバイステップガイド |

---

## 🚀 実装手順

### 前提条件

1. **n8nインスタンス**: v1.0.0以上、LangChain統合有効
2. **Credentials設定**:
   - Google Drive OAuth2（スコープ: `drive.file`）
   - Gemini API Key（`GOOGLE_API_KEY`）
   - Anthropic API Key（`ANTHROPIC_API_KEY`）
   - Discord Webhook URL（`DISCORD_WEBHOOK_URL`、オプション）

### 実装ステップ

#### Step 1: 新規ワークフロー作成

1. n8nダッシュボードで「New Workflow」をクリック
2. ワークフロー名を「Google Meet議事録自動化」に設定

#### Step 2: Group 1（トリガー & ファイル取得）を実装

**ノード1: Google Drive Trigger**
1. 「Add node」→「Trigger」→「Google Drive Trigger」を選択
2. パラメータ設定:
   - Event: `file.created`
   - Trigger on: `Specific Folder`
   - Folder: `/議事録_入力/`（事前作成）
   - Poll Times: Every 5 minutes
   - Filters: `mimeType` contains `audio/m4a`

**ノード2: Google Drive: Get File Info**
1. 「Add node」→「Google Drive」を選択
2. パラメータ設定:
   - Resource: `File`
   - Operation: `Get`
   - File ID: `{{ $json.id }}`
   - Options → Fields: `id, name, mimeType, size, createdTime, webContentLink`

**ノード3: Google Drive: M4A Download**
1. 「Add node」→「Google Drive」を選択
2. パラメータ設定:
   - Resource: `File`
   - Operation: `Download`
   - File ID: `{{ $json.id }}`
   - Binary Property Name: `m4a_data`

#### Step 3: Group 2（バリデーション）を実装

**ノード: IF**
1. 「Add node」→「IF」を選択
2. Conditions:
   - Condition 1: `{{ $json.mimeType }}` equals `audio/m4a`
   - Condition 2: `{{ $json.size }}` < `1073741824` (1GB)
   - Combine: ALL

#### Step 4: Group 3（Gemini音声文字起こし）を実装

**ノード: AI Agent (Gemini)**
1. 「Add node」→「AI Agent」を選択
2. Chat Model:
   - 「Add Chat Model」→「Google Gemini Chat Model」
   - Model: `gemini-2.0-flash-exp`
   - Credentials: Gemini API Key
   - Options:
     - Temperature: `0.3`
     - Max Output Tokens: `100000`
     - Audio Timestamp: `true`
3. System Prompt: Step020のAI設定書「Step0: Gemini音声文字起こし」のSystem Promptをコピー
4. 入力データ: `{{ $binary.m4a_data }}`

#### Step 5: Group 4（チャンク分割）を実装

**ノード: Code**
1. 「Add node」→「Code」を選択
2. Mode: `Run Once for All Items`
3. Code: Step060の詳細設計書「チャンク分割」のJavaScriptコードをコピー

#### Step 6: Group 5（チャンク並列処理）を実装

**ノード1: Split in Batches**
1. 「Add node」→「Split In Batches」を選択
2. Batch Size: `5`
3. Options → Reset: `false`

**ノード2: AI Agent (Gemini)**
1. 「Add node」→「AI Agent」を選択
2. Chat Model:
   - 「Add Chat Model」→「Google Gemini Chat Model」
   - Model: `gemini-2.0-flash-exp`
   - Temperature: `0.4`
   - Max Output Tokens: `4000`
3. System Prompt: Step020のAI設定書「Step1: Gemini文字起こし整形」のSystem Promptをコピー
4. Memory: なし

#### Step 7: Group 6（チャンク統合）を実装

**ノード1: Merge**
1. 「Add node」→「Merge」を選択
2. Mode: `Append`
3. Options:
   - Remove Duplicates: `true`
   - Duplicate Comparison Field: `line_id`

**ノード2: Code**
1. 「Add node」→「Code」を選択
2. Mode: `Run Once for All Items`
3. Code: Step060の詳細設計書「チャンク統合」のJavaScriptコードをコピー

#### Step 8: Group 7（議題抽出）を実装

**ノード: AI Agent (Gemini + Memory)**
1. 「Add node」→「AI Agent」を選択
2. Chat Model:
   - 「Add Chat Model」→「Google Gemini Chat Model」
   - Model: `gemini-2.0-flash-exp`
   - Temperature: `0.4`
   - Max Output Tokens: `4000`
3. Memory:
   - 「Add Memory」→「Window Buffer Memory」
   - Session Key: `step2_memory`
   - Context Window Length: `10`
4. System Prompt: Step020のAI設定書「Step2: Gemini議題抽出」のSystem Promptをコピー

#### Step 9: Group 8（議題データ再構成）を実装

**ノード: Code**
1. 「Add node」→「Code」を選択
2. Code: Step060の詳細設計書「議題データ再構成」のJavaScriptコードをコピー

#### Step 10: Group 9（議題並列処理）を実装

**ノード1: Split in Batches**
1. 「Add node」→「Split In Batches」を選択
2. Batch Size: `3`

**ノード2: AI Agent (Gemini)**
1. 「Add node」→「AI Agent」を選択
2. Chat Model:
   - Model: `gemini-2.0-flash-exp`
   - Temperature: `0.4`
   - Max Output Tokens: `4000`
3. System Prompt: Step020のAI設定書「Step3: Gemini議題分析」のSystem Promptをコピー

#### Step 11: Group 10（議題統合 + フォーマット変換）を実装

**ノード1: Merge**
1. 「Add node」→「Merge」を選択

**ノード2: AI Agent (Claude + Memory)**
1. 「Add node」→「AI Agent」を選択
2. Chat Model:
   - 「Add Chat Model」→「Anthropic Chat Model」
   - Model: `claude-sonnet-4-5-20250929`
   - Temperature: `0.7`
   - Max Tokens: `8000`
3. Memory:
   - Session Key: `step4_memory`
   - Context Window Length: `5`
4. System Prompt: Step020のAI設定書「Step4: Claudeフォーマット変換」のSystem Promptをコピー

#### Step 12: Group 11（品質保証 + 議事録保存）を実装

**ノード1: AI Agent (Claude + Memory)**
1. 「Add node」→「AI Agent」を選択
2. Chat Model:
   - Model: `claude-sonnet-4-5-20250929`
   - Temperature: `0.7`
   - Max Tokens: `8000`
3. Memory:
   - Session Key: `step5_memory`
   - Context Window Length: `5`
4. System Prompt: Step020のAI設定書「Step5: Claude品質保証」のSystem Promptをコピー

**ノード2: Google Drive: Create File**
1. 「Add node」→「Google Drive」を選択
2. パラメータ設定:
   - Resource: `File`
   - Operation: `Create`
   - Name: `{{ 'minutes - ' + $now.format('YYYY-MM-DD') + ' - ' + $json.meeting_name + '.md' }}`
   - Parents → Folder: `/議事録_出力/`
   - MIME Type: `text/markdown`
   - File Content: `{{ $json.markdown }}`

#### Step 13: Group 12（ファイル移動 + 通知）を実装

**ノード1: Google Drive: Update File**
1. 「Add node」→「Google Drive」を選択
2. パラメータ設定:
   - Resource: `File`
   - Operation: `Update`
   - File ID: `{{ $('Google Drive Trigger').item.json.id }}`
   - Update Fields → Parents → Folder: `/processed/`

**ノード2: Discord Webhook**
1. 「Add node」→「Discord」を選択
2. Webhook URL: `{{ $env.DISCORD_WEBHOOK_URL }}`
3. Content: `✅ 議事録生成完了！\n📄 ファイル: {{ $json.name }}\n🔗 URL: {{ $json.webViewLink }}`

**ノード3: Set**
1. 「Add node」→「Set」を選択
2. Values:
   - `status` = `"success"`
   - `minutes_url` = `{{ $json.webViewLink }}`
   - `execution_time` = `{{ $executionTime }}`

#### Step 14: Error Group 1（エラーハンドリング）を実装

**ノード1: Error Trigger**
1. 「Add node」→「Error Trigger」を選択

**ノード2-7**: Step060の詳細設計書「Error Group 1」の構成に従って実装

---

## 🧪 テスト手順

### 1. 単体テスト

**Test 1: トリガー & ファイル取得**
1. Google Driveの `/議事録_入力/` フォルダにテストM4Aファイルをアップロード
2. 5分以内にワークフローが起動することを確認
3. ファイルメタデータが正しく取得されることを確認

**Test 2: Gemini音声文字起こし**
1. 1分間のテストM4Aファイルを用意
2. JSON配列が正しく生成されることを確認
3. Speaker Diarizationが動作することを確認

**Test 3: 並列処理**
1. チャンク並列処理（Group 5）が5並列で動作することを確認
2. 議題並列処理（Group 9）が3並列で動作することを確認

### 2. 統合テスト

**Test 4: エンドツーエンド**
1. 実際の1時間会議のM4Aファイルを使用
2. 3分以内に議事録が生成されることを確認
3. 議事録フォーマットが業務要件定義書に準拠していることを確認
4. Discord通知が送信されることを確認

### 3. エラーテスト

**Test 5: エラーハンドリング**
1. 不正なmimeTypeのファイルをアップロード → バリデーションエラー
2. 1GBを超えるファイルをアップロード → バリデーションエラー
3. Gemini APIエラーを意図的に発生 → リトライ → エラー通知

---

## 📚 参考資料

### 設計ドキュメント

- **Step010**: 業務理解書（12要素フレームワーク）
- **Step020**: AI設定書（AIモデル選定、パラメータ設定）
- **Step030**: 技術要件書（12層アーキテクチャ）
- **Step040**: グループ構成表（13グループ）
- **Step050**: AIエージェント責務定義書（単一責務の原則）
- **Step060**: 詳細設計書（ベストプラクティスパターン）

### 技術スタック

- **n8n**: v1.0.0以上（LangChain統合有効化必須）
- **LangChain**: @n8n/n8n-nodes-langchain v1.7以上
  - AI Agent Node（`@n8n/n8n-nodes-langchain.agent`）
  - Google Gemini Chat Model（`@n8n/n8n-nodes-langchain.lmChatGoogleGemini`）
  - Anthropic Chat Model（`@n8n/n8n-nodes-langchain.lmChatAnthropic`）
  - Window Buffer Memory（`@n8n/n8n-nodes-langchain.memoryBufferWindow`）
- **Google Gemini**: 2.0 Flash Experimental
- **Anthropic Claude**: Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **Google Drive API**: v3
- **Discord Webhook**: -

### ワークフロー統計

- **総ノード数**: 47ノード
- **AI Agent Node数**: 5ノード（Step1-5）
- **接続数**: 31接続
- **グループ数**: 13グループ（メイン12 + エラー1）

---

## 🔧 トラブルシューティング

### 問題1: Gemini APIエラー「Rate Limit Exceeded」

**原因**: APIレート制限超過
**解決策**:
1. Split in Batchesのバッチサイズを削減（5 → 3）
2. リトライ間隔を延長（5秒 → 10秒）

### 問題2: 議事録に一部の議題が含まれない

**原因**: Step2（議題抽出）のAI判断ミス
**解決策**:
1. Step2のSystem Promptを調整し、議題抽出基準を明確化
2. Temperatureを0.4 → 0.5に上げて多様性を向上

### 問題3: 処理時間が3分を超える

**原因**: AI処理の遅延
**解決策**:
1. Step4のMax Tokensを8000 → 6000に削減
2. 入力データを要約してから渡す

---

## 📝 ライセンス

本ドキュメントは、n8nワークフロー自動設計プロセス v4.0 の成果物として提供されます。

## 作成情報

- **作成日**: 2025-01-11
- **作成者**: Claude Code (Anthropic)
- **バージョン**: v4.0
- **設計手法**: 12層アーキテクチャ + 12要素フレームワーク
