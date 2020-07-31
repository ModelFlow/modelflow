from modelflow.modelflow import Model, ModelParam

class ConverterModel(Model):

    def should_run_criteria(self, inputs, params):
        # Override to gate running on a criteria
        return True

    def run_step(self, inputs, outputs, params, states):
        should_run = self.should_run_criteria(inputs, params)
        if not should_run:
            return
        # TODO: Consider allowing variable consumption or being explicit
        # in inputs which are hard constraints etc
        for key in self.linked_input_states:
            if getattr(inputs, key) < getattr(params, f'{key}_consumed_per_hour'):
                should_run = False
                break
        if not should_run:
            return

        for key in self.linked_input_states:
            input_state = getattr(inputs, key)
            input_state -= min(input_state, getattr(params, f'{key}_consumed_per_hour'))
            setattr(inputs, key, input_state)

        for key in self.linked_output_states:
            output_state = getattr(outputs, key)
            output_state += getattr(params, f'{key}_output_per_hour')
            setattr(outputs, key, output_state)

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
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_o2_consumed_per_hour",
                units="kg/hr",
                value=0.00045,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.678,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="solid_n_output_per_hour",
                units="kg/hr",
                value=0.002175,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="solid_p_output_per_hour",
                units="kg/hr",
                value=0.000261,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="solid_k_output_per_hour",
                units="kg/hr",
                value=0.000615,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_urin_output_per_hour",
                units="kg/hr",
                value=0.002175,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_co2_output_per_hour",
                units="kg/hr",
                value=0.000261,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_ch4_output_per_hour",
                units="kg/hr",
                value=0.000615,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

class UrineRecyclingProcessor(ConverterModel):
    def setup(self):
        # What does VCD stand for ?!?!?
        self.name = "urine_recycling_processor"
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
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=1.501,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_tret_output_per_hour",
                units="kg/hr",
                value=1.96,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="solid_waste_output_per_hour",
                units="kg/hr",
                value=0.04,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=193.3,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.39,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    # def run_step(self, inputs, outputs, params, states):
        
    #     if inputs.kwh == 0:
    #         print("h2o_urin not running because no energy available")
    #         return

    #     if inputs.h2o_urin < params.h2o_urin_consumed_per_hour:
    #         print("h2o_urin not running below max efficiency")
    #         return

    #     inputs.kwh -= params.kwh_consumed
    #     inputs.h2o_urin -= params.h2o_urin_consumed_per_hour
    #     outputs.h2o_tret += param.h2o_tret_output_per_hour
    #     outputs.solid_waste += param.solid_waste_output_per_hour

class MultifiltrationPurifierPostTreatment(ConverterModel):
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
        ]

        # TODO: Check that the masses are right here
        # they don't seem to add up

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
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=1.501,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_potb_output_per_hour",
                units="kg/hr",
                value=4.75,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=114.6,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.11,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

# TODO: Add moxie O2 from atmosphere

class OxygenFromHydrolysis(ConverterModel):

    def setup(self):
        self.name = "oxygen_from_hydrolysis"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Generates oxygen through electrolysis of water
        """

        self.linked_input_states = [
            "h2o_potb",
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ]

        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        self.soft_linked_input_states = [
            "atmo_n2",
            "atmo_co2",
            "atmo_o2",
        ]

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        self.linked_output_states = [
            "atmo_h2",
            "atmo_o2",
        ]

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_potb_consumed_per_hour",
                units="kg/hr",
                value=0.413,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.959,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_h2_output_per_hour",
                units="kg/hr",
                value=0.0454, # Note: This should not go in atmosphere
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_o2_output_per_hour",
                units="kg/hr",
                value=0.367,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="run_below_atmo_o2_ratio",
                units="kg/hr",
                value=0.195,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=193.3,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.39,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    def should_run_criteria(self, inputs, params):
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        o2_ratio = inputs.atmo_o2 / float(total_atmosphere)
        if o2_ratio < params.run_below_atmo_o2_ratio:
            return True
        return False

class CO2ReductionSabatier(ConverterModel):
    def setup(self):
        # What does SFWE stand for ?!?!?
        self.name = "co2_reduction_sabatier"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Reduces carbon dioxide without requiring venting.
        """

        self.linked_input_states = [
            "atmo_h2",
            "atmo_co2"
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ]

        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        self.soft_linked_input_states = [
            "atmo_n2",
            "atmo_o2",
        ]

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        self.linked_output_states = [
            "atmo_ch4",
            "solid_waste",
        ]

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_h2_consumed_per_hour",
                units="kg/hr",
                value=0.00163,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.291,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_co2_consumed_per_hour",
                units="kg/hr",
                value=0.006534, # Note: This should not go in atmosphere
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_ch4_output_per_hour",
                units="kg/hr",
                value=0.0025,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="solid_waste_output_per_hour",
                units="kg/hr",
                value=0.00567,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                # TODO: Implement buffering logic
                key="run_above_atmo_co2_ratio",
                units="decimal percent",
                value=0.001,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=193.3,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.39,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    def should_run_criteria(self, inputs, params):
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        co2_ratio = inputs.atmo_co2 / float(total_atmosphere)
        if co2_ratio > params.run_above_atmo_co2_ratio:
            return True
        return False

