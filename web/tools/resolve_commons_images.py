#!/usr/bin/env python3
"""Strict Wikimedia Commons resolver for repository image files.

Safety goal: wrong identity is worse than no historical image. This resolver
therefore accepts only high-confidence iconographic/religious matches whose
full distinctive identity is present in the Commons file title/description.
Ambiguous one-word identities are not auto-resolved. There is deliberately no
Wikipedia lead-image fallback.
"""
from __future__ import annotations
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, json, re, time, unicodedata, urllib.parse, urllib.request

ROOT=Path(__file__).resolve().parents[2]
RUNTIME=ROOT/'web/data/runtime-index.js'
MANIFEST=ROOT/'web/data/image-sources.json'
OUT=ROOT/'web/images/real-auto'
API='https://commons.wikimedia.org/w/api.php'
UA='Praying-Project/4.0 (+https://github.com/dedsec1121fk/Praying-Project; strict Commons identity resolver)'

parser=argparse.ArgumentParser()
parser.add_argument('--workers',type=int,default=3)
parser.add_argument('--limit',type=int,default=0)
parser.add_argument('--force',action='store_true')
args=parser.parse_args()

m=re.search(r'window\.ORTHODOX_ENTRIES=(\[.*\]);\}\)\(\);\s*$',RUNTIME.read_text(encoding='utf-8'),re.S)
if not m: raise SystemExit('Could not parse runtime-index.js')
entries=json.loads(m.group(1))
manifest=json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
OUT.mkdir(parents=True,exist_ok=True)

STOP={
 'saint','st','holy','righteous','venerable','blessed','martyr','great','greatmartyr','hieromartyr','new','apostle','evangelist','prophet','prophetess','patriarch','archangel','angel','the','of','and','son','daughter','father','mother','brother','lord','elder','metropolitan','bishop','abbot','abbess','king','queen','emperor','empress','priest','deacon','monk','nun','feast','synaxis','commemoration','venerable'
}
BAD={
 'logo','company','corporation','business','brand','product','advertisement','album','film','television','tv series','actor','actress','singer','rapper','musician','football','soccer','basketball','politician','president','prime minister','ceo','university','school','street','map','flag','coat of arms','seal','stamp','coin','banknote','website','software','app icon','trademark'
}
RELIGIOUS={
 'icon','ikon','orthodox','byzantine','fresco','mosaic','menologion','miniature','saint','apostle','prophet','martyr','archangel','theotokos','christ','biblical','scripture','righteous','monk','bishop','patriarch','church art','religious art'
}
ALLOWED_LICENSE=('public domain','cc0','cc by','cc-by','cc by-sa','cc-by-sa','pdm')
MIME_EXT={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}
AUTO_CATEGORIES={'christ','theotokos','angel','forefather','righteous','prophet','apostle','nt-saint','church-saint','feast'}

def norm(s:str)->str:
    s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower()
    s=re.sub(r'[^a-z0-9]+',' ',s)
    return re.sub(r'\s+',' ',s).strip()

def core_tokens(s:str):
    return [t for t in norm(s).split() if len(t)>=3 and t not in STOP]

def names(e):
    vals=[e.get('name',{}).get('en','')]
    vals += [a for a in (e.get('aliases') or []) if isinstance(a,str) and re.search('[A-Za-z]',a)]
    out=[]
    for v in vals:
        v=v.strip()
        if v and v not in out: out.append(v)
    return out

def safe_identity_phrases(e):
    out=[]
    for name in names(e):
        toks=core_tokens(name)
        if len(toks)>=2:
            out.append((name,toks))
    return out

def query_terms(e):
    qs=[]
    for name,toks in safe_identity_phrases(e)[:3]:
        phrase=' '.join(toks)
        qs += [f'"{name}" icon',f'"{phrase}" Orthodox icon']
    if e.get('category')=='feast':
        primary=(names(e) or [e['id'].replace('-',' ')])[0]
        qs.insert(0,f'"{primary}" Orthodox icon')
    seen=[]
    for q in qs:
        if q not in seen:seen.append(q)
    return seen[:4]

def api_json(params,retries=3):
    params=dict(params);params.update({'format':'json','formatversion':'2','origin':'*','maxlag':'5'})
    url=API+'?'+urllib.parse.urlencode(params)
    last=None
    for attempt in range(retries):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
            with urllib.request.urlopen(req,timeout=45) as r:return json.loads(r.read().decode('utf-8'))
        except Exception as ex:
            last=ex;time.sleep(.8*(attempt+1))
    raise last

def clean_html(s):return re.sub(r'<[^>]+>',' ',s or '')
def meta_value(meta,key):
    v=(meta or {}).get(key,{})
    return clean_html(v.get('value','')) if isinstance(v,dict) else ''

def license_ok(meta):
    lic=meta_value(meta,'LicenseShortName') or meta_value(meta,'UsageTerms')
    n=norm(lic)
    return lic if any(norm(x) in n for x in ALLOWED_LICENSE) else ''

