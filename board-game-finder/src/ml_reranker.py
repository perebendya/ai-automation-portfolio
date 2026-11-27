"""Blend adaptive quiz scores with the thesis model's static catalogue score."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from .recommender_core import RULES


def predict_catalogue_scores(games: pd.DataFrame, models_dir: Path) -> np.ndarray:
    features = json.loads((models_dir / "model_features_no_leakage.json").read_text())
    missing = set(features).difference(games.columns)
    if missing:
        raise ValueError("Бракує ознак моделі: " + ", ".join(sorted(missing)))
    # This path points to the bundled model trained by the project author.
    model = joblib.load(models_dir / "best_boardgame_ranking_model_no_leakage.joblib")
    return model.predict(games[features].fillna(0).to_numpy())


def apply_ml_reranking(games: pd.DataFrame, predictions: np.ndarray) -> pd.DataFrame:
    """Blend scores for the same candidate rows in the same order."""

    def normalize(values):
        spread = np.ptp(values)
        return (values - values.min()) / spread if spread else np.zeros_like(values)

    alpha = RULES["quizWeight"]
    return games.assign(final_score=alpha * normalize(games["score"]) + (1 - alpha) * normalize(predictions))
