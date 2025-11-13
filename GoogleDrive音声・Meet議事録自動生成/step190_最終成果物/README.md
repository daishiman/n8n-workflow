# GoogleDrive音声Meet議事録自動生成システム - n8nワークフロー自動設計 v4.0

## 概要

GoogleDrive内のM4A音声ファイル（Google Meet録音）を**自動検知**し、**高速・低コストな文字起こし**（Fireworks Whisper v3: 4秒/1時間、99%コスト削減）を実行後、**AI分析**を経て**構造化された議事録Markdown**を生成・保存する完全自動化ワークフローです。

**主な特徴**:
- **99%コスト削減**: Fireworks Whisper v3採用（Deepgram比）
- **超高速処理**: 4秒/1時間音声の文字起こし
- **完全自動化**: M4A検知から議事録保存まで人手不要
- **AI適材適所**: Gemini Flash 2.5（高速処理）+ Claude Sonnet 4.5（高精度分析）
- **並列処理**: 5並列チャンク + 3並列議題で処理時間大幅短縮

## 機能

- **自動音声文字起こし**: Fireworks Whisper v3による高速・低コスト文字起こし（4秒/1時間音声）
- **AI文字起こし整形**: Gemini Flash 2.5による読みやすい議事録形式への整形（フィラー削除、箇条書き化）
- **AI議題抽出**: Gemini Flash 2.5による会議議題の自動抽出（議題タイトル、時刻、重要度）
- **AI議題分析**: Gemini Flash 2.5による決定事項、アクションアイテム、保留事項の抽出
- **AI議題別マッピング**: Claude Sonnet 4.5による文字起こしテキストへの正確なマッピング
- **AIフォーマット変換**: Claude Sonnet 4.5による読みやすいMarkdown議事録への変換
- **AI品質保証**: Claude Sonnet 4.5による最終チェック（完全性、整合性、誤字脱字）
- **自動保存・通知**: 議事録Google Drive保存、M4A処理済み移動、Discord通知、監査ログ送信

## アーキテクチャ

- **フレームワーク**: 12層アーキテクチャ（データフロー7層 + 横断的関心事5層）
- **グループ構成**: メインフロー9グループ
- **総ノード数**: 50個（機能ノード40 + Sticky Note 10）
- **AIモデル**: Gemini Flash 2.5（Step2-4）+ Claude Sonnet 4.5（Step5-7）
- **デザインパターン**:
  - Pattern 1: Error-First Design（全AI Agent: maxTries=3）
  - Pattern 2: AI Agent with Sub-Nodes（6 AI Agents + 5 Memory + 6 Chat Models）
  - Pattern 3: Batch Processing（5並列チャンク、3並列議題）

### ワークフローフロー

```
M4Aファイル検知（Google Drive Trigger）
  ↓
Group 1: データ受信・検証（ファイル情報取得、妥当性チェック、ファイル名正規化）
  ↓
Group 2: 音声文字起こし・チャンク分割（Fireworks Whisper v3、5並列バッチ開始）
  ↓ (ループバック)
Group 3: 文字起こし整形（5並列）（AI Agent Step2 - Gemini Flash 2.5）
  ↓ (ループバック完了)
Group 4: チャンク統合・議題抽出（Merge、AI Agent Step3 - Gemini Flash 2.5）
  ↓
Group 5: 議題分析準備（議題分割処理）
  ↓
Group 6: 議題並列処理開始（3並列バッチ開始）
  ↓ (ループバック)
Group 7: 議題分析・マッピング（並行実行）（AI Agent Step4 - Gemini + AI Agent Step5 - Claude）
  ↓ (ループバック完了)
Group 8: 議題統合・フォーマット変換（Merge、AI Agent Step6 - Claude Sonnet 4.5）
  ↓
Group 9: 品質保証・出力・監視（AI Agent Step7 - Claude、議事録保存、Discord通知）
  ↓
完了
```

## クイックスタート

1. **n8n UIを開く**
2. **「Workflows」→「Import from File」**
3. **`GoogleDrive音声Meet議事録自動生成_workflow_integrated_v4.json` を選択**
4. **Credentialsを設定**（詳細は「実装手順書.md」参照）
   - Google Drive OAuth2
   - Fireworks AI API
   - Google Gemini OAuth2
   - Anthropic API
   - Discord Webhook（任意）
5. **テスト実行**（M4AファイルをGoogle Driveにアップロード）
6. **本番デプロイ**（ワークフローを「Active」に設定）

## ファイル構成

