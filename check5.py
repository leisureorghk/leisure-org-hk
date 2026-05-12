import re
from ftplib import FTP
from pathlib import Path

# Read local CSS
with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Add MOBILE FORCE OVERRIDE at the very top of CSS (after font imports/variables)
# This ensures at<=744px the hamburger is ALWAYS shown, overriding any cached base rule
MOBILE_FORCE = '''
/**** Mobile (<=744px): always show hamburger and drawer nav, v20260512c ****/
@media (max-width: 744px) {
    .mobile-menu-btn { display: flex !important; visibility: visible !important; }
    .nav-backdrop { display: block !important; }
    .nav { display: block !important; position: fixed; top: 0; right: 0; bottom: 0; width: min(300px,82vw); background: #fff; box-shadow: -4px 0 32px rgba(13,40,71,.15); z-index: 1100; transform: translateX(110%); transition: transform .35s cubic-bezier(.4,0,.2,1); }
    .nav.active { transform: translateX(0); }
    .nav-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.5rem; border-bottom: 1px solid #edf2f7; }
    .nav-drawer-links a { display: flex; align-items: center; min-height: 52px; padding: 1rem 1.5rem; border-bottom: 1px solid #edf2f7; font-size: 1.05rem; color: #1a1a2e; font-weight: 500; }
    .nav-drawer-links a:hover { background: rgba(30,87,153,.06); color: #1E5799; }
    .nav-drawer-footer { padding: 1.5rem; border-top: 1px solid #edf2f7; }
    .nav-drawer-footer .btn { width: 100%; min-height: 48px; }
    .nav-close-btn { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; background: transparent; border: none; cursor: pointer; color: #1a1a2e; }
}

'''

# Find insertion point: after the :root {} block
root_end = css.find('} /* ========== Base Reset ========== */')
if root_end != -1:
    insert_pos = root_end + len('} /* ========== Base Reset ========== */')
    css = css[:insert_pos] + MOBILE_FORCE + css[insert_pos:]
    print('Inserted mobile force override after :root')
else:
    print('WARNING: could not find insertion point')

# Write updated CSS
with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

local_size = Path('css/style.css').stat().st_size
print(f'Local CSS size: {local_size}')

# Upload to FTP
ftp = FTP()
ftp.connect('leisure.org.hk', 21, timeout=30)
ftp.login('leisureadminftp', 'osBdH45#')
ftp.set_pasv(False)
ftp.cwd('/web')

with open('css/style.css', 'rb') as f:
    ftp.storbinary('STOR css/style.css', f)
remote_size = ftp.size('css/style.css')
print(f'Replaced CSS: local={local_size} remote={remote_size} OK={local_size==remote_size}')

# Also re-upload all HTML files with latest cache buster
pages = ['index.html','about.html','services.html','why-us.html','resources.html','blog.html','booking.html','contact.html']
for f in pages:
    with open(f, 'rb') as fh:
        ftp.storbinary('STOR ' + f, fh)
    print('Uploaded', f, ftp.size(f))

ftp.quit()
