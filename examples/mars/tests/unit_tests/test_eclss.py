import sys
sys.path.insert(0, "../..")
from models.eclss import MultifiltrationPurifierPostTreatment
from models.eclss import OxygenGenerationSFWE
from modelflow.modelflow import run_test_step, obj

class TestBasicECLSS:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.converter = MultifiltrationPurifierPostTreatment()
        # TODO: improve this setting of params
        self.converter.params = self.converter._params

        self.inputs = obj(h2o_tret=100, enrg_kwh=100)
        self.outputs = obj(h2o_potb=0, solid_waste=0)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.converter = None
        self.inputs = None
        self.outputs = None

    def run_step(self):
        run_test_step(self.converter, self.inputs, self.outputs)

    def test_converter_works(self):
        self.converter.params.h2o_tret_consumed_per_hour = 10
        self.converter.params.enrg_kwh_consumed_per_hour = 5
        self.converter.params.h2o_potb_output_per_hour = 1
        self.converter.params.solid_waste_output_per_hour = 2

        self.run_step()
        assert self.inputs.h2o_tret == 90
        assert self.inputs.enrg_kwh == 95
        assert self.outputs.h2o_potb == 1
        assert self.outputs.solid_waste == 2

    def test_does_not_run(self):
        self.converter.params.h2o_tret_consumed_per_hour = 10
        self.inputs.h2o_tret = 5
        self.run_step()
        assert self.inputs.h2o_tret == 5
        assert self.outputs.h2o_potb == 0
        assert self.outputs.solid_waste == 0


class TestOxygenGenerationSFWE:
    # TODO: Find a better place to put these fixtures
    def setup_method(self):
        """ setup any state tied to the execution of the given function.
        Invoked for every test function in the module.
        """
        # Defaults
        self.converter = OxygenGenerationSFWE()
        # TODO: improve this setting of params
        self.converter.params = self.converter._params

        self.inputs = obj(h2o_potb=100, enrg_kwh=100, atmo_o2=10, atmo_n2=90, atmo_co2=0)
        self.outputs = obj(atmo_h2=0, atmo_o2=self.inputs.atmo_o2)

    def teardown_method(self):
        """ teardown any state that was previously setup with a setup_function
        call.
        """
        self.converter = None
        self.inputs = None
        self.outputs = None

    def run_step(self):
        run_test_step(self.converter, self.inputs, self.outputs)

    def test_converter_works(self):
        self.converter.params.run_below_atmo_o2_ratio = 0.2
        self.converter.params.atmo_o2_output_per_hour = 5
        self.converter.params.h2o_potb_consumed_per_hour = 10
        self.run_step()
        assert self.inputs.h2o_potb == 90
        assert self.outputs.atmo_o2 == 15

    def test_does_not_run_no_power(self):
        self.converter.params.enrg_kwh_consumed_per_hour = 5
        self.inputs.enrg_kwh = 3
        self.run_step()
        assert self.inputs.h2o_potb == 100
        assert self.outputs.atmo_o2 == 10

    def test_does_not_run_no_water(self):
        self.converter.params.h2o_potb_consumed_per_hour = 5
        self.inputs.h2o_potb = 3
        self.run_step()
        assert self.inputs.h2o_potb == 3
        assert self.outputs.atmo_o2 == 10

    def test_does_not_run_not_needed(self):
        self.inputs.atmo_o2 = 50
        self.converter.params.run_below_atmo_o2_ratio = 0.2
        self.run_step()
        assert self.inputs.h2o_potb == 100
        assert self.outputs.atmo_o2 == 10
