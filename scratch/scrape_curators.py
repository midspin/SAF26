import urllib.request
import re
import json

url = 'https://serendipityartsfestival.com/curators'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    print(f"HTML length: {len(html)}")
    
    # Save to file for inspection
    with open("curators_raw.html", "w", encoding="utf-8") as f:
        f.write(html)
        
    # Extract Next.js data streams or text contents
    pushes = re.findall(r'self\.__next_f\.push\(([\s\S]*?)\)</script>', html)
    print(f"Found {len(pushes)} Next.js push scripts")
    
    all_text = ""
    for p in pushes:
        all_text += p + "\n"
        
    with open("curators_pushes.txt", "w", encoding="utf-8") as f:
        f.write(all_text)
        
    print("Saved curators_pushes.txt")

except Exception as e:
    print(f"Error: {e}")
