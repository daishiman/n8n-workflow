# 実装ガイド

## 成果物概要

このディレクトリには、Google Meet議事録自動化システムv4.0の完全な実装パッケージが含まれています。

### 📦 含まれるファイル

1. **Google_Meet議事録自動化システム_workflow_integrated_v4.json** (60KB)
   - n8nにインポート可能な完全なワークフローJSON
   - 47ノード、32接続
   - 13グループ（メイン12 + エラー1）

2. **README.md** (16KB)
   - 実装手順書
   - 環境設定、Credentials設定、テスト手順

3. **workflow_metadata.json** (7.2KB)
   - ワークフローメタデータ
   - AI設定、コスト情報、パフォーマンス指標

4. **PROJECT_SUMMARY.md** (ルートディレクトリ)
   - プロジェクト全体のサマリー
   - ビジネス価値、アーキテクチャ、設計の特徴

## 🚀 クイックスタート

### 1. n8nにインポート

```bash
# n8n UIで以下を実行:
# 1. Workflows → Import from File
# 2. Google_Meet議事録自動化システム_workflow_integrated_v4.json を選択
# 3. Import をクリック
```

### 2. Credentials設定

以下のCredentialsを設定してください:

- **Google Drive OAuth2** (スコープ: drive.file)
- **GOOGLE_API_KEY** (Gemini API)
- **ANTHROPIC_API_KEY** (Claude API)
- **DISCORD_WEBHOOK_URL** (オプション)

詳細はREADME.mdを参照。

### 3. Google Driveフォルダ作成

```
/議事録_入力/    - M4Aファイルをアップロード
/議事録_出力/    - 議事録が保存される
/processed/      - 処理済みM4Aファイル
/エラー/          - エラー時のM4Aファイル
```

### 4. ワークフロー有効化

n8n UIでワークフローを有効化してください。

## 📊 期待される効果

- **議事録作成時間**: 60分 → 3分（95%削減）
- **月間削減時間**: 約19時間/月
- **月間削減額**: ¥57,864/月
- **ROI**: 2,708%

## 🏗️ アーキテクチャ

### 12層アーキテクチャ

**データフロー層 (L1-L7)**:
- L1: Trigger - Google Drive新規ファイル検知
- L2: Input - M4Aファイル取得
- L3: Validation - ファイル形式・サイズ検証
- L4: Transformation - チャンク分割・統合
- L5: Core Logic - 6段階AI処理
- L6: Integration - Google Drive、Discord連携
- L7: Output - 最終結果セット

**横断的関心事層 (L8-L12)**:
- L8: Error Handling - Error Trigger + リカバリー
- L9: Security - OAuth2、API Key、HTTPS
- L10: Monitoring - Sticky Note、Discord通知
- L11: Performance - 並列処理（5チャンク、3議題）
- L12: Orchestration - IF分岐、Split in Batches

### 6段階AI処理

| Step | AI処理 | モデル | 処理時間 |
|------|-------|--------|----------|
| Step0 | 音声文字起こし | Gemini 2.0 Flash | 30-60秒 |
| Step1 | 文字起こし整形 | Gemini 2.0 Flash (5並列) | 15秒 |
| Step2 | 議題抽出 | Gemini 2.0 Flash + Memory | 20-30秒 |
| Step3 | 議題分析 | Gemini 2.0 Flash (3並列) | 5秒 |
| Step4 | フォーマット変換 | Claude Sonnet 4.5 + Memory | 60-90秒 |
| Step5 | 品質保証 | Claude Sonnet 4.5 + Memory | 30-60秒 |

**総処理時間**: 約3分（1時間会議）

## 🔧 トラブルシューティング

### よくある問題

1. **Gemini文字起こし失敗**
   - M4Aファイルが1GB未満か確認
   - GOOGLE_API_KEYが正しく設定されているか確認

2. **Claude処理タイムアウト**
   - Timeout設定を120秒に増やす
   - 長時間会議（2時間超）の場合は分割処理を検討

3. **Discord通知が届かない**
   - DISCORD_WEBHOOK_URLが正しく設定されているか確認
   - オプション設定なので、未設定でもワークフローは動作します

詳細はREADME.mdを参照してください。

## 📝 設計ドキュメント

Phase 1の設計ドキュメントは以下のディレクトリにあります:

```
../step010_業務理解/業務理解書.md
../step020_AI設定/AI設定書.md
../step030_技術要件変換/技術要件書.md
../step040_タスク分解/グループ構成表.md
../step050_AIエージェント責務/AIエージェント責務定義書.md
../step060_パターン適用/詳細設計書.md
```

## 🎓 学習ポイント

このプロジェクトで適用された設計原則:

1. **12層アーキテクチャ**: データフロー層と横断的関心事層の分離
2. **12要素フレームワーク**: 包括的な業務要件収集
3. **単一責務の原則**: 各AIエージェントが1つの責務のみ
4. **並列処理パターン**: Split in Batchesによる高速化
5. **エラーハンドリングパターン**: Error Trigger + 種別判定 + リカバリー

---

**作成日**: 2025-01-11
**作成者**: Claude Code (Anthropic)
**バージョン**: v4.0
**設計手法**: n8nワークフロー自動設計プロセス v4.0
