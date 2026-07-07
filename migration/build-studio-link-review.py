#!/usr/bin/env python3
# STUDIO時代のリンク切れ「繋ぎ直し」用の確認シートを生成する。
#  入力: migration/export/all-posts.json, all-categories.tsv / migration/series-map.csv, author-map.csv
#  出力: migration/studio-link-review.html（ダブルクリックで開く・サーバー不要）
#  各リンク切れに対し「連載ヒント＋日付＋リンクの文字」で候補を1〜3件自動抽出し、
#  リンク周辺の文章も表示。候補に正解が無ければ検索して自分で選べる欄つき。
import json, re, collections, csv, math, urllib.parse, html
from datetime import date

BASE='/Users/suzukisaki/Desktop/30nen_next/migration'
EXP=BASE+'/export'
posts=json.load(open(EXP+'/all-posts.json'))
by_id={int(p['ID']):p for p in posts}
pub=[p for p in posts if p.get('post_status')=='publish']

post_series={}; series_posts=collections.defaultdict(list)
for row in csv.reader(open(EXP+'/all-categories.tsv'), delimiter='\t'):
    if len(row)>=4:
        pid=int(row[0]); post_series[pid]=row[3]; series_posts[row[3]].append(pid)
series_sorted={s:sorted((i for i in ids if i in by_id), key=lambda i:(by_id[i]['post_date'],i)) for s,ids in series_posts.items()}

series_name={}
for row in csv.DictReader(open(BASE+'/series-map.csv')):
    series_name[row['slug']]=row['連載名']

prefix_series={'kakinumamegane':'kakinumamegane-tokyo','shima':'shimashima','emi':'gokigennamainichi',
 'gu':'nayatane','Ryoko':'ephemera','rratbt':'watashinoreshihen'}
name_series=[('サイコ','1-10957'),('saico','1-10957'),('海秋紗','kazehayasoushi'),('風早草子','kazehayasoushi'),
 ('emi','gokigennamainichi'),('ソフィ','sophys_philosophy'),('sophy','sophys_philosophy'),
 ('ぴんぽいんと','nochinonora'),('とこ','toconotobira'),('ぐっさん','nayatane')]

def series_of(pid): return post_series.get(pid)
def dslug(p): return urllib.parse.unquote(p['post_name'])

# 一般的すぎて手がかりにならない語（題名一致のノイズになるので除外）
GENERIC=set('日記 にっき 昨日 きのう 今日 きょう この日 その日 これ それ あれ 話 はなし 記事 件 こと 続き 前回 先日 過去 その2 その１ その一 コレ ここ'.split())

def to_date(s):
    try: return date(*map(int,s[:10].split('-')))
    except: return None

# リンク抽出（周辺文章つき）。slug -> {texts:[], occ:[(src_id, before, anchor, after)]}
# 近接リンクを取りこぼさないよう、リンク自体は単純な正規表現で全部拾い、
# 周辺文章はマッチ位置の前後を本文から切り出す（前後110字）。
a_re=re.compile(r'<a\b[^>]*href=(["\'])(https?://(?:https://)?30nen\.com/posts/([^"\'?#/]*))[^"\']*\1[^>]*>(.*?)</a>', re.I|re.S)
def strip(t): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',t)).strip()
links=collections.defaultdict(lambda:{'texts':[], 'occ':[]})
for p in posts:
    c=p.get('post_content','') or ''
    for m in a_re.finditer(c):
        slug=urllib.parse.unquote(m.group(3).rstrip('/'))
        anchor=strip(m.group(4))
        before=strip(c[max(0,m.start()-110):m.start()])
        after=strip(c[m.end():m.end()+110])
        if anchor not in links[slug]['texts']: links[slug]['texts'].append(anchor)
        links[slug]['occ'].append((int(p['ID']), before, anchor, after))

def kws_of(texts):
    out=[]
    for text in texts:
        t=re.sub(r'(さんが書いていた|さんが書いている|について書いていて|について書いている|さんの日記|さんの記事|さんちの|さんの|の日記|の記事|の話)','',text)
        t=re.sub(r'[「」『』”"’\'、。・！!？?→↓（）\(\)\s]','',t).strip()
        if len(t)>=2 and t not in GENERIC: out.append(t)
    return out

