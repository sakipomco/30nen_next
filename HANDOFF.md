# 引き継ぎドキュメント（30nen_next）

> このファイルは、`30nen_next` フォルダで作業を始める際に最初に読む引き継ぎ資料です。
> 新しい Claude Code セッションを **このフォルダ（`~/Desktop/30nen_next`）で起動** し、
> 「HANDOFF.md を読んで」と伝えれば、ここまでの経緯を引き継げます。

最終更新: 2026-06-25（**移行S4：全件リハーサル移行を実施＋テスト表示で重大バグ（日本語slug 404）を発見・修正（項目58）**＝現行サイト読み取りのみ厳守。まとめ取り2回で全件書き出し（公開8,102件）→練習用DBへ画像縮小つきで取り込み約1時間＝**取り込み8,101／除外ID282=1／記事エラー0／件数照合OK**・著者連載ひもづけ正・親子連載正・**文字化け0・旧URL残り0**・画像縮小OK。画像は配置12,435/エラー2・合計**約6.4GB（写真2.4＋動画4.0＋音声）**＝主因は動画(縮小不可)・現行71GBの約1/11。画像エラー2枚は現行側404→`migration/known-issues.md`に記録。**⚠重大バグ＝日本語タイトル記事が全部404**＝Next.js 16は`[slug]`paramsをURLデコードせず生エンコードで渡す（AGENTS.md「普段のNextでない」）→修正2か所＝`transform.ts`の`normalizeSlug`で**復号保存**＋`posts/[slug]/page.tsx`の`findArticle`で**decodeURIComponentして照合**→日本語/¥/旧符号化URL/英語すべて200（旧リンク継続性も確保）。型/Lintクリア。**残課題(段取り)**=連載ロゴimage_path未設定・sortOrder要調整・featured画像未移行・HEIC表示。直前は**移行S3：全件書き出しを「まとめ取り」方式に高速化（項目57・コード作り替えのみ・本番アクセスなし）**＝項目56でper-IDのSSHは全件2〜3時間で遅いと判明→**サーバーアクセス2回だけ**に作り替え（全件でも数分見込み）。`export-wp.sh`を高速版に＝①`wp post list --format=json`で全本体を1回取得②`wp db query`のSELECT(JOIN・読み取り・TSV)で連載対応を1回取得→`all-posts.json`＋`all-categories.tsv`。`split-export.ts`新規＝手元でまとめファイルを1記事ごとに分割→`derive-aux-files.ts`で4ファイル化。`export-procedure.md`も新方式に更新。**検証=実データ20件で擬似まとめ→分割が元と完全一致(20/20)・取り込みdry-runもOK**。型/Lintクリア。直前は**移行S3：実データ20件で書き出し→取り込みの通し検証に成功＋移行時の画像自動縮小を実装（項目56）**＝現行サイトは読み取りのみ厳守。`ssh xserver-30nen`でWP-CLI 2.4.0確認＝**公開記事は8,101件**（プラン想定7,999から日次投稿で+102・記事は日々増える）。サーバーに何も書かず`wp post get`等の出力を手元へ直接保存する方式で先頭20件取得→`derive-aux-files.ts`で4ファイル化→練習用DB`data/migrate-test.db`へ取込＝**記事20/20・画像21枚・エラーゼロ／著者連載ひもづけ正・画像URL書換・日時JST→UTC正確・slug保持・冪等**。さらに「軽くして運ぶ」を実装＝縮小ロジックを共通部品`src/lib/image.ts`(`shrinkImage`/`mimeFromExtension`)に集約し投稿API(`upload/route.ts`・挙動不変)と移行(`migrate-articles.ts`の`placeImage`・DL/サンプル両経路で保存前に縮小)が同基準に。**実測 21枚 約21MB→約3.1MB(約1/7)・2MB級→254KB(1600px)・全8,101件でも1〜2GB見込み**(現行71GBから激減)。`.gitignore`に`/migration/export/`追加。型/Lintクリア。**▶次**=全件8,101書き出し(SSH per-IDは遅い→`export-wp.sh`+rsync等に作替)→S4全件取込＋点検。直前は**移行S3：全記事の「書き出し手順書」一式を作成＝実際の書き出しは未実行（項目55）**＝SAKI選択で手順を作るだけ。3点＝`migration/export-wp.sh`（サーバー上で動かす読み取り専用の書き出し＝公開記事ごとに`<ID>.json`＋`<ID>.categories.json`・`LIMIT`で試運転可）／`migration/derive-aux-files.ts`（手元で`<ID>.author_id.txt`＋`<ID>.imagelist.txt`を生成しサンプルと同じ4ファイル構成に・サンプル10件で画像リスト完全一致を検証）／`migration/export-procedure.md`（やさしい手順書＝SCP→試運転20件→全件→rsyncで手元へ→補助ファイル生成→件数照合7999→移行スクリプトに`--posts`で流す。安全メモ・画像の`--download`／縮小未実装の注意つき）。接続=`ssh xserver-30nen`。すべて未実行・現行サイト無影響。直前は**移行S3：記事移行スクリプトを作成しサンプル10件で通し検証に成功（項目54）**＝手元のパソコン内＋現行サイト読み取りのみで、記事を運ぶ仕組みを作った。部品4本＝`migration/lib/maps.ts`（対応表読込＋著者解決ルール＝番号1統合/特例ID282除外・ID24126→Luis）／`migration/lib/transform.ts`（本文整形＝wpautopで段落化・画像URL`30nen.com/wp-content/uploads`→`/uploads`書き換え・サニタイズ・日時JST→UTC）／`scripts/migrate-categories.ts`（連載21・`wp_term_id`で冪等）／`scripts/migrate-users.ts`（著者22・`wp_id`で冪等・担当連載ひもづけ）／`scripts/migrate-articles.ts`（本体＝`wp_id`で**冪等**・特例・**dry-run**・エラーを記事/画像で分離記録・件数照合・画像配置）。**練習用DB`data/migrate-test.db`**（本番DBと分離）で連載21・著者22・記事10件をエラーゼロで取込＝全件 著者/連載 正しくひもづけ・画像URL旧URL残ゼロ・画像17枚・日時正確・slug保持・冪等(再実行で重複0)・型/Lintクリア。Git管理外=練習用DBとコピー画像（コミットはスクリプト4本のみ）。**▶次**＝本物の全記事7,998件の書き出し手順確立→S4全件リハーサル→画像本番取得(`--download`実装済)。直前は**トップページの見た目を微調整（項目53・コミット`e8f2aba`）**＝SAKIさんと画面を見ながら1行CSS（Tailwind）を4ファイル調整。①足跡「三十年商店」の下アキを詰め（`breadcrumb.tsx` `mb-6`→`mb-2`・「最新」帯との間）②見出しオビの下アキを詰め（`section-heading.tsx` 既定 `mb-5`→`mb-3`＝最新/記事一覧/小商店ほか全ページ共通）③左右コラムを同じだけ少し拡幅（`layout.tsx` `1fr_1.8fr_1fr`→`1.1fr_1.8fr_1.1fr`・各266→277px・中央は据え置き／一度「右だけ広げ等分」を試したが大きすぎて元比率へ戻し左右均等に変更）④のれんロゴを拡大（`sidebar-left.tsx` PC時 208→247px＝基準260pxの95%）。型/Lintクリア。文字色は確定どおり濃いグレー`#333`。直前は**小商店（カテゴリー画像）のロゴを全20連載ぶん並べた（項目52）**＝右サイドバー「小商店」に、連載の `imagePath` を3列で表示する既存の仕組み（`SeriesList`・トップ階層のみ）を使い、SAKIさんが `ph_data/logo/` に用意したロゴ20枚を割り当てて並べた。**DBに `migration/series-map.csv` に沿った本番連載を用意**（既存サンプル6件は名前一致で更新・残りを新規＝計21件＝トップ階層20＋山陰編は度々の旅の子。各 `wp_term_id`/`slug`/`sort_order`/`image_path` をセット）。ロゴは `public/uploads/logo/` へコピー。**並び順はSAKIさん指定の画像どおりに確定**（1.店主よりお知らせ→2.度々の旅→3.もしもし五島列島→4.CAL TATAU→5.浮記→6.エフェメラ！→7.王様の耳は→8.雨のち晴れ→9.とこのとびら→10.島縞→11.悩みのタネに水をまく→12.ご機嫌な毎日→13.Sophy's philosophy→14.P.S.→15.風早草子→16.1/10957→17.のちの野良→18.かきぬまめがね＠東京→19.わたしのレシーヘン→20.Seize the day。19・20は指定画像に無く末尾）。**度々の旅=`p01_tabitabi_pre_logo2.png`／店主よりお知らせ=`oshirase3.jpg` を後から追加**しプレースホルダーは解消。⚠これはローカルのお試しデータ（DB実体・`public/uploads/`はGit管理外）で、本番は移行S3で正式投入する。ロゴ元データ `ph_data/logo/`（20枚）はGitに保存。直前は**置き場所のセカンドオピニオン取得＋お試しVPS失効前の設定回収（項目51）**＝Xサーバー VPSお試しの**利用期限2026-06-22**にあたり、「置き場所をXサーバー VPSで確定してよいか／裏返るか」を別AI（Codex）に客観レビュー依頼（`letter_box/outbox/2026-06-22_question-01.md`→回答`inbox/2026-06-22_review-03.md`）。**Codex総合＝VPSは妥当・致命的見落としなし／ただし今日の本契約は不要**（公開は7月下旬〜8月末で常時稼働まだ不要・本契約は運用責任の開始）。**最大リスクはVPS選定でなく保守体制＝バックアップが「戻せる」まで本番Go条件にすべき**との指摘。**【方針決定（SAKI合意）】①今は本契約せず失効でOK（データはGitHub/Macに有り建て直し可）②お披露目前に再契約して建て直す③バックアップ復旧テスト合格をGo条件に追加**。**R-07対応＝失効前にテストサーバー(162.43.22.151)へSSH（読み取りのみ・秘密値は読まず）で構成を吸い出し、建て直しレシピ `docs/deploy-notes.md` を新規作成**（OS/Node/npm/PM2/Nginx各版・フォルダ構成・ゼロからの手順・**Nginx設定全文**=`client_max_body_size 40m`＋`/uploads/`は`root`方式・PM2起動=`pm2 start npm --name 30nen -- start`＋`startup systemd`＋`save`・環境変数キー一覧・不具合2件と対処・本番化TODO）。直前は**投稿の自動保存（サーバー下書き）を実装（項目50）**＝書いている途中で**10秒ごと（変化があったときだけ）にDBへ下書き自動保存**。新規は最初の自動保存で「下書き」として一覧に出て、その id を見えない欄(React管理)に入れる→以後の自動保存も手動「投稿する」も同じ記事を更新＝**重複記事ができない**。作成/更新を1本化した `saveArticleAction`＋自動保存用 `autosaveArticleAction` を `actions/articles.ts` に追加（自動保存は検証ゆるめ＝タイトル空でも「（無題）」・連載未選択でも保存・status は変更しない）。**公開中の記事は自動保存しない**（書きかけが公開ページに出るのを防ぐ・編集後は「投稿する」で反映）。タブを離れる時も保存。実装途中で「id欄が再描画で消えて重複しかねない」不具合を発見し、id欄をReact state管理にして解消。実機で①新規→下書き自動作成②再保存で同一id更新（重複なし）③公開記事は自動保存オフ＋注意書き、を確認。型/Lintクリア。直前は**投稿画面の改善6点（項目49）**＝①「新規作成」を管理者・書き手とも**「新しい日記をかく」**に統一（`/admin` ボタン・`/admin/new` 見出し）②書き手プロフィールの**年齢を「誕生日」入力に変更→満年齢を自動表示**（DB列 `age`→`birthday`・マイグレ`0008`追加/`0009`削除・`src/lib/datetime.ts` に `calcAge` 追加・記事ページの書き手欄は誕生日から自動計算・誕生日は非公開）③本人が自分のプロフィールだけ編集できる**「myPROFILE」`/admin/profile`** を新設（`src/app/admin/profile/`・`src/app/actions/profile.ts`・`requireUser()` で本人のみ・名前/顔写真/誕生日/居住地/SNS・メール/PW/権限/担当連載は管理者領域として除外）④本文エディタに**「リンク」ボタン**追加（TipTap StarterKit v3 内蔵Linkを設定・選択文字にリンク・新タブ＋`rel`安全属性・編集中は飛ばない・`sanitize.ts`は元々`<a>`対応済み・`globals.css`にエディタ内リンク色）⑤これまで上げた写真の一覧**「画像フォルダ」`/admin/media`** を新設＝全員分を新しい順・クリックで拡大・**自分が上げた写真だけ削除**（管理者は全部・過去の写真は持ち主不明で管理者のみ）。DBに台帳 **`uploads`**（path/uploaded_by/created_at・マイグレ`0010`）を追加し、`/api/upload` で誰が上げたか記録するようにした（`src/db/uploads.ts`・`src/lib/media.ts`でフォルダ走査・`src/app/actions/media.ts`で削除＝パストラバーサル防御あり）⑥投稿フォームの**「連載」欄を本文より下（公開日時の下）へ移動**（`article-form.tsx`）。すべて型(tsc)/Lint(eslint)クリア・ブラウザ実機で確認済み。**注意＝既存のスキーマ未コミット分（wp_id等のunique化＝マイグレ`0007`）も今回のコミットに同梱**（schema.tsで分離不能なため）。直前は2026-06-18の更新＝**VPS実機で投稿テスト→不具合2件修正＋本文画像のドラッグ&ドロップ/貼り付け追加（項目48）**＝**VPS実機で投稿テスト→不具合2件修正＋本文画像のドラッグ&ドロップ/貼り付け追加（項目48）**＝①http でログインが続かない→`src/auth/session.ts` に環境変数 `SESSION_COOKIE_SECURE` を追加しサーバー`.env.local`で`false`（**https化したら外す**）②アップロード画像が404→`next start`は起動後の`public/`を配信しないため**Nginxで`/uploads/`を直接配信**（`alias`+`try_files`はNG・**`root`方式**で解決＝`location /uploads/ { root /var/www/30nen_next/public; }`・このNginx設定はサーバー上のみでリポジトリ未管理）③`rich-editor.tsx`に`handleDrop`/`handlePaste`を実装し本文画像のドラッグ&ドロップ/⌘V貼り付け対応。直前は**🎉 Xサーバー VPS にテストデプロイ成功＝新サイトがインターネット上で動いた（項目47）**＝置き場所を**A案＝Xサーバー VPS に決定**し無料お試し（無料VPS・2GBプラン）で実機デプロイを通しで実行。**`http://162.43.22.151` で外部から表示OK**（トップ/・/about・/login すべてHTTP200・`<title>三十年商店</title>`・0.12秒）。**IP=162.43.22.151／OS=Ubuntu26.04LTS／利用期限2026-06-22**（お試しは自動課金なし）。接続=Mac側鍵 `~/.ssh/30nen_vps` で `ssh -i ~/.ssh/30nen_vps root@162.43.22.151`（鍵認証）。構成=`/var/www/30nen_next`・Node.js v24.17.0（公式バイナリをSHA256検証して`/usr/local`へ）・build-essential・コードはrsync転送（node_modules/.next/.git除外＝better-sqlite3/sharpはサーバーで`npm ci`し直し）・DBとサンプル画像も同梱で画面に記事表示・`npm run build`成功・PM2常駐(`30nen`・`pm2 startup systemd`+`save`で再起動後も自動)・Nginxで`80→127.0.0.1:3000`受付(`client_max_body_size 40m`)。詰まり=パケットフィルターが初期全閉→パネルでSSH(22)+Web(80/443)を「全て許可」追加で開通／新規VPSは`unattended-upgrades`のdpkgロックを待ってからapt。**本番化TODO**＝本契約判断(期限6/22)・独自URL/ドメイン(現行30nen.comは触れず別URL)・https化(Let's Encrypt)・専用ユーザー/本番`.env`/ファイアウォール等ハードニング・テスト管理者やサンプルDBの整理。直前は**デプロイ準備：ローカルで本番ビルド／起動を確認＋Xサーバー下見＝重要発見あり（項目46）**＝①`npm run build`（本番用の組み立て）がエラーゼロで成功・②`npm run start`（本番モード起動）も成功しトップ`/`・`/about`ともHTTP200・③Xサーバーに**読み取りのみ**で下見＝Node.jsは未導入だがcurl/git/bash等そろいnvmで自前導入可・現行WPは`/home/the30nen/30nen.com`で温存。**⚠重要発見＝今の「共有サーバー（レンタルサーバー）」はNode.jsの常駐アプリを正式サポートしていない**（管理者権限なし・systemd不可・常駐は止められる恐れ。裏ワザ運用は可能だが不安定で非推奨）。→引き継ぎメモの「Xサーバー Nginx+PM2」想定に見落とし。**本番は Xサーバー VPS（月約800〜1,000円・Node.js正式対応）が安心**との結論。コストゼロ方針（=月額SaaSゼロ・サーバー代のみ）には反しないが共有代に上乗せになるため**置き場所はXサーバー VPSが有力（A:VPS／B:共有で裏ワザ／C:保留の3択・SAKIさん最終確認待ち）。料金を公式確認＝VPS一番安い2GBプラン(2GB/3コア/SSD50GB)で月990〜1,170円前後。他AI(Gemini)の案A(WP据え置き)・案B(Vercel/ISR)も比較したが、当サイトはSSRでビルド渋滞が起きず・案Aは脱WP目的に逆行・案BはSaaS課金＋作り直しのためVPS維持が最適と判断。**⚠重要発見＝現行画像が`wp-content/uploads`で71GB・年間約47GB増（2025年47GB/2026年半年で24GB）→30年で1.4TB超**。WPは原寸写真＋自動生成コピーで巨大。当システムは画像を自動圧縮(長辺1600px/約230KB・項目16)するため、**【決定】移行時に画像を「軽くして運ぶ」**＝71GBが数GB〜十数GBに激減見込み（正確値はリハS4で実測・`data-migration-plan.md`のS5に反映予定）。30年・データ増加前提では「自分でデータ所有・定額・段階拡張」のVPSが最適で、まず2GBプランで開始しpay-as-you-grow。直前は**移行S2：連載対応表のたたき台を作成＋著者一覧の担当連載を確定（項目45）**＝現行WPから読み取りのみで「連載×著者」を取得し `migration/series-map.csv` を新規作成、`migration/author-map.csv` の担当連載/使用言語も確定。**22連載の公開記事合計が7,999件＝総数と一致＝1記事1連載・未分類ゼロ**で移行が素直。現行は徹底して「1人1連載」。確定＝CAL TATAU/エフェメラ！は担当2名・度々の旅＞山陰編は親子で作り旅シリーズを今後拡張・店主よりお知らせは連載として作る(中身=POP UP募集記事ID12729=aboutのPOP UPリンク先)・未分類は作らない・Seize the day(クロウタドリ)は休止中だが移行する。**記事単位の特例**＝ID282(¥2,000お雑煮材料費)は重複で移行しない／ID24126(Hijos)はLuisへ→**移行する公開記事は7,998件**。直前は**移行S1：著者対応表のたたき台を作成（項目44）**＝現行WPから読み取りのみで著者一覧を取得し `migration/author-map.csv` を作成。**著者23名・みなしご記事ゼロ**。確定＝ぐっさん合流（番号1の142件→番号12／番号1はアカウント作らない）・管理者は「店主」＋「SAKI本人」の2つ。直前は**記事データ移行の準備スケジュールを作成＋外部レビュー反映（項目43）**＝`migration/data-migration-plan.md` に「準備〜本移行〜切替」を1枚で通し化し、別AIエージェントの客観レビュー（`letter_box/inbox/2026-06-16_review-02.md`）を受けて Go/No-Go合格条件・SEO・ロールバック・スクリプト仕様を補強。返信は `letter_box/outbox/2026-06-16_reply-02.md`。切替目標=**7月下旬（努力目標）／7-6判定で8月末へ延期可**。次の最優先は Xサーバーへのテストデプロイ＋本番相当ビルド成功。**左端メニュー5項目（about/history/howtouse/privacy＋書き手募集）はすべて完成済み**）

---

## 0. このプロジェクトは何か

30nen.com を **WordPress から自前システムへ移行** するための新規プロジェクト。
現行の WordPress サイト（`~/Desktop/30nen_pj`）は **一切触らず温存** し、
本プロジェクトは別リポジトリとしてクリーンな履歴で構築する（移行方針＝「B：新規リポジトリ」）。

### サイトの性格（設計の前提）
- **20名以上の書き手が毎日投稿している日記サイト**。記事は日々どんどん増える（現状 約7,790件）。
- ただし「同時書き込み」は軽い（各人が1日数回 投稿ボタンを押す程度）→ SQLite で十分余裕。記事件数の増加も問題なし。将来 数百人規模の高頻度同時書き込みになれば MySQL/PostgreSQL 等へ移行を検討（articles.wp_id を保険として保持）。

### なぜ移行するか（ゴール）
- 管理・運用の手間を減らす
- **20名以上**の投稿者（ITリテラシー低め）が使いやすい **シンプルな投稿画面** を実現
- 月額 SaaS 費用ゼロ（サーバー代のみ）
- 既存記事を **全件移行**

