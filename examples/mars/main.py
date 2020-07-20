import sys
sys.path.insert(0, "../..")
from models import Location, Plant, HabitatAtmosphere
from modelflow.modelflow import run_simulation

def main():
    scenario = {
        "models": [
            Location(),
            Plant(),
            HabitatAtmosphere(),
        ],
        "run_for_steps": 48,
        "time_per_step": "1hr" # Note: Not sure how to make this actually configurable
    }
    run_simulation(scenario)

if __name__ == '__main__':
    main()
