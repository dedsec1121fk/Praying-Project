#!/usr/bin/env python3
"""Generate one lightweight local illustrative icon for every runtime record.

These are intentionally NOT presented as historical/canonical icon reproductions.
Venerated figures receive a halo-style medallion; context-only figures do not.
The resulting SVGs guarantee complete offline coverage, and a compact WebP atlas
is built for fast startup painting.
"""
from pathlib import Path
import json, re, html, io
from PIL import Image
import cairosvg

ROOT=Path(__file__).resolve().parents[2]
RUNTIME=ROOT/'web/data/runtime-index.js'
OUT=ROOT/'web/images/people'
ATLAS=ROOT/'web/images/fallback-atlas.webp'
ATLAS_META=ROOT/'web/data/fallback-atlas.json'

src=RUNTIME.read_text(encoding='utf-8')
m=re.search(r'window\.ORTHODOX_ENTRIES=(\[.*\]);\}\)\(\);\s*$',src,re.S)
if not m: raise SystemExit('Could not parse runtime-index.js')
entries=json.loads(m.group(1))
OUT.mkdir(parents=True,exist_ok=True)

PALETTE={
 'christ':('#8c6a1e','#ffe38c'), 'theotokos':('#6f3159','#ffd0eb'), 'angel':('#315985','#d7eeff'),
 'forefather':('#6e5434','#ffe2a4'), 'righteous':('#44684f','#d7ffd9'), 'prophet':('#4d5088','#dedcff'),
 'apostle':('#265f69','#c9fbff'), 'nt-saint':('#665085','#eadcff'), 'church-saint':('#714a35','#ffe0b9'),
 'feast':('#7c5b20','#fff0a8'), 'biblical-context':('#354254','#d8e3f0')
}
TITLE_WORDS={'saint','st','holy','righteous','prophet','prophetess','apostle','venerable','martyr','greatmartyr','hieromartyr','blessed','patriarch','archangel','the','of','and','equal-to-the-apostles','equal','to','apostles'}
def initials(name):
    words=[re.sub(r'[^A-Za-zΑ-Ωα-ωΆ-Ώά-ώ0-9]','',w) for w in re.split(r'[\s—–-]+',name)]
    words=[w for w in words if w and w.lower() not in TITLE_WORDS]
    if not words: words=[w for w in re.split(r'\s+',name) if w]
    if len(words)==1: return words[0][:2].upper()
    return (words[0][:1]+words[-1][:1]).upper()

