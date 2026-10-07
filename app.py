
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
    "ocean.js",
    "juice.js",
    "npcs.js",
    "journey.js",
    "multiplayer.js",
    "terraria.js",
]
GITHUB_FALLBACK = "https://radit-smpaha.github.io/terraria-javascript/terraria.html"
# The game fills 100vh of whatever frame it is given, so the frame has to be
# sized to the WINDOW, not to a fixed pixel count. 850px was taller than a
# laptop viewport, which put the bottom of the arena - the hotbar - below the
# fold and made the player scroll to reach it. This is only the pre-CSS
# fallback; the stylesheet below overrides the rendered height to calc(100vh -
# 60px) so the game always fits the screen it is actually on.
GAME_HEIGHT = 640

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
    /* ---- Fit the game to the window --------------------------------------
       The whole game (canvas AND the hotbar pinned to its bottom edge) lives
       inside this one iframe, and the game itself is already height:100vh
       with overflow:hidden. So the only thing that can push the hotbar off
       screen is the frame being taller than the browser viewport - which is
       what the old fixed 850px height did on any laptop. Override the
       rendered height with the viewport height instead. calc(100vh - 60px)
       leaves room for Streamlit's own top gap and its resize bar so the
       frame never overflows the page and never needs scrolling. vh first,
       dvh where supported (mobile browser chrome changes the visible height).
       min-height keeps a very short window playable rather than collapsing
       the hotbar into nothing. */
    iframe {
        display: block !important;
        width: 100% !important;
        height: calc(100vh - 60px) !important;
        height: calc(100dvh - 60px) !important;
        min-height: 320px;
        border: 0 !important;
    }
    /* Kill the vertical gap Streamlit puts between blocks, and stop the app
       itself from scrolling (the game supplies its own scrolling-free view). */
    [data-testid="stVerticalBlock"] { gap: 0 !important; }
    [data-testid="stAppViewContainer"] { overflow: hidden !important; }
    .stElementContainer { padding: 0 !important; }
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
            "ocean.js": "OceanLeviathan",
            "juice.js": "GameFeel",
            "npcs.js": "NPCManager",
            "journey.js": "JourneySystem",
            "multiplayer.js": "Multiplayer",
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
