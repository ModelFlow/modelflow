
class StarshipPV:
    # Ensure that this runs before anything else
    run_priority = 0
    name = "Starship Solar Panels"
    params = [
        dict(
            key="rated_pv_kw_dc_output",
            notes="This should eventually be a state that is tied to location of starship",
            units="kw",
            value=200,
            source="FAKE",
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        if utils.has_parent_instance_named("interplanetary_space"):
            # This assumes that each simulation timestep is 1 hour
            shared_states.dc_kwh_available += params.rated_pv_kw_dc_output

        elif utils.has_parent_instance_named("mars_surface"):
            # Assuming that we are not using the integrated starship PV on Mars to not degrade it
            shared_states.dc_kwh_available += 0
        else:
            raise Exception("Starship Integrated PV has unexpected parent")

        # TODO: Have something like if parent is outer space than have constant power output
        # else: switch to mars power model