def svg_for(e):
    name=e.get('name',{}).get('en') or e['id']; cat=e.get('category','biblical-context'); ven=e.get('venerated',True)
    bg,accent=PALETTE.get(cat,PALETTE['biblical-context']); ini=html.escape(initials(name)); label=html.escape(f'Local illustrative artwork for {name}')
    defs=f'''<defs><radialGradient id="b" cx="36%" cy="23%"><stop stop-color="#ffffff" stop-opacity=".25"/><stop offset=".58" stop-color="{bg}"/><stop offset="1" stop-color="#17243d"/></radialGradient><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{accent}"/><stop offset="1" stop-color="{bg}"/></linearGradient></defs>'''
    border=f'<circle cx="120" cy="120" r="112" fill="url(#b)" stroke="{accent}" stroke-width="7"/>'
    small=f'<text x="120" y="214" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="800" fill="#fff">{ini}</text>'
    if e['id']=='jesus-christ':
        art='''<circle cx="120" cy="86" r="56" fill="#d4a83e" stroke="#fff0a7" stroke-width="7"/><path d="M120 31v110M66 86h108" stroke="#72551b" stroke-width="8" opacity=".78"/><circle cx="120" cy="94" r="30" fill="#2a2431"/><path d="M55 205c8-54 32-81 65-81s57 27 65 81" fill="#6b2430"/><text x="120" y="25" text-anchor="middle" font-family="Georgia,serif" font-size="20" font-weight="700" fill="#fff0a7">IC XC</text>'''
    elif e['id']=='holy-spirit':
        art='''<circle cx="120" cy="104" r="64" fill="#f9e6a7" stroke="#fff" stroke-width="6"/><path d="M120 61c-15 8-28 20-35 33 13-3 23-1 31 6-2 16 0 28 4 40 4-12 6-24 4-40 8-7 18-9 31-6-7-13-20-25-35-33z" fill="#fff" stroke="#8b762e" stroke-width="4"/><path d="M120 30v24M82 44l18 18M158 44l-18 18M66 78l28 8M174 78l-28 8" stroke="#fff4bf" stroke-width="5" stroke-linecap="round"/>'''
    elif cat=='theotokos':
        art='''<circle cx="120" cy="88" r="51" fill="#d5a33d" stroke="#ffeaa0" stroke-width="7"/><path d="M72 198c5-55 17-90 48-90s43 35 48 90z" fill="#6d254c"/><path d="M88 72q32-34 64 0l-13 51h-38z" fill="#3d2858"/><circle cx="120" cy="89" r="24" fill="#d8a978"/><text x="120" y="29" text-anchor="middle" font-family="Georgia,serif" font-size="19" font-weight="700" fill="#ffe8ac">ΜΡ ΘΥ</text>'''
    elif cat=='angel':
        art='''<circle cx="120" cy="83" r="48" fill="none" stroke="#ffe8a2" stroke-width="7"/><circle cx="120" cy="91" r="27" fill="#d5aa7f"/><path d="M104 124C72 104 47 113 34 145c30-9 48 0 65 22M136 124c32-20 57-11 70 21-30-9-48 0-65 22" fill="none" stroke="#e8f4ff" stroke-width="13" stroke-linecap="round"/><path d="M68 207c9-51 26-78 52-78s43 27 52 78" fill="#375c83"/><text x="120" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#eaf6ff">✦</text>'''
    elif cat=='feast':
        art='''<circle cx="120" cy="104" r="70" fill="#7a5720" stroke="#ffe99c" stroke-width="7"/><path d="M120 46v112M83 83h74M94 107h52" stroke="#fff2b5" stroke-width="10" stroke-linecap="round"/><path d="M120 39l8 16 18 3-13 13 3 18-16-9-16 9 3-18-13-13 18-3z" fill="#fff5c7" opacity=".8"/>'''
    elif not ven:
        # Context figures are intentionally halo-free so the fallback artwork never implies sainthood/veneration.
        art='''<rect x="52" y="48" width="136" height="137" rx="22" fill="#25334b" stroke="#9fb5cc" stroke-width="5"/><path d="M82 76h76M82 98h76M82 120h58M82 142h69" stroke="#d7e3ef" stroke-width="6" stroke-linecap="round"/><circle cx="120" cy="37" r="7" fill="#b9c9d9"/><text x="120" y="178" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#dce7f2">•</text>'''
    else:
        # Venerated human figure: halo + restrained symbolic portrait. It is deliberately illustrative, not a claim of historical likeness.
        art='''<circle cx="120" cy="82" r="55" fill="none" stroke="#ffe299" stroke-width="8" opacity=".96"/><circle cx="120" cy="92" r="30" fill="#d3a57a"/><path d="M55 207c7-55 31-82 65-82s58 27 65 82" fill="url(#r)"/><path d="M79 151l41 27 41-27" fill="none" stroke="#fff0bd" stroke-width="4" opacity=".78"/><text x="120" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#ffe6a3">☦</text>'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="{label}">{defs}{border}{art}{small}</svg>\n'''

# Generate all SVGs in runtime order.
for e in entries:
    rel=e.get('image') or f"web/images/people/{e['id']}.svg"
    p=ROOT/rel
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(svg_for(e),encoding='utf-8')

# Build one 64px-cell atlas in exact runtime order.
cell=64; cols=33; rows=(len(entries)+cols-1)//cols
atlas=Image.new('RGB',(cols*cell,rows*cell),(24,38,63))
for i,e in enumerate(entries):
    svg=(ROOT/e['image']).read_bytes()
    png=cairosvg.svg2png(bytestring=svg,output_width=cell,output_height=cell)
    im=Image.open(io.BytesIO(png)).convert('RGB')
    atlas.paste(im,((i%cols)*cell,(i//cols)*cell))
atlas.save(ATLAS,'WEBP',quality=82,method=6)
ATLAS_META.write_text(json.dumps({'cell':cell,'cols':cols,'rows':rows,'count':len(entries)},indent=2)+"\n")
print(f'Generated {len(entries)} local illustrative icons; atlas {atlas.width}x{atlas.height} -> {ATLAS.stat().st_size} bytes')
