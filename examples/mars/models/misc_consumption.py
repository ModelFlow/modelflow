class misc_consumption:
    definition = {
        "name": "misc_consumption",
        "params": [
            dict(
                key="Hygiene Consumables",
                units="kg/person/day",
                value= 0.01975,
                source="NASA"
            ),
            dict(
                key="clothing",
                units="kg/person/day",
                value=.055,
                source="NASA"
            ),
            dict(
                key="personal stowage",
                units="kg per person",
                value=12.5,
                source="NASA"
            ),
            dict(
                key="Wh_per_kg",
                units="kg/person/day",
                value= 0.04875,
                source="NASA"
            )
        ]
    }