---

## 1. ここまでにやったこと（2026-06-01時点）

1. 移行方針を検討し、**B（新規リポジトリ）** を採用。
   - A（GitHubフォーク）は履歴に巨大な削除差分が残り、技術スタックも別物なので不採用。
   - 共有したいのは「①記事データ ②デザイン(CSS) ③画像」だけなので、参照用に選択コピーする方針。
2. `~/Desktop/30nen_next` を作成し、`git init`（main ブランチ・履歴クリーン）。
3. `README.md` と `.gitignore` を作成し、初回コミット済み（`8e8b29f`）。
4. **Node.js を導入**（nvm 経由・node v24.16.0 / npm 11.13.0）。`~/.zprofile` に nvm 読み込み追記済み。
5. **Next.js 雛形を作成**（`create-next-app` / Next 16.2.6 + React 19 + TypeScript + App Router + Tailwind + ESLint + `src/`）。dev サーバー起動・HTTP 200 を確認済み（コミット `7036bad`）。
6. **GitHub に新リポジトリを作成して push**：`sakipomco/30nen_next`（Private）。SSH 鍵 `~/.ssh/30nen_github` で認証（`origin` 追跡済み）。
7. **フェーズ1（サンプル取得）＋参照物の持ち込み**を実施（コミット `6315ff3`）。本番 30nen.com から **読み取りのみ** で取得：
   - `reference/sample-posts/` … 種類を散らしたサンプル記事10件（JSON＋使用画像17枚）。詳細は同フォルダの README 参照。
   - `reference/theme/30nen_original/` … 現行の独自テーマ一式（CSS・テンプレ・デザイン素材）＋デザインメモ（フォント「Zen Old Mincho」、色 `#333`/`#150c0c` 等）。
   - `reference/categories.json` … カテゴリ全体構造（22件・親子: 度々の旅 > 山陰編。※この階層の記事は現状0件）。
   - 本番の公開記事は **約7,790件**（全件移行はフェーズ4）。著者は WordPress の user ID で保持（表示名対応は後工程・ユーザー情報の取り扱いは要確認）。
8. **フェーズ2：DBスキーマ設計が完成**（`docs/schema.md` に全テーブル記録）。
   - 実データ確認: 本文はHTML（タグはシンプル）、画像は絶対URL埋め込み（移行時にパス書き換えが必要）、著者は数字ID。
   - 確定した4テーブル:
     - `articles`（記事）… 1記事1カテゴリ／本文はHTML保存／status は `draft`・`published`。
     - `users`（投稿者）… 権限2種（`admin`/`author`）、プロフィール（顔写真 `avatar_path`・自己紹介 `bio`）は任意、ログインは email＋パスワード（ハッシュ化保存）。
     - `categories`（連載）… 親子構造（`parent_id` 自己参照）＋並び順。
     - `category_authors`（中間テーブル）… **1連載＝複数担当**を表す担当名簿（複合主キー）。
   - FOREIGN KEY 関係も整理済み。テーブル作成順: users → categories → category_authors → articles。
9. **フェーズ2：DBライブラリ選定〜実DB作成が完了**（コミット `（このコミット）`）。
   - **ライブラリは Drizzle ORM を採用**（+ better-sqlite3 / drizzle-kit）。理由＝設計図をほぼそのままコード化でき、打ち間違いに強く、軽くてXサーバーにそのまま載るため。
   - 設計図(`docs/schema.md`)を `src/db/schema.ts` にコード化。DB接続口 `src/db/index.ts`（アプリからは `import { db } from '@/db'`）。
   - マイグレーション生成＆実行済み → **`data/30nen.db`（SQLiteファイル）に4テーブル作成完了**。列・デフォルト値・外部キー・複合主キーが設計どおりであることを確認済み。
   - コマンド: `npm run db:generate`（差分マイグレーション生成）/ `npm run db:migrate`（適用）/ `npm run db:studio`（GUI閲覧）。
   - DB実体(`data/*.db`)はGit管理外（`.gitignore`済み）。マイグレーション(`drizzle/`)はGit管理する。
10. **フェーズ2：記事(articles)のCRUD APIが完成**（コミット `（このコミット）`）。
    - データアクセス層 `src/db/articles.ts` … 記事の読み書き窓口を1か所に集約。
      - Create: `createArticle`（公開なら公開日時を自動セット）
      - Read: `listArticles`（status絞り込み・新しい順）/ `getArticleById` / `getArticleBySlug`
      - Update: `updateArticle`（渡した項目だけ更新・updated_at自動更新・下書き→公開で公開日時を補完）
      - Delete: `deleteArticle`
    - 型は schema から自動生成（`$inferSelect`）。設計を変えても型がズレない。
    - 動作確認: `scripts/smoke-articles.ts`（`npx tsx scripts/smoke-articles.ts`）で C/R/U/D 全通過を確認。型チェック(tsc)・Lint(eslint)もクリーン。
    - メモ: 日時はUTC保存（DB既定の `datetime('now')` と揃えた）。日本時間への変換は表示を作るときに行う。
11. **フェーズ2：JWT認証（ログイン）の土台が完成**（コミット `（このコミット）`）。
    - **JWT＝署名付きの「会員証」トークン**。中身（userId・role）＋サーバーだけが作れる署名のセット。Cookieに保存し、毎回サーバーで本物か検証する。
    - 技術選定: 署名は **`jose`**（Next.js公式推奨・純JS・Xサーバーにそのまま載る）。パスワードのハッシュ化は **Node標準の `crypto.scrypt`**（追加ライブラリ不要・OWASP推奨方式）。`jose` を `npm install` 済み。
    - 作成ファイル:
      - `src/auth/password.ts` … パスワードのハッシュ化(`hashPassword`)と照合(`verifyPassword`)。生パスワードはDBに保存しない。
      - `src/auth/jwt.ts` … JWTの発行(`signSession`)と検証(`verifySession`)。有効期限7日。秘密鍵は環境変数 `SESSION_SECRET`。
      - `src/auth/session.ts` … 会員証をCookieに保存/削除(`createSession`/`deleteSession`)・読み出し(`getSession`)・今ログイン中のユーザー取得(`getCurrentUser`)。
      - `src/db/users.ts` … 投稿者のデータ層（`createUser`/`getUserByEmail`/`getUserById`/`verifyCredentials`/`deleteUser`）。`passwordHash` を除いた公開用 `PublicUser` を返す。
      - `src/app/actions/auth.ts` … Server Action の `login`（成功で `/admin` へ）/`logout`（`/login` へ）。
    - 環境変数: `.env.local`（Git管理外）に `SESSION_SECRET` を生成済み。見本は `.env.example`（Git管理）。秘密鍵は `openssl rand -base64 32` で生成。
    - 動作確認: `node --env-file=.env.local --import tsx scripts/smoke-auth.ts` で 登録→照合→JWT→改ざん検知→削除 まで全通過。型チェック(tsc)・Lint(eslint)もクリーン。
12. **フェーズ2：ログイン画面・投稿管理画面のUIが完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 作成ファイル:
      - `src/app/login/page.tsx` … ログインページ（`/login`）。ログイン済みなら `/admin` へ自動転送。
      - `src/app/login/login-form.tsx` … 入力フォーム（Client Component・`useActionState` で「処理中…」表示やエラー表示）。
      - `src/app/admin/page.tsx` … 投稿管理画面（`/admin`）。`getCurrentUser` でログイン確認し、未ログインなら `/login` へ転送（ルート保護）。ログアウトボタン付き。
    - ブラウザ確認済み（プレビュー機能）: ①ログイン画面表示 → ②誤パスワードでエラー表示 → ③正パスワードでログイン成功→`/admin`へ → ④未ログインで`/admin`は`/login`へ転送 → ⑤ログアウトでCookie削除→`/login`へ、を全通過。
    - ユーザー作成ツール: `scripts/create-user.ts`（管理画面でのユーザー管理ができるまでの暫定）。実行例:
      `NAME="名前" EMAIL="me@example.com" PASSWORD="ひみつ" ROLE=admin node --env-file=.env.local --import tsx scripts/create-user.ts`
    - 動作確認用のテスト管理者を1件登録済み（`test@example.com` / `Test1234!`・role=admin）。※ローカルDBのみ（`data/*.db`はGit管理外）。本番運用前に削除し、本物のアカウントを作る想定。
13. **フェーズ2：投稿UI（記事の作成・編集・削除）が完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 作成ファイル:
      - `src/app/actions/articles.ts` … 記事の Server Action（`createArticleAction`/`updateArticleAction`/`deleteArticleAction`）。全て先頭で `requireUser()` を呼びログイン必須。「下書き保存」=draft・「投稿する」=published（ボタンの `intent` 値で判定）。
      - `src/app/admin/article-form.tsx` … 記事入力フォーム（新規・編集で共用）。タイトル＋本文（今は textarea）＋2ボタン。`useActionState` でエラー表示。
      - `src/app/admin/page.tsx` … 記事一覧（新しい順）。状態バッジ（公開/下書き）・更新日時（日本時間表示）・編集リンク・削除ボタン・「新規作成」リンク。
      - `src/app/admin/new/page.tsx` … 新規作成ページ。
      - `src/app/admin/articles/[id]/edit/page.tsx` … 編集ページ（`params` は Next 16 では非同期＝`await params`）。
    - 認証ヘルパー追加: `src/auth/session.ts` に `requireUser()`（未ログインなら `/login` へ）。管理ページ・記事Actionの保護に使用。
    - ブラウザ確認済み: 新規作成（公開）→一覧反映→編集（タイトル変更＋下書き化）→削除、を全通過。未ログインでは `/admin`・`/admin/new`・編集ページすべて `/login` へ転送。
14. **フェーズ2：本文エディタを TipTap（リッチエディタ）に差し替え（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 導入ライブラリ: `@tiptap/react` `@tiptap/starter-kit` `@tiptap/pm`（いずれも v3）。React 19 と相性OK・追加のnativeビルド不要。
    - 作成ファイル: `src/app/admin/rich-editor.tsx` … TipTapエディタ部品。簡単なツールバー（太字・斜体・見出し・箇条書き・番号付き・引用）。本文HTMLを見えない入力欄(hidden input)に同期させ、既存の `content` 項目としてフォーム送信に乗せる。
    - `src/app/admin/article-form.tsx` の本文欄を textarea → `<RichEditor>` に差し替え。
    - `src/app/globals.css` にエディタ内の見た目（見出し・箇条書き等。Tailwindのリセットを編集エリア内だけ復活）を追加。
    - App Router 対策: `useEditor({ immediatelyRender: false })`（サーバー描画とのズレ＝hydrationエラー防止）。
    - ブラウザ確認済み: 文章入力→見出し書式→「投稿する」で保存→一覧反映→編集ページで本文HTML(`<h2>…`)が正しく復元、までの往復を確認。
    - メモ: StarterKit v3 には Placeholder は含まれない（空欄の案内文は未実装）。本文は引き続き HTML で保存。
15. **フェーズ2：投稿日時の設定（即時投稿／日時指定）が完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 投稿フォームに「公開日時」欄(datetime-local)を追加。**空欄＝今すぐ公開**、**日時を選ぶ＝その日時で公開**（過去日付OK＝さかのぼり投稿）。
    - 日時の変換係 `src/lib/datetime.ts` を新設（DBはUTC保存・利用者は日本時間JST。サーバーのタイムゾーン設定に依存せず明示的に+9で換算）:
      - `formatJst`（UTC→表示用JST）/ `utcToJstInput`（UTC→入力欄の値）/ `jstInputToUtc`（入力欄→DBのUTC）。
    - `src/app/actions/articles.ts` … create/update が公開日時を受け取って保存（空欄なら公開時に「今」を自動補完）。
    - `src/app/admin/page.tsx` … 一覧は公開済みなら「公開: <日時>」、それ以外は「更新: <日時>」を日本時間で表示。日時整形は datetime.ts に集約。
    - ブラウザ確認済み: ①空欄→即時公開（今のJSTが入る）②過去日時(2020-01-15 09:30)指定→その日時で公開③編集ページで公開日時が正しく復元、まで全通過。
    - メモ（将来）: 「未来の日時」を指定して**自動で時が来たら公開する“予約投稿”**は未対応（status=published になり即一覧に出る）。本当の予約投稿にするには、公開ページ側で「未来日時の記事は隠す」処理が必要。公開ページ作成時に対応を検討。
16. **フェーズ2：画像アップロード（本文への画像挿入＋アイキャッチ画像）が完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 導入ライブラリ: `@tiptap/extension-image`（v3）。本文エディタに画像を差し込めるようにする部品。
    - DB変更: `articles` に `featured_image_path`（アイキャッチ画像のパス・任意）列を追加。マイグレーション `drizzle/0001_brave_anthem.sql` を生成・適用済み。
    - 作成ファイル:
      - `src/app/api/upload/route.ts` … 画像の受け取り口（POST `/api/upload`）。ログイン必須・種類（JPEG/PNG/GIF/WebP）とサイズ（10MBまで）を検査し、`public/uploads/年/月/ランダム名.拡張子` に保存して公開URL(`/uploads/...`)を返す。本文用とアイキャッチ用の両方がこの1か所を使う。
      - `src/app/admin/upload-image.ts` … 画像を `/api/upload` に送ってURLを受け取る共通関数（クライアント側）。
      - `src/app/admin/featured-image.tsx` … アイキャッチ画像の設定欄（選ぶ→プレビュー→変更／削除）。選んだパスを hidden input `featuredImage` に乗せて送信。
    - 変更ファイル:
      - `src/app/admin/rich-editor.tsx` … ツールバーに「画像」ボタンを追加。押すとファイル選択→アップロード→カーソル位置に画像を挿入。`StarterKit` に `Image` 拡張を追加。
      - `src/app/admin/article-form.tsx` … 本文の下に `<FeaturedImage>` を配置。編集時は初期値 `featuredImagePath` を渡す。
      - `src/app/actions/articles.ts` … create/update が `featuredImage` 欄を読み、空欄は null として保存。
      - `src/db/articles.ts` … 入力型と create/update に `featuredImagePath` を追加。
      - `src/app/admin/articles/[id]/edit/page.tsx` … 編集フォームに保存済みのアイキャッチを渡す。
      - `src/app/globals.css` … 本文に挿入した画像が編集枠に収まるよう見た目を追加。
      - `.gitignore` … `/public/uploads/*` を除外（投稿された画像はGit管理しない。フォルダ保持用に `public/uploads/.gitkeep`）。
    - ブラウザ確認済み: ①本文に画像挿入→`<img>`が入る ②アイキャッチを選ぶ→プレビュー表示 ③「投稿する」でDB保存（`featured_image_path`＋本文の`<img>`両方）④編集ページで両方が正しく復元 ⑤未ログインは401・画像以外は400で拒否 ⑥保存画像はURLで配信OK(200)。型チェック(tsc)・Lint(eslint)もクリーン。確認に使ったテスト記事・画像は削除済み。
    - メモ（将来・本番運用前に検討）:
      - **保存場所**: 現在は `public/uploads/` に直接保存（`next start`＝PM2運用なら実行時に書いたファイルもそのURLで配信される）。デプロイ時、`public/uploads` は**デプロイで上書きされない永続フォルダ**として扱う（git管理外なので、デプロイ手順で残す or シンボリックリンクを検討）。
      - **画像の自動軽量化**: ✅ 対応済み（`sharp` 採用）。アップロード時にサーバー側で **長辺1600pxまで縮小＋圧縮**（JPEG/PNG/WebP）。スマホの向き(EXIF)も自動補正。**GIFはアニメ保持のため無加工**。上限は安全弁の40MB（自動で軽くなるので普段は引っかからない）。動作確認: 4000×3000・約1.3MBの画像→1600×1200・約230KBに縮小されることを確認。設定値は `src/app/api/upload/route.ts` の `MAX_DIMENSION`（縮小サイズ）・`quality`（圧縮率）・`MAX_BYTES`（上限）で調整可。
      - **サムネ生成**: 一覧用の小さい版（サムネイル）の別途生成は未対応。必要になれば検討（今はアイキャッチ原寸を表示で縮めて使う想定）。
      - **不要画像の掃除**: 記事から外した画像のファイルは消さずに残る（孤児ファイル）。当面は放置で可。気になれば後で掃除する仕組みを検討。
    - 未着手: users/categories のCRUD（カテゴリ選択UI）、公開ページ、Xサーバーへのデプロイ設定。
17. **フェーズ2：アイキャッチ未設定の確認アラート（A案）が完成（ブラウザで動作確認済み）**（コミット `ee3480a`）。
    - 「投稿する」(公開)を押したとき、アイキャッチ画像が未設定なら `window.confirm` で「アイキャッチ画像が未設定です。このまま公開しますか？」と確認。OKで公開・キャンセルで送信中止。**画像なしでも公開できる（必須にはしない）**。下書き保存では確認しない。
    - 仕組み: `src/app/admin/article-form.tsx` の「投稿する」ボタンに `onClick` を付け、hidden input `featuredImage` の値が空かどうかで判定（状態を持ち回さずシンプル）。
    - ブラウザ確認: 投稿+キャンセル→送信中止／投稿+OK→公開／投稿(画像あり)→確認なし／下書き保存→確認なし、の4パターン通過。
19. **フェーズ2：公開ページの要件定義完了 + 実装の事前準備完了**（コミット未実施・要確認）。
    - 要件定義書を `docs/public-page-spec.md` に作成（現行サイトほぼ忠実再現・トップページ優先）。
    - 事前準備として以下を実施済み（ページファイル本体は未作成・Claude Design と共同作業予定）:
      - `src/db/articles.ts` … 公開ページ用のクエリ関数（`listPublishedArticles` / `countPublishedArticles` / `getPublishedArticleBySlug` / `getPublishedArticleById` / `PublicArticle` 型）を追加。著者・連載を JOIN して取得。`status=published` かつ `publishedAt <= 今` のみ（予約投稿対応）。
      - `src/lib/datetime.ts` … `formatJstDate`（”2026年6月3日” 形式の日付表示）を追加。
      - `src/app/layout.tsx` … フォント（Zen Old Mincho・Noto Serif JP）・メタデータ・`lang=”ja”` を設定。
      - `public/` … ロゴ画像（`30nen_logo_noren_plus.jpg` / `30nen_logo.png`）をコピー。
      - 旧 `src/app/page.tsx` を削除（新しい `(public)/page.tsx` との衝突を防ぐため）。
      - `src/app/(public)/posts/[slug]/` と `src/app/(public)/series/[slug]/` のフォルダを作成。
    - **次の作業（Claude Design と共同）**: `docs/public-page-spec.md` の仕様に従ってトップページを実装。
      - まず DB に連載の `image_path` 列を追加するマイグレーションが必要（仕様書 §3-1 参照）。
      - `public/` にダミー画像・line-up.png・sp_menu01.png をコピー（仕様書 §8 参照）。
      - `src/app/(public)/layout.tsx`・`page.tsx` と共通コンポーネント群を作成。
18. **フェーズ2：連載(カテゴリ)・投稿者の管理＋書き手と連載の”自動ひもづけ”が完成（ブラウザで動作確認済み）**。
    - **狙い（SAKIさんの要望）**: 「書き手が連載を選び忘れて“未分類”になる」を構造的に防ぐ。**1人＝1連載**を前提に、管理者が「この人はこの連載の担当」を名簿に登録 → 投稿画面で**担当連載が自動セット**される。
    - **連載データ層＋担当名簿の窓口**（コミット `9ae420c`）: `src/db/categories.ts` を新設（CRUD・親子ツリー `buildCategoryTree`・記事件数集計・担当名簿 `category_authors` の窓口 `getCategoriesForUser`/`setUserCategory`/`getAuthorsForCategory`）。削除は子連載や記事があれば拒否。`src/db/users.ts` に `listUsers`/`updateUser`/`countAdmins` を追加し、`deleteUser` は記事を持つ人を守るガード付き(`{ok,reason}`)に変更。スモークテスト `scripts/smoke-categories.ts` 通過。
    - **連載の管理画面**（コミット `e9e3e05`・管理者専用）: `/admin/categories`（一覧は親子を字下げ表示＋新規作成フォーム／記事・子連載があれば削除ボタンを無効化）、`/admin/categories/[id]/edit`（親候補から自分自身と子孫を除いて循環を防ぐ）。`src/app/actions/categories.ts`。認証ヘルパーに `requireAdmin()` を追加。
    - **投稿フォームに連載選択＋自動ひもづけ**（コミット `f954926`）: 連載は**必須**（未分類を作らない）。投稿者は担当が登録済みなら自動セット＆その範囲内だけ選択可、担当未登録なら全連載から選び→選んだ連載を担当として記録（次回から自動）。管理者は全連載から自由に選べる（担当固定なし）。`src/db/categories.ts` の `listSelectableCategories(user)`、`src/app/actions/articles.ts` の `resolveCategory()` で実装。
    - **投稿者の管理画面**（コミット `2b6fdcd`・管理者専用）: `/admin/users`（一覧に権限・担当連載を表示＋新規作成）、`/admin/users/[id]/edit`（パスワードは空欄なら据え置き・担当連載をここで設定）。`src/app/actions/users.ts`。安全ガード: 自分自身は削除/降格不可・最後の管理者は削除/降格不可・記事を持つ人は削除不可。
    - **動作確認に使ったテストデータ**: テスト連載「度々の旅 ＞ 山陰編」をローカルDBに作成済み（次の公開ページ等のテスト用にあえて残置）。テスト投稿者・テスト記事は作成→確認後に削除済み。テスト管理者(`test@example.com`)は引き続き残置（本番前に削除予定）。
    - **メモ（将来）**: 顔写真(avatar)のアップロードはユーザー編集画面に未実装（自己紹介 bio は実装済み）。必要になれば本文画像と同じ `/api/upload` を流用して追加する。
