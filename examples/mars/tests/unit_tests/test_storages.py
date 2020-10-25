import pytest
from models.storages import WaterStorage
from modelflow.testing import ModelUnitTest


class TestStorage(ModelUnitTest):

    def setup_method(self):
        self.setup_model(WaterStorage())

    def test_storage_works(self):
        self.params.max_h2o_potb = 20
        self.states.h2o_potb = 0
        self.run_step()
        assert self.states.h2o_potb == 0
        self.states.h2o_potb = 10
        self.run_step()
        assert self.states.h2o_potb == 10

    def test_storage_exceeds_max(self):
        self.states.h2o_potb = 100
        self.params.max_h2o_potb = 20
        self.run_step()
        assert self.states.h2o_potb == 20

    def test_storage_no_negative(self):
        self.states.h2o_potb = -1
        with pytest.raises(Exception):
            self.run_step()
