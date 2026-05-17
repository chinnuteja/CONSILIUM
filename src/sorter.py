def sort_scores(scores: dict) -> list[tuple]:
    items = list(scores.items())
    items.sort(key=lambda x: x[1], reverse=True)
    return items
