# class ConverterModel(Model):

#     def should_run_criteria(self, inputs, params):
#         # Override to gate running on a criteria
#         return True

#     def run_step(self, inputs, outputs, params, states):
#         should_run = "should_run_criteria(inputs, params)
#         if not should_run:
#             return
#         # TODO: Consider allowing variable consumption or being explicit
#         # in inputs which are hard constraints etc
#         for key in "linked_input_states:
#             if getattr(inputs, key) < getattr(params, f'{key}_consumed_per_hour'):
#                 should_run = False
#                 break
#         if not should_run:
#             return

#         for key in "linked_input_states:
#             input_state = getattr(inputs, key)
#             input_state -= min(input_state, getattr(params, f'{key}_consumed_per_hour'))
#             setattr(inputs, key, input_state)

#         for key in "linked_output_states:
#             output_state = getattr(outputs, key)
#             output_state += getattr(params, f'{key}_output_per_hour')
#             setattr(outputs, key, output_state)

class SolidWasteAerobicBioReactor:
    definition = {
        "name": "h2o_waste_aerobic_bioreactor",
        "parent": "location",
        "category": "eclss",
        "scale_max": 10,
        "description": """
            First stage recovery of wastewater
            using microbial degradation.
            Isolates nutrients from urine.""",
        "linked_input_states": [
            "h2o_waste",  # This naming is confusing
            "atmo_o2",
            "enrg_kwh",
        ],
        "linked_output_states": [
            "atmo_co2",
            "atmo_h2o",
            "h2o_urin",  # This naming is confusing
            "solid_n",
            "solid_p",
            "solid_k",
            "atmo_ch4",
        ],
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_waste_consumed_per_hour",
                units="kg/hr",
                value=1.5,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_o2_consumed_per_hour",
                units="kg/hr",
                value=0.00045,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.678,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="solid_n_output_per_hour",
                units="kg/hr",
                value=0.002175,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="solid_p_output_per_hour",
                units="kg/hr",
                value=0.000261,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="solid_k_output_per_hour",
                units="kg/hr",
                value=0.000615,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_urin_output_per_hour",
                units="kg/hr",
                value=0.002175,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_co2_output_per_hour",
                units="kg/hr",
                value=0.000261,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_ch4_output_per_hour",
                units="kg/hr",
                value=0.000615,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=100,
                source="FAKE"
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):

        if inputs.h2o_waste < params.h2o_waste_consumed_per_hour:
            return
        if inputs.atmo_o2 < params.atmo_o2_consumed_per_hour:
            return
        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.h2o_waste -= min(inputs.h2o_waste, params.h2o_waste_consumed_per_hour)
        inputs.atmo_o2 -= min(inputs.atmo_o2, params.atmo_o2_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)

        outputs.atmo_co2 += params.atmo_co2_output_per_hour
        outputs.atmo_h2o += params.atmo_h2o_output_per_hour
        outputs.h2o_urin += params.h2o_urin_output_per_hour
        outputs.solid_n += params.solid_n_output_per_hour
        outputs.solid_p += params.solid_p_output_per_hour
        outputs.solid_k += params.solid_k_output_per_hour
        outputs.atmo_ch4 += params.atmo_ch4_output_per_hour


class UrineRecyclingProcessor:
    definition = {
        # What does VCD stand for ?!?!?
        "name": "urine_recycling_processor",
        "parent": "location", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            First stage recovery of urine, 
            both that captured directly and as 
            isolated from wastewater.""",
        "linked_input_states": [
            "h2o_urin",
            "enrg_kwh",
        ],
        "linked_output_states": [
            "h2o_tret",
            "solid_waste",
        ],
        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_urin_consumed_per_hour",
                units="kg/hr",
                value=2,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=1.501,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_tret_output_per_hour",
                units="kg/hr",
                value=1.96,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="solid_waste_output_per_hour",
                units="kg/hr",
                value=0.04,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=193.3,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.39,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):        
        if inputs.h2o_urin < params.h2o_urin_consumed_per_hour:
            return
        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.h2o_urin -= min(inputs.h2o_urin, params.h2o_urin_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)

        outputs.h2o_tret += params.h2o_tret_output_per_hour
        outputs.solid_waste += params.solid_waste_output_per_hour


class MultifiltrationPurifierPostTreatment:
    definition = {
        "name": "multifiltration_purifier_post_treatment",
        "parent": "location", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            First stage recovery of urine, 
            both that captured directly and as 
            isolated from wastewater.""",
        "linked_input_states": [
            "h2o_tret",
            "enrg_kwh",
        ],
        "linked_output_states": [
            "h2o_potb",
        ],

        # TODO: Check that the masses are right here
        # they don't seem to add up

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_tret_consumed_per_hour",
                units="kg/hr",
                value=4.75,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=1.501,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_potb_output_per_hour",
                units="kg/hr",
                value=4.75,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=114.6,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.11,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):        
        if inputs.h2o_tret < params.h2o_tret_consumed_per_hour:
            return
        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.h2o_tret -= min(inputs.h2o_tret, params.h2o_tret_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)

        outputs.h2o_potb += params.h2o_potb_output_per_hour



