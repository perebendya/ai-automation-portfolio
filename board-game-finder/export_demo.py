"""Export the short web quiz using the same scorer and model as the Streamlit app."""

import json
from pathlib import Path

from src.ml_reranker import apply_ml_reranking, predict_catalogue_scores
from src.recommender_core import (
    HARD_WEIGHT, QUESTIONS, SOFT_WEIGHT, choose_next_question, get_top_games,
    load_games, prepare_games, update_scores,
)


ROOT = Path(__file__).resolve().parent
ENGLISH = {
    "has_cooperative": "Would you like to play together against the game?",
    "is_short_game": "Would you like a game that takes 45 minutes or less?",
    "is_light_game": "Would you prefer an easy game with light rules?",
    "is_heavy_game": "Are you looking for a complex strategy game?",
    "is_medium_weight": "Would a moderately complex game suit you?",
    "has_dice_rolling": "Do you enjoy rolling dice?",
    "has_worker_placement": "Do you like assigning workers to actions?",
    "has_deck_building": "Would you like to build your deck as you play?",
    "has_tile_placement": "Do you like building a board from tiles?",
    "has_hand_management": "Do you enjoy deciding how to use the cards in your hand?",
    "has_set_collection": "Do you enjoy collecting sets of cards or tokens?",
    "has_area_control": "Do you like competing for control of territory?",
    "has_drafting": "Would you like to pick cards from a shared pool?",
}
DEMO_QUESTIONS = [q for q in QUESTIONS if q["feature"] in ENGLISH]


def export():
    games = prepare_games(load_games(ROOT / "data"))
    predictions = predict_catalogue_scores(games, ROOT / "models")
    outcomes, titles = {}, {}

    def shortlist(frame):
        ids = []
        for g in frame.itertuples():
            game_id = str(g.id)
            titles[game_id] = [g.name, int(g.minplayers), int(g.maxplayers), int(g.playingtime)]
            ids.append(game_id)
        return ids

    def visit(frame, ml_scores, path, asked):
        hybrid = apply_ml_reranking(frame, ml_scores)
        node = {
            "quiz": shortlist(get_top_games(frame, 3)),
            "hybrid": shortlist(hybrid.sort_values("final_score", ascending=False, kind="stable").head(3)),
        }
        outcomes[path] = node
        if len(asked) == 4:
            return
        question = choose_next_question(frame, DEMO_QUESTIONS, asked, candidate_pool_size=40)
        if question is None:
            return
        feature = node["question"] = question["feature"]
        weight = HARD_WEIGHT if question["kind"] == "hard" else SOFT_WEIGHT
        for key, answer in (("y", "так"), ("n", "ні"), ("s", "не знаю")):
            visit(update_scores(frame, feature, answer, weight), ml_scores, path + key, asked | {feature})

    for players in (2, 4, 6):
        fits = games.minplayers.le(players) & games.maxplayers.ge(players)
        visit(games[fits], predictions[fits], str(players), set())

    used = {node["question"] for node in outcomes.values() if "question" in node}
    questions = {q["feature"]: {"en": ENGLISH[q["feature"]], "uk": q["question"]}
                 for q in DEMO_QUESTIONS if q["feature"] in used}
    payload = {"questions": questions, "games": titles, "outcomes": outcomes}
    (ROOT / "demo.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    export()
