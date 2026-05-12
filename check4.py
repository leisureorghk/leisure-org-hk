import re
from ftplib import FTP

ftp = FTP()
ftp.connect('leisure.org.hk', 21, timeout=20)
ftp.login('leisureadminftp', 'osBdH45#')
ftp.set_pasv(False)
ftp.cwd('/web')

lines = []
ftp.retrlines('RETR css/style.css', lines.append)
css = '\n'.join(lines)

# Find ALL .header rules
for m in re.finditer(r'\.header[^{]*\{', css):
    start = m.start()
    depth = 0
    for i, ch in enumerate(css[start:]):
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                block = css[start:start+i+1]
                print(f'=== .header block at {start} ===')
                print(block)
                print()
                break

# Find ALL media query blocks
for m in re.finditer(r'@media[^{]+\{', css):
    start = m.start()
    depth = 0
    for i, ch in enumerate(css[start:]):
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                block = css[start:start+i+1]
                if 'header' in block.lower() or '.nav' in block or 'display' in block:
                    print(f'=== MEDIA (contains header/nav/display) ===')
                    print(block[:600])
                    print('...')
                break

print('Done')
ftp.quit()