# TODO: Add moxie O2 from atmosphere

class OxygenFromHydrolysis:

    definition = {
        "name": "oxygen_from_hydrolysis",
        "parent": "location",  # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            Generates oxygen through electrolysis of water
        """,
        "linked_input_states": [
            "h2o_potb",
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ],

        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        "soft_linked_input_states": [
            "atmo_n2",
            "atmo_co2",
            "atmo_o2",
        ],

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        "linked_output_states": [
            "atmo_h2",
            "atmo_o2",
        ],

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="h2o_potb_consumed_per_hour",
                units="kg/hr",
                value=0.413,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.959,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_h2_output_per_hour",
                units="kg/hr",
                value=0.0454, # Note: This should not go in atmosphere
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_o2_output_per_hour",
                units="kg/hr",
                value=0.367,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="run_below_atmo_o2_ratio",
                units="kg/hr",
                value=0.195,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=193.3,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.39,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):  

        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        o2_ratio = inputs.atmo_o2 / float(total_atmosphere)
        if o2_ratio >= params.run_below_atmo_o2_ratio:
            return

        if inputs.h2o_potb < params.h2o_potb_consumed_per_hour:
            return

        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.h2o_potb -= min(inputs.h2o_potb, params.h2o_potb_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)

        outputs.atmo_h2 += params.atmo_h2_output_per_hour
        outputs.atmo_o2 += params.atmo_o2_output_per_hour


class CO2ReductionSabatier:
    definition = {
        # What does SFWE stand for ?!?!?
        "name": "co2_reduction_sabatier",
        "parent": "location", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            Reduces carbon dioxide without requiring venting.
        """,
        "linked_input_states": [
            "atmo_h2",
            "atmo_co2"
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ],
        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        "soft_linked_input_states": [
            "atmo_n2",
            "atmo_o2",
        ],

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        "linked_output_states": [
            "atmo_ch4",
            "solid_waste",
        ],

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_h2_consumed_per_hour",
                units="kg/hr",
                value=0.00163,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.291,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_co2_consumed_per_hour",
                units="kg/hr",
                value=0.006534, # Note: This should not go in atmosphere
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_ch4_output_per_hour",
                units="kg/hr",
                value=0.0025,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="solid_waste_output_per_hour",
                units="kg/hr",
                value=0.00567,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                # TODO: Implement buffering logic
                key="run_above_atmo_co2_ratio",
                units="decimal percent",
                value=0.001,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=193.3,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.39,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):  

        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        co2_ratio = inputs.atmo_co2 / float(total_atmosphere)
        if co2_ratio <= params.run_above_atmo_co2_ratio:
            return False

        if inputs.atmo_h2 < params.atmo_h2_consumed_per_hour:
            return

        if inputs.atmo_co2 < params.atmo_co2_consumed_per_hour:
            return

        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.atmo_h2 -= min(inputs.atmo_h2, params.h2o_potb_consumed_per_hour)
        inputs.atmo_co2 -= min(inputs.atmo_co2, params.atmo_co2_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)

        outputs.atmo_ch4 += params.atmo_ch4_output_per_hour
        outputs.solid_waste += params.solid_waste_output_per_hour


