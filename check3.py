from ftplib import FTP

ftp = FTP()
ftp.connect('leisure.org.hk', 21, timeout=20)
ftp.login('leisureadminftp', 'osBdH45#')
ftp.set_pasv(False)
ftp.cwd('/web')

# Get full HTML
lines = []
ftp.retrlines('RETR index.html', lines.append)
html = '\n'.join(lines)

# Find all link tags
import re
links = re.findall(r'<link[^>]+>', html)
print('ALL link tags in index.html:')
for l in links:
    print(' ', l)

print('\nLines 10-20 of index.html:')
html_lines = html.split('\n')
for i, l in enumerate(html_lines[9:20], 10):
    print(f'  L{i}: {l}')

ftp.quit()
