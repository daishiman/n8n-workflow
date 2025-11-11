# n8n-workflow

n8n ワークフロー自動設計システム - AI 駆動型ワークフロー生成フレームワーク

## 概要

このリポジトリは、AI CLI を活用して、業務要件から n8n ワークフロー JSON を自動生成するためのフレームワークです。タスク分解、12 層アーキテクチャ設計、AI エージェント配置を体系的に行い、n8n にインポート可能な完全なワークフローを出力します。

## 何ができるのか

### 主な機能

1. **業務要件の体系的収集**

   - 12 要素フレームワークによる段階的ヒアリング
   - 曖昧な要件を具体的な技術仕様に変換

2. **自動タスク分解**

   - 複雑な業務プロセスを適切な粒度のタスクに分解
   - グループ化による論理的なワークフロー構成

3. **n8n ワークフロー JSON の自動生成**

   - n8n-MCP サーバーを活用した最新ノード情報の取得
   - 12 層アーキテクチャに基づく堅牢な設計
   - AI Agent Node を含む完全実装

4. **エンドツーエンドの設計支援**
   - 要件定義から JSON 出力まで一貫したプロセス
   - 各ステップでの検証とフィードバック
   - ベストプラクティスパターンの自動適用

## このリポジトリでできること

### ゴール

業務要件から n8n ワークフロー JSON を自動生成し、n8n にインポートして即座に実行可能な状態にする

### プロセス

```
業務要件（曖昧）
  ↓
【Phase 1: 要件定義・設計】
  ↓ Step010: 12要素ヒアリング
  ↓ Step020: AI設定
  ↓ Step030: 12層アーキテクチャ変換
  ↓ Step040: タスク分解
  ↓ Step050: AIエージェント責務定義
  ↓ Step060: パターン適用
  ↓
【Phase 2: JSON生成】
  ↓ Step070-129: メインフローグループJSON生成
  ↓ Step130-149: エラーフローグループJSON生成
  ↓
【Phase 3: 統合・出力】
  ↓ Step150: グループ間接続統合
  ↓ Step160: ワークフロー全体検証
  ↓ Step170: 配置最適化
  ↓ Step180: Sticky Note完成
  ↓ Step190: 最終出力
  ↓
n8nワークフローJSON（完成）
```

## 使用方法

### 前提条件

- **Claude Code（AI CLI）** がインストールされていること
- **n8n-MCP サーバー** が利用可能であること
- 基本的な n8n の知識

### 基本的な実行手順

#### 1. リポジトリのクローン

```bash
git clone https://github.com/daishiman/n8n-workflow.git
cd n8n-workflow
```

#### 2. Claude Code の起動

```bash
claude
```

#### 3. ワークフロー設計プロセスの開始

```bash
# Step010から順番に実行
# プロンプトファイルをClaude Codeに提示する
```

#### 4. Phase 1: 要件定義・設計（Step010-060）

各ステップで `.claude/agents/` 配下のプロンプトファイルを使用します。

**Step010: 業務理解**

```bash
# .claude/agents/step010-業務理解.md を参照
# → 12要素フレームワークで業務要件を収集
# → 業務理解書を出力
```

**Step020: AI 設定**

```bash
# .claude/agents/step020-AI設定.md を参照
# → 業務要件に基づく最適AIモデル選定
# → AI設定書を出力
```

**Step030: 技術要件変換**

```bash
# .claude/agents/step030-技術要件変換.md を参照
# → 12層アーキテクチャへの技術要件変換
# → 技術要件書を出力
```

**Step040: タスク分解とグループ化**

```bash
# .claude/agents/step040-タスク分解とグループ化.md を参照
# → グループ単位へのタスク分解
# → グループ構成表を出力
```

**Step050: AI エージェント責務定義**

```bash
# .claude/agents/step050-AIエージェント責務定義.md を参照
# → 単一責務の原則に基づくAI責務定義
# → AIエージェント責務定義書を出力
```

**Step060: パターン適用と詳細設計**

```bash
# .claude/agents/step060-パターン適用と詳細設計.md を参照
# → ベストプラクティスパターン適用
# → 詳細設計書を出力
```

