#!/usr/bin/env python3
"""Resolve and download reusable Wikimedia Commons images for catalog entries.

This is intentionally conservative. It keeps hand-curated mappings, searches
only entries still missing a repository image mapping, requires a reusable
license, scores the file title/description against the entry name/aliases, and
writes successful images into web/images/real-auto/. The website later uses
only those committed repository files, never the remote URLs directly.
"""
from __future__ import annotations
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, json, re, sys, time, urllib.parse, urllib.request, urllib.error

ROOT=Path(__file__).resolve().parents[2]
RUNTIME=ROOT/'web/data/runtime-index.js'
MANIFEST=ROOT/'web/data/image-sources.json'
OUT=ROOT/'web/images/real-auto'
API='https://commons.wikimedia.org/w/api.php'
WIKI_API='https://en.wikipedia.org/w/api.php'
UA='Praying-Project/3.0 (+https://github.com/dedsec1121fk/Praying-Project; Commons repository image resolver)'

parser=argparse.ArgumentParser()
parser.add_argument('--workers',type=int,default=4)
parser.add_argument('--limit',type=int,default=0,help='resolve at most N missing entries; 0 = all')
parser.add_argument('--force',action='store_true',help='also retry entries that already have an auto mapping')
args=parser.parse_args()

m=re.search(r'window\.ORTHODOX_ENTRIES=(\[.*\]);\}\)\(\);\s*$',RUNTIME.read_text(encoding='utf-8'),re.S)
if not m: raise SystemExit('Could not parse runtime-index.js')
entries=json.loads(m.group(1))
manifest=json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
OUT.mkdir(parents=True,exist_ok=True)

STOP={
 'saint','st','holy','righteous','venerable','blessed','martyr','great','greatmartyr','hieromartyr','new','apostle','evangelist','prophet','prophetess','patriarch','archangel','angel','the','of','and','son','daughter','father','mother','brother','lord','elder','metropolitan','bishop','abbot','abbess','king','queen','emperor','empress','priest','deacon','monk','nun','feast','synaxis','commemoration'
}
BAD_TITLE={'map','flag','coat of arms','logo','seal','stamp','coin','banknote','street','school','church exterior','cathedral exterior','monastery exterior','grave','tomb','reliquary only'}
ALLOWED_LICENSE=('public domain','cc0','cc by','cc-by','cc by-sa','cc-by-sa','pdm')
MIME_EXT={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}

def norm(s:str)->str:
    import unicodedata
    s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower()
    s=re.sub(r'[^a-z0-9]+',' ',s)
    return re.sub(r'\s+',' ',s).strip()

def core_tokens(s:str):
    return [t for t in norm(s).split() if len(t)>=3 and t not in STOP]

def entry_names(e):
    vals=[e.get('name',{}).get('en','')]
    vals += [a for a in (e.get('aliases') or []) if isinstance(a,str) and re.search('[A-Za-z]',a)]
    out=[]
    for v in vals:
        v=v.strip()
        if v and v not in out: out.append(v)
    return out

def query_terms(e):
    names=entry_names(e)
    primary=names[0] if names else e['id'].replace('-',' ')
    simple=' '.join(core_tokens(primary)) or primary
    cat=e.get('category','')
    qs=[]
    if cat=='feast':
        qs=[f'"{primary}" Orthodox icon',f'{simple} icon']
    elif cat=='angel':
        qs=[f'"{primary}" icon',f'{simple} Orthodox icon']
    elif cat=='biblical-context':
        qs=[f'"{primary}" biblical art',f'{simple} icon']
    else:
        qs=[f'"{primary}" icon',f'{simple} Orthodox icon']
    for a in names[1:3]: qs.append(f'"{a}" icon')
    seen=[]
    for q in qs:
        if q not in seen:seen.append(q)
    return seen[:3]

def api_json(params,retries=3):
    params=dict(params)
    params.update({'format':'json','formatversion':'2','origin':'*','maxlag':'5'})
    url=API+'?'+urllib.parse.urlencode(params)
    last=None
    for attempt in range(retries):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
            with urllib.request.urlopen(req,timeout=45) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as ex:
            last=ex; time.sleep(.7*(attempt+1))
    raise last

