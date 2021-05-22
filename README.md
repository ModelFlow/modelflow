[![Build Status](https://travis-ci.org/ModelFlow/modelflow.svg?branch=master)](https://travis-ci.org/ModelFlow/modelflow)

# ModelFlow
Python framework and web interface for creating and sharing agent based models.

![](screenshots/modelflow_2020_09_20.png)
*Simple Mars Base Example Results Visualized in the Modelflow Interface https://modelflow.io*

## Installation
Requires python 3.6 or later. See [Windows.md](Windows.md) for windows specific instructions.
```
cd ..
python3 -m venv venv
source venv/bin/activate
cd modelflow
pip install -r requirements.txt
```

## Running an example in terminal
To run the Mars default baseline scenario example:
```
cd projects/mars
python main.py
```

## Running the website locally
(This currently is hard coded for the Mars example) In one terminal window after installing [npm](https://nodejs.org/en/) run:
```
cd website/frontend
npm install
npm start
```
In a second terminal window after following steps under installation, run:
```
source venv/bin/activate
cd modelflow/website/backend/webserver
python manage.py migrate
python manage.py load_mars_project
python manage.py runserver
```
In a browser open http://localhost:3000

## Testing
Run tests from the modelflow root dir using:
```
pytest
```

## Models

```
class AProducer:
    params = [
        dict(
            key="production_per_step",
            value=5
        )
    ]

    states = [
        dict(
            key="shared_state",
            value=10
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.shared_state += params.production_per_step

```

- **States**: These are values that change overtime and can be accesses internally and by default by other models within scope as well
- **Params**: These are mostly constants that can be tweaked
- **Utils**: This is a library of functions that can be used


## Schema

```
 scenario = {
        "simulation_params": {
            "max_num_steps": 2
        },
        "model_instances": {
            "root": {
                "model_class": Root
            },
            "group1": {
                "model_class": AGroup,
                "initial_parent_key": "root"
            },
            "group1_producer": {
                "model_class": AProducer,
                "initial_parent_key": "group1"
            },
            "group1_consumer": {
                "model_class": AConsumer,
                "initial_parent_key": "group1"
            },
            "group2": {
                "model_class": AGroup,
                "initial_parent_key": "root"
            },
            "group2_producer": {
                "model_class": AProducer,
                "initial_parent_key": "group2",
                "overrides": {
                    "shared_state": 100
                }
            },
            "group2_consumer": {
                "model_class": AConsumer,
                "initial_parent_key": "group2"
            }
        }
    }
```
Defines the location hierarchy and connections between models with optional overrides of attributes

## Inspiration

- Sydney Do's thesis http://strategic.mit.edu/docs/PhD_2016_do.pdf
- Wolfram Alpha System Modeler: https://www.wolfram.com/system-modeler/examples/energy/energy-consumption-model.html
- SIMOC (Mars Habitat Simulation): https://ngs.simoc.space/entry

## Notes

See [NOTES.md](NOTES.md) for TODOs and ideas 
