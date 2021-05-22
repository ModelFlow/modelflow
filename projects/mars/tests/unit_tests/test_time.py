import pytest
from model_classes.Time import Time
from modelflow.testing import ModelUnitTest
from modelflow.modelflow import SimulationError


class TestTime(ModelUnitTest):
    def setup_method(self):
        # This will be called before every test
        self.setup_model(Time(), states=dict(
            utc_start=0,
            current_utc=0,
            seconds_per_sim_step=3600,
            hours_since_mars_midnight=0,
        ))

    def test_time_basic(self):
        assert self.states.utc_start == 0
        self.run_step()
        assert self.states.current_utc == 3600