20. **フェーズ2：公開トップページのデザイン要件を1項目ずつ確定**（コミット `c8f19d1`・`637f69f`）。
    - SAKIさん × Claude で、現行 30nen.com（読み取りのみ）・Claude Design の新デザイン案・SAKIさんメモを突き合わせ、トップページのデザインを **A〜J の10項目**に分けて1つずつ協議・確定。結果は `docs/public-page-spec.md` の **§14「デザイン確定事項」** に全記録（§14 が §4 以前の旧仕様と食い違う場合は §14 を優先）。
    - 確定の要点:
      - A 背景=**白**（現状どおり。Claude Design のベージュ案は不採用）。文字#333・アクセント#150c0c・Zen Old Mincho。
      - B 左端メニュー=**縦書き1本帯**（当店について/沿革/書き手募集/利用規約/プライバシーポリシー・リンク先確定。各ページ本体は後回し）。
      - C 右端アイコン=Instagram/X/メール（メールは `/contact`・後回し）。
      - D ロゴ=現状の `30nen_logo_noren_plus.jpg` を流用（新デザインのロゴ＝この画像と同一だった）。
      - E リードテキスト=文言確定。**★管理画面から編集できる仕組み（サイト設定テーブル＋設定画面）を今回フェーズに追加**（年2〜3回書き換える要件）。→ 当初の「表示のみ」より範囲が少し広がった。
      - F SNSリンク「instagram｜x」/ G 「三十年商店とは？」ボタン→`/about`。
      - H 最新エリア=大画像＋カテゴリー画像（画像左下の白窓・連載の `imagePath`）＋日時（n月j日 G時i分）＋タイトル。**著者名は出さない**。
      - I 記事一覧=**PC2列**・12件/ページ・新しい順・**PCは最新1件をスキップ**（二重表示防止）。カードは画像＋【カテゴリー名】＋日付（時刻なし）＋タイトル。
      - J 右コラム=「小商店」連載画像**3列**（`imagePath` 無ければ `line-up.png`・トンボ風装飾）＋検索＋アーカイブ（検索・アーカイブは**枠だけ**で機能は後回し）。
    - **このセッションでは実装はしない方針**。前回着手しかけた実装ファイル（`src/components/` の部品・`datetime.ts` の追記・コピー画像）は消して、要件定義だけの状態に戻した。
21. **フェーズ2：スマホ表示・ハンバーガーメニューの要件を確定（K〜N）**（コミット `（このコミット）`）。`docs/public-page-spec.md` §14 の「スマホ表示・ハンバーガーメニュー」に記録。基本は現行 30nen.com の挙動を踏襲（ブレークポイント767px以下）。
    - K 全体レイアウト=縦1列。常に表示=ロゴ/リード/SNS/「三十年商店とは？」＋最新＋記事一覧。左端メニュー・右コラム（小商店/検索/アーカイブ）はハンバーガー内へ。記事一覧はスマホも2列。
    - L ハンバーガーボタン=**画面右下に固定**（濃色#150C0Cの丸・約50px）。アイコンは **`30nen_sanmaru.png`**（現状 `sp_menu01.png` から差し替え・現在 `ph_data/` にある→実装時 `public/` へ）。開くと「閉」表示。
    - M メニュー中身（上から）=「三十年商店とは？」ボタン（→/about・現状「初めての方はこちら」から文言統一）／小商店（3列）／検索（枠のみ）／アーカイブ（枠のみ）／左端5リンク。
    - N 開き方=**全画面の白いオーバーレイ**（現状どおり）＋開いている間は背景スクロール固定（小改善）。実装は Client Component で開閉管理。現状の `.en` 自動ラップJSは不要（§5の font-kerning で代替）。
    - **▶ これでトップページのデザイン要件は PC・スマホとも全確定**。次は §14 に沿って実装に着手できる状態。
22. **フェーズ2：公開トップページを実装（ブラウザ動作確認済み）**（コミット `4f6dc7d`）。仕様書 §14 に沿って実装。型チェック(tsc)・Lint(eslint)クリーン。
    - **追加した仕組み（E項目）**: サイト設定。`site_settings` テーブル（key/value）をschema追加＋マイグレーション `drizzle/0003_slimy_firedrake.sql` 適用済み。`src/db/settings.ts`（getSetting/setSetting/getLeadText・初期値=確定リード文）。管理画面 `/admin/settings`（管理者専用・`settings-form.tsx`）＋アクション `src/app/actions/settings.ts`。/admin トップに「サイト設定」リンク追加。
    - **公開ページ本体**:
      - `src/app/(public)/layout.tsx` … 3カラム＋左端縦メニュー＋右端アイコン＋ハンバーガー。連載一覧・リードテキストをDBから取得して各パーツへ。`public-root` クラスで明朝＋font-kerning（§5）。
      - `src/app/(public)/page.tsx` … 最新エリア＋記事一覧（2列・12件）＋ページネーション。`export const dynamic='force-dynamic'`（常に最新DBを表示）。
      - 共通部品 `src/components/public/`: section-heading / article-card / latest-article / pagination / series-list / sidebar-right(SidebarContent) / sidebar-left / edge-nav / edge-icons / hamburger-menu(client) / nav-links / search-form。
      - `src/db/articles.ts` の PublicArticle に `categoryImagePath` 追加（最新カードの白窓に連載画像を出すため）。
      - `src/lib/datetime.ts` に `formatJstDatetime`（"6月3日 15時26分"）追加。
      - 記事アクション（create/update/delete）に `revalidatePath('/')` 追加。
      - アセットを `public/` へコピー: dammy.jpg / line-up.png / 30nen_sanmaru.png / Icon_insta.svg / Icon_x.svg / Icon_mail.svg / obi-pattern.png。
    - **動作確認**: デスクトップはデザイン画像にほぼ一致。スマホは縦1列＋右下ハンバーガー（全画面メニュー）。コンソールエラー無し。`npm run dev` → `http://localhost:3000`。窓幅1024px以上でPC版・未満でスマホ版に自動切替。
    - **⚠ 確認用のサンプルデータ**: ローカルDBに公開記事15件＋連載数件（もしもし五島列島/ご機嫌な毎日/島縞/のちの野良）を投入済み（表示確認用）。本番前に削除する。※DB実体(`data/*.db`)はGit管理外なのでコミットには含まれない。
    - **🔧 調整の状況（SAKIさんと対話しながら微調整中）**:
      1. ✅ **3カラムの幅**: 左右を等倍・中央広めに調整済み（`1fr 1.8fr 1fr`）。
      2. ✅ **オビ（見出し）**: 帯模様 `obi-pattern.png` を薄く敷いた「テクスチャ帯」に変更済み（`.obi-band`・現行 common_title01 を再現）。
      3. **代替画像(dammy)**: アイキャッチ未設定時は現行の `dammy.jpg`（暖簾ロゴ画像）。別画像にするか要検討（未対応）。
      4. **最新エリア**: PC・スマホ共通で「最新を大きく出し、一覧から1件省く」に統一（現行WPはスマホで一覧にも最新を含めていた）。
      5. リードテキスト初期値は改行なし1段落（デザイン画像は改行入り）。`/admin/settings` で編集可。
      6. dev環境ではハンバーガー内「小商店」サムネイル(line-up.png)の画像最適化が遅く一瞬空白に見えることがある（本番ビルドで解消・実装上の問題ではない）。
    - **確認用サンプル画像**: 表示イメージ確認のため、`reference/sample-posts` の写真17枚を `public/uploads/sample/` にコピーし、サンプル15記事のアイキャッチに割り当て済み（ローカルのみ・`public/uploads`はGit管理外＝コミットに含まれない）。本番前に整理する。
    - **デザイン微調整コミット**: カラム幅＋オビをパターン化 → コミット `450de2a`。
    - **▶ 次回の続き**: SAKIさんが見て気になった点を順次調整（上記3〜5や、余白・文字サイズなど）。`npm run dev`→`localhost:3000`、PCは窓幅1024px以上。
23. **フェーズ2：トップページ左カラムのデザイン微調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `bc6ffef`）。型チェック(tsc)・Lint(eslint)クリーン。変更は左カラム部品 `src/components/public/sidebar-left.tsx` が中心。
    - **リンク色**: `instagram｜x` のリンクを青 `#2563eb` に（区切りの「｜」はグレーのまま）。
    - **リードテキスト**: 初期値（`src/db/settings.ts` の `DEFAULT_LEAD_TEXT`）を**1フレーズずつ改行**入りに変更（現行サイトの見た目に合わせる・`whitespace-pre-line` で改行反映）。表示は**少し太く**（`font-weight:500`／`layout.tsx` のフォント読み込みに 500 を追加）・**行間を詰め**（`leading-7`→`leading-6`）・**ひらがなの連なりだけ字間を詰める**（`renderLeadText()` でひらがなを `<span class="hira-tight">` で包む。`hira-tight` は `globals.css`・`letter-spacing:-0.09em`・数値で調整可）。
    - **「三十年商店とは？」帯**: **PC（3コラム＝`lg`以上）でのみ表示**（`hidden lg:flex`。スマホはハンバーガー内の同ボタンで代替）。帯を**約80%に**小さく（`w-44`→`w-36`・`py-2`→`py-1.5`／文字サイズ `text-sm` は据え置き）。
    - **最新エリア前の「三十年商店」テキストを削除**（`src/app/(public)/page.tsx`）。中央コラムは「最新」から始まる。
    - **スマホ版に「書き手さん、募集中！」リンクを追加**（SNSリンクの下・`lg:hidden`＝スマホのみ）。スミケイ（黒い罫線）で囲んだリンク。リンク先 `https://30nen.com/about/#wanted`。「！」だけ `<span>` で包んで **20度・時計回りに傾け**（Tailwind v4 は回転=`rotate`・縮小=`scale` の独立プロパティ）。仕上げに 文字小さく(`text-xs`)・**カコミ全体80%縮小**(`scale-[0.8]`)・**枠線を細く**(`border-[0.5px]`)・読点「、」の後ろのアキを詰め(`tracking-[-0.4em]`)・左右の内側余白を調整(`pl-1.5 pr-1`)。
      - メモ（将来）: リンク先は現状の現行サイト(30nen.com)を指す。新サイトが本番化したら `/about/#wanted`（相対）に直すと自然。
24. **フェーズ2：トップページの見出しオビ・左カラムの行間を微調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `f3c95f7`）。
    - **見出しオビ**（最新・記事一覧・小商店・検索・アーカイブで共通の `src/components/public/section-heading.tsx`）: 帯の高さを約70%に（`py-1.5`→`py-[2px]`＋`leading-tight`）・字間を詰める（`tracking-[0.4em]`→`tracking-normal`）・左右の余白を小さく（`px-3`→`px-1`）・文字を少し小さく（`text-[1.05rem]`→`text-[0.95rem]`）。帯模様を細かく（`globals.css` の `.obi-band` 背景 `background-size: 4px`→`2px`・現行 common_title01 と同じ細かさ）。
    - **左カラム**（`src/components/public/sidebar-left.tsx`）: リード文と `instagram｜x` の行間を詰めた（`mt-5`→`mt-3`）。
    - メモ: リードテキストの文字サイズは `text-sm`（＝0.875rem／14px相当）。変えるならここ。
25. **フェーズ2：トップページのスマホ表示と一覧カードを調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `92aefcf`）。
    - **スマホ（lg未満）で「最新」エリアを非表示**（`src/app/(public)/page.tsx`）: 「最新」帯＋大画像はPC専用（`hidden lg:block`）にし、スマホはいきなり「記事一覧」が最新から並ぶ。仕組み: 一覧は1ページ目も先頭(最新)を含めて12件取得し、PCでは先頭カード（大画像と重複）だけ `lg:hidden` で隠す。これで**PC・スマホとも1ページ12件**・ページ送りが一致（`totalPages=ceil(total/12)`）。※要件メモ §14-I の「スマホも2列」から方針変更した点に注意。
    - **スマホの記事一覧を1列に**（PCは2列）: グリッドを `grid-cols-1 lg:grid-cols-2` に。
    - **一覧カード画像の高さを低く**（`src/components/public/article-card.tsx`）: `aspect-[4/3]`→`aspect-[16/9]`（スマホ）。PCはさらに短く `lg:aspect-[2/1]`。
    - **PC2列カードの横間隔を狭く**: `gap-x-5`→`gap-x-1`（4px）。`gap-y-8` は据え置き。
26. **フェーズ2：トップページの仕上げ微調整 ＋ 足跡（パンくず）追加（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。
    - **一覧カードの日時色をタイトルと統一**（`src/components/public/article-card.tsx`・`latest-article.tsx`）: 日時を `#808080`（グレー）→ `#333`（タイトルと同色）に。最新エリアの日時も同様に統一。日時とタイトルの行間も詰めた（`mt-1`→`mt-0.5`）。
    - **`【` の左端そろえ**（`article-card.tsx`）: カテゴリー名の全角開きカッコ `【` は字形が右寄りで左にアキがあるため、カテゴリー有りの行だけ `text-indent:-0.68em` で左へ寄せ、カバー写真の左端と縦ラインを一致（測定で誤差0.04px）。
    - **一覧カード画像を「最新」と同じ比率に**（`article-card.tsx`）: `aspect-[16/9]`/`lg:aspect-[2/1]` → `aspect-[4/2.5]`（最新＝`latest-article.tsx`と同比率で高く）。
    - **左右カードのタイトルの近づき過ぎを解消**: 写真同士はつなげたまま（`gap-x-1`を維持）、タイトル文字だけ右にアキ（`h3` に `pr-5`）。1行16文字・2行で最大32文字（`line-clamp-2`）。※タイトルの手動改行は「自動の折り返しのまま」で確定（実装しない）。
    - **左端メニューの文字調整**（`src/components/public/edge-nav.tsx`）: 間延びの元だった `tracking-[0.15em]` を外し、ひらがなだけリード文と同じ詰め（`hira-tight`／-0.09em）に。サイズは `text-sm`（リード文と同じ14px）。ひらがな詰めの関数はリード文と共通化（新規 `src/components/public/hira-tight.tsx` に `renderHiraTight` を切り出し、`sidebar-left.tsx` も差し替え）。
    - **左右の端に縦罫（ケイ）を追加**（検索枠と同じ 1px・`#150c0c`/50）: 左メニューは内側（右どなり）に `border-r`、右SNSアイコンは内側（左どなり）に `border-l`。どちらも画面**上端(top:0)から下まで**伸ばす（`edge-nav.tsx`・`edge-icons.tsx` を `top-0 bottom-6 flex-col justify-end` に＝文字/アイコンは下寄せのまま罫だけ全高）。
    - **足跡（パンくずリスト）を新設**（新規 `src/components/public/breadcrumb.tsx`）: 訪問者の現在地表示。トップは「三十年商店」のみ・中央ぞろえ・**ゴシック体**・12px・グレー。明朝の中で部分的にゴシックにする `.gothic` クラスを `globals.css` に追加（日本語はOS標準ゴシックにフォールバック）。今後の記事/連載ページで「三十年商店 ＞ 連載 ＞ 記事」のように使い回せる。
    - **天端そろえ＆間隔調整**（`src/app/(public)/layout.tsx`・`page.tsx`）: 右コラム（小商店オビ側）に `lg:pt-2` を追加し、左のロゴ（のれん）と上ラインを一致（差0px）。最新エリアと記事一覧の間隔を `mb-12`→`mb-6` に詰めた。
    - **追い微調整**（コミット `（このコミット）`）: 右SNSアイコンを80%(22→18px)に縮小＆グループごと5px上へ（`edge-icons.tsx`）。一覧カードのタイトルを少し大きく＆太く（`text-sm`→`text-[0.95rem]`＋`font-medium`／`article-card.tsx`）。左右の縦罫を**ウィンドウ最下部(bottom:0)まで**延長（文字/アイコンは今の高さのまま＝`pb` で位置を維持／`edge-nav.tsx`・`edge-icons.tsx`）。
    - **▶ 次回**: トップページの残り微調整 or 各ページ（記事詳細・連載別一覧・著者・about等）の実装へ。足跡部品は流用可。
27. **フェーズ2：右コラム（小商店・ワード検索・アーカイブ）の調整＋アーカイブ目次を新設（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。
    - **小商店（連載画像）にトンボ装飾**（`src/components/public/series-list.tsx`）: 画像を `p-2.5` の余白で小さくし、四隅にL字（`border-[1.5px]`・`#c0c0c0`）を絶対配置。セル間 `gap-0` で角を共有し、各Lを外向きに0.75pxずらして隣のLと1本に重ね「＋」のトンボに（ダブり防止）。
    - **ハンバーガーの三丸アイコンを150%に**（`src/components/public/hamburger-menu.tsx`）: `30nen_sanmaru.png` を 30→45px（ボタンは50px角のまま）。
    - **「検索」→「ワード検索」に改名**（`src/components/public/sidebar-right.tsx`）。送信ボタンは「検索」のまま。
    - **アーカイブ目次を新設（年月＋件数・表示のみ）**: DBに `listArchiveMonths()` を追加（`src/db/articles.ts`・公開記事をJST(+9h)の年月で集計・新しい月が上・`ArchiveMonth` 型）。部品 `src/components/public/archive-list.tsx`。`layout.tsx` で取得し `SidebarContent`/`HamburgerMenu` に `archive` を渡す（PC右コラム＆スマホ両方に表示）。**クリックで月別ページに飛ぶ機能は未実装**（月別ページ作成時に繋ぐ）。
    - **アーカイブの見た目調整**: 横線（border-b）を除去・行間を詰め（`space-y-0.5`）・文字を小さく（`text-[0.8rem]`／件数 `text-[0.7rem]`）・件数のカッコを月の直後に（`justify-between` をやめてインライン）。
    - **帯見出しの文字を全体的に小さく**（`src/components/public/section-heading.tsx`）: `text-[0.95rem]`→`text-[0.85rem]`（最新・記事一覧・小商店・ワード検索・アーカイブ共通）。さらに `gapClass` プロパティを追加し、ワード検索・アーカイブだけ帯下のアキを `mb-5`→`mb-2` に詰めた。
    - **画像のホバーをズーム→フェードに変更**（`article-card.tsx`・`latest-article.tsx`・`series-list.tsx`）: `group-hover:scale-*` をやめ `transition-opacity ... group-hover:opacity-80` に統一（マウスオーバーで少し薄くなる）。
    - **⚠ ローカル確認用サンプル**: アーカイブ目次の長さ確認のため、2024年6月〜2026年4月の各月に公開記事を計132件投入済み（タイトル先頭「サンプル」・著者ID2・連載6〜9）。DB実体はGit管理外＝コミットに含まれない。本番前に既存サンプルと一緒に削除する。
    - **のれんロゴを上端ぴったりに**（`src/components/public/sidebar-left.tsx`・コミット `（このコミット）`）: ロゴ画像の上の余白を打ち消し、ウィンドウ上端に密着（`-mt-10 lg:-mt-12`）。横位置は中央のまま（左端には寄せない）。PC・スマホ両方に適用。
    - **「三十年商店とは？」ボタンを薄く＋文字小さく**（`sidebar-left.tsx`＝PC・`hamburger-menu.tsx`＝スマホ両方／コミット `（このコミット）`）: 帯の上下アキ `py-1.5(PC)`・`py-2(スマホ)` → `py-0.5`＋`leading-tight`、文字 `text-sm`→`text-xs`。記事一覧カードのタイトルも少し小さく（`text-[0.95rem]`→`text-[0.9rem]`／`article-card.tsx`）。
    - **▶ 次回**: 月別アーカイブページ（クリック先）、または記事詳細・連載別一覧・著者・about等の実装へ。
