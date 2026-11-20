# COORDINATION.md — Shared Task Board

This file coordinates work on `snapquast73-boop/LIVESCERRPEND` to restore the GitHub Pages site (`https://snapquast73-boop.github.io/LIVESCERRPEND/`) and ensure all links, assets, and verification rules are satisfied.

## Tasks

| Task ID | Description | Status | Session ID | Branch | Files Touched | Notes / Sources |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| T-01 | Inspect repository & create COORDINATION.md | done | arena-b3fde79a | `arena/b3fde79a-livescerrpend` | `COORDINATION.md` | Checked `git status`, `gh api repos/snapquast73-boop/LIVESCERRPEND/pages`, `index.html`, `README.md`. |
| T-02 | Create `assets/css/style.css` matching `index.html` classes | done | arena-b3fde79a | `arena/b3fde79a-livescerrpend` | `assets/css/style.css` | Restored stylesheet referenced by `index.html`; verified HTTP 200. |
| T-03 | Create `assets/js/*.js` modules (`api.js`, `render.js`, `run-removed.js`, `pending.js`, `reviews.js`, `decision-changes.js`, `scorer.js`, `model.js`, `app.js`) | done | arena-b3fde79a | `arena/b3fde79a-livescerrpend` | `assets/js/*.js` | Supports all tabs, CSV export, live `statsapi.mlb.com` fetch in browser, and Flagged for Review tab. |
| T-04 | Create `data/*.json` placeholders (empty/unverified, no hallucinated data) | done | arena-b3fde79a | `arena/b3fde79a-livescerrpend` | `data/*.json` | Validated all 8 JSON files; unverified counts left empty and flagged. |
| T-05 | Update `index.html` links (point to `snapquast73-boop/LIVESCERRPEND`) & add "Flagged for Review" tab | done | arena-b3fde79a | `arena/b3fde79a-livescerrpend` | `index.html` | Added Flagged for Review view with official source links. |
| T-06 | Verify site locally, open PR to `main`, merge PR, and confirm GitHub Pages deployment | done | arena-b3fde79a | `arena/b3fde79a-livescerrpend` | `COORDINATION.md` | Verified all assets return HTTP 200 locally; PR created and merged to `main`. |

## Irregularities & Flagged Items

1. **Missing subdirectories in initial upload:** The initial commit (`aa23dc5`) only contained root files (`index.html`, `README.md`, `conftest.py`, `requirements.txt`, `.gitignore`, `.gitattributes`, `.nojekyll`). `assets/`, `data/`, `src/`, `scripts/`, and `docs/` were not included.
2. **Original upstream repo unavailable:** `https://github.com/buffedlizard55-lab/LiveScoringErrors-Pending` returned HTTP 404 from GitHub API.
3. **MLB Stats API unreachable in sandbox:** Outbound internet access in the build sandbox is restricted to GitHub/npm/PyPI hosts, so `statsapi.mlb.com` cannot be harvested from the sandbox. Live browser fetching from `statsapi.mlb.com` is implemented in `assets/js/pending.js`, and harvested data files are initialized empty with unverified status flagged on the "Flagged for Review" page.
