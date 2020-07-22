from types import SimpleNamespace
import sys
sys.path.insert(0, "../..")
from models import Human
from modelflow.modelflow import run_test_step

def obj(**kwargs):
    return SimpleNamespace(**kwargs)

class Tests:
    # TODO: Find a better place to put these fixtures
    @classmethod
    def setup_class(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # TODO: Eventually only load models which are depended
        # self.models = setup_models(all_models())

        # Defaults
        self.human = Human()
        self.inputs = obj(atmo_o2=390.11,
                           atmo_co2=0.76,
                           atmo_n2=1454,
                           h2o_potb=18.625,
                           food_edbl=100)

        self.outputs = obj(atmo_co2=self.inputs.atmo_co2,
                            atmo_h2o=0,
                            h2o_urin=0,
                            solid_waste=0)

    @classmethod
    def teardown_class(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.models = None

    def run_step(self):
        run_test_step(self.human, self.inputs, self.outputs)

    def test_human_is_alive(self):
        self.run_step()
        assert self.human.is_alive == 1

    def test_human_no_atmosphere(self):
        self.inputs.atmo_o2 = 0
        self.run_step()
        assert self.human.is_alive == 0

    # def test_human_no_water(self):
    #     self.inputs.atmo_o2 = 0
    #     self.run_step()
    #     assert self.human.is_alive == 0
