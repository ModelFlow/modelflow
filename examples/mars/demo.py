import sys

import copy
import pytest
from models.time import Time
from models.starship import Starship
from models.mass_simulator import MassSimulator
from models.mars_surface import MarsSurface

sys.path.insert(0, "../..")

from modelflow.modelflow import run_scenario  # NOQA

base_scenario = {
    "simulation_params": {
        "max_num_steps": 1000,
    },
    "model_instances": {
        "mass_simulator": {
            "model_class": MassSimulator,
            "label": "Mass Simulator",
            "parent_instance_key": "starship",
            "overrides": {
                "mass": 1,
                "volume": 1
            }
        },
        # "mass_simulator2": {
        #     "model_class": MassSimulator,
        #     "label": "Mass Simulator 2",
        #     "parent_instance_key": "starship",
        #     "overrides": {
        #         "mass": 2,
        #         "volume": 2
        #     }
        # },
        "time": {
            "model_class": Time,
            "label": "Simulation Space & Time",
            "parent_instance_key": None,
            "overrides": {  # Overrides either params or initial states
                "utc_start": 0,
                "seconds_per_sim_step": 3600
            }
        },
        "starship": {
            "model_class": Starship,
            "label": "Starship",
            "parent_instance_key": "time",
            "overrides": {
                "launch_utc": 3600 * 24,
                "travel_days_to_mars": 1,
                "travel_days_from_mars": 1,
                "mars_stay_days": 1
            }
        },
        "mars_surface": {
            "model_class": MarsSurface,
            "label": "Mars Surface",
            "parent_instance_key": "time",
        },


    }
}

outputs = run_scenario(base_scenario)
print("done")
