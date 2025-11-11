# 目的

検証・最適化が完了したワークフローJSONとメタデータを最終出力し、n8nワークフロー自動設計プロセスv4.0を完了する。ユーザーがn8nにインポートするだけで動作する完全なパッケージを提供する。

# 背景

Step010-180までの全設計・実装・検証が完了し、最終的な成果物を整理して提供するフェーズ。ワークフローJSON、メタデータ、実装手順書、統計情報をすべて含む完全実装パッケージを作成する。

# 言葉の定義

- **完全実装パッケージ**: ワークフローJSON + メタデータJSON + README + 実装手順書 + 検証レポート
- **n8nインポート可能**: ユーザーがn8n UIで「Import from File」するだけで動作すること
- **実装手順書**: Credentials設定、テスト実行、デプロイまでの詳細手順
- **統計情報**: 総ノード数、グループ数、推定実行時間、トークン数など
- **v4.0メタデータ**: 業務要件、技術要件、AIエージェント責務などのサマリー

# 制約

- 出力制約: 完全実装パッケージを出力後、ユーザーに完了を報告
- ワークフローJSON完全性必須: インポートするだけで動作すること
- 実装手順書必須: 初心者でも実装できる詳細な手順を提供すること
- メタデータ完全性必須: Step010-180の全成果物へのリンクを含むこと
- 出力ディレクトリ: `./{業務目的}/step190_最終成果物/` に成果物を格納すること
- 1ファイル統合必須: ワークフローJSONは1ファイル（メイン+エラー統合）

# 処理手順

## 処理手順の全体フロー

```
開始（Step150-180の全成果物）
  ↓
1. ワークフローJSON最終確認
  ↓
2. メタデータJSON作成
  ↓
3. README作成
  ↓
4. 実装手順書作成
  ↓
5. 完全実装パッケージの作成
  ↓
6. 最終検証
  ↓
7. 成果物出力・完了報告
  ↓
完了
```

## 処理手順1: ワークフローJSON最終確認

- 目的: Step180で最適化されたワークフローJSONを最終確認する
- 背景: インポート可能な最終版を確定する
- エージェント名: 最終確認エンジニア
- 役割: ワークフローJSONの完全性を最終確認する
- 責務: ワークフローJSON最終版の確定
- 処理詳細手順:
  1. Step180の配置最適化済みJSONを確認
  2. 以下をチェック:
     - ワークフロー名が設定されているか
     - すべてのノードが適切に配置されているか
     - すべての接続が定義されているか
     - Sticky Noteがすべて含まれているか
  3. 最終版として確定
- 評価・判断基準:
  - すべてのチェック項目が合格すること
- 出力テンプレート:
```markdown
### ワークフローJSON最終確認

- ✅ ワークフロー名: [業務目的に基づく名前]
- ✅ 総ノード数: [X]個
- ✅ 総接続数: [Y]個
- ✅ Sticky Note数: [Z]個
- ✅ 配置最適化: 完了
- ✅ インポート可能: 確認済み
```

## 処理手順2: メタデータJSON作成

- 目的: ワークフローの設計情報をメタデータJSONとしてまとめる
- 背景: v4.0プロセス全体の成果物を記録する
- エージェント名: メタデータエンジニア
- 役割: メタデータJSONを作成する
- 責務: メタデータJSONの完全な定義
- 処理詳細手順:
  1. Step010-180の全成果物を確認
  2. 以下の構造でメタデータJSONを作成:
     ```json
     {
       "workflow": {
         "name": "[ワークフロー名]",
         "version": "v4.0",
         "createdAt": "2025-11-10T00:00:00.000Z",
         "author": "n8n AI Agent",
         "description": "[Step010業務目的]"
       },
       "statistics": {
         "totalNodes": 45,
         "mainFlowGroups": 3,
         "errorFlowGroups": 3,
         "estimatedExecutionTime": "15秒",
         "estimatedTokens": "8000 tokens"
       },
       "requirements": {
         "business": "[Step010ビジネス要件]",
         "functional": "[Step010機能要件]",
         "nonFunctional": "[Step010非機能要件]",
         "operational": "[Step010運用要件]"
       },
       "architecture": {
         "layers": 12,
         "mainFlowPattern": "Pattern B: 機能単位グループ化",
         "errorHandlingPattern": "Error-First Design"
       },
       "aiAgents": [
         {
           "id": "ai_agent_1",
           "responsibility": "[Step050のAI責務]",
           "model": "[Step020で選定したモデル]",
           "systemPrompt": "[Step050のSystem Prompt]"
         }
       ],
       "credentials": [
         {
           "name": "Webhook Auth",
           "type": "httpHeaderAuth",
           "required": true
         },
         {
           "name": "Gemini API Key",
           "type": "googleGeminiApi",
           "required": true
         },
         {
           "name": "Slack OAuth2",
           "type": "slackOAuth2Api",
           "required": true
         }
       ],
       "steps": {
         "step010": "業務理解書.md",
         "step020": "AI設定書.md",
         "step030": "技術要件書.md",
         "step040": "グループ構成表.md",
         "step050": "AIエージェント責務定義書.md",
         "step060": "詳細設計書.md",
         "step150": "統合ワークフローJSON.json",
         "step160": "ワークフロー検証レポート.md",
         "step190": "完全実装パッケージ.md"
       }
     }
     ```
  3. ファイル名: `[業務目的]_metadata_v4.json`
