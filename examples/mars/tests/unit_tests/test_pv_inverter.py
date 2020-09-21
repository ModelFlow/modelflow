import pytest
from models.pv_inverter import PVInverter
from modelflow.modelflow import ModelUnitTest


class TestPVInverter(ModelUnitTest):
    def setup_method(self):
        self.setup_model(PVInverter())
        self.io.dc_kwh = 100
        self.io.kwh_for_battery = 0

    def test_inverter_works(self):
        self.params.max_kw_ac = 1000
        self.params.one_way_efficiency = 0.98
        self.run_step()
        assert self.io.kwh_for_battery == 98

    def test_inverter_clips(self):
        self.params.max_kw_ac = 50
        self.params.one_way_efficiency = 0.98
        self.run_step()
        assert self.io.kwh_for_battery == 50

    def test_no_output(self):
        self.io.dc_kwh = 0
        self.run_step()
        assert self.io.kwh_for_battery == 0

    def test_clipped_output(self):
        self.io.dc_kwh = 100
        self.io.max_kw_ac = 50
        self.run_step()
        assert self.io.kwh_for_battery == 50

    def test_inverter_no_negative(self):
        self.io.dc_kwh = -1
        with pytest.raises(Exception):
            self.run_step()