def candidate(e,page):
    title=page.get('title','').replace('File:','')
    ii=(page.get('imageinfo') or [{}])[0]
    meta=ii.get('extmetadata') or {}
    lic=license_ok(meta);mime=ii.get('mime','')
    if not lic or mime not in MIME_EXT:return None
    title_n=norm(title)
    desc_n=norm(' '.join([meta_value(meta,'ImageDescription'),meta_value(meta,'ObjectName'),meta_value(meta,'Categories')]))
    hay=f'{title_n} {desc_n}'.strip()
    if any(b in hay for b in BAD):return None
    if not any(r in hay for r in RELIGIOUS):return None
    identities=safe_identity_phrases(e)
    if not identities:return None  # deliberately refuse ambiguous one-word identities
    best=None
    for raw,toks in identities:
        if not all(t in hay for t in toks):continue
        all_title=all(t in title_n for t in toks)
        phrase=' '.join(toks)
        phrase_hit=phrase in hay
        # Require especially strong evidence: all distinctive tokens in the title,
        # or the complete distinctive phrase in metadata plus an iconographic term.
        if not all_title and not phrase_hit:continue
        score=20 + (8 if all_title else 0) + (5 if phrase_hit else 0)
        if 'icon' in title_n or 'ikon' in title_n:score+=5
        if 'orthodox' in hay or 'byzantine' in hay:score+=3
        if best is None or score>best[0]:best=(score,ii,lic,title,meta,raw,toks)
    return best

def search_entry(e):
    qs=query_terms(e)
    if not qs:return None
    candidates=[]
    for q in qs:
        try:
            data=api_json({'action':'query','generator':'search','gsrnamespace':'6','gsrlimit':'8','gsrsearch':q,'prop':'imageinfo','iiprop':'url|mime|size|extmetadata','iiurlwidth':'640'})
        except Exception:
            continue
        for p in data.get('query',{}).get('pages') or []:
            sc=candidate(e,p)
            if sc:candidates.append((sc[0],p,sc,q))
    if not candidates:return None
    candidates.sort(key=lambda x:x[0],reverse=True)
    # Require the top candidate to be strong. If two different identities are tied
    # and neither title explicitly carries all tokens, fail closed.
    top=candidates[0]
    if top[0]<28:return None
    return top

def download(url,out):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'image/*,*/*;q=.5'})
    with urllib.request.urlopen(req,timeout=60) as r:
        data=r.read();ct=(r.headers.get('Content-Type') or '').lower()
    if len(data)<800 or not ct.startswith('image/'):raise RuntimeError(f'bad image response: {ct}, {len(data)} bytes')
    tmp=out.with_suffix(out.suffix+'.part');tmp.write_bytes(data);tmp.replace(out)
    return len(data)

def resolve_one(e):
    found=search_entry(e)
    if not found:return e['id'],None,'no strict exact-identity Commons match'
    _,page,sc,query=found
    score,ii,lic,title,meta,identity,toks=sc
    ext=MIME_EXT.get(ii.get('mime',''),'.jpg')
    local=f'web/images/real-auto/{e["id"]}{ext}'
    out=ROOT/local
    url=ii.get('thumburl') or ii.get('url')
    if not url:return e['id'],None,'candidate has no image URL'
    try:size=download(url,out)
    except Exception as ex:return e['id'],None,f'download failed: {ex}'
    page_title=page.get('title','File:'+title)
    source='https://commons.wikimedia.org/wiki/'+urllib.parse.quote(page_title.replace(' ','_'),safe=':(),_-\'')
    artist=meta_value(meta,'Artist') or meta_value(meta,'Credit')
    artist=clean_html(artist).strip()
    credit=f'{title} — Wikimedia Commons — {lic}'
    if artist and len(artist)<160:credit=f'{title} — {artist} — Wikimedia Commons — {lic}'
    item={
      'file':title,'remote':ii.get('url') or url,'local':local,'sourceUrl':source,'license':lic,
      'credit':{'en':credit,'el':credit},'autoResolved':True,
      'identityVerified':'strict-commons-title-metadata-v1','identityEvidence':{'matchedName':identity,'tokens':toks,'query':query,'score':score}
    }
    return e['id'],item,f'{size:,} bytes'

# Never preserve legacy loose auto-resolved mappings.
for eid in list(manifest):
    m=manifest[eid]
    if m.get('autoResolved') and m.get('identityVerified')!='strict-commons-title-metadata-v1':
        local=m.get('local')
        if local:
            try:(ROOT/local).unlink(missing_ok=True)
            except Exception:pass
        del manifest[eid]

missing=[]
for e in entries:
    if e.get('category') not in AUTO_CATEGORIES:continue
    existing=manifest.get(e['id'])
    if existing and existing.get('local') and not (args.force and existing.get('autoResolved')):continue
    if not safe_identity_phrases(e):continue
    missing.append(e)
if args.limit>0:missing=missing[:args.limit]
print(f'Strict Commons resolver: {len(entries)} entries; {len(manifest)} trusted mappings; {len(missing)} eligible exact-identity searches.')

resolved=0;unresolved=0
with ThreadPoolExecutor(max_workers=max(1,min(args.workers,4))) as pool:
    futs={pool.submit(resolve_one,e):e for e in missing}
    for i,f in enumerate(as_completed(futs),1):
        e=futs[f]
        try:eid,item,msg=f.result()
        except Exception as ex:eid,item,msg=e['id'],None,str(ex)
        if item:
            manifest[eid]=item;resolved+=1;print(f'[{i}/{len(missing)}] SAVED {eid}: {item["file"]}')
        else:
            unresolved+=1;print(f'[{i}/{len(missing)}] fallback {eid}: {msg}')
        if i%10==0:MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
remaining=[e['id'] for e in entries if e['id'] not in manifest]
report={'catalogEntries':len(entries),'trustedRepositoryImageMappings':len(manifest),'newStrictMatchesThisRun':resolved,'rejectedOrUnresolvedThisRun':unresolved,'remainingOnDedicatedIllustration':remaining}
(ROOT/'web/data/image-resolution-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Strict resolver finished: {resolved} new images; {unresolved} rejected/unresolved; {len(remaining)} remain on dedicated illustrations.')
