import sys
sys.path.insert(0, "../..")
from models import Location, Raddish, HabitatAtmosphere
from modelflow.modelflow import run_simulation

def main():
    # TODO: Have system for scaling actors. Currently just add multiple lol
    # Think of also how to change the params
    # Think about how to sweep over params
    scenario = {
        "models": [
            Location(),
            Raddish(),
            HabitatAtmosphere(),
        ],
        "run_for_steps": 2,
        "time_per_step": "1hr" # TODO: Actually use this
    }
    run_simulation(scenario)

if __name__ == '__main__':
    main()
