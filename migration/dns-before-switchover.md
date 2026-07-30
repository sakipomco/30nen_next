# 切替前のDNS設定の控え（2026-07-28 取得）

> **これは何のためのファイル？**
> 7/29のドメイン切替がうまくいかなかった時、**元に戻すための「正解」**です。
> Xサーバーの画面で撮ったスクショと合わせて、二重の控えとして残します。
> 切り戻しの手順は `switchover-runbook.md` §7。

## ⚠️ まず最初に：設定画面が2つあるので注意

`30nen.com` のDNS設定画面は**2種類あり、片方は見た目そっくりだが効きません**。

| | 担当のサーバー | レコード数 | 使う？ |
|---|---|---|---|
| **サーバーパネル**（レンタルサーバー本体） | `ns1〜5.xserver.jp` | 17行 | ✅ **こっちが本物** |
| Xserverアカウント側のDNS設定 | `ns1〜3.xdomain.ne.jp` | 4行（NS×3＋SOA） | ❌ 使われていない |

`.com` の上位サーバーが答える正式な委任先は **`ns1〜5.xserver.jp`** です（2026-07-28 確認）。
**間違った方を編集しても何も起きません。** 1時間待っても `dig` の結果が変わらず、原因不明で時間を溶かします。

**正しい画面へのたどり着き方**:
Xserverアカウントにログイン → 契約一覧の **「サーバー管理」** ボタン → サーバーパネル
→ 左メニュー **「ドメイン」** → **「DNSレコード設定」** → `30nen.com` を選択 → **「DNSレコード一覧」**

**見分け方**: 行数が十数行あり、`162.43.121.89` のAレコードが見える＝正しい画面。4行しかない＝ハズレ。

---

## 明日書き換える2行（＝切り戻しで戻す2行）

| ホスト名 | 種別 | 切替前の値（＝**戻す先**） | 切替後の値 | TTL | 優先度 |
|---------|------|--------------------------|-----------|-----|-------|
| `30nen.com` | A | **`162.43.121.89`** | `162.43.43.144` | 3600 | 0 |
| `www.30nen.com` | A | **`162.43.121.89`** | `162.43.43.144` | 3600 | 0 |

- `162.43.121.89` … 旧サイト（Xserver・現行WordPress／ホスト名 `sv14288.xserver.jp`）
- `162.43.43.144` … 新サイト（VPS）

**この2行以外は一切触らない。** 特にMX・TXT・send系を消すとメールが止まります。

---

## 全17レコードの控え（2026-07-28 時点）

### Aレコード

| ホスト名 | 種別 | 内容 | TTL | 優先度 |
|---------|------|------|-----|-------|
| `30nen.com` | A | `162.43.121.89` | 3600 | 0 |
| `www.30nen.com` | A | `162.43.121.89` | 3600 | 0 |
| `*.30nen.com` | A | `162.43.121.89` | 3600 | 0 |
| `new.30nen.com` | A | `162.43.43.144` | 3600 | 0 |

`*.30nen.com` は**ワイルドカード**＝「個別に設定していないサブドメインは全部ここ」という受け皿。
明日はこれを**触らない**ので、`send` 系など個別設定のないものは旧サーバーのまま残る（＝メール無事）。

### ネームサーバー（絶対に触らない）

`30nen.com` NS → `ns1.xserver.jp` / `ns2` / `ns3` / `ns4` / `ns5`（各 TTL 3600・優先度 0）

### メール受信（`info@30nen.com` など・触らない）

> ## 🚨 訂正（2026-07-30）— この節の「触らないからメールは無事」は**誤り**でした
>
> **MXの内容が `30nen.com` 自身を指している**ため、切替で `30nen.com` のAレコードを
> 新サーバーへ向けた瞬間、**メールの配達先も新サーバーに移りました**。
> 新サーバー（162.43.43.144）にはメールを受ける仕組みが無いので、
> **`@30nen.com` 宛のメールは届かない状態**です（2026-07-29 の切替以降）。
>
> ```
> MX: 30nen.com  →  「30nen.com のAレコード」を見にいく
> 　　　　　　　　　  切替前: 162.43.121.89（Xサーバー＝メール本体）
> 　　　　　　　　　  切替後: 162.43.43.144（新VPS＝メールサーバー無し）
> ```
>
> **確認済みの事実**: 旧サーバー162.43.121.89 は `220 sv14288.xserver.jp ESMTP Postfix`
> を返す＝メール本体はそちら。新VPSは 25/465/587 いずれも待ち受け無し。
>
> **✅ 修正済み（2026-07-30・SAKIが画面操作）**。MXの「内容」を
> `30nen.com` → **`the30nen.xsrv.jp`**（＝162.43.121.89・旧サーバーのメール本体）に変更。
> これで `@30nen.com` 宛のメールは元どおり旧サーバーの郵便受けに届く。
> ※ `send.send.30nen.com` のMX（Resend用・優先度10）は**別物なので触っていない**。
> ※ サイトのAレコード（`30nen.com` / `www` → 162.43.43.144）も**変更なし**＝サイトに影響なし。
>
> **調べたうえでの判断**: サイトの機能は `@30nen.com` を使っていないため、直さなくても
> 動作に影響は無かった（お便りフォームの届け先＝書き手・店主の個人アドレス／
> サイトからの送信元＝`noreply@send.30nen.com`）。それでも直したのは、
> **「気づかないうちに届かなくなっている」状態を残さないため**
> （送信者にはエラーが返るが、こちらには何の知らせも来ない）。
>
> **教訓**: 「MXを触らなければメールは無事」は**MXが別ホストを指している場合の話**。
> **MXが自分自身のドメインを指しているときは、Aレコードを変えると巻き添えになる**。
> 次回ドメインを移すときは、**MXの中身が何を指しているか**を必ず先に確認する。

