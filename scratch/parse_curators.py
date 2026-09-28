import re
import json

with open("curators_pushes.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Let's search for patterns of curator data in the text or HTML
with open("curators_raw.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's print out snippets containing image URLs or titles or categories
print("Searching for images or names...")

# Look for json or image tags or text
img_srcs = re.findall(r'src=["\']([^"\']+)["\']', html)
print("Found img srcs:", len(img_srcs))
for s in img_srcs[:20]:
    print(" -", s)

# Search for disciplines/categories like Culinary, Music, Dance, Theatre, Craft, Visual Arts, Special Projects, Accessibility
disciplines = ["Culinary Arts", "Culinary", "Music", "Dance", "Theatre", "Craft", "Visual Arts", "Special Projects", "Accessibility"]
for d in disciplines:
    count = html.count(d)
    print(f"Discipline '{d}' count: {count}")
