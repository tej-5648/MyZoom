import os

directory = 'src'
api_target1 = "'http://localhost:8000/"
api_target2 = "`http://localhost:8000/"
ws_target = "`ws://localhost:8000/"

api_replace = "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/"
ws_replace = "`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/"

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace(api_target1, api_replace)
            new_content = new_content.replace(api_target2, api_replace)
            new_content = new_content.replace(ws_target, ws_replace)
            new_content = new_content.replace("'http://localhost:8000'", "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')")
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
