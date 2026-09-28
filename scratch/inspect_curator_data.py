import os
import re
import json

for fname in os.listdir("scratch"):
    if fname.endswith(".js"):
        path = os.path.join("scratch", fname)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            print(f"=== {fname} ({len(content)} bytes) ===")
            # Look for curator array, images, names
            names = re.findall(r'name:["\']([^"\']+)["\']', content)
            titles = re.findall(r'title:["\']([^"\']+)["\']', content)
            categories = re.findall(r'category:["\']([^"\']+)["\']|discipline:["\']([^"\']+)["\']', content)
            images = re.findall(r'image:["\']([^"\']+)["\']|src:["\']([^"\']+)["\']|avatar:["\']([^"\']+)["\']', content)
            print(f"Names found: {names[:10]}")
            print(f"Titles found: {titles[:10]}")
            print(f"Categories found: {categories[:10]}")
            print(f"Images found: {images[:10]}")
            print("\n")
