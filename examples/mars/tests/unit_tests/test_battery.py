import sys
sys.path.insert(0, "../..")
from models.battery import Battery
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
        self.outputs = obj(dc_kw=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.battery = None

    def run_step(self):
        run_test_step(self.battery, None, None)

    def test_first_output_zero(self):
        self.run_step()
        assert self.battery.dc_kw == 0
