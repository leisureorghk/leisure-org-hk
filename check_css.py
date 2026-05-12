import re
from ftplib import FTP

ftp = FTP()
ftp.connect('leisure.org.hk', 21, timeout=20)
ftp.login('leisureadminftp', 'osBdH45#')
ftp.set_pasv(False)
ftp.cwd('/web')

# Download CSS
lines = []
ftp.retrlines('RETR css/style.css', lines.append)
data = '\n'.join(lines)

# Find all media query blocks that contain mobile-menu-btn
for m in re.finditer(r'@media[^{]+\{', data):
    start = m.start()
    # Find matching closing brace
    depth = 0
    end = start
    for i, ch in enumerate(data[start:]):
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = start + i + 1
                break
    block = data[start:end]
    if 'mobile-menu-btn' in block:
        print(f'=== MEDIA BLOCK at {start} ===')
        print(block[:500])
        print('...')

# Base rules
for pat, label in [('\\.mobile-menu-btn', 'MOBILE-MENU-BTN'), ('\\.nav\\s*\\{', 'NAV'), ('\\.header-inner', 'HEADER-INNER')]:
    m = re.search(pat, data)
    if m:
        print(f'\nBASE [{label}]: {data[m.start():m.start()+200]}')

print('\nCSS size on server:', ftp.size('css/style.css'))
ftp.quit()
