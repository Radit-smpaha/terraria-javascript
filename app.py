import streamlit as st
import streamlit.components.v1 as components
from pathlib import Path

st.set_page_config(
    page_title="Terraria",
    layout="wide"
)

st.title("Terraria - Browser Edition")

game_file = Path(__file__).parent / "terraria.html"

if game_file.exists():
    html = game_file.read_text(encoding="utf-8")

    components.html(
        html,
        height=750,
        scrolling=False
    )
else:
    st.error("Could not find index.html in the project folder.")
