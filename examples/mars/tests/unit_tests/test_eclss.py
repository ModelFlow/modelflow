from models.eclss import MultifiltrationPurifierPostTreatment
from models.eclss import OxygenFromHydrolysis
from modelflow.testing import ModelUnitTest


class TestBasicECLSS(ModelUnitTest):

    def setup_method(self):
        self.setup_model(MultifiltrationPurifierPostTreatment())
        self.io.h2o_tret = 100
        self.io.enrg_kwh = 100
        self.io.h2o_potb = 0

    def test_converter_works(self):
        self.params.h2o_tret_consumed_per_hour = 10
        self.params.enrg_kwh_consumed_per_hour = 5
        self.params.h2o_potb_output_per_hour = 1
        self.params.solid_waste_output_per_hour = 2

        self.run_step()
        assert self.io.h2o_tret == 90
        assert self.io.enrg_kwh == 95
        assert self.io.h2o_potb == 1

    def test_does_not_run(self):
        self.params.h2o_tret_consumed_per_hour = 10
        self.io.h2o_tret = 5
        self.run_step()
        assert self.io.h2o_tret == 5
        assert self.io.h2o_potb == 0


class TestOxygenFromHydrolysis(ModelUnitTest):

    def setup_method(self):
        self.setup_model(OxygenFromHydrolysis())
        self.io.h2o_potb = 100
        self.io.enrg_kwh = 100
        self.io.atmo_o2 = 10
        self.io.atmo_n2 = 90
        self.io.atmo_co2 = 0
        self.io.atmo_h2 = 0

    def test_converter_works(self):
        self.params.run_below_atmo_o2_ratio = 0.2
        self.params.atmo_o2_output_per_hour = 5
        self.params.h2o_potb_consumed_per_hour = 10
        self.run_step()
        assert self.io.h2o_potb == 90
        assert self.io.atmo_o2 == 15

    def test_does_not_run_no_power(self):
        self.params.enrg_kwh_consumed_per_hour = 5
        self.io.enrg_kwh = 3
        self.run_step()
        assert self.io.h2o_potb == 100
        assert self.io.atmo_o2 == 10

    def test_does_not_run_no_water(self):
        self.params.h2o_potb_consumed_per_hour = 5
        self.io.h2o_potb = 3
        self.run_step()
        assert self.io.h2o_potb == 3
        assert self.io.atmo_o2 == 10

    def test_does_not_run_not_needed(self):
        self.io.atmo_o2 = 50
        self.params.run_below_atmo_o2_ratio = 0.2
        self.run_step()
        assert self.io.h2o_potb == 100
        assert self.io.atmo_o2 == 50
