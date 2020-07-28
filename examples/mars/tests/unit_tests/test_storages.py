import pytest
from examples.mars.models.storages import WaterStorage
from modelflow.modelflow import run_test_step

class TestStorage:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.water_storage = WaterStorage()
        # TODO: improve this setting of params
        self.water_storage.params = self.water_storage._params


    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.water_storage = None

    def run_step(self):
        run_test_step(self.water_storage, None, None)

    def test_storage_works(self):
        self.water_storage.params.max_h2o_potb = 20
        self.water_storage.h2o_potb = 0
        self.run_step()
        assert self.water_storage.h2o_potb == 0
        self.water_storage.h2o_potb = 10
        self.run_step()
        assert self.water_storage.h2o_potb == 10

    def test_storage_exceeds_max(self):
        self.water_storage.h2o_potb = 100
        self.water_storage.params.max_h2o_potb = 20
        self.run_step()
        assert self.water_storage.h2o_potb == 20

    def test_storage_no_negative(self):
        self.water_storage.h2o_potb = -1
        with pytest.raises(Exception):
            self.run_step()

