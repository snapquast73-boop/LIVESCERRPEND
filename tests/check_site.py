"""Check the static Pages entry points and local link targets without network access."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = set()
        self.links = []
        self.refs = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if name := attrs.get('id'):
            assert name not in self.ids, f'Duplicate id: {name}'
            self.ids.add(name)
        self.links.extend(attrs[key] for key in ('href', 'src') if key in attrs)
        self.refs.extend(value for key in ('aria-controls', 'aria-labelledby')
                         for value in attrs.get(key, '').split())


pages = {file: Page(file) for file in ROOT.glob('*.html')}
for file, page in pages.items():
    assert all(ref in page.ids for ref in page.refs), file
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            assert url.scheme == 'https', link
            continue
        assert not url.path.startswith('/'), f'Broken project-relative URL: {link}'
        target = (file.parent / url.path).resolve() if url.path else file
        if target.is_dir():
            target /= 'index.html'
        assert target.is_file(), f'{file.name}: missing {link}'
        if url.fragment:
            assert (url.fragment in pages[target].ids or
                    (target == ROOT / "index.html" and f"view-{url.fragment}" in pages[target].ids
                     and f"{url.fragment}-tab" in pages[target].ids)), f'{file.name}: missing {link}'

assert (ROOT / 'data/site/payload.json').is_file()
assert (ROOT / 'assets/js/mlb.js').is_file()
assert (ROOT / '.nojekyll').is_file()
print('Pages entry points, local links, ARIA targets and packaged assets verified.')