def clean_html(s):
    return re.sub(r'<[^>]+>',' ',s or '')

def metadata_value(meta,key):
    v=(meta or {}).get(key,{})
    return clean_html(v.get('value','')) if isinstance(v,dict) else ''

def license_ok(meta):
    lic=metadata_value(meta,'LicenseShortName') or metadata_value(meta,'UsageTerms')
    n=norm(lic)
    return lic if any(norm(x) in n for x in ALLOWED_LICENSE) else ''

def score_candidate(e,page):
    title=page.get('title','').replace('File:','')
    ii=(page.get('imageinfo') or [{}])[0]
    meta=ii.get('extmetadata') or {}
    lic=license_ok(meta)
    mime=ii.get('mime','')
    if not lic or mime not in MIME_EXT:return None
    hay=norm(' '.join([title,metadata_value(meta,'ImageDescription'),metadata_value(meta,'ObjectName')]))
    if any(x in hay for x in BAD_TITLE):return None
    best=-99
    best_ratio=0
    for name in entry_names(e):
        toks=core_tokens(name)
        if not toks:continue
        hits=sum(1 for t in toks if t in hay)
        ratio=hits/len(toks)
        s=ratio*10+hits
        if norm(name) and norm(name) in hay:s+=6
        best=max(best,s);best_ratio=max(best_ratio,ratio)
    if best<0:
        toks=core_tokens(e['id'].replace('-',' '));hits=sum(1 for t in toks if t in hay);best_ratio=hits/max(1,len(toks));best=best_ratio*10+hits
    # Need a meaningful identity match. Single distinctive-token names are okay;
    # multi-token names require at least half of the distinctive tokens.
    toks=core_tokens(entry_names(e)[0] if entry_names(e) else e['id'])
    min_ratio=.50 if len(toks)>=2 else 1.0
    if best_ratio<min_ratio:return None
    title_n=norm(title)
    if ' icon ' in f' {title_n} ' or 'ikon' in title_n or 'icon of' in title_n:best+=3
    if 'orthodox' in hay or 'byzantine' in hay:best+=2
    w=ii.get('width') or 0;h=ii.get('height') or 0
    if w and h and min(w,h)>=250:best+=1
    return best,ii,lic,title,meta

def search_entry(e):
    best=None
    for q in query_terms(e):
        try:
            data=api_json({
              'action':'query','generator':'search','gsrnamespace':'6','gsrlimit':'8','gsrsearch':q,
              'prop':'imageinfo','iiprop':'url|mime|size|extmetadata','iiurlwidth':'640'
            })
        except Exception:
            continue
        for p in (data.get('query',{}).get('pages') or []):
            sc=score_candidate(e,p)
            if sc and (best is None or sc[0]>best[0]):best=(sc[0],p,sc)
        if best and best[0]>=14:break
    if best is None:
        best=wikipedia_file_candidate(e)
    return best


def wikipedia_file_candidate(e):
    """Fallback: resolve the lead image of the closest English Wikipedia result,
    then verify that file's reusable license on Commons before accepting it.
    """
    names=entry_names(e)
    primary=names[0] if names else e['id'].replace('-',' ')
    params={
      'action':'query','format':'json','formatversion':'2','generator':'search',
      'gsrsearch':primary,'gsrnamespace':'0','gsrlimit':'3',
      'prop':'pageimages','piprop':'name|thumbnail','pithumbsize':'640','origin':'*'
    }
    url=WIKI_API+'?'+urllib.parse.urlencode(params)
    try:
        req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
        with urllib.request.urlopen(req,timeout=45) as r:data=json.loads(r.read().decode('utf-8'))
    except Exception:
        return None
    wanted=core_tokens(primary)
    for page in (data.get('query',{}).get('pages') or []):
        ptitle=norm(page.get('title',''))
        hits=sum(1 for t in wanted if t in ptitle)
        if wanted and hits/max(1,len(wanted)) < (.5 if len(wanted)>=2 else 1.0):
            continue
        fname=page.get('pageimage')
        if not fname:continue
        try:
            c=api_json({'action':'query','titles':'File:'+fname,'prop':'imageinfo','iiprop':'url|mime|size|extmetadata','iiurlwidth':'640'})
        except Exception:
            continue
        pages=c.get('query',{}).get('pages') or []
        if not pages:continue
        cp=pages[0]
        sc=score_candidate(e,cp)
        if sc:return (sc[0]+1.5,cp,sc)
    return None

