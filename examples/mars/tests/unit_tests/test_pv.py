import sys
sys.path.insert(0, "../..")
from models.pv import SolarArray
from modelflow.modelflow import run_test_step, obj

class TestPV:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.pv = SolarArray()
        # TODO: improve this setting of params
        self.pv.params = self.pv._params
        self.outputs = obj(dc_kw=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.pv = None

    def run_step(self):
        run_test_step(self.pv, None, None)

    def test_first_output_zero(self):
        self.run_step()
        assert self.pv.dc_kw == 0
