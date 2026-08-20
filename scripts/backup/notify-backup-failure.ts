// バックアップが失敗したときに、店主あてへメールで知らせる小さな道具。
//
// なぜ必要か:
//   cron のバックアップは、失敗しても画面にもメールにも何も出ない。
//   記録は /var/log/30nen-backup.log に残るだけなので、誰かが見に行かないと
//   「何か月も無バックアップだった」に気づけない。それを防ぐための見張り役。
//
// 誰が呼ぶか:
//   backup-db.sh / backup-uploads.sh が失敗した瞬間に呼ぶ（_notify.sh のしかけ）。
//   手で動作確認したいときは:  npx tsx scripts/backup/notify-backup-failure.ts --test
//
// 必要な設定（本番の .env.local）:
//   RESEND_API_KEY    … メール送信サービスのキー（招待メールと同じものを使う）
//   BACKUP_ALERT_TO   … 知らせを受け取るメールアドレス（★これだけ新しく足す）
//   EMAIL_FROM        … 送信元（未設定なら noreply@30nen.com）
//
// 受け取る情報は環境変数で渡す（本文にそのまま入れるので、引数の引用符で悩まないため）:
//   BACKUP_ALERT_JOB  … どの作業か（例: DBバックアップ）
//   BACKUP_ALERT_CODE … 終了コード（0以外＝失敗）
//   BACKUP_ALERT_LINE … スクリプトの何行目で転んだか
//   BACKUP_ALERT_LOG  … ログの末尾（原因を見るための手がかり）

import path from 'node:path';
import { Resend } from 'resend';

const APP = process.env.APP ?? '/var/www/30nen_next';

// .env.local を読み込む（Next.js の外＝素の Node で動かすため自分で読む）。
try {
  process.loadEnvFile(path.join(APP, '.env.local'));
} catch {
  // ローカルで試すときなど、無ければ既に入っている環境変数だけで動かす。
}

const isTest = process.argv.includes('--test');

const to = process.env.BACKUP_ALERT_TO ?? '';
if (!to) {
  console.error(
    '[notify] BACKUP_ALERT_TO が未設定のため知らせを送れません。' +
      `${APP}/.env.local に BACKUP_ALERT_TO=宛先アドレス を足してください。`,
  );
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY ?? '';
if (!apiKey) {
  console.error('[notify] RESEND_API_KEY が未設定のため知らせを送れません。');
  process.exit(1);
}

const from = process.env.EMAIL_FROM ?? '三十年商店 <noreply@30nen.com>';
const job = process.env.BACKUP_ALERT_JOB ?? 'バックアップ';
const code = process.env.BACKUP_ALERT_CODE ?? '不明';
const line = process.env.BACKUP_ALERT_LINE ?? '不明';
const logTail = process.env.BACKUP_ALERT_LOG ?? '(ログを取得できませんでした)';
const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

const subject = isTest
  ? '【三十年商店】バックアップ通知のテストです'
  : `【三十年商店】⚠ ${job}に失敗しました`;

const body = isTest
  ? `これはテストです。この文面が届いていれば、バックアップが失敗したときの知らせも届きます。

送信日時: ${now}

（このメールに返信する必要はありません）`
  : `三十年商店のサーバーで、${job}が失敗しました。

  日時　　: ${now}
  作業　　: ${job}
  終了コード: ${code}（0以外は失敗）
  場所　　: スクリプトの ${line} 行目

■ まず確かめること
  よくある原因は「Google Drive の空き容量ぎれ」です。
  サーバーにログインして次の1行を実行し、Free の数字を見てください。

    rclone about gdrive:

  空きがほとんど無ければ、Google One の容量を増やせば直ります。

■ ログの末尾（詳しい手がかり）
${logTail}

■ 直らないとき
  この作業が失敗している間は、その日のぶんのバックアップが取れていません。
  ログの全文は サーバーの /var/log/30nen-backup.log にあります。

（このメールは自動で送られています。返信は不要です）`;

async function main() {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, text: body });

  if (error) {
    // ここで失敗すると誰にも届かないので、ログにはっきり残す。
    console.error(`[notify] 知らせのメールを送れませんでした: ${error.message}`);
    process.exit(1);
  }

  console.log(`[notify] ${isTest ? 'テスト' : '失敗'}の知らせを ${to} に送りました。`);
}

main().catch((err) => {
  console.error(`[notify] 知らせのメールを送れませんでした: ${String(err)}`);
  process.exit(1);
});