- 評価・判断基準:
  - すべてのセクションが埋まっていること
  - Step010-180への参照が含まれていること
- 出力テンプレート: 上記JSON

## 処理手順3: README作成

- 目的: ワークフローの概要とクイックスタートガイドを作成する
- 背景: ユーザーが最初に読むドキュメント
- エージェント名: テクニカルライター
- 役割: 分かりやすいREADMEを作成する
- 責務: READMEの完全な作成
- 処理詳細手順:
  1. 以下の構造でREADME.mdを作成:
     ```markdown
     # [ワークフロー名] - n8nワークフロー自動設計v4.0

     ## 概要

     [Step010の業務目的を簡潔に説明]

     ## 機能

     - [主要機能1]
     - [主要機能2]
     - [主要機能3]

     ## アーキテクチャ

     - **フレームワーク**: 12層アーキテクチャ（データフロー7層 + 横断的関心事5層）
     - **グループ構成**: メインフロー[N]グループ + エラーフロー[M]グループ
     - **総ノード数**: [X]個
     - **AIモデル**: [Step020で選定したモデル]

     ## クイックスタート

     1. n8n UIを開く
     2. 「Workflows」→「Import from File」
     3. `[業務目的]_workflow_integrated_v4.json` を選択
     4. Credentialsを設定（詳細は「実装手順書.md」参照）
     5. テスト実行

     ## ファイル構成

     ```
     step190_最終成果物/
     ├── README.md（このファイル）
     ├── [業務目的]_workflow_integrated_v4.json（ワークフローJSON）
     ├── [業務目的]_metadata_v4.json（メタデータ）
     ├── 実装手順書.md（詳細な実装手順）
     └── 検証レポート.md（検証結果サマリー）
     ```

     ## 要件

     - n8n バージョン: 1.0以上
     - 必要なCredentials:
       - Webhook Auth
       - [AIモデルのAPI Key]
       - [統合サービスのCredentials]

     ## サポート

     - 詳細設計: `step060_詳細設計/詳細設計書.md`
     - AIエージェント責務: `step050_AIエージェント責務/AIエージェント責務定義書.md`
     - 技術要件: `step030_技術要件変換/技術要件書.md`

     ## ライセンス

     このワークフローは n8nワークフロー自動設計プロセス v4.0 により生成されました。
     ```
  2. ファイル名: `README.md`
- 評価・判断基準:
  - 概要が分かりやすいこと
  - クイックスタートが明確であること
- 出力テンプレート: 上記Markdown

## 処理手順4: 実装手順書作成