28. **フェーズ2：記事詳細ページ＋書き手プロフィール＋お便りフォームを新設（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。
    - **記事詳細ページ**（新規 `src/app/(public)/posts/[slug]/page.tsx`）: 一覧/最新カードのリンク先。`[slug]` は slug または id（数字）両対応（`findArticle` が slug→id の順で解決）。構成＝足跡（三十年商店＞連載＞タイトル）→連載名＋日付→タイトル→アイキャッチ→本文→書き手。`generateMetadata`・`force-dynamic`。本文HTMLは `.article-body`（globals.css に追加・line-height 2 等）で表示。
    - **アイキャッチはトリミングしない**: 16:9固定をやめ、原寸比率のまま全幅表示（`<Image width={0} height={0} style={{width:'100%',height:'auto'}}>`）。正方形・縦長もそのまま。
    - **書き手プロフィール欄**（新規 `src/components/public/writer-profile.tsx`）: 帯「書き手」＋丸トリミング顔写真＋名前／居住地・年齢／SNSアイコン（Instagram・X・YouTube・Webサイト）。無い項目は省略。記事末尾に表示。
    - **投稿者データに項目追加**（`src/db/schema.ts`＋マイグレーション `0004`・`0005`）: `location`/`age`/`instagramUrl`/`xUrl`/`youtubeUrl`/`websiteUrl`。`src/db/users.ts` の入力型・create/update に反映。アイコン `public/Icon_youtube.svg`・`Icon_website.svg` を追加。
    - **管理画面の投稿者編集を拡張**（`src/app/admin/users/user-form.tsx`・`actions/users.ts`・`[id]/edit/page.tsx`）: 「書き手プロフィール（記事ページに表示）」枠＝顔写真アップロード（`featured-image.tsx` に `label` プロパティを足して流用）＋居住地・年齢・SNS4種。**自己紹介欄は削除**。
    - **お便りフォーム**（新規 `src/components/public/contact-form.tsx`＋`contact-form-slot.tsx`）: 左コラムに帯「お便りフォーム」＋お名前/Eメール/宛先(店主)/メッセージ/同意チェック/送信ボタン。**トップページ(/)では非表示・それ以外で表示**（`ContactFormSlot` が `usePathname` で出し分け）。**送信機能は未実装（枠だけ・送信ボタンは type="button"）**＝後フェーズでバックエンド接続。
    - **⚠ ローカル確認用テストデータ**: 書き手「saico34」（id6・神奈川県藤沢市/49歳/SNS仮）を作成し記事9に割り当て・記事9の本文を実サンプルに差し替え（顔写真は `public/uploads/sample/...`）。すべてローカルDBのみ＝コミットに含まれない。本番前に整理。
    - **▶ 次回**: お便りフォームの送信機能（メール送信）、連載別一覧・著者ページ・about、月別アーカイブページなど。
29. **フェーズ2：お便りフォームの送信機能が完成（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。これまで「枠だけ」だったお便りフォームを、実際にメール送信できる形にした。
    - **送信方法＝Xサーバーのメール機能（nodemailer + SMTP）**: 月額ゼロ・SaaS不使用の方針どおり。本物のメールアカウント（例 `info@30nen.com`）は本番化のときに用意する。**ローカル開発（SMTP未設定）では、実際には送らず内容をサーバーのコンソールに出すだけ**にして、メアド無しでも画面の流れを確認できるようにした。
    - **宛先プルダウン＝「店主」＋連載名（カテゴリー）**（SAKIさんの希望）: 読者が知っている連載名（小商店と同じ親連載の一覧）を自動で並べ、**選んだ連載の担当書き手に届く**。担当がまだ居ない連載は、お便りが迷子にならないよう**店主にフォールバック**（件名・本文に「○○（担当未登録のため店主へ）」と明記）。「店主」宛は運営の受信箱（環境変数 `CONTACT_TO_EMAIL`）へ。**書き手のメールアドレスはブラウザに渡さず**、サーバー側で連載id→担当書き手のメールに安全に解決する（個人情報を漏らさない）。
    - **書き手宛のお便りは店主にも控え(BCC)を送る**（SAKIさんの希望）: 書き手に届くと同時に、店主にも同じお便りがBCC（書き手側には見えない控え）で届く。店主が全お便りを把握できる。`src/lib/mailer.ts` の `MailInput.bcc` で対応。店主が直接の宛先になるとき（店主宛・担当未登録フォールバック）は控え不要なのでBCCなし。
    - 作成/変更ファイル:
      - `src/lib/mailer.ts`（新規）… メール送信の共通部品。SMTP設定は環境変数から読む。未設定ならコンソール出力で代用。
      - `src/app/actions/contact.ts`（新規）… 送信処理(Server Action `sendContact`)。入力チェック（お名前・メール形式・メッセージ・同意チェック）＋いたずら対策（ハニーポット `website` 罠フィールド）＋宛先解決（連載→担当書き手 or 店主）＋メール送信。返信先(Reply-To)は送信者のメール。
      - `src/db/categories.ts` … `getCategoryAuthorEmails(categoryId)`（宛先解決用に連載名＋担当書き手のメール一覧を返す。メアドはサーバー側のみ）を追加。
      - `src/components/public/contact-form.tsx` … 見た目だけ → 送信機能つきに。宛先プルダウンに連載名を表示。`useActionState` で「送信中…」「完了」「エラー」表示。**入力欄は controlled（state管理）**にして、検証エラーで差し戻しても書いた文章が消えないようにした（Reactのフォーム自動リセット対策）。`ContactRecipient` 型（id・name）をここに定義。
      - `src/components/public/contact-form-slot.tsx`・`sidebar-left.tsx`・`src/app/(public)/layout.tsx` … 連載一覧（小商店と同じ）をフォームまで受け渡し。
      - `.env.example` … メール設定の見本（SMTP_HOST/PORT/SECURE/USER/PASS・MAIL_FROM・CONTACT_TO_EMAIL）を追記。`.gitignore` に `!.env.example` の例外を足してGit管理に入れた（秘密情報なしの見本のみ）。
    - 導入ライブラリ: `nodemailer`（+ `@types/nodemailer`）。純JSなのでXサーバーにそのまま載る。
    - **足跡（パンくず）のフォントを変更**: `.gothic`（足跡用）を **Noto Sans JP**（CDN読み込み・くっきり角張った角ゴシック）最優先に。以前はOS標準のヒラギノ角ゴで「丸く見える」とのことだったため、universalに角張って見える Noto Sans JP に統一。`src/app/layout.tsx` のGoogle Fonts CDNに `Noto+Sans+JP:wght@400;500` を追加・`src/app/globals.css` の `.gothic` を更新。
    - **ブラウザ確認済み**: ①担当のいる連載（もしもし五島列島）宛→担当書き手のメールへ解決 ②担当未登録の連載（ご機嫌な毎日）宛→店主へフォールバック ③同意なしで送信→エラー表示＋入力は保持 ④店主宛→運営の受信箱へ。足跡が Noto Sans JP で描画されることも確認。コンソールエラーなし。
    - **⚠ ローカル確認用テストデータ**: 担当名簿に「saico34（id6）→もしもし五島列島（連載id6）」を登録（宛先解決テスト用）。DB実体はGit管理外＝コミットに含まれない。本番前に整理。
    - **📌 本番化のときにSAKIさんがやること**:
      1. Xサーバーでメールアドレス（例 `info@30nen.com`）を1つ作り、その接続情報を本番の `.env` に書く（`.env.example` のコメント参照）。それまではローカルでも送信は擬似（ログ出力）で動く。
      2. **Xサーバーのメール自動転送を設定**：作ったアドレス（例 `info@30nen.com`）宛のメールを **`30nensyouten@gmail.com`** へ自動転送する（サーバーパネルの「メール自動転送」設定）。これで店主宛のお便りを普段のGmailで受け取れる。← SAKIさんが後で実施予定。
    - **▶ 次回**: 連載別一覧ページ・著者ページ・about・月別アーカイブページなど。
30. **フェーズ2：記事詳細ページの先頭に「カテゴリー帯」を新設（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。SAKIさんの添付イメージに沿って実装。
    - **見た目**: 足跡（パンくず）の下に**太めのテクスチャ帯**（`.obi-band`＋細い枠線）。中に〔**白い正方形窓＋カテゴリー画像**〕＋〔**連載名（大・明朝）／ヨミガナ（小・グレー）**〕。日付の上にあった `【連載名】` 表記は帯と重複するので削除（帯の下は日付→タイトルの順）。
    - **カテゴリーに「ヨミガナ」列を追加**（`src/db/schema.ts` の `categories.reading`＋マイグレーション `drizzle/0006_overconfident_dexter_bennett.sql`）。カタカナ・任意。
    - 作成/変更ファイル:
      - `src/components/public/category-banner.tsx`（新規）… カテゴリー帯の部品（name・reading・imagePath を受け取る。画像なしは `line-up.png` で代替）。
      - `src/app/(public)/posts/[slug]/page.tsx` … 足跡の下に `<CategoryBanner>` を配置。
      - `src/db/articles.ts` … `PublicArticle` に `categoryReading` を追加（JOIN列にも `categories.reading` を追加）。
      - `src/db/categories.ts` … create/update・入力型・`getCategoriesForUser` の select に `reading` を反映。
      - `src/app/admin/categories/category-form.tsx`・`actions/categories.ts`・`[id]/edit/page.tsx` … 連載の管理画面に「ヨミガナ」入力欄を追加（保存・復元を確認済み）。
    - **ブラウザ確認済み**: ①記事ページ（/posts/9・連載=もしもし五島列島）で帯が表示され、白窓に連載画像・連載名・ヨミガナが正しく出る ②連載管理画面でヨミガナの保存→復元が往復で動く。コンソールエラーなし。
    - **⚠ ローカル確認用テストデータ**: 連載「もしもし五島列島」(id6) に reading=「モシモシゴトウレットウ」・image_path=サンプル画像を設定。DB実体はGit管理外。本番前に整理。
    - **▶ 次回**: 連載別一覧ページ（帯やカードのリンク先）・著者ページ・about・月別アーカイブページなど。
31. **記事データ移行のスケジュール案を作成（サイト構築と並行で着手）**（コミット `（このコミット）`）。新フォルダ `migration/` に集約。
    - **`migration/README.md`** … フォルダの案内（schedule / writer-onboarding / data-migration-plan の3本立て予定）。
    - **`migration/schedule.md`（メイン成果物・v1）** … 移行スケジュール案。SAKIさんと対話して以下を確定:
      - **切替目標＝7月下旬**（可能であれば）。ただし**8月末なら余裕**・7月下旬は**ぎりぎり**と見立て。お盆（8/13〜16）は書き手の反応が鈍るので切替・重要アナウンスは避ける。**6/29ごろに「行ける/延ばす」のgo-no-go判断ポイント**を提案。
      - **乗り換え方＝並行期間を設ける**。★肝の整理: **並行期間中の本番投稿は今までどおりWordPressに集約／新システムは"練習・お試し"／切替日にWPの全記事を一括移行／切替後は全員 新システムへ**。これで「WP投稿を止めない」と「手順を複雑にしない」を両立（移行元が常にWP1か所）。
      - **WP投稿はフリーズしない（差分移行）**: 移行スクリプトは**冪等**（`wp_id`で移行済みを判定しスキップ）に作り、「一括→差分（増えた分だけ同じスクリプト再実行）」の2回で対応。
      - **移行範囲の確定**: 読者コメント=**移行しない**（お便りフォームで代替）／下書き=**移行しない**（公開記事 約7,790件のみ）／記事URL(slug)=**現行と同じに保つ**（SEO・既存リンク維持）。
      - **著者の対応表**: WP著者番号↔新20名アカウントのつきあわせが必要（移行記事を正しい書き手にひもづけるため）。**SAKIさんが手動でひもづける**方針。必要時はClaude CodeがWPから著者一覧（番号・表示名・メール）を読み取りのみで取得しtたたき台を渡す。
      - **書き手の乗り換えスキーム**: アナウンス2回（①予告=並行期間開始時／②リマインド=切替1週前）・**マニュアルはスペイン語＋日本語**（非日本語話者対応）・操作動画は検討・**質問窓口**を設置（時差考慮で書き込み式）・アカウント20名は管理画面から作成（担当連載ひもづけで「未分類」防止）。
    - 全体は **A サイト仕上げ / B 記事移行 / C 書き手乗り換え** の3トラック同時並行。週ごとの目安表は schedule.md §3。
    - **▶ 次回（移行関連）**: ①`migration/writer-onboarding.md`（アナウンス文面 日西2言語・マニュアル骨子）②`migration/data-migration-plan.md`（移行スクリプト手順）③著者対応表のたたき台。並行してサイトの残りページ実装。
32. **フェーズ2：記事詳細ページに「前後の日記ナビ」＋「関連記事」を新設（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン・コンソールエラーなし。SAKIさんの要望に沿って、投稿本文の下に2つの導線を追加。
    - **① 同カテゴリーの前後の日記へ移動**（新規 `src/components/public/adjacent-nav.tsx`）: 書き手プロフィールの下に配置。同じ連載(categoryId)の公開記事の中で、公開日時の並びの前後を取得。公開日時が同じ記事があってもズレないよう id を第2基準にした。前(or次)が無い記事はその側を非表示（最新記事は「次」が出ない）。**見た目はSAKIさんの指定**＝記事タイトルは出さず、**左に「つぎの日記」（1つ新しい）／右に「まえの日記」（1つ古い）**。各文字の外側に「く」字矢印画像（左は`<`そのまま・右は反転で`>`）。①②③の各ナビとも**上の区切り罫線(border-t)は削除**（SAKIさんの「不用意にラインを入れない」方針）。
    - **② 関連記事（同カテゴリーの過去記事をランダム3点）**（新規 `src/components/public/related-articles.tsx`）: 帯見出し「関連記事」＋**縦に3つ積む**レイアウト（1件＝〔左：カバー画像(幅40%)／右：タイトル＋本文の冒頭3行〕の横並び。SAKIさんの指定で当初の3列グリッドから変更）。**毎回入れ替わり方式**＝ページを開くたびに別の3件（`random()`・SAKIさん了承済み）。本文の冒頭は excerpt があればそれ、無ければ本文HTMLから自動生成（横並びなので長め90字）。
    - **データ取得を追加**（`src/db/articles.ts`）: `getAdjacentArticles({categoryId,publishedAt,articleId})`（前後1件ずつ）・`getRandomCategoryArticles(categoryId,excludeId,limit=3)`（同カテゴリーから自分以外をランダム）。どちらも公開済み＋公開日時が今以前のみ。
    - **本文の抜粋づくり**（`src/lib/sanitize.ts`）: `textExcerpt(html, maxLength=60)` を追加。HTMLタグを全部落として文字だけにし、長すぎたら末尾に「…」。関連記事カードの本文プレビュー用。
    - **③ 三十年商店“全体”の前後の日記（カバー画像＋投稿日時つき）**（新規 `src/components/public/site-adjacent-nav.tsx`）: 関連記事の下に、連載をまたいで**全記事**の前後をたどるナビを追加（SAKIさんの追加要望）。各カードに〔カバー画像（サムネ80px）＋投稿日時（`formatJstDatetime`＝"7月15日 12時00分"）〕。**タイトルは入れない**（SAKIさんの指定。①のカテゴリー内ナビはタイトル付きのまま）。**矢印は「く」の字画像 `public/30nen_kunoji.png`**（`ph_data/` からコピー）を使用＝左(前)はそのまま`<`、右(次)は左右反転(`-scale-x-100`)で`>`。①のカテゴリー内ナビは文字矢印（← →）のまま。`getAdjacentArticles` に `categoryId` を**任意**化し、省くと全体・渡すと連載内になるよう一般化（①のカテゴリー内ナビと同じ関数を使い回し）。レスポンシブ: **640px(sm)以上で左右2分割／未満は縦積み**（375pxスマホでは日時が折り返さず全文表示。`whitespace-nowrap`）。
    - **記事詳細ページに組み込み**（`src/app/(public)/posts/[slug]/page.tsx`）: 書き手プロフィールの下に `<AdjacentNav>`（カテゴリー内）→`<RelatedArticles>`→`<SiteAdjacentNav>`（全体）の順で配置。①②は連載が紐付く記事のみ・③は全公開記事が対象。
    - **ブラウザ確認済み**: ①最新記事(/posts/9)＝「次の日記」非表示・「前の日記」のみ ②中間のサンプル記事(/posts/39)＝カテゴリー内ナビ・全体ナビとも前後両方が表示され、両者は別の記事を指す（連載内 vs 全体）③関連記事3件がカバー＋タイトル＋本文冒頭で表示（excerpt無しの記事は本文から自動抜粋）④全体ナビは1280px=左右2分割・375px/537px=縦積みで日時・タイトルとも全文表示。コンソールエラーなし。
    - **⚠ ローカル確認用サンプル**: 関連記事のカバー画像の見栄え確認のため、アイキャッチ未設定の公開サンプル記事 計132件に `public/uploads/sample/` の写真17種を順番に割り当て（ローカルDBのみ・Git管理外）。本番前に他のサンプルと一緒に整理する。
    - **▶ 次回**: 連載別一覧ページ・著者ページ・about・月別アーカイブページなど（前後ナビ・関連記事の部品は連載ページでも流用可）。
33. **フェーズ2：記事詳細ページ「前後ナビ・関連記事」の見た目を仕上げ調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `1d84542`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。項目32で新設した3つの導線を、SAKIさんと一緒に細部まで整えた。
    - **① カテゴリー内の前後ナビ**（`src/components/public/adjacent-nav.tsx`）: 文字だけ（左「つぎの日記」／右「まえの日記」）＋「く」字矢印・上の区切り罫線なし・文字サイズを「書き手」見出しと同じ `0.85rem` に統一。
    - **② 関連記事**（`src/components/public/related-articles.tsx`）: カード間のアキを詰め（`space-y-8`→`space-y-4`／32→16px）・カバー画像を75%に縮小（`w-2/5`→`w-[30%]`）。
    - **③ 三十年商店“全体”の前後ナビ**（`src/components/public/site-adjacent-nav.tsx`）: 〔矢印＋写真〕の下に投稿日時を**1行**で表示（例「7月15日 12時00分」）・「前の日記／次の日記」の文字ラベルは**削除**・左右の写真の**上端を揃える**（`sm:items-start`）・日時の字間 `tracking-[0.05em]`・カバー画像を150%に拡大（`w-20`→`w-[120px]`・`sizes`も120px）・矢印と写真のあいだの余白を広げる（`gap-3`→`gap-5`）。
    - メモ: 途中で「日時を2行（日付／時刻）」にしたが、SAKIさんの指定で1行に戻した（`src/lib/datetime.ts` に一時追加した分割関数 `formatJstDatetimeParts` は削除済み＝差し引き変更なし）。
    - **▶ 次回**: 連載別一覧ページ・著者ページ・about・月別アーカイブページなど（前後ナビ・関連記事の部品は流用可）。
34. **フェーズ2：連載別一覧ページ `/series/[slug]` を新設（SAKIさんと対話しながら文字サイズ調整・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。連載名をクリックした先＝「その連載の記事だけ」を並べるページ。トップページ・記事詳細ページの部品を流用し統一感を確保。
    - **ページ本体**（新規 `src/app/(public)/series/[slug]/page.tsx`）: `[slug]` は slug または id（数字）両対応（`findCategory` が slug→id の順で解決。サンプル連載は slug 未設定なので今は id でアクセス＝例 `/series/6`）。構成＝足跡（三十年商店＞連載名）→カテゴリー帯（白窓＋連載画像＋連載名＋ヨミガナ）→その連載の記事一覧（新しい順・2列・12件/ページ）→ページ送り。記事0件なら「この連載の記事はまだありません。」。`generateMetadata`・`force-dynamic`。`countPublishedArticles(categoryId)`・`listPublishedArticles({categoryId})` は既存関数をそのまま利用。
    - **連載をURLから探す関数を追加**（`src/db/categories.ts` の `getCategoryBySlug`）。
    - **入口（リンク）を配線**: ①記事詳細ページの「足跡の連載名」と「カテゴリー帯」をクリック→その連載ページへ（`src/app/(public)/posts/[slug]/page.tsx`。リンク先は `/series/{slug or id}`）。②右コラム「小商店」の連載画像（`series-list.tsx`）は以前から同じ先＝これでリンク切れ解消。
    - **カテゴリー帯を任意リンク化**（`src/components/public/category-banner.tsx`）: `href` を渡すと帯ぜんぶがリンクになる（記事ページ→連載ページ）。連載ページ自身では `href` を渡さず ただの見出しとして使う。
    - **文字サイズ微調整（SAKIさんと対話）**: カテゴリー帯の連載名 `text-sm`(14px)→**`text-base`(16px)**（`category-banner.tsx`・記事ページと連載ページの帯が共通なので両方反映）。記事一覧カードのタイトル `text-[0.9rem]`(14.4px)→**`text-[0.8rem]`(12.8px)**（`article-card.tsx`・トップと連載ページの両方に反映）。※最新エリア（`latest-article.tsx`）のタイトルは `text-lg`(18px)のまま据え置き＝「最新は大きく・一覧は小さく」のメリハリ。
    - **⚠ ローカル確認用サンプル**: もしもし五島列島(id6)で表示確認（記事37件＝4ページ・ページ送りも確認）。DB実体はGit管理外。本番前に他のサンプルと一緒に整理。
    - **メモ（将来）**: 本番の連載に `slug`（URL用の名札・例 `gotou`）を付ければ `/series/gotou` のキレイなURLにできる（ページは両対応済み）。親子連載の「親ページに子連載の記事もまとめて出す」かは未対応（今は その連載に直接ひもづく記事のみ）。必要になれば検討。
    - **▶ 次回**: 著者ページ（※SAKIさんの判断で今回は見送り）・about・月別アーカイブページなど。
