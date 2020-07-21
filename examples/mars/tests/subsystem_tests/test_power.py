import sys
sys.path.insert(0, "/Users/adamraudonis/Desktop/Projects/ModelFlow/modelflow/examples/mars")
sys.path.insert(0, "/Users/adamraudonis/Desktop/Projects/ModelFlow/modelflow")
from models.pv import SolarArray
from models.location import Location
from models.pv_inverter import PVInverter
from models.battery import Battery
from models.lighting import Lighting
from modelflow.modelflow import run_simulation
import pandas as pd

# TODO: Convert this to actual pytest
# Add scenarios:
# - working for full year
# - running out of energy

# Other todo:
# - automatic output for change in resources

def basic_power_subsystem():
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
        ],
        run_for_steps=8760,
    )
    all_outputs = run_simulation(scenario)
    df = pd.DataFrame(all_outputs)
    print(df)
    df.to_csv('power_test.csv',index=False)

    # TODO: don't dump to csv and just have 
    # asserts for certain sanity checks

    # TODO: Think about how to encapsulate the tests with data.
    # Kinda coming back to how to encapsulate the scenarios

if __name__ == '__main__':
    basic_power_subsystem()
