
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

components.html(
    """
    <iframe
        src="https://radit-smpaha.github.io/terraria-javascript/terraria.html"
        style="
            width: 100%;
            height: 100vh;
            border: none;
            display: block;
            overflow: hidden;
        "
        allow="fullscreen"
    ></iframe>
    """,
    height=950,
    scrolling=False
)
