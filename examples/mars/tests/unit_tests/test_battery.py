import pytest
from examples.mars.models.battery import Battery
from modelflow.modelflow import run_test_step, obj

class TestBattery:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.battery = Battery()
        # TODO: improve this setting of params
        self.battery.params = self.battery._params

        self.inputs = obj(kwh_for_battery=0)
        self.outputs = obj(dc_kw=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.battery = None

    def run_step(self):
        run_test_step(self.battery, self.inputs, self.outputs)

    def test_negative_input_error(self):
        self.inputs.kwh_for_battery = -1
        with pytest.raises(Exception):
            self.run_step()

    def test_negative_state_error(self):
        self.battery.enrg_kwh = -1
        with pytest.raises(Exception):
            self.run_step()

    def test_charge(self):
        self.battery.enrg_kwh = 0
        self.inputs.kwh_for_battery = 100
        self.battery.params.roundtrip_efficiency = .9
        self.run_step()
        assert self.battery.enrg_kwh == 90

    def test_discharge(self):
        # Kinda a trick question because other systems
        # actually are the ones that pull kwh
        self.battery.enrg_kwh = 90
        self.run_step()
        assert self.battery.enrg_kwh == 90
