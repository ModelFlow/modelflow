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
                key="wipes_and_towels",
                units="kg/person/day",
                value= 0.04875,
                source="NASA"
            ),
            dict(
                key="trash_bags",
                units="kg/person/day",
                value= 0.00275,
                source="NASA"
            ),
            dict(
                key="operational_supplies",
                units="kg/person",
                value= 25,
                source="NASA"
            ),
            dict(
                key="healthcare_consumables",
                units="kg/person/day",
                value= .0225,
                source="NASA"
            )
        ]
    }