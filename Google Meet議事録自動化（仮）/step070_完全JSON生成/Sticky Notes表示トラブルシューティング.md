# Sticky Notes表示トラブルシューティング

## 🔍 問題

JSONファイルにはSticky Notesが12個含まれているが、n8n UIで表示されない。

---

## ✅ 確認済み事項

- ✅ JSONファイルには12個のSticky Notesが含まれている
- ✅ Sticky Noteの形式は正しい（`n8n-nodes-base.stickyNote`）
- ✅ parameters（content, height, width, color）はすべて設定済み
- ✅ position座標も設定済み

---

## 🔧 解決方法

### 方法1: キャンバスをズームアウト・スクロール

Sticky Notesは広範囲に配置されています：

| Sticky Note | X座標 | Y座標 | 説明 |
|------------|------|------|------|
| sticky_001 | 250 | 180 | 左上（トリガー付近） |
| sticky_002 | 1050 | 180 | Gemini Transcribe付近 |
| sticky_005 | 1725 | **-20** | 上方向（マイナス座標） |
| sticky_011 | 3750 | -20 | 右端 |

**操作**:
1. **ズームアウト**: `Ctrl + マウスホイール下` または `Cmd + -`
2. **全体表示**: `Ctrl + 0` または `Cmd + 0`
3. **スクロール**: キャンバスを上下左右にスクロール

### 方法2: n8nのバージョン確認

Sticky Noteは n8n v0.194.0以降でサポートされています。

**確認方法**:
```bash
# n8nのバージョンを確認
n8n --version
```

古いバージョンの場合は更新してください。

### 方法3: 手動でSticky Noteを追加

もしSticky Notesが表示されない場合は、n8n UIで手動で追加してください：

1. キャンバス上で右クリック
2. 「Add Sticky Note」を選択
3. 以下の内容をコピー&ペースト

#### Sticky Note 1: トリガー&ファイル取得

```
# トリガー&ファイル取得&ダウンロード

📌 Google Drive Trigger
📌 Google Drive: Get File Info
📌 Google Drive: M4Aダウンロード
📌 Filter: M4A検証

5分ごとにGoogle Driveをポーリングし、新規M4Aファイルを検知・取得・ダウンロード
```

- 位置: [250, 180]
- 色: オレンジ（7）
- サイズ: 450 × 280

#### Sticky Note 2: Gemini文字起こし

```
# 音声文字起こし（Geminiネイティブ）

📌 Google Gemini: Transcribe Audio

★ Deepgram不要で処理時間50%短縮、コスト75%削減
★ M4Aネイティブ対応、最大8.4時間
```

- 位置: [1050, 180]
- 色: 黄色（6）
- サイズ: 420 × 240

（残り10個も同様に追加）

### 方法4: JSONを再生成

最小限のSticky Noteでテスト：

```json
{
  "name": "テストワークフロー",
  "nodes": [
    {
      "parameters": {
        "content": "# テスト\n\nこれは表示されますか？",
        "height": 200,
        "width": 400,
        "color": 5
      },
      "id": "test_sticky",
      "name": "Sticky Note",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [100, 100]
    }
  ],
  "connections": {},
  "active": true,
  "settings": {
    "timezone": "Asia/Tokyo"
  }
}
```

これをインポートしてSticky Noteが表示されるか確認してください。

---

## 💡 推奨

**Sticky Notesは確実にJSONに含まれています**。

n8n UIでキャンバスを**ズームアウト**して、**全体を表示**してください。特にY座標が-20や-250のSticky Notesは画面の上方向にあるため、スクロールが必要です。

もし見つからない場合は、n8nのバージョンを確認してください。
