import urllib.request
import re

chunks = [
    "app/(main)/curators/page-616a2e4bccedebc1.js",
    "8575-28384e1c448e9643.js",
    "272-5c232260aac3ecc5.js"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

for chunk in chunks:
    url = f"https://serendipityartsfestival.com/_next/static/chunks/{chunk}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
        print(f"Downloaded {chunk}, length: {len(content)}")
        
        # Save to file
        safe_name = chunk.replace('/', '_')
        with open(f"scratch/{safe_name}", "w", encoding="utf-8") as f:
            f.write(content)
            
    except Exception as e:
        print(f"Error downloading {chunk}: {e}")
