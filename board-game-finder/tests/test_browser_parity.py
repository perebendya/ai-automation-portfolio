"""Compare the deployed ranking algorithm to the thesis Python implementation."""

import json
import os
from pathlib import Path
import subprocess
import unittest

import numpy as np

from src.ml_reranker import apply_ml_reranking, predict_catalogue_scores
from src.recommender_core import (
    HARD_WEIGHT, QUESTIONS, RULES, SOFT_WEIGHT, choose_next_question,
    eligible_games, filter_questions, load_games, prepare_games, update_scores,
)

ROOT = Path(__file__).resolve().parents[1]


class BrowserParity(unittest.TestCase):
    def test_predictions_questions_and_shortlists(self):
        games = prepare_games(load_games(ROOT / "data"))
        self.assertEqual(len(games), 30224)
        predictions = predict_catalogue_scores(games, ROOT / "models")
        states, expected = [], []
        for filters in ({}, {"players": 2, "minutes": 45}, {"players": 7, "weight": 2.5},
                        {"players": 13, "rating": 6.5}, {"players": 500, "rating": 9.9}):
            candidates = eligible_games(games, **filters).copy()
            questions = filter_questions(QUESTIONS, candidates, filters.get("players"))
            history = []
            for step in range(RULES["maxQuestions"] + 1):
                asked = {answer["feature"] for answer in history}
                q = choose_next_question(candidates, questions, asked) if step < RULES["maxQuestions"] else None
                for ml in (False, True):
                    frame, score = candidates, "score"
                    if ml and len(frame):
                        frame = apply_ml_reranking(frame, predictions[frame.index])
                        score = "final_score"
                    ids = frame.nlargest(10, score).id.tolist()
                    states.append(dict(filters=filters, answers=list(history), ml=ml))
                    expected.append(dict(count=len(frame), next=q["feature"] if q else None, ids=ids))
                if q is None:
                    break
                key, value = (("y", "так"), ("n", "ні"), ("s", "не знаю"))[step % 3]
                history.append(dict(feature=q["feature"], value=key))
                weight = HARD_WEIGHT if q["kind"] == "hard" else SOFT_WEIGHT
                candidates = update_scores(candidates, q["feature"], value, weight)
        proc = subprocess.run([os.environ.get("NODE", "node"), str(ROOT / "tests/browser-fixture.mjs")],
                              input=json.dumps(states), capture_output=True, text=True, check=True)
        actual = json.loads(proc.stdout)
        np.testing.assert_allclose(actual["predictions"], predictions, rtol=0, atol=1e-12)
        for state, browser, python in zip(states, actual["results"], expected, strict=True):
            self.assertEqual(browser, python, state)


if __name__ == "__main__":
    unittest.main()