def series_hint(slug, texts):
    h=set()
    for pre,s in prefix_series.items():
        if slug.startswith(pre): h.add(s)
    if re.fullmatch(r'\d+_10957', slug): h.add('1-10957')
    for nm,s in name_series:
        if any(nm in t for t in texts): h.add(s)
    return h

def ordinal_of(slug):
    if re.fullmatch(r'\d+_10957', slug): return int(slug.split('_')[0])
    m=re.search(r'(\d{3,5})$', slug)
    if m and not re.search(r'\d{6}', slug): return int(m.group(1))
    return None

def score(slug, info):
    texts=info['texts']; srcs=[o[0] for o in info['occ']]
    hints=series_hint(slug,texts); ordn=ordinal_of(slug)
    sdates=sorted(by_id[i]['post_date'] for i in srcs if i in by_id)
    sdate=to_date(sdates[len(sdates)//2]) if sdates else None
    kws=kws_of(texts)
    cands=[]
    for p in pub:
        pid=int(p['ID'])
        if pid in srcs: continue           # リンク元記事自身は候補から除外
        sc=0; title=p['post_title']; content=p.get('post_content','') or ''; ps=series_of(pid)
        titlematch=False
        for k in kws:
            if k in title: sc+=100; titlematch=True
            elif k in content: sc+=40
        if hints and ps in hints: sc+=35
        if sdate:
            d1=to_date(p['post_date'])
            if d1:
                dd=(sdate-d1).days              # 正=リンク元より前（自然）
                w = 60 if not kws else 22       # 手がかりが弱いときは日付を重視
                sc += max(0, w-dd*(w/25)) if dd>=0 else max(0, 10-abs(dd)*0.3)
        if ordn and ps in hints and ps in series_sorted and pid in series_sorted[ps]:
            k=series_sorted[ps].index(pid)+1; sc+=20*math.exp(-abs(k-ordn)/3)
        if sc>5: cands.append((round(sc,1),pid,titlematch))
    cands.sort(reverse=True)
    return hints, cands[:3]

items=[]
for slug,info in links.items():
    hints,cands=score(slug,info)
    conf=False
    if cands:
        top=cands[0]; gap=top[0]-(cands[1][0] if len(cands)>1 else 0)
        conf = top[2] and top[0]>=120 and (len(cands)==1 or gap>=35)
    items.append({'slug':slug,'texts':info['texts'],'occ':info['occ'],'cands':cands,'conf':conf})
items.sort(key=lambda x:(x['conf'], -(x['cands'][0][0] if x['cands'] else 0)))

def liveurl_slug(s): return 'https://new.30nen.com/posts/'+urllib.parse.quote(s)
def liveurl(pid): return liveurl_slug(dslug(by_id[pid]))
def esc(s): return html.escape(s)

# 全公開記事の検索用データ（自分で選ぶ欄で使う）
search_data=[{'s':dslug(p),'t':p['post_title'],'d':p['post_date'][:10],'c':series_name.get(series_of(int(p['ID'])),'')} for p in pub]

conf_n=sum(1 for x in items if x['conf'])
rows=[]
for i,it in enumerate(items):
    src=it['occ'][0][0]; srcp=by_id.get(src)
    srctitle=esc(srcp['post_title'][:30]) if srcp else '?'
    srcdate=srcp['post_date'][:10] if srcp else ''
    srcurl=liveurl(src) if srcp else '#'
    anchor=esc(' / '.join(it['texts'])[:80]) or '（文字なし）'
    badge='<span class="badge ok">ほぼ確実</span>' if it['conf'] else '<span class="badge chk">要確認</span>'
    # リンク周辺の文章（最初の1箇所）
    b,a=esc(it['occ'][0][1]), esc(it['occ'][0][2]); af=esc(it['occ'][0][3])
    ctx=f'<div class="around">…{b}<mark>{a}</mark>{af}…</div>'
    cand_html=[]
    for j,(sc,pid,tm) in enumerate(it['cands']):
        p=by_id[pid]; sn=series_name.get(series_of(pid),'')
        checked='checked' if j==0 else ''
        cand_html.append(f'''<label class="cand"><input type="radio" name="q{i}" value="{esc(dslug(p))}" {checked}>
      <span class="ct">{esc(p['post_title'][:40])}</span>
      <span class="meta">{p['post_date'][:10]}・{esc(sn)}</span>
      <a href="{liveurl(pid)}" target="_blank" rel="noopener">記事を開く↗</a></label>''')
    none_checked='checked' if not it['cands'] else ''
    cand_html.append(f'<label class="cand none"><input type="radio" name="q{i}" value="__NONE__" {none_checked}>該当なし / あとで</label>')
    # 自分で選ぶ欄
    manual=f'''<div class="manual">
      <label class="cand pick" style="display:none"><input type="radio" name="q{i}" value="" data-manual>
        <span class="ct pickt">（自分で選んだ記事）</span><a class="picka" href="#" target="_blank" rel="noopener">記事を開く↗</a></label>
      <details><summary>候補に無い→自分で記事を探す</summary>
        <input class="search" type="search" placeholder="題名の一部を入力（例：流しそうめん）" data-q="{i}">
        <div class="results"></div>
      </details>
    </div>'''
    rows.append(f'''<div class="item {'conf' if it['conf'] else ''}" data-slug="{esc(it['slug'])}">
    <div class="head">{badge} <code>/posts/{esc(it['slug'])}</code></div>
    <div class="ctx">リンクの文字：<b>{anchor}</b><br>
      <span class="src">貼られている記事：<a href="{srcurl}" target="_blank" rel="noopener">{srctitle}↗</a>（{srcdate}に書かれた）</span>
      {ctx}</div>
    <div class="cands">{''.join(cand_html)}</div>
    {manual}
  </div>''')

doc='''<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>STUDIOリンク繋ぎ直し 確認シート</title>
<style>
body{font-family:-apple-system,"Hiragino Sans",sans-serif;margin:0;background:#f6f5f2;color:#222;line-height:1.6}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e3de;padding:14px 18px;z-index:10}
header h1{font-size:16px;margin:0 0 6px}
.sub{font-size:13px;color:#666}
.wrap{max-width:780px;margin:0 auto;padding:16px}
.item{background:#fff;border:1px solid #e5e3de;border-radius:10px;padding:14px 16px;margin:12px 0}
.item.conf{background:#fbfdf9}
.head code{font-size:12px;color:#888}
.badge{font-size:11px;padding:2px 8px;border-radius:20px;margin-right:8px}
.badge.ok{background:#e5f3e0;color:#3a7a2a}
.badge.chk{background:#fdeee0;color:#b06a1a}
.ctx{margin:8px 0;font-size:14px}
.ctx .src{font-size:12px;color:#777}
.around{margin-top:6px;font-size:12.5px;color:#555;background:#f4f2ee;border-radius:6px;padding:7px 10px}
.around mark{background:#ffe08a;padding:0 2px;border-radius:3px}
.cands{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.cand{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #eceae5;border-radius:8px;cursor:pointer;font-size:14px}
.cand:hover{background:#f4f2ee}
.cand input{flex:none}
.cand .ct{font-weight:600}
.cand .meta{font-size:11px;color:#888}
.cand a{margin-left:auto;font-size:12px;color:#2a6db0;white-space:nowrap}
.cand.none{color:#999;font-size:13px}
.cand.pick{border-color:#3a7a2a;background:#eef7ea}
.manual{margin-top:6px}
.manual summary{font-size:12.5px;color:#2a6db0;cursor:pointer}
.search{width:100%;box-sizing:border-box;margin-top:6px;padding:7px 9px;border:1px solid #cfccc5;border-radius:7px;font:inherit}
.results{max-height:220px;overflow:auto;margin-top:4px}
.results .r{padding:6px 9px;border:1px solid #eee;border-radius:6px;margin-top:4px;cursor:pointer;font-size:13px}
.results .r:hover{background:#eef7ea}
.results .r .rt{font-weight:600}
.results .r .rm{font-size:11px;color:#888;margin-left:6px}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
button{font:inherit;padding:8px 16px;border-radius:8px;border:1px solid #cfccc5;background:#fff;cursor:pointer}
button.primary{background:#3a7a2a;color:#fff;border-color:#3a7a2a}
#count{font-size:13px;color:#555}
.filter{font-size:13px}
</style></head><body>
<header><div class="wrap">
  <h1>STUDIOリンク 繋ぎ直し 確認シート</h1>
  <div class="sub">全__N__件。各リンクとも一番あやしい候補を<b>仮選択済み</b>です。「記事を開く↗」で中身を確認し、合っていればそのまま／違えば正しい候補を選び直してください。灰色の枠の<b>リンク周辺の文章</b>が判断のヒントです。候補3件に正解が無いときは「<b>自分で記事を探す</b>」から題名で検索して選べます。上=要確認／下=ほぼ確実（__C__件）。最後に〈結果を保存〉。</div>
  <div class="bar" style="margin-top:10px">
    <label class="filter"><input type="checkbox" id="onlychk"> 「要確認」だけ表示</label>
    <span id="count"></span>
    <button class="primary" onclick="save()">結果を保存（ダウンロード）</button>
  </div>
</div></header>
<div class="wrap" id="list">
__ROWS__
</div>
<script>
const DATA=__SEARCH__;
const KEY='studio-link-review';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
function persist(){const d={};document.querySelectorAll('.item').forEach((it,i)=>{const c=it.querySelector('input[name=q'+i+']:checked');if(c)d[it.dataset.slug]=c.value});localStorage.setItem(KEY,JSON.stringify(d));count()}
function setManual(it,i,slug,title,date,cat){const r=it.querySelector('input[data-manual]');r.value=slug;const lab=r.closest('.pick');lab.style.display='';lab.querySelector('.pickt').textContent=title+'（'+date+'・'+cat+'）';lab.querySelector('.picka').href='https://new.30nen.com/posts/'+encodeURIComponent(slug);r.checked=true;persist()}
function restore(){const d=load();document.querySelectorAll('.item').forEach((it,i)=>{const v=d[it.dataset.slug];if(!v)return;let el=it.querySelector('input[name=q'+i+'][value="'+CSS.escape(v)+'"]');if(el){el.checked=true}else if(v!=='__NONE__'){const m=DATA.find(x=>x.s===v);if(m)setManual(it,i,m.s,m.t,m.d,m.c)}})}
function count(){let done=0,tot=document.querySelectorAll('.item').length;document.querySelectorAll('.item').forEach((it,i)=>{const c=it.querySelector('input[name=q'+i+']:checked');if(c&&c.value!=='__NONE__'&&c.value!=='')done++});document.getElementById('count').textContent=done+' / '+tot+' 件 選択済み'}
function save(){persist();const d=load();const rows=[['old_slug','new_slug']];document.querySelectorAll('.item').forEach((it,i)=>{const v=d[it.dataset.slug];if(v&&v!=='__NONE__'&&v!=='')rows.push([it.dataset.slug,v])});const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\\n');const b=new Blob(['\\ufeff'+csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='studio-link-map.csv';a.click()}
let timer;
document.addEventListener('input',e=>{if(!e.target.classList.contains('search'))return;const i=+e.target.dataset.q;const it=e.target.closest('.item');const box=it.querySelector('.results');const q=e.target.value.trim();clearTimeout(timer);timer=setTimeout(()=>{if(q.length<1){box.innerHTML='';return}const ql=q.toLowerCase();const hits=DATA.filter(x=>x.t.toLowerCase().includes(ql)).slice(0,15);box.innerHTML=hits.map(x=>'<div class="r" data-s="'+encodeURIComponent(x.s)+'"><span class="rt">'+x.t.replace(/</g,'&lt;')+'</span><span class="rm">'+x.d+'・'+x.c+'</span></div>').join('')||'<div class="rm" style="padding:6px">見つかりません</div>';box.querySelectorAll('.r').forEach(r=>r.addEventListener('click',()=>{const s=decodeURIComponent(r.dataset.s);const m=DATA.find(x=>x.s===s);setManual(it,i,m.s,m.t,m.d,m.c);box.innerHTML=''}))},150)})
document.addEventListener('change',e=>{if(e.target.name)persist();if(e.target.id==='onlychk'){document.querySelectorAll('.item.conf').forEach(x=>x.style.display=e.target.checked?'none':'')}});
restore();count();
</script></body></html>'''
doc=doc.replace('__N__',str(len(items))).replace('__C__',str(conf_n)).replace('__ROWS__','\n'.join(rows)).replace('__SEARCH__',json.dumps(search_data,ensure_ascii=False))
open(BASE+'/studio-link-review.html','w').write(doc)
print('生成:', BASE+'/studio-link-review.html')
print('総リンク数:', len(items), '/ ほぼ確実:', conf_n, '/ 検索用記事数:', len(search_data))
