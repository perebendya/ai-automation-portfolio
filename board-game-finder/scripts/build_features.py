"""Rebuild the thesis feature table from the BGG ranks and details snapshots."""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


def split_pipe_values(text):
    if pd.isna(text) or not str(text).strip():
        return []
    return [x.strip().lower() for x in str(text).split("|") if x.strip()]


def has_any_token(token_list, aliases):
    token_set = set(token_list)
    return int(any(alias in token_set for alias in aliases))


def description_has_terms(text, terms):
    text = str(text).lower()
    return int(any(term in text for term in terms))


MECHANIC_FEATURES = {
    "has_deck_building": ["deck, bag, and pool building", "deck construction"],
    "has_worker_placement": ["worker placement"],
    "has_drafting": ["open drafting", "closed drafting", "drafting"],
    "has_dice_rolling": ["dice rolling"],
    "has_area_control": ["area majority / influence", "area control"],
    "has_cooperative": ["cooperative game"],
    "has_hand_management": ["hand management"],
    "has_tile_placement": ["tile placement"],
    "has_set_collection": ["set collection"],
    "has_solo_mode": ["solo / solitaire game"],
    "has_auction": ["auction / bidding", "auction", "bidding"],
    "has_negotiation": ["negotiation"],
    "has_take_that": ["take that"],
    "has_push_your_luck": ["push your luck"],
    "has_modular_board": ["modular board"],
    "has_hidden_roles": ["hidden roles"],
    "has_trick_taking": ["trick-taking"],
    "has_roll_and_write": ["roll / write", "paper-and-pencil"],
}

CATEGORY_FEATURES = {
    "is_fantasy": ["fantasy"],
    "is_scifi": ["science fiction"],
    "is_economic": ["economic"],
    "is_horror": ["horror"],
    "is_adventure": ["adventure"],
    "is_medieval": ["medieval"],
    "is_war": ["wargame"],
    "is_animals": ["animals"],
    "is_party_game": ["party game"],
    "is_deduction": ["deduction"],
    "is_exploration": ["exploration"],
    "is_fighting": ["fighting"],
    "is_civilization": ["civilization"],
    "is_city_building": ["city building"],
    "is_card_game": ["card game"],
    "is_miniatures": ["miniatures"],
    "is_trains": ["trains"],
    "is_farming": ["farming"],
}

DESCRIPTION_FEATURES = {
    "desc_battle": ["battle", "battles", "combat", "war", "fight", "fighting"],
    "desc_cards": ["card", "cards", "deck", "hand of cards"],
    "desc_story": ["story", "narrative", "campaign", "plot", "tale"],
    "desc_trade": ["trade", "trading", "merchant", "market", "economy"],
    "desc_nature": ["forest", "jungle", "animal", "farm", "garden", "nature"],
    "desc_space": ["space", "galaxy", "planet", "orbit", "starship", "alien"],
    "desc_magic": ["magic", "spell", "wizard", "dragon", "mage"],
    "desc_mystery": ["mystery", "detective", "clue", "secret", "investigation"],
    "desc_humor": ["humor", "humour", "funny", "laugh"],
    "desc_pirates": ["pirate", "pirates", "sea", "ocean", "ship", "sail"],
    "desc_zombies": ["zombie", "zombies", "undead"],
    "desc_cities": ["city", "town", "urban", "village", "metropolis"],
    "desc_survival": ["survival", "survive", "disaster", "escape"],
}


