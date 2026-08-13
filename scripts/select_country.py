#!/usr/bin/env python3
"""Choose one capital-timezone country per global day and gate the prayer cycle.

A selection day runs from 12:00 UTC to 12:00 UTC the following day. Starting
at noon UTC guarantees that every civil timezone from UTC-12 through UTC+14
still has its next local 03:00 inside the same 24-hour selection window.

Countries are drawn from a cryptographically shuffled 195-country deck. A new
deck is created only after every country has been selected once.
"""

from __future__ import annotations

import argparse
import json
import secrets
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
COUNTRIES_PATH = ROOT / "data" / "countries.json"
STATE_PATH = ROOT / ".prayer-country-state.json"
SELECTION_START_HOUR_UTC = 12
TARGET_LOCAL_HOUR = 3
ALLOWED_WEEKDAYS = {2, 4, 6}  # Wednesday, Friday, Sunday (Monday = 0)


def load_countries() -> list[dict[str, str]]:
    countries = json.loads(COUNTRIES_PATH.read_text(encoding="utf-8"))
    if len(countries) != 195:
        raise ValueError(f"Expected exactly 195 countries, found {len(countries)}")
    codes = [c["iso2"] for c in countries]
    if len(set(codes)) != 195:
        raise ValueError("Country ISO2 codes are not unique")
    for country in countries:
        ZoneInfo(country["timezone"])
    return countries


def default_state() -> dict:
    return {
        "schema": 1,
        "selection_period": None,
        "selected": None,
        "remaining_iso2": [],
        "cycle_number": 0,
        "last_prayer_run_target": None,
    }


def load_state() -> dict:
    if not STATE_PATH.exists():
        return default_state()
    state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    base = default_state()
    base.update(state)
    return base


def save_state(state: dict) -> None:
    STATE_PATH.write_text(
        json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def selection_period(now_utc: datetime) -> tuple[str, datetime, datetime]:
    shifted = now_utc - timedelta(hours=SELECTION_START_HOUR_UTC)
    key = shifted.date().isoformat()
    start = datetime.combine(date.fromisoformat(key), time(SELECTION_START_HOUR_UTC), tzinfo=timezone.utc)
    return key, start, start + timedelta(days=1)


def choose_for_period(state: dict, countries: list[dict[str, str]], key: str) -> bool:
    if state.get("selection_period") == key and state.get("selected"):
        return False

    by_code = {c["iso2"]: c for c in countries}
    remaining = [code for code in state.get("remaining_iso2", []) if code in by_code]

    if not remaining:
        remaining = list(by_code)
        secrets.SystemRandom().shuffle(remaining)
        state["cycle_number"] = int(state.get("cycle_number") or 0) + 1

    selected_code = remaining.pop()
    state["selection_period"] = key
    state["selected"] = by_code[selected_code]
    state["remaining_iso2"] = remaining
    return True


def find_target(period_start_utc: datetime, period_end_utc: datetime, tz: ZoneInfo) -> datetime | None:
    """Find the next real local 03:00 inside the current selection period.

    Searching UTC instants avoids inventing a nonexistent 03:00 during a DST
    forward transition. All current civil UTC offsets are aligned to 15-minute
    boundaries, so quarter-hour scanning covers the complete country list.
    """
    instant = period_start_utc
    while instant < period_end_utc:
        local = instant.astimezone(tz)
        if local.hour == TARGET_LOCAL_HOUR and local.minute == 0:
            return instant
        instant += timedelta(minutes=15)
    return None


def current_decision(now_utc: datetime, state: dict, start: datetime, end: datetime) -> dict[str, str | bool]:
    selected = state.get("selected")
    if not selected:
        raise ValueError("No selected country in state")

    tz = ZoneInfo(selected["timezone"])
    target_utc = find_target(start, end, tz)
    if target_utc is None:
        # A local 03:00 can be skipped by a DST spring-forward transition.
        return {
            "should_run": False,
            "target_id": "",
            "target_utc": "",
            "target_local": "",
            "local_weekday": "",
        }

    target_local = target_utc.astimezone(tz)
    target_id = f"{state['selection_period']}|{selected['iso2']}|{target_utc.isoformat()}"
    allowed_day = target_local.weekday() in ALLOWED_WEEKDAYS
    already_ran = state.get("last_prayer_run_target") == target_id
    due = allowed_day and now_utc >= target_utc and now_utc < end and not already_ran

    return {
        "should_run": due,
        "target_id": target_id,
        "target_utc": target_utc.isoformat(),
        "target_local": target_local.isoformat(),
        "local_weekday": target_local.strftime("%A"),
    }


def write_github_output(path: Path, values: dict[str, object]) -> None:
    with path.open("a", encoding="utf-8") as fh:
        for key, value in values.items():
            if isinstance(value, bool):
                value = "true" if value else "false"
            text = str(value).replace("\n", " ").replace("\r", " ")
            fh.write(f"{key}={text}\n")


def command_check(github_output: Path | None) -> None:
    countries = load_countries()
    state = load_state()
    before = json.dumps(state, sort_keys=True, ensure_ascii=False)
    now_utc = datetime.now(timezone.utc)
    key, start, end = selection_period(now_utc)
    selection_changed = choose_for_period(state, countries, key)
    save_state(state)
    after = json.dumps(state, sort_keys=True, ensure_ascii=False)
    state_changed = before != after

    decision = current_decision(now_utc, state, start, end)
    selected = state["selected"]
    outputs = {
        "selection_changed": selection_changed,
        "state_changed": state_changed,
        "should_run": decision["should_run"],
        "target_id": decision["target_id"],
        "target_utc": decision["target_utc"],
        "target_local": decision["target_local"],
        "local_weekday": decision["local_weekday"],
        "country": selected["country"],
        "iso2": selected["iso2"],
        "capital": selected["capital"],
        "timezone": selected["timezone"],
        "cycle_number": state["cycle_number"],
        "remaining_in_cycle": len(state["remaining_iso2"]),
    }

    if github_output:
        write_github_output(github_output, outputs)
    else:
        print(json.dumps(outputs, ensure_ascii=False, indent=2))


def command_mark_run(target_id: str) -> None:
    if not target_id:
        raise ValueError("target_id cannot be empty")
    state = load_state()
    if not state.get("selected"):
        raise ValueError("No selected country to mark")
    state["last_prayer_run_target"] = target_id
    save_state(state)
    print(f"Marked prayer cycle target as completed: {target_id}")


def command_validate() -> None:
    countries = load_countries()
    tiny = {"VA", "NR", "TV", "MC", "SM", "LI"}
    available = {c["iso2"] for c in countries}
    if not tiny <= available:
        raise ValueError("Small-country coverage check failed")
    print("Validated exactly 195 eligible countries and all embedded capital timezones.")


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check")
    check.add_argument("--github-output", type=Path)

    mark = sub.add_parser("mark-run")
    mark.add_argument("--target-id", required=True)

    sub.add_parser("validate")
    args = parser.parse_args()

    if args.command == "check":
        command_check(args.github_output)
    elif args.command == "mark-run":
        command_mark_run(args.target_id)
    else:
        command_validate()


if __name__ == "__main__":
    main()
