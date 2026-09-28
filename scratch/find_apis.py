import re

with open("scratch/app_(main)_curators_page-616a2e4bccedebc1.js", "r", encoding="utf-8") as f:
    code = f.read()

print("JS Code sample:")
print(code[:2000])

# Find fetch or api calls
apis = re.findall(r'fetch\([^)]+\)|["\'](/api/[^"\']+)["\']|["\'](https://[^"\']+)["\']', code)
print("\nAPIs/URLs found in page chunk:")
for a in apis:
    print(a)
