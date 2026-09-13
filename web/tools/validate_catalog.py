#!/usr/bin/env python3
"""Validate the static Orthodox Web catalog without third-party packages."""
from __future__ import annotations
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "web" / "data"
FILES = [
    ("entries.js", "ORTHODOX_ENTRIES"),
    ("expanded-biblical.js", "ORTHODOX_EXPANDED_BIBLICAL"),
    ("church-saints.js", "ORTHODOX_CHURCH_SAINTS"),
    ("feasts.js", "ORTHODOX_FEASTS"),
    ("biblical-context.js", "ORTHODOX_BIBLICAL_CONTEXT"),
    ("further-expansion.js", "ORTHODOX_FURTHER_EXPANSION"),
    ("deep-biblical.js", "ORTHODOX_DEEP_BIBLICAL"),
]

def load_js_array(path: Path):
    text = path.read_text(encoding="utf-8").strip()
    rhs = text.split("=", 1)[1].strip().rstrip(";")
    return json.loads(rhs)

entries = []
for filename, _ in FILES:
    path = DATA / filename
    if not path.exists():
        raise SystemExit(f"Missing data file: {path.relative_to(ROOT)}")
    entries.extend(load_js_array(path))

errors = []
ids = [e.get("id") for e in entries]
for item, count in Counter(ids).items():
    if count > 1:
        errors.append(f"duplicate id: {item} ({count} times)")

required = ("id", "name", "category", "role", "story", "feast", "prayer", "notes", "image")
for e in entries:
    eid = e.get("id", "<missing>")
    for key in required:
        if key not in e:
            errors.append(f"{eid}: missing {key}")
    for key in ("name", "role", "story", "feast", "prayer", "notes"):
        obj = e.get(key, {})
        for lang in ("en", "el"):
            if not isinstance(obj, dict) or not str(obj.get(lang, "")).strip():
                errors.append(f"{eid}: missing {key}.{lang}")
    image = ROOT / str(e.get("image", ""))
    if not image.exists():
        errors.append(f"{eid}: missing image {e.get('image')}")

valid_categories = {"christ", "theotokos", "angel", "forefather", "righteous", "prophet", "apostle", "nt-saint", "church-saint", "feast", "biblical-context"}
for e in entries:
    if e.get("category") not in valid_categories:
        errors.append(f"{e.get('id')}: unknown category {e.get('category')}")

stats = Counter(e["category"] for e in entries)
print(f"Catalog entries: {len(entries)}")
for cat, count in sorted(stats.items()):
    print(f"  {cat:18} {count}")

if errors:
    print("\nValidation errors:")
    for err in errors:
        print(" -", err)
    raise SystemExit(1)
print("\nCatalog validation: OK")
