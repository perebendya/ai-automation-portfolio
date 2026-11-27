"""Adaptive board-game recommendations for the bachelor’s thesis prototype."""

from __future__ import annotations

import gzip
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RULES = json.loads((ROOT / "ranking.json").read_text())
HARD_WEIGHT = RULES["hardWeight"]
SOFT_WEIGHT = RULES["softWeight"]
HARD_PHASE = RULES["hardPhase"]
RANK_BONUS = RULES["rankBonus"]
QUESTIONS = RULES["questions"]
BY_FEATURE = {q["feature"]: q for q in QUESTIONS}
LABELS = {q["feature"]: q["label_uk"] for q in QUESTIONS}


def load_games(data_dir: Path) -> pd.DataFrame:
    """Read the original research CSV or the public, lossless feature projection."""
    for name in ("boardgames_features.csv", "boardgames_recommender_features.csv"):
        if (data_dir / name).exists():
            return pd.read_csv(data_dir / name, low_memory=False).drop_duplicates("id").reset_index(drop=True)
    manifest = json.loads((data_dir / "catalogue.json").read_text())
    rows = []
    for name in manifest["parts"]:
        with gzip.open(data_dir / name, "rt", encoding="utf-8") as part:
            rows.extend(json.load(part))
    df = pd.DataFrame(rows, columns=manifest["columns"])
    if len(df) != manifest["count"] or not df.id.is_unique:
        raise ValueError("Incomplete or duplicated catalogue")
    return df


def filter_questions(questions, df, players=None):
    return [q for q in questions if q["feature"] in df and not (players and q["group_size"])]


def eligible_games(games, players=0, minutes=0, weight=0, rating=0):
    selected = games
    if players:
        selected = selected[selected.minplayers.between(1, players) & selected.maxplayers.ge(players)]
    if minutes:
        selected = selected[selected.playingtime.between(1, minutes)]
    if weight:
        selected = selected[selected.averageweight.gt(0) & selected.averageweight.le(weight)]
    if rating:
        selected = selected[selected.bayesaverage.ge(rating)]
    return selected


# ── Компоненти score [0; 1] ───────────────────────────────────

def base_quality_score(df: pd.DataFrame) -> pd.Series:
    """
    P(g) — базова якість/популярність гри, нормалізована до [0; 1].

    P(g) = 0.40 * norm(1/rank)
         + 0.30 * norm(log(1 + usersrated))
         + 0.30 * (bayesaverage / 10)
    """
    result = pd.Series(np.zeros(len(df)), index=df.index)

    if "rank" in df.columns:
        raw = 1.0 / df["rank"].clip(lower=1).fillna(30_000)
        mn, mx = raw.min(), raw.max()
        result += 0.40 * (raw - mn) / (mx - mn + 1e-9)

    if "usersrated" in df.columns:
        raw = np.log1p(df["usersrated"].fillna(0))
        mn, mx = raw.min(), raw.max()
        result += 0.30 * (raw - mn) / (mx - mn + 1e-9)

    if "bayesaverage" in df.columns:
        result += 0.30 * (df["bayesaverage"].fillna(0).clip(0, 10) / 10.0)

    return result.clip(0.0, 1.0)


def prepare_games(df: pd.DataFrame) -> pd.DataFrame:
    """
    Розраховує початковий score за якістю й популярністю.
    Використовує base_quality_score() масштабований до [0; RANK_BONUS].
    """
    prepared = df.copy()
    prepared["score"] = base_quality_score(prepared) * RANK_BONUS
    return prepared


# ── Оновлення score після відповіді ──────────────────────────

def quiz_values(df, feature):
    """Keep source model inputs intact while treating undocumented quiz facts as unknown."""
    values = df[feature]
    for column in BY_FEATURE.get(feature, {}).get("requiresPositive", []):
        if column in df:
            values = values.where(df[column].gt(0))
    return values


def answer_delta(df, feature, answer, weight):
    if answer not in ("так", "ні"):
        return 0.0
    values = quiz_values(df, feature)
    return np.where(values.isna(), 0.0, np.where(values.eq(int(answer == "так")), weight, -weight))


def update_scores(
    df: pd.DataFrame, feature: str, answer: str, weight: float = 1.2
) -> pd.DataFrame:
    """
    Оновлює score після відповіді на питання.

    "так" → score[g] += +weight якщо feature(g)=1, інакше -weight
    "ні"  → score[g] += +weight якщо feature(g)=0, інакше -weight
    "не знаю" → без змін
    """
    updated = df.copy()
    updated["score"] += answer_delta(df, feature, answer, weight)
    return updated


