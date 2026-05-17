import json
def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.loads(f.read())

def dumps_json(obj) -> str:
    return json.dumps(obj)
