from models.humans import Human
from modelflow.testing import ModelUnitTest


class TestHumans(ModelUnitTest):

    def setup_method(self):
        self.setup_model(Human())
        self.io.atmo_o2 = 390.11
        self.io.atmo_co2 = 0.76
        self.io.atmo_n2 = 1454
        self.io.h2o_potb = 18.625
        self.io.food_edbl = 100
        self.io.atmo_temp = 20
        self.io.atmo_h2o = 0
        self.io.h2o_urin = 0
        self.io.h2o_waste = 0
        self.io.heat_diff_kwh = 0

    def test_human_is_alive(self):
        assert self.states.is_alive == 1
        self.run_step()
        assert self.states.is_alive == 1
        assert self.io.h2o_urin > 0
        assert self.io.h2o_waste > 0
        assert self.io.heat_diff_kwh > 0

    def test_human_no_air(self):
        assert self.states.is_alive == 1
        self.io.atmo_o2 = 0
        self.run_step()
        assert self.states.is_alive == 0

    def test_human_o2_below_limit(self):
        self.io.atmo_o2 = 5
        self.io.atmo_n2 = 95
        self.io.atmo_co2 = 0.001
        self.params.min_survivable_percent_atmo_o2 = 0.08
        self.run_step()
        assert self.states.is_alive == 0

    def test_human_o2_above_limit(self):
        self.io.atmo_o2 = 50
        self.io.atmo_n2 = 50
        self.io.atmo_co2 = 0.001
        self.params.max_survivable_percent_atmo_o2 = 0.25
        assert self.states.is_alive == 1
        self.run_step()
        assert self.states.is_alive == 0

    def test_human_co2_above_limit(self):
        self.io.atmo_o2 = 20
        self.io.atmo_n2 = 80
        self.io.atmo_co2 = 10
        self.params.max_survivable_percent_atmo_co2 = 0.01
        self.run_step()
        assert self.states.is_alive == 0

    def test_human_above_temp(self):
        self.io.atmo_temp = 1000
        self.run_step()
        assert self.states.is_alive == 0

    def test_human_below_temp(self):
        self.io.atmo_temp = -1000
        self.run_step()
        assert self.states.is_alive == 0

    def test_human_no_water(self):
        self.io.h2o_potb = 0
        self.params.max_hrs_survivable_with_no_water = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no water
        # hour 2 = no water
        # hour 3 = dead
        for i in range(0, self.params.max_hrs_survivable_with_no_water+2):
            assert self.states.is_alive == 1
            assert self.states.hours_without_water == i
            self.run_step()
        assert self.states.is_alive == 0

    def test_human_no_food(self):
        self.io.food_edbl = 0
        self.params.max_hrs_survivable_with_no_food = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no food
        # hour 2 = no food
        # hour 3 = dead
        for i in range(0, self.params.max_hrs_survivable_with_no_food+2):
            assert self.states.is_alive == 1
            assert self.states.hours_without_food == i
            self.run_step()

        assert self.states.is_alive == 0

    def test_human_dead(self):
        self.states.is_alive = 0
        self.run_step()
        assert self.states.is_alive == 0
        assert self.io.h2o_urin == 0
        assert self.io.h2o_waste == 0
        assert self.io.heat_diff_kwh == 0