35. **フェーズ2：ワード検索が完成（SAKIさんと対話しながら見た目調整・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。右コラム／ハンバーガー内の「ワード検索」枠（これまで枠だけ）が、本当に検索できるようになった。
    - **検索結果ページ**（新規 `src/app/(public)/search/page.tsx`）: `/search?q=キーワード`。公開記事の**タイトル・本文・抜粋**から部分一致で検索。複数キーワード（空白区切り・全角空白OK）は「すべて含む」**AND検索**。結果はトップと同じ2列カード・12件/ページ・ページ送り付き（ページを送ってもキーワードを引き継ぐ）。構成＝足跡（三十年商店＞ワード検索）→「ワード検索」帯→件数→記事一覧。**キーワード未入力時は入力欄だけ**表示（案内文なし・結果表示中は入力欄を出さない）。0件時は「当てはまる記事は見つかりませんでした。」を表示。
    - **検索のDB関数**（`src/db/articles.ts`）: `searchPublishedArticles`／`countSearchedArticles` を追加。LIKE の特殊文字（% _）はエスケープ済み（「%」と検索しても全件ヒットしない・ブラウザで確認済み）。公開済み＋公開日時が今以前の記事のみ対象。
    - **検索フォームの見た目**（`src/components/public/search-form.tsx`・SAKIさんの指定）: 下線だけ→**お便りフォームと同じケイ（枠線）囲み**に。入力BOXと「検索」ボタンは**密着**（境目の線は1本）。プレースホルダー（「キーワードで探す」の薄文字）は削除。
    - **アキの統一**（`sidebar-right.tsx`）: 「ワード検索」帯下のアキを他の帯と同じ20pxに（旧8px。アーカイブ帯下の8pxは合意済みの例外として据え置き）。
    - **結果件数の文字**（「○○」の検索結果：n件）: 記事詳細ページのタイトルと同じ指定（18px・font-medium）。
    - **ページ送り部品の小修正**（`pagination.tsx`）: 土台URLに `?q=…` が付いていても `&` で正しくつなぐように。
    - **ブラウザタブのタイトル二重を修正**: 「記事名｜三十年商店 | 三十年商店」と店名が2回付いていた。原因＝サイト全体の自動付け足し（`src/app/layout.tsx` の template）と各ページの手書きが重複。template を全角「｜三十年商店」に統一し、記事・連載・検索ページの手書き店名を削除（`posts/[slug]/page.tsx`・`series/[slug]/page.tsx`・`search/page.tsx`）。
    - **デザインポリシーを明文化**（`docs/public-page-spec.md` §14-A）: 「**アキ（余白）は揃える**」＝同じ役割の要素の間隔はサイト全体で統一する。余白調整は必ず同種の要素と同じ値かを確認する。
    - **ブラウザ確認済み**: ①「サンプル」146件・13ページ表示 ②2ページ目へキーワード引き継ぎ ③「海辺　朝」（全角スペース2語）→AND検索で1件 ④該当なし表示 ⑤「%」検索→0件（エスケープ確認）⑥タブ表示が記事・連載・検索とも「○○｜三十年商店」。
    - **追い調整（SAKIさんと対話しながら・ブラウザ動作確認済み）**（コミット `（このコミット）`）:
      - **足跡（パンくず）のフォントを Zen角ゴシックNew に変更**（`globals.css` の `.gothic`・`layout.tsx` のCDN読み込み）: Noto Sans JP が「丸っこい」とのことで、候補4種（BIZ UDゴシック/Zen角ゴシックNew/M PLUS 1p/IBM Plex Sans JP)を画面で見比べてSAKIさんが選択。本文の Zen Old Mincho と同じZenファミリー。
      - **右コラムの検索ボックスを小さく**（`sidebar-right.tsx`・`search-form.tsx`）: 幅は帯の95%・左右センター揃え（左右のアキ6.6pxずつ均等）。高さは80%（34px→27.2px・`py-1.5`→`py-[2.6px]`。「検索」ボタンも同じ高さ）。
    - **▶ 次回**: about・月別アーカイブページ・左端メニューの固定ページ群（沿革・利用規約・プライバシーポリシー）など。
36. **フェーズ2：月別アーカイブページ `/archive/[ym]` を新設（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。右コラム／ハンバーガー内の「アーカイブ」目次（これまで表示のみ）が、クリックでその月のページに飛ぶようになった。これで右コラムの3点セット（小商店・ワード検索・アーカイブ）はすべて機能する。
    - **ページ本体**（新規 `src/app/(public)/archive/[ym]/page.tsx`）: URLは `/archive/2026-05` 形式（年-月）。構成＝足跡（三十年商店＞2026年5月）→「2026年5月」帯→その月の記事一覧（新しい順・2列・12件/ページ）→ページ送り。形式が変なURL（13月・文字など）は404。タブ表示は「2026年5月の日記｜三十年商店」。`force-dynamic`。
    - **DB関数**（`src/db/articles.ts`）: `listPublishedArticlesByMonth`／`countPublishedArticlesByMonth` を追加。月の区切りは**日本時間JST**（+9時間）で判定＝アーカイブ目次 `listArchiveMonths` と同じ基準なので、目次の件数とページの中身が必ず一致する。
    - **アーカイブ目次をリンク化**（`src/components/public/archive-list.tsx`）: 各行（例「2026年 6月（3）」）を `/archive/2026-06` への Link に。ホバーで薄くなる動きは他のリンクと統一。
    - **ブラウザ確認済み**: ①目次リンクのURL生成 ②2026年5月＝その月の記事だけ12件 ③目次の件数（7）とページの件数が一致 ④`/archive/2026-13`・`/archive/abc`→404 ⑤記事のない月（1999-01）→「この月の記事はありません。」。
    - **▶ 次回**: about・左端メニューの固定ページ群（沿革・利用規約・プライバシーポリシー）・著者ページ（見送り中）など。
