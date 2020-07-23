from types import SimpleNamespace
import sys
sys.path.insert(0, "../..")
from models.humans import Human
from modelflow.modelflow import run_test_step

def obj(**kwargs):
    return SimpleNamespace(**kwargs)

class TestHumans:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.human = Human()
        # TODO: improve this setting of params
        self.human.params = self.human._params
        self.inputs = obj(atmo_o2=390.11,
                           atmo_co2=0.76,
                           atmo_n2=1454,
                           h2o_potb=18.625,
                           food_edbl=100)

        self.outputs = obj(atmo_co2=self.inputs.atmo_co2,
                            atmo_h2o=0,
                            h2o_urin=0,
                            h2o_waste=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.human = None
        self.inputs = None
        self.outputs = None

    def run_step(self):
        run_test_step(self.human, self.inputs, self.outputs)

    def test_human_is_alive(self):
        assert self.human.is_alive == 1
        self.run_step()
        assert self.human.is_alive == 1

    def test_human_no_atmosphere(self):
        assert self.human.is_alive == 1
        self.inputs.atmo_o2 = 0
        self.run_step()
        assert self.human.is_alive == 0

    def test_human_no_water(self):
        self.inputs.h2o_potb = 0
        self.human.params.max_hrs_survivable_with_no_water = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no water
        # hour 2 = no water
        # hour 3 = dead
        for i in range(0, self.human.params.max_hrs_survivable_with_no_water+2):
            assert self.human.is_alive == 1
            self.run_step()
        assert self.human.is_alive == 0

    def test_human_outputs(self):
        self.run_step()
        assert self.outputs.h2o_urin > 0
        assert self.outputs.h2o_waste > 0


