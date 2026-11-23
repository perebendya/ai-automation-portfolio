"""Offline excerpt of AI Rental Assistant with synthetic examples."""
import re


NOT_BED = r"диван[\s-]*ліжк|диван[\s-]*кроват|ліжк[оа][\s-]*трансформер|трансформер|розклад|расклад"
BED = r"ліжк|кроват|двоспальн|двухспальн|односпальн"
SOFA = r"диван|софа"


RULES = {
    "gas_stove": (r"газов[аоі][яй]?\s*плит|газ\.?\s*плит|плита\s*газ|газова варильн", r"електроплит|електричн[аі]\s*плит|електро\s*плит|індукц|индукц"),
    "pets_ok": (r"можна з твар|можна с живот|з тваринами|тварин.{0,15}(можна|дозвол)|живот.{0,15}можно", r"без тварин|без живот|тварин.{0,15}(не|заборон)|животн.{0,15}(нельзя|нет)"),
    "fiber": (r"оптоволокн|оптик|gpon|гігабіт|гигабит|lanet|ланет", None),
    "bathroom_ok": (r"нов[аий]+\s*сантехн|ванна нова|нов[аий]+\s*санвуз|новий бойлер|євроремонт|сучасний ремонт|свіжий ремонт", r"без ремонту|прост[иоа][йму]* житлов|прост[ао][мй] состоян|жилом состоянии|потребує ремонту|косметичн"),
    "table": (r"\bстіл\b|\bстол\b|обідн|кухонний стіл|стіл для", None),
}


def sig(text, pos, neg):
    if neg and re.search(neg, text):
        return -1
    return 1 if re.search(pos, text) else 0


def bed_signal(text):
    t = re.sub(NOT_BED, " ", text)
    if re.search(BED, t):
        return 1
    return -1 if re.search(SOFA, text) else 0


def score(s, weights):
    return sum(weights[k] * s.get(k, 0) for k in weights)

PRIORITIES = {"real_bed": 3, "pets_ok": 2, "gas_stove": 1}
EXAMPLES = [
    "Двоспальне ліжко, можна з тваринами, газова плита.",
    "Газова плита. Меблі за домовленістю.",
    "Розкладний диван, без тварин.",
]


def rank(description):
    text = description.lower()
    evidence = {"real_bed": bed_signal(text)}
    for feature in ("pets_ok", "gas_stove"):
        evidence[feature] = sig(text, *RULES[feature])
    return score(evidence, PRIORITIES), evidence


if __name__ == "__main__":
    for description in sorted(EXAMPLES, key=lambda item: rank(item)[0], reverse=True):
        points, evidence = rank(description)
        print(f"{points:+}  {description}")
        print("    " + ", ".join(f"{key}={value:+}" for key, value in evidence.items()))
