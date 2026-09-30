
"""Terracraft on Streamlit.

Embeds the LOCAL game files (terraria.html + css + js) directly into the page
instead of iframing the GitHub Pages copy. That copy can go stale (it did:
Pages was serving old entities.js/juice.js against a new terraria.js, so the
Game constructor threw -> black canvas + dead clicks), while the local files
are always the version you just tested.
"""
import re
from pathlib import Path

import streamlit as st

BASE = Path(__file__).parent
GAME_SCRIPTS = [
    "audio.js",
    "particles.js",
    "world.js",
    "weather.js",
    "entities.js",
    "underworld.js",
    "space.js",
    "juice.js",
    "npcs.js",
    "journey.js",
    "terraria.js",
]
GITHUB_FALLBACK = "https://radit-smpaha.github.io/terraria-javascript/terraria.html"
GAME_HEIGHT = 850  # iframe px height; game fills it via 100vh. Raise if hotbar is cut off.

st.set_page_config(
    page_title="Terracraft",
    page_icon="🌲",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
<style>
    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
    }
    header, footer, #MainMenu {
        display: none !important;
    }
    iframe {
        background: #000;
    }
</style>
""",
    unsafe_allow_html=True,
)


def build_inline_html() -> str | None:
    """Inline local CSS + JS into terraria.html. Returns None on any mismatch."""
    try:
        html = (BASE / "terraria.html").read_text(encoding="utf-8")
        css = (BASE / "terraria.css").read_text(encoding="utf-8")
        html = re.sub(
            r"<link[^>]*terraria\.css[^>]*>",
            lambda m, _css=css: "<style>\n/* inlined terraria.css */\n"
            + _css
            + "\n</style>",
            html,
            count=1,
        )
        for name in GAME_SCRIPTS:
            js = (BASE / name).read_text(encoding="utf-8")
            # Escape for HTML parsing only: a literal "</script" (any case)
            # terminates the <script> block, so break it up as <\/script.
            # NOTE: do NOT touch backslash-n / backslash-t etc. The old code
            # also ran a blanket backslash-escape which corrupted regexes and
            # string literals (e.g. '\n' -> '\\n') and broke entities.js, which
            # is why Streamlit reported "Player is not defined (about:srcdoc)".
            js = re.sub(r"</script", r"<\\/script", js, flags=re.IGNORECASE)
            # A failed earlier deploy used a blanket backslash-escape here that
            # corrupted the JS. This build only touches "</script" (see verify
            # above); backslashes/regexes are passed through untouched.
            # <script> tags carry onload/onerror probes now — allow attributes.
            pattern = re.compile(
                r'<script\s+src="%s(\?v=[^"]*)?"[^>]*>\s*</script>' % re.escape(name)
            )
            html, count = pattern.subn(
                lambda m, _name=name, _js=js: "<script>\n/* inlined %s */\n%s\n</script>"
                % (_name, _js),
                html,
                count=1,
            )
            if count != 1:
                return None
        # Sanity: every inlined script must expose its class. If a file ever
        # fails to parse (truncation, bad deploy), this surfaces it in the
        # Streamlit logs BEFORE the user sees "Player is not defined".
        probes = {
            "audio.js": "SoundSystem",
            "particles.js": "ParticleSystem",
            "world.js": "World",
            "weather.js": "WeatherSystem",
            "entities.js": "Player",
            "underworld.js": "UnderworldMonster",
            "space.js": "SkeletonDragonBoss",
            "juice.js": "GameFeel",
            "npcs.js": "NPCManager",
            "journey.js": "JourneySystem",
            "terraria.js": "Game",
        }
        for name, token in probes.items():
            marker = "/* inlined %s */" % name
            idx = html.find(marker)
            if idx < 0:
                return None
            end = html.find("</script>", idx)
            if end < 0:
                return None
            block = html[idx:end]
            if ("class %s" % token) not in block and (
                "window.%s" % token
            ) not in block:
                return None
            # Inline <script> blocks never fire onload, so record per-file
            # proof of life right after each block. A failed block's probe
            # still runs (separate <script>) and reports e.g.
            # "Player=undefined" — the boot overlay then names the exact file
            # instead of a bare "Player is not defined (about:srcdoc)".
            probe = (
                "\n<script>window.__terraNoteScript&&window.__terraNoteScript("
                '"inline %s: %s="+(typeof %s))</script>' % (name, token, token)
            )
            end += len("</script>")
            html = html[:end] + probe + html[end:]
        return html
    except Exception as exc:  # missing file etc. -> caller uses iframe fallback
        st.warning(f"Could not inline local game files ({exc}); using hosted build.")
        return None


inline_html = build_inline_html()

try:
    _debug = "debug" in st.query_params
except Exception:
    _debug = False
if _debug:
    with st.expander("Terracraft embed diagnostics", expanded=True):
        _sizes = {}
        for _n in GAME_SCRIPTS + ["terraria.html", "terraria.css"]:
            try:
                _sizes[_n] = (BASE / _n).stat().st_size
            except Exception:
                _sizes[_n] = -1
        st.write(_sizes)
        st.write("inline chars:", len(inline_html) if inline_html else None)

if inline_html:
    # st.iframe replaces the deprecated components.html. It takes the raw HTML
    # string directly and has no `scrolling` argument; a fixed pixel height is
    # used because the game sizes itself to 100vh of the iframe, so
    # height="content" would be circular.
    st.iframe(inline_html, height=GAME_HEIGHT)
else:
    st.error("Local game files did not match terraria.html — falling back to hosted build.")
    st.iframe(GITHUB_FALLBACK, height=GAME_HEIGHT)

