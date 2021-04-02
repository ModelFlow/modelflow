# import pytest
# from models.storages import WaterStorage
# from modelflow.testing import ModelUnitTest


# class TestStorage(ModelUnitTest):

#     def setup_method(self):
#         self.setup_model(WaterStorage())

#     def test_storage_works(self):
#         self.params.max_potable_water = 20
#         self.states.potable_water = 0
#         self.run_step()
#         assert self.states.potable_water == 0
#         self.states.potable_water = 10
#         self.run_step()
#         assert self.states.potable_water == 10

#     def test_storage_exceeds_max(self):
#         self.states.potable_water = 100
#         self.params.max_potable_water = 20
#         self.run_step()
#         assert self.states.potable_water == 20

#     def test_storage_no_negative(self):
#         self.states.potable_water = -1
#         with pytest.raises(Exception):
#             self.run_step()
