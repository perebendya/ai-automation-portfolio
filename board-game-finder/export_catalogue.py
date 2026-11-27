"""Package the thesis feature table and fitted scikit-learn model for both apps."""

import argparse
import gzip
import json
from pathlib import Path

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parent
PUBLIC_COLUMNS = ["id", "name", "thumbnail", "categories_raw", "mechanics_raw"]


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode()


def cell(value):
    if pd.isna(value):
        return None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def export_catalogue(source):
    features = json.loads((ROOT / "models/model_features_no_leakage.json").read_text())
    columns = PUBLIC_COLUMNS + features
    games = pd.read_csv(source, usecols=columns, low_memory=False)[columns].drop_duplicates("id")
    data = ROOT / "data"
    parts = []
    for start in range(0, len(games), 2000):
        rows = games.iloc[start:start + 2000].itertuples(index=False, name=None)
        batch = [[cell(v) for v in row] for row in rows]
        name = f"games-{start // 2000 + 1:02}.json.gz"
        (data / name).write_bytes(gzip.compress(json_bytes(batch), mtime=0))
        parts.append(name)
    manifest = {"count": len(games), "columns": columns, "parts": parts}
    (data / "catalogue.json").write_bytes(json_bytes(manifest) + b"\n")


def export_model():
    directory = ROOT / "models"
    model = joblib.load(directory / "best_boardgame_ranking_model_no_leakage.joblib")
    features = json.loads((directory / "model_features_no_leakage.json").read_text())
    trees = []
    for (tree,) in model._predictors:
        nodes = []
        for node in tree.nodes:
            if node["is_categorical"]:
                raise ValueError("The browser evaluator supports numerical splits only")
            if node["is_leaf"]:
                nodes.append(float(node["value"]))
            else:
                nodes.append([int(node["feature_idx"]), float(node["num_threshold"]),
                              int(node["left"]), int(node["right"])])
        trees.append(nodes)
    payload = {"base": float(model._baseline_prediction.item()), "features": features, "trees": trees}
    (directory / "trees.json").write_bytes(json_bytes(payload) + b"\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, nargs="?", help="original boardgames_features.csv")
    args = parser.parse_args()
    if args.source:
        export_catalogue(args.source)
    export_model()