# ── Ентропія Шеннона ─────────────────────────────────────────

def question_entropy(p: float) -> float:
    """
    Бінарна ентропія Шеннона H(p), бітах.

    H(p) = -p*log2(p) - (1-p)*log2(1-p)

    H = 1.0 при p = 0.5 (максимально інформативне питання).
    H = 0.0 при p = 0 або p = 1 (питання нічого не розрізняє).
    """
    if p <= 0.0 or p >= 1.0:
        return 0.0
    return float(-p * np.log2(p) - (1.0 - p) * np.log2(1.0 - p))


def score_question_information_value(candidates: pd.DataFrame, feature: str) -> float:
    """
    Інформаційна цінність питання для поточного кандидатного пулу.

    p    = |{g : feature(g) = 1}| / |pool|
    I(q) = H(p) in [0; 1]

    I ~ 1.0 означає, що питання ділить кандидатів приблизно навпіл.
    """
    if feature not in candidates.columns:
        return 0.0
    values = quiz_values(candidates, feature).dropna()
    n = len(values)
    if n == 0:
        return 0.0
    p = float(values.sum()) / n
    return question_entropy(p)


# ── Адаптивний вибір питання ─────────────────────────────────

def choose_next_question(
    df: pd.DataFrame,
    questions: list,
    asked_features: set,
    candidate_pool_size: int = RULES["poolSize"],
) -> dict | None:
    """
    Адаптивно обирає наступне питання за ентропією Шеннона.

    Алгоритм:
    1. Беремо топ-N ігор за поточним score як кандидатний пул.
    2. Перші HARD_PHASE питань — лише hard-категорії.
    3. Для кожного кандидатного питання:
           combined(q) = H(q) + priority_bonus(q) - category_penalty(q)
       де:
           H(q)               — ентропія (інформаційна цінність)
           priority_bonus     = (4 - priority) * RULES["priorityBonus"]
           category_penalty   = count_asked_in_category * 0.04
    4. Повертаємо питання з максимальним combined(q).
    """
    pool = df.sort_values("score", ascending=False, kind="stable").head(candidate_pool_size)

    asked_hard = sum(
        1 for q in questions
        if q["feature"] in asked_features and q.get("kind") == "hard"
    )

    covered = {q.get("samePreference", q["feature"]) for q in questions if q["feature"] in asked_features}
    pool_questions = [
        q for q in questions
        if q.get("samePreference", q["feature"]) not in covered and q["feature"] in pool.columns
    ]

    entropies = {
        q["feature"]: score_question_information_value(pool, q["feature"])
        for q in pool_questions
    }
    pool_questions = [q for q in pool_questions if entropies[q["feature"]] > 0]

    if asked_hard < HARD_PHASE:
        hard_only = [q for q in pool_questions if q.get("kind") == "hard"]
        if hard_only:
            pool_questions = hard_only

    if not pool_questions:
        return None

    category_asked: dict[str, int] = {}
    for q in questions:
        if q["feature"] in asked_features:
            cat = q.get("category", "other")
            category_asked[cat] = category_asked.get(cat, 0) + 1

    best_question: dict | None = None
    best_combined: float = -1.0

    for question in pool_questions:
        feature = question["feature"]

        h = entropies[feature]

        priority = question.get("priority", 2)
        priority_bonus = max(0.0, (4 - priority) * RULES["priorityBonus"])

        cat = question.get("category", "other")
        category_penalty = category_asked.get(cat, 0) * RULES["categoryPenalty"]

        combined = h + priority_bonus - category_penalty

        if combined > best_combined:
            best_combined = combined
            best_question = question

    return best_question


# ── Результати та пояснення ───────────────────────────────────

def get_top_games(df: pd.DataFrame, top_n: int = 10) -> pd.DataFrame:
    """Повертає топ ігор за поточним score."""
    return df.sort_values("score", ascending=False, kind="stable").head(top_n).copy()


def explain_recommendation(row: pd.Series, answers: dict) -> list[str]:
    """
    Генерує rule-based пояснення рекомендації для конкретної гри.
    Повертає список рядків-пояснень (не більше 4).
    """
    reasons: list[str] = []

    for feature, answer in answers.items():
        if feature.startswith("__"):
            continue
        known = all(row.get(c, 0) > 0 for c in BY_FEATURE.get(feature, {}).get("requiresPositive", []))
        if known and answer == "так" and row.get(feature, 0) == 1:
            label = LABELS.get(feature)
            if label:
                reasons.append(label)

    if row.get("bayesaverage", 0) >= 7.5:
        reasons.append("висока оцінка спільноти BGG")

    return reasons[:4]
