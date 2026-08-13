#!/usr/bin/env python3
"""Decode 33-layer Befunge payloads and reconstruct Praying Project exactly 33 times."""

from __future__ import annotations

import argparse
import base64
import binascii
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PART_COUNT = 33
PASS_COUNT = 33
DECODE_ROUNDS = 33
START = "PRAYING_PROJECT_ENCODED_PAYLOAD_START"
END = "PRAYING_PROJECT_ENCODED_PAYLOAD_END"
EXPECTED_FILES = [f"part_{i:02d}.befunge" for i in range(1, PART_COUNT + 1)]


def generated_readme_paths() -> list[Path]:
    # README.md is permanent project documentation. Temporary reconstructions are
    # numbered plainly from README_1.md through README_33.md.
    return [ROOT / f"README_{i}.md" for i in range(1, PASS_COUNT + 1)]


def validate_language_folder(language: str) -> list[Path]:
    folder = ROOT / language
    files = sorted(folder.glob("*.befunge"))
    names = [p.name for p in files]
    if names != EXPECTED_FILES:
        raise ValueError(
            f"{language}: expected exactly 33 files part_01.befunge..part_33.befunge; "
            f"found {len(files)}"
        )
    return files


def extract_encoded_payload(path: Path) -> bytes:
    raw = path.read_text(encoding="utf-8")
    if not raw.startswith("@\n"):
        raise ValueError(f"{path}: Befunge entry point must terminate with '@' at cell 0,0")
    start_at = raw.find(START)
    end_at = raw.find(END, start_at + len(START))
    if start_at < 0 or end_at < 0:
        raise ValueError(f"{path}: encoded payload markers missing")
    payload = raw[start_at + len(START):end_at].strip()
    if not payload:
        raise ValueError(f"{path}: empty encoded payload")
    return payload.encode("ascii")


def decode_exactly_33_layers(encoded: bytes, path: Path) -> str:
    data = encoded
    for round_number in range(1, DECODE_ROUNDS + 1):
        try:
            data = base64.b85decode(data)
        except (ValueError, binascii.Error) as exc:
            raise ValueError(
                f"{path}: Base85 decoding failed at required round {round_number}/33"
            ) from exc

    # The 33rd decode must be the point at which UTF-8 prayer text becomes available.
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"{path}: payload is not valid UTF-8 after exactly 33 decode rounds") from exc


def read_and_decode_language_once(language: str) -> str:
    # Every reconstruction pass opens all 33 files once. Each file's payload is then
    # decoded exactly 33 times before its prayer text can participate in construction.
    chunks: list[str] = []
    for path in validate_language_folder(language):
        encoded = extract_encoded_payload(path)
        chunks.append(decode_exactly_33_layers(encoded, path))
    return "".join(chunks)


def verify_integrity(greek: str, english: str) -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("encoding", {}).get("layers") != DECODE_ROUNDS:
        raise ValueError("manifest encoding layer count is not exactly 33")
    for language, value in (("Greek", greek), ("English", english)):
        expected = manifest["languages"][language]["sha256"]
        actual = hashlib.sha256(value.encode("utf-8")).hexdigest()
        if actual != expected:
            raise ValueError(
                f"{language}: reconstructed SHA-256 does not match manifest "
                f"({actual} != {expected})"
            )


def schedule_metadata() -> dict[str, str]:
    state_path = ROOT / ".prayer-country-state.json"
    if not state_path.exists():
        return {}
    state = json.loads(state_path.read_text(encoding="utf-8"))
    selected = state.get("selected") or {}
    return {
        "country": str(selected.get("country", "")),
        "capital": str(selected.get("capital", "")),
        "timezone": str(selected.get("timezone", "")),
    }


def render_readme(pass_number: int, greek: str, english: str) -> str:
    meta = schedule_metadata()
    location = ""
    if meta.get("country"):
        location = (
            f"Selected country: **{meta['country']}**  \n"
            f"Capital: **{meta['capital']}**  \n"
            f"Capital timezone: **{meta['timezone']}**\n\n"
        )
    return f"""# Praying Project — Reconstruction {pass_number}/33

This temporary file was reconstructed only after the Befunge payloads completed all 33 required decoding rounds.

{location}## Ελληνικά

{greek.rstrip()}

## English

{english.rstrip()}

---
Generated reconstruction: **{pass_number}/33**
Encoding layers decoded before construction: **33/33**
"""


def cleanup() -> None:
    for path in generated_readme_paths():
        path.unlink(missing_ok=True)

    leftovers = [p for p in generated_readme_paths() if p.exists()]
    if leftovers:
        raise RuntimeError(f"Generated README cleanup incomplete: {leftovers}")
    if not (ROOT / "README.md").exists():
        raise RuntimeError("Permanent README.md must never be removed by cleanup")
    print("Temporary README_1.md..README_33.md files are absent; README.md is preserved.")


def generate() -> None:
    outputs = generated_readme_paths()
    cleanup()

    # Fixed contract:
    # - 33 reconstruction passes.
    # - Every pass reads each of the 33 source files in each language once.
    # - Every read payload is decoded through exactly 33 Base85 layers BEFORE assembly.
    for pass_number in range(1, PASS_COUNT + 1):
        greek = read_and_decode_language_once("Greek")
        english = read_and_decode_language_once("English")
        verify_integrity(greek, english)
        outputs[pass_number - 1].write_text(
            render_readme(pass_number, greek, english), encoding="utf-8"
        )

    present = [p for p in outputs if p.exists()]
    if len(present) != PASS_COUNT:
        raise RuntimeError(f"Expected exactly 33 generated README files, found {len(present)}")

    print(
        "Generated exactly 33 README files from 33 reconstruction passes; "
        "each source read completed exactly 33 Base85 decode rounds first."
    )


def verify() -> None:
    greek = read_and_decode_language_once("Greek")
    english = read_and_decode_language_once("English")
    verify_integrity(greek, english)
    print(
        "Verified 33 Greek + 33 English Befunge files, each requiring exactly "
        "33 Base85 decoding rounds before prayer reconstruction."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("generate", "cleanup", "verify"))
    args = parser.parse_args()

    if args.command == "generate":
        generate()
    elif args.command == "cleanup":
        cleanup()
    else:
        verify()


if __name__ == "__main__":
    main()
