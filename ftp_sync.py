#!/usr/bin/env python3
"""
將專案靜態檔同步至 leisure.org.hk FTP（/web）。
憑證：環境變數 FTP_HOST, FTP_USER, FTP_PASS；未設則用專案預設。

用法：python ftp_sync.py
"""
from __future__ import annotations

import os
import sys
from ftplib import FTP, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parent

SKIP_DIRS = {'.git', '.github', '.cursor', 'automation', 'node_modules', '__pycache__'}
SKIP_FILES = {
    '.gitignore',
    'ftp_sync.py',
    'check2.py',
    'check3.py',
    'check4.py',
    'check5.py',
    'check_css.py',
    'fix_final.py',
    'fix_menu.py',
    'GITHUB_SETUP.md',
    'AUTOMATION.md',
    'GOOGLE_BUSINESS_PROFILE.md',
    'parent-guide-first-swim.txt',
    'sensory-games-home-guide.txt',
    'visual-cue-cards-pack.txt',
}
ALLOW_EXT = {
    '.html', '.css', '.js', '.json', '.xml', '.txt', '.webp', '.svg',
    '.png', '.jpg', '.jpeg', '.ico', '.webmanifest', '.htaccess',
}


def ftp_config():
    return (
        os.environ.get('FTP_HOST', 'leisure.org.hk'),
        os.environ.get('FTP_USER', 'leisureadminftp'),
        os.environ.get('FTP_PASS', 'osBdH45#'),
        os.environ.get('FTP_REMOTE_DIR', '/web'),
    )


def collect_files():
    out = []
    for path in ROOT.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in SKIP_DIRS:
            continue
        if path.name in SKIP_FILES:
            continue
        if path.suffix.lower() not in ALLOW_EXT and path.name != '.htaccess':
            continue
        out.append(rel.as_posix())
    return sorted(out)


def cwd_to_base(ftp: FTP, base: str) -> None:
    ftp.cwd('/')
    ftp.cwd(base.lstrip('/'))


def ensure_dirs(ftp: FTP, base: str, dir_path: str) -> None:
    if not dir_path:
        return
    cwd_to_base(ftp, base)
    for segment in dir_path.split('/'):
        if not segment:
            continue
        try:
            ftp.cwd(segment)
        except error_perm:
            try:
                ftp.mkd(segment)
            except error_perm:
                pass
            ftp.cwd(segment)


def upload_one(ftp: FTP, base: str, rel: str) -> None:
    dir_path = os.path.dirname(rel).replace('\\', '/')
    filename = os.path.basename(rel)
    ensure_dirs(ftp, base, dir_path)
    local = ROOT / rel
    with open(local, 'rb') as fh:
        ftp.storbinary('STOR ' + filename, fh)


def main():
    host, user, password, remote_base = ftp_config()
    files = collect_files()
    print(f'準備上傳 {len(files)} 個檔案 → ftp://{host}{remote_base}')

    ftp = FTP()
    ftp.connect(host, 21, timeout=120)
    ftp.login(user, password)
    ftp.set_pasv(False)

    ok = fail = 0
    for rel in files:
        try:
            upload_one(ftp, remote_base, rel)
            print(f'  OK  {rel}')
            ok += 1
        except Exception as e:
            print(f'  FAIL {rel}: {e}')
            fail += 1

    ftp.quit()
    print(f'完成：成功 {ok}，失敗 {fail}')
    return 0 if fail == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