| ホスト名 | 種別 | 内容 | TTL | 優先度 |
|---------|------|------|-----|-------|
| `30nen.com` | MX | `30nen.com` | 3600 | 0 |
| `30nen.com` | TXT | `v=spf1 +a:sv14288.xserver.jp +a:30nen.com +mx include:spf.sender.xserver.jp ~all` | 3600 | 0 |
| `_dmarc.30nen.com` | TXT | `v=DMARC1; p=none;` | 3600 | 0 |
| `_adsp._domainkey.30nen.com` | TXT | `dkim=unknown` | 3600 | 0 |

`default._domainkey.30nen.com` TXT（Xserverの署名鍵・TTL 3600・優先度 0）
※画面上は「DKIM設定から削除できます」と表示され、通常の削除ボタンがない
```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuGfk30mYzeqyj7KUSXMGm2x2TF2fbTMhOWRJha+/aSZCYCdx5stVGS3YXMYe2iT5bQ/PpksJ5370HjisvrwZl52DWOIycpEDrpYtwBClGUbhaChZXFKqD6cfbp6Hh57MnYkE8vEbbT52BeaXOMVAbu2Dd9EVnI2jifKM3zR6ZTPym2Y0jWRtvyICfR2okmi5hyWRpH9TadBbcyXsOgGyT6S9SBxMWmOSPpXr9LCcpWsWsh1zaB0ehlz/ynJHoOJYqN6lZmzJWUmGh20mdLoBjhd6tnxiK87T/sYhXCRK3YyCha9p14XhqwPXJ54pVpwk3TVTCRzhyYktAdK0JjDIjQIDAQAB
```

### Resend（サイトからのお知らせメール送信・触らない）

| ホスト名 | 種別 | 内容 | TTL | 優先度 |
|---------|------|------|-----|-------|
| `send.send.30nen.com` | MX | `feedback-smtp.ap-northeast-1.amazonses.com` | 3600 | **10** |
| `send.send.30nen.com` | TXT | `v=spf1 include:amazonses.com ~all` | 3600 | 0 |

`resend._domainkey.send.30nen.com` TXT（Resendの署名鍵・TTL 3600・優先度 0）
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtBtQNWv6KO08QUidOIixVM/he6k7jtvE+4IYWnFDkdRtU+IVnDztoS35kCYgcEL/fManUDKujk2GmyyFtaOFTv7Pgjz3x7toCqr0REW6CC9/BAHBvurslLw5Pr/FHojiGDEdStQCH+zheg66xY4wInze2UxrImY1BW3cdhB5fgQIDAQAB
```

※長い鍵の値は画面から書き写したものではなく、DNSから直接取得した正確な値です。

---

## 📌 切替後に直したい点（今日は触らない）

**Resendのメール設定に、ホスト名の重複がある。**

`send.send.30nen.com` となっており、本来は `send.30nen.com` であるべきです
（設定画面がドメイン名を自動で足すため、`send.30nen.com` と入力して二重になったと思われる）。

- 実害の確認: メール送信自体は動いている（招待メールは届いている）。
  署名鍵（DKIM）だけは正しい場所 `resend._domainkey.send.30nen.com` にあるため。
- 影響: 送信元の証明（SPF）とバウンス通知の受け口が本来の位置にないため、
  **迷惑メール判定されやすくなる可能性**がある。DMARCが `p=none` なので拒否まではされない。
- **対応は切替後に**。切替前夜にDNSを触ると切替そのものが危うくなるため、今は現状維持。
  直す場合はResendの管理画面で必要なレコードを確認してから。

---

## 確認のしかた

切替後、下記が `162.43.43.144` を返せば成功：

```bash
dig +short 30nen.com
dig +short www.30nen.com
```

切り戻した場合は `162.43.121.89` に戻ります（反映に数分〜1時間）。
