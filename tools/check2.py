import re
from ftplib import FTP

ftp = FTP()
ftp.connect('leisure.org.hk', 21, timeout=20)
ftp.login('leisureadminftp', 'osBdH45#')
ftp.set_pasv(False)
ftp.cwd('/web')

# Get CSS content from server
lines = []
ftp.retrlines('RETR css/style.css', lines.append)
css = '\n'.join(lines)

print('=== SERVER CSS size:', ftp.size('css/style.css'), '===')

# Find .mobile-menu-btn base rule
m = re.search(r'\.mobile-menu-btn\s*\{[^}]+\}', css)
if m:
    print('\n.base .mobile-menu-btn rule:')
    print(m.group())

# Check what breakpoints apply at 1080px
# At 1080px: max-width:744px=FASE, min-width:744px AND max-width:1200px=TRUE (tablet → hamburger hidden)
print('\n=== At 1080px width ===')
print('max-width:744px test: 1080 <= 744?', 1080 <= 744)
print('min-width:744px AND max-width:1200px: 1080>=744 AND 1080<=1200?', 1080>=744 and 1080<=1200)
print('Result: Should be HIDDEN (tablet breakpoint applies)')

# Show the tablet and mobile media query lines
for m in re.finditer(r'@media[^{]+\{', css):
    block_start = m.start()
    depth = 0
    for i, ch in enumerate(css[block_start:]):
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                block = css[block_start:block_start+i+1]
                if '744' in block or 'mobile-menu-btn' in block:
                    print('\nRelevant block:')
                    print(block[:400])
                break

# Check viewport meta in index.html on server
lines2 = []
ftp.retrlines('RETR index.html', lines2.append)
html = '\n'.join(lines2)
m = re.search(r'<meta[^>]+viewport[^>]*>', html)
print('\n=== index.html viewport meta ===')
print(m.group() if m else 'NOT FOUND')

print('\nCSS href in index.html:')
m2 = re.search(r'<link[^>]+stylesheet[^>]+>', html)
if m2: print(m2.group())

ftp.quit()
