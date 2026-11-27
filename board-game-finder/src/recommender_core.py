"""Adaptive board-game recommendations for the bachelor’s thesis prototype."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

HARD_WEIGHT = 1.6
SOFT_WEIGHT = 1.0
HARD_PHASE  = 6
RANK_BONUS  = 10

QUESTIONS: list[dict] = [
    {"feature": "supports_1p",      "kind": "hard", "category": "players",     "priority": 1, "polarity": "positive", "question": "Чи плануєте іноді грати наодинці?"},
    {"feature": "is_two_player",    "kind": "hard", "category": "players",     "priority": 1, "polarity": "positive", "question": "Чи найчастіше гратимете вдвох?"},
    {"feature": "supports_3p",      "kind": "hard", "category": "players",     "priority": 1, "polarity": "positive", "question": "Чи часто за столом буде рівно троє гравців?"},
    {"feature": "supports_4p",      "kind": "hard", "category": "players",     "priority": 1, "polarity": "positive", "question": "Чи часто гратимете вчотирьох?"},
    {"feature": "supports_5p",      "kind": "hard", "category": "players",     "priority": 2, "polarity": "positive", "question": "Чи буває, що за столом збирається п'ятеро?"},
    {"feature": "supports_6p",      "kind": "hard", "category": "players",     "priority": 2, "polarity": "positive", "question": "Чи потрібна гра для шістьох і більше?"},
    {"feature": "is_six_plus",      "kind": "hard", "category": "players",     "priority": 2, "polarity": "positive", "question": "Чи шукаєте гру для великої компанії (6+)?"},
    {"feature": "has_solo_mode",    "kind": "hard", "category": "players",     "priority": 2, "polarity": "positive", "question": "Чи важливо, щоб у грі був окремо розроблений соло-режим?"},
    {"feature": "is_solo",          "kind": "hard", "category": "players",     "priority": 3, "polarity": "positive", "question": "Чи підходить гра, призначена виключно для одного гравця?"},
    {"feature": "is_short_game",    "kind": "hard", "category": "time",        "priority": 1, "polarity": "positive", "question": "Чи має партія тривати не більше 45 хвилин?"},
    {"feature": "is_quick_setup",   "kind": "hard", "category": "time",        "priority": 2, "polarity": "positive", "question": "Чи важливо швидко розкласти компоненти й одразу почати?"},
    {"feature": "is_light_game",    "kind": "hard", "category": "complexity",  "priority": 1, "polarity": "positive", "question": "Чи хочеться легкої гри без складних правил?"},
    {"feature": "is_medium_weight", "kind": "hard", "category": "complexity",  "priority": 1, "polarity": "positive", "question": "Чи підходить гра середньої складності?"},
    {"feature": "is_heavy_game",    "kind": "hard", "category": "complexity",  "priority": 1, "polarity": "positive", "question": "Чи цікавить стратегічно глибока й складна гра?"},
    {"feature": "is_family_friendly","kind": "hard","category": "players",     "priority": 1, "polarity": "positive", "question": "Чи важливо, щоб гра підходила для всієї родини?"},
    {"feature": "has_cooperative",  "kind": "hard", "category": "interaction", "priority": 1, "polarity": "positive", "question": "Чи хочеться грати разом проти гри, а не один проти одного?"},
    {"feature": "has_take_that",    "kind": "soft", "category": "interaction", "priority": 2, "polarity": "positive", "question": "Чи підходять ігри, де можна безпосередньо заважати суперникам?"},
    {"feature": "has_negotiation",  "kind": "soft", "category": "interaction", "priority": 2, "polarity": "positive", "question": "Чи подобаються ігри з переговорами й угодами між гравцями?"},
    {"feature": "has_hidden_roles", "kind": "soft", "category": "interaction", "priority": 2, "polarity": "positive", "question": "Чи подобаються ігри з прихованими ролями або зрадником у команді?"},
    {"feature": "has_area_control", "kind": "soft", "category": "mechanics",   "priority": 2, "polarity": "positive", "question": "Чи подобається боротися за контроль над територіями?"},
    {"feature": "has_dice_rolling", "kind": "soft", "category": "mechanics",   "priority": 2, "polarity": "positive", "question": "Чи підходить гра з активним киданням кубиків?"},
    {"feature": "has_drafting",     "kind": "soft", "category": "mechanics",   "priority": 2, "polarity": "positive", "question": "Чи подобається вибирати карти зі спільного набору (драфт)?"},
    {"feature": "has_worker_placement","kind":"soft","category": "mechanics",  "priority": 2, "polarity": "positive", "question": "Чи подобається механіка розміщення робітників?"},
    {"feature": "has_deck_building","kind": "soft", "category": "mechanics",   "priority": 2, "polarity": "positive", "question": "Чи подобається поступово будувати й покращувати власну колоду?"},
    {"feature": "has_tile_placement","kind":"soft", "category": "mechanics",   "priority": 2, "polarity": "positive", "question": "Чи подобається викладати тайли й формувати ігрове поле?"},
    {"feature": "has_hand_management","kind":"soft","category": "mechanics",   "priority": 3, "polarity": "positive", "question": "Чи важливо вміло розпоряджатися картами в руці?"},
    {"feature": "has_set_collection","kind":"soft", "category": "mechanics",   "priority": 3, "polarity": "positive", "question": "Чи подобається збирати набори карт або жетонів?"},
    {"feature": "has_auction",      "kind": "soft", "category": "mechanics",   "priority": 3, "polarity": "positive", "question": "Чи подобаються торги й аукціони між гравцями?"},
    {"feature": "has_push_your_luck","kind":"soft", "category": "mechanics",   "priority": 3, "polarity": "positive", "question": "Чи подобається ризикувати заради кращого результату?"},
    {"feature": "has_modular_board","kind": "soft", "category": "mechanics",   "priority": 3, "polarity": "positive", "question": "Чи подобається, коли ігрове поле унікальне в кожній партії?"},
    {"feature": "has_trick_taking", "kind": "soft", "category": "mechanics",   "priority": 3, "polarity": "positive", "question": "Чи подобаються карткові ігри на взятки?"},
    {"feature": "desc_cards",       "kind": "soft", "category": "components",  "priority": 2, "polarity": "positive", "question": "Чи хочеться гри, де карти є центральним елементом?"},
    {"feature": "is_card_game",     "kind": "soft", "category": "components",  "priority": 2, "polarity": "positive", "question": "Чи хочеться саме карткової гри (без великого ігрового поля)?"},
    {"feature": "is_miniatures",    "kind": "soft", "category": "components",  "priority": 3, "polarity": "positive", "question": "Чи важлива наявність детальних мініатюр у грі?"},
    {"feature": "is_strategy_game", "kind": "soft", "category": "mood",        "priority": 2, "polarity": "positive", "question": "Чи важливо планувати ходи наперед і продумувати стратегію?"},
    {"feature": "is_party_game",    "kind": "soft", "category": "mood",        "priority": 1, "polarity": "positive", "question": "Чи підходить легка й весела гра для великої компанії?"},
    {"feature": "is_family_game",   "kind": "soft", "category": "players",     "priority": 2, "polarity": "positive", "question": "Чи потрібна гра, що підходить для гравців різного рівня досвіду?"},
    {"feature": "is_thematic_game", "kind": "soft", "category": "mood",        "priority": 2, "polarity": "positive", "question": "Чи важливо, щоб тема гри добре відчувалась у механіках?"},
    {"feature": "is_deduction",     "kind": "soft", "category": "mood",        "priority": 2, "polarity": "positive", "question": "Чи подобаються дедуктивні ігри й логічні загадки?"},
    {"feature": "is_exploration",   "kind": "soft", "category": "mood",        "priority": 2, "polarity": "positive", "question": "Чи подобається досліджувати нові місця й поступово відкривати карту?"},
    {"feature": "desc_story",       "kind": "soft", "category": "mood",        "priority": 2, "polarity": "positive", "question": "Чи хочеться гри з розвинутою сюжетною лінією?"},
    {"feature": "desc_humor",       "kind": "soft", "category": "mood",        "priority": 3, "polarity": "positive", "question": "Чи подобається гумористичний і невимушений настрій у грі?"},
    {"feature": "is_fantasy",       "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи цікавить фентезійна тематика — магія, дракони, пригоди?"},
    {"feature": "is_scifi",         "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи цікавить наукова фантастика й космічна тематика?"},
    {"feature": "is_economic",      "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи подобаються ігри про торгівлю й управління ресурсами?"},
    {"feature": "is_civilization",  "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи цікавлять ігри про розвиток цивілізацій?"},
    {"feature": "is_adventure",     "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи хочеться пригодницької атмосфери й відчуття подорожі?"},
    {"feature": "desc_space",       "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи цікавить космічна тематика — кораблі, планети, дослідження Всесвіту?"},
    {"feature": "is_wargame",       "kind": "soft", "category": "theme",       "priority": 2, "polarity": "positive", "question": "Чи цікавлять ігри-реконструкції воєнних операцій?"},
    {"feature": "is_medieval",      "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи подобається середньовічна тематика?"},
    {"feature": "is_horror",        "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи подобається напружена або моторошна атмосфера?"},
    {"feature": "desc_magic",       "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи хочеться гри з магічними елементами?"},
    {"feature": "desc_pirates",     "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи цікавить піратська тематика — море й морські пригоди?"},
    {"feature": "desc_zombies",     "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи цікавлять ігри із зомбі-тематикою?"},
    {"feature": "desc_nature",      "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи подобається тема природи й екосистем?"},
    {"feature": "is_war",           "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи подобаються ігри з воєнними конфліктами й тактикою?"},
    {"feature": "is_farming",       "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи подобаються ігри про сільське господарство й фермерство?"},
    {"feature": "is_trains",        "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи цікавлять ігри про залізниці й маршрути?"},
    {"feature": "is_city_building", "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи подобається будівництво й розвиток міст?"},
    {"feature": "is_animals",       "kind": "soft", "category": "theme",       "priority": 3, "polarity": "positive", "question": "Чи цікавить тематика, де тварини є головними персонажами?"},
]


def load_games(data_dir: Path) -> pd.DataFrame:
    """Завантажує датасет ігор (пріоритет: boardgames_features.csv)."""
    primary  = data_dir / "boardgames_features.csv"
    fallback = data_dir / "boardgames_recommender_features.csv"
    path = primary if primary.exists() else fallback
    if not path.exists():
        raise FileNotFoundError(f"Не знайдено файлів даних у {data_dir}")
    df = pd.read_csv(path, low_memory=False)
    df = df.drop_duplicates(subset=["id"], keep="first")
    return df


def filter_questions(questions: list, df: pd.DataFrame) -> list:
    """
    Залишає тільки питання, ознаки яких є у датасеті.
    """
    return [q for q in questions if q["feature"] in df.columns]


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
    if answer == "так":
        updated["score"] += np.where(updated[feature] == 1, weight, -weight)
    elif answer == "ні":
        updated["score"] += np.where(updated[feature] == 0, weight, -weight)
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
    values = candidates[feature].dropna()
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
    candidate_pool_size: int = 200,
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
           priority_bonus     = (4 - priority) * 0.10
           category_penalty   = count_asked_in_category * 0.04
    4. Повертаємо питання з максимальним combined(q).
    """
    pool = df.sort_values("score", ascending=False, kind="stable").head(candidate_pool_size)

    asked_hard = sum(
        1 for q in questions
        if q["feature"] in asked_features and q.get("kind") == "hard"
    )

    pool_questions = [
        q for q in questions
        if q["feature"] not in asked_features and q["feature"] in pool.columns
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
        priority_bonus = max(0.0, (4 - priority) * 0.10)

        cat = question.get("category", "other")
        category_penalty = category_asked.get(cat, 0) * 0.04

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
        if answer == "так" and feature in row.index and row.get(feature, 0) == 1:
            label = _feature_label(feature)
            if label:
                reasons.append(label)

    if row.get("bayesaverage", 0) >= 7.5:
        reasons.append("висока оцінка спільноти BGG")

    return reasons[:4]


def _feature_label(feature: str) -> str:
    """Перетворює назву ознаки на зрозумілий рядок для користувача."""
    LABELS = {
        "supports_1p":       "підтримує гру наодинці",
        "is_two_player":     "чудово підходить для двох",
        "supports_2p":       "можна грати удвох",
        "supports_3p":       "підтримує трьох гравців",
        "supports_4p":       "підтримує чотирьох гравців",
        "supports_5p":       "підтримує п'ятьох гравців",
        "supports_6p":       "підтримує шість+ гравців",
        "is_six_plus":       "для великої компанії",
        "is_solo":           "можна грати наодинці",
        "has_solo_mode":     "є соло-режим",
        "is_short_game":     "коротка партія (≤45 хв)",
        "is_quick_setup":    "швидке розкладання",
        "is_light_game":     "легка за складністю",
        "is_medium_weight":  "середня складність",
        "is_heavy_game":     "глибока й складна",
        "is_family_friendly": "підходить для сім'ї",
        "is_family_game":    "сімейна гра",
        "has_cooperative":   "кооперативна механіка",
        "has_dice_rolling":  "є кидання кубиків",
        "has_deck_building": "deck-building механіка",
        "has_worker_placement": "розміщення робітників",
        "has_drafting":      "механіка драфту",
        "has_area_control":  "боротьба за терени",
        "has_negotiation":   "є переговори",
        "has_hidden_roles":  "є приховані ролі",
        "has_set_collection": "збір наборів",
        "has_tile_placement": "розміщення тайлів",
        "has_modular_board": "модульне поле",
        "has_trick_taking":  "механіка взяток",
        "has_push_your_luck": "push your luck",
        "has_auction":       "аукціони й торги",
        "has_hand_management": "управління картами в руці",
        "is_strategy_game":  "стратегічна гра",
        "is_economic":       "економічна тематика",
        "is_fantasy":        "фентезійна тематика",
        "is_scifi":          "наукова фантастика",
        "is_adventure":      "пригодницька гра",
        "is_horror":         "хоррор-тематика",
        "is_deduction":      "дедукція й логіка",
        "is_exploration":    "дослідження й відкриття",
        "is_thematic_game":  "сильна тема й атмосфера",
        "is_party_game":     "вечіркова гра",
        "is_civilization":   "цивілізаційна тема",
        "is_wargame":        "воєнна стратегія",
        "is_medieval":       "середньовічна атмосфера",
        "is_card_game":      "карткова гра",
        "is_miniatures":     "є мініатюри",
        "is_war":            "воєнний конфлікт",
        "is_animals":        "тема тварин",
        "is_farming":        "фермерська тема",
        "is_trains":         "поїзди й логістика",
        "is_city_building":  "будівництво міста",
        "desc_story":        "сильна сюжетна лінія",
        "desc_magic":        "магічна тематика",
        "desc_space":        "космічна тематика",
        "desc_nature":       "природа й довкілля",
        "desc_humor":        "гумор і легкий настрій",
        "desc_pirates":      "піратська романтика",
        "desc_zombies":      "зомбі",
        "desc_cards":        "картки — головна механіка",
    }
    return LABELS.get(feature, "")