```
step190_最終成果物/
├── README.md（このファイル）
├── GoogleDrive音声Meet議事録自動生成_workflow_integrated_v4.json（ワークフローJSON）
├── GoogleDrive音声Meet議事録自動生成_metadata_v4.json（メタデータ）
├── 実装手順書.md（詳細な実装手順）
└── 検証レポート.md（検証結果サマリー）
```

## 要件

### 必須ソフトウェア

- **n8n** バージョン: 1.0以上（推奨: 最新版）

### 必須Credentials

| Credential名 | タイプ | 用途 |
|-------------|--------|------|
| Google Drive OAuth2 | googleDriveOAuth2Api | M4Aファイル検知、ダウンロード、議事録保存、M4A移動 |
| Fireworks AI API | fireworksApi | Whisper v3文字起こし（HTTP Request） |
| Google Gemini OAuth2 | googleGeminiOAuth2Api | AI Agent Step2-4（Gemini Flash 2.5） |
| Anthropic API | anthropicApi | AI Agent Step5-7（Claude Sonnet 4.5） |

### 任意Credentials

| Credential名 | タイプ | 用途 |
|-------------|--------|------|
| Discord Webhook | httpRequest | 処理完了通知 |
| 監査ログサーバー | httpRequest | 監査ログ送信 |

## 推定コストとパフォーマンス

### コスト（1時間音声）

| 項目 | コスト（概算） |
|------|--------------|
| Fireworks Whisper v3 | 約$0.01（Deepgram比99%削減） |
| Gemini Flash 2.5 | 約$0.02-0.05（15000-25000 tokens） |
| Claude Sonnet 4.5 | 約$0.05-0.10（10000-15000 tokens） |
| **合計** | **約$0.08-0.16/時間** |

### 処理時間（1時間音声）

| フェーズ | 処理時間 |
|---------|---------|
| 文字起こし（Fireworks） | 4秒 |
| チャンク整形（5並列） | 2-4分 |
| 議題抽出 | 数秒 |
| 議題分析・マッピング（3並列） | 変動 |
| フォーマット変換・品質保証 | 数秒 |
| **合計** | **約5-7分** |

## パフォーマンス最適化

- **5並列チャンク処理**: 文字起こし整形を5チャンク同時実行
- **3並列議題処理**: 議題分析・マッピングを3議題同時実行
- **AI Agent並行実行**: Step4（議題分析）とStep5（議題別マッピング）を並行実行
- **Error-First Design**: 全AI Agentに3回リトライ設定（maxTries=3）
- **メモリ機能**: 5つのAI Agentでcontext window=10の対話履歴管理

## サポート

### 設計ドキュメント

- **業務理解書**: `step010_業務理解/業務理解書.md`
- **AI設定書**: `step020_AI設定/AI設定書.md`
- **技術要件書**: `step030_技術要件変換/技術要件書.md`
- **グループ構成表**: `step040_タスク分解/グループ構成表.md`
- **AIエージェント責務定義書**: `step050_AIエージェント責務/AIエージェント責務定義書.md`
- **詳細設計書**: `step060_パターン適用/詳細設計書.md`

### 実装ドキュメント

- **統合完成レポート**: `step150_統合JSON/統合完成レポート.md`
- **ワークフロー検証レポート**: `step160_ワークフロー検証/ワークフロー検証レポート.md`
- **Sticky Note設計ドキュメント**: `step180_StickyNote完成/Sticky Note設計ドキュメント.md`

### 実装手順

詳細な実装手順は **`実装手順書.md`** を参照してください。

- Credentials設定
- AI Agent Chat Model接続（重要）
- テスト実行
- エラーハンドリングテスト
- 本番デプロイ
- トラブルシューティング

## トラブルシューティング

| 問題 | 原因 | 対処 |
|------|------|------|
| AI Agent接続エラー | Chat ModelサブノードのCredentials未設定 | 実装手順書「手順2.1」を参照、Chat Modelサブノードを手動接続 |
| 文字起こし失敗 | Fireworks API Key無効 | Credentials設定を再確認 |
| Google Drive認証エラー | OAuth2トークン期限切れ | Google Drive Credentials再設定 |
| Discord通知失敗 | Webhook URL無効 | Discord Webhookを再作成 |

## ライセンス

このワークフローは **n8nワークフロー自動設計プロセス v4.0** により生成されました。

---

**作成日**: 2025-11-13
**バージョン**: v4.0
**作成者**: n8n AI自動設計システム（Claude Code + n8n-MCP）
