import re
from ftplib import FTP
from pathlib import Path

# 1. Update all HTML files with new cache bust and stronger link
pages = ['index.html','about.html','services.html','why-us.html','resources.html','blog.html','booking.html','contact.html']
for f in pages:
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    # Upgrade cache buster to new version
    c = c.replace('css/style.css?v=20260512a', 'css/style.css?v=20260512b')
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(c)
    print('Updated cache buster in', f)

# 2. Verify local CSS is correct - read and check
with open('css/style.css', 'r', encoding='utf-8') as fh:
    css = fh.read()

# Find the base .mobile-menu-btn rule
base_match = re.search(r'\.mobile-menu-btn\s*\{[^}]+\}', css)
print('\nBase .mobile-menu-btn rule:', base_match.group() if base_match else 'NOT FOUND')

# Check tablet media query
tablet_match = re.search(r'@media\s*\([^)]*min-width:\s*744px[^)]*\)\s*and\s*\([^)]*max-width:\s*1200px[^)]*\)\s*\{[^}]+\}', css)
print('Tablet media query found:', bool(tablet_match))

# Check mobile media query
mobile_match = re.search(r'@media\s*\([^)]*max-width:\s*744px[^)]*\)\s*\{', css)
print('Mobile media query found:', bool(mobile_match))

# Check all mobile-menu-btn display values
for m in re.finditer(r'\.mobile-menu-btn[^{]*\{[^}]*\}', css):
    block = m.group()
    if 'display' in block:
        print('Found rule:', block[:200])

print('\nLocal CSS size:', Path('css/style.css').stat().st_size)
