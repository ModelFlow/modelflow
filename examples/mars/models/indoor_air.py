# TODO: Note we need to differentiate between the living space atmosphere and stored gases

class IndoorAir:

    # Note: Extremely high level calculations could be made like
    # divide intake by total amount.

    definition = {
        # TODO: Apply to both greenhouse and human habitat seprately
        "name": "indoor_air",
        "params": [
            dict(
                key="specific_heat_of_air",
                units="KJ/kgC",
                value=1.05
            ),
            dict(
                key="scale",
                units="multiplier",
                value=1,
                min=0,
                max=10
            )
        ],
        "states": [
            dict(
                key="atmo_co2",
                units="kg",
                value=0.7698085
            ),
            dict(
                key="atmo_o2",
                units="kg",
                value=390.11925
            ),
            dict(
                key="atmo_n2",
                units="kg",
                value=1454.3145
            ),
            dict(
                key="atmo_h2o",  # water vapor
                units="kg",
                value=18.625
            ),
            dict(
                key="atmo_ch4",
                units="kg",
                value=0.003482875
            ),
            dict(
                key="atmo_h2",  
                units="kg",
                value=0.001024375
            ),
            dict(
                key="heat_diff_kwh", 
                description="The net of heat kwh added in each timestep by humans, lost by habitat, or added by heaters etc.", 
                units="kwh",
                value=0
            ),
            dict(
                key="atmo_temp",  
                units="c",
                value=20
            )
        ]
        # TODO: Concept of calculated states. Ex: concentration of co2
        # TODO: Handle case for like initial sizing based on size of habitat
    }

    @staticmethod
    def setup(params, states):
        states.atmo_o2 *= params.scale
        states.atmo_co2 *= params.scale
        states.atmo_n2 *= params.scale
        states.atmo_h2o *= params.scale
        states.atmo_ch4 *= params.scale
        states.atmo_h2 *= params.scale

    @staticmethod
    def cost(params, states):
        return states.atmo_o2 + states.atmo_co2 + states.atmo_n2 + states.atmo_h2o + states.atmo_ch4 + states.atmo_h2

    @staticmethod
    def run_step(io, params, states, data):
        # TODO: Create a more accurate model that varies specific heat of air based on temperature, moisture
        mass_of_air = states.atmo_co2 + states.atmo_o2 + states.atmo_n2 + states.atmo_ch4
        KJ_required_to_heat_1_deg_c = mass_of_air * params.specific_heat_of_air
        kwh_required_to_heat_1_deg_c = KJ_required_to_heat_1_deg_c / 3600
        temp_diff = kwh_required_to_heat_1_deg_c * states.heat_diff_kwh
        states.atmo_temp += temp_diff
        states.heat_diff_kwh = 0 # Reset this every step

        max_val = 10000
        if states.atmo_o2 > max_val:
            states.atmo_o2 = max_val
        if states.atmo_co2 > max_val:
            states.atmo_co2 = max_val        
        if states.atmo_n2 > max_val:
            states.atmo_n2 = max_val        
        if states.atmo_h2o > max_val:
            states.atmo_h2o = max_val        
        if states.atmo_ch4 > max_val:
            states.atmo_ch4 = max_val
        if states.atmo_h2 > max_val:
            states.atmo_h2 = max_val

        if states.atmo_o2 < 0:
            states.atmo_o2 = 0
        if states.atmo_co2 < 0:
            states.atmo_co2 = 0        
        if states.atmo_n2 < 0:
            states.atmo_n2 = 0        
        if states.atmo_h2o < 0:
            states.atmo_h2o = 0        
        if states.atmo_ch4 < 0:
            states.atmo_ch4 = 0
        if states.atmo_h2 < 0:
            states.atmo_h2 = 0

