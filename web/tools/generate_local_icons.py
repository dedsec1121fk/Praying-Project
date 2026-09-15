#!/usr/bin/env python3
"""Generate one richer local illustrative icon for every runtime record.

These illustrations are intentionally NOT historical reproductions. They are
lightweight offline portraits so every entry has a visible, dedicated image.
Icons are individualized by category, role keywords, and a deterministic hash
of the entry id so the gallery does not feel repetitive.
"""
from pathlib import Path
import json, re, html, io, hashlib, math
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
 'christ':('#8c6a1e','#ffe38c','#6b2430'),
 'theotokos':('#6f3159','#ffd0eb','#3d2858'),
 'angel':('#315985','#d7eeff','#375c83'),
 'forefather':('#6e5434','#ffe2a4','#5b4327'),
 'righteous':('#44684f','#d7ffd9','#365744'),
 'prophet':('#4d5088','#dedcff','#3d406f'),
 'apostle':('#265f69','#c9fbff','#1f515a'),
 'nt-saint':('#665085','#eadcff','#52406d'),
 'church-saint':('#714a35','#ffe0b9','#5e3d2b'),
 'feast':('#7c5b20','#fff0a8','#6b4d17'),
 'biblical-context':('#354254','#d8e3f0','#293444')
}
TITLE_WORDS={'saint','st','holy','righteous','prophet','prophetess','apostle','venerable','martyr','greatmartyr','hieromartyr','blessed','patriarch','archangel','the','of','and','equal-to-the-apostles','equal','to','apostles','elder','bishop','mother','father'}
FEMALE_HINTS={'mary','maria','theotokos','anna','anne','photini','paraskevi','barbara','catherine','katherine','thecla','lydia','phoebe','euphemia','olga','helen','brigid','sarah','rebecca','rachel','esther','judith','martha','magdalene','febe','eudokia','xenia','matrona','marina','irene','sophia','justina','pelagia','mary-egypt','agnes','lucy','monica'}
WARRIOR_HINTS={'george','demetrios','dimitrios','theodore','warrior','stratelates','tyro','procopius','mercurius','michael'}
MONASTIC_HINTS={'monk','nun','hermit','ascetic','hesychast','stylite','abbess','abbot','elder','athonite','monastic','anchorite','desert'}
BISHOP_HINTS={'bishop','hierarch','metropolitan','archbishop','patriarch','pope','theologian','chrysostom','basil','gregory','athanasius','cyril','nicholas','spyridon','nectarios','nektarios'}
PHYSICIAN_HINTS={'physician','healer','pantel','anargyroi','anargyros','cosmas','damian','luke-crimea'}
ROYAL_HINTS={'king','queen','emperor','empress','royal','prince','princess','constantine','helen','david'}
PROPHET_HINTS={'prophet','isaiah','jeremiah','ezekiel','daniel','elijah','elisha','moses','david','solomon','samuel','jonah','malachi'}
APOSTLE_HINTS={'apostle','evangelist','theologian','forerunner','baptist','peter','paul','andrew','john','james','thomas','mark','luke','philip','bartholomew','matthias','jude','timothy','titus'}
FEAST_HINTS={'nativity','theophany','baptism','transfiguration','pascha','pentecost','annunciation','dormition','entry','presentation','elevation','cross','ascension','triumph','palm'}


def initials(name):
    words=[re.sub(r'[^A-Za-zΑ-Ωα-ωΆ-Ώά-ώ0-9]','',w) for w in re.split(r'[\s—–-]+',name)]
    words=[w for w in words if w and w.lower() not in TITLE_WORDS]
    if not words: words=[w for w in re.split(r'\s+',name) if w]
    if len(words)==1: return words[0][:2].upper()
    return (words[0][:1]+words[-1][:1]).upper()


def h01(key, salt=''):
    h=hashlib.sha256((salt+key).encode('utf-8')).digest()
    return int.from_bytes(h[:8],'big')/2**64


def hue_shift(hex_color, factor):
    hex_color=hex_color.lstrip('#')
    r=int(hex_color[0:2],16); g=int(hex_color[2:4],16); b=int(hex_color[4:6],16)
    def adj(v):
        if factor>=0:
            return int(v+(255-v)*factor)
        return int(v*(1+factor))
    return '#%02x%02x%02x'%(adj(r),adj(g),adj(b))


def classify(e):
    text=' '.join([
        e.get('id',''),
        e.get('name',{}).get('en',''),
        e.get('role',{}).get('en',''),
        ' '.join(e.get('aliases',[]) if isinstance(e.get('aliases'),list) else [])
    ]).lower()
    return text


def is_female(text):
    return any(k in text for k in FEMALE_HINTS)


def has_any(text, words):
    return any(w in text for w in words)


def draw_halo(accent):
    return f'<circle cx="120" cy="76" r="47" fill="none" stroke="{accent}" stroke-width="7" opacity=".96"/>'


def draw_head(female=False):
    skin='#d8ac84'
    if female:
        return f'<circle cx="120" cy="88" r="24" fill="{skin}"/><path d="M94 78q26-34 52 0l-7 34h-38z" fill="#4f3429" opacity=".93"/>'
    return f'<circle cx="120" cy="88" r="24" fill="{skin}"/><path d="M96 71q24-20 48 0v12q-10-10-24-10t-24 10z" fill="#4b2f24" opacity=".93"/><path d="M102 100q18 22 36 0" fill="none" stroke="#774f33" stroke-width="5" stroke-linecap="round"/>'


def draw_body(cat, robe, mantle=None, female=False, monastic=False, bishop=False):
    pieces=[]
    if female:
        pieces.append(f'<path d="M72 201c6-57 20-88 48-88s42 31 48 88z" fill="{robe}"/>')
        if mantle:
            pieces.append(f'<path d="M82 118c10-12 24-20 38-20s28 8 38 20l-10 83H92z" fill="{mantle}" opacity=".97"/>')
    else:
        pieces.append(f'<path d="M58 205c7-56 30-84 62-84s55 28 62 84" fill="{robe}"/>')
        if mantle:
            pieces.append(f'<path d="M83 122c11 12 23 19 37 19s26-7 37-19l6 21-43 30-43-30z" fill="{mantle}" opacity=".45"/>')
    if monastic:
        pieces.append('<path d="M88 84q32-52 64 0l-4 22h-56z" fill="#1d1d21" opacity=".92"/>')
    if bishop:
        pieces.append('<path d="M86 144h68" stroke="#fff1bf" stroke-width="7"/><path d="M97 132h46v18H97z" fill="#f5d98c" opacity=".9"/>')
    return ''.join(pieces)


