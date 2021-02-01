class Starship:
    name = "starship"
    description = "Note: this container assumes that every child object has a mass and volume parameter or state"
    params = [
        dict(
            key="launch_utc",
            description="The UTC time that starship heads from LEO to Mars",
            notes="This is one hour past the simulation start time as the time increment will happen before this model",
            units="UTC Timestamp",
            value=1794733200,
            source="Spreadsheet of launch windows",
        ),
        dict(
            key="pressurized_cargo_volume",
            description="The volume of pressurized cargo that is able to be transported",
            units="m3",
            value=0,
            source="google",
        ),
        dict(
            key="unpressurized_cargo_volume",
            description="The volume of unpressurized cargo that is able to be transported",
            units="m3",
            value=0,
            source="google",
        ),
        dict(
            key="mass_utilization_warning_threshold",
            description="Trigger a simulation warning if mass below this level",
            units="percent",
            value=0.70,
            source="none",
            category="advanced"
        ),
        dict(
            key="volume_utilization_warning_threshold",
            description="Trigger a simulation warning if volume below this level",
            units="percent",
            value=0.70,
            source="none",
            category="advanced"
        ),
        dict(
            key="travel_days_to_mars",
            description="Rough Travel Days to go from Earth to Mars during optimal low energy transfer window",
            units="days",
            value=180,
            source="https://en.wikipedia.org/wiki/Mars_Direct",
        ),
        dict(
            key="travel_days_from_mars",
            description="Rough Travel Days to go from Mars to Earth during optimal low energy transfer window",
            notes="Assumed to be same as to Mars. Not sure if that's correct",
            units="days",
            value=180,
            source="https://en.wikipedia.org/wiki/Mars_Direct",
        ),
        dict(
            key="mars_stay_days",
            description="The days this Starship should stay on surface before returning to Earth",
            units="days",
            value=540,
            source="https://en.wikipedia.org/wiki/Mars_Direct",
        ),

        dict(
            # Ideally this would be a calculated field from specific impulse, dry mass etc
            key="max_payload_from_leo_to_mars",
            description="The maximum payload mass that can be taken from low earth orbit to Mars surface",
            units="kg",
            value=10000,
            confidence=9,
            source="SpaceX website",
        ),
        dict(
            # Ideally the maximum mass would be calculated from specific impulse, fuel available etc
            key="max_payload_from_mars_to_earth",
            description="The maximum payload mass that can be taken from Mars surface to Earth surface",
            units="kg",
            value=10000,
            confidence=0,
            source="none",
        )
        # Keep on Mars indefinitely
        # We can use this param to determine if starships should trigger return sequence or not
        # Perhaps this can just be days stay on Mars
        
        # Status: potentially could change to scrapped
    ]   

    states = [
        dict(
            key="status",
            label="Status",
            value="Traveling to Mars",
            private=True,
        ),
        dict(
            key="distance_from_sun",
            notes="Used for calculating the decrease in solar production from Earth to Mars",
            label="Distance from Sun",
            value=1234,
            source='fake'
        ),
        # TODO: For fun use some sim like KSP to see how much fuel is used by TMI, EDL etc
        # and have accurate events for that.
        dict(
            key="lox",
            label="Liquid Oxygen Fuel",
            units="kg",
            value=936264
        ),
        dict(
            key="lch4",
            label="Liquid Methane Fuel",
            units="kg",
            value=263736
        )
    ]

    # Event:
    # TMI Burn
    # Landing Burn

    # Events v2:
    # Note: we can use events to get around some of the issues with t0 being weird due to some calcs requiring it.
    # trans_mars_injection_burn (T+2hr)
    # deep_space_solar_panel_deploy
    # deep_space_solar_panel_retract
    # mars_entry_descent_and_landing (T+9000hr)
    # mars_ascent_and_trans_earth_injection_burn (t+90000hr)

    """
            total_mass = 0
            for model in utils.get_all_children_recursive():
                # TODO: think about case where mass is state instead of param
                utils.assert_units(model.params.mass, 'kg')
                total_mass += model.params.mass.value
    """

    # Architecture question:
    # Do we want to have the events be functions that control the models?
    # or do we want each model to be responsible for receiving events and then acting on them?

    # Note: we should probably execute all children before the parents

    # Note: perhaps utils should be global

    # Are we optimizing for generality or just getting something that works?
    # Perhaps just get something that works and then just keep iterating on schema.
    # AKA: Just immediately make a decision and then change later if necessary.
    # Why? because it seems very hard to judge what is the right approach early on.
    # However, if we have something working then it might be easier to just modify it

    # def respond_to_event():
    # Note: if you have this then the question is this before or after the normal run step?
    # Does it make it easier or harder to have.

    # Are there any cases where we'd have a child object but they'd not move together?

    # Should models themselves be able to trigger events?

    # Goal this weekend:
    # - get simulation running for entire mission duration
    # - get super basic visualization of location heirachy at given timestamp

    @staticmethod
    def run_step(io, params, states, data, utils):

        # Note: we could potentially trigger everything by just looking at time past launch
        # This could actually be better if you have multiple starships heading off at different times.

        seconds_since_launch = io.current_time - params.launch_utc
        days_since_mission_start = seconds_since_launch / 60 / 60 / 24

        if days_since_mission_start < 0:
            states.status = 'Pre-launch'

        elif days_since_mission_start == 0:

            utils.log_event("LEO Trans Mars Injection Burn")

            total_mass = utils.sum_children_attribute('mass')
            if total_mass > params.total_payload_from_leo_to_mars:
                utils.terminate_sim_with_error("Exceeded payload initial mass capacity")
                return

            if total_mass < params.max_payload_from_leo_to_mars * params.mass_utilization_warning_threshold:
                utils.log_warning("Initial payload mass underutilized")

            # TODO: associate logs with models?
            utils.log_metric(name="Initial Payload Used Mass", value=total_mass, units="kg")

            total_volume = utils.sum_children_attribute('volume')
            if total_volume > params.pressurized_cargo_volume:
                utils.terminate_sim_with_error("Exceeded payload initial volume capacity")
                return

            if total_volume < params.unpressurized_cargo_volume * params.volume_utilization_warning_threshold:
                utils.log_warning("Initial payload volume underutilized")

            utils.log_metric(name="Initial Payload Used Volume", value=total_mass, units="kg")

            states.status = 'Launching from LEO'

        elif days_since_mission_start > 0 and days_since_mission_start < params.travel_days_to_mars:
            states.status = 'Traveling to Mars'

            # distance from sun = data_lookup[days_passed] # For accurate number
            states.distance_from_sun += params.distance_change_per_hour

        elif days_since_mission_start == params.travel_days_to_mars:
            states.status = 'Mars Landing'

            utils.log_event("Mars Landing")

            utils.change_parent_to("mars_surface")

        elif days_since_mission_start >= params.travel_days_to_mars and days_since_mission_start < params.travel_days_to_mars + params.days_stay_on_mars:
            # Note: distance from sun is still important here for solar panels.
            # Perhaps should not be associated with starship? unkonwn
            states.status = 'On Mars Surface'

        elif days_since_mission_start == params.travel_days_to_mars + params.days_stay_on_mars:
            # Pre launch checks
            total_mass = utils.add_childen_param('mass')
            if total_mass > params.max_payload_from_mars_to_earth:
                utils.terminate_sim_with_message("Exceeded payload return mass capacity")
                return

            utils.log_event("Mars Ascent")

            states.status = 'Launching from Mars'

            utils.change_parent_to("interplanetary_space")

        elif days_since_mission_start > params.travel_days_to_mars + params.days_stay_on_mars and days_since_mission_start < params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:

            # distance from sun = data_lookup[days_passed] # For accurate number
            states.distance_from_sun += params.distance_change_per_hour

            states.status = 'Traveling to Earth'


        elif days_since_mission_start == params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:
            utils.log_event("Earth Landing")

            states.status = 'Landing on Earth'

        elif days_since_mission_start > params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:
            # No longer simulated on earth surface
            # TODO: some way to permanently remove instance from simulation.
            # utils.remove_self()

            states.status = 'Landed on Earth'
        else:
            utils.terminate_sim_with_message("Invalid Days Passed Option")


        # if utils.get_step() == 0:
        # if utils.is_initial_step():
        # if utils.is_step_after_event("leo_trans_mars_injection_burn"):
        # elif "leo_trans_mars_injection_burn" in events:
           
        #  if utils.is_first_step_after_event("mars_return_launch"):
        # elif "mars_return_launch" in events:


        # Leakage.
        # if parent.is_of_category("deep_space"):
        #    leak_rate = 0.01234 kg/gas/hr
        #    # do we just want to directly decrement the atmo_n2?
        #    # 

        # Question: How to we refer to currencies of exchange?
        # do we want to call out specific instances?e
        #
        # What do we do if there are naming conflicts?
        # io.starship_atmosphere

        # When do we want to refer to a placeholder?
        # io.outer Maybe things are outer by default

        # io.inner.co2_gas
        # NOTE: Do we want to do somthing like
        # io.outer.co2_gs += whatever or do we not care.

        # For now we can also do something like io.indoor_co2

        # Consider instead of having dicts, having Params
# from modelflow import Param

# NOTE: You can have different cargo configurations of starhip
# Ex: one entirely filled with supplies or fuel etc.

# TODO: Create a way to do the check. Ex: ensure all objects inside starship do not violate mass / volume constraints
# ideas:
# if i == 0:
#    total_mass = 0
#    for model in all_children_recursive:
#        total_mass += model.params.mass
#    if total_mass > params.total_payload_from_leo_to_mars
#        raise Exception("Exceeded initial mass requirement")


# Groups:
