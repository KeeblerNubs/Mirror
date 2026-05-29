#!/usr/bin/env python3
"""Serve Mirror's static PWA assets with Python's standard library.

This intentionally serves only the files in public/. Cloudflare Pages Functions
under functions/api/ are not executed by this script, so AI endpoints will not
work here. Use `npm run dev` or Docker for full local API behavior.
"""

from __future__ import annotations

import argparse
import functools
import http.server
import socketserver
from pathlib import Path


class MirrorStaticHandler(http.server.SimpleHTTPRequestHandler):
    """Static file handler with friendlier caching for local PWA testing."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    default_directory = repo_root / "public"

    parser = argparse.ArgumentParser(description="Serve Mirror static files locally.")
    parser.add_argument("--host", default="127.0.0.1", help="Host/IP to bind. Use 0.0.0.0 for LAN access.")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on.")
    parser.add_argument("--directory", default=str(default_directory), help="Directory to serve.")
    args = parser.parse_args()

    directory = Path(args.directory).resolve()
    if not directory.is_dir():
        raise SystemExit(f"Directory not found: {directory}")

    handler = functools.partial(MirrorStaticHandler, directory=str(directory))

    with socketserver.ThreadingTCPServer((args.host, args.port), handler) as httpd:
        print(f"Serving Mirror static files from {directory}")
        print(f"Open http://{args.host}:{args.port}/")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
