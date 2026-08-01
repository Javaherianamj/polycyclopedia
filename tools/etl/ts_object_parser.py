"""A small, deliberately narrow parser for the subset of JS/TS object-literal
syntax used by ``src/data/polymersData.ts``.

There is no Node.js in this environment, so the legacy TypeScript data file
cannot be executed or transpiled -- it has to be read as text. Rather than
patch together regexes over the whole 1200+ line file (fragile, and every
edge case silently mis-parses something), this module implements a tiny
recursive-descent parser over exactly the grammar the file actually uses:

    value      := object | array | string | number | identifier
    object     := '{' (member (',' member)* ','? )? '}'
    member     := (IDENT | STRING) ':' value
    array      := '[' (value (',' value)* ','? )? ']'
    string     := '...' | "..."   (no escape sequences other than \\, \\', \\")
    number     := '-'? DIGITS ('.' DIGITS)?
    identifier := bare word (used only for the rare bare literal; unused here
                  but supported for robustness)

Comments (`//...` and `/* ... */`) are skipped like whitespace. Trailing
commas before a closing `}`/`]` are tolerated even though the source file
does not currently use them, since that costs nothing and guards against a
future edit that adds one.

This is intentionally NOT a general JS parser: template literals, computed
keys, spread syntax, regexes, etc. are all unsupported and raise
``TSParseError`` rather than silently guessing.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class TSParseError(Exception):
    def __init__(self, message: str, pos: int, text: str):
        line = text.count("\n", 0, pos) + 1
        col = pos - (text.rfind("\n", 0, pos))
        super().__init__(f"{message} (line {line}, col {col})")
        self.line = line
        self.col = col


_WHITESPACE = " \t\r\n"
_IDENT_START = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$")
_IDENT_CONT = _IDENT_START | set("0123456789")


class _Tokenizer:
    """Skips whitespace/comments and hands out raw character positions.

    Kept minimal on purpose: the parser below does its own lookahead by
    peeking characters rather than going through a separate token stream,
    which is easier to reason about for a grammar this small.
    """

    def __init__(self, text: str):
        self.text = text
        self.n = len(text)
        self.i = 0

    def skip_ws_and_comments(self) -> None:
        while self.i < self.n:
            ch = self.text[self.i]
            if ch in _WHITESPACE:
                self.i += 1
                continue
            if ch == "/" and self.i + 1 < self.n and self.text[self.i + 1] == "/":
                nl = self.text.find("\n", self.i)
                self.i = self.n if nl == -1 else nl + 1
                continue
            if ch == "/" and self.i + 1 < self.n and self.text[self.i + 1] == "*":
                end = self.text.find("*/", self.i + 2)
                if end == -1:
                    raise TSParseError("unterminated block comment", self.i, self.text)
                self.i = end + 2
                continue
            break

    def peek(self) -> str:
        if self.i >= self.n:
            return ""
        return self.text[self.i]

    def error(self, message: str) -> TSParseError:
        return TSParseError(message, self.i, self.text)


class TSObjectParser:
    """Parses one JS-literal ``value`` starting at the tokenizer's position."""

    def __init__(self, text: str):
        self.tok = _Tokenizer(text)

    def parse_value(self) -> Any:
        self.tok.skip_ws_and_comments()
        ch = self.tok.peek()
        if ch == "{":
            return self._parse_object()
        if ch == "[":
            return self._parse_array()
        if ch in ("'", '"'):
            return self._parse_string()
        if ch == "-" or ch.isdigit():
            return self._parse_number()
        if ch and ch in _IDENT_START:
            return self._parse_identifier()
        raise self.tok.error(f"unexpected character {ch!r} while parsing a value")

    def _expect(self, char: str) -> None:
        self.tok.skip_ws_and_comments()
        if self.tok.peek() != char:
            raise self.tok.error(f"expected {char!r}, found {self.tok.peek()!r}")
        self.tok.i += 1

    def _parse_object(self) -> dict:
        self._expect("{")
        result: dict = {}
        self.tok.skip_ws_and_comments()
        if self.tok.peek() == "}":
            self.tok.i += 1
            return result
        while True:
            self.tok.skip_ws_and_comments()
            key = self._parse_key()
            self._expect(":")
            value = self.parse_value()
            result[key] = value
            self.tok.skip_ws_and_comments()
            ch = self.tok.peek()
            if ch == ",":
                self.tok.i += 1
                self.tok.skip_ws_and_comments()
                if self.tok.peek() == "}":
                    self.tok.i += 1
                    return result
                continue
            if ch == "}":
                self.tok.i += 1
                return result
            raise self.tok.error(f"expected ',' or '}}' in object, found {ch!r}")

    def _parse_key(self) -> str:
        ch = self.tok.peek()
        if ch in ("'", '"'):
            return self._parse_string()
        if ch in _IDENT_START:
            return self._parse_bare_identifier()
        raise self.tok.error(f"expected object key, found {ch!r}")

    def _parse_bare_identifier(self) -> str:
        start = self.tok.i
        while self.tok.i < self.tok.n and self.tok.text[self.tok.i] in _IDENT_CONT:
            self.tok.i += 1
        if self.tok.i == start:
            raise self.tok.error("expected identifier")
        return self.tok.text[start : self.tok.i]

    def _parse_identifier(self) -> Any:
        word = self._parse_bare_identifier()
        if word == "true":
            return True
        if word == "false":
            return False
        if word in ("null", "undefined"):
            return None
        raise self.tok.error(f"unsupported bare identifier {word!r}")

    def _parse_array(self) -> list:
        self._expect("[")
        result: list = []
        self.tok.skip_ws_and_comments()
        if self.tok.peek() == "]":
            self.tok.i += 1
            return result
        while True:
            result.append(self.parse_value())
            self.tok.skip_ws_and_comments()
            ch = self.tok.peek()
            if ch == ",":
                self.tok.i += 1
                self.tok.skip_ws_and_comments()
                if self.tok.peek() == "]":
                    self.tok.i += 1
                    return result
                continue
            if ch == "]":
                self.tok.i += 1
                return result
            raise self.tok.error(f"expected ',' or ']' in array, found {ch!r}")

    def _parse_string(self) -> str:
        quote = self.tok.peek()
        self.tok.i += 1
        chars: list[str] = []
        text, n = self.tok.text, self.tok.n
        while True:
            if self.tok.i >= n:
                raise self.tok.error("unterminated string literal")
            ch = text[self.tok.i]
            if ch == quote:
                self.tok.i += 1
                return "".join(chars)
            if ch == "\\":
                if self.tok.i + 1 >= n:
                    raise self.tok.error("unterminated escape sequence")
                nxt = text[self.tok.i + 1]
                simple = {"n": "\n", "t": "\t", "r": "\r", "\\": "\\", "'": "'", '"': '"'}
                if nxt in simple:
                    chars.append(simple[nxt])
                    self.tok.i += 2
                    continue
                # Unknown escape: keep the character verbatim rather than
                # guessing (never silently drop legacy content).
                chars.append(nxt)
                self.tok.i += 2
                continue
            chars.append(ch)
            self.tok.i += 1

    def _parse_number(self) -> float | int:
        start = self.tok.i
        text, n = self.tok.text, self.tok.n
        if text[self.tok.i] == "-":
            self.tok.i += 1
        digits_start = self.tok.i
        while self.tok.i < n and text[self.tok.i].isdigit():
            self.tok.i += 1
        if self.tok.i == digits_start:
            raise self.tok.error("malformed number literal")
        is_float = False
        if self.tok.i < n and text[self.tok.i] == "." and self.tok.i + 1 < n and text[self.tok.i + 1].isdigit():
            is_float = True
            self.tok.i += 1
            while self.tok.i < n and text[self.tok.i].isdigit():
                self.tok.i += 1
        raw = text[start : self.tok.i]
        return float(raw) if is_float else int(raw)


