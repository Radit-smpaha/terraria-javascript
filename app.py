
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
import streamlit.components.v1 as components

BASE = Path(__file__).parent
GAME_SCRIPTS = [
    "audio.js",
    "particles.js",
    "world.js",
    "weather.js",
    "entities.js",
    "underworld.js",
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
            r'<link[^>]*terraria\.css[^>]*>',
            "<style>\n/* inlined terraria.css */\n" + css + "\n</style>",
            html,
            count=1,
        )
        for name in GAME_SCRIPTS:
            js = (BASE / name).read_text(encoding="utf-8")
            # Never let game code break out of the inline <script> block.
            js = js.replace("</script", "<\\/script")
            pattern = re.compile(
                r'<script\s+src="%s(\?v=[^"]*)?"\s*>\s*</script>' % re.escape(name)
            )
            html, count = pattern.subn(
                "<script>\n/* inlined %s */\n%s\n</script>" % (name, js), html, count=1
            )
            if count != 1:
                return None
        return html
    except Exception as exc:  # missing file etc. -> caller uses iframe fallback
        st.warning(f"Could not inline local game files ({exc}); using hosted build.")
        return None


inline_html = build_inline_html()
if inline_html:
    components.html(inline_html, height=GAME_HEIGHT, scrolling=False)
else:
    st.error("Local game files did not match terraria.html — falling back to hosted build.")
    components.iframe(GITHUB_FALLBACK, height=GAME_HEIGHT, scrolling=False)