- 目的: 初心者でも実装できる詳細な手順書を作成する
- 背景: Credentials設定、テスト、デプロイまでをカバーする
- エージェント名: 実装ガイドライター
- 役割: 実装手順書を作成する
- 責務: 実装手順書の完全な作成
- 処理詳細手順:
  1. 以下の構造で実装手順書.mdを作成:
     ```markdown
     # 実装手順書

     ## 前提条件

     - n8n がインストール済み
     - 必要なCredentials情報を準備済み:
       - [Credential 1]: [取得方法]
       - [Credential 2]: [取得方法]

     ## 手順1: ワークフローのインポート

     1. n8n UIにアクセス
     2. 左メニューから「Workflows」を選択
     3. 右上の「Import from File」をクリック
     4. `[業務目的]_workflow_integrated_v4.json` を選択
     5. インポート完了を確認

     ## 手順2: Credentials設定

     ### 手順2.1: AI Agent Nodeの設定（重要）

     **🔴 絶対必須**: すべてのAI AgentノードはChat Modelサブノードの手動接続が必要です。

     各AI Agentノード（例: `ai_agent_1`, `ai_agent_2`, ...）に対して、以下の手順を実行してください：

     1. AI Agentノードを開く
     2. 「Chat Model」セクションで「Add Sub-Node」をクリック
     3. 以下のノードタイプを選択：
        - Gemini使用時: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
        - Claude使用時: `@n8n/n8n-nodes-langchain.lmChatAnthropic`
        - OpenAI使用時: `@n8n/n8n-nodes-langchain.lmChatOpenAi`
     4. モデルパラメータを設定:
        - Gemini: `modelName: gemini-2.0-flash-exp`, `temperature: 0.4`, `maxOutputTokens: 4000`
        - Claude: `model: claude-3-5-sonnet-20241022`, `temperature: 0.7`, `maxTokens: 8000`
     5. Credentialsを接続（次項参照）

     **重要**: このステップを省略すると、ワークフローは実行できません。

     ### 手順2.2: Webhook Auth

     1. Webhookノード（`webhook_1`）を開く
     2. 「Webhook Authentication」で「Header Auth」を選択
     3. 「Create New Credential」をクリック
     4. Name: `Webhook Auth`
     5. Header Name: `X-API-Key`
     6. Header Value: [任意の秘密鍵を設定]
     7. 保存

     ### 手順2.3: [AIモデルのAPI Key]

     1. AI Agentノード（`ai_agent_1`）を開く
     2. Chat Modelサブノード（手順2.1で追加したもの）を開く
     3. 「Credentials」で「Create New Credential」をクリック
     4. API Key: [取得したAPI Key]
     5. 保存
     6. すべてのAI Agentノードに対して繰り返す

     ### [統合サービスのCredentials]

     [同様に設定]

     ## 手順3: テスト実行

     ### 3.1 手動テスト

     1. ワークフローを「Active」に設定
     2. Webhookノードを開き、Test URLをコピー
     3. curlコマンドでテスト:
        ```bash
        curl -X POST [Test URL] \
          -H "X-API-Key: [設定した秘密鍵]" \
          -H "Content-Type: application/json" \
          -d '{
            "title": "テスト会議",
            "transcript": "これはテストの議事録です。"
          }'
        ```
     4. n8n UIでExecution Logを確認
     5. 期待する出力（Slack通知など）を確認

     ### 3.2 エラーハンドリングテスト

     1. 無効なデータでテスト（titleなし）:
        ```bash
        curl -X POST [Test URL] \
          -H "X-API-Key: [設定した秘密鍵]" \
          -H "Content-Type: application/json" \
          -d '{
            "transcript": "titleがありません"
          }'
        ```
     2. Error Group 1が実行されることを確認
     3. エラー通知が送信されることを確認

     ## 手順4: 本番デプロイ

     1. Webhook URLを本番URLに変更
     2. ワークフローを「Active」に設定
     3. 本番環境でテスト実行
     4. 監視ダッシュボード設定（Slack通知、ログ確認）

     ## トラブルシューティング

     ### AI Agent接続エラー

     - 原因: Chat ModelサブノードのCredentials未設定
     - 対処: 手順2.2を再確認、API Keyを正しく設定

     ### Webhook認証エラー

     - 原因: X-API-Keyヘッダーが一致しない
     - 対処: curlコマンドとCredentials設定を再確認

     ### Slack投稿失敗

     - 原因: Slack OAuth2 Credentialsが無効
     - 対処: Slack Appを再作成、Credentialsを再設定

     ## 参考資料

     - n8n公式ドキュメント: https://docs.n8n.io/
     - AI Agent Node: https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.agent/
     - Webhook Trigger: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
     ```
  2. ファイル名: `実装手順書.md`
- 評価・判断基準:
  - すべてのCredentials設定手順が含まれていること
  - テスト手順が明確であること
  - トラブルシューティングが含まれていること
- 出力テンプレート: 上記Markdown

## 処理手順5: 完全実装パッケージの作成

- 目的: すべての成果物を1つのディレクトリにまとめる
- 背景: ユーザーが簡単にアクセスできるようにする
- エージェント名: パッケージマネージャー
- 役割: 成果物を整理してパッケージ化する
- 責務: 完全実装パッケージの作成
- 処理詳細手順:
  1. `step190_最終成果物/` ディレクトリを作成
  2. 以下のファイルを配置:
     - `README.md`
     - `[業務目的]_workflow_integrated_v4.json`
     - `[業務目的]_metadata_v4.json`
     - `実装手順書.md`
     - `検証レポート.md`（Step160の検証結果サマリー）
  3. ディレクトリ構造を確認
- 評価・判断基準:
  - すべてのファイルが配置されていること
- 出力テンプレート:
```
step190_最終成果物/
├── README.md
├── [業務目的]_workflow_integrated_v4.json
├── [業務目的]_metadata_v4.json
├── 実装手順書.md
└── 検証レポート.md
```

## 処理手順6: 最終検証

