from models.human import Human
from modelflow.testing import ModelUnitTest


class TestHuman(ModelUnitTest):
    def setup_method(self):
        # This will be called before every test
        self.setup_model(Human(), shared_states=dict(
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
        assert self.private_states.is_alive == 1
        self.run_step()
        assert self.private_states.is_alive == 1
        assert self.shared_states.urine > 0
        assert self.shared_states.solid_waste > 0
        assert self.shared_states.heat_diff_kwh > 0

    def test_human_no_air(self):
        assert self.private_states.is_alive == 1
        self.shared_states.atmo_o2 = 0
        self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_o2_below_limit(self):
        self.shared_states.atmo_o2 = 5
        self.shared_states.atmo_n2 = 95
        self.shared_states.atmo_co2 = 0.001
        self.params.min_survivable_percent_atmo_o2 = 0.08
        self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_o2_above_limit(self):
        self.shared_states.atmo_o2 = 50
        self.shared_states.atmo_n2 = 50
        self.shared_states.atmo_co2 = 0.001
        self.params.max_survivable_percent_atmo_o2 = 0.25
        assert self.private_states.is_alive == 1
        self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_co2_above_limit(self):
        self.shared_states.atmo_o2 = 20
        self.shared_states.atmo_n2 = 80
        self.shared_states.atmo_co2 = 10
        self.params.max_survivable_percent_atmo_co2 = 0.01
        self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_above_temp(self):
        self.shared_states.atmo_temp = 1000
        self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_below_temp(self):
        self.shared_states.atmo_temp = -1000
        self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_no_water(self):
        self.shared_states.potable_water = 0
        self.params.max_hrs_survivable_with_no_water = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no water
        # hour 2 = no water
        # hour 3 = dead
        for i in range(0, self.params.max_hrs_survivable_with_no_water+2):
            assert self.private_states.is_alive == 1
            assert self.private_states.hours_without_water == i
            self.run_step()
        assert self.private_states.is_alive == 0

    def test_human_no_food(self):
        self.shared_states.food = 0
        self.params.max_hrs_survivable_with_no_food = 2
        # hour 0 = unknown i.e. t=0
        # hour 1 = no food
        # hour 2 = no food
        # hour 3 = dead
        for i in range(0, self.params.max_hrs_survivable_with_no_food+2):
            assert self.private_states.is_alive == 1
            assert self.private_states.hours_without_food == i
            self.run_step()

        assert self.private_states.is_alive == 0

    def test_human_dead(self):
        self.private_states.is_alive = 0
        self.run_step()
        assert self.private_states.is_alive == 0
        assert self.shared_states.urine == 0
        assert self.shared_states.solid_waste == 0
        assert self.shared_states.heat_diff_kwh == 0
