import os
import re

directory = 'src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The bad pattern looks like this:
            # fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/api/meetings',
            # Or ws: `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/meeting/${id}`);
            
            # Since the script made a mess of the quotes, the best way to fix it is to find the occurrences of the bad start,
            # and properly close the backtick at the end of the URL string.
            
            # Let's just fix it with regex.
            # We are looking for something like:
            # `${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/api/meetings'
            
            new_content = content.replace("`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/", "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/")
            
            # Now we have `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings'
            # We need to change the trailing single quote to a backtick.
            # Regex: `\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'}/[^']*'
            
            new_content = re.sub(r"(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'\}/[^']*)'", r"\1`", new_content)
            
            # Same for WS. It was originally `ws://localhost...` so it already had backticks. 
            # The python script did:
            # ws_target = "`ws://localhost:8000/"
            # ws_replace = "`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/"
            # It replaced "`ws://..." with "`${...}/" and the trailing backtick was left intact.
            # So WS is probably fine, but let's check if it got nested incorrectly.
            # "`${process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/" -> wait!
            # The script did:
            # new_content = new_content.replace("'http://localhost:8000'", "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')")
            # So the ws_replace became "`${process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/"
            new_content = new_content.replace("`${process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/", "`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/")
            
            # What about the standalone string replace?
            # It replaced 'http://localhost:8000' with (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
            # So `fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api')` would be fine but wait, we didn't do `+`.
            # Let's fix that too.
            new_content = new_content.replace("((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'))", "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')")
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {path}")
