from models.structures import HabitatStructure
from modelflow.testing import ModelUnitTest


class TestStuctures(ModelUnitTest):
    def setup_method(self):
        self.setup_model(HabitatStructure())

        self.io.atmo_o2 = 100
        self.io.atmo_co2 = 0
        self.io.atmo_n2 = 0
        self.io.atmo_ch4 = 0
        self.io.atmo_h2 = 0
        self.io.heat_diff_kwh = 0

    def test_leaks_air(self):
        self.params.leak_rate = 0.01
        self.run_step()
        assert self.io.atmo_o2 == 99

    def test_heat_loss(self):
        self.params.heat_loss_per_hour = 5
        self.run_step()
        assert self.io.heat_diff_kwh == -5
