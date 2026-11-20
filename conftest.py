"""Make `pytest` work from a clean checkout.

The application package lives in ``src/`` (the app is served with
``uvicorn lsp.api:app --app-dir src``), and the pipeline scripts live in ``scripts/``.
Putting both on ``sys.path`` here means a contributor can run ``pytest`` with no
``PYTHONPATH`` ceremony and the GitHub Actions test workflow needs no wrapper either.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

for extra in (ROOT / "src", ROOT / "scripts"):
    if extra.is_dir() and str(extra) not in sys.path:
        sys.path.insert(0, str(extra))
