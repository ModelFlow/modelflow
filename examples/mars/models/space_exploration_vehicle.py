class Space_Exploration_Vehicle:
    name = "SpaceExplorationVehicle"
    description = "Nasa's proposed SEV"
    params = [
        dict(
            key="mass",
            description="mass of the ship",
            units="kg",
            value=30000,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",
        ),
        dict(
            key="length",
            description="The length of the vehicle",
            units="m",
            value=4.48056,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",
        ),
        dict(
            key="Width (Wheelbase)",
            description="Width of the vehicle wheelbase to wheelbase",
            units="m",
            value=3.9624,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",
        ),
        dict(
            key="capacity",
            description="number of people who can travel in the SEV",
            units="person",
            value=2,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",

        ),
        dict(
            key="emergency_capacity",
            description="number of people who can travel in the SEV in case of an emergency",
            units="person",
            value=4,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",

        ),
        dict(
            key="emergency_protection_time",
            description="Max time of protection against emergencies",
            units="hours",
            value=72,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",

        ),
        dict(
            key="max_live_time",
            description="Max time for astronauts to live inside",
            units="days",
            value=14,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",

        ),
        dict(
            key="safe_range",
            description="Range of exploration",
            units="miles",
            value=125,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",
            notes="Factsheet said it's the safe range for two or more SEVs, unknown what that means",

        )

    ]

    states = [
        dict(
            key="status",
            label="Status",
            value="Packed",
            private=True,
        )
    ]

    # TODO: Add run_step method
