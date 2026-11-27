"""
train_no_leakage_model.py
=========================
Навчає no-leakage ML-модель для реранжування настільних ігор.

Принцип відсутності витоку даних (no-leakage):
- Ознаки моделі — виключно статичні атрибути гри (rank, averageweight, is_*, has_*, …).
- Синтетичні мітки релевантності розраховуються на основі сценаріїв (як TARGET),
  але НЕ передаються до моделі як ознаки.
- На момент інференсу (app.py) ознаки запиту (match_players, match_time тощо)
  відсутні — тому їх не можна використовувати при навчанні.

Артефакти:
  models/best_boardgame_ranking_model_no_leakage.joblib
  models/model_features_no_leakage.json
  models/ranking_model_metadata_no_leakage.json

Запуск:
  python scripts/train_no_leakage_model.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import ndcg_score


PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR     = PROJECT_ROOT / "data"
MODELS_DIR   = PROJECT_ROOT / "models"

# ─────────────────────────────────────────────────────────────
# Leakage-ознаки — жодна з них не потрапить до моделі
# ─────────────────────────────────────────────────────────────
LEAKAGE_COLS = {
    "rule_match_score", "match_players", "match_time", "match_weight",
    "match_hard_features", "match_soft_features", "penalty_undesired_features",
    "quality_score", "popularity_score",
    "relevance", "label", "target", "synthetic_relevance", "final_relevance",
    "score", "final_score",
}

# ─────────────────────────────────────────────────────────────
# Синтетичні сценарії користувацьких запитів (30 шт.)
# ─────────────────────────────────────────────────────────────
RAW_SCENARIOS = [
    dict(qid=0,  name="Коротка сімейна гра (3-5 гравців)",
         players=4, max_time=60, min_w=None, max_w=2.0,
         desired=["is_family_game","supports_3p","supports_4p","is_short_game","is_family_friendly"],
         undesired=["is_heavy_game","is_adult_game","is_wargame"]),
    dict(qid=1,  name="Стратегічна гра для 2 гравців",
         players=2, max_time=120, min_w=2.5, max_w=None,
         desired=["is_two_player","supports_2p","is_strategy_game","is_medium_weight"],
         undesired=["is_party_game","is_light_game"]),
    dict(qid=2,  name="Кооперативна гра для початківців",
         players=4, max_time=90, min_w=None, max_w=2.5,
         desired=["has_cooperative","is_family_friendly","is_light_game","supports_4p"],
         undesired=["is_heavy_game","is_wargame"]),
    dict(qid=3,  name="Важка стратегія для досвідчених",
         players=3, max_time=None, min_w=3.0, max_w=None,
         desired=["is_heavy_game","is_strategy_game","supports_3p","has_worker_placement"],
         undesired=["is_party_game","is_light_game","is_family_game"]),
    dict(qid=4,  name="Фентезійна гра з магією",
         players=4, max_time=120, min_w=None, max_w=None,
         desired=["is_fantasy","desc_magic","is_adventure","supports_4p"],
         undesired=["is_wargame"]),
    dict(qid=5,  name="Вечіркова гра для великої компанії",
         players=6, max_time=45, min_w=None, max_w=2.0,
         desired=["is_party_game","is_six_plus","supports_6p","is_light_game"],
         undesired=["is_heavy_game","is_strategy_game"]),
    dict(qid=6,  name="Соло-гра з соло-режимом",
         players=1, max_time=90, min_w=None, max_w=None,
         desired=["has_solo_mode","supports_1p","is_solo"],
         undesired=[]),
    dict(qid=7,  name="Кооперативна детективна гра",
         players=3, max_time=90, min_w=None, max_w=2.5,
         desired=["has_cooperative","is_deduction","desc_mystery","supports_3p"],
         undesired=["is_heavy_game"]),
    dict(qid=8,  name="Deck-building для двох",
         players=2, max_time=60, min_w=2.0, max_w=3.5,
         desired=["has_deck_building","is_two_player","supports_2p"],
         undesired=["is_party_game"]),
    dict(qid=9,  name="Економічна євро-гра",
         players=4, max_time=150, min_w=2.5, max_w=None,
         desired=["is_economic","has_worker_placement","is_strategy_game","supports_4p"],
         undesired=["is_party_game","is_light_game","is_war"]),
    dict(qid=10, name="Карткова гра з драфтом",
         players=4, max_time=60, min_w=None, max_w=2.5,
         desired=["is_card_game","has_drafting","supports_4p","desc_cards"],
         undesired=["is_miniatures"]),
    dict(qid=11, name="Космічна гра з дослідженням",
         players=3, max_time=120, min_w=None, max_w=None,
         desired=["is_scifi","desc_space","is_exploration","supports_3p"],
         undesired=[]),
    dict(qid=12, name="Піратська пригода",
         players=4, max_time=90, min_w=None, max_w=2.5,
         desired=["desc_pirates","is_adventure","supports_4p"],
         undesired=[]),
    dict(qid=13, name="Гра-жах із зомбі",
         players=4, max_time=120, min_w=None, max_w=3.0,
         desired=["is_horror","desc_zombies","has_cooperative","supports_4p"],
         undesired=["is_light_game","is_family_game"]),
    dict(qid=14, name="Швидка карткова гра (до 30 хв)",
         players=2, max_time=30, min_w=None, max_w=2.0,
         desired=["is_card_game","is_short_game","is_two_player","supports_2p"],
         undesired=["is_heavy_game"]),
    dict(qid=15, name="Цивілізаційна гра",
         players=4, max_time=None, min_w=3.0, max_w=None,
         desired=["is_civilization","is_strategy_game","supports_4p"],
         undesired=["is_party_game","is_light_game"]),
    dict(qid=16, name="Воєнна стратегія",
         players=2, max_time=None, min_w=3.0, max_w=None,
         desired=["is_wargame","is_war","is_strategy_game","supports_2p"],
         undesired=["is_party_game","is_family_game"]),
    dict(qid=17, name="Гра з прихованими ролями",
         players=6, max_time=60, min_w=None, max_w=2.5,
         desired=["has_hidden_roles","is_six_plus","supports_6p","is_party_game"],
         undesired=["is_heavy_game"]),
    dict(qid=18, name="Євро зі збором ресурсів",
         players=3, max_time=120, min_w=2.5, max_w=4.0,
         desired=["has_worker_placement","is_economic","supports_3p","has_set_collection"],
         undesired=["is_party_game","is_light_game"]),
    dict(qid=19, name="Сімейна гра з кубиками",
         players=4, max_time=60, min_w=None, max_w=2.0,
         desired=["has_dice_rolling","is_family_game","is_family_friendly","supports_4p"],
         undesired=["is_heavy_game","is_wargame"]),
    dict(qid=20, name="Серйозна стратегія з контролем зон",
         players=4, max_time=None, min_w=2.5, max_w=None,
         desired=["has_area_control","is_strategy_game","supports_4p"],
         undesired=["is_party_game","is_light_game"]),
    dict(qid=21, name="Легка і весела гра-розминка",
         players=5, max_time=30, min_w=None, max_w=1.5,
         desired=["is_party_game","is_light_game","is_short_game","supports_5p","desc_humor"],
         undesired=["is_heavy_game","is_strategy_game"]),
    dict(qid=22, name="Гра про природу і тварин",
         players=3, max_time=90, min_w=None, max_w=2.5,
         desired=["is_animals","desc_nature","supports_3p"],
         undesired=["is_war","is_wargame"]),
    dict(qid=23, name="Містобудівельна євро-гра",
         players=4, max_time=120, min_w=2.0, max_w=3.5,
         desired=["is_city_building","is_strategy_game","supports_4p"],
         undesired=["is_war","is_party_game"]),
    dict(qid=24, name="Середньовічна пригодницька гра",
         players=4, max_time=120, min_w=None, max_w=3.0,
         desired=["is_medieval","is_adventure","supports_4p"],
         undesired=[]),
    dict(qid=25, name="Негоціативна торговельна гра",
         players=4, max_time=90, min_w=None, max_w=None,
         desired=["has_negotiation","is_economic","supports_4p"],
         undesired=[]),
    dict(qid=26, name="Легка і коротка гра для подружньої пари",
         players=2, max_time=45, min_w=None, max_w=2.0,
         desired=["is_two_player","supports_2p","is_short_game","is_light_game"],
         undesired=["is_heavy_game"]),
    dict(qid=27, name="Гра з розміщенням тайлів",
         players=4, max_time=90, min_w=None, max_w=2.5,
         desired=["has_tile_placement","supports_4p","has_modular_board"],
         undesired=[]),
    dict(qid=28, name="Deck-building з ухиленням ризику",
         players=4, max_time=90, min_w=2.0, max_w=3.5,
         desired=["has_deck_building","has_push_your_luck","supports_4p"],
         undesired=["is_light_game"]),
    dict(qid=29, name="Карткова гра на взятки",
         players=4, max_time=60, min_w=None, max_w=2.5,
         desired=["has_trick_taking","is_card_game","supports_4p"],
         undesired=[]),
]


# ─────────────────────────────────────────────────────────────
# Допоміжні функції
# ─────────────────────────────────────────────────────────────

def _norm(s: pd.Series) -> pd.Series:
    mn, mx = s.min(), s.max()
    if mx == mn:
        return pd.Series(np.zeros(len(s)), index=s.index)
    return (s - mn) / (mx - mn)


def compute_relevance(sc: dict, df: pd.DataFrame) -> pd.Series:
    """
    Обчислює proxy relevance [0; 1] для пари (сценарій, ігри).
    Використовується ЛИШЕ для генерації TARGET, а не як ознака.

    Складові:
      0.25 × match_players
      0.20 × match_time
      0.20 × match_weight
      0.15 × desired_feature_fraction
     -0.05 × any_undesired_feature
      0.05 × quality_score
      0.05 × popularity_score
    """
    score = pd.Series(0.0, index=df.index)

    # Відповідність гравців
    players = sc["players"]
    feat_p  = f"supports_{players}p"
    if feat_p in df.columns:
        score += 0.25 * df[feat_p].fillna(0)

    # Відповідність часу
    if sc["max_time"] and "playingtime" in df.columns:
        within = (df["playingtime"].fillna(sc["max_time"]) <= sc["max_time"]).astype(float)
        score += 0.20 * within

    # Відповідність складності
    if "averageweight" in df.columns:
        aw = df["averageweight"].fillna(2.5)
        weight_ok = pd.Series(1.0, index=df.index)
        if sc["min_w"]:
            weight_ok *= (aw >= sc["min_w"]).astype(float)
        if sc["max_w"]:
            weight_ok *= (aw <= sc["max_w"]).astype(float)
        score += 0.20 * weight_ok

    # Бажані ознаки
    desired = [f for f in sc.get("desired", []) if f in df.columns]
    if desired:
        hard_match = df[desired].fillna(0).mean(axis=1)
        score += 0.15 * hard_match

    # Небажані ознаки (штраф)
    undesired = [f for f in sc.get("undesired", []) if f in df.columns]
    if undesired:
        penalty = df[undesired].fillna(0).any(axis=1).astype(float)
        score -= 0.05 * penalty

    # Якість і популярність
    if "bayesaverage" in df.columns:
        score += 0.05 * (df["bayesaverage"].fillna(0).clip(0, 10) / 10.0)
    if "log_usersrated" in df.columns:
        score += 0.05 * _norm(df["log_usersrated"].fillna(0))
    elif "usersrated" in df.columns:
        score += 0.05 * _norm(np.log1p(df["usersrated"].fillna(0)))

    return score.clip(0.0, 1.0)


def precision_at_k(y_true: np.ndarray, scores: np.ndarray, k: int, thr: float = 0.5) -> float:
    top_k = np.argsort(scores)[::-1][:k]
    return float((y_true[top_k] >= thr).mean())


def hit_rate_at_k(y_true: np.ndarray, scores: np.ndarray, k: int, thr: float = 0.5) -> float:
    top_k = np.argsort(scores)[::-1][:k]
    return float((y_true[top_k] >= thr).any())


def mrr_at_k(y_true: np.ndarray, scores: np.ndarray, k: int, thr: float = 0.5) -> float:
    top_k = np.argsort(scores)[::-1][:k]
    for rank, idx in enumerate(top_k, 1):
        if y_true[idx] >= thr:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(y_true: np.ndarray, scores: np.ndarray, k: int) -> float:
    if len(y_true) < 2:
        return 0.0
    return float(ndcg_score([y_true], [scores], k=k))


def recall_at_k(y_true: np.ndarray, scores: np.ndarray, k: int, thr: float = 0.5) -> float:
    """Recall@k = hits_in_top_k / total_relevant (по всьому списку)."""
    total_relevant = int((y_true >= thr).sum())
    if total_relevant == 0:
        return 0.0
    top_k = np.argsort(scores)[::-1][:k]
    return float((y_true[top_k] >= thr).sum()) / total_relevant


def eval_all_scenarios(test_scenarios, df, feat_cols, model, pop_scores):
    """Обчислює метрики для трьох систем: Popularity, Label oracle, ML."""
    rows = []
    X = df[feat_cols].fillna(0).values
    ml_pred = model.predict(X)
    for sc in test_scenarios:
        y = compute_relevance(sc, df).values

        oracle = y  # Upper bound obtained by sorting the synthetic labels themselves.

        rows.append({
            "query":          sc["name"],
            "P@10_pop":       precision_at_k(y, pop_scores, 10),
            "P@10_oracle":      precision_at_k(y, oracle, 10),
            "P@10_ml":        precision_at_k(y, ml_pred, 10),
            "NDCG@10_pop":    ndcg_at_k(y, pop_scores, 10),
            "NDCG@10_oracle":   ndcg_at_k(y, oracle, 10),
            "NDCG@10_ml":     ndcg_at_k(y, ml_pred, 10),
            "MRR@10_pop":     mrr_at_k(y, pop_scores, 10),
            "MRR@10_oracle":    mrr_at_k(y, oracle, 10),
            "MRR@10_ml":      mrr_at_k(y, ml_pred, 10),
            "HR@10_pop":      hit_rate_at_k(y, pop_scores, 10),
            "HR@10_oracle":     hit_rate_at_k(y, oracle, 10),
            "HR@10_ml":       hit_rate_at_k(y, ml_pred, 10),
            "Recall@10_pop":  recall_at_k(y, pop_scores, 10),
            "Recall@10_oracle": recall_at_k(y, oracle, 10),
            "Recall@10_ml":   recall_at_k(y, ml_pred, 10),
        })
    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("No-leakage ML pipeline для реранжування настільних ігор")
    print("=" * 60)

    # 1. Завантаження даних
    primary  = DATA_DIR / "boardgames_features.csv"
    fallback = DATA_DIR / "boardgames_recommender_features.csv"
    data_path = primary if primary.exists() else fallback
    print(f"\n[1] Завантаження: {data_path.name}")
    games_df = pd.read_csv(data_path, low_memory=False)
    games_df = games_df.drop_duplicates(subset=["id"], keep="first").reset_index(drop=True)
    print(f"    Ігор: {len(games_df)}, колонок: {len(games_df.columns)}")

    # 2. Визначення no-leakage ознак
    BINARY_PREFIXES = ("supports_", "is_", "has_", "desc_")
    EXCLUDE = {
        "id", "name", "api_name", "description",
        "categories_raw", "mechanics_raw", "families_raw",
        "designers_raw", "publishers_raw", "thumbnail", "image",
        "categories_list", "mechanics_list", "has_categories", "has_mechanics",
        "is_expansion",
        "abstracts_rank", "cgs_rank", "childrensgames_rank",
        "familygames_rank", "partygames_rank", "strategygames_rank",
        "thematic_rank", "wargames_rank",
    } | LEAKAGE_COLS

    binary_cols  = [c for c in games_df.columns if c.startswith(BINARY_PREFIXES) and c not in EXCLUDE]
    numeric_cols = [c for c in [
        "minplayers", "maxplayers", "playingtime", "minplaytime", "maxplaytime",
        "minage", "averageweight", "rank", "average", "bayesaverage",
        "usersrated", "yearpublished", "log_usersrated",
        "n_categories", "n_mechanics", "player_range_width",
        "playtime_range_width", "description_length",
    ] if c in games_df.columns and c not in EXCLUDE]

    NO_LEAKAGE_FEATURES = numeric_cols + binary_cols
    print(f"\n[2] No-leakage ознаки: {len(NO_LEAKAGE_FEATURES)} "
          f"(числових={len(numeric_cols)}, бінарних={len(binary_cols)})")

    # Перевірка відсутності leakage
    leak_found = set(NO_LEAKAGE_FEATURES) & LEAKAGE_COLS
    assert not leak_found, f"Знайдено leakage: {leak_found}"
    print("    Leakage перевірено: OK")

    # 3. Розбиття сценаріїв train/test (75/25 по query_id)
    rng = np.random.default_rng(42)
    qids = [sc["qid"] for sc in RAW_SCENARIOS]
    shuffled = rng.permutation(qids)
    n_test  = max(5, int(0.25 * len(shuffled)))
    test_idx  = set(shuffled[:n_test])
    train_idx = set(shuffled[n_test:])

    train_scenarios = [sc for sc in RAW_SCENARIOS if sc["qid"] in train_idx]
    test_scenarios  = [sc for sc in RAW_SCENARIOS if sc["qid"] in test_idx]
    print(f"\n[3] Сценарії: train={len(train_scenarios)}, test={len(test_scenarios)}")

    # 4. Генерація навчальних даних
    # Ключовий принцип: relevance — TARGET, не ознака
    print("\n[4] Генерація навчальних даних (proxy relevance labels)…")
    X_parts, y_parts = [], []
    for sc in train_scenarios:
        y_sc = compute_relevance(sc, games_df).values
        X_sc = games_df[NO_LEAKAGE_FEATURES].fillna(0).values
        X_parts.append(X_sc)
        y_parts.append(y_sc)

    X_train = np.vstack(X_parts)
    y_train = np.concatenate(y_parts)
    print(f"    Рядків навчання: {len(X_train)} ({len(train_scenarios)} сценарії × {len(games_df)} ігор)")
    print(f"    Relevance min={y_train.min():.3f}, mean={y_train.mean():.3f}, max={y_train.max():.3f}")

    # 5. Навчання HistGradientBoostingRegressor
    print("\n[5] Навчання HistGradientBoostingRegressor…")
    model = HistGradientBoostingRegressor(
        max_iter=300,
        learning_rate=0.05,
        max_depth=5,
        min_samples_leaf=20,
        random_state=42,
    )
    model.fit(X_train, y_train)
    print("    Навчено.")

    # 6. Popularity baseline
    pop_score = pd.Series(0.0, index=games_df.index)
    if "bayesaverage" in games_df.columns:
        pop_score += 0.5 * _norm(games_df["bayesaverage"].fillna(0))
    if "log_usersrated" in games_df.columns:
        pop_score += 0.3 * _norm(games_df["log_usersrated"].fillna(0))
    elif "usersrated" in games_df.columns:
        pop_score += 0.3 * _norm(np.log1p(games_df["usersrated"].fillna(0)))
    if "rank" in games_df.columns:
        pop_score += 0.2 * _norm(1.0 / games_df["rank"].clip(lower=1).fillna(30000))
    pop_scores_arr = pop_score.values

    # 7. Оцінювання на тестових сценаріях
    print("\n[6] Оцінювання на test-сценаріях…")
    metrics_df = eval_all_scenarios(test_scenarios, games_df, NO_LEAKAGE_FEATURES, model, pop_scores_arr)

    summary = {
        "Popularity": {
            "NDCG@10":   metrics_df["NDCG@10_pop"].mean(),
            "P@10":      metrics_df["P@10_pop"].mean(),
            "MRR@10":    metrics_df["MRR@10_pop"].mean(),
            "HR@10":     metrics_df["HR@10_pop"].mean(),
            "Recall@10": metrics_df["Recall@10_pop"].mean(),
        },
        "Label oracle": {
            "NDCG@10":   metrics_df["NDCG@10_oracle"].mean(),
            "P@10":      metrics_df["P@10_oracle"].mean(),
            "MRR@10":    metrics_df["MRR@10_oracle"].mean(),
            "HR@10":     metrics_df["HR@10_oracle"].mean(),
            "Recall@10": metrics_df["Recall@10_oracle"].mean(),
        },
        "ML (HGBR)": {
            "NDCG@10":   metrics_df["NDCG@10_ml"].mean(),
            "P@10":      metrics_df["P@10_ml"].mean(),
            "MRR@10":    metrics_df["MRR@10_ml"].mean(),
            "HR@10":     metrics_df["HR@10_ml"].mean(),
            "Recall@10": metrics_df["Recall@10_ml"].mean(),
        },
    }

    print(f"\n    {'Модель':<18} {'NDCG@10':>8} {'P@10':>8} {'MRR@10':>8} {'HR@10':>8} {'Recall@10':>10}")
    print(f"    {'-'*60}")
    for name, m in summary.items():
        print(f"    {name:<18} {m['NDCG@10']:>8.4f} {m['P@10']:>8.4f} {m['MRR@10']:>8.4f} {m['HR@10']:>8.4f} {m['Recall@10']:>10.4f}")

    # 8. Збереження артефактів
    print("\n[7] Збереження артефактів…")

    MODELS_DIR.mkdir(exist_ok=True)

    # 8.1 Модель
    model_path = MODELS_DIR / "best_boardgame_ranking_model_no_leakage.joblib"
    joblib.dump(model, model_path)
    print(f"    Модель: {model_path}")

    # 8.2 Список ознак
    features_path = MODELS_DIR / "model_features_no_leakage.json"
    with open(features_path, "w", encoding="utf-8") as f:
        json.dump(NO_LEAKAGE_FEATURES, f, ensure_ascii=False, indent=2)
    print(f"    Ознаки: {features_path}  ({len(NO_LEAKAGE_FEATURES)} шт.)")

    # 8.3 Metadata
    metadata = {
        "model_name":     "best_boardgame_ranking_model_no_leakage",
        "model_type":     "HistGradientBoostingRegressor (sklearn)",
        "created_at":     datetime.now(timezone.utc).isoformat(),
        "created_from":   "scripts/train_no_leakage_model.py",
        "dataset_path":   str(data_path.name),
        "n_games":        int(len(games_df)),
        "n_features":     len(NO_LEAKAGE_FEATURES),
        "feature_count":  len(NO_LEAKAGE_FEATURES),
        "train_scenarios": len(train_scenarios),
        "test_scenarios":  len(test_scenarios),
        "hyperparameters": {
            "max_iter": 300, "learning_rate": 0.05,
            "max_depth": 5, "min_samples_leaf": 20, "random_state": 42,
        },
        "metrics": {
            model_name: {k: round(v, 4) for k, v in m.items()}
            for model_name, m in summary.items()
        },
        "leakage_columns_excluded": sorted(LEAKAGE_COLS),
        "note": (
            "Synthetic relevance labels are proxy labels, not real user ratings. "
            "Model trained on static game attributes only. "
            "Labels computed per-scenario using player count, time, weight and feature matching."
        ),
        "limitations": [
            "Labels are synthetic — model cannot capture true user preferences.",
            "ML reranking adds a general quality signal on top of rule-based quiz results.",
            "The label oracle sorts the synthetic targets and is an upper bound by construction.",
        ],
    }
    meta_path = MODELS_DIR / "ranking_model_metadata_no_leakage.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"    Metadata: {meta_path}")

    print("\n[8] Фінальна перевірка завантаження…")
    loaded = joblib.load(model_path)
    sample_X = games_df[NO_LEAKAGE_FEATURES].fillna(0).values[:5]
    sample_pred = loaded.predict(sample_X)
    print(f"    predict() на 5 іграх: {sample_pred.round(4)}")
    print("\n✓ Всі артефакти збережено. Модель готова до використання в app.py.")
    print("=" * 60)

    return summary


if __name__ == "__main__":
    main()
