import copy
import pytest
import pandas as pd
from models.battery_and_inverter import BatteryAndInverter
from models.time import Time
from models.starship import Starship
from models.mars_surface import MarsSurface
from models.mass_simulator import MassSimulator
from models.interplanetary_space import InterplanetarySpace
from models.starship_integrated_pv import StarshipIntegratedPV
from models.surface_pv import SurfacePV
from models.grid_simulator import GridSimulator

from modelflow.modelflow import run_scenario


class TestElectricalSystems():

    base_scenario = {
        "simulation_params": {
            "max_num_steps": 1000,
        },
        "model_instances": {
            "time": {
                "model_class": Time,
                "label": "Simulation Space & Time",
                "parent_instance_key": None,
                "overrides": {  # Overrides either params or initial states
                    "utc_start": 0,
                    "current_utc": 0,
                    "seconds_per_sim_step": 3600
                }
            },
            "starship": {
                "model_class": Starship,
                "label": "Starship",
                "parent_instance_key": "interplanetary_space",
                "overrides": {
                    "launch_utc": 3600 * 24,
                    "travel_days_to_mars": 1,
                    "travel_days_from_mars": 1,
                    "mars_stay_days": 1
                }
            },
            "interplanetary_space": {
                "model_class": InterplanetarySpace,
                "label": "Interplanetary Space",
                "parent_instance_key": "time",
            },
            "mars_surface": {
                "model_class": MarsSurface,
                "label": "Mars Surface",
                "parent_instance_key": "time",
            },
            "starship_pv": {
                "model_class": StarshipIntegratedPV,
                "label": "Starship Integrated PV",
                "parent_instance_key": "starship",
            },
            "surface_pv": {
                "model_class": SurfacePV,
                "label": "Starship Integrated PV",
                "parent_instance_key": "starship",
            },
            "battery_and_inverter": {
                "model_class": BatteryAndInverter,
                "label": "Battery and Inverter",
                "parent_instance_key": "starship",
            },
            "grid_simulator": {
                "model_class": GridSimulator,
                "label": "Grid Simulator",
                "parent_instance_key": "starship",
            }
        }
    }


def test_electrical_systems():
    pass