def add_symbol(text, cat, accent, robe_dark, female=False):
    # returns decorative attribute around body
    if cat=='feast':
        if 'pentecost' in text:
            return '<path d="M120 43l6 15 16 2-11 11 3 15-14-8-14 8 3-15-11-11 16-2z" fill="#fff5c7"/><path d="M72 132h96" stroke="#fff1b5" stroke-width="8"/><path d="M92 98c12 14 17 28 16 40M120 94c0 18 0 32 0 44M148 98c-12 14-17 28-16 40" stroke="#fff4d1" stroke-width="5" stroke-linecap="round"/>'
        if 'nativity' in text:
            return '<circle cx="120" cy="102" r="62" fill="none" stroke="#fff1b0" stroke-width="7"/><path d="M74 118h92" stroke="#fff3c1" stroke-width="8"/><circle cx="120" cy="102" r="13" fill="#fff3c1"/>'
        return '<circle cx="120" cy="104" r="70" fill="#7a5720" stroke="#ffe99c" stroke-width="7"/><path d="M120 46v112M83 83h74M94 107h52" stroke="#fff2b5" stroke-width="10" stroke-linecap="round"/>'
    if cat=='angel':
        return '<path d="M103 121C69 100 45 109 34 145c28-11 47-3 64 19M137 121c34-21 58-12 69 24-28-11-47-3-64 19" fill="none" stroke="#e8f4ff" stroke-width="13" stroke-linecap="round"/><text x="120" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#eaf6ff">✦</text>'
    if cat=='theotokos':
        return '<text x="120" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="19" font-weight="700" fill="#ffe8ac">ΜΡ ΘΥ</text>'
    if 'holy-spirit' in text:
        return '<path d="M120 61c-15 8-28 20-35 33 13-3 23-1 31 6-2 16 0 28 4 40 4-12 6-24 4-40 8-7 18-9 31-6-7-13-20-25-35-33z" fill="#fff" stroke="#8b762e" stroke-width="4"/><path d="M120 30v24M82 44l18 18M158 44l-18 18M66 78l28 8M174 78l-28 8" stroke="#fff4bf" stroke-width="5" stroke-linecap="round"/>'
    if 'jesus-christ' in text:
        return '<path d="M120 31v92M74 76h92" stroke="#72551b" stroke-width="8" opacity=".78"/><text x="120" y="25" text-anchor="middle" font-family="Georgia,serif" font-size="20" font-weight="700" fill="#fff0a7">IC XC</text>'
    if has_any(text,WARRIOR_HINTS):
        return f'<path d="M165 134l18 39" stroke="#dfe8f2" stroke-width="6" stroke-linecap="round"/><path d="M176 119l16 16-21 5z" fill="#dfe8f2"/><circle cx="77" cy="155" r="16" fill="none" stroke="#dfe8f2" stroke-width="5"/><path d="M77 145v20M67 155h20" stroke="#dfe8f2" stroke-width="4"/>'
    if has_any(text,PHYSICIAN_HINTS):
        return '<rect x="147" y="143" width="28" height="22" rx="4" fill="#f5e7bd"/><path d="M161 147v14M154 154h14" stroke="#996c1c" stroke-width="3"/><path d="M84 145h22v20H84z" fill="#fff1cf"/><path d="M95 145v20" stroke="#9c7a31" stroke-width="3"/>'
    if has_any(text,ROYAL_HINTS):
        return '<path d="M92 45l10 16 18-15 18 15 10-16 8 18-8 11H92l-8-11z" fill="#f6d173" stroke="#fff2bd" stroke-width="4"/>'
    if has_any(text,BISHOP_HINTS):
        return '<rect x="145" y="136" width="26" height="34" rx="3" fill="#f2d17c" stroke="#fff1b9" stroke-width="3"/><path d="M155 143h9M155 151h9M155 159h9" stroke="#8a5a1e" stroke-width="2"/><path d="M91 144c14 8 24 8 38 0" stroke="#fff0c0" stroke-width="5" fill="none"/>'
    if has_any(text,MONASTIC_HINTS):
        return '<path d="M160 146c0 18-8 34-8 34" stroke="#d5b06a" stroke-width="4" fill="none"/><circle cx="160" cy="145" r="6" fill="#d5b06a"/><path d="M87 142c12 16 12 32 0 48" stroke="#f1d78e" stroke-width="4" fill="none"/>'
    if has_any(text,PROPHET_HINTS):
        return '<path d="M145 135h26v38h-26z" fill="#e9d7b0"/><path d="M151 142h14M151 149h14M151 156h14M151 163h14" stroke="#8f6b3b" stroke-width="2"/><path d="M81 150h22" stroke="#f4e8c0" stroke-width="5" stroke-linecap="round"/>'
    if has_any(text,APOSTLE_HINTS):
        return '<path d="M146 137h28v36h-28z" fill="#e7d0a0" stroke="#f8eabb" stroke-width="3"/><path d="M152 144h16M152 151h16M152 158h16" stroke="#91642a" stroke-width="2"/><path d="M84 148l10 10 14-18" stroke="#fff0be" stroke-width="5" fill="none" stroke-linecap="round"/>'
    if female:
        return '<path d="M83 149h18M154 149h18" stroke="#fff0be" stroke-width="5" stroke-linecap="round"/><circle cx="93" cy="162" r="6" fill="#fff0be"/><circle cx="164" cy="162" r="6" fill="#fff0be"/>'
    return '<path d="M82 151l38 24 38-24" fill="none" stroke="#fff0bd" stroke-width="4" opacity=".78"/><text x="120" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#ffe6a3">☦</text>'


def svg_for(e):
    name=e.get('name',{}).get('en') or e['id']
    cat=e.get('category','biblical-context')
    ven=e.get('venerated',True)
    bg,accent,robe=PALETTE.get(cat,PALETTE['biblical-context'])
    text=classify(e)
    female=is_female(text)
    bishop=has_any(text,BISHOP_HINTS)
    monastic=has_any(text,MONASTIC_HINTS)
    robe2=hue_shift(robe, h01(e['id'],'mantle')*0.28-0.08)
    bg2=hue_shift(bg, h01(e['id'],'bg')*0.18-0.06)
    accent2=hue_shift(accent, h01(e['id'],'accent')*0.20-0.07)
    ini=html.escape(initials(name))
    label=html.escape(f'Local illustrative artwork for {name}')
    defs=f'''<defs>
      <radialGradient id="b" cx="36%" cy="23%"><stop stop-color="#ffffff" stop-opacity=".27"/><stop offset=".58" stop-color="{bg2}"/><stop offset="1" stop-color="#17243d"/></radialGradient>
      <linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{accent2}"/><stop offset="1" stop-color="{robe2}"/></linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".25"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
    </defs>'''
    border=f'<circle cx="120" cy="120" r="112" fill="url(#b)" stroke="{accent2}" stroke-width="7"/><circle cx="120" cy="120" r="105" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>'
    shine='<ellipse cx="86" cy="62" rx="32" ry="18" fill="url(#g)" transform="rotate(-22 86 62)"/>'
    bottom=f'<rect x="61" y="194" width="118" height="27" rx="13" fill="rgba(0,0,0,.22)"/><text x="120" y="214" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="800" fill="#fff">{ini}</text>'

    if e['id']=='jesus-christ':
        art=f'''<circle cx="120" cy="80" r="54" fill="#d4a83e" stroke="#fff0a7" stroke-width="7"/>{draw_head(False)}{draw_body(cat,'#6b2430','#5a1d28',False,False,False)}{add_symbol(text,cat,accent2,robe2,False)}'''
    elif e['id']=='holy-spirit':
        art=f'''<circle cx="120" cy="104" r="64" fill="#f9e6a7" stroke="#fff" stroke-width="6"/>{add_symbol(text,cat,accent2,robe2,False)}'''
    elif cat=='theotokos':
        art=f'''{draw_halo('#ffeaa0')}{draw_head(True)}{draw_body(cat,'#6d254c','#3d2858',True,False,False)}{add_symbol(text,cat,accent2,robe2,True)}'''
    elif cat=='angel':
        art=f'''{draw_halo('#ffe8a2')}{draw_head(False)}{draw_body(cat,'#375c83','#315985',False,False,False)}{add_symbol(text,cat,accent2,robe2,False)}'''
    elif cat=='feast':
        art=add_symbol(text,cat,accent2,robe2,False)
    elif not ven:
        art='''<rect x="52" y="48" width="136" height="137" rx="22" fill="#25334b" stroke="#9fb5cc" stroke-width="5"/><path d="M82 76h76M82 98h76M82 120h58M82 142h69" stroke="#d7e3ef" stroke-width="6" stroke-linecap="round"/><circle cx="120" cy="37" r="7" fill="#b9c9d9"/><text x="120" y="178" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#dce7f2">•</text>'''
    else:
        art=f'''{draw_halo(hue_shift(accent2,-0.08))}{draw_head(female)}{draw_body(cat,robe2,hue_shift(robe2,0.12),female,monastic,bishop)}{add_symbol(text,cat,accent2,robe2,female)}'''

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="{label}">{defs}{border}{shine}{art}{bottom}</svg>\n'''

# Generate all SVGs in runtime order.
for e in entries:
    rel=e.get('image') or f"web/images/catalog/{e['id']}.svg"
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
atlas.save(ATLAS,'WEBP',quality=84,method=6)
ATLAS_META.write_text(json.dumps({'cell':cell,'cols':cols,'rows':rows,'count':len(entries)},indent=2)+"\n")
print(f'Generated {len(entries)} richer local illustrative icons; atlas {atlas.width}x{atlas.height} -> {ATLAS.stat().st_size} bytes')
