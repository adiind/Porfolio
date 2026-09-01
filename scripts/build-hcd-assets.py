#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_ROOT = (REPO_ROOT / 'review/hcd-figma-selector/assets').resolve()
OUTPUT_ROOT = (REPO_ROOT / 'public/images/hcd').resolve()


def confined_path(raw_path: Any, root: Path, field: str) -> Path:
    if not isinstance(raw_path, str) or not raw_path.strip():
        raise ValueError(f'{field} must be a non-empty repository-relative path')
    if Path(raw_path).is_absolute():
        raise ValueError(f'{field} must be repository-relative: {raw_path}')
    candidate = (REPO_ROOT / raw_path).resolve()
    try:
        relative = candidate.relative_to(root)
    except ValueError as error:
        raise ValueError(f'{field} must remain inside {root.relative_to(REPO_ROOT)}: {raw_path}') from error
    if relative == Path('.'):
        raise ValueError(f'{field} must name a file inside {root.relative_to(REPO_ROOT)}')
    return candidate


def positive_integer(value: Any, field: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f'{field} must be a positive integer')
    return value


def validate_crop(crop: Any, width: int, height: int, source: str) -> tuple[int, int, int, int] | None:
    if crop is None:
        return None
    if (
        not isinstance(crop, list)
        or len(crop) != 4
        or any(isinstance(value, bool) or not isinstance(value, int) for value in crop)
    ):
        raise ValueError(f'crop for {source} must be four integer coordinates')
    left, top, right, bottom = crop
    if right <= left or bottom <= top:
        raise ValueError(f'crop for {source} must have positive area')
    if left < 0 or top < 0 or right > width or bottom > height:
        raise ValueError(f'crop for {source} must remain within the {width}x{height} source image')
    return left, top, right, bottom


def prepare_asset(entry: Any, index: int) -> dict[str, Any]:
    if not isinstance(entry, dict):
        raise ValueError(f'assets[{index}] must be an object')

    source_raw = entry.get('source')
    output_raw = entry.get('output')
    source_path = confined_path(source_raw, SOURCE_ROOT, f'assets[{index}].source')
    output_path = confined_path(output_raw, OUTPUT_ROOT, f'assets[{index}].output')
    if not source_path.is_file():
        raise ValueError(f'source does not exist: {source_raw}')
    if output_path.suffix.lower() != '.webp':
        raise ValueError(f'assets[{index}].output must use the .webp extension')

    max_width = positive_integer(entry.get('maxWidth'), f'assets[{index}].maxWidth')
    quality = positive_integer(entry.get('quality'), f'assets[{index}].quality')
    if quality > 100:
        raise ValueError(f'assets[{index}].quality must be between 1 and 100')

    with Image.open(source_path) as source_image:
        crop = validate_crop(entry.get('crop'), source_image.width, source_image.height, str(source_raw))

    return {
        'source_path': source_path,
        'output_path': output_path,
        'max_width': max_width,
        'quality': quality,
        'crop': crop,
    }


def build_asset(asset: dict[str, Any]) -> None:
    source_path = asset['source_path']
    output_path = asset['output_path']
    max_width = asset['max_width']
    quality = asset['quality']
    crop = asset['crop']

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source_path) as image:
        image = image.convert('RGB')
        if crop is not None:
            image = image.crop(tuple(crop))
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(output_path, format='WEBP', quality=quality, method=6)
    print(f'Built {output_path.relative_to(REPO_ROOT)}')


def main() -> None:
    parser = argparse.ArgumentParser(description='Build optimized HCD WebP evidence from a JSON manifest.')
    parser.add_argument('--manifest', required=True, help='Repository-relative path to a JSON asset manifest.')
    args = parser.parse_args()

    manifest_path = (REPO_ROOT / args.manifest).resolve()
    if not manifest_path.is_file():
        parser.error(f'manifest does not exist: {args.manifest}')

    try:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        entries = manifest.get('assets') if isinstance(manifest, dict) else None
        if not isinstance(entries, list):
            raise ValueError('manifest must contain an "assets" array')
        prepared_assets = [prepare_asset(entry, index) for index, entry in enumerate(entries)]
        for asset in prepared_assets:
            build_asset(asset)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        parser.error(str(error))

    print(f'Built {len(prepared_assets)} HCD asset(s).')


if __name__ == '__main__':
    main()
