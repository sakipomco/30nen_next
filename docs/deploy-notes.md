# デプロイ手順書（建て直しメモ）— Xサーバー VPS

> このファイルは、Xサーバー VPS でこのサイトを動かすための「建て直しレシピ」です。
> お試しVPSを失効させても、これを見れば同じ環境を再構築できます。
> （Codex レビュー R-07「失効前に成果物を回収」への対応・初版 2026-06-22）

---

## 0. これは何か

- 新サイト（Next.js + SQLite）を、レンタルサーバーの **Xサーバー VPS**（Node.js常駐に正式対応）に置く手順。
- 2026-06-18〜の無料お試しで実際に通しデプロイに成功した構成を、そのまま記録したもの。
- **本番化の残TODO**（https化・専用ユーザー・本番用の秘密鍵・バックアップ復旧テスト）は §8 参照。

---

## 1. サーバーの素性（お試し時の実測値）

| 項目 | 値 |
|---|---|
| OS | **Ubuntu 26.04 LTS** (Resolute Raccoon) / kernel 7.0.0-14-generic / x86_64 |
| Node.js | **v24.17.0**（公式バイナリをSHA256検証して `/usr/local` へ設置。`which node` = `/usr/local/bin/node`） |
| npm | **11.13.0** |
| PM2 | **7.0.1** |
| Nginx | **1.28.3 (Ubuntu)** |
| プラン | 2GBメモリ / 仮想2コア / NVMe（お試しは30GB・有料2GBプランは50GB） |
| 接続 | `ssh -i ~/.ssh/30nen_vps root@<サーバーIP>`（Mac側の鍵で認証。お試しIP=162.43.22.151／本契約IP=162.43.43.144） |
| アプリ常駐メモリ | 約82MB（参考・お試し実測） |

> ※IPアドレスは契約ごとに変わる。建て直し時は新しいIPに読み替える。

---

## 2. 置き場所とフォルダ構成

- アプリ本体: **`/var/www/30nen_next`**
- DB（SQLite・**永続・バックアップ対象**）: `/var/www/30nen_next/data/30nen.db`（+ 実行中は `-wal` `-shm` も生成される）
- アップロード画像（**永続・バックアップ対象**）: `/var/www/30nen_next/public/uploads/`
- 秘密設定（**Gitに入れない・別保管**）: `/var/www/30nen_next/.env.local`（§5参照）

---

## 3. 建て直しの手順（ゼロから）

### 3-1. サーバーを借りて つなぐ
1. Xサーバー VPS を契約（または お試し）。プランは2GBから。
2. 管理パネルの **パケットフィルター（ファイアウォール）** で **SSH(22)・Web(80/443)** を「許可」に追加。
   - ⚠ 新規VPSは初期状態で全ポート閉。ここを開けないとSSHもWebもつながらないでハマる。
3. Mac から鍵認証で接続: `ssh -i ~/.ssh/30nen_vps root@<新しいIP>`

### 3-2. Node.js を入れる（公式バイナリ・v24系）
- 公式バイナリ（`node-v24.x-linux-x64.tar.xz`）をダウンロード → **SHA256を検証** → `/usr/local` へ展開。
- 確認: `node -v`（v24系）・`npm -v`。
- ビルドに必要な `build-essential` も入れる（better-sqlite3 / sharp のネイティブビルド用）:
  `apt update && apt install -y build-essential`
  - ⚠ 新規VPSは `unattended-upgrades` が動いていて dpkg ロックがかかることがある。ロックが解けるのを待ってから apt。

### 3-3. コードを送る（Mac → サーバー・rsync）
- Mac のこのリポジトリから rsync で転送。**除外**: `node_modules` `.next` `.git`
  （better-sqlite3 / sharp はOSが違うので、サーバー側で入れ直すため）
- 例（Mac側で実行・IPは読み替え）:
  ```
  rsync -avz --exclude node_modules --exclude .next --exclude .git \
    ~/Desktop/30nen_next/ root@<新しいIP>:/var/www/30nen_next/
  ```
- DB（`data/30nen.db`）とアップロード画像（`public/uploads/`）は別途運ぶ（移行データ。§8のバックアップ運用に合流予定）。

### 3-4. 依存をサーバーで入れて、ビルド
```
cd /var/www/30nen_next
npm ci          # better-sqlite3 / sharp はここでサーバー用にビルドされる…はずだが⚠下記
npm run db:migrate   # 空の data/30nen.db に全テーブル作成
npm run build   # 本番用に組み立て（package.json: "build": "next build"）
```

