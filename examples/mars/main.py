import json
import os
import sys
import argparse
import pathlib
import pandas as pd
import time
sys.path.insert(0, "../..")
from models import list_models  # NOQA
from modelflow.modelflow import run_sim, run_minimization  # NOQA
from modelflow.graph_viz_from_outputs import generate_graph  # NOQA



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
        outputs = run_sim(scenario, models, abs_dir, should_output_deltas=args.should_output_deltas)
        df = pd.DataFrame()
        for key, value in outputs['output_states'].items():
            df[key] = value['data']

        if args.generate_graph:
            if not args.should_output_deltas:
                raise Exception("Must include --should_output_deltas to generate graph")
            generate_graph(df)
        df.to_csv(args.output, index=False)
        print(f"Model ran in {time.time() - t0:.2f} seconds. Saved {args.output}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run Mars Simulation')
    parser.add_argument('-s', '--scenario', type=str, help='Name or path to scenario to run', required=True)
    parser.add_argument('-o', '--output', type=str, default='output.csv', help='Path of the csv to output.')
    parser.add_argument('-m', '--minimization', action='store_true', help='Run minimization sweep')
    parser.add_argument('-d', '--should_output_deltas', action='store_true', help='Output the deltas of each model state')
    parser.add_argument('-g', '--generate_graph', action='store_true', help='Generate a graph of models connectivity')

    args = parser.parse_args()
    main(args)
