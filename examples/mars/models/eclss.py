from modelflow.modelflow import Model, ModelParam, ModelState

class ConverterModel(Model):

    def run_step():
        should_run = self.should_run_criteria()
        if not should_run:
            return
        for input_store, input_rate in inputs:
            if input_store < input_rate:
                should_run = False
        if not should_run:
            return

        for input_store, input_rate in inputs:
            input_store -= input_rate

        for output_store, output_rate in outputs:
            output_store += output_rate


class SolidWasteAerobicBioReactor(ConverterModel):
    def setup(self):
        self.name = "h2o_waste_aerobic_bioreactor"
        self.parent = "location"
        self.category = "eclss"
        self.description = """
            First stage recovery of wastewater,
            using microbial degradation.
            Isolates nutrients from urine."""

        self.linked_input_states = [
            "h2o_waste",  # This naming is confusing
            "atmo_o2",
            "enrg_kwh",
        ]

        self.linked_output_states = [
            "atmo_co2",
            "atmo_h2o",
            "h2o_urin",  # This naming is confusing
            "solid_n",
            "solid_p",
            "solid_k",
            "atmo_ch4",
        ]

        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_waste_consumed_per_hour",
                units="kg/hr",
                value=1.5,
                source="simoc",
            ),
            ModelParam(
                key="atmo_o2_consumed_per_hour",
                units="kg/hr",
                value=0.00045,
                source="simoc",
            ),
            ModelParam(
                key="kwh_consumed",
                units="kwh",
                value=0.678,
                source="simoc",
            ),
            ModelParam(
                key="solid_n_output_per_hour",
                units="kg/hr",
                value=0.002175,
                source="simoc",
            ),
            ModelParam(
                key="solid_p_output_per_hour",
                units="kg/hr",
                value=0.000261,
                source="simoc",
            ),
            ModelParam(
                key="solid_k_output_per_hour",
                units="kg/hr",
                value=0.000615,
                source="simoc",
            )
            ModelParam(
                key="h2o_urin_output_per_hour",
                units="kg/hr",
                value=0.002175,
                source="simoc",
            ),
            ModelParam(
                key="atmo_co2_output_per_hour",
                units="kg/hr",
                value=0.000261,
                source="simoc",
            ),
            ModelParam(
                key="atmo_ch4_output_per_hour",
                units="kg/hr",
                value=0.000615,
                source="simoc",
            )
        ]

    def run_step(self, inputs, outputs, params, states):
        if inputs.kwh == 0:
            print("h2o_waste_aerobic_bioreactor not running because no energy available")
            return

        if inputs.h2o_waste < params.h2o_waste_consumed_per_hour:
            print("h2o_waste_aerobic_bioreactor not running because below max")
            # TODO: Handle things like negative effect of reactor not having food.
            # ex would this cause everything to fail or need to be reset?
            return

        if inputs.atmo_o2 < params.atmo_o2_consumed_per_hour:
            print("h2o_waste_aerobic_bioreactor not running because below o2 max")
            return

        inputs.kwh -= params.kwh_consumed
        inputs.atmo_o2 -= params.atmo_o2_consumed_per_hour
        inputs.h2o_waste -= params.h2o_waste_consumed_per_hour
        outputs.solid_n += param.solid_n_output_per_hour
        outputs.solid_p += param.solid_p_output_per_hour
        outputs.solid_k += param.solid_k_output_per_hour
        outputs.h2o_urin += param.h2o_urin_output_per_hour
        outputs.atmo_co2 += param.atmo_co2_output_per_hour
        outputs.atmo_ch4 += param.atmo_ch4_output_per_hour


class UrineRecyclingProcessorVCD(Model):
    def setup(self):
        # What does VCD stand for ?!?!?
        self.name = "urine_recycling_processor_VCD"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            First stage recovery of urine, 
            both that captured directly and as 
            isolated from wastewater."""

        self.linked_input_states = [
            "h2o_urin",
            "enrg_kwh",
        ]

        self.linked_output_states = [
            "h2o_tret",
            "solid_waste",
        ]

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_urin_consumed_per_hour",
                units="kg/hr",
                value=2,
                source="simoc",
            ),
            ModelParam(
                key="kwh_consumed",
                units="kwh",
                value=1.501,
                source="simoc",
            ),
            ModelParam(
                key="h2o_tret_output_per_hour",
                units="kg/hr",
                value=1.96,
                source="simoc",
            ),
            ModelParam(
                key="solid_waste_output_per_hour",
                units="kg/hr",
                value=0.04,
                source="simoc",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=193.3,
                source="simoc",
            )
            ModelParam(
                key="volume",
                units="m3",
                value=0.39,
                source="simoc",
            )
        ]

    def run_step(self, inputs, outputs, params, states):
        
        if inputs.kwh == 0:
            print("h2o_urin not running because no energy available")
            return

        if inputs.h2o_urin < params.h2o_urin_consumed_per_hour:
            print("h2o_urin not running below max efficiency")
            return

        inputs.kwh -= params.kwh_consumed
        inputs.h2o_urin -= params.h2o_urin_consumed_per_hour
        outputs.h2o_tret += param.h2o_tret_output_per_hour
        outputs.solid_waste += param.solid_waste_output_per_hour


class MultifiltrationPurifierPostTreatment(Model):
    def setup(self):
        # What does VCD stand for ?!?!?
        self.name = "multifiltration_purifier_post_treatment"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            First stage recovery of urine, 
            both that captured directly and as 
            isolated from wastewater."""

        self.linked_input_states = [
            "h2o_tret",
            "enrg_kwh",
        ]

        self.linked_output_states = [
            "h2o_potb",
            "solid_waste",
        ]

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_tret_consumed_per_hour",
                units="kg/hr",
                value=4.75,
                source="simoc",
            ),
            ModelParam(
                key="kwh_consumed",
                units="kwh",
                value=1.501,
                source="simoc",
            ),
            ModelParam(
                key="h2o_tret_output_per_hour",
                units="kg/hr",
                value=1.96,
                source="simoc",
            ),
            ModelParam(
                key="solid_waste_output_per_hour",
                units="kg/hr",
                value=0.04,
                source="simoc",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=193.3,
                source="simoc",
            )
            ModelParam(
                key="volume",
                units="m3",
                value=0.39,
                source="simoc",
            )
        ]

    def run_step(self, inputs, outputs, params, states):
        
        if inputs.kwh == 0:
            print("h2o_urin not running because no energy available")
            return

        if inputs.h2o_urin < params.h2o_urin_consumed_per_hour:
            print("h2o_urin not running because h2o_urin below operating max")
            return

        inputs.kwh -= params.kwh_consumed
        inputs.h2o_urin -= params.h2o_urin_consumed_per_hour
        outputs.h2o_tret += param.h2o_tret_output_per_hour
        outputs.solid_waste += param.solid_waste_output_per_hour
       