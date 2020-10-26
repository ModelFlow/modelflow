from models.pv import SolarArray
from modelflow.testing import ModelUnitTest


class TestPV(ModelUnitTest):
    def setup_method(self):
        pv = SolarArray()
        self.setup_model(pv)
        self.data = pv.load_data()
        self.io.dc_kw = 0

    def test_first_output(self):
        self.run_step()
        assert self.io.dc_kw == self.data[0]

    # TODO: Add tests that test data loading