def build_features(base, details):
    for df in (base, details):
        df.columns = df.columns.str.strip().str.lower()
        df["id"] = pd.to_numeric(df["id"], errors="coerce").astype("Int64")
    base = base.dropna(subset=["id"]).drop_duplicates("id")
    details = details.dropna(subset=["id"]).drop_duplicates("id", keep="last")
    games = base.merge(details, on="id", how="left", validate="one_to_one")

    numeric_cols = [
        "minplayers", "maxplayers", "playingtime", "minplaytime", "maxplaytime",
        "minage", "averageweight", "rank", "average", "bayesaverage",
        "usersrated", "yearpublished",
        "abstracts_rank", "cgs_rank", "childrensgames_rank", "familygames_rank",
        "partygames_rank", "strategygames_rank", "thematic_rank", "wargames_rank",
    ]

    for col in numeric_cols:
        if col in games.columns:
            games[col] = pd.to_numeric(games[col], errors="coerce")

    for col in ["description", "categories_raw", "mechanics_raw", "families_raw"]:
        if col in games.columns:
            games[col] = games[col].fillna("").astype(str)

    games["categories_list"] = games["categories_raw"].apply(split_pipe_values)
    games["mechanics_list"] = games["mechanics_raw"].apply(split_pipe_values)

    games["n_categories"] = games["categories_list"].str.len().astype(int)
    games["n_mechanics"] = games["mechanics_list"].str.len().astype(int)
    games["has_categories"] = (games["n_categories"] > 0).astype(int)
    games["has_mechanics"] = (games["n_mechanics"] > 0).astype(int)

    games["is_solo"] = ((games["minplayers"] <= 1) & (games["maxplayers"] >= 1)).astype(int)
    games["is_two_player"] = ((games["minplayers"] <= 2) & (games["maxplayers"] >= 2)).astype(int)
    games["is_four_plus"] = (games["maxplayers"] >= 4).astype(int)
    games["is_six_plus"] = (games["maxplayers"] >= 6).astype(int)

    for players in range(1, 7):
        games[f"supports_{players}p"] = (
            (games["minplayers"] <= players) & (games["maxplayers"] >= players)
        ).astype(int)

    games["player_range_width"] = (games["maxplayers"] - games["minplayers"]).clip(lower=0)

    games["is_short_game"] = (games["playingtime"] <= 45).astype(int)
    games["is_medium_game"] = ((games["playingtime"] > 45) & (games["playingtime"] <= 90)).astype(int)
    games["is_long_game"] = (games["playingtime"] > 90).astype(int)
    games["is_quick_setup"] = (games["minplaytime"] <= 30).astype(int)
    games["is_long_session"] = (games["maxplaytime"] >= 120).astype(int)
    games["playtime_range_width"] = (games["maxplaytime"] - games["minplaytime"]).clip(lower=0)

    games["is_light_game"] = (games["averageweight"] < 2.0).astype(int)
    games["is_medium_weight"] = ((games["averageweight"] >= 2.0) & (games["averageweight"] < 3.2)).astype(int)
    games["is_heavy_game"] = (games["averageweight"] >= 3.2).astype(int)
    games["is_family_friendly"] = games["minage"].le(10).fillna(False).astype(int)
    games["is_adult_game"] = games["minage"].ge(14).fillna(False).astype(int)

    rank_feature_map = {
        "is_family_game": "familygames_rank",
        "is_strategy_game": "strategygames_rank",
        "is_thematic_game": "thematic_rank",
        "is_wargame_ranked": "wargames_rank",
        "is_party_ranked": "partygames_rank",
    }

    for feature, rank_col in rank_feature_map.items():
        games[feature] = games[rank_col].notna().astype(int) if rank_col in games.columns else 0

    flags = {}
    for source, definitions in (("mechanics_list", MECHANIC_FEATURES), ("categories_list", CATEGORY_FEATURES)):
        for feature, aliases in definitions.items():
            flags[feature] = games[source].apply(lambda values: has_any_token(values, aliases))
    for feature, terms in DESCRIPTION_FEATURES.items():
        flags[feature] = games["description"].apply(lambda text: description_has_terms(text, terms))
    games = pd.concat([games, pd.DataFrame(flags, index=games.index)], axis=1)

    games["description_length"] = games["description"].str.len()
    games["desc_is_detailed"] = (games["description_length"] >= 500).astype(int)

    games["is_wargame"] = games[["is_war", "is_wargame_ranked"]].max(axis=1).astype(int)
    games["log_usersrated"] = np.log1p(games["usersrated"])
    return games


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", type=Path, help="boardgames_final_base.csv")
    parser.add_argument("details", type=Path, help="bgg_details_bulk_after_brass.csv")
    parser.add_argument("output", type=Path, help="destination feature CSV")
    args = parser.parse_args()
    features = build_features(pd.read_csv(args.base), pd.read_csv(args.details))
    features.to_csv(args.output, index=False)
