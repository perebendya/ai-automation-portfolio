"""Start the full thesis application with python -m streamlit run app.py."""

from pathlib import Path
from urllib.parse import urlsplit

import pandas as pd
import streamlit as st

from src.ml_reranker import apply_ml_reranking, predict_catalogue_scores
from src.recommender_core import (
    HARD_WEIGHT, SOFT_WEIGHT, QUESTIONS, RULES, answer_delta, choose_next_question, eligible_games,
    explain_recommendation, filter_questions, load_games, prepare_games,
)

ROOT = Path(__file__).resolve().parent
BY_FEATURE = {q["feature"]: q for q in QUESTIONS}
st.set_page_config(page_title="Підбір настільної гри", page_icon="🎲", layout="wide")


@st.cache_resource
def catalogue():
    return prepare_games(load_games(ROOT / "data"))


@st.cache_resource
def model_scores():
    return pd.Series(predict_catalogue_scores(catalogue(), ROOT / "models"), index=catalogue().index)


def answer(feature, value):
    st.session_state.answers[feature] = value


def undo():
    if st.session_state.answers:
        st.session_state.answers.popitem()
    st.session_state.finished = False


def restart():
    st.session_state.answers = {}
    st.session_state.finished = False


def finish():
    st.session_state.finished = True


def fact(value, pattern):
    return pattern.format(value) if pd.notna(value) and value > 0 else "—"


def game_card(pos, game, answers):
    with st.container(border=True):
        art, body = st.columns([1, 5])
        thumbnail = game.thumbnail
        if isinstance(thumbnail, str) and urlsplit(thumbnail).hostname == "cf.geekdo-images.com":
            art.image(thumbnail, width=95)
        body.subheader(f"{pos}. {game['name']}")
        bounds = [fact(x, "{:.0f}") for x in (game.minplayers, game.maxplayers)]
        players = bounds[0] if bounds[0] == bounds[1] else "–".join(bounds)
        body.caption(f"Гравці · {players}   |   Час · {fact(game.playingtime, '{:.0f} хв')}   |   "
                     f"Складність · {fact(game.averageweight, '{:.1f}/5')}   |   BGG · {fact(game.bayesaverage, '{:.2f}/10')}")
        reasons = explain_recommendation(game, answers)
        if reasons:
            body.write(" · ".join(reasons))
        with body.expander("Детальніше про гру"):
            for label, value in (("Категорії", game.categories_raw), ("Механіки", game.mechanics_raw)):
                if isinstance(value, str) and value:
                    st.write(f"{label} · {value.replace(' | ', ', ')}")
            st.link_button("Сторінка гри на BoardGameGeek", f"https://boardgamegeek.com/boardgame/{int(game.id)}")


def main():
    state = st.session_state
    if "answers" not in state:
        restart()
    games = catalogue()
    with st.sidebar:
        st.header("Умови гри")
        players = st.number_input("Кількість гравців (0 — будь-яка)", min_value=0, value=0, step=1)
        minutes = st.selectbox("Максимальна тривалість", [0, 15, 30, 45, 60, 90, 120, 180, 240],
                               format_func=lambda n: f"{n} хв" if n else "Будь-яка")
        weight = st.selectbox("Максимальна складність", [0, 1.5, 2., 2.5, 3., 3.5, 4., 5.],
                              format_func=lambda n: f"{n:.1f}/5" if n else "Будь-яка")
        rating = st.slider("Мінімальний рейтинг BGG", 0., 9., 0., .1)
        size = st.selectbox("Скільки ігор показати", [5, 10, 15, 20], index=1)
        ml = st.toggle("Додати оцінку ML-моделі", help="70% — відповіді та початковий рейтинг, 30% — прогноз моделі.")
    st.title("У що зіграємо?")
    selected = eligible_games(games, players, minutes, weight, rating)
    if selected.empty:
        st.info("Жодна гра не відповідає цим умовам. Зміни фільтри, щоб продовжити.")
        return
    questions = filter_questions(QUESTIONS, selected, players)
    allowed = {q["feature"] for q in questions}
    state.answers = {key: value for key,value in state.answers.items() if key in allowed}
    scores = selected.score.copy()
    for key, reply in state.answers.items():
        if reply == "не знаю":
            continue
        delta = HARD_WEIGHT if BY_FEATURE[key]["kind"] == "hard" else SOFT_WEIGHT
        scores += answer_delta(selected, key, reply, delta)
    selected = selected.assign(score=scores)
    question = None
    if not state.finished and len(state.answers) < RULES["maxQuestions"]:
        question = choose_next_question(selected, questions, set(state.answers))
    if question:
        st.caption(f"Питання {len(state.answers) + 1} з {RULES['maxQuestions']}")
        st.subheader(question["question"])
        for col, label in zip(st.columns(3), ("Так", "Ні", "Не знаю")):
            col.button(label, on_click=answer, args=(question["feature"], label.lower()))
        st.button("Завершити підбір", on_click=finish)
    if state.answers:
        st.button("На одну відповідь назад", on_click=undo)
    if state.answers or state.finished:
        st.button("Пройти ще раз", on_click=restart)
    score = "score"
    if ml:
        try:
            selected = apply_ml_reranking(selected, model_scores().loc[selected.index].to_numpy())
            score = "final_score"
        except (ValueError, OSError) as exc:
            st.warning(f"Показую результати за відповідями. Модель недоступна. {exc}")
    st.header("Рекомендації")
    st.caption(f"Ігор за умовами: {len(selected):,} із {len(games):,}".replace(",", " "))
    for pos, (_, game) in enumerate(selected.nlargest(size, score).iterrows(), 1):
        game_card(pos, game, state.answers)


if __name__ == "__main__":
    main()
