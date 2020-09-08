import os
import pandas as pd
from pathlib import Path


class SolarArray:
    definition = {
        # Want some naming indication that this is a
        # solar array from data.
        "name": "solar_array",
        "params": [
            dict(
                key="scaling_factor",
                units="kw", # (Doesn't matter if kwh since hour hard coded currently)
                value=100,
                min=0,
                max=10000
            ),
            dict(
                key="mass",
                units="kg/kw",
                value=1.1,
                source='https://www.reddit.com/r/spacex/comments/dopbfz/estimating_what_building_a_110_mw_solar_park_on/',
                notes="https://ntrs.nasa.gov/citations/20040191326"
            )
        ],
        "states": [
            dict(
                # Note: This should probably be a global var
                # currently used to index into csv for power gen
                key="time_since_start",
                units="hours",
                # initial_val=0,
                value=0
            ),

        ],
        "linked_output_states": [
            "dc_kwh"
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass * params.scaling_factor

    # NOTE: loading this pv data from earth is obviously
    # a bad idea, but demonstrates incorporating hard coded
    # time series data as a constraint
    @staticmethod
    def load_data():
        filepath = os.path.join(
            Path(__file__).parent.parent.absolute(), 'data', 'pvwatts_hourly.csv')
        return pd.read_csv(filepath).values[:,0]

    @staticmethod
    def run_step(inputs, outputs, params, states, data):
        outputs.dc_kwh = data[states.time_since_start % len(data)] * params.scaling_factor
        states.time_since_start += 1
