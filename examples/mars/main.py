import sys
sys.path.insert(0, "../..")
from models import Location, Raddish, HabitatAtmosphere
from modelflow.modelflow import run_simulation

def main():
    # TODO: Have system for scaling actors. Currently just add multiple lol
    # Think of also how to change the params
    # Think about how to sweep over params

    # Note: You do not need bidirectional links
    scenario = dict(
        models=[
            dict(
                model=Human(),
                scale=1,
                links=[
                    "habitat_atmosphere",
                    "potable_water_storage",
                    "food_storage",
                    "waste_storage"
                ]
            )
            dict(model=HabitatAtmosphere()),
            dict(model=PotableWaterStorage()),
            dict(model=FoodStorage()),
            dict(model=WaterStorage()),
        ],
        run_for_steps=2,
        # time_per_step": "1hr" # TODO: Actually use this
    )
    run_simulation(scenario)

if __name__ == '__main__':
    main()
