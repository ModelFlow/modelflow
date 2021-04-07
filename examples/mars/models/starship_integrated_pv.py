
class StarshipIntegratedPV:
    # Ensure that this runs before anything else
    # TODO: Support run priority
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
    def run_step(states, params, utils):

        if utils.has_a_parent_instance_named("interplanetary_space"):
            # This assumes that each simulation timestep is 1 hour
            states.generated_dc_kwh += params.rated_pv_kw_dc_output

        elif utils.has_a_parent_instance_named("mars_surface"):
            # Assuming that we are not using the integrated starship PV on Mars to not degrade it
            states.generated_dc_kwh += params.rated_pv_kw_dc_output / 2
        else:
            raise Exception("Starship Integrated PV has unexpected parent")
     