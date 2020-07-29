[![Build Status](https://travis-ci.org/ModelFlow/modelflow.svg?branch=master)](https://travis-ci.org/ModelFlow/modelflow)

# ModelFlow
Framework and UI for arbitrary agent based models

# Installation
Please use python 3.6 or later
```
cd ..
python3 -m venv venv
source venv/bin/activate
cd modelflow
pip install -r requirements.txt
```

# Running an Example
To run Mars example:
```
cd examples/mars
python main.py --scenario no_food
```

# Example Testing
To run tests:
```
pytest
```
Note: You need to run this from the modelflow root, not cd into examples

# TODO
- Figure out how to elegantly store modeling scenarios (started serializing confits)
- See if we need to store the delta outputs from each agent
- Add linting requirement git hook
- Setup integration testing git hook
- Support hierarchy and containers for models
- Come up with format for serializing scenario configs and agents
- Validate all serialized inputs through jsonschema
- Audit the flow of all units throughout model
- Support different time spans (not just 1hr hard coded)
- Add support for scaling models in scenarios
- Create local website that automatically documents parameters
- Create png graphical visualization of flows
- Add utility for easily running parameter sweeps
- Create local website to automatically edit parameters
- Create local website to visualize flows and potentially edit
- Look into cython for agents and optimizing speed
- Figure out a way to have certain inputs scaled on other inputs. i.e. lighting determined by habitat volume. Scale atmosphere by volume.
- Add warnings and events
- Add perhaps native support for descrete event simulation
- Add type hints to all functions
- Make it easy to be able to swap models

# Ideas
- Replace complicated agents with neural networks trained on parameter sweeps
- Create a playground for reinforcement learning algorithms to explore