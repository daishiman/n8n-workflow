// 相対日付変換ノード
// 目的: 「今日」「明日」「来週」などの相対日付表現を正確な日付に変換

const data = $input.first().json;

// 現在の日時を取得（Asia/Tokyo タイムゾーン）
const now = new Date();
const japanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

// 日本時間の年、月、日を取得
const year = japanTime.getFullYear();
const month = japanTime.getMonth(); // 0-11
const date = japanTime.getDate();
const dayOfWeek = japanTime.getDay(); // 0=日曜, 1=月曜, ...

console.log('=== 相対日付変換ノード ===');
console.log('現在日時（日本時間）:', japanTime.toISOString());
console.log('年:', year, '月:', month + 1, '日:', date, '曜日:', dayOfWeek);

// メッセージ内容を取得
const message = data.message_content || '';
console.log('メッセージ:', message);

// 相対日付の定義と計算
const relativeDates = {
  // 基本的な相対表現
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

  // 週の表現
  '今週': new Date(year, month, date),
  '来週': new Date(year, month, date + 7),
  '再来週': new Date(year, month, date + 14),
  '先週': new Date(year, month, date - 7),

  // 月の表現
  '今月': new Date(year, month, date),
  '来月': new Date(year, month + 1, date),
  '再来月': new Date(year, month + 2, date),
  '先月': new Date(year, month - 1, date),

  // 年の表現
  '今年': new Date(year, month, date),
  '来年': new Date(year + 1, month, date),
  '去年': new Date(year - 1, month, date),
};

// 曜日の相対表現（今週の○曜日）
const weekdayMap = {
  '月曜': 1, '月曜日': 1, '月': 1,
  '火曜': 2, '火曜日': 2, '火': 2,
  '水曜': 3, '水曜日': 3, '水': 3,
  '木曜': 4, '木曜日': 4, '木': 4,
  '金曜': 5, '金曜日': 5, '金': 5,
  '土曜': 6, '土曜日': 6, '土': 6,
  '日曜': 0, '日曜日': 0, '日': 0,
};

// 「今週の○曜日」「来週の○曜日」パターンをマッチ
const weekdayPattern = /(今週|来週|再来週|先週)?の?(月曜日?|火曜日?|水曜日?|木曜日?|金曜日?|土曜日?|日曜日?)/g;
let weekdayMatches = [...message.matchAll(weekdayPattern)];

// 数字付きの相対表現（「3日後」「2週間後」など）
const numberPattern = /(\d+)(日|週間?|ヶ?月|年)(後|前|先)/g;
let numberMatches = [...message.matchAll(numberPattern)];

// コンテキスト情報を生成
let contextInfo = `【現在日時情報】
- 実行日時: ${japanTime.toISOString()}
- 日本時間: ${year}年${month + 1}月${date}日
- 曜日: ${['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]}曜日
- タイムゾーン: Asia/Tokyo (UTC+9)

`;

// 検出された相対日付表現をリスト化
let detectedExpressions = [];

// 基本的な相対表現の検出
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

// 曜日表現の検出と計算
for (const match of weekdayMatches) {
  const [fullMatch, weekPrefix, weekdayName] = match;
  const targetWeekday = weekdayMap[weekdayName];

  if (targetWeekday !== undefined) {
    let weekOffset = 0;
    if (weekPrefix === '来週') weekOffset = 7;
    else if (weekPrefix === '再来週') weekOffset = 14;
    else if (weekPrefix === '先週') weekOffset = -7;

    // 現在の曜日から目標曜日までの日数を計算
    let daysUntilTarget = targetWeekday - dayOfWeek;
    if (daysUntilTarget < 0 && weekOffset === 0) {
      daysUntilTarget += 7; // 今週でまだ来ていない曜日
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

// 数字付き相対表現の検出と計算
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

// コンテキスト情報に検出結果を追加
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
    // 元のデータを保持
    original_message: message,

    // 日付コンテキスト情報
    date_context: contextInfo,
    current_datetime: japanTime.toISOString(),
    current_year: year,
    current_month: month + 1,
    current_date: date,
    current_day_of_week: dayOfWeek,

    // 検出された相対日付表現
    detected_relative_dates: detectedExpressions,

    // メッセージを更新（コンテキスト情報を含める）
    message_with_context: `${contextInfo}\n\n【ユーザーメッセージ】\n${message}`
  }
}];
