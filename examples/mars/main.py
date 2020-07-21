import sys
sys.path.insert(0, "../..")
from models.humans import Human
from models.indoor_air import IndoorAir
from models.storages import WaterStorage, FoodStorage, WasteStorage
from modelflow.modelflow import run_simulation
from models.location import Location
from models.pv import SolarArray
from models.pv_inverter import PVInverter
from models.battery import Battery
from models.lighting import Lighting
import pandas as pd
import time

def main():
    t0 = time.time()
    # TODO: Have system for scaling actors. Currently just add multiple lol
    # Think of also how to change the params
    # Think about how to sweep over params

    # Note: You do not need bidirectional links
    # scenario = dict(
        # models=[
        #     dict(
        #         model=Human(),
        #         scale=1,
        #         links=[
        #             "habitat_atmosphere",
        #             "potable_water_storage",
        #             "food_storage",
        #             "waste_storage"
        #         ]
        #     ),
        #     dict(model=HabitatAtmosphere()),
        #     dict(model=PotableWaterStorage()),
        #     dict(model=FoodStorage()),
        #     dict(model=WasteStorage()),
        # ],
    #     run_for_steps=20,
    #     # time_per_step": "1hr" # TODO: Actually use this
    # )
    # run_simulation(scenario)

    scenario = dict(
        models=[
            dict(
                model=Location(),
            ),
            dict(
                model=SolarArray(),
                scale=1,
                links=[
                    "pv_inverter",
                ]
            ),
            dict(
                model=PVInverter(),
                scale=1,
                links=[
                    "battery",
                ]
            ),
            dict(
                model=Battery(),
                scale=1,
            ),
            dict(
                model=Lighting(),
                scale=1,
                links=[
                    "battery"
                ]
            ),
            dict(
                model=Human(),
                scale=1,
                links=[
                    "indoor_air",
                    "potable_water_storage",
                    "food_storage",
                    "waste_storage"
                ]
            ),
            dict(model=IndoorAir()),
            dict(model=WaterStorage()),
            dict(model=FoodStorage()),
            dict(model=WasteStorage()),
        ],
        run_for_steps=8760,
    )
    all_outputs = run_simulation(scenario)
    df = pd.DataFrame(all_outputs)
    print(df.columns)
    print(df.is_alive)
    df.to_csv('test.csv',index=False)
    print(f"Model ran in {time.time() - t0:.2f} seconds")

if __name__ == '__main__':
    main()
