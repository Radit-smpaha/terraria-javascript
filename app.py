
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Terracraft",
    page_icon="🌲",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
    }

    header, footer, #MainMenu {
        display: none !important;
    }
</style>
""", unsafe_allow_html=True)

components.iframe(
    "https://radit-smpaha.github.io/terraria-javascript/terraria.html",
    height=700,
    scrolling=False
)
