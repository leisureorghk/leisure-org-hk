#!/usr/bin/env python3
"""
（已停用自動化）僅供本機手動備份／舊主機遷移時使用。
官網現由 GitHub Pages 提供，請改用 git push，勿再依賴 FTP 更新。

憑證：環境變數 FTP_HOST, FTP_USER, FTP_PASS。

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
    '.png', '.jpg', '.jpeg', '.ico', '.webmanifest', }

# 部分主機禁止上傳隱藏檔，可略過
SKIP_UPLOAD_NAMES = {'.htaccess'}


def ftp_host_candidates():
    """頂層 leisure.org.hk 常無 A 記錄；FTP 在 ftp./mail. 子網域。"""
    custom = os.environ.get('FTP_HOST', '').strip()
    if custom:
        return [custom]
    return [
        'ftp.leisure.org.hk',
        'mail.leisure.org.hk',
        'leisure.org.hk',  # 舊腳本預設，多數環境無法解析
    ]


def ftp_config():
    password = os.environ.get('FTP_PASS', '').strip()
    if not password:
        print('錯誤：請設定環境變數 FTP_PASS（本機或 GitHub Actions Secret）。')
        raise SystemExit(1)
    remote_dir = os.environ.get('FTP_REMOTE_DIR', '').strip() or '/web'
    user = os.environ.get('FTP_USER', '').strip() or 'leisureadminftp'
    return (
        ftp_host_candidates(),
        user,
        password,
        remote_dir,
    )


def collect_files():
    out = []
    for path in ROOT.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in SKIP_DIRS:
            continue
        if path.name in SKIP_FILES or path.name in SKIP_UPLOAD_NAMES:
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
    cwd_to_base(ftp, base)
    if dir_path:
        ensure_dirs(ftp, base, dir_path)
    else:
        cwd_to_base(ftp, base)
    local = ROOT / rel
    with open(local, 'rb') as fh:
        ftp.storbinary('STOR ' + filename, fh)
    cwd_to_base(ftp, base)


def connect_ftp(hosts, user, password):
    pasv = os.environ.get('FTP_PASSIVE', '0').strip() in ('1', 'true', 'yes')
    errors = []
    for host in hosts:
        try:
            ftp = FTP()
            ftp.connect(host, 21, timeout=120)
            ftp.login(user, password)
            ftp.set_pasv(pasv)
            print(f'已連線：{host}（{"被動" if pasv else "主動"}模式）')
            return ftp, host
        except OSError as e:
            errors.append(f'{host}: {e}')
            print(f'  無法連線 {host} — {e}')
    print('\n所有 FTP 主機均失敗。')
    print('請設定：$env:FTP_HOST = "ftp.leisure.org.hk"')
    print('或向主機商索取 FTP 主機名／IP（約 58.64.192.201）。')
    if errors:
        print('\n詳情：\n  ' + '\n  '.join(errors))
    raise SystemExit(1)


def main():
    hosts, user, password, remote_base = ftp_config()
    files = collect_files()
    print(f'準備上傳 {len(files)} 個檔案 → 遠端 {remote_base}')
    print(f'將嘗試主機：{", ".join(hosts)}')

    ftp, connected_host = connect_ftp(hosts, user, password)

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
    print(f'完成（{connected_host}）：成功 {ok}，失敗 {fail}')
    return 0 if fail == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
