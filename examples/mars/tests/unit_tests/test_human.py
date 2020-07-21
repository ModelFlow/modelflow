import sys
sys.path.insert(0, "../..")
from models import all_models
from modelflow.modelflow import run_simulation_inner
from types import SimpleNamespace


class Tests:
    # TODO: Find a better place to put this
    @classmethod
    def setup_class(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # TODO: Eventually only load models which are depended
        self.models_list = all_models()
        models_dict = {}
        for model in self.models_list:
            models_dict[model.name] = model
        self.models = SimpleNamespace(**models_dict)

        print("inside setup")

    @classmethod
    def teardown_class(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.models = None
        print("inside teardown")

    def run_step(self, model):
        # Need to setup simulation first
        run_simulation_inner(self.models_list, [model], 1)

    def test_human_is_alive(self):
        self.run_step(self.models.human)
        assert self.models.human.is_alive == 1

    def test_human_no_atmosphere(self):
        self.models.habitat_atmosphere.o2 = 0
        self.run_step(self.models.human)
        assert self.models.human.is_alive == 0
