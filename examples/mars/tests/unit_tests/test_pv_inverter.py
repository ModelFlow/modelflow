import pytest
import sys
sys.path.insert(0, "../..")
from models.pv_inverter import PVInverter
from modelflow.modelflow import run_test_step, obj

class TestPVInverter:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.inverter = PVInverter()
        # TODO: improve this setting of params
        self.inverter.params = self.inverter._params

        self.inputs = obj(dc_kwh=100)
        self.outputs = obj(kwh_for_battery=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.inverter = None
        self.inputs = None
        self.outputs = None

    def run_step(self):
        run_test_step(self.inverter, self.inputs, self.outputs)

    def test_inverter_works(self):
        self.inverter.params.one_way_efficiency = 0.98
        self.run_step()
        assert self.inputs.kwh_for_battery == 98

    def test_no_output(self):
        self.inputs.dc_kwh = 0
        self.run_step()
        assert self.outputs.kwh_for_battery == 0

    def test_clipped_output(self):
        self.inputs.dc_kwh = 100
        self.inputs.max_kw_ac = 50
        self.run_step()
        assert self.outputs.kwh_for_battery == 50

    def test_inverter_no_negative(self):
        self.inputs.dc_kwh = -1
        with pytest.raises(Exception):
            self.run_step()
