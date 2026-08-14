#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# ///

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent
DIST_DIR = ROOT / "dist"
MANIFEST_PATH = ROOT / "manifest.json"
ICON_DIR = ROOT / "icons"
INCLUDE_EXTENSIONS = {".html", ".css", ".js"}


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description="Build Chrome extension assets into ./dist and optionally bump manifest version."
  )
  parser.add_argument(
    "--bump",
    choices=("major", "minor", "patch", "none"),
    default="patch",
    help="Version bump strategy for manifest.json (default: patch)."
  )
  parser.add_argument(
    "--no-zip",
    action="store_true",
    help="Skip generating the zip archive."
  )
  parser.add_argument(
    "--src",
    type=Path,
    default=ROOT,
    help="Source project directory. Defaults to script directory."
  )
  return parser.parse_args()


def load_manifest(path: Path) -> dict:
  if not path.exists():
    raise FileNotFoundError(f"manifest.json not found at: {path}")

  with path.open("r", encoding="utf-8") as f:
    return json.load(f)


def save_manifest(path: Path, manifest: dict) -> None:
  with path.open("w", encoding="utf-8", newline="\n") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write("\n")


def bump_version(version: str, strategy: str) -> str:
  if strategy == "none":
    return version

  parts = version.split(".")
  if len(parts) != 3 or not all(part.isdigit() for part in parts):
    raise ValueError(
      f"Unsupported manifest version '{version}'. Expected semantic format like 1.2.3."
    )

  major, minor, patch = map(int, parts)

  if strategy == "major":
    major += 1
    minor = 0
    patch = 0
  elif strategy == "minor":
    minor += 1
    patch = 0
  elif strategy == "patch":
    patch += 1
  else:
    raise ValueError(f"Unknown bump strategy: {strategy}")

  return f"{major}.{minor}.{patch}"


def clean_dist(dist_dir: Path) -> None:
  if dist_dir.exists():
    shutil.rmtree(dist_dir)
  dist_dir.mkdir(parents=True, exist_ok=True)


def copy_manifest(src_manifest: Path, dist_manifest: Path) -> None:
  shutil.copy2(src_manifest, dist_manifest)


def copy_icons(src_icon_dir: Path, dist_icon_dir: Path) -> None:
  if src_icon_dir.exists() and src_icon_dir.is_dir():
    shutil.copytree(src_icon_dir, dist_icon_dir, dirs_exist_ok=True)


def copy_static_files(src_dir: Path, dist_dir: Path) -> list[Path]:
  copied_files: list[Path] = []

  for path in src_dir.iterdir():
    if not path.is_file():
      continue

    if path.name == "manifest.json":
      continue

    if path.suffix.lower() in INCLUDE_EXTENSIONS:
      destination = dist_dir / path.name
      shutil.copy2(path, destination)
      copied_files.append(destination)

  return copied_files

def make_zip_archive(
  dist_dir: Path,
  version: str,
) -> Path:
  zip_path = dist_dir / f"extension-v{version}.zip"

  with ZipFile(zip_path, "w", ZIP_DEFLATED) as archive:
    for path in dist_dir.iterdir():
      if path.is_file() and path.suffix.lower() in {
        ".html",
        ".css",
        ".js",
        ".json",
      }:
        archive.write(path, arcname=path.name)

    icons_dir = dist_dir / "icons"

    if icons_dir.exists():
      for icon in icons_dir.rglob("*"):
        if icon.is_file():
          archive.write(
            icon,
            arcname=icon.relative_to(dist_dir),
          )

  return zip_path

def clean_dist_keep_zip(
  dist_dir: Path,
  zip_path: Path,
) -> None:
  for path in dist_dir.iterdir():
    if path.resolve() == zip_path.resolve():
      continue

    if path.is_dir():
      shutil.rmtree(path)
    else:
      path.unlink()

def main() -> int:
  args = parse_args()
  src_dir = args.src.resolve()
  manifest_path = src_dir / "manifest.json"
  icons_path = src_dir / "icons"

  manifest = load_manifest(manifest_path)
  old_version = manifest.get("version")

  if not isinstance(old_version, str):
    raise ValueError("manifest.json must contain a string 'version' field.")

  new_version = bump_version(old_version, args.bump)

  if new_version != old_version:
    manifest["version"] = new_version
    manifest["version_name"] = f"Build {new_version}"
    save_manifest(manifest_path, manifest)

  clean_dist(DIST_DIR)

  dist_manifest_path = DIST_DIR / "manifest.json"
  copy_manifest(manifest_path, dist_manifest_path)
  copy_icons(icons_path, DIST_DIR / "icons")
  copied_files = copy_static_files(src_dir, DIST_DIR)

  zip_path = None
  if not args.no_zip:
    zip_path = make_zip_archive(
      DIST_DIR,
      manifest["version"],
    )
    clean_dist_keep_zip(DIST_DIR, zip_path)

  print(f"Build complete.")
  print(f"Source: {src_dir}")
  print(f"Dist:   {DIST_DIR}")
  print(f"Version: {old_version} -> {manifest['version']}")

  if copied_files:
    print("Copied files:")
    for path in sorted(copied_files):
      print(f"  - {path.relative_to(ROOT)}")

  if (DIST_DIR / "icons").exists():
    print("  - dist/icons/**")

  if zip_path is not None:
    print(f"Zip:    {zip_path}")

  return 0


if __name__ == "__main__":
  raise SystemExit(main())

