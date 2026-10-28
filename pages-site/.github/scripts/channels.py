"""Build channels.js from the ALMOGHANI LIVE channel file.

The list is fetched here (not in the browser) because almoghani.net does not allow
cross-origin reads, and a static GitHub Pages build has no server to proxy it.
"""

import json
import re
import urllib.request

SOURCE = "https://almoghani.net/aa.m3u"


def fetch():
    request = urllib.request.Request(SOURCE, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(request, timeout=45).read().decode("utf-8-sig", "replace")


def parse(text):
    rows, seen = [], set()
    name = logo = group = ""
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("#EXTINF"):
            name = line.rsplit(",", 1)[-1].strip()
            group_match = re.search(r'group-title="([^"]*)"', line)
            logo_match = re.search(r'tvg-logo="([^"]*)"', line)
            group = group_match.group(1) if group_match else "عام"
            logo = logo_match.group(1) if logo_match else ""
        elif line and not line.startswith("#"):
            if line in seen or not name or not line.lower().startswith(("http://", "https://")):
                continue
            seen.add(line)
            rows.append({"n": name, "u": line, "g": group, "l": logo})
            name = logo = group = ""
    return rows


def main():
    try:
        rows = parse(fetch())
    except Exception as error:  # keep the last good list instead of emptying the page
        print("could not refresh the channel list:", error)
        return
    if len(rows) < 20:
        print("refusing to publish a suspiciously short list:", len(rows))
        return
    with open("channels.js", "w", encoding="utf-8") as handle:
        handle.write("window.CHANNELS=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";")
    print("wrote channels.js with", len(rows), "channels")


main()
