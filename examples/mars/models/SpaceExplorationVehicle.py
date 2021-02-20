class Space_Exploration_Vehicle:
    name = "SpaceExplorationVehicle"
    description = "Nasa's proposed SEV "
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
            key="height",
            description="height of the vehicle",
            units="m",
            value=3.048,
            source="https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf",

        )
    ]

    private_states = [
        dict(
            key="status",
            label="Status",
            value="Traveling",
        )
    ]

    #No status methods