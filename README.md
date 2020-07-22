# ModelFlow
Framework and UI for arbitrary agent based models

# Installation
```
cd ..
python3 -m venv venv
source venv/bin/activate
cd modelflow
pip install -r requirements.txt
```

# Running An Example
To run an example:
```
cd examples/mars
python main.py
```

# Example Testing
To run tests for an example
```
cd examples/mars
python -m pytest
```
Note: You cannot currently run `pytest tests` as for now the sys.path of the current dir needs to be added. https://docs.pytest.org/en/stable/pythonpath.html


# Ideas
- Website with params can be autogenerated

# TODO
- Record instantaneous input/outputs of agents in addition to just storage
- Create full example model for Mars
- Support scaling agents
- Make website