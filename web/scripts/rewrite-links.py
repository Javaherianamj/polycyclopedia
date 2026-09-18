#!/usr/bin/env python3
"""
Post-build: prepend a base path to all internal links in generated HTML.

Run after `astro build`. Scans every .html file in the dist directory and
fixes root-relative href/src/etc. so they include the GitHub Pages repo prefix.

Usage:
    python3 scripts/rewrite-links.py dist /polymer-encyclopedia
"""
import os
import re
import sys


def rewrite_html(filepath: str, base: str) -> int:
    """Rewrite root-relative paths in one HTML file. Returns number of changes."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    original = html
    # Pattern: href="/..." or src="/..." where the path starts with /
    # and doesn't already start with the base.
    # We match: href="/foo" or src="/bar" but NOT href="http://..." etc.
    def fix_path(match):
        attr = match.group(1)  # href or src or action or content
        quote = match.group(2)  # '" or '
        path = match.group(3)  # the path like /fa/...
        # Skip already-prefixed paths and external URLs
        if path.startswith(base) or path.startswith('//') or path.startswith('http'):
            return match.group(0)
        # Skip data: URIs, mailto:, javascript:, etc.
        if ':' in path and not path.startswith('/'):
            return match.group(0)
        # Skip anchor-only paths
        if path.startswith('#'):
            return match.group(0)
        # Prepend the base
        return f'{attr}={quote}{base}{path}{quote}'

    # Match href="/path...", src="/path...", action="/path...", content="0;url=/path..."
    pattern = r'(href|src|action)=(\'|")(/[^\'"]*?)(\'|")'
    html = re.sub(pattern, fix_path, html)

    # Also fix meta refresh content="0;url=/..."
    def fix_meta_url(match):
        content = match.group(1)
        url_path = match.group(2)
        if url_path.startswith(base) or url_path.startswith('http'):
            return match.group(0)
        return f'content="{content}{base}{url_path}"'

    meta_pattern = r'content="(\d+;url=)(/[^\'"]*?)"'
    html = re.sub(meta_pattern, fix_meta_url, html)

    if html != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        return 1
    return 0


def main():
    if len(sys.argv) < 3:
        print('Usage: python3 rewrite-links.py <dist-dir> <base-path>')
        sys.exit(1)

    dist_dir = os.path.abspath(sys.argv[1])
    base_path = sys.argv[2]

    if not base_path.startswith('/'):
        base_path = '/' + base_path
    if base_path.endswith('/'):
        base_path = base_path.rstrip('/')

    if not os.path.isdir(dist_dir):
        print(f'Error: {dist_dir} is not a directory')
        sys.exit(1)

    changed = 0
    for root, dirs, files in os.walk(dist_dir):
        # Skip _astro (Astro already prefixes this)
        for fname in files:
            if fname.endswith('.html'):
                fpath = os.path.join(root, fname)
                if rewrite_html(fpath, base_path):
                    changed += 1
                    print(f'  fixed: {os.path.relpath(fpath, dist_dir)}')

    print(f'\nRewrote {changed} HTML file(s) with base={base_path}')


if __name__ == '__main__':
    main()
