# import pytest
# from models.indoor_air import IndoorAir
# from modelflow.testing import ModelUnitTest


# class TestIndoorAir(ModelUnitTest):
#     def setup_method(self):
#         self.setup_model(IndoorAir())

#     def test_heat_raises_temp(self):
#         assert self.states.atmo_temp == 20
#         self.states.heat_diff_kwh = 10
#         self.run_step()
#         assert self.states.atmo_temp > 20
#         assert self.states.heat_diff_kwh == 0

#     def test_storage_exceeds_max(self):
#         # TODO: Don't let atmosphere get this high and account for
#         # overpressue events
#         self.states.atmo_o2 = 10001
#         self.run_step()
#         assert self.states.atmo_o2 == 10000

#     def test_storage_no_negative(self):
#         self.states.atmo_o2 = -1
#         self.run_step()
#         assert self.states.atmo_o2 == 0
