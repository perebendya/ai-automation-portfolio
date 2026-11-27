# Board Game Finder

I built this recommender for my bachelor’s thesis in System Analysis. Choose a table size, time budget and complexity, then answer questions about the games you enjoy. Both the website and the Python app use the full thesis snapshot of **30,224 board games**, the same 60 questions and the same trained model.

[Find a board game](https://perebendya.github.io/ai-automation-portfolio/boardgames.html?lang=en) · [Підібрати настільну гру](https://perebendya.github.io/ai-automation-portfolio/boardgames.html?lang=uk)

## How a recommendation is made

1. The finder filters the catalogue by player count, time, complexity and minimum BoardGameGeek Bayesian rating. A game with unknown playing time cannot pass a time limit.
2. Every eligible game starts with a score based on BGG rank, vote count and Bayesian rating. After each answer, matches gain points and mismatches lose points. Skipping a question leaves scores intact.
3. The quiz uses Shannon entropy to choose a question that separates the leading 200 candidates. It skips questions with no information gain and avoids redundant group-size questions once the player count is fixed. You can stop early, undo answers, or answer up to twelve.
4. The optional histogram gradient boosting model evaluates each game’s 94 static features. The final ranking combines the normalized quiz score (70%) with the normalized model score (30%). Each result includes a link to the original BGG entry and shows relevant game characteristics when available.

## Run locally

With Python 3.12 installed, run these commands from this directory.

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

The Streamlit UI is Ukrainian. The website supports Ukrainian and English. To run the website locally, start a static HTTP server from the parent directory and open `/boardgames.html`.

## Data and inference

The catalogue is a dated research snapshot. It includes game IDs, names, numeric features, category and mechanic tags, and links to BGG thumbnails. Unknown measurements are preserved. Cover images load from the original host. [BoardGameGeek](https://boardgamegeek.com/)

The browser loads the compressed catalogue and calculates rankings inside a worker. The exported tree splits and leaf values come directly from the fitted scikit-learn estimator. Changing an answer, filter or ranking mode recalculates the shortlist. The Python and browser engines read the same question bank and weights. [Python implementation](src/recommender_core.py) · [Browser engine](engine.js) · [Question bank](ranking.json)

## Training and verification

The original experiment trained on 23 synthetic preference scenarios and held out seven scenarios on the same game catalogue. Mean NDCG@10 was **0.8262** for the model alone and **0.5359** for the popularity baseline. The labels were generated from preference rules. Player satisfaction and performance on unseen games were outside the experiment. [Experiment metadata](models/ranking_model_metadata_no_leakage.json)

To rerun training, work in a copy of this directory because the script writes a replacement model and metrics. Export the refitted model before opening the website again.

```sh
python scripts/train_no_leakage_model.py
python export_catalogue.py
```

To rebuild the research feature table from the original BGG rank and details CSVs, run `python scripts/build_features.py base.csv details.csv features.csv`. Pass the resulting CSV to `export_catalogue.py` to repack the catalogue. The included test compares all browser model predictions to scikit-learn and checks question selection, eligibility, ordering, skips and the empty-result path against Python. It requires Node.js 20+.

```sh
python -m unittest discover -s tests
```