> ⚠ **npm 11.16 以降の落とし穴**（2026-06-25 本契約時に判明）:
> npm のセキュリティ強化で、`better-sqlite3` `sharp` `esbuild` `unrs-resolver` の **postinstall がブロック**される（`npm warn allow-scripts ... not yet covered by allowScripts` が出る）。
> このままだとネイティブビルドが実行されず、`npm start` でクラッシュする。
> **対処** = `npm ci` のあとに必ず:
> ```
> npm rebuild better-sqlite3 sharp --foreground-scripts
> ```
> 検証: `node -e "require('better-sqlite3')(':memory:')"` と `node -e "require('sharp').versions"` がエラーなく出力すればOK。
> （お試し時の npm 11.13.0 ではこの問題は無かった。今後さらに厳格化が進むかもしれないので、新規環境を作るたびにこの検証を入れる。）

### 3-5. PM2 で常駐させる（つけっぱなし）
- 起動コマンド（**`npm start` を PM2 で回す構成**。実測の登録内容）:
  ```
  cd /var/www/30nen_next
  pm2 start npm --name 30nen -- start
  ```
  - PM2 から見た実体: script=`/usr/local/bin/npm` / args=`start` / interpreter=`/usr/local/bin/node` / cwd=`/var/www/30nen_next` / mode=fork
  - ログ: `/root/.pm2/logs/30nen-out.log`・`/root/.pm2/logs/30nen-error.log`
  - `npm start` = `next start`（ポート3000で起動）
- **再起動後も自動で立ち上がるように**:
  ```
  pm2 startup systemd   # 表示されたコマンドを実行（systemdサービス pm2-root を有効化）
  pm2 save              # 現在の常駐リストを保存（/root/.pm2/dump.pm2）
  ```
  - 確認: `systemctl is-enabled pm2-root` が `enabled` ならOK。

### 3-6. Nginx を入れて 受け口を作る
- `apt install -y nginx`
- 設定ファイルを **`/etc/nginx/sites-available/30nen`** に作成し、`/etc/nginx/sites-enabled/30nen` へシンボリックリンク。
  実際に動いた内容（§4に全文）。
- 反映: `nginx -t`（文法チェック）→ `systemctl reload nginx`

---

## 4. Nginx 設定の全文（実際に動いたもの）

