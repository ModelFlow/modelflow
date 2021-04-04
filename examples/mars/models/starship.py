class Starship:
    name = "starship"
    description = "Note: this container assumes that every child object has a mass and volume parameter or state"
    params = [
        dict(
            key="launch_utc",
            description="The UTC time that starship heads from LEO to Mars",
            notes="This is one hour past the simulation start time as the time increment will happen before this model",
            units="UTC Timestamp",
            value=1794916800,
            source="Spreadsheet of launch windows",
        ),
        dict(
            key="pressurized_cargo_volume",
            description="The volume of pressurized cargo that is able to be transported",
            units="m3",
            value=100000,
            source="FAKE",
        ),
        dict(
            key="unpressurized_cargo_volume",
            description="The volume of unpressurized cargo that is able to be transported",
            units="m3",
            value=0,
            source="FAKE",
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
            value=100000,
            confidence=9,
            source="SpaceX website",
        ),
        dict(
            # Ideally the maximum mass would be calculated from specific impulse, fuel available etc
            key="max_payload_from_mars_to_earth",
            description="The maximum payload mass that can be taken from Mars surface to Earth surface",
            units="kg",
            value=100000,
            confidence=0,
            source="none",
        ),
        dict(
            key="distance_change_per_hour",
            description="The distance per hour that the starship travels to or away from the sun",
            notes="This is an ultra rough number used for first order calcs of pv generation",
            units="km/h",
            value=1,
            confidence=0,
            source="fake",
        )
    ]

    states = [
        dict(
            key="distance_from_sun",
            notes="Used for calculating the decrease in solar production from Earth to Mars",
            label="Distance from Sun",
            value=1234,
            source='fake'
        ),
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
        ),
        dict(
            key="status",
            label="Status",
            value="No Status",
            private=True
        ),
        dict(
            key="payload_mass",
            label="Payload Mass",
            value=0,
            private=True
        ),
        dict(
            key="payload_used_volume",
            label="Payload Used Volume",
            value=0,
            private=True
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        # DEBUG: This is expensive, we shouldn't need to calculate every time
        # states.payload_mass = utils.sum_children_attribute('mass')
        # print(states.payload_mass)

        seconds_since_launch = states.current_utc - params.launch_utc
        days_since_mission_start = seconds_since_launch / 60 / 60 / 24

        if days_since_mission_start < 0:
            states.status = 'Pre-launch'
        elif days_since_mission_start == 0:

            utils.log_event("LEO Trans Mars Injection Burn")

            states.payload_mass = utils.sum_children_attribute('mass')
            if states.payload_mass > params.max_payload_from_leo_to_mars:
                utils.terminate_sim_with_error(f"Exceeded payload initial mass capacity {states.payload_mass}kg vs {params.max_payload_from_leo_to_mars}kg")
                return

            if states.payload_mass < params.max_payload_from_leo_to_mars * params.mass_utilization_warning_threshold:
                utils.log_warning("Initial payload mass underutilized")

            # TODO: associate logs with models?
            utils.log_metric(name="Initial Payload Used Mass", value=states.payload_mass, units="kg")

            total_volume = utils.sum_children_attribute('volume')
            if total_volume > params.pressurized_cargo_volume:
                utils.terminate_sim_with_error("Exceeded payload initial volume capacity")
                return

            if total_volume < params.unpressurized_cargo_volume * params.volume_utilization_warning_threshold:
                utils.log_warning("Initial payload volume underutilized")

            utils.log_metric(name="Initial Payload Used Volume", value=states.payload_mass, units="kg")

            states.status = 'Launching from LEO'

        elif days_since_mission_start > 0 and days_since_mission_start < params.travel_days_to_mars:
            states.status = 'Traveling to Mars'

            # distance from sun = data_lookup[days_passed] # For accurate number
            states.distance_from_sun += params.distance_change_per_hour

        elif days_since_mission_start == params.travel_days_to_mars:
            states.status = 'Mars Landing'

            utils.log_event("Mars Landing")

            utils.change_parent_to("mars_surface")

        elif days_since_mission_start >= params.travel_days_to_mars and days_since_mission_start < params.travel_days_to_mars + params.mars_stay_days:
            # Note: distance from sun is still important here for solar panels.
            # Perhaps should not be associated with starship? unkonwn
            states.status = 'On Mars Surface'

        elif days_since_mission_start == params.travel_days_to_mars + params.mars_stay_days:
            # Pre launch checks on Mars
            states.payload_mass = utils.sum_children_attribute('mass')
            print("PRELALIUDSHFLDIF")
            print(states.payload_mass, params.max_payload_from_mars_to_earth)
            if states.payload_mass > params.max_payload_from_mars_to_earth:
                utils.terminate_sim_with_error(f"Exceeded payload return mass capacity {states.payload_mass}kg vs {params.max_payload_from_mars_to_earth}kg")
                return

            utils.log_event("Mars Ascent")

            states.status = 'Launching from Mars'

            utils.change_parent_to("interplanetary_space")

        elif days_since_mission_start > params.travel_days_to_mars + params.mars_stay_days and days_since_mission_start < params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:

            # distance from sun = data_lookup[days_passed] # For accurate number
            states.distance_from_sun -= params.distance_change_per_hour

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
            utils.terminate_sim_with_error("Invalid Days Passed Option")
