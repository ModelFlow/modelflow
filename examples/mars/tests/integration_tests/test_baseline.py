# Test that the baseline mars scenario runs with no errors and all inhabitants survive one year
import json
import os
import sys
import argparse
import pathlib
import numpy as np
import time
sys.path.insert(0, "../..")
from models import list_models  # NOQA
from modelflow.modelflow import run_sim  # NOQA


class TestBaseline:

    def setup_method(self):
        abs_dir = pathlib.Path(__file__).parents[2].absolute()
        scenario_name = 'baseline'
        abs_path = os.path.join(abs_dir, 'scenarios', f'{scenario_name}.json')
        if not os.path.exists(abs_path):
            raise Exception(f"{abs_path} scenario not found!")
        with open(abs_path, 'r') as f:
            self.scenario = json.load(f)

        self.models = list_models()

    def test_baseline_scenario_no_numba_no_delta_outputs(self):
        outputs = run_sim(self.scenario, self.models, should_output_deltas=False, use_numba=False, force_fresh_run=True)
        # Ensure inhabitants are always alive
        assert np.amin(np.array(outputs['output_states']['state_is_alive']['data'])) > 0

    # This takes a long time to run, so commenting it out for now
    # def test_baseline_scenario_no_numba_delta_outputs(self):
    #     outputs = run_sim(self.scenario, self.models, should_output_deltas=True, use_numba=False)
    #     assert np.amin(np.array(outputs['output_states']['state_is_alive']['data'])) > 0

    # def test_baseline_scenario_numba_no_delta_outputs(self):
    #     outputs = run_sim(self.scenario, self.models, should_output_deltas=False, use_numba=True)
    #     assert np.amin(np.array(outputs['output_states']['state_is_alive']['data'])) > 0

    # def test_baseline_scenario_numba_delta_outputs(self):
    #     outputs = run_sim(self.scenario, self.models, should_output_deltas=True, use_numba=True)
    #     assert np.amin(np.array(outputs['output_states']['state_is_alive']['data'])) > 0