#### 5. Phase 2: JSON 生成（Step070-149）

**メインフローグループ JSON 生成（Step070-129）**

```bash
# .claude/agents/step070-メインフローグループJSON生成テンプレート.md を使用
# 各グループ（Group 1-30）に対してテンプレートを適用
# → Group 1-30のJSON生成
```

**エラーフローグループ JSON 生成（Step130-149）**

```bash
# 同様のテンプレートを使用
# → Error Group 1-10のJSON生成
```

#### 6. Phase 3: 統合・出力（Step150-190）

**Step150: グループ間接続統合**

```bash
# .claude/agents/step150-グループ間接続統合.md を参照
# → 全グループを1つのワークフローJSONに統合
```

**Step160: ワークフロー全体検証**

```bash
# .claude/agents/step160-ワークフロー全体検証.md を参照
# → 統合ワークフローの包括的検証
```

**Step170: 配置最適化**

```bash
# .claude/agents/step170-配置最適化.md を参照
# → ノードの視覚的配置最適化
```

**Step180: Sticky Note 完成**

```bash
# .claude/agents/step180-StickyNote完成.md を参照
# → Sticky Noteの詳細説明追加
```

**Step190: 最終出力**

```bash
# .claude/agents/step190-最終出力.md を参照
# → 完全実装パッケージの出力
```

#### 7. n8n へのインポート

```bash
# 生成されたJSONファイルをn8nにインポート
# ./{業務目的}/step190_最終成果物/{業務目的}_workflow_integrated_v4.json
```

### 実行例

```bash
# 例: 議事録要約ワークフローの生成

1. Claude Code起動
   $ claude

2. Step010実行
   → 業務要件: 「会議の議事録を自動要約してSlackに投稿」
   → 12要素フレームワークでヒアリング
   → 業務理解書を出力: ./meeting-summary/step010_業務理解/業務理解書.md

3. Step020-060を順次実行
   → AI設定書、技術要件書、グループ構成表、詳細設計書を出力

4. Step070-129実行
   → 各グループのJSON生成（例: 5グループ）
   → ./meeting-summary/step070_Group1_JSON/Group1_データ受信初期化.json
   → ./meeting-summary/step072_Group2_JSON/Group2_入力検証前処理.json
   → ...

5. Step150-190実行
   → 統合ワークフローJSON生成
   → ./meeting-summary/step190_最終成果物/meeting-summary_workflow_integrated_v4.json

6. n8nにインポート
   → n8n GUI で「Import from File」を選択
   → meeting-summary_workflow_integrated_v4.json をインポート
   → 実行
```

## ディレクトリ構造

```
n8n-workflow/
├── .claude/
│   └── agents/                    # AI Agentプロンプト集
│       ├── README.md              # プロンプト集の概要
│       ├── step010-業務理解.md
│       ├── step020-AI設定.md
│       ├── step030-技術要件変換.md
│       ├── step040-タスク分解とグループ化.md
│       ├── step050-AIエージェント責務定義.md
│       ├── step060-パターン適用と詳細設計.md
│       ├── step070-メインフローグループJSON生成テンプレート.md
│       ├── step150-グループ間接続統合.md
│       ├── step160-ワークフロー全体検証.md
│       ├── step170-配置最適化.md
│       ├── step180-StickyNote完成.md
│       └── step190-最終出力.md
├── .github/
│   ├── AGENTS.md                  # エージェント開発ガイドライン
│   └── GIT_WORKFLOW.md            # Gitワークフローガイド
├── README.md                      # このファイル
└── {業務目的}/                    # 生成される成果物ディレクトリ
    ├── step010_業務理解/
    ├── step020_AI設定/
    ├── step030_技術要件変換/
    ├── step040_タスク分解/
    ├── step050_AIエージェント責務/
    ├── step060_パターン適用/
    ├── step070_Group1_JSON/
    ├── ...
    ├── step150_統合JSON/
    └── step190_最終成果物/
        ├── README.md
        ├── {業務目的}_workflow_integrated_v4.json
        ├── {業務目的}_metadata_v4.json
        ├── 実装手順書.md
        └── 検証レポート.md
```