class CO2Removal(ConverterModel):
    def setup(self):
        self.name = "co2_removal"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Vents carbon dioxide from the habitat, removing it from the system.
        """

        self.linked_input_states = [
            "atmo_co2",
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ]

        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        self.soft_linked_input_states = [
            "atmo_n2",
            "atmo_o2",
        ]

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        self.linked_output_states = []

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_co2_consumed_per_hour",
                units="kg/hr",
                value=0.085,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.65,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_co2_ratio",
                units="decimal percent",
                value=0.001,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=137.35,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.31,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    def should_run_criteria(self, inputs, params):
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        co2_ratio = inputs.atmo_co2 / float(total_atmosphere)
        if co2_ratio > params.run_above_atmo_co2_ratio:
            return True
        return False

class ParticulateRemovalTCCS(ConverterModel):
    # What does SAWD stand for
    def setup(self):
        self.name = "particulate_removal_TCCS"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Removes potentially hazardous trace contaminants.
        """

        self.linked_input_states = [
            "atmo_co2"
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ]

        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        self.soft_linked_input_states = [
            "atmo_n2",
            "atmo_o2",
        ]

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        self.linked_output_states = []

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_co2_consumed_per_hour",
                units="kg/hr",
                value=0.085,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.65,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_co2_ratio",
                units="decimal percent",
                value=0.001,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=137.35,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.31,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    def should_run_criteria(self, inputs, params):
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        co2_ratio = inputs.atmo_co2 / float(total_atmosphere)
        if co2_ratio > params.run_above_atmo_co2_ratio:
            return True
        return False

class Dehumidifier(ConverterModel):
    def setup(self):
        self.name = "dehumidifier"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Converts free water vapor into potable water.
        """

        self.linked_input_states = [
            "atmo_h2o"
            "enrg_kwh",
        ]

        self.soft_linked_input_states = [
            "atmo_n2",
            "atmo_o2",
            "atmo_co2",
            "atmo_h2o"
        ]

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        self.linked_output_states = [
            "h2o_tret"
        ]

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_h2o_consumed_per_hour",
                units="kg/hr",
                value=4,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.5,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_tret_output_per_hour",  # Then why not potable if desc says potb?
                units="kwh",
                value=0.5,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_h2o_ratio",
                units="decimal percent",
                value=0.02,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=137.35,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.31,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    def should_run_criteria(self, inputs, params):
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        h2o_ratio = inputs.atmo_h2o / float(total_atmosphere)
        if h2o_ratio > params.run_above_atmo_h2o_ratio:
            return True
        return False

class CH4RemovalAgent(ConverterModel):
    def setup(self):
        self.name = "dehumidifier"
        self.parent = "location" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Vents methane from the habitat, removing it from the system.
        """

        self.linked_input_states = [
            "atmo_ch4"
            "enrg_kwh",
        ]

        self.soft_linked_input_states = [
            "atmo_n2",
            "atmo_o2",
            "atmo_co2",
        ]

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        self.linked_output_states = []

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        self.params = [
            ModelParam(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_ch4_consumed_per_hour",
                units="kg/hr",
                value=0.02,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.2,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_ch4_ratio",
                units="decimal percent",
                value=0.01,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=20,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=0.1,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]

    def should_run_criteria(self, inputs, params):
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        h2o_ratio = inputs.atmo_h2o / float(total_atmosphere)
        if h2o_ratio > params.run_above_atmo_h2o_ratio:
            return True
        return False

class Heater(Model):
    def setup(self):
        self.name = "heater"
        self.parent = "habitat" # TODO: Implement heirarchy
        self.category = "eclss"
        self.description = """
            Heats habitat atmosphere
        """

        self.linked_input_states = [
            "enrg_kwh",
            # NOTE: We can say that atmo_temp can be a hard input
            # because potentially it can affect the efficiency of
            # the heater.
            "atmo_temp"
        ]

        self.linked_output_states = [
            "heat_diff_kwh"
        ]

        self.params = [
            ModelParam(
                key="max_kw_output",
                units="kw",
                value=10,
                source="NONE",
            ),
            ModelParam(
                key="min_kw_output",
                units="kw",
                value=0.5,
                source="NONE",
            ),
            ModelParam(
                key="target_temp",
                units="degrees c",
                value=20,
                source="NONE",
            ),
            ModelParam(
                key="temp_dead_band",
                units="degrees c",
                value=0.3,
                source="NONE",
            ),
            ModelParam(
                key="mass",
                units="kg",
                value=20,
                source="NONE",
            ),
            ModelParam(
                key="volume",
                units="m3",
                value=1,
                source="NONE",
            )
        ]

    def run_step(self, inputs, outputs, params, states):

        # Dumb heater
        # max power if below deadband

        # Smart heater
        # Calculate what KW would be needed to raise
        # temperature between current temp and target temp

        # Don't run if within deadband of target temp or above

        if inputs.atmo_temp < params.target_temp - params.temp_dead_band:
            # TODO: Replace with a smart heating strategy
            outputs.heat_diff_kwh += params.min_kw_output


