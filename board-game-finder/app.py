"""Run with streamlit run app.py from the board-game-finder directory."""

from pathlib import Path

import streamlit as st

from src.ml_reranker import apply_ml_reranking, predict_catalogue_scores
from src.recommender_core import (
    HARD_WEIGHT, QUESTIONS, SOFT_WEIGHT, choose_next_question,
    explain_recommendation, filter_questions, load_games,
    prepare_games, update_scores,
)


ROOT = Path(__file__).resolve().parent
MAX_QUESTIONS = 12
st.set_page_config(page_title="Board Game Finder", page_icon="🎲")


@st.cache_data
def catalogue():
    return prepare_games(load_games(ROOT / "data"))


def start_over():
    st.session_state.clear()


def answer(question, value):
    weight = HARD_WEIGHT if question["kind"] == "hard" else SOFT_WEIGHT
    state = st.session_state
    state.games = update_scores(state.games, question["feature"], value, weight)
    state.answers[question["feature"]] = value


def finish():
    st.session_state.page = "results"


def start_screen():
    games = catalogue()
    st.write(f"У каталозі {len(games)} ігор. Обери умови для своєї компанії, а потім відповідай на запитання про те, у що хочеться зіграти.")
    with st.form("preferences"):
        players = st.selectbox("Скільки людей гратиме?", [None, *range(1, 9)],
                               format_func=lambda n: str(n) if n else "Будь-яка кількість")
        duration = st.selectbox("Скільки часу є на партію?", [None, 30, 45, 60, 90, 120, 180],
                                format_func=lambda n: f"До {n} хв" if n else "Без обмежень")
        submitted = st.form_submit_button("Почати підбір", type="primary")
    if submitted:
        if players:
            games = games[games.minplayers.le(players) & games.maxplayers.ge(players)]
        if duration:
            games = games[games.playingtime.between(1, duration)]
        if games.empty:
            st.info("Такого поєднання в каталозі немає. Зміни кількість гравців або час.")
            return
        st.session_state.games = games
        st.session_state.answers = {}
        st.session_state.page = "quiz"
        st.rerun()


def quiz():
    state = st.session_state
    questions = filter_questions(QUESTIONS, state.games)
    question = choose_next_question(state.games, questions, set(state.answers))
    if question is None or len(state.answers) >= MAX_QUESTIONS:
        finish()
        st.rerun()
    st.caption(f"Питання {len(state.answers) + 1} з {MAX_QUESTIONS}")
    st.subheader(question["question"])
    for col, label in zip(st.columns(3), ("Так", "Ні", "Не знаю")):
        col.button(label, key=label, on_click=answer, args=(question, label.lower()))
    st.button("Показати результати", on_click=finish)


def results():
    games = st.session_state.games
    st.subheader("Ігри для твоєї компанії")
    use_ml = st.toggle("Додати оцінку ML-моделі", help="70% оцінки дає опитування, 30% — модель, навчена на синтетичних сценаріях.")
    score = "score"
    if use_ml:
        try:
            predictions = predict_catalogue_scores(games, ROOT / "models")
            games = apply_ml_reranking(games, predictions)
        except (OSError, ValueError) as exc:
            st.warning(f"Модель недоступна. Показую підбір за відповідями. {exc}")
        else:
            score = "final_score"
    for rank, (_, game) in enumerate(games.sort_values(score, ascending=False, kind="stable").head(10).iterrows(), 1):
        st.markdown(f"**{rank}. {game['name']}**")
        reasons = explain_recommendation(game, st.session_state.answers)
        players = f"{int(game.minplayers)}–{int(game.maxplayers)}" if game.minplayers != game.maxplayers else str(int(game.minplayers))
        st.caption(f"Гравці · {players} ｜ {int(game.playingtime)} хв ｜ Складність · {game.averageweight:.1f}/5")
        if reasons:
            st.write(" · ".join(reasons))
        st.link_button("На BoardGameGeek", f"https://boardgamegeek.com/boardgame/{int(game.id)}")


st.title("Підбір настільної гри")
page = st.session_state.get("page", "start")
if page == "start":
    start_screen()
elif page == "quiz":
    quiz()
else:
    results()
if page != "start":
    st.button("Почати заново", on_click=start_over)
