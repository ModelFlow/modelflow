import copy
import pytest
import pandas as pd
from model_classes.BatteryAndInverter import BatteryAndInverter
from model_classes.Time import Time
from model_classes.Starship import Starship
from model_classes.MarsSurface import MarsSurface
from model_classes.InterplanetarySpace import InterplanetarySpace
from model_classes.StarshipIntegratedPV import StarshipIntegratedPV
from model_classes.SurfacePV import SurfacePV
from model_classes.GridSimulator import GridSimulator

from modelflow.modelflow import run_scenario


class TestElectricalSystems():

    scenario = {
        "simulation_params": {
            "max_num_steps": 1000,
        },
        "model_instances": {
            "time": {
                "model_class": Time,
                "label": "Simulation Space & Time",
                "initial_parent_key": None,
                "overrides": {  # Overrides either params or initial states
                    "utc_start": 0,
                    "current_utc": 0,
                    "seconds_per_sim_step": 3600
                }
            },
            "starship": {
                "model_class": Starship,
                "label": "Starship",
                "initial_parent_key": "interplanetary_space",
                "overrides": {
                    "launch_utc": 0,
                    "travel_days_to_mars": 1,
                    "travel_days_from_mars": 1,
                    "mars_stay_days": 1
                }
            },
            "interplanetary_space": {
                "model_class": InterplanetarySpace,
                "label": "Interplanetary Space",
                "initial_parent_key": "time",
            },
            "mars_surface": {
                "model_class": MarsSurface,
                "label": "Mars Surface",
                "initial_parent_key": "time",
            },
            "starship_pv": {
                "model_class": StarshipIntegratedPV,
                "label": "Starship Integrated PV",
                "initial_parent_key": "starship",
                # "connections": {
                #     "generated_dc_kwh": "battery_and_inverter"
                # }
            },
            "surface_pv": {
                "model_class": SurfacePV,
                "label": "Starship Integrated PV",
                "initial_parent_key": "starship",
            },
            "battery_and_inverter": {
                "model_class": BatteryAndInverter,
                "label": "Battery and Inverter",
                "initial_parent_key": "starship",
            },
            "grid_simulator": {
                "model_class": GridSimulator,
                "label": "Grid Simulator",
                "initial_parent_key": "starship",
            }
        }
    }

    def test_electrical_systems(self):
        outputs = run_scenario(self.scenario)
        # TODO: Write tests