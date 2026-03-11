#!/usr/bin/env python3
"""
Project folder cleanup tool

What it does
------------
1) Finds exact duplicate files by SHA-256 hash.
2) Flags likely deprecated / outdated files using conservative filename heuristics.
3) Detects simple version chains (v1, v2, rev1, rev2, dated variants) and flags older items.
4) Writes CSV reports.
5) Optionally moves flagged files into a quarantine folder.

Defaults to DRY RUN / REPORT ONLY.

Examples
--------
python3 dedupe_projects.py "/Users/you/Documents/Projects"
python3 dedupe_projects.py "/Users/you/Documents/Projects" --quarantine "_QUARANTINE" --apply
python3 dedupe_projects.py "/Users/you/Documents/Projects" --skip-ext .jpg .png .mp3 .mp4
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import os
import re
import shutil
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


EXCLUDED_DIR_NAMES = {
    ".git", ".svn", ".hg", ".Trash", "__pycache__", "node_modules",
    ".obsidian", ".idea", ".vscode", ".DS_Store"
}

LIKELY_DEPRECATED_TOKENS = [
    "deprecated", "obsolete", "archive", "archived", "old", "older",
    "backup", "bak", "copy", "copy 2", "copy 3", "duplicate",
    "final-final", "temp", "tmp", "test", "draft", "draft0",
    "rev0", "superseded"
]

VERSION_RE = re.compile(r'(?i)(?:^|[_\-\s\.])(?:v|ver|version|rev|r)(\d{1,3})(?:$|[_\-\s\.])')
DATE_RE = re.compile(r'(?<!\d)(20\d{2})[-_\.]?(0[1-9]|1[0-2])[-_\.]?([0-2]\d|3[01])(?!\d)')
COPY_RE = re.compile(r'(?i)\bcopy(?:\s*\(\d+\)|\s+\d+)?\b')
FINAL_FINAL_RE = re.compile(r'(?i)final[\s._-]*final')
DRAFT_RE = re.compile(r'(?i)\bdraft\d*(?:\.\d+)?\b')
REV0_RE = re.compile(r'(?i)\brev0(?:\.\d+)?\b')


@dataclass
class FileInfo:
    path: Path
    size: int
    mtime: float
    sha256: str | None = None

    @property
    def mtime_iso(self) -> str:
        return datetime.fromtimestamp(self.mtime).isoformat(timespec="seconds")


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def iter_files(root: Path, skip_ext: set[str]) -> Iterable[Path]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d for d in dirnames
            if d not in EXCLUDED_DIR_NAMES and not d.startswith(".")
        ]
        for filename in filenames:
            if filename.startswith("."):
                continue
            p = Path(dirpath) / filename
            if p.suffix.lower() in skip_ext:
                continue
            if not p.is_file():
                continue
            yield p


def safe_stem_for_grouping(path: Path) -> str:
    stem = path.stem.lower()

    # Normalize separators
    stem = re.sub(r'[\s\._\-]+', '_', stem)

    # Remove obvious noisy tokens used in duplicate/version naming
    stem = COPY_RE.sub('', stem)
    stem = FINAL_FINAL_RE.sub('final', stem)
    stem = DRAFT_RE.sub('', stem)
    stem = REV0_RE.sub('', stem)
    stem = VERSION_RE.sub('_', stem)
    stem = DATE_RE.sub('_', stem)

    # Clean repeated underscores
    stem = re.sub(r'_+', '_', stem).strip('_')
    return stem


def extract_version(path: Path) -> int | None:
    m = VERSION_RE.search(path.stem)
    return int(m.group(1)) if m else None


def extract_date(path: Path) -> tuple[int, int, int] | None:
    m = DATE_RE.search(path.stem)
    if not m:
        return None
    y, mo, d = map(int, m.groups())
    try:
        datetime(y, mo, d)
    except ValueError:
        return None
    return (y, mo, d)


def contains_deprecated_token(path: Path) -> list[str]:
    name = path.name.lower()
    hits = []
    for token in LIKELY_DEPRECATED_TOKENS:
        if token in name:
            hits.append(token)
    if COPY_RE.search(name):
        hits.append("copy-pattern")
    if FINAL_FINAL_RE.search(name):
        hits.append("final-final-pattern")
    if DRAFT_RE.search(name):
        hits.append("draft-pattern")
    if REV0_RE.search(name):
        hits.append("rev0-pattern")
    return sorted(set(hits))


def choose_keep_path(paths: list[FileInfo]) -> FileInfo:
    """
    Conservative keeper selection:
    1) prefer path without obvious duplicate/deprecated tokens
    2) then newer mtime
    3) then shorter path
    """
    def score(fi: FileInfo):
        penalties = 0
        if contains_deprecated_token(fi.path):
            penalties += 10
        name = fi.path.name.lower()
        if "copy" in name:
            penalties += 5
        if "backup" in name or "bak" in name:
            penalties += 5
        if "old" in name:
            penalties += 5
        return (penalties, -fi.mtime, len(str(fi.path)))

    return sorted(paths, key=score)[0]


def write_csv(path: Path, headers: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


def move_to_quarantine(root: Path, quarantine_name: str, paths: list[Path]) -> list[tuple[Path, Path]]:
    quarantine_root = root / quarantine_name
    quarantine_root.mkdir(parents=True, exist_ok=True)
    moved = []

    for src in paths:
        try:
            rel = src.relative_to(root)
        except ValueError:
            # skip anything not under root
            continue
        dest = quarantine_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)

        if dest.exists():
            stem = dest.stem
            suffix = dest.suffix
            counter = 2
            while True:
                alt = dest.with_name(f"{stem}__moved{counter}{suffix}")
                if not alt.exists():
                    dest = alt
                    break
                counter += 1

        shutil.move(str(src), str(dest))
        moved.append((src, dest))

    return moved


def main() -> int:
    parser = argparse.ArgumentParser(description="Find duplicates and outdated files in a projects folder.")
    parser.add_argument("root", help="Root projects folder to scan.")
    parser.add_argument("--quarantine", default="_QUARANTINE", help="Folder name under root for moved files.")
    parser.add_argument("--report-dir", default="_cleanup_reports", help="Folder name under root for CSV reports.")
    parser.add_argument("--skip-ext", nargs="*", default=[], help="Extensions to skip, e.g. .jpg .png .mp4")
    parser.add_argument("--apply", action="store_true", help="Actually move flagged files to quarantine.")
    parser.add_argument("--move-exact-dupes", action="store_true", help="Move exact duplicate non-keeper files when used with --apply.")
    parser.add_argument("--move-outdated", action="store_true", help="Move outdated/deprecated candidates when used with --apply.")
    parser.add_argument("--max-files", type=int, default=0, help="Optional limit for testing.")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"ERROR: root does not exist or is not a folder: {root}", file=sys.stderr)
        return 2

    skip_ext = {e.lower() if e.startswith(".") else f".{e.lower()}" for e in args.skip_ext}
    report_dir = root / args.report_dir
    report_dir.mkdir(parents=True, exist_ok=True)

    files: list[FileInfo] = []
    print(f"Scanning: {root}")
    for i, p in enumerate(iter_files(root, skip_ext), start=1):
        try:
            st = p.stat()
            files.append(FileInfo(path=p, size=st.st_size, mtime=st.st_mtime))
        except OSError as e:
            print(f"SKIP stat error: {p} ({e})", file=sys.stderr)
        if args.max_files and i >= args.max_files:
            break

    print(f"Indexed files: {len(files)}")

    # Exact duplicates: hash files grouped by size first
    by_size: dict[int, list[FileInfo]] = defaultdict(list)
    for fi in files:
        by_size[fi.size].append(fi)

    exact_duplicate_rows: list[list[str]] = []
    exact_duplicates_to_move: list[Path] = []
    duplicate_group_count = 0

    for size, group in by_size.items():
        if len(group) < 2:
            continue
        for fi in group:
            try:
                fi.sha256 = sha256_file(fi.path)
            except OSError as e:
                print(f"SKIP hash error: {fi.path} ({e})", file=sys.stderr)
                fi.sha256 = None

        by_hash: dict[str, list[FileInfo]] = defaultdict(list)
        for fi in group:
            if fi.sha256:
                by_hash[fi.sha256].append(fi)

        for digest, dupes in by_hash.items():
            if len(dupes) < 2:
                continue
            duplicate_group_count += 1
            keeper = choose_keep_path(dupes)
            for fi in sorted(dupes, key=lambda x: str(x.path)):
                action = "KEEP" if fi.path == keeper.path else "DUPLICATE_CANDIDATE"
                exact_duplicate_rows.append([
                    str(fi.path),
                    str(fi.path.relative_to(root)),
                    str(fi.size),
                    fi.mtime_iso,
                    digest,
                    action,
                    str(keeper.path.relative_to(root))
                ])
                if action != "KEEP":
                    exact_duplicates_to_move.append(fi.path)

    # Outdated / deprecated candidates
    by_group_key: dict[tuple[str, str], list[FileInfo]] = defaultdict(list)
    for fi in files:
        key = (safe_stem_for_grouping(fi.path), fi.path.suffix.lower())
        by_group_key[key].append(fi)

    outdated_rows: list[list[str]] = []
    outdated_to_move: list[Path] = []

    for (group_key, ext), group in by_group_key.items():
        if len(group) < 1:
            continue

        # Direct filename-token flags
        for fi in group:
            hits = contains_deprecated_token(fi.path)
            if hits:
                outdated_rows.append([
                    str(fi.path),
                    str(fi.path.relative_to(root)),
                    fi.mtime_iso,
                    "filename-token",
                    ";".join(hits),
                    ""
                ])
                outdated_to_move.append(fi.path)

        if len(group) < 2:
            continue

        # Version-based comparison
        versions = [(fi, extract_version(fi.path)) for fi in group]
        versions_present = [(fi, v) for fi, v in versions if v is not None]
        if len(versions_present) >= 2:
            newest = max(versions_present, key=lambda x: x[1])[1]
            for fi, v in versions_present:
                if v < newest:
                    outdated_rows.append([
                        str(fi.path),
                        str(fi.path.relative_to(root)),
                        fi.mtime_iso,
                        "older-version",
                        f"v{v}",
                        f"newer version exists: v{newest}"
                    ])
                    outdated_to_move.append(fi.path)

        # Date-based comparison
        dated = [(fi, extract_date(fi.path)) for fi in group]
        dated_present = [(fi, d) for fi, d in dated if d is not None]
        if len(dated_present) >= 2:
            newest_date = max(dated_present, key=lambda x: x[1])[1]
            for fi, d in dated_present:
                if d < newest_date:
                    outdated_rows.append([
                        str(fi.path),
                        str(fi.path.relative_to(root)),
                        fi.mtime_iso,
                        "older-dated-variant",
                        f"{d[0]:04d}-{d[1]:02d}-{d[2]:02d}",
                        f"newer dated variant exists: {newest_date[0]:04d}-{newest_date[1]:02d}-{newest_date[2]:02d}"
                    ])
                    outdated_to_move.append(fi.path)

    # Deduplicate move lists and avoid moving files already marked as keeper for exact dupes
    exact_duplicates_to_move = sorted(set(exact_duplicates_to_move))
    outdated_to_move = sorted(set(outdated_to_move))

    # Remove duplicates from outdated move list if already exact duplicate candidates
    exact_set = {p.resolve() for p in exact_duplicates_to_move}
    outdated_to_move = [p for p in outdated_to_move if p.resolve() not in exact_set]

    write_csv(
        report_dir / "exact_duplicates.csv",
        ["full_path", "relative_path", "size_bytes", "modified_time", "sha256", "status", "keeper_relative_path"],
        exact_duplicate_rows
    )

    write_csv(
        report_dir / "outdated_candidates.csv",
        ["full_path", "relative_path", "modified_time", "reason_type", "reason_detail", "note"],
        outdated_rows
    )

    summary_rows = [
        ["root", str(root)],
        ["scanned_files", str(len(files))],
        ["duplicate_groups", str(duplicate_group_count)],
        ["exact_duplicate_candidates", str(len(exact_duplicates_to_move))],
        ["outdated_candidates", str(len(outdated_to_move))],
        ["report_dir", str(report_dir)],
        ["dry_run", str(not args.apply)],
        ["move_exact_dupes", str(bool(args.apply and args.move_exact_dupes))],
        ["move_outdated", str(bool(args.apply and args.move_outdated))],
    ]
    write_csv(report_dir / "summary.csv", ["metric", "value"], summary_rows)

    print("\nReports written:")
    print(f"  {report_dir / 'summary.csv'}")
    print(f"  {report_dir / 'exact_duplicates.csv'}")
    print(f"  {report_dir / 'outdated_candidates.csv'}")

    if not args.apply:
        print("\nDry run only. No files were moved.")
        print("Use --apply with --move-exact-dupes and/or --move-outdated after reviewing the CSVs.")
        return 0

    moved_rows: list[list[str]] = []

    if args.move_exact_dupes and exact_duplicates_to_move:
        moved = move_to_quarantine(root, args.quarantine, exact_duplicates_to_move)
        for src, dest in moved:
            moved_rows.append([str(src), str(dest), "exact-duplicate"])
        print(f"Moved exact duplicate candidates: {len(moved)}")

    if args.move_outdated and outdated_to_move:
        moved = move_to_quarantine(root, args.quarantine, outdated_to_move)
        for src, dest in moved:
            moved_rows.append([str(src), str(dest), "outdated-candidate"])
        print(f"Moved outdated candidates: {len(moved)}")

    write_csv(
        report_dir / "moved_to_quarantine.csv",
        ["source_path", "quarantine_path", "category"],
        moved_rows
    )
    print(f"Quarantine log: {report_dir / 'moved_to_quarantine.csv'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
