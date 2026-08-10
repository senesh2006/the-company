import os, glob
for f in glob.glob('app/**/*.py', recursive=True):
    if os.path.isfile(f):
        content = open(f, encoding='utf-8').read()
        if '"default-business-id"' in content:
            new_content = content.replace('"default-business-id"', '"00000000-0000-0000-0000-000000000001"')
            open(f, 'w', encoding='utf-8').write(new_content)
