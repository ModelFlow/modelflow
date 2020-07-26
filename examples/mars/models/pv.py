import os
import pandas as pd
from pathlib import Path
from modelflow.modelflow import Model, ModelParam, ModelState


class SolarArray(Model):
    def setup(self):
        # Want some naming indication that this is a
        # solar array from data.
        self.name = "solar_array"

        self.params = [
            ModelParam(
                key="scaling_factor",
                units="kw", # (Doesn't matter if kwh since hour hard coded currently)
                value=100,
            )
        ]

        self.states = [
            ModelState(
                # Note: This should probably be a global var
                # currently used to index into csv for power gen
                key="time_since_start",
                units="hours",
                # initial_val=0,
                value=0
            )
        ]

        self.linked_output_states = [
            "dc_kwh"
        ]

        # NOTE: loading this pv data from earth is obviously
        # a bad idea, but demonstrates incorporating hard coded
        # time series data as a constraint
        filepath = os.path.join(
            Path(__file__).parent.parent.absolute(), 'data', 'pvwatts_hourly.csv')
        self.data = pd.read_csv(filepath).values[:,0]

    def run_step(self, inputs, outputs, params, states):
        outputs.dc_kwh = self.data[states.time_since_start % len(self.data)] * params.scaling_factor
        states.time_since_start += 1
