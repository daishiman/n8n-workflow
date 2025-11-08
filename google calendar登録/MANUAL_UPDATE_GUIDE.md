# n8nワークフロー手動更新ガイド

## 📋 概要
「今日」「明日」などの相対日付を正確に処理するため、**相対日付変換ノード**を追加します。

---

## ステップ1: 新しいCodeノードを追加

### 1-1. ノード追加
1. n8nのワークフローエディタを開く
2. `Webhookデータ抽出`ノードと`ステート確認`ノードの間にスペースを作る
3. 「+」ボタンをクリック → 「Code」ノードを選択
4. ノード名を`相対日付変換`に変更

### 1-2. コード入力
以下のコードをCodeノードに貼り付けてください:

```javascript
const data = $input.first().json;

const now = new Date();
const japanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

const year = japanTime.getFullYear();
const month = japanTime.getMonth();
const date = japanTime.getDate();
const dayOfWeek = japanTime.getDay();

console.log('=== 相対日付変換ノード ===');
console.log('現在日時（日本時間）:', japanTime.toISOString());
console.log('年:', year, '月:', month + 1, '日:', date, '曜日:', dayOfWeek);

const message = data.message_content || '';
console.log('メッセージ:', message);

const relativeDates = {
  '今日': new Date(year, month, date),
  'きょう': new Date(year, month, date),
  '本日': new Date(year, month, date),
  '明日': new Date(year, month, date + 1),
  'あした': new Date(year, month, date + 1),
  '明後日': new Date(year, month, date + 2),
  'あさって': new Date(year, month, date + 2),
  '昨日': new Date(year, month, date - 1),
  'きのう': new Date(year, month, date - 1),
  '一昨日': new Date(year, month, date - 2),
  'おととい': new Date(year, month, date - 2),
  '今週': new Date(year, month, date),
  '来週': new Date(year, month, date + 7),
  '再来週': new Date(year, month, date + 14),
  '先週': new Date(year, month, date - 7),
  '今月': new Date(year, month, date),
  '来月': new Date(year, month + 1, date),
  '再来月': new Date(year, month + 2, date),
  '先月': new Date(year, month - 1, date),
  '今年': new Date(year, month, date),
  '来年': new Date(year + 1, month, date),
  '去年': new Date(year - 1, month, date),
};

const weekdayMap = {
  '月曜': 1, '月曜日': 1, '月': 1,
  '火曜': 2, '火曜日': 2, '火': 2,
  '水曜': 3, '水曜日': 3, '水': 3,
  '木曜': 4, '木曜日': 4, '木': 4,
  '金曜': 5, '金曜日': 5, '金': 5,
  '土曜': 6, '土曜日': 6, '土': 6,
  '日曜': 0, '日曜日': 0, '日': 0,
};

const weekdayPattern = /(今週|来週|再来週|先週)?の?(月曜日?|火曜日?|水曜日?|木曜日?|金曜日?|土曜日?|日曜日?)/g;
let weekdayMatches = [...message.matchAll(weekdayPattern)];

const numberPattern = /(\d+)(日|週間?|ヶ?月|年)(後|前|先)/g;
let numberMatches = [...message.matchAll(numberPattern)];

let contextInfo = `【現在日時情報】
- 実行日時: ${japanTime.toISOString()}
- 日本時間: ${year}年${month + 1}月${date}日
- 曜日: ${['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]}曜日
- タイムゾーン: Asia/Tokyo (UTC+9)

`;

let detectedExpressions = [];

for (const [expression, calculatedDate] of Object.entries(relativeDates)) {
  if (message.includes(expression)) {
    const isoDate = calculatedDate.toISOString();
    detectedExpressions.push({
      expression,
      date: isoDate,
      formatted: `${calculatedDate.getFullYear()}年${calculatedDate.getMonth() + 1}月${calculatedDate.getDate()}日`
    });
    console.log(`検出: "${expression}" → ${isoDate}`);
  }
}

for (const match of weekdayMatches) {
  const [fullMatch, weekPrefix, weekdayName] = match;
  const targetWeekday = weekdayMap[weekdayName];

  if (targetWeekday !== undefined) {
    let weekOffset = 0;
    if (weekPrefix === '来週') weekOffset = 7;
    else if (weekPrefix === '再来週') weekOffset = 14;
    else if (weekPrefix === '先週') weekOffset = -7;

    let daysUntilTarget = targetWeekday - dayOfWeek;
    if (daysUntilTarget < 0 && weekOffset === 0) {
      daysUntilTarget += 7;
    }

    const targetDate = new Date(year, month, date + daysUntilTarget + weekOffset);
    const isoDate = targetDate.toISOString();

    detectedExpressions.push({
      expression: fullMatch,
      date: isoDate,
      formatted: `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日`
    });
    console.log(`検出: "${fullMatch}" → ${isoDate}`);
  }
}

for (const match of numberMatches) {
  const [fullMatch, number, unit, direction] = match;
  const num = parseInt(number);
  const multiplier = direction === '後' ? 1 : -1;

  let targetDate;
  if (unit === '日') {
    targetDate = new Date(year, month, date + (num * multiplier));
  } else if (unit === '週間' || unit === '週') {
    targetDate = new Date(year, month, date + (num * 7 * multiplier));
  } else if (unit === '月' || unit === 'ヶ月') {
    targetDate = new Date(year, month + (num * multiplier), date);
  } else if (unit === '年') {
    targetDate = new Date(year + (num * multiplier), month, date);
  }

  if (targetDate) {
    const isoDate = targetDate.toISOString();
    detectedExpressions.push({
      expression: fullMatch,
      date: isoDate,
      formatted: `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日`
    });
    console.log(`検出: "${fullMatch}" → ${isoDate}`);
  }
}

if (detectedExpressions.length > 0) {
  contextInfo += `【検出された相対日付表現】\n`;
  for (const expr of detectedExpressions) {
    contextInfo += `- "${expr.expression}" = ${expr.formatted} (${expr.date})\n`;
  }
  contextInfo += `\n`;
}

contextInfo += `【重要】
上記の日付情報を使用して、ユーザーのメッセージ内の相対日付表現を正確な日付に変換してください。
AIの学習データではなく、上記の計算結果を必ず使用してください。
年は必ず ${year} 年として解釈してください。`;

console.log('生成されたコンテキスト情報:', contextInfo);
console.log('検出された表現数:', detectedExpressions.length);

return [{
  json: {
    ...data,
    original_message: message,
    date_context: contextInfo,
    current_datetime: japanTime.toISOString(),
    current_year: year,
    current_month: month + 1,
    current_date: date,
    current_day_of_week: dayOfWeek,
    detected_relative_dates: detectedExpressions,
    message_with_context: `${contextInfo}\n\n【ユーザーメッセージ】\n${message}`
  }
}];
```

### 1-3. ノートを追加
ノードの「Notes」セクションに以下を追加:

```
【相対日付変換】

処理内容: 「今日」「明日」「来週」などの相対日付表現を正確な日付に変換

検出パターン:
- 基本: 今日、明日、明後日、昨日、一昨日
- 週: 今週、来週、再来週、先週
- 月: 今月、来月、再来月、先月
- 年: 今年、来年、去年
- 曜日: 今週の月曜日、来週の金曜日 など
- 数値: 3日後、2週間前、1ヶ月後 など

出力:
- date_context: AI用の日付コンテキスト情報
- current_datetime: 現在の日時（ISO形式）
- detected_relative_dates: 検出された相対日付のリスト

役割: AIの学習データではなく、実際の現在日時から正確な日付を計算
重要性: 年の誤認識（2024年 vs 2025年）を防ぐための重要なゲート
```

---

## ステップ2: ノード接続を更新

### 2-1. 既存接続を削除
1. `Webhookデータ抽出` → `ステート確認`の接続を削除

### 2-2. 新しい接続を作成
1. `Webhookデータ抽出` → `相対日付変換`に接続
2. `相対日付変換` → `ステート確認`に接続

**接続フロー:**
```
Discord Bot Webhook
  ↓
Webhookデータ抽出
  ↓
相対日付変換 ← ★ 新規追加
  ↓
ステート確認
  ↓
フロー振り分け
  ...
```

---

## ステップ3: AI Agent 1のプロンプトを更新

### 3-1. ノードを開く
`【AI Agent 1】Discord予定抽出`ノードをダブルクリック

### 3-2. プロンプト変更
**Prompt**フィールドを以下のように変更:

**変更前:**
```
={{ $json.message_content }}
```

**変更後:**
```
={{ $json.message_with_context }}
```

---

## ステップ4: Sticky Noteを更新

### 4-1. 「Sticky Note - Discord入力受付」を更新

既存の内容を以下に置き換え:

```markdown
# 【グループ1: Discord入力受付・日付変換】

## このグループに含まれるノード
📌 **Discord Bot Webhook** (Webhook)
📌 **Webhookデータ抽出** (Set)
📌 **相対日付変換** (Code) ← 新規追加
📌 **ステート確認** (Code)
📌 **フロー振り分け** (IF)
📌 **Webhookデータ検証** (IF)

## 目的
Discordボットからのメッセージを受信し、相対日付表現を正確な日付に変換した上で、必要なデータを抽出・検証します。

## 背景
ユーザーはDiscordで「明日14時から会議」のような自然言語で予定を送信します。
この際、「明日」が具体的に何年何月何日なのかを正確に計算する必要があります。
AIの学習データでは2024年として誤認識される可能性があるため、機械的に現在日時から計算します。

## 処理の流れ
1. Webhook受信: Discordボットからの POST リクエスト
2. データ抽出: user_id, channel_id, message_content等を抽出
3. 【新規】相対日付変換: 「今日」「明日」等を実際の日付に変換
4. ステート確認: 初回か選択フローかを判定
5. フロー振り分け: 初回フローまたは選択フローへ分岐
6. データ検証: 必須フィールドの存在確認

## 達成したいこと
- ユーザーが送信したメッセージを確実に受け取る
- 相対日付表現を正確な日付（2025年基準）に変換
- 次の処理に必要な形式に整える

## 次のステップ
→ AI予定抽出グループへ（初回フロー）
→ 選択フロー処理グループへ（選択フロー）
```

### 4-2. 「Sticky Note - ワークフロー全体説明」を更新

ノードリストの部分に以下を追加（Webhookデータ抽出の次の行）:

```
📌 **相対日付変換** (Code)
```

そして、最初の部分のノード数を更新:

**変更前:**
```
## このワークフローに含まれる全ノード（37個）
```

**変更後:**
```
## このワークフローに含まれる全ノード（38個）
```

---

## ステップ5: 動作確認

### 5-1. ワークフローを保存
右上の「Save」ボタンをクリック

### 5-2. テスト実行
Discordから以下のようなメッセージを送信してテスト:

```
明日14時から会議
```

### 5-3. 確認ポイント
1. `相対日付変換`ノードの出力を確認
   - `date_context`に現在日時情報が含まれているか
   - `detected_relative_dates`に「明日」が検出されているか
   - `message_with_context`に変換情報が含まれているか

2. `【AI Agent 1】Discord予定抽出`の結果を確認
   - 正しい年（2025年）が使用されているか
   - 日付が正確に抽出されているか

---

## 📝 補足情報

### 対応している相対日付表現

#### 基本表現
- 今日、きょう、本日
- 明日、あした
- 明後日、あさって
- 昨日、きのう
- 一昨日、おととい

#### 週表現
- 今週、来週、再来週、先週
- 今週の月曜日、来週の金曜日 など

#### 月表現
- 今月、来月、再来月、先月

#### 年表現
- 今年、来年、去年

#### 数値表現
- 3日後、2週間前、1ヶ月後 など

### トラブルシューティング

**Q: 接続エラーが出る**
A: 接続の順序を確認してください。必ず`Webhookデータ抽出` → `相対日付変換` → `ステート確認`の順になっているか確認。

**Q: AI Agentがエラーを出す**
A: プロンプトが`={{ $json.message_with_context }}`に正しく変更されているか確認。

**Q: 日付が正しく検出されない**
A: Codeノードのコンソールログを確認。`検出: "明日" → ...`のようなログが出ているか確認。

---

## ✅ 完了チェックリスト

- [ ] 「相対日付変換」Codeノードを作成
- [ ] コードを貼り付け
- [ ] ノートを追加
- [ ] ノード接続を更新（Webhookデータ抽出 → 相対日付変換 → ステート確認）
- [ ] AI Agent 1のプロンプトを`$json.message_with_context`に変更
- [ ] Sticky Note「Discord入力受付」を更新
- [ ] Sticky Note「ワークフロー全体説明」を更新
- [ ] ワークフローを保存
- [ ] テスト実行で動作確認

---

以上で更新完了です！
