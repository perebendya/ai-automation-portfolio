# Board Game Finder

I built this adaptive board-game recommender for my bachelor’s thesis in System Analysis. A group picks its size, answers questions about play style and gets a ranked shortlist. Someone organising a game for six can try “yes” and “no” to a 45-minute limit and see which games move up.

[Try the four-question demo](https://perebendya.github.io/ai-automation-portfolio/boardgames.html?lang=en) · [Українське демо](https://perebendya.github.io/ai-automation-portfolio/boardgames.html?lang=uk)

## Run the Python app

From this directory, with Python 3.12 installed, run the commands below. The sample catalogue and trained model are included. The Streamlit interface is in Ukrainian.

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

Choose a group size and optional time limit. Each answer adjusts the scores. You can skip a question, stop early or answer up to twelve. On the results screen, switch on the ML model to compare the order.

## How it works

- **Filter.** Player count and maximum duration restrict which games can appear.
- **Ask.** The quiz starts with a score from BGG rank, number of ratings and Bayesian average. It uses Shannon entropy to find a question that divides the strongest remaining candidates. Question priority and previously covered topics break close calls.
- **Update.** A matching answer adds points and a conflicting answer subtracts them. Skipping leaves scores intact. Each result links to its BGG entry.
- **Rerank.** The optional model uses 94 static game attributes. The hybrid ranking combines the normalized quiz score (70%) with a histogram gradient boosting regressor’s prediction (30%). The same game receives the same raw model prediction across player scenarios.

[Adaptive quiz and scoring](src/recommender_core.py) · [Model inference](src/ml_reranker.py) · [Training and evaluation](scripts/train_no_leakage_model.py)

## Catalogue and experiment

The thesis catalogue contained 30,224 unique BoardGameGeek game IDs. The public sample contains the 500 highest-ranked base games in that snapshot with recorded player counts, duration and complexity. It includes titles, IDs and numeric features. Rankings and ratings reflect the thesis snapshot. [BoardGameGeek](https://boardgamegeek.com/)

The original training run used 23 synthetic preference scenarios. Seven other scenarios on the same catalogue were held out. Mean NDCG@10 was **0.8262** for the model alone and **0.5359** for the popularity baseline. These scores measure agreement with synthetic labels. The study did not measure player satisfaction or performance on unseen games. The label oracle in the metadata sorts the targets themselves. [Original training metrics and settings](models/ranking_model_metadata_no_leakage.json)

To rerun the experiment on the **500-game sample**, use a separate copy of this directory. Training writes a new model and metadata into that copy. The scores will differ from the full-catalogue run.

```sh
python scripts/train_no_leakage_model.py
```

## Browser demo

The browser lets you explore four answers for groups of two, four or six. Each step shows three games under either ranking. The Python exporter calculates all paths using the bundled model and a shortlist of 40 games to choose each question. GitHub Pages serves those results directly. Regenerate the demo after changing the sample or model.

```sh
python export_demo.py
```