`/etc/nginx/sites-available/30nen`（→ `sites-enabled/30nen` にリンク）:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 動画アップロード（アプリ側の上限200MB）を通すため 210m（2026-07-10 動画対応で 40m から変更）
    client_max_body_size 210m;

    # アップロード画像は Nginx が直接配信（root方式・aliasのtry_files問題を回避）
    location /uploads/ {
        root /var/www/30nen_next/public;
        expires 30d;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**ハマりどころ（重要）:**
- `client_max_body_size 210m;` … これが無い（または小さい）と大きな画像・動画のアップロードが 413 で弾かれる。
  アプリ側の上限（画像40MB・動画200MB）より少し大きくしておく。
  変更したら `nginx -t` → `systemctl reload nginx` で反映（2026-07-10 の動画対応デプロイ時に本番も要変更）。
- `/uploads/` は **`root` 方式**で直接配信する。`alias` + `try_files` だと動かない。
  理由: `next start` は起動後に `public/` へ書かれたファイル（投稿画像）を配信しないため、Nginxが肩代わりする必要がある。
  - `root /var/www/30nen_next/public;` + リクエスト `/uploads/2026/06/x.jpg`
    → 実ファイル `/var/www/30nen_next/public/uploads/2026/06/x.jpg` を返す。

---

## 5. 環境変数（.env.local）— 値は別保管

`/var/www/30nen_next/.env.local` に置く（**Git管理外・秘密**）。キーは以下:

| キー | 役割 | 本番での注意 |
|---|---|---|
| `SESSION_SECRET` | 会員証(JWT)の署名鍵 | `openssl rand -base64 32` で**本番専用に新規生成**して差し替える（お試しはMacの値が入っていた） |
| `SESSION_COOKIE_SECURE` | Cookieを暗号化通信のみにするか | お試しは `false`（http運用のため）。**https化したらこの行を外す**（=secureに戻す） |

> 実際の値はこのファイル（リポジトリ）には**書かない**。本番化時に安全なメモから設定する。

---

## 6. 動作確認（お試しで通った観点）
- `curl -I http://<IP>/` → 200 / `curl -I http://<IP>/about` → 200 / `/login` → 200
- トップの `<title>` が「三十年商店」。応答 約0.12秒。
- 投稿テスト: ログイン→新規作成→画像アップロード→公開→公開ページ反映。

---

## 7. お試しで出た不具合と対処（再発防止メモ）
1. **httpでログインが続かない** → `src/auth/session.ts` の `SESSION_COOKIE_SECURE` を `.env.local` で `false`。（https化したら外す）
2. **アップロード画像が404** → §4の `/uploads/` を `root` 方式でNginx直接配信。

---

## 8. 本番化TODO（建て直し＝失効後の本番化で必ずやる）
- [ ] **本番用の秘密鍵** `SESSION_SECRET` を新規生成して差し替え（Macからのコピー値を使わない）。
- [ ] **https化**（Let's Encrypt 等）→ 済んだら `SESSION_COOKIE_SECURE` 行を外す。
- [ ] **専用ユーザー**でアプリ実行（お試しは root 実行だった）。ファイアウォール等ハードニング。
- [ ] **テストデータの整理**（テスト管理者 `test@example.com`・サンプルDB/画像を本番前に削除）。
- [ ] **独自URL/ドメイン**の割り当て（現行 30nen.com には触れず、まず別URLで本番相当に）。
- [ ] **【最重要】バックアップと復旧**（Codex R-02/R-04/R-06）:
  - DB（`data/30nen.db`）・`public/uploads/`・`.env.local`・Nginx設定・PM2設定 を **毎日 別の場所へバックアップ**。
  - 「取る」だけでなく、**空のVPSへ実際に復元できるか1回試す**まで Go条件に入れる。
  - コストゼロを守る折衷案＝アプリはVPSのまま、**バックアップ先だけ外部へ逃がす**。

---

## 9. GitHub経由デプロイ（2026-07-01〜の標準・方式A＝手動git pull）

これまでの「Mac から rsync でファイル直送」をやめ、**Mac → GitHub → 本番サーバー**の一本道にした。
本番サーバーが GitHub から `git pull`（実体は `git reset --hard origin/main`）で取得する。

### 一度きりの準備（2026-07-01実施済み）
1. **GitHub 読み取り用の deploy key**をサーバーに作成 → GitHub の repo Settings → Deploy keys に**公開鍵を登録（Write access なし＝読み取り専用）**。
   - `ssh-keygen -t ed25519 -f /root/.ssh/github_deploy -N ""`（サーバー上）
   - `/root/.ssh/config` に `Host github.com` → `IdentityFile /root/.ssh/github_deploy`・`IdentitiesOnly yes`
   - 疎通確認: `ssh -T git@github.com` で `Hi sakipomco/30nen_next! ...authenticated`
2. **既存のrsync配備フォルダを git 管理下にして GitHub の最新に合わせる**（`/var/www/30nen_next`）:
   ```
   git config --global --add safe.directory /var/www/30nen_next
   git init -b main
   git remote add origin git@github.com:sakipomco/30nen_next.git
   git fetch origin
   git reset --hard origin/main
   git branch --set-upstream-to=origin/main main
   ```
   - ⚠ `data/`（DB）・`public/uploads/`（画像）・`.env.local`（秘密）は **.gitignore 対象なので `reset --hard` でも触れられない**（自動で保護される。rsync時代のように除外指定に気を使わなくてよい）。**念のため事前にDB・.env.localをバックアップ**してから実施した。

### 毎回のデプロイ（次回から）
1. Mac で `git commit` → **`git push`**（GitHubへ）
2. サーバーにログインしてスクリプトを1回:
   ```
   ssh -i ~/.ssh/30nen_vps root@162.43.43.144
   bash /var/www/30nen_next/scripts/deploy-prod.sh
   ```
   - `scripts/deploy-prod.sh` の中身＝①`git reset --hard origin/main`②package変更時だけ`npm ci`＋native再ビルド③`db:migrate`④`npm run build`⑤`pm2 restart 30nen`。
3. 確認: `curl -s -o /dev/null -w "%{http_code}" https://new.30nen.com/` が 200。

### メモ
- **push とデプロイは別物**：push は GitHub に控えを送るだけ（サイトは変わらない）。反映はサーバーで deploy スクリプトを実行したとき。
- 将来「push=自動反映」にしたければ **方式B（GitHub Actions）** に移行できる（VPSのSSH鍵をGitHub Secretsに預ける必要あり）。まずは手動（方式A）で運用。

---

最終更新: 2026-07-01（**GitHub経由デプロイ（方式A・手動git pull）に切替**＝§9 追加・`scripts/deploy-prod.sh` 追加・項目78）
既往: 2026-06-25（本契約での建て直し成功＝162.43.43.144／npm 11.16の `allow-scripts` 落とし穴を §3-4 に追記・項目64）
初版: 2026-06-22（お試しVPS失効前の設定回収）
