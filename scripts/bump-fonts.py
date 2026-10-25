import re
import io
import os

# 字号提升映射：低于基准的一律抬到基准以上
SCALE = {
    '10.5px': '14px',
    '11px': '14px',
    '11.5px': '14.5px',
    '12px': '15px',
    '12.5px': '15px',
    '13px': '15.5px',
    '13.5px': '16px',
    '14px': '16px',
    '14.5px': '16px',
    '15px': '16.5px',
    '15.5px': '17px',
    '16px': '17.5px',
    '16.5px': '18px',
    '17px': '18.5px',
    '18px': '19.5px',
}

files = []
for d in ['src/components', 'src/styles', 'src']:
    for f in os.listdir(d):
        p = os.path.join(d, f)
        if os.path.isfile(p) and f.endswith(('.vue', '.css', '.ts')):
            files.append(p)

changed = []
for p in files:
    s = io.open(p, encoding='utf-8').read()
    orig = s
    for a, b in SCALE.items():
        # 只替换 font-size: Xpx 形式，避免误伤其他属性
        s = s.replace(f'font-size: {a};', f'font-size: {b};')
    if s != orig:
        io.open(p, 'w', encoding='utf-8').write(s)
        changed.append(p)

print(f'已调整 {len(changed)} 个文件：')
for c in changed:
    print('  ' + c)