37. **フェーズ2：「当店について」ページ `/about` を新設（SAKIさんと対話しながら微調整・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。現行 30nen.com/about/ の内容を忠実に再現した固定ページ。左端メニューの大物が1つ完成。
    - **ページ本体**（新規 `src/app/(public)/about/page.tsx`）: 構成＝足跡（三十年商店＞三十年商店について）→引き戸のイラスト（幅85%・中央寄せ）→「三十年商店について」帯（本文7段落→署名「令和六年七月吉日…」→**点線の区切り**→お便りのお願い→投げ銭の案内＋イラスト＋「投げ銭する」ボタン＝外部 30nen.stores.jp）→「書き手募集」帯（`id="wanted"`・本文→小見出し「書き手にお願いしたい事」＋箇条書き→宛先メール(mailto)→POP UP店舗募集のカコミ）。本文の文字組みは記事本文と同じ `.article-body` を流用しサイト全体で統一。静的ページ（DB不使用）。
    - **画像2枚を `public/` に追加**: `30nen_hikido.jpg`（引き戸。本番サイトから読み取りのみで取得）・`30nen_nagesen.jpg`（投げ銭。参照テーマからコピー）。SAKIさんが `ph_data/` に置いた同名ファイルと中身同一（md5照合済み）。
    - **リンクの配線**: 左端メニュー「当店について」(/about)・「書き手募集」(/about#wanted)・「三十年商店とは？」ボタン(PC左カラム＋ハンバーガー内)は既存定義のままページ完成で全て機能。`#wanted` アンカーは `scroll-mt-6` で帯が上端に張り付かないように。スマホ用「書き手さん、募集中！」リンク（`sidebar-left.tsx`）を現行サイト向け絶対URL→**`/about#wanted`（新サイト内・相対）に変更**（項目23のメモの対応）。
    - **SAKIさんと調整した点**: ①署名「しげやすさき」の後にアキ＋**点線の区切り**（1px dotted `#999`・上下40px）②投げ銭イラストを直前の文章に**グッと寄せる**（`-mt-6`・画像内の白地だけが残る状態）③POP UPカコミ（左右の縦ケイ囲み）は**中央揃え**（`.article-body` の両端揃えが勝つため、枠側に article-body・中の行に text-center を当てる構造で解決）。
    - **意図的に現行と変えた点**: 小見出し「書き手にお願いしたい事」の下線（現行は薄グレーの罫線）は「不用意にラインを入れない」方針に合わせて**入れていない**（SAKIさん確認済みのページ全体OKに含む）。
    - **📌 TODO（SAKIさん確認待ち）**: 「POP UP 店舗も募集しています!」のリンク先は**仮**（現行サイトのお知らせ記事 `30nen.com/oshirase/2025/07/23/12729`）。飛び先をどの記事にするか追って確認し、記事移行後に新サイトのURLへ差し替える（コード内にTODOコメントあり）。
    - **ブラウザ確認済み**: PC（3カラム・1280px）＋スマホ相当の縦1列の両方で表示OK・`/about#wanted` のアンカー着地OK・コンソールエラーなし。
    - **▶ 次回**: 左端メニューの残り固定ページ（沿革 `/history`・利用規約 `/howtouse`・プライバシーポリシー `/privacy`）・著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）など。
38. **フェーズ2：「サイトのご利用について」ページ `/howtouse` を新設＋文字サイズ2点を統一（SAKIさんと対話しながら実施・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。左端メニュー「利用規約」の行き先が完成。
    - **ページ本体**（新規 `src/app/(public)/howtouse/page.tsx`）: 構成＝足跡（三十年商店＞サイトのご利用について）→「サイトのご利用について」帯→前文→小見出し3つ（著作権について／免責事項／リンクについて）＋本文。現行 30nen.com/howtouse/ と**本文テキストを機械照合して完全一致**を確認済み。文字組みは記事本文と同じ `.article-body`。静的ページ（DB不使用）。小見出しの下線（現行は薄グレー罫線）は「不用意にラインを入れない」方針で入れていない（aboutと同じ扱い）。
    - **本文の文字サイズを14pxに統一**（`src/app/globals.css` の `.article-body`・15px→14px）: SAKIさんの指定で左コラムのリード文（14px）と同サイズに。記事本文・about・利用規約・関連記事の抜粋まで本文系がすべて14pxで統一された。
    - **足跡（パンくず）の文字サイズを10pxに**（`src/components/public/breadcrumb.tsx`・`text-xs`(12px)→`text-[10px]`）: 8px・9px・10pxを画面で見比べてSAKIさんが10pxに決定。全ページ共通。
    - **メモ**: 9px以下を試すとき、Chromeの「最小フォントサイズ」設定が効いていると画面上それより小さくならないことがある。
    - **▶ 次回**: 残りの固定ページ（沿革 `/history`・プライバシーポリシー `/privacy`）・著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）など。
39. **フェーズ2：「プライバシーポリシー」ページ `/privacy` を新設（SAKIさんと対話しながら文章も更新・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。左端メニューは残り「沿革」のみ。
    - **ページ本体**（新規 `src/app/(public)/privacy/page.tsx`）: 構成＝足跡（三十年商店＞プライバシーポリシー）→「プライバシーポリシー」帯→前文→個人情報保護方針→お便りフォームについて→著作権・肖像権について→お問い合わせ。文字組みは `.article-body`。静的ページ（DB不使用）。
    - **現行 30nen.com/privacy/ から変えた点（すべてSAKIさん確認済み）**:
      - 小見出しの誤字「個人情**保**護方針」→「個人情**報保**護方針」に修正。
      - まったく同じ文章が2回続いていた段落（重複）を1回に。
      - **「当サイトへのコメントについて」の節をまるごと「お便りフォームについて」に書き換え**（新サイトにコメント欄を作る予定がないため）。新しい文章＝コメント欄はない・フォームの名前/メールの取り扱い・お便りは店主と宛先の書き手が読む・**スパム対応でIPアドレスを記録する場合がある**（将来の対策の余地として明記。現在の実装ではIPは未記録・ハニーポットのみ）。
      - 末尾の「お問い合わせフォーム」リンク（現行は `/contact`・新サイトでは未作成）→「お便りフォームよりご連絡ください」の言い換えに（リンクなし）。
    - **▶ 次回**: 残りの固定ページは「沿革 `/history`」だけ。ほか＝著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）・aboutのPOP UPリンク先確認（項目37のTODO）など。
    - **追い調整（同日・SAKIさんOK済み）**（コミット `12ff932`）: ①PC（lg以上）の**のれんロゴを約80%に縮小**（`sidebar-left.tsx`・`max-w-[260px]`→`lg:max-w-[208px]`。上端ぴったりの引き上げ `-mt-12` はページ上部の余白ぶんなので変えない＝縮小後も上端ずれ0pxを計測確認）。スマホのロゴは大きいまま。②**左端の縦書きメニューの文字を12pxに**（`edge-nav.tsx`・`text-sm`(14px)→`text-xs`）。
40. **フェーズ2：「沿革」ページ `/history` を新設（SAKIさんと対話しながら調整・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。**▶ これで左端メニュー5項目（当店について・沿革・書き手募集・利用規約・プライバシーポリシー）がすべて完成**。
    - **ページ本体**（新規 `src/app/(public)/history/page.tsx`）: 構成＝足跡（三十年商店＞沿革）→「沿革」帯→年見出し（令和6年｜2024年〜令和8年｜2026年）→月ごとのできごと（説明文＋任意の写真・キャプション）。**できごとはページ内の `HISTORY` データ配列に1ブロック足すだけで追加できる**作り（静的ページ・DB不使用）。レイアウト＝写真ありは〔左60%テキスト・右40%写真〕、写真なしは全幅。スマホ（640px未満）は縦積み。項目の下は薄グレーの点線（**全項目に入れる**＝現行は各年の最後だけ線なしだが、SAKIさんの指定で最後にも入れた）。
    - **現行 30nen.com/history/ から足した内容（SAKIさん指定・新サイトにのみ掲載）**: 2025年10月「新宿区秘密基地にて商店会」（写真付き・「某」はトル）／令和8年｜2026年 6月「pop up! 初のメンバー加入」。※現行WP側には載っていない。
    - **写真6枚を `public/` に追加**: `30nen_history_01〜05.jpg`（参照テーマからコピー）＋ `30nen_history_06.jpg`（商店会の写真・SAKIさんが `ph_data/` に投入→コピー）。01のみキャプション「吉祥寺 いせや総本店にて決起会」付き。
    - **画像の角丸を全面廃止**（`globals.css`）: `.article-body :where(img)` と `.tiptap-editor :where(img)` の `border-radius: 4px` を削除（SAKIさんの指定・現行サイトに合わせカクッとした四角に）。**記事本文に挿入する画像・沿革の写真すべてに効く**。
    - **写真まわりの微調整**: 写真の余白（本文共通の `margin: 1.2em 0`）を沿革では `style={{margin:0}}` で打ち消し＝キャプションが写真のすぐ下（4px）に・写真の上端が行のテキスト上端と揃う。※クラス指定（`my-0` 等）は globals.css の共通スタイルに後勝ちで負けるため style 直指定にした（POP UPカコミの中央揃えと同じ現象）。
    - **メモ**: dev環境では画像最適化が遅く、表示直後に写真が一瞬空白に見えることがある（本番ビルドで解消・既知の挙動）。
    - **▶ 次回**: 著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）・aboutのPOP UPリンク先確認（項目37のTODO）・記事データ移行の準備（`migration/` 項目31参照）など。固定ページは全部そろったので、次の大物は移行関連。
41. **フェーズ2：メールアイコンの行き先を手当て＋スマホでお便りフォームを非表示（SAKIさんと相談して方針決定・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。**専用の `/contact` ページは作らない**と決定（お便りフォームが既にあるため）。代わりに2点を整えた。
    - **① メールアイコンの行き先を手当て**（これまで `/contact`＝存在せず404だった）: 専用ページは作らず、左コラムの「お便りフォーム」へ誘導する形に。フォームに目印 `id="otayori"` を付け（`src/components/public/contact-form.tsx`・飛んできたとき帯が上端に貼り付かないよう `scroll-mt-6`）、右端メールアイコン（`edge-icons.tsx`）を**現在地で出し分け**＝**トップ(/)はフォームが無いので `/about#otayori`／それ以外は同ページ内 `#otayori`**（フォームはトップ以外の全ページに出るため同ページ内で届く）。`edge-icons.tsx` を `'use client'` 化し `usePathname` で判定。`aria-label` も「お問い合わせ」→「お便りフォーム」に。リンク定義は `nav-links.ts` の `SOCIAL_LINKS.contactAnchor`(`#otayori`)・`contactFromTop`(`/about#otayori`)。
    - **② スマホ（lg未満）ではお便りフォームを非表示**（SAKIさんの希望）: これまでスマホは縦1列で「左コラム→日記→右コラム」の順に積まれ、左コラム末尾のお便りフォームが**日記より前に出てしまっていた**。`src/components/public/sidebar-left.tsx` でフォーム（`ContactFormSlot`）を `hidden lg:block` の囲みに入れ、**スマホは非表示・PCは従来どおり表示**に。
    - **ブラウザ確認済み**: ①通常ページ→メールアイコンは `#otayori`（同ページにフォーム在り）②トップ→`/about#otayori`③`/about#otayori` を開くと当店についてページのフォーム位置（上端から24px＝scroll-mt-6）へ着地④404解消⑤フォームの表示=375px非表示／537px非表示／1280px表示。
    - **メモ**: この対応でスマホ訪問者にはお便りフォームへの導線が無い（右端メールアイコンもPC専用）。当面はSAKIさんの「スマホでは出さなくてよい」方針に沿った状態。
    - **📌 TODO（SAKIさんと合意済み・後日やる）**: **スマホ向けに、お便りフォームをハンバーガーメニュー内のどこかに入れる**（小商店・アーカイブと同じ並びに置く想定）。`src/components/public/hamburger-menu.tsx` に `ContactForm`（`recipients` 必要）を差し込む。`recipients` は `layout.tsx`→`HamburgerMenu` まで受け渡しが要る（小商店 `series` と同じ経路）。位置・見た目はSAKIさんと相談して決める。
    - **▶ 次回**: 上記📌TODO（スマホのハンバーガー内にお便りフォーム）・著者ページ（見送り中）・aboutのPOP UPリンク先確認（項目37のTODO）・記事データ移行の準備（`migration/` 項目31参照）など。次の大物は移行関連。
42. **フェーズ2：スマホ最下部にSNS・メールアイコンの横一列を新設（SAKIさんと対話しながら実施・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。これまでスマホには右端のSNS・メールアイコン（Instagram/X/メール）が出ていなかった（`edge-icons.tsx` はPC専用）。**項目41のTODO「お便りフォームをハンバーガー内へ」とは別案を採用**＝SAKIさんの希望で、**ページの一番下（コピーライトの上）に3アイコンを横一列**で並べた。
    - **3アイコンの中身を共通部品に切り出し**（新規 `src/components/public/social-icons.tsx`）: Instagram/X/メールの3リンクそのものだけを返す `SocialIcons`（`size` プロパティでアイコン寸法を指定・メールの行き先は `usePathname` で出し分け＝項目41と同じ挙動）。これを**PCの右端縦並び**（`edge-icons.tsx`・size=18）と**スマホ最下部の横並び**（`layout.tsx`・size=22）の両方から呼ぶ形にし、同じものを2か所に書かないようにした。
    - **スマホ最下部の横一列を追加**（`src/app/(public)/layout.tsx` のフッター）: コピーライトの直前に `flex justify-center gap-8 ... lg:hidden` の囲みで `<SocialIcons size={22} />`。**`lg:hidden`＝PC幅では出さず・スマホだけ表示**（PCは従来どおり右端の縦並び）。アイコンは一旦24pxにしたあとSAKIさんの希望で**90%＝22px**に縮小。
    - **ブラウザ確認済み**: スマホ幅375px→記事一覧→ページ送りの下に3アイコンが横一列→コピーライト、の並び（右下ハンバーガーと重ならない）。PC幅1280px→最下部の横一列は非表示(`display:none`)・右端の縦並びは表示(`flex`)。コンソールエラーなし。
    - **▶ 次回**: 項目41の📌TODO（ハンバーガー内のお便りフォーム）は**この横一列のメールアイコンで導線が付いたため優先度は下がった**（必要ならフォーム本体をハンバーガー内に置く案は残す）。ほか著者ページ・aboutのPOP UPリンク先確認・記事データ移行の準備（`migration/` 項目31）など。
43. **移行：記事データ移行の準備スケジュールを作成＋外部レビュー反映（SAKIさんと対話しながら実施）**（コミット `（このコミット）`）。項目31の続き。記事データ移行を「準備〜本移行〜切替」まで通しで段取り化し、別AIエージェントの客観レビューを受けて穴をふさいだ。
    - **`migration/data-migration-plan.md`（新規・メイン成果物）** … 記事移行を軸に **①記事移行の準備（技術）／②書き手のアナウンス・お試し期間／③本移行・切替** を1枚に束ねた通しスケジュール。5つの仕込み（S1著者対応表・S2連載対応表・S3移行スクリプト・S4リハーサル移行＋点検・S5画像の運び方）。切替目標=**7月下旬（努力目標）／7-6のGo/No-Goで8月末へ延期可**。
    - **`migration/review-request.md`（新規）** … 別AIエージェントにスケジュールを客観評価してもらうための自己完結レビュー依頼書（プロジェクト概要・進捗・スケジュール全文・評価観点）。
    - **外部レビュー受領＝第2回**（`letter_box/inbox/2026-06-16_review-02.md`・移行リスク評価）。※当初 `letterbox/`（アンダースコアなし）に届いたため、正式な `letter_box/inbox/` へ移動して整理。
    - **レビューを `data-migration-plan.md` に反映**: §4「切替の合否条件（Go/No-Go・7/6判定）」新設／§5「SEO（301リダイレクト・sitemap等）・バックアップ・ロールバック」新設／S3スクリプト仕様強化（`wp_id` の unique index・dry-run・エラーログ・件数照合）／お試し期間の事故対策（練習用表示・締切時刻・最新10件目視照合）。
    - **返信＝第2回**（`letter_box/outbox/2026-06-16_reply-02.md`）… レビューを R-01〜R-12 に整理し、R-01（切替日の本決定）のみ一部採用（7/6判定まで保留）、残り11件採用。
    - **▶ 次回（移行関連）**: ①最優先＝Xサーバーへのテストデプロイ＋本番相当ビルド成功 ②`wp_id` の unique index 追加 ③著者対応表のひな形（現行WPから著者一覧を読み取り取得）④連載作成 ⑤移行スクリプト。`migration/writer-onboarding.md`（アナウンス文面 日西2言語・マニュアル骨子）も未作成のまま。
44. **移行S1：著者対応表のたたき台を作成（SAKIさんと対話しながら確定・現行WPは読み取りのみ）**（コミット `（このコミット）`）。項目43のS1。`migration/data-migration-plan.md` の手順どおり、現行WordPress（本番 `the30nen.xsrv.jp`）から **読み取りだけ** で著者一覧を取得し、SAKIさんが埋める対応表ひな形 `migration/author-map.csv` を作成。本番には一切書き込んでいない（`wp ... db query` 等のSELECT・`wp user list` のみ）。
    - **読み取り取得した事実**: 公開記事を実際に書いた **著者は全23名**／**公開記事は合計 7,999件**（計画書の「約7,790」は古い見積り＝実数はこちら）／**みなしご記事（著者番号が利用者表に無い記事）はゼロ**＝全記事の書き手が特定できる。取得項目＝WP著者番号・表示名・ログイン名・メール・公開記事数・現行の権限。記事の多い順に並べた。
    - **CSVの構成**: 左側＝Claudeが読み取った事実（記入済み）／右側＝SAKIさんが埋める空欄（新システムの担当者・新権限admin/author・担当連載・使用言語・対応メモ）。文字化け防止のためUTF-8 BOM付き（ExcelやNumbersでそのまま開ける）。
    - **このセッションで確定した判断（CSVに記入済み）**:
      - **ぐっさんの合流**: 表示名「ぐっさん」が2件あった。番号12(`gussan`)＝本物のぐっさん。番号1(`30year_1227`)＝旧STUDIO時代の移行で「ぐっさん」カテゴリーに紐付けたアカウント。→ **番号1の144件の記事は新ユーザー「ぐっさん」(番号12)へ統合**（移行スクリプトS3では旧著者番号 1 と 12 を同じ新ユーザーにまとめる「合流」ケースになる）。**番号1のアカウント本体は新システムに作らない**（ログイン用メール `hp_info@niyatto.net` が制作業者のもの＝SAKIさんが使えないため）。
      - **管理者(admin)は2つ**: 番号18「店主」(`30nensyouten@gmail.com`・お便りフォームの店主宛の受け先)＋番号2「SAKIさん本人」(`sakipomco`)。当初SAKIさんは番号2を投稿者のままにする意向だったが、管理者が1つだとログイン不能時に詰むため、予備の管理者としてSAKIさん本人もadminにした（管理者は投稿もできる＝記事作成/編集/削除は `requireUser()` でadmin/author問わず可。admin専用は連載/投稿者/サイト設定の管理画面のみ）。
      - **スペイン語話者**: 番号22 Vanessa・番号23 Luis（日西2言語マニュアルの対象）。
      - **継続確認**: 番号25 minowanaoko（8件）は今後も継続する書き手。
    - **新システムに作る著者アカウントは22名**（23名から番号1を除く）。
    - **残りSAKIさん記入待ち**: 各書き手の **担当連載・使用言語**（次のS2「連載対応表」と対で埋めるのが効率的）。
    - **▶ 次回（移行関連）**: ①最優先＝Xサーバーへのテストデプロイ＋本番相当ビルド成功 ②`wp_id` の unique index 追加 ③**S2 連載対応表のたたき台**（`reference/categories.json`＋現行WP読み取りで／著者の担当連載もここで確定）④移行スクリプトS3。`migration/writer-onboarding.md` も未作成のまま。
45. **移行S2：連載対応表のたたき台を作成＋著者一覧の担当連載を確定（SAKIさんと対話しながら確定・現行WPは読み取りのみ）**（コミット `（このコミット）`）。項目44の続き。現行WordPressから **読み取りだけ** で「連載（カテゴリー）×著者」を取得し、連載対応表ひな形 `migration/series-map.csv` を新規作成。あわせて `migration/author-map.csv` の **担当連載・使用言語** も確定（現行が「1人1連載」なので著者↔連載が一意に定まった）。本番には一切書き込んでいない（SELECT中心の `wp ... db query` のみ）。
    - **読み取りでわかった重要事実**: 公開記事は **22連載**に分かれ、**各連載の公開記事数の合計が 7,999件＝公開記事の総数とピッタリ一致**。これは **1記事が複数連載にまたがっていない／未分類もゼロ** を意味し、移行が素直にできる良い状態。さらに **現行は徹底して「1人＝1連載」**（ほぼ全連載が単独の書き手）で、著者一覧の担当連載が確定できた。
    - **このセッションで確定した判断（両CSVに反映済み）**:
      - **担当が2名の連載が2つ**（新システムの担当名簿 `category_authors` は複数担当に対応）: **CAL TATAU**（Luis＋Vanessa・ともにスペイン語話者）／**エフェメラ！**（ほしばあさみ＋迎亮太）。各書き手から見れば担当連載は1つずつなので「1人1連載」は維持。
      - **店主よりお知らせ**＝連載として作る。中身の1件は **ID12729「POP UP 店舗募集！」**＝aboutページの「POP UP 店舗も募集しています!」リンク先（項目37のTODO）。移行後に about のリンクをこの記事へ向ける（専用ページは作らずこの記事を募集ページとして使う方針）。
      - **度々の旅 ＞ 山陰編**＝親子の階層を保って作る。**今後 旅シリーズを増やす前提**（親=度々の旅／子に山陰編など各旅編を足していく）。親「度々の旅」は記事0の器。
      - **未分類**（記事0）＝作らない。
      - **Seize the day（クロウタドリ・149件）**＝担当は現在 **休止中**だが、記事・アカウントとも移行する（再開時にそのまま使える）。
      - **使用言語**＝Vanessa・Luis以外は日本語（SAKIさん確認済み）。
    - **記事単位の特例（移行スクリプトS3に必ず反映・`data-migration-plan.md` の「個別例外」表に記録）**: 著者番号1(30year_1227)の144件のうち、142件（悩みのタネに水をまく）は ぐっさん(番号12)へ統合するが、残り2件は例外＝**ID282「¥2,000 お雑煮材料費」（わたしのレシーヘン）は重複のため移行しない（除外）／ID24126「Hijos」（CAL TATAU）は Luis(番号23) の記事として移行**。
    - **移行する公開記事は 7,999 − 1（ID282除外）＝ 7,998件**。連載別の整合: わたしのレシーヘン=757件（=SAKIさん本人ぶんと一致）・CAL TATAU=377件（Luis239＋Vanessa138）・悩みのタネに水をまく=468件（ぐっさん326＋番号1の142）。
    - **作る連載は21**（22連載から「未分類」を除く）。
    - **▶ 次回（移行関連）**: ①最優先＝Xサーバーへのテストデプロイ＋本番相当ビルド成功 ②`wp_id` の unique index 追加 ③**S3 移行スクリプト**（S1著者対応表・S2連載対応表・記事単位の特例を使って実装。§2の仕様どおり冪等・dry-run・件数照合）④`writer-onboarding.md`（アナウンス文面 日西2言語・マニュアル骨子）も未作成。連載作成（新システムに21連載を `wp_term_id`/`reading`/階層つきで作成）はS3の前段で必要。
46. **デプロイ準備：ローカルで本番ビルド／起動を確認＋Xサーバー下見（読み取りのみ）＝置き場所に重要発見（SAKIさんと対話しながら実施）**（コミット `（このコミット）`）。「Xサーバーへのテストデプロイ」（各項目で最優先とされてきた大物）の入口として、まず手元での本番動作確認とサーバーの下見を行った。**置き場所の方針に関わる重要な発見があったため、本番化の手前で一旦SAKIさんの判断待ちにした**。
    - **① ローカルで本番ビルド成功**: `npm run build`（本番用に組み立てる作業）を実行 → **エラー・警告ゼロで成功**（TypeScript型チェックも通過・全14ルートを生成）。`○ Static`＝about/history/howtouse/privacy（中身不変の固定ページ）、`ƒ Dynamic`＝トップ`/`・posts・search等（DBから毎回最新を読む）に正しく分かれている。
    - **② ローカルで本番モード起動も成功**: `npm run start`（本番と同じ起動）→ `✓ Ready`。`curl` でトップ`/`＝**HTTP200**・`/about`＝**HTTP200**・`<title>三十年商店</title>` を確認。ビルドだけでなく**本番モードで実際に動くこと**まで確認できた。
    - **③ Xサーバー下見（すべて読み取りのみ・現行WPには一切触れていない）**: `ssh xserver-30nen` で接続（`sv14288.xserver.jp`）。ホーム`/home/the30nen`・ディスク空き8.5TB（潤沢）。**Node.jsは未導入**だが curl/wget/git/bash/tar がそろっており **nvm で自前導入可能**（管理者権限不要）。現行WordPressは`/home/the30nen/30nen.com`（`.htaccess`あり＝Apache系）＝温存対象。crontab あり・`ulimit -u`=2000。
    - **⚠ 重要発見（置き場所の方針を左右する）**: ネットの公式情報・実例を調べた結果、**Xサーバーの「共有サーバー（レンタルサーバー）」は Node.js の常駐アプリ（＝今回の新サイトのように24時間起動しっぱなしのプログラム）を正式にはサポートしていない**。理由＝管理者権限なし・ユーザーsystemd不可・共有環境のため常駐プロセスは止められる恐れ。裏ワザ（nvm＋PM2／forever＋cron見張り）で動かすことは可能だが**不安定で非推奨**。→ 毎日20名以上が使う本番には不向き。**堅牢な本番＝Xサーバー VPS（月約800〜1,000円・Node.jsを正式サポート・Next.js用イメージあり）が安心**との結論。
    - **方針との整合**: プロジェクトの「月額SaaS費用ゼロ（サーバー代のみ）」方針に **VPSは反しない**（SaaSではなくサーバー代そのもの）。ただし現在の共有サーバー代への**上乗せ（月約800円）**になるため、**置き場所の最終決定はSAKIさんが料金を検討してから**とした。
    - **置き場所の3案**: A=Xサーバー VPS（本番向き・おすすめ）／B=共有サーバーで裏ワザ運用してテスト（追加費用なし・落ちても困らないテスト用）／C=保留。
    - **他AIエージェント（Gemini）の提案を比較検討**（SAKIさんが別途相談・`~/Downloads/gemini-code-1781657320233.py` 内のMarkdown）: 案A=WordPressをヘッドレスCMSとして残し表示だけNext.js/静的化／案B=Vercel（ISR）へ移行。**評価＝どちらも今の私たちの状況に合わない**。①Geminiは「SSGで全ページ再生成→ビルド渋滞」を前提にしているが、**当サイトはSSR（`force-dynamic`でDBから都度生成）なのでビルド渋滞は構造的に起きない**（投稿＝DBにINSERTするだけ・即反映）。②案A＝脱WordPressという移行の目的と逆行・完成済みの投稿UIが無駄になる。③案B（Vercel）＝月額SaaS（コストゼロ方針に反する・月数千円〜）＋SQLite/ローカル画像保存を外部DB・外部ストレージに作り替える改修と追加課金が必要。**VPS（自前データ保持・定額）の方がフィット**との結論を維持。※VPSとVercelは別物＝VPSはサービスの種類で、Xサーバー社が「Xサーバー VPS」を提供。VercelはVPSではなく別会社の別サービス。
    - **Xサーバー VPSの料金を公式確認**（`vps.xserver.ne.jp/price.php`）: 一番安い**2GBプラン＝メモリ2GB/vCPU3コア/NVMe SSD 50GB**。月額の目安＝36ヶ月契約 約990円／12ヶ月 約1,170円／1ヶ月のみ 約1,500円（時期によりキャンペーン割引あり）。※前回「月800円」と言ったのは誤りで実際は**月990〜1,170円前後**。コストゼロ方針（月額SaaSゼロ・サーバー代のみ）には反しない（SaaSではなくサーバー代）。
    - **⚠ 重要発見＝現行サイトの画像が既に巨大で、急増中**（`du -sh` 読み取りで実測）: `wp-content/uploads` 合計 **71GB**。年別＝2024年 294MB／**2025年 47GB／2026年（半年で）24GB**＝**今のペースは年間約47GB増**。30年では単純計算 1.4TB超。**2GBプランの50GBではすぐ足りない**ことが判明（確認して正解）。WPが巨大な理由＝スマホ原寸写真（1枚5〜12MB）＋WordPressが1枚から5〜6サイズのコピーを自動生成し全保存しているため。
    - **▶ 当サイトの画像圧縮の強み**: 新システムのアップロードは**自動で長辺1600px縮小＋圧縮（約230KB/枚）**・コピーを溜めない（項目16）。**移行時に同じ方式で画像を"軽くしながら"運べば、71GBが数GB〜十数GBへ激減する見込み**（正確な数字は移行リハーサルS4で実測して確定）。新規投稿の増加も年数GB程度に収まる。
    - **【決定】移行する画像は「軽くして運ぶ」**（SAKIさんが選択・30年運用の前提）: 移行時に新規投稿と同じ縮小＋圧縮をかける。メリット＝容量激減・VPSは小〜中プランで何年も持つ・30年コストが安定。デメリット＝写真の原寸ダウンロード不可（Web表示では画質差はほぼ分からない）。→ **`migration/data-migration-plan.md` のS5「画像の運び方」にこの方針を反映する**（次回TODO）。
    - **30年視点での結論**: 「記事も画像もどんどん増え、30年つづける」前提では **VPSが最適**（①データを自分のファイルとして所有＝丸ごとバックアップ・他社への引っ越し自由・ベンダーロックインなし／②毎月定額で費用が読める／③容量は足りなくなったらプランを1段上げる段階拡張）。Vercel等の従量課金クラウドは30年スパンだと費用が読めず不利。**まず2GBプラン（50GB）で開始し、圧縮後の実容量と増加を見て必要時に上位プランへ**、というpay-as-you-growが基本線。
    - **メールの引っ越し方針を確認（共有プラン解約に向けて・読み取りのみ）**: SAKIさんが「年13,200円(月1,100円)の共有プランは解約できるのか」を質問。サーバーのメール設定を読み取り調査（本文は見ず設定のみ）。判明＝**メールアドレスは `info@30nen.com` の1つだけ**（`~/30nen.com/mail/30nen.com/info@30nen.com/`）・**転送設定済み**（`.alias` に `cc "!30nensyouten@gmail.com"`＝届いたメールを店主Gmailに自動転送・HANDOFFで「将来やる」としていた転送は実は設定済みだった）・受信箱`new`に約25,000通たまっているが**転送済みの放置コピー**（本物の受信箱はGmail側・Xサーバー解約で消える）。→ **メールの役目は「受け取って店主Gmailへ転送」だけ**。
    - **メール引っ越しの結論**: ①受け取り・転送＝**無料サービス**（Cloudflare Email Routing / ImprovMX 等）で `info@30nen.com`→Gmail を継続可・Xサーバー不要 ②お便りフォームの送信＝デプロイ時に**無料の方法**（店主Gmailを送信元＝1日500通までOK 等）で手当て ③ドメイン`30nen.com`はサーバー代と別契約でそのまま継続。**→ メールを理由に共有プランを残す必要はなく、移行完了後に解約可能。VPS代(年約11,880〜14,040円)は今の共有プラン代(年13,200円)とほぼ"入れ替わり"＝純増ではない**（メールの行き先だけ移行終盤に決める）。
    - **スパム対策＝当店についてページのメール直リンクをお便りフォーム誘導に変更（ブラウザ確認済み）**: SAKIさんが「受信箱にスパムが多いのはアドレス掲載が原因か」を質問→**その通り**（ボットが公開ページから`@`付きアドレスやmailtoを収集）。新サイトは元々フォーム中心でスパムを呼びにくい作りだが、`/about` の「書き手募集」に `mailto:30nensyouten@gmail.com` の直リンクが1か所残っていた（項目37）。→ **メールアドレスを表示せず、同ページ下部のお便りフォーム(`#otayori`・宛先「店主」)へ誘導する形に変更**（`src/app/(public)/about/page.tsx`）。確認＝ページHTMLからメールアドレス・mailtoが消えたこと、お便りフォームへのリンクが効くこと、コンソールエラーなしをブラウザで確認。これで公開ページからメール収集の入口を1つ排除。※「@→［アットマーク］」表示の難読化も話題に上ったが、効くのはmailtoも外して文字列化したときのみ・賢いボットには弱い→**フォーム誘導が最善**と判断。
    - **投げ銭イラストの文字かぶりを修正（ブラウザ確認済み）**: `/about` の投げ銭画像が直前の文章に重なっていた（項目37で近づけるため付けた `-mt-6`＝-24px が強すぎ・箱で10px重なり）。→ **`-mt-3`（-12px）にゆるめ**て重なり解消（2pxのアキ）・近さは維持。コードに理由コメントを追記（`src/app/(public)/about/page.tsx`）。
    - **▶ 次回（デプロイ関連）**: 置き場所＝**Xサーバー VPSが有力**（SAKIさん最終確認待ち）。決めたら着手＝VPS契約 → SSH設定 → nvm で Node 導入 → コード配置 → ビルド → PM2 等で常駐 → ドメイン/リバースプロキシ（本番切替はずっと後・現行30nen.comには触れず別URLで）。**メールの引っ越し**（info@30nen.com の転送を無料サービスへ・お便りフォーム送信の手当て）も移行終盤のTODO。あわせて移行関連（S3スクリプト・S5に画像圧縮方針を反映等・項目45の▶）も残課題。`migration/writer-onboarding.md` も未作成。
47. **🎉 Xサーバー VPS にテストデプロイ成功＝新サイトがインターネット上で動いた（SAKIさんと対話しながら実施）**（コミット `（このコミット）`）。項目46で「VPSが有力（最終確認待ち）」としていた置き場所を **A案＝Xサーバー VPS に決定**し、無料お試しで実機デプロイを通しで実行。**`http://162.43.22.151` で新サイトが外部から表示できる状態まで到達**（トップ/・/about・/login すべて HTTP200・`<title>三十年商店</title>`・応答0.12秒）。お試し期間の目的「VPSで本当に動くか」を達成。
    - **契約**: Xサーバー VPS **無料お試し（無料VPS・2GBプラン）**。UUID `74f10672-29f4-4656-a33a-92065246c3e8`・**IPアドレス `162.43.22.151`**・OS **Ubuntu 26.04 LTS**・スペック=2GBメモリ/仮想2コア/NVMe30GB（有料2GBは3コア/50GB）・**利用期限 2026-06-22**（お試しは自動課金なし。続けるなら期限内に本契約へ）。料金は項目46どおり（36ヶ月990円/12ヶ月1,170円/月）。
    - **SSH接続**: Mac側に専用鍵 `~/.ssh/30nen_vps`（ed25519・パスフレーズなし）を生成し、`ssh-copy-id` で公開鍵を登録。**接続は `ssh -i ~/.ssh/30nen_vps root@162.43.22.151`（鍵認証・パスワード不要）**。rootパスワードはSAKIさんが設定（Claudeは知らない）。
    - **詰まりポイント＝パケットフィルター**: 初期状態はパケットフィルターON＋許可ポートゼロ＝全閉。VPSパネルで **SSH(22)** と **Web(80/443)** の2ルールを「全て許可」で追加して開通（パネル操作はSAKIさん）。また**新規VPSは起動直後に `unattended-upgrades` がdpkgロックを握る**ため、`apt` 導入はロック解放を待ってから実行。
    - **サーバー構成（/var/www/30nen_next）**: ①**Node.js v24.17.0** を nvm ではなく**公式バイナリ（SHA256検証付き）を `/usr/local` に展開**して導入（curl|bash がポリシーでブロックされたため。サーバーは固定版でよくこの方が素直）。②`build-essential`/`ca-certificates` 導入。③コードは **rsync で転送**（`node_modules`・`.next`・`.git` を除外＝ネイティブ部品 better-sqlite3/sharp はサーバー側で `npm ci` し直し＝チップが違うため）。**DB(`data/30nen.db`)とサンプル画像も一緒に運んだ**ので画面に記事が出る。④`npm run build` 成功。⑤**PM2** でプロセス名 `30nen` として常駐（`pm2 startup systemd`＋`pm2 save` で再起動後も自動起動）。⑥**Nginx** を受付（リバースプロキシ）に＝`80 → 127.0.0.1:3000`、`client_max_body_size 40m`（画像アップロード上限に整合）。設定 `/etc/nginx/sites-available/30nen`。
    - **注意・メモ**: `.env.local` は rsync で**Macのものがコピーされた**（SESSION_SECRET 有効値入り）→お試しは可だが**本番化時は専用の秘密鍵に差し替え**。今は `http`（暗号化なし）＝**本番化で https（Let's Encrypt 等）必須**。アプリは**root実行**＝本番化で専用ユーザーに分けるのが望ましい。Macの開発DBを載せたのでテスト管理者 `test@example.com` 等も入ったまま（本番前に整理）。
    - **▶ 次回（本番化に向けて）**: ①このまま本契約に進むか（期限6/22）を判断 → ②独自URL/ドメインの当て方を検討（現行30nen.comには触れず、まずサブドメイン等の別URLで本番相当に）→ ③https化 → ④本番用 `.env`・専用ユーザー・ファイアウォール等のハードニング → ⑤項目4の本移行（S3スクリプト・画像圧縮で運ぶ）へ。**投稿UIや管理画面の実機での触り心地チェックも今ならできる**（`http://162.43.22.151/login`）。
48. **VPS実機で投稿テスト → 不具合2件を修正＋本文画像のドラッグ＆ドロップ／貼り付けを追加（SAKIさんが実機で確認）**（コミット `（このコミット）`）。項目47のデプロイ後、`test@example.com`（テスト管理者）でログインして投稿画面を実際に操作。3つの実機問題を発見・対応した。
    - **① ログインが続かない（http）→ コード修正**: 本番モードは会員証Cookieを `secure`（HTTPSのみ送信）にするため、http のお試しではログインが保持されず「新規作成」で `/login` に戻されていた。`src/auth/session.ts` に環境変数 **`SESSION_COOKIE_SECURE`** を追加（未設定なら従来どおり本番=secure。`false` で http でも保持）。サーバーの `.env.local` に `SESSION_COOKIE_SECURE=false` を設定。**▶ https化したらこの変数は外す**（＝secureに戻す）。`.env.example` に説明追記。
    - **② アップロード画像が表示されない（404）→ サーバー設定で修正**: `next start`（本番）は**起動後に `public/` へ書かれたファイルを配信しない**ため、投稿画像が404になっていた（保存自体は成功）。**Nginx で `/uploads/` を直接配信**するようにして解決。**注意＝`alias`＋`try_files` は効かず（Next にフォールバックして404）、`root` 方式で解決**。現在の `/etc/nginx/sites-available/30nen` の該当ブロック：`location /uploads/ { root /var/www/30nen_next/public; expires 30d; access_log off; }`（このNginx設定はサーバー上のみ＝リポジトリ未管理。再構築時は再設定が必要）。
    - **③ 本文画像のドラッグ＆ドロップ／貼り付けを追加（コード）**: `src/app/admin/rich-editor.tsx` に ProseMirror の `handleDrop`/`handlePaste` を実装。写真を本文へドラッグ、またはコピー→⌘/Ctrl+V で挿入できる（既存の `uploadImage` を流用＝同じ自動軽量化を通る・複数枚可・落とした位置に挿入）。本文下に操作ヒント文も表示。型/Lintクリア・実機確認済み。
    - **Nginx構成メモ（現状）**: `listen 80 default_server` / `server_name _` / `client_max_body_size 40m`（アップロード上限と整合）/ `location /uploads/`＝root方式で静的配信 / `location /`＝`proxy_pass http://127.0.0.1:3000`（PM2のNext）。
    - **▶ 次回**: 項目47の本番化TODO（本契約判断・独自URL/ドメイン・https・ハードニング・テストデータ整理）に加え、**本番では `SESSION_COOKIE_SECURE` を外す**こと、**Nginxの `/uploads/` 直接配信設定を本番でも必ず入れる**ことを忘れない。
49. **フェーズ2：投稿画面の改善6点（SAKIさんと対話しながら実施・ブラウザ実機で確認）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。投稿まわりの使い勝手をまとめて改善した。
    - **① 「新規作成」→「新しい日記をかく」（全員）**: `/admin` のボタン・案内文と `/admin/new` の見出しを、管理者・書き手とも「新しい日記をかく」に統一（やさしい言い回し）。
    - **② 年齢→誕生日の自動表示**: 書き手プロフィールの手入力「年齢」をやめ、**「誕生日」を1回入れれば満年齢を自動計算**して記事ページに表示（毎年の書き換え不要・誕生日そのものは非公開）。DB列 `users.age`→`birthday`（マイグレ `0008` 追加／`0009` 旧列削除）。`src/lib/datetime.ts` に `calcAge`（JST基準）。`writer-profile.tsx`・`user-form.tsx`・`db/users.ts`・`actions/users.ts` を更新。
    - **③ myPROFILE（本人がプロフィール編集）`/admin/profile`**: 書き手も管理者も**自分の分だけ**編集できるページを新設（他人の分は触れない）。編集項目＝名前(ペンネーム)/顔写真/誕生日/居住地/SNS各URL。メール(ログインID)・パスワード・権限・担当連載は管理者領域として**含めない**。新規 `src/app/admin/profile/`（page＋profile-form）・`src/app/actions/profile.ts`（`requireUser()` で本人id固定）。`/admin` ヘッダーに「myPROFILE」リンク追加。
    - **④ 本文に「リンク」ボタン**: TipTap StarterKit v3 内蔵の Link を有効化し、ツールバーに「リンク」追加（`rich-editor.tsx`）。選択文字にURLを貼る／空欄で解除／文字未選択ならURLを文字として挿入。編集中はクリックで飛ばない・外部は新しいタブ＋`rel`安全属性。表示の `sanitize.ts` は元々 `<a>`（href/target/rel・http/https/mailto）対応済み＝バックエンド変更不要。`globals.css` にエディタ内リンク色（青＋下線）。
    - **⑤ 画像フォルダ `/admin/media`**: これまで上げた写真の一覧。全員分を新しい順・クリックで拡大・**自分が上げた写真だけ削除**（管理者は全部・記録の無い過去の写真は持ち主不明で管理者のみ）。48枚ごとページ送り。**DBに台帳 `uploads`（path/uploaded_by/created_at・マイグレ `0010`）を追加**し、`/api/upload` が保存後に「誰が上げたか」を記録するようにした。新規 `src/db/uploads.ts`・`src/lib/media.ts`（public/uploads走査）・`src/app/admin/media/`（page＋media-grid）・`src/app/actions/media.ts`（削除＝`/uploads`配下限定・`..`禁止のパストラバーサル防御＋持ち主チェック）。`/admin` ヘッダーに「画像フォルダ」リンク追加。**注意＝「自分の写真だけ削除」は今後アップする分から有効**（記録が付くため）。既存の写真は持ち主不明扱い。
    - **⑥ 「連載」欄を本文より下へ移動**: 投稿フォームの並びを「タイトル→本文→アイキャッチ→公開日時→**連載**→ボタン」に変更（`article-form.tsx`）。連載は引き続き必須・担当者は自動選択のまま。
    - **同梱メモ**: 本コミットには、セッション開始時から未コミットだった**スキーマのunique化（`wp_id`/`wp_term_id` 等＝マイグレ `0007`）**も含まれる（`src/db/schema.ts` で今回分と分離できないため）。移行データ系の作業物（`migration/author-map.csv` の更新・`migration/` の資料・`ph_data/`）は本コミットには**含めていない**（別ワークストリームのため）。
    - **▶ 次回**: 撮影/テスト用アカウントは削除済み。残るテスト管理者(`test@example.com`)・サンプルDBは本番前に整理。移行作業（項目45の▶・S3スクリプト等）やデプロイ本番化（項目47-48の▶）が引き続き大物。
50. **フェーズ2：投稿の自動保存（サーバー下書き）を実装（SAKIさんの要望・ブラウザ実機で確認）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。WordPress/STUDIOのように、書いている途中で自動的に保存されるようにした。
    - **動き**: 投稿フォームで**10秒ごと（前回保存から内容が変わったときだけ）**にDBへ下書きとして自動保存。ボタン横に「自動保存しました HH:MM」を表示。タブを離れる/隠れるときも保存を試みる。
    - **新規の重複防止**: 新規は最初の自動保存で「下書き」として作られ、その記事 id を**見えない id 欄（React の state 管理）**に入れる。以後の自動保存も、手動「投稿する」も同じ id を更新するので**重複記事ができない**。※実装途中、id 欄を素の DOM 書き換えにしていたら再描画で消えて重複しかねない不具合があり、**React state 管理に変更して解消**（実機で重複が出ないことを確認）。
    - **公開中は自動保存しない**: 公開済み記事の編集では自動保存を止める（書きかけが公開ページに出るのを防ぐ）。「公開中の記事は自動保存されません。編集後は『投稿する』で保存してください」と表示。手動「投稿する」で反映。
    - **作成/更新の1本化**: `src/app/actions/articles.ts` の `createArticleAction`＋`updateArticleAction` を **`saveArticleAction`**（id があれば更新・無ければ作成）に統合。自動保存用に **`autosaveArticleAction`** を新設（検証ゆるめ＝タイトル空でも「（無題）」・連載未選択でも保存・**status は変更しない**＝公開↔下書きを勝手に切り替えない）。`new/page.tsx`・`articles/[id]/edit/page.tsx` を `saveArticleAction` に差し替え（編集ページは `status` も渡す）。`article-form.tsx` に自動保存ロジック追加。
    - **▶ 次回**: 必要ならブラウザ側のローカル自動保存（localStorage・最初の保存前の事故対策）を足す案は残す。デプロイ本番化・移行作業が引き続き大物。
51. **置き場所のセカンドオピニオン取得＋お試しVPS失効前の設定回収（項目51・SAKIさんと対話しながら実施）**（コミット `（このコミット）`）。Xサーバー VPS お試しの**利用期限 2026-06-22（＝この日）**にあたり、「本番の置き場所をXサーバー VPSで確定してよいか／裏返る可能性はあるか」を別AIエージェント（Codex）に客観レビュー依頼し、その結論を受けて「失効前にやるべきこと」を実施した。
    - **Codexへの相談**: `letter_box/outbox/2026-06-22_question-01.md` に、前提（日記サイト・書き手20名+・記事約7,998件・30年運用・コストゼロ方針・専任インフラ担当なし）／技術スタック（Next.js+SQLite+sharp）／4案比較／実機検証成功／論点チェックリストを自己完結でまとめて依頼。
    - **Codexの回答**: `letter_box/inbox/2026-06-22_review-03.md`。**総合＝Xサーバー VPSは妥当・致命的な見落としなし**。ただし**今日の本契約は推奨しない**（公開は7月下旬〜8月末で常時稼働がまだ不要・本契約は「運用責任の開始」になる）。指摘の要点＝R-01今日の契約は技術判断でなく運用開始の判断／R-02 30年の最大リスクはVPS選定でなく保守体制／R-03 SQLite単一ファイルは現規模では妥当だがバックアップ前提／R-04バックアップは「戻せる」まで本番条件／R-05裏返り確率（技術=低・容量=中・保守継続困難=中〜高・移行リハ手戻り=中）／R-06折衷案は「バックアップ先だけ外部化」／R-07失効前に設定情報を回収。
    - **【方針決定（SAKI合意）】**: ①**今は本契約せず失効でOK**（データはGitHub/Macに有り・建て直し可）。②お披露目が近づいたら再契約して建て直す。③**バックアップから復旧できることを確認してからGo判定**（Codex R-02/04/06を本番Go条件に追加）。
    - **R-07対応＝失効前の設定回収（実施済み）**: テストサーバー(162.43.22.151)が生きているうちにSSH（読み取りのみ・秘密値は読まず）で構成を吸い出し、**建て直しレシピ `docs/deploy-notes.md` を新規作成**。記録内容＝OS/Node/npm/PM2/Nginxの各バージョン・フォルダ構成（アプリ`/var/www/30nen_next`・永続=`data/30nen.db`と`public/uploads/`）・ゼロからの建て直し手順（借りる→Node公式バイナリ→rsync転送→`npm ci`＆`npm run build`→PM2常駐→Nginx）・**Nginx設定全文**（`client_max_body_size 40m`・`/uploads/`は`root`方式で直接配信）・PM2起動（`pm2 start npm --name 30nen -- start`＋`pm2 startup systemd`＋`pm2 save`・`pm2-root`=enabled）・環境変数のキー一覧（`SESSION_SECRET`/`SESSION_COOKIE_SECURE`・値は別保管）・お試しで出た不具合2件と対処・本番化TODO（鍵再生成/https化/専用ユーザー/テストデータ整理/独自URL/**バックアップ復旧テスト**）。
    - **▶ 次回**: お試しVPSは失効でOK（必要なら本人がパネルで本契約も可）。移行作業（S3スクリプト・全件リハーサル）はローカル中心で進められる。お披露目前のリハーサル段階で `docs/deploy-notes.md` を見て再構築し、**バックアップ復旧テスト合格をGo条件**にする。
52. **フェーズ2：トップページ「小商店」に連載ロゴを全20連載ぶん並べた（SAKIさんと対話しながら実施・ブラウザ実機で確認）**（コミット `（このコミット）`）。右サイドバーの「小商店」は、連載の `imagePath` を3列で表示する既存の仕組み（`src/components/public/series-list.tsx`・`SeriesList`）で、`src/app/(public)/layout.tsx` が **トップ階層（`parentId === null`）の連載を `sortOrder` 順** に渡している。ここに本番のロゴをそろえて並べた。
    - **ロゴ元データ**: SAKIさんが `ph_data/logo/` に **20枚** を用意（番号付き18枚＋`p01_tabitabi_pre_logo2.png`（度々の旅）＋`oshirase3.jpg`（店主よりお知らせ））。表示用に `public/uploads/logo/` へコピー（`public/uploads/` はGit管理外なのでコピー先はコミットされない。**元データ `ph_data/logo/` の方をGitに保存した**）。
    - **本番連載をDBに用意**: `migration/series-map.csv` に沿って連載を作成／更新。**既存サンプル6件（もしもし五島列島・ご機嫌な毎日・島縞・のちの野良・度々の旅・山陰編）は名前一致で更新**し、残り15件を新規作成＝**計21件（トップ階層20件＋「山陰編」は「度々の旅」の子）**。各行に `wp_term_id`・`slug`・`sortOrder`・`image_path` をセット（id は変えていないのでサンプル記事のひもづけは保持）。
    - **並び順はSAKIさん指定の画像どおりに確定**: 1.店主よりお知らせ／2.度々の旅／3.もしもし五島列島／4.CAL TATAU／5.浮記／6.エフェメラ！／7.王様の耳は／8.雨のち晴れ／9.とこのとびら／10.島縞／11.悩みのタネに水をまく／12.ご機嫌な毎日／13.Sophy's philosophy／14.P.S./15.風早草子／16.1/10957／17.のちの野良／18.かきぬまめがね＠東京／19.わたしのレシーヘン／20.Seize the day。**19・20はSAKIさんの指定画像に写っていなかったため末尾**（本人合意済み）。
    - **⚠ データはローカルのお試し用**: 連載・並び順は `data/30nen.db`（Git管理外）への変更で、本番は移行S3（記事＋連載の本投入）で正式に作り直す。今回の作業は「小商店の見た目を本番イメージで確認できる状態」を作るのが目的。本番移行時は `series-map.csv` の `wp_term_id`/`slug`/連載画像をそのまま使える。
53. **フェーズ2：トップページの見た目を微調整（SAKIさんと対話しながら実施・ブラウザ実機で確認）**（コミット `e8f2aba`）。型チェック(tsc)・Lint(eslint)クリーン。すべて1行のCSSクラス（Tailwind）変更で、4ファイルを調整した。
    - **足跡（三十年商店）の下アキを詰めた**: `src/components/public/breadcrumb.tsx` の `mb-6`→`mb-2`。トップ中央上の「三十年商店」と「最新」帯の間が広く空いていたのを詰めた（足跡は記事・連載ページ共通なのでサイト全体で揃う）。
    - **見出し帯の下アキを詰めた**: `src/components/public/section-heading.tsx` の既定 `gapClass` を `mb-5`→`mb-3`（20px→12px）。「最新」「記事一覧」「小商店」ほか全ページの見出しオビの下が揃って詰まる（個別指定の「アーカイブ」=`mb-2` はそのまま）。
    - **左右コラムを同じだけ少し拡幅**: `src/app/(public)/layout.tsx` のグリッドを `1fr_1.8fr_1fr`→`1.1fr_1.8fr_1.1fr`。左右が同量広がり（実測 各266→277px）、中央は1.8frのまま（478→454px）。※SAKIさんが一度「右だけ広げ中と等分」(`1fr_1.4fr_1.4fr`)を試したが「右が大きすぎた」ので元比率に戻し、改めて左右を均等に少しだけ広げた。
    - **のれんロゴを拡大**: `src/components/public/sidebar-left.tsx` のPC時 `lg:max-w-[208px]`→`[247px]`（基準260pxの約80%→**95%**）。スマホ側 `max-w-[260px]` は据え置き。
    - **メモ（色の確認）**: 本文の文字色は **濃いチャコールグレー `#333`**（ほぼ黒・現行サイトと同じ確定色）。見出しオビの文字は `#150c0c`、日付・足跡だけ薄いグレー `#808080`。
54. **フェーズ2／移行S3：記事移行スクリプトを作成し、サンプル10件で通し検証に成功（SAKIさんの指示で着手）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。**すべて手元のパソコン内＋現行サイトは読み取りのみ**で完結する安全な作業。`migration/data-migration-plan.md` §2 の「スクリプトに必ず入れる仕様」を満たす移行の土台ができた。
    - **作った部品（4本）**:
      - `migration/lib/maps.ts` … `author-map.csv`・`series-map.csv` を読む（自作の最小CSVパーサ）。**著者解決ルール**（番号1→ぐっさん12へ統合／記事単位の特例＝ID282除外・ID24126→Luis23）を集約。`resolveArticleAuthorWpId()`・`loadAuthorMap()`・`loadSeriesMap()`・`resolveSeriesByLabel()`。
      - `migration/lib/transform.ts` … WP本文を新システム用に整形。**wpautop**（空行→`<p>`・単一改行→`<br>`・`&nbsp;`だけの段落や`[caption]`を除去）→**画像URL書き換え**（`https://30nen.com/wp-content/uploads/…`→`/uploads/…`＝S5）→**サニタイズ**（投稿時と同じ許可リスト・class/width等を除去）。`wpDateToUtc()`（WPのpost_date=日本時間→DBのUTC・既存`jstInputToUtc`を再利用）・`wpStatusToStatus()`・`normalizeSlug()`（slugは現行どおり保持）。
      - `scripts/migrate-categories.ts` … `series-map.csv`から連載を作る（S2）。`wp_term_id`で**冪等**・親(度々の旅)→子(山陰編)の順・未分類は作らない。
      - `scripts/migrate-users.ts` … `author-map.csv`から著者を作る。`wp_id`で**冪等**・番号1は作らない・仮パスワード（本配布はオンボーディングで）・担当連載を`category_authors`に登録（投稿画面の自動ひもづけが効く）。
      - `scripts/migrate-articles.ts` … **本体**。WPの書き出し（`<ID>.json`/`.categories.json`/`.author_id.txt`/`.imagelist.txt`）を読む→変換→`articles`へ。**`wp_id`で冪等**・特例反映・**dry-run**（DBに書かず件数だけ）・**エラーを記事/画像で分けて記録**・**件数照合レポート**・画像配置（既定=サンプルからコピー／`--download`で本番URL取得）。
    - **検証（練習用DB `data/migrate-test.db`・SAKIさん選択で本番DBと分離）**: スキーマ適用→連載21・著者22作成（担当連載ひもづけ21件＝店主はなしで正しい）→記事10件を取り込み**エラーゼロ**。**全件 著者・連載が正しくひもづけ**（CAL TATAU→Luis／店主よりお知らせ→店主 等）・**画像URL旧URL残りゼロ**・画像17枚配置（READMEの17枚と一致）・**日時JST→UTC正確**（13:51→04:51）・**slug保持**・**冪等**（再実行で取り込み0・全件スキップ）・dry-runも確認。
    - **⚠ 注意**: 練習用DB(`data/migrate-test.db`)・コピーした画像(`public/uploads/`)は**Git管理外**＝コミットに含まれない（含まれるのはスクリプト4本のみ）。`data/30nen.db`（普段の表示確認用）には触れていない。
    - **▶ 次（S3〜S4の残り）**: ①**本物の全記事の書き出し**＝現行WPから7,998件を同じ形式（`<ID>.json`ほか）でSSH/WP-CLIエクスポートする手順を確立（次の山）②**S4リハーサル移行**＝全件で通し→点検（文字化け・画像欠落・件数照合・親子連載）③**画像の本番取得**（`--download`経路は実装済み・未実行）④本番DBの初期化手順。スクリプトは`--posts <dir>`で入力フォルダを差し替え可。
55. **移行S3：全記事の「書き出し手順書」一式を作成（SAKIさんの指示で着手・実際の書き出しは未実行）**（コミット `（このコミット）`）。前項54の「次の山＝本物の全記事の書き出し」について、SAKIさんの選択で**手順書を作るだけ**（実際の吸い出し・取り込みはまだしない）。すべて読み取りのみで現行サイトには無影響の段取り。
    - **作ったもの（3点・どれも未実行）**:
      - `migration/export-wp.sh` … 現行サーバー上で動かす書き出しスクリプト（**読み取り専用**＝`post list`/`post get`/`post term list` のみ）。公開記事ごとに `<ID>.json`（本文・タイトル・公開日時・著者番号・slug等）と `<ID>.categories.json` を出力。`LIMIT=20` で試運転、`LIMIT=0`(既定)で全件。WP-CLIは `php7.4 /usr/bin/wp`、WP本体は `/home/the30nen/30nen.com/public_html`。
      - `migration/derive-aux-files.ts` … 手元(ローカル)で `<ID>.json` から残り2ファイル（`<ID>.author_id.txt`・`<ID>.imagelist.txt`）を生成しサンプルと同じ4ファイル構成にする後処理（サーバー処理を軽くするため本文解析は手元Nodeで実施）。**サンプル10件で検証＝画像リストが正解と完全一致**。
      - `migration/export-procedure.md` … SAKIさん向けの手順書（やさしい説明）。流れ＝①SCPで`export-wp.sh`をサーバーへ→②`LIMIT=20`で試運転→③全件書き出し（「公開記事: 7999件」想定）→④rsyncで手元`migration/export/posts/`へ持ち帰り→⑤`derive-aux-files.ts`で補助ファイル生成→⑥件数照合（7999＝移行時ID282除外で7998）→⑦移行スクリプトを`--posts migration/export/posts`で流す（まず練習用DB・dry-run→本実行）。安全メモ・画像の扱い（`--download`／**縮小は未実装＝S4前に判断**）も記載。
    - **接続情報**（手順書にも記載）: `ssh xserver-30nen`（`the30nen@the30nen.xsrv.jp:10022`・鍵 `~/.ssh/30nen_xserver`）。
    - **▶ 次**: SAKIさんの「やってOK」を合図に、export-procedure.md に沿って ①試運転(20件) → ②全件書き出し → ③S4リハーサル移行（全件取り込み＋点検）。書き出しデータ(`migration/export/`)・練習用DBはGit管理外。
56. **移行S3：実データ20件で書き出し→取り込みの通し検証に成功＋移行時の画像自動縮小を実装（SAKIさんの「やってOK」で実施）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。**現行サイトは読み取りのみ・一切書き込まない**を厳守。
    - **STEP1 試運転（実データ20件・本番から読み取りのみ）成功**: `ssh xserver-30nen` でWP-CLI 2.4.0確認。**公開記事は 8,101件**（プラン想定7,999から+102＝6月中旬以降の日次投稿で増加・記事は日々増える前提）。安全のためサーバーには1ファイルも作らず、`wp post get`/`post term list`の出力を手元へ直接保存する方式で先頭20件を取得（`migration/export/posts/`）→ `derive-aux-files.ts` で4ファイル化 → 練習用DB`data/migrate-test.db`へ取り込み。**記事20/20・画像21枚・エラーゼロ／著者・連載ひもづけ正・画像URL書換(旧URL残ゼロ)・日時JST→UTC正確・slug保持・冪等(再実行で取込0/全件スキップ)**。
    - **移行時の画像自動縮小を実装（「軽くして運ぶ」S5方針の実体）**: 縮小ロジックを共通部品 **`src/lib/image.ts`** に集約（`shrinkImage`＝EXIF向き補正→長辺1600px→圧縮／GIFは無加工／`mimeFromExtension`）。投稿API `src/app/api/upload/route.ts` をこの共通部品を使う形へ（**ロジックは同一・挙動不変**）。移行スクリプト `scripts/migrate-articles.ts` の `placeImage` を、ダウンロード／サンプルの両経路で**保存前に縮小**するよう変更（縮小失敗時は原本を残し移行を止めない）。
    - **縮小の効果（実データ20件で実測）**: 同じ21枚が **約21MB→約3.1MB（約1/7）**。2MB級の写真が約254KB(1600×1600)へ。1枚平均≈0.15MB → **全8,101記事ぶんでもおおよそ1〜2GB見込み**（現行WP 71GBから激減・VPS小プランで十分）。
    - **Git管理**: `.gitignore` に `/migration/export/` を追加（書き出し実体・大量JSON/画像は管理外。手順とスクリプトだけ管理）。コミット対象は `src/lib/image.ts`・`upload/route.ts`・`migrate-articles.ts`・`.gitignore`・HANDOFF。練習用DB・`public/uploads/`・`migration/export/` は管理外。
    - **▶ 次（S4リハーサルへ）**: ①**全件(8,101)の書き出し**（per-IDで毎回SSHは遅すぎる＝`export-wp.sh`をサーバーで実行しrsync、または1本のSSHセッションで全件ストリーム取得に作り替える）②全件取り込み＋点検（文字化け・画像欠落・件数照合・親子連載）。重い処理＆本番に多数アクセスするため一区切りずつ。
57. **移行S3：全件書き出しを「まとめ取り」方式に高速化（コード作り替えのみ・本番アクセスなし）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。項目56で「per-IDのSSHは全件だと2〜3時間で遅すぎる」と判明したため、**サーバーへのアクセスを2回だけにする**よう作り替えた（全件でも数分見込み）。
    - **`migration/export-wp.sh` を高速版に書き換え**: サーバー上で **まとめ取り2回**＝①`wp post list --format=json`（全公開記事の本体を1回でJSON配列取得）②`wp db query` の SELECT（連載対応＝`term_relationships`×`term_taxonomy`×`terms`×`posts` の JOIN・読み取りのみ・`--skip-column-names`でTSV出力・テーブル接頭辞は `wp db prefix` で取得）。出力は `all-posts.json`＋`all-categories.tsv` の2ファイル。`LIMIT=20` で本体だけ試運転可。
    - **`migration/split-export.ts` を新規作成**: 手元(ローカル)でまとめファイルを 1記事ごとの `<ID>.json`／`<ID>.categories.json` に分割（TSVは post_id ごとに集約・見出し/空行は除外）。このあと `derive-aux-files.ts` で残り2ファイルを作ればサンプルと同じ4ファイル構成になり `migrate-articles.ts` がそのまま使える。
    - **`migration/export-procedure.md` を新方式に更新**: 流れ＝①`export-wp.sh`（まとめ取り2回）→②rsyncで`all-posts.json`/`all-categories.tsv`の2ファイルだけ持ち帰り→③`split-export.ts`で分割→④`derive-aux-files.ts`→⑤件数照合（約8,101）→⑥移行。
    - **検証（本番に触れず・手元の実データ20件で）**: 既存の20件から擬似まとめファイルを作り `split-export.ts` で分割→**元の1件ずつファイルと完全一致**（本体20/20・カテゴリ20/20）。続けて補助生成→取り込みdry-runの件数照合もOK。
    - **▶ 次**: SAKIさんの合図で、`export-wp.sh`（試運転20→全件）→rsync→split→derive→S4全件取り込み＋点検。重いのは画像のDL＋縮小（30分〜1時間＋）のみ。
58. **移行S4：全件リハーサル移行を実施＋テストサイト表示で重大バグ（日本語slug 404）を発見・修正（SAKIさんの「S4まで行く」指示で実施）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。現行サイトは読み取りのみ厳守。**移行スクリプトが全8,101件を正しく運べることを実証**。
    - **全件書き出し（まとめ取り2回・読み取りのみ）**: `wp post list --format=json`（本体・34.6MB）＋`wp db query`のSELECT（連載対応・8,102行）をローカルへ直接保存（サーバーに何も書かない）。**公開記事は8,102件**（前夜8,101から+1・日々増加）。`split-export.ts`→`derive-aux-files.ts`で4ファイル×8,102に展開。
    - **全件取り込み（練習用DB `data/migrate-test.db`・画像は`--download`＋縮小）**: 約1時間で完走。**取り込み8,101／除外(ID282)1／記事エラー0／件数照合OK**。点検＝**著者なし0・連載なし0**／親子連載（度々の旅＞山陰編9件）正／**文字化け(�)0**／**本文の旧URL残り0**（全件 `/uploads/` に書換）／画像 抜き取り823枚すべて長辺1600px以下（縮小OK）。
    - **画像の実測**: 配置12,435・エラー2。合計**約6.4GB**＝写真(jpeg/jpg/png/webp/heic)約2.4GB＋**動画(mov/mp4)約4.0GB**＋音声0.06GB。**容量の主因は動画**（縮小不可・性質上そのまま運ぶ／現行71GBの約1/11でVPS 50GBに十分収まる）。画像エラー2枚は現行サイト側の404＝`migration/known-issues.md` に記録（ID20524「空から降りてくる」/ID472「comeback weekend」）。**HEIC21枚はブラウザ非表示の懸念→本番前にJPEG変換を検討**。
    - **⚠ 重大バグ発見＆修正＝日本語タイトル記事が全部404**: テストサイト表示で発覚（英語slugのみ200）。**原因＝Next.js 16 は動的セグメント`[slug]`の params をURLデコードせず生の％エンコード（大文字%XX）で渡す**（AGENTS.md「これは普段のNextではない」案件）。修正2か所＝①`migration/lib/transform.ts` の `normalizeSlug` を**復号して保存**（人が読める形・例 "抜歯の火曜"）②`src/app/(public)/posts/[slug]/page.tsx` の `findArticle` で **`decodeURIComponent` してから照合**。結果＝日本語/¥記号/**旧符号化URL(小文字)**/英語 すべて200（旧リンクの継続性も確保）。再移行で全8,101件のslug修正を確認。
    - **既知の残課題（バグではない・本番移行の段取り）**: ①連載の `image_path` が移行カテゴリでは未設定→小商店ロゴがplaceholder(line-up.png)。本番は「ロゴ設定」工程を一段入れる（項目52で別途実施済みの作業）。②`migrate-categories` の `sortOrder` が項目52の手動並びと別→本番で並び順を合わせる。③記事のアイキャッチ(featured_image)はWP書き出しに含めていない→一覧/最新カードはdammy画像（本文画像は正常）。必要ならエクスポートにthumbnail追加を検討。
    - **メモ**: 練習用DB・`migration/export/`・`public/uploads/`はGit管理外（コミットはコード修正＋`known-issues.md`＋HANDOFF）。閲覧用に`.claude/launch.json`へ一時的にDATABASE_PATHを足したが元に戻した（`.claude/`は管理外）。
    - **▶ 次**: ①残課題①②（ロゴ・並び）を本番移行手順に組み込む ②HEIC対応の判断 ③書き手オンボーディング文面 ④本番化（VPS本契約・独自URL・https・バックアップ復旧テスト）。S4の主目的「全件を正しく運べるか」は達成。

### 現在のフォルダ状態
```
~/Desktop/
├── 30nen_pj/      ← 現行WordPress（本番稼働中・移行元・温存。触らない）
└── 30nen_next/    ← ★このプロジェクト（新システム / GitHub: sakipomco/30nen_next・Private）
    ├── .git/
    ├── src/app/       ← Next.js App Router（雛形）
    ├── reference/     ← 現行WPからの参照物（sample-posts / theme / categories.json）
    ├── docs/          ← 設計・仕様（schema.md / public-page-spec.md）
    ├── migration/     ← ★記事移行の計画（schedule.md ほか・項目31）
    ├── letter_box/    ← レビュー連絡用（inbox / outbox）
    ├── public/ , package.json , tsconfig.json , next.config.ts ほか
    ├── README.md
    ├── .gitignore
    └── HANDOFF.md  ← このファイル
```

### サーバー接続メモ（読み取りのみで使用）
- SSH: `ssh xserver-30nen`（`~/.ssh/config` に設定済み・鍵 `~/.ssh/30nen_xserver`）
- WordPress 本番: `/home/the30nen/30nen.com/public_html`
- WP-CLI は `php7.4 /usr/bin/wp ...` の形で実行（既定の php は 5.4 で古く WP を解釈できない）

---

## 2. 技術スタック（採用済み）

| 役割 | 技術 |
|------|------|
| 公開サイト・投稿UI | Next.js (App Router) |
| リッチテキストエディタ | TipTap（OSS・無料） |
| データベース | SQLite（Xサーバー上） |
| 認証 | JWT（メール＋パスワード） |
| ホスティング | Xサーバー（Nginx + PM2） |

### 投稿UIのイメージ（投稿者向け・シンプル最優先）
ブラウザで開くと表示されるのは次の3点のみ：
1. タイトル入力欄
2. 本文（TipTapエディタ：Googleドキュメントに近い操作感）
3. 画像アップロード

ボタンは「**下書き保存**」「**投稿する**」の2つだけ。

---

## 3. ✅ 開発環境（導入済み）

- **Node.js 導入済み**（nvm 経由・node v24.16.0 / npm 11.13.0）。新しいターミナルでは `~/.zprofile` で自動有効。
  - もし `node: command not found` が出たら: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default`
- 確認コマンド: `node -v` / `npm -v`
- 開発サーバー起動: `npm run dev`（http://localhost:3000）
  - ※ 起動前に必ず nvm 経由の node を有効化しておく（上記コマンド）。Tailwind/PostCSS が内部で `node` を呼ぶため、PATH に node が無いと起動時にエラーになる。

---

## 4. 次のステップ（おすすめ順）

ステップ1〜4（環境構築〜参照物の持ち込み）は **完了済み**。次はフェーズ2（新システム構築）へ。

1. ~~Node.js をインストール~~ … ✅ 完了
2. ~~Next.js 雛形を作成~~ … ✅ 完了（`7036bad`）
3. ~~GitHub に新リポジトリ作成 → push~~ … ✅ 完了（`sakipomco/30nen_next`・Private）
4. ~~`reference/` に現行の参照物を持ち込む~~ … ✅ 完了（`6315ff3`）
5. DBスキーマ設計 … ✅ 完成（4テーブル確定。設計は `docs/schema.md`）
6. SQLiteライブラリ選定＋実DB作成 … ✅ 完了（**Drizzle ORM** 採用・`data/30nen.db` に4テーブル作成）
7. 記事(articles)のCRUD API … ✅ 完了（`src/db/articles.ts`・動作確認済み）
8. JWT認証（ログイン）の土台 … ✅ 完了（`src/auth/*`・`src/db/users.ts`・`src/app/actions/auth.ts`・動作確認済み）
9. ログイン画面・投稿管理画面のUI … ✅ 完了（`/login`・`/admin`・ルート保護・ブラウザ動作確認済み）
10. 投稿UI（記事の作成・編集・削除） … ✅ 完了（`/admin/new`・`/admin/articles/[id]/edit`・ブラウザ動作確認済み）
11. 本文エディタ TipTap（リッチエディタ） … ✅ 完了（`src/app/admin/rich-editor.tsx`・ブラウザ動作確認済み）
12. 投稿日時の設定（即時投稿／日時指定・さかのぼり可） … ✅ 完了（`src/lib/datetime.ts`・ブラウザ動作確認済み）
13. 画像アップロード（本文への画像挿入＋アイキャッチ画像） … ✅ 完了（`src/app/api/upload/route.ts`・`featured-image.tsx`・DBに`featured_image_path`列追加・ブラウザ動作確認済み）
14. アイキャッチ未設定の確認アラート（A案） … ✅ 完了（`ee3480a`・ブラウザ動作確認済み）
15. カテゴリ（連載）選択UI と users/categories のCRUD … ✅ 完了
    - 連載データ層＋担当名簿（`9ae420c`）／連載管理画面（`e9e3e05`）／投稿フォームの連載選択＋自動ひもづけ（`f954926`）／投稿者管理画面（`2b6fdcd`）。すべてブラウザ動作確認済み。
    - **書き手と連載の自動ひもづけ**で「未分類になる選び忘れ」を構造的に解消（1人1連載）。
16. 公開トップページのデザイン要件確定（A〜J） … ✅ 完了（`c8f19d1`・`637f69f`）。`docs/public-page-spec.md` §14 に全記録。
    - **▶ 次：このデザイン要件（§14）に沿って公開トップページを実装**（Claude Design と共同）。
      - 着手前にまず: ①ダミー画像など `public/` へコピー（`dammy.jpg`/`line-up.png`/`30nen_sanmaru.png` など。`image_path` 列追加は `dc6b5a7` で実施済み）。②E項目の「サイト設定」テーブル＋管理画面（リードテキスト編集）を追加。
      - その後: 記事詳細ページ・連載別一覧ページ・著者ページ。
      - **未確定の要件（先に詰める）**: スマホ表示・ハンバーガーメニューの詳細（§14 末尾の先取りメモ＋§6 参照）。
    - ~~最後: Xサーバーへのデプロイ設定（Nginx + PM2）~~ … ✅ **テストデプロイ成功（項目47・`http://162.43.22.151`）**。Xサーバー VPS（無料お試し）に Node.js v24＋PM2＋Nginx で構築し外部表示まで確認。残りは本番化（本契約判断・独自URL/ドメイン・https・ハードニング）。
    - デプロイ時の注意（画像）: `public/uploads/` はGit管理外の**永続フォルダ**。デプロイで消えない/上書きされないように扱う。

---

## 5. 移行フェーズ全体像

### フェーズ1：サンプルデータのエクスポート（Claude Code担当）
- XサーバーにSSH接続
- MySQLから `wp_posts`・`wp_postmeta`・`wp_users` の **サンプル数件** をJSON出力
- `wp-content/uploads` からサンプル画像を取得

### フェーズ2：新システム構築
- **Claude Code担当：** DBスキーマ設計（記事・ユーザー・カテゴリ）／CRUD API／JWT認証／Xサーバーへのデプロイ設定（Nginx + PM2）
- **SAKIさん × Claude担当：** 投稿UI（タイトル・本文・画像・カテゴリ・下書き/公開）／公開サイトのデザイン・レイアウト

### フェーズ3：動作確認・調整
- サンプルデータで表示・投稿・編集・削除を確認
- 投稿者向けUIの使いやすさを調整

### フェーズ4：全記事の本番移行（Claude Code担当）
- WordPressの全記事・画像を一括エクスポート
- 新DBへのインポートスクリプト実行
- 画像パスの書き換えを自動処理

### フェーズ5：本番切り替え
- 新サイトをXサーバーにデプロイ
- ドメイン（30nen.com）を新サイトへ向ける
- WordPress停止

> ※ フェーズ1〜3完了・動作確認後にフェーズ4を実施。移行完了までWordPressは並行稼働。

---

## 6. 役割分担

| 作業 | 担当 |
|------|------|
| DBスキーマ・API・認証・デプロイ | Claude Code |
| データエクスポート・移行スクリプト | Claude Code |
| 投稿UI・公開サイトデザイン | SAKIさん × Claude |

---

## 7. 重要な前提・制約メモ
- 現行 `30nen_pj`（WordPress）は本番稼働中。移行完了まで **並行稼働** させる。触らない。
- Xサーバーには Claude Code が SSH 接続済み（フェーズ1で利用）。
- サーバー構成は Nginx + PM2。SaaS は使わない（コストゼロ方針）。
- 現行サイトの参考: `~/Desktop/30nen_pj`（WordPressテーマ。カテゴリー構造「度々の旅」親子対応済み）。
- **【将来の検討事項】プロジェクトの置き場所**：現在は `~/Desktop/30nen_next`（デスクトップ内）。macOS はデスクトップ/書類/ダウンロードを保護対象とするため、開発時に `node` から「デスクトップ内のファイルにアクセスしてよいか」の確認ダイアログが出る（「許可」でOK・安全）。煩わしくなったら、保護対象外の場所（例 `~/30nen_next`）へ移すと確認が出なくなる。**今すぐ移す必要はない**が、適切なタイミング（例：デプロイ準備の前など）で移動するか検討する。
- **【将来の検討事項】書き手向けの「投稿アプリ」化（スマホ/iPad）**：書き手みんなが毎日気軽に投稿できるよう、投稿画面をアプリのように使えるようにしたい、という要望あり（SAKIさん）。
  - **おすすめ＝① PWA（ホーム画面に追加）**：今のNext.jsに PWA の仕組みを少し足すだけで、スマホ/iPadのブラウザから「ホーム画面に追加」→アプリのアイコン化→アドレスバー無しの全画面で投稿できる。**App Store審査・年会費（Apple 年約99ドル）不要・追加コストほぼゼロ**でコストゼロ方針に合致。写真投稿・カメラ起動も可。**まずはこれで十分**。
  - ② 本物のネイティブアプリ（App Store/Google Play 配布）：React Native 等で作れるが、Apple Developer 年約99ドル＋ストア審査＋別アプリの保守が必要。①で足りなければ将来検討。
  - **着手タイミング**：投稿画面（`/admin`）が固まる頃＝デプロイ準備のあたりで PWA 対応を足すのがちょうどよい。今すぐは不要。
