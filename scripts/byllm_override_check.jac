import from byllm.lib { Model }

glob default_model = Model(
        model_name="mockllm",
        config={"outputs": ["DEFAULT_MODEL_OK"]}
    ),
    specialist_model = Model(
        model_name="mockllm",
        config={"outputs": ["SPECIALIST_MODEL_OK"]}
    );

"""Return a short confirmation from the default test model."""
def ask_default() -> str by default_model();

"""Return a short confirmation from the specialist test model."""
def ask_specialist() -> str by specialist_model();

with entry {
    print(ask_default());
    print(ask_specialist());
}
