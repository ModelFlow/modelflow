import pytest
from model_classes.Human import Human
from modelflow.testing import ModelUnitTest
from modelflow.modelflow import SimulationError


class TestHuman(ModelUnitTest):
    def setup_method(self):
        # This will be called before every test
        self.setup_model(Human(), states=dict(
            atmo_o2=390.11,
            atmo_co2=0.76,
            atmo_n2=1454,
            potable_water=18.625,
            food=100,
            atmo_temp=20,
            atmo_h2o=0,
            urine=0,
            solid_waste=0,
            heat_diff_kwh=0,
        ))

    def test_human_is_alive(self):
        assert self.states.is_alive == 1
        self.run_step()
        assert self.states.is_alive == 1
        assert self.states.urine > 0
        assert self.states.solid_waste > 0
        assert self.states.heat_diff_kwh > 0

    def test_human_no_air(self):
        assert self.states.is_alive == 1
        self.states.atmo_o2 = 0
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_o2_below_limit(self):
        self.states.atmo_o2 = 5
        self.states.atmo_n2 = 95
        self.states.atmo_co2 = 0.001
        self.params.min_survivable_percent_atmo_o2 = 0.08
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_o2_above_limit(self):
        self.states.atmo_o2 = 50
        self.states.atmo_n2 = 50
        self.states.atmo_co2 = 0.001
        self.params.max_survivable_percent_atmo_o2 = 0.25
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_co2_above_limit(self):
        self.states.atmo_o2 = 20
        self.states.atmo_n2 = 80
        self.states.atmo_co2 = 10
        self.params.max_survivable_co2_ppm = 40000
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_above_temp(self):
        self.states.atmo_temp = 1000
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_below_temp(self):
        self.states.atmo_temp = -1000
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_no_water(self):
        self.states.potable_water = 0
        self.params.max_hrs_survivable_with_no_water = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no water
        # hour 2 = no water
        # hour 3 = dead
        for i in range(0, self.params.max_hrs_survivable_with_no_water+1):
            assert self.states.is_alive == 1
            assert self.states.hours_without_water == i
            self.run_step()

        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_no_food(self):
        self.states.food = 0
        self.params.max_hrs_survivable_with_no_food = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no food
        # hour 2 = no food
        # hour 3 = dead
        for i in range(0, self.params.max_hrs_survivable_with_no_food+1):
            assert self.states.is_alive == 1
            assert self.states.hours_without_food == i
            self.run_step()
        
        with pytest.raises(SimulationError):
            self.run_step()

    def test_human_dead(self):
        self.states.is_alive = 0
        self.run_step()
        assert self.states.is_alive == 0
        assert self.states.urine == 0
        assert self.states.solid_waste == 0
        assert self.states.heat_diff_kwh == 0