def parse_js_value(text: str) -> Any:
    """Parse a single JS/TS literal value from ``text`` (leading/trailing
    whitespace and comments are ignored, but there must be nothing else
    left over after the value)."""
    parser = TSObjectParser(text)
    value = parser.parse_value()
    parser.tok.skip_ws_and_comments()
    if parser.tok.i != parser.tok.n:
        raise parser.tok.error("unexpected trailing content after top-level value")
    return value


@dataclass
class ExtractedArray:
    source_var: str
    value: list


def extract_exported_array(ts_source: str, export_name: str) -> list:
    """Finds ``export const <export_name>: ... = [ ... ];`` in a `.ts` file
    and parses the array-literal on its right-hand side using the mini
    parser above. Raises ``TSParseError``/``ValueError`` if the marker
    can't be found or the literal doesn't parse cleanly.
    """
    import re

    marker = re.search(rf"export\s+const\s+{re.escape(export_name)}\b[^=]*=", ts_source)
    if not marker:
        raise ValueError(f"could not find 'export const {export_name} = ' in source")
    start = marker.end()
    # Skip to the opening '['
    i = start
    while i < len(ts_source) and ts_source[i] in _WHITESPACE:
        i += 1
    if i >= len(ts_source) or ts_source[i] != "[":
        raise ValueError(f"expected array literal after 'export const {export_name} =', found {ts_source[i:i+30]!r}")
    parser = TSObjectParser(ts_source[i:])
    value = parser.parse_value()
    if not isinstance(value, list):
        raise ValueError("top-level export is not an array literal")
    # Confirm the statement is properly terminated with `;` (sanity check,
    # not load-bearing for the parse itself).
    tail_start = i + parser.tok.i
    tail = ts_source[tail_start:].lstrip()
    if not tail.startswith(";"):
        raise ValueError("expected ';' after top-level array literal")
    return value