## 技術的特徴

### 12 層アーキテクチャフレームワーク

#### データフロー層（L1-L7）

- **L1: Trigger** - イベント検知・受信層
- **L2: Input** - データ受信・初期化層
- **L3: Validation** - 入力検証・フォーマット確認層
- **L4: Transformation** - データ変換・加工層
- **L5: Core Logic** - AI 判断・ビジネスロジック層
- **L6: Integration** - 外部連携・API 呼び出し層
- **L7: Output** - 結果出力・通知層

#### 横断的関心事層（L8-L12）

- **L8: Error Handling** - エラー検知・リカバリ層
- **L9: Security** - 認証・認可・暗号化層
- **L10: Monitoring** - ログ出力・メトリクス収集層
- **L11: Performance** - キャッシュ・並列処理層
- **L12: Orchestration** - フロー制御・条件分岐層

### 12 要素フレームワーク（Step010）

業務要件を体系的に収集するための 12 の質問項目:

1. ワークフローの目的
2. トリガー条件
3. データ処理要件
4. ビジネスルール
5. 統合要件
6. AI 処理要件
7. セキュリティ要件
8. パフォーマンス要件
9. 信頼性要件
10. 運用・監視要件
11. 拡張性要件
12. コスト要件

### n8n-MCP 統合

- **n8n-MCP サーバー** を活用した最新ノード情報の取得
- `search_nodes()`, `get_node_essentials()`, `get_node_documentation()` による正確なノード選定
- バージョン互換性の自動検証

## プロジェクトの目標

1. **開発効率の向上**

   - 手動設計から AI 駆動型設計への移行
   - 設計時間の短縮（数日 → 数時間）

2. **品質の向上**

   - ベストプラクティスパターンの自動適用
   - 12 層アーキテクチャによる堅牢な設計
   - 包括的な検証プロセス

3. **再利用性の向上**

   - プロンプトテンプレートの標準化
   - グループ単位の設計パターンの蓄積

4. **ナレッジの共有**
   - 設計プロセスの可視化
   - ドキュメント自動生成

## トラブルシューティング

### よくある質問

**Q1: グループ数が 30 を超える場合**

- Step040 で再設計し、グループを統合
- または、ワークフローを複数に分割

**Q2: トークン数が 2500 を超える場合**

- グループサイズを縮小（5-15 ノード → 3-5 ノード）
- パラメータ設定を簡素化

**Q3: n8n-MCP 検証でエラーが出る場合**

- エラーメッセージを確認
- Step060 の詳細設計を修正
- 再度 JSON 生成

## 参考資料

### 関連ドキュメント

- [エージェント開発ガイドライン](.github/AGENTS.md)
- [Git ワークフローガイド](.github/GIT_WORKFLOW.md)
- [プロンプト集 README](.claude/agents/README.md)

### n8n 公式ドキュメント

- [n8n Docs](https://docs.n8n.io/)
- [AI Agent Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.agent/)

### 技術スタック

- **AI CLI**: Claude Code (Anthropic)
- **MCP Server**: n8n-MCP, Sequential Thinking, Context7, Playwright
- **ワークフローエンジン**: n8n
- **言語**: Markdown, JSON, JavaScript/TypeScript

## コントリビューション

プロンプト改善、バグ修正、機能追加など、コントリビューションを歓迎します。

### プルリクエストの作成

```bash
# ブランチ作成
git checkout -b feature/your-feature-name-20251111

# 変更をコミット
git add .
git commit -m "feat: your feature description"

# プッシュ
git push origin feature/your-feature-name-20251111

# GitHub上でPRを作成
```

詳細は[Git ワークフローガイド](.github/GIT_WORKFLOW.md)を参照してください。

## ライセンス

このプロジェクトは、n8n ワークフロー自動設計プロセス v4.0 の一部として提供されます。

## 作成情報

- **作成日**: 2025-11-10
- **作成者**: Claude Code (Anthropic)
- **バージョン**: v4.0
- **最終更新**: 2025-11-11
