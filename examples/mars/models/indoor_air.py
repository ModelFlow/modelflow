from modelflow.modelflow import Model, ModelParam, ModelState


class IndoorAir(Model):

    def setup(self):
        # TODO: Apply to both greenhouse and human habitat seprately
        self.name = "indoor_air"

        self.params = [
            ModelParam(
                key="specific_heat_of_air",
                units="KJ/kgC",
                value=1.05
            )
        ]

        self.states = [
            ModelState(
                key="atmo_co2",
                units="kg",
                value=0.7698085
            ),
            ModelState(
                key="atmo_o2",
                units="kg",
                value=390.11925
            ),
            ModelState(
                key="atmo_n2",
                units="kg",
                value=1454.3145
            ),
            ModelState(
                key="atmo_h2o",  # water vapor
                units="kg",
                value=18.625
            ),
            ModelState(
                key="atmo_ch4",
                units="kg",
                value=0.003482875
            ),
            ModelState(
                key="atmo_h2",  
                units="kg",
                value=0.001024375
            ),
            ModelState(
                key="heat_diff_kwh", 
                description="The net of heat kwh added in each timestep by humans, lost by habitat, or added by heaters etc.", 
                units="kwh",
                value=0
            ),
            ModelState(
                key="atmo_temp",  
                units="c",
                value=20
            )
        ]

        # TODO: Concept of calculated states. Ex: concentration of co2
        # TODO: Handle case for like initial sizing based on size of habitat

    def run_step(self, inputs, outputs, params, states):
        # TODO: Create a more accurate model that varies specific heat of air based on temperature, moisture
        mass_of_air = states.atmo_co2 + states.atmo_o2 + states.atmo_n2 + states.atmo_ch4
        KJ_required_to_heat_1_deg_c = mass_of_air * params.specific_heat_of_air
        kwh_required_to_heat_1_deg_c = KJ_required_to_heat_1_deg_c / 3600
        temp_diff = kwh_required_to_heat_1_deg_c * states.heat_diff_kwh
        states.atmo_temp += temp_diff
        states.heat_diff_kwh = 0 # Reset this every step

        max_dict = dict(atmo_o2=10000, atmo_co2=10000, atmo_n2=10000,
                    atmo_h2o=10000, atmo_ch4=10000, atmo_h2=10000)
        for key, maximum in max_dict.items():
            value = getattr(states, key)
            if value > maximum:
                print(f"Hit maximum {key} limit")
                setattr(states, key, value)
            if value < 0:
                raise Exception(f"{key} went negative")


