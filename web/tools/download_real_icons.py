#!/usr/bin/env python3
"""Download verified reusable iconography into the repository.

The website itself never needs the network for images after this has run and the
resulting files are committed. Every successful download is written under the
manifest's `local` path (normally web/images/real/...).
"""
from __future__ import annotations
import argparse, json, pathlib, sys, time, urllib.request, urllib.error

ROOT=pathlib.Path(__file__).resolve().parents[2]
MANIFEST=ROOT/'web/data/image-sources.json'
UA='Praying-Project/2.0 (+https://github.com/dedsec1121fk/Praying-Project; repository-image-cache)'

parser=argparse.ArgumentParser()
parser.add_argument('--strict', action='store_true', help='exit nonzero if any verified image fails')
parser.add_argument('--retries', type=int, default=3)
args=parser.parse_args()

items=json.loads(MANIFEST.read_text(encoding='utf-8'))
ok=exists=fail=skip=0
failed=[]

def looks_like_image(data:bytes, content_type:str)->bool:
    ct=(content_type or '').lower()
    if ct.startswith('image/'):
        return True
    return (
        data.startswith(b'\xff\xd8\xff') or
        data.startswith(b'\x89PNG\r\n\x1a\n') or
        data.startswith((b'GIF87a',b'GIF89a')) or
        data.startswith(b'RIFF') or
        data.lstrip().startswith(b'<svg')
    )

for i,(entry,m) in enumerate(items.items(),1):
    local=m.get('local'); remote=m.get('remote')
    if not local or not remote:
        print(f'[{i}/{len(items)}] SKIP    {entry}: incomplete local/remote mapping')
        skip+=1
        continue
    out=ROOT/local
    out.parent.mkdir(parents=True,exist_ok=True)
    if out.exists() and out.stat().st_size>500:
        print(f'[{i}/{len(items)}] EXISTS  {entry}: {out.relative_to(ROOT)} ({out.stat().st_size:,} bytes)')
        exists+=1
        continue
    error=None
    for attempt in range(1,max(1,args.retries)+1):
        req=urllib.request.Request(remote,headers={
            'User-Agent':UA,
            'Accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Cache-Control':'no-cache',
        })
        try:
            with urllib.request.urlopen(req,timeout=60) as r:
                data=r.read()
                content_type=r.headers.get('Content-Type','')
            if len(data)<500:
                raise RuntimeError(f'file too small ({len(data)} bytes)')
            if not looks_like_image(data,content_type):
                raise RuntimeError(f'not an image (Content-Type {content_type!r})')
            tmp=out.with_suffix(out.suffix+'.part')
            tmp.write_bytes(data)
            tmp.replace(out)
            print(f'[{i}/{len(items)}] SAVED   {entry}: {out.relative_to(ROOT)} ({len(data):,} bytes)')
            ok+=1; error=None
            time.sleep(.12)
            break
        except Exception as ex:
            error=ex
            if attempt<max(1,args.retries):
                print(f'[{i}/{len(items)}] RETRY  {entry}: attempt {attempt} failed: {ex}',file=sys.stderr)
                time.sleep(1.0*attempt)
    if error is not None:
        fail+=1; failed.append((entry,str(error)))
        print(f'[{i}/{len(items)}] FAILED  {entry}: {error}',file=sys.stderr)

print(f'Finished: {ok} downloaded, {exists} already present, {skip} skipped, {fail} failed.')
if failed:
    print('Failed entries:',file=sys.stderr)
    for entry,error in failed: print(f'  - {entry}: {error}',file=sys.stderr)
    print('The site will use its bundled repository fallback artwork for those entries.',file=sys.stderr)
raise SystemExit(1 if args.strict and fail else 0)
