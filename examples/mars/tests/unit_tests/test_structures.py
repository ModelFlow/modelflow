import sys
sys.path.insert(0, "../..")
from modelflow.modelflow import run_test_step, obj
from models.structures import HabitatStructure


class TestStuctures:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.habitat = HabitatStructure()
        # TODO: improve this setting of params
        self.habitat.params = self.habitat._params

        self.inputs = obj(atmo_o2=100,
                          atmo_co2=0,
                          atmo_n2=0,
                          atmo_ch4=0,
                          atmo_h2=0)

        self.outputs = obj(atmo_o2=100,
                           atmo_co2=0,
                           atmo_n2=0,
                           atmo_ch4=0,
                           atmo_h2=0,
                           heat_diff_kwh=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.habitat = None

    def run_step(self):
        run_test_step(self.habitat, self.inputs, self.outputs)

    def test_leaks_air(self):
        self.habitat.params.leak_rate = 0.01
        self.run_step()
        assert self.outputs.atmo_o2 == 99

    def test_leaks_heat(self):
        self.habitat.params.heat_loss_per_hour = 5
        self.run_step()
        assert self.outputs.heat_diff_kwh == -5
