import pytest
import sys
sys.path.insert(0, "../..")
from models.indoor_air import IndoorAir
from modelflow.modelflow import run_test_step


class TestIndoorAir:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.indoor_air = IndoorAir()
        # TODO: improve this setting of params
        self.indoor_air.params = self.indoor_air._params

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.indoor_air = None
        self.inputs = None
        self.outputs = None

    def run_step(self):
        run_test_step(self.indoor_air, self.inputs, self.outputs)

    def test_heat_raises_temp(self):
        assert self.indoor_air.atmo_temp == 20
        self.indoor_air.heat_diff_kwh = 10
        self.run_step()
        assert self.indoor_air.atmo_temp > 20
        assert self.indoor_air.heat_diff_kwh = 0

    def test_storage_exceeds_max(self):
        # TODO: Don't let atmosphere get this high and account for
        # overpressue events
        self.indoor_air.atmo_o2 = 10001
        self.run_step()
        assert self.indoor_air.atmo_o2 == 10000

    def test_storage_no_negative(self):
        self.indoor_air.atmo_o2 = -1
        with pytest.raises(Exception):
            self.run_step()

