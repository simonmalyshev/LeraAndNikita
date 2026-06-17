#!/usr/bin/env python3
"""
Extract CSS property occurrences (rotate, filter, -webkit-filter, transform)
from line 3 of a large HTML file and produce a structured report.
"""

import re
import sys
import io

# Force UTF-8 output for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

INPUT_FILE = r"C:\Users\Сёма\.local\share\opencode\tool-output\tool_ecc013959001pHv4nOJX4DfAVY"
TARGET_LINE_INDEX = 2  # 0-indexed → line 3


def read_line(filepath: str, line_index: int) -> str:
    """Read a single line from a file by 0-based index."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f):
            if i == line_index:
                return line
    raise ValueError(f"File has fewer than {line_index + 1} lines")


def extract_context(text: str, pos: int, max_context: int = 200) -> str:
    """
    Extract surrounding context around a match position.
    Tries to find the CSS selector / property block by scanning
    backwards for '{' or '>' or 'style=' boundary.
    """
    start = max(0, pos - max_context)
    end = min(len(text), pos + max_context)

    # Try to expand backwards to catch selector or style attribute boundary
    # Look for <style or style=" or { or > backwards
    backtrack = text[max(0, pos - 600):pos]
    # Find the last '{' if inside a style block
    brace_pos = backtrack.rfind("{")
    style_attr_pos = backtrack.rfind('style="')
    style_tag_pos = backtrack.rfind("<style")

    # Choose the best context start
    candidates = []
    if brace_pos >= 0:
        candidates.append((pos - 600 + brace_pos, "CSS rule block"))
    if style_attr_pos >= 0:
        candidates.append((pos - 600 + style_attr_pos, "inline style attribute"))
    if style_tag_pos >= 0:
        candidates.append((pos - 600 + style_tag_pos, "<style> block"))

    if candidates:
        # Pick the closest one that still gives us reasonable context
        best_start, ctx_type = min(candidates, key=lambda x: pos - x[0])
        start = best_start
        # Also try to extend to end of block
        forward = text[pos:min(len(text), pos + 400)]
        brace_end = forward.find("}")
        quote_end = forward.find('"')
        tag_end = forward.find("</style>")
        if tag_end >= 0 and (brace_end < 0 or tag_end < brace_end):
            end = pos + tag_end + len("</style>")
        elif brace_end >= 0:
            end = pos + brace_end + 1
        elif quote_end >= 0:
            end = pos + quote_end + 1
    else:
        ctx_type = "generic"

    context = text[start:end]
    # Truncate if too large
    if len(context) > 1200:
        half = 600
        context = context[:half] + "\n  ... [TRUNCATED] ...\n" + context[-half:]

    return context, ctx_type


def main():
    SEP = "=" * 80
    DASH = "-" * 60

    print(SEP)
    print("CSS PROPERTY EXTRACTION REPORT")
    print(SEP)
    print(f"\nSource file: {INPUT_FILE}")
    print(f"Reading line 3 (0-indexed: {TARGET_LINE_INDEX})...\n")

    line = read_line(INPUT_FILE, TARGET_LINE_INDEX)
    print(f"Line 3 length: {len(line):,} characters\n")

    # -- Define all patterns ------------------------------------------------
    patterns = {
        "rotate (standalone property)": re.compile(r'(?<![-\w])rotate\s*:\s*[^;"\'}]+'),
        "rotate() in transform (all prefixes)": re.compile(
            r'-?(?:webkit|moz)?-?transform\s*:\s*[^;"\']*?rotate\('
        ),
        "filter:": re.compile(r'(?<![-\w])filter\s*:\s*[^;"\'}]+'),
        "-webkit-filter:": re.compile(r'-webkit-filter\s*:\s*[^;"\'}]+'),
        "transform: (all prefixes)": re.compile(
            r'(?:transform|-webkit-transform|-moz-transform)\s*:\s*[^;"\'}]+'
        ),
    }

    # -- Also: any rotate( in any context (CSS, JS, inline) -----------------
    all_rotate_calls = re.compile(r'rotate\(')

    all_results = {}  # pattern_name -> list of (pos, match_text, context, ctx_type)

    for name, pat in patterns.items():
        matches = []
        for m in re.finditer(pat, line):
            pos = m.start()
            match_text = m.group()
            context, ctx_type = extract_context(line, pos)
            matches.append((pos, match_text, context, ctx_type))
        all_results[name] = matches

    # Also count ALL rotate( occurrences
    all_rotate_matches = list(re.finditer(all_rotate_calls, line))

    # -- Print report -------------------------------------------------------
    grand_total = 0
    for name, matches in all_results.items():
        count = len(matches)
        grand_total += count
        print(f"\n{DASH}")
        print(f"  [{name}]  --  {count} match(es)")
        print(DASH)

        if count == 0:
            continue

        for idx, (pos, match_text, context, ctx_type) in enumerate(matches):
            print(f"\n  --- Match #{idx + 1} at byte offset {pos:,} ---")
            print(f"  Context type: {ctx_type}")
            print(f"  Exact match:  {match_text!r}")
            print(f"  Surrounding context ({len(context)} chars):")
            # Indent the context
            for ctx_line in context.split("\n"):
                print(f"    | {ctx_line}")
            print()

    # -- All rotate( calls --------------------------------------------------
    print(f"\n{SEP}")
    print(f"  [ALL rotate( occurrences anywhere]  --  {len(all_rotate_matches)} total")
    print(SEP)
    for idx, m in enumerate(all_rotate_matches):
        pos = m.start()
        context, ctx_type = extract_context(line, pos, max_context=100)
        # Show a condensed one-liner
        print(f"  #{idx + 1:4d}  offset {pos:>8,}  [{ctx_type:22s}]  {m.group()!r}")

    # -- Additional: detect all CSS context types ---------------------------
    print(f"\n{SEP}")
    print("  SUPPLEMENTARY: CSS context zone analysis")
    print(SEP)

    # Find all <style>...</style> blocks
    style_blocks = list(re.finditer(r'<style[^>]*>(.*?)</style>', line, re.DOTALL))
    print(f"  <style> blocks found: {len(style_blocks)}")
    for idx, m in enumerate(style_blocks):
        block = m.group(1)
        print(f"    Block #{idx + 1}: offset {m.start():,}, {len(block):,} chars")

    # Find all inline style="..." attributes
    inline_styles = list(re.finditer(r'style="([^"]*)"', line))
    print(f"  Inline style=\"...\" attributes found: {len(inline_styles)}")

    # -- Grand summary ------------------------------------------------------
    print(f"\n{SEP}")
    print("  GRAND SUMMARY")
    print(SEP)
    for name, matches in all_results.items():
        print(f"    {name:40s} -> {len(matches):4d}")
    print(f"    {'ALL rotate( occurrences':40s} -> {len(all_rotate_matches):4d}")
    print(f"    {'-' * 50}")
    # Avoid double-counting: filter/transform/rotate patterns overlap
    # Show raw counts per pattern (they may overlap)
    unique_positions = set()
    for matches in all_results.values():
        for pos, _, _, _ in matches:
            unique_positions.add(pos)
    print(f"    {'Unique match positions (combined)':40s} -> {len(unique_positions):4d}")
    print(SEP)


if __name__ == "__main__":
    main()
