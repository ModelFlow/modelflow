# import pytest
# from models.battery import Battery
# from modelflow.testing import ModelUnitTest


# class TestBattery(ModelUnitTest):

#     def setup_method(self):
#         self.setup_model(Battery())
#         self.io.kwh_for_battery = 0
#         self.io.dc_kw = 0


#     def test_negative_input_error(self):
#         self.io.kwh_for_battery = -1
#         with pytest.raises(Exception):
#             self.run_step()


#     def test_negative_state_error(self):
#         self.states.enrg_kwh = -1
#         with pytest.raises(Exception):
#             self.run_step()

#     def test_charge(self):
#         self.states.enrg_kwh = 0
#         self.io.kwh_for_battery = 100
#         self.params.roundtrip_efficiency = .9
#         self.run_step()
#         assert self.states.enrg_kwh == 90

#     def test_discharge(self):
#         # Kinda a trick question because other systems
#         # actually are the ones that pull kwh
#         self.states.enrg_kwh = 90
#         self.run_step()
#         assert self.states.enrg_kwh == 90

# import pytest
# from models.pv_inverter import PVInverter
# from modelflow.testing import ModelUnitTest


# class TestPVInverter(ModelUnitTest):
#     def setup_method(self):
#         self.setup_model(PVInverter())
#         self.io.dc_kwh = 100
#         self.io.kwh_for_battery = 0

#     def test_inverter_works(self):
#         self.params.max_kw_ac = 1000
#         self.params.one_way_efficiency = 0.98
#         self.run_step()
#         assert self.io.kwh_for_battery == 98

#     def test_inverter_clips(self):
#         self.params.max_kw_ac = 50
#         self.params.one_way_efficiency = 0.98
#         self.run_step()
#         assert self.io.kwh_for_battery == 50

#     def test_no_output(self):
#         self.io.dc_kwh = 0
#         self.run_step()
#         assert self.io.kwh_for_battery == 0

#     def test_clipped_output(self):
#         self.io.dc_kwh = 100
#         self.io.max_kw_ac = 50
#         self.run_step()
#         assert self.io.kwh_for_battery == 50

#     def test_inverter_no_negative(self):
#         self.io.dc_kwh = -1
#         with pytest.raises(Exception):
#             self.run_step()
