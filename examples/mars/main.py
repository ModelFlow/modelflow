import json
import os
import sys
import argparse
import pathlib
sys.path.insert(0, "../..")
from models import list_models
from modelflow.modelflow import run_sim, run_minimization

import pandas as pd
import time

def main(args):
    t0 = time.time()
    # TODO: Implement arg parse
    # TODO: Implement scaling of actors
    # TODO: Figure out how to override params
    # TODO: Figure out how to sweep over params
    # TODO: Perhaps model model library path inside scenario?
    abs_dir = pathlib.Path(__file__).parent.absolute()
    abs_path = ''
    if os.path.exists(args.scenario):
        abs_path = args.scenario
    else:
        abs_path = os.path.join(abs_dir, 'scenarios', args.scenario)
        if not '.json' in abs_path:
            abs_path += '.json'
    scenario = None
    with open(abs_path, 'r') as f:
        scenario = json.load(f)

    models = list_models()

    if args.minimization:
        print("Running minimization")
        run_minimization(scenario, models)
    else:
        outputs = run_sim(scenario, models, abs_dir)
        df = pd.DataFrame()
        for key, value in outputs['output_states'].items():
            df[key] = value['data']

        df.to_csv(args.output, index=False)
        print(f"Model ran in {time.time() - t0:.2f} seconds. Saved {args.output}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run Mars Simulation')
    parser.add_argument('-s', '--scenario', type=str, help='Name or path to scenario to run', required=True)
    parser.add_argument('-o', '--output', type=str, default='output.csv', help='Path of the csv to output.')
    parser.add_argument('-m', '--minimization', action='store_true', help='Run minimization sweep')

    args = parser.parse_args()
    main(args)