- 目的: 完全実装パッケージの完全性を最終確認する
- 背景: ユーザーに提供する前の最終チェック
- エージェント名: QAエンジニア
- 役割: パッケージ全体を検証する
- 責務: 最終検証レポートの作成
- 処理詳細手順:
  1. すべてのファイルが存在するか確認
  2. ワークフローJSONがインポート可能か確認
  3. 実装手順書が完全か確認
  4. メタデータがStep010-180へのリンクを含むか確認
  5. 最終検証レポートを作成
- 評価・判断基準:
  - すべてのチェック項目が合格すること
- 出力テンプレート:
```markdown
### 最終検証レポート

**ファイル完全性**:
- ✅ README.md
- ✅ ワークフローJSON
- ✅ メタデータJSON
- ✅ 実装手順書.md
- ✅ 検証レポート.md

**ワークフローJSON**:
- ✅ インポート可能
- ✅ 全ノード接続済み
- ✅ Credentials定義完了

**ドキュメント完全性**:
- ✅ README: クイックスタート記載
- ✅ 実装手順書: Credentials設定手順完備
- ✅ メタデータ: Step010-180へのリンク完備

**総合評価**: ✅ すべて合格、提供可能
```

## 処理手順7: 成果物出力・完了報告

- 目的: ユーザーに完全実装パッケージを提供し、プロセス完了を報告する
- 背景: n8nワークフロー自動設計プロセスv4.0の完了
- エージェント名: プロジェクトマネージャー
- 役割: 成果物を提供し、完了を報告する
- 責務: 完了報告書の作成
- 処理詳細手順:
  1. 完全実装パッケージのパスを提示
  2. 次の行動を案内
  3. 完了報告書を作成
- 評価・判断基準:
  - 完了報告書が作成されていること
- 出力テンプレート:
```markdown
# n8nワークフロー自動設計プロセス v4.0 完了

## 成果物

完全実装パッケージを以下のディレクトリに作成しました：

```
./{業務目的}/step190_最終成果物/
```

**含まれるファイル**:
- `README.md`: ワークフロー概要とクイックスタート
- `[業務目的]_workflow_integrated_v4.json`: n8nにインポート可能なワークフローJSON
- `[業務目的]_metadata_v4.json`: 設計情報のメタデータ
- `実装手順書.md`: Credentials設定からデプロイまでの詳細手順
- `検証レポート.md`: ワークフロー検証結果サマリー

## 次の行動

1. **ワークフローのインポート**:
   ```
   n8n UI → Workflows → Import from File → [業務目的]_workflow_integrated_v4.json
   ```

2. **Credentials設定**:
   - 実装手順書.mdの「手順2: Credentials設定」を参照
   - 必要なAPI Key、OAuth2トークンを設定

3. **テスト実行**:
   - 実装手順書.mdの「手順3: テスト実行」を参照
   - 手動テスト、エラーハンドリングテストを実施

4. **本番デプロイ**:
   - テスト合格後、ワークフローを「Active」に設定
   - 監視ダッシュボードを確認

## プロセスサマリー

**v4.0の改善点**:
- ✅ 12要素フレームワークによる包括的要件定義
- ✅ 業務要件ベースのAIモデル選定
- ✅ 12層アーキテクチャによる技術要件変換
- ✅ 最大40グループ対応のスケーラビリティ
- ✅ メインフロー+エラーフロー統合設計（1ファイル管理）

**実装統計**:
- 総ノード数: [X]個
- グループ数: メイン[N] + エラー[M] = [N+M]個
- 推定実行時間: [Y]秒
- 推定トークン: [Z] tokens

**設計フェーズ完了**:
- ✅ Step010: 業務理解（12要素ヒアリング）
- ✅ Step020: AI設定（業務要件ベース）
- ✅ Step030: 技術要件変換（12層フレームワーク）
- ✅ Step040: タスク分解とグループ化
- ✅ Step050: AIエージェント責務定義
- ✅ Step060: パターン適用と詳細設計

**実装フェーズ完了**:
- ✅ Step070-129: メインフローグループJSON生成
- ✅ Step130-149: エラーフローグループJSON生成

**検証・出力フェーズ完了**:
- ✅ Step150: グループ間接続統合
- ✅ Step160: ワークフロー全体検証
- ✅ Step170: 配置最適化
- ✅ Step180: Sticky Note完成
- ✅ Step190: 最終出力

---

**n8nワークフロー自動設計プロセス v4.0 を完了しました。**

ご質問・サポートが必要な場合は、各ステップの成果物（step010〜step190）をご参照ください。
```

# 初回質問

「Phase 3の統合・検証・最適化が完了しました。これから最終成果物を出力します。

**成果物確認**:
- ワークフローJSON: 統合・検証・最適化済み
- 総ノード数: [X]個
- グループ数: [N+M]個

最終出力を開始してよろしいですか？

（選択肢）
1. このまま出力する
2. ワークフローJSONを最終確認する
3. メタデータを確認してから出力する」