class CO2Removal:
    definition = {
        "name": "co2_removal",
        "parent": "location", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            Vents carbon dioxide from the habitat, removing it from the system.
        """,
        "linked_input_states": [
            "atmo_co2",
            "enrg_kwh",

            # TODO: We may want a way of denoting that
            # these are not actual input resources, but
            # just used for control to know when to turn
            # things on. (And get O2 ratio)
            # TODO: Should atmo_h2o be included?
        ],

        # These are inputs that may only be used for
        # decision making or calculation so to avoid
        # confusion are deliniated here
        #
        # I kinda don't like this, but I think it makes sense
        "soft_linked_input_states": [
            "atmo_n2",
            "atmo_o2",
        ],

        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        "linked_output_states": [],

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_co2_consumed_per_hour",
                units="kg/hr",
                value=0.085,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.65,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_co2_ratio",
                units="decimal percent",
                value=0.001,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=137.35,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.31,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):  
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        co2_ratio = inputs.atmo_co2 / float(total_atmosphere)
        if co2_ratio <= params.run_above_atmo_co2_ratio:
            return

        if inputs.atmo_co2 < params.atmo_co2_consumed_per_hour:
            return

        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.atmo_co2 -= min(inputs.atmo_co2, params.atmo_co2_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)

        # TODO: Where does the output go


class ParticulateRemovalTCCS:
    # TODO
    definition = {
        "name": "particulate_removal_TCCS",   
    }


class Dehumidifier:
    definition = {
        "name": "dehumidifier",
        "parent": "location", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            Converts free water vapor into potable water.
        """,
        "linked_input_states": [
            "atmo_h2o"
            "enrg_kwh",
        ],
        "soft_linked_input_states": [
            "atmo_n2",
            "atmo_o2",
            "atmo_co2",
            "atmo_h2o"
        ],
        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        "linked_output_states": [
            "h2o_tret"
        ],

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_h2o_consumed_per_hour",
                units="kg/hr",
                value=4,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.5,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_tret_output_per_hour",  # Then why not potable if desc says potb?
                units="kwh",
                value=0.5,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_h2o_ratio",
                units="decimal percent",
                value=0.02,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=137.35,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.31,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data):  
        total_atmosphere = inputs.atmo_o2 + inputs.atmo_n2 + inputs.atmo_co2
        h2o_ratio = inputs.atmo_h2o / float(total_atmosphere)
        if h2o_ratio <= params.run_above_atmo_h2o_ratio:
            return

        if inputs.atmo_h2o < params.atmo_h2o_consumed_per_hour:
            return

        if inputs.enrg_kwh < params.enrg_kwh_consumed_per_hour:
            return

        inputs.atmo_h2o -= min(inputs.atmo_h2o, params.atmo_h2o_consumed_per_hour)
        inputs.enrg_kwh -= min(inputs.enrg_kwh, params.enrg_kwh_consumed_per_hour)
        outputs.h2o_tret += params.h2o_tret_output_per_hour


class CH4RemovalAgent:
    definition = {
        "name": "dehumidifier",
        "parent": "location", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            Vents methane from the habitat, removing it from the system.
        """,
        "linked_input_states": [
            "atmo_ch4"
            "enrg_kwh",
        ],
        "soft_linked_input_states": [
            "atmo_n2",
            "atmo_o2",
            "atmo_co2",
        ],
        # TODO: This h2 would probably never be
        # vented in the habitat atmosphere.
        # Should be directly vented into mars or
        # stored for other uses.
        "linked_output_states": [],

        # TODO: Think about how to handle if less than
        # specified. Ex: if there is only 1kg urine do you wait
        # until there is 2 or run at a degraded rate
        "params": [
            dict(
                # NOTE: Super confusing that it says solid waste
                # but then it is h2o waste that is output from human
                key="atmo_ch4_consumed_per_hour",
                units="kg/hr",
                value=0.02,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="enrg_kwh_consumed_per_hour",
                units="kwh",
                value=0.2,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                # TODO: Implement buffering logic
                # buffer 8 ?
                key="run_above_atmo_ch4_ratio",
                units="decimal percent",
                value=0.01,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="mass",
                units="kg",
                value=20,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="volume",
                units="m3",
                value=0.1,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            )
        ]
    }
    # TODO: Implement CH4


class Heater:
    definition = {
        "name": "heater",
        "parent": "habitat", # TODO: Implement heirarchy
        "category": "eclss",
        "description": """
            Heats habitat atmosphere
        """,
        "linked_input_states": [
            "enrg_kwh",
            # NOTE: We can say that atmo_temp can be a hard input
            # because potentially it can affect the efficiency of
            # the heater.
            "atmo_temp"
        ],
        "linked_output_states": [
            "heat_diff_kwh"
        ],
        "params": [
            dict(
                key="max_kw_output",
                units="kw",
                value=10,
                source="NONE",
            ),
            dict(
                key="min_kw_output",
                units="kw",
                value=0.5,
                source="NONE",
            ),
            dict(
                key="target_temp",
                units="degrees c",
                value=20,
                source="NONE",
            ),
            dict(
                key="temp_dead_band",
                units="degrees c",
                value=0.3,
                source="NONE",
            ),
            dict(
                key="mass",
                units="kg",
                value=20,
                source="FAKE",
            ),
            dict(
                key="volume",
                units="m3",
                value=1,
                source="NONE",
            )
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass

    @staticmethod
    def run_step(inputs, outputs, params, states, data): 
        # Dumb heater
        # max power if below deadband

        # Smart heater
        # Calculate what KW would be needed to raise
        # temperature between current temp and target temp

        # Don't run if within deadband of target temp or above

        if inputs.atmo_temp < params.target_temp - params.temp_dead_band:
            # TODO: Replace with a smart heating strategy
            outputs.heat_diff_kwh += params.min_kw_output


