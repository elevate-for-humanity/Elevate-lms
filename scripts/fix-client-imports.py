import os
import re

root_dir = r'C:\Users\eliza\AccioWork\2026-06-20-20-46-31\Elevate-lms\app'

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "'use client'" in content and "@/lib/supabase/server" in content:
                print(f"Fixing {path}")
                new_content = content.replace("@/lib/supabase/server", "@/lib/supabase/client")
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