def download(url,out):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'image/*,*/*;q=.5'})
    with urllib.request.urlopen(req,timeout=60) as r:
        data=r.read();ct=(r.headers.get('Content-Type') or '').lower()
    if len(data)<800 or not ct.startswith('image/'):raise RuntimeError(f'bad image response: {ct}, {len(data)} bytes')
    tmp=out.with_suffix(out.suffix+'.part');tmp.write_bytes(data);tmp.replace(out)
    return len(data)

def resolve_one(e):
    found=search_entry(e)
    if not found:return e['id'],None,'no safe Commons match'
    _,page,sc=found
    _,ii,lic,title,meta=sc
    ext=MIME_EXT.get(ii.get('mime',''),'.jpg')
    local=f'web/images/real-auto/{e["id"]}{ext}'
    out=ROOT/local
    url=ii.get('thumburl') or ii.get('url')
    if not url:return e['id'],None,'candidate has no image URL'
    try:size=download(url,out)
    except Exception as ex:return e['id'],None,f'download failed: {ex}'
    page_title=page.get('title','File:'+title)
    source='https://commons.wikimedia.org/wiki/'+urllib.parse.quote(page_title.replace(' ','_'),safe=':(),_-')
    artist=metadata_value(meta,'Artist') or metadata_value(meta,'Credit')
    credit_base=clean_html(artist).strip()
    credit_en=f'{title} — Wikimedia Commons — {lic}'
    if credit_base and len(credit_base)<160:credit_en=f'{title} — {credit_base} — Wikimedia Commons — {lic}'
    item={
      'file':title,
      'remote':ii.get('url') or url,
      'local':local,
      'sourceUrl':source,
      'license':lic,
      'credit':{'en':credit_en,'el':credit_en},
      'autoResolved':True
    }
    return e['id'],item,f'{size:,} bytes'

missing=[]
for e in entries:
    # Psalms, parables, and Scripture-story cards intentionally use the bundled
    # local artwork. The resolver focuses network work on people, saints,
    # heavenly beings, feasts, and biblical-context figures where a real image
    # can meaningfully correspond to the entry.
    if e.get('category') in {'psalm','parable','scripture-story'}:
        continue
    existing=manifest.get(e['id'])
    if existing and existing.get('local') and not (args.force and existing.get('autoResolved')):
        continue
    missing.append(e)
if args.limit>0:missing=missing[:args.limit]
print(f'Commons resolver: {len(entries)} catalog entries; {len(manifest)} existing mappings; {len(missing)} to search.')
if not missing:raise SystemExit(0)

resolved=0;unresolved=0
with ThreadPoolExecutor(max_workers=max(1,min(args.workers,6))) as pool:
    futs={pool.submit(resolve_one,e):e for e in missing}
    for i,f in enumerate(as_completed(futs),1):
        e=futs[f]
        try:eid,item,msg=f.result()
        except Exception as ex:eid,item,msg=e['id'],None,str(ex)
        if item:
            manifest[eid]=item;resolved+=1
            print(f'[{i}/{len(missing)}] SAVED {eid}: {item["file"]} ({msg})')
        else:
            unresolved+=1
            print(f'[{i}/{len(missing)}] no match {eid}: {msg}')
        # Save progress frequently so interruption does not lose completed work.
        if i%10==0:
            MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
remaining=[e['id'] for e in entries if e['id'] not in manifest]
report={
  'catalogEntries':len(entries),
  'repositoryImageMappings':len(manifest),
  'newlyResolvedThisRun':resolved,
  'unresolvedThisRun':unresolved,
  'remainingWithoutRealRepositoryImage':remaining
}
(ROOT/'web/data/image-resolution-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Commons resolver finished: {resolved} new repository images; {unresolved} kept on local illustrated fallback; total mappings {len(manifest)}.')
print(f'Remaining without a reusable real repository image: {len(remaining)}. Report: web/data/image-resolution-report.json')
