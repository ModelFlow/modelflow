import json
import os
import sys
import time
import argparse
import pathlib
import pandas as pd
sys.path.insert(0, "../..")
from modelflow.modelflow import run_scenario # NOQA  # TODO: make work run_minimization  
# from modelflow.graph_viz_from_outputs import generate_graph  # NOQA


def main(args):    
    # t0 = time.time()
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

    outputs = run_scenario(scenario)
    if 'error' in outputs:
        raise Exception(f"Sim Error: {outputs['error']}")

    df = pd.DataFrame()
    for instance_key, dicts in outputs['states'].items():
        for field_key, data in dicts.items():
            df[f'{instance_key}_{field_key}'] = data
    df.to_csv(args.output, index=False)

    # models = list_models()

    # # TODO: Make minimization work again
    # # if args.minimization:
    # #     print("Running minimization")
    # #     run_minimization(scenario, models)
    # # else:

    # outputs = run_sim(scenario, models, should_output_deltas=args.should_output_deltas, use_numba=args.use_numba)
    # df = pd.DataFrame()
    # for key, value in outputs['output_states'].items():
    #     df[key] = value['data']

    # if args.generate_graph:
    #     if not args.should_output_deltas:
    #         raise Exception("Must include --should_output_deltas to generate graph")
    #     generate_graph(df)
    # df.to_csv(args.output, index=False)
    # print(f"Model ran in {time.time() - t0:.2f} seconds. Saved {args.output}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run Mars Simulation')
    parser.add_argument('-s', '--scenario', type=str, help='Name or path to scenario to run', default='test')
    parser.add_argument('-o', '--output', type=str, default='output.csv', help='Path of the csv to output.')
    # # parser.add_argument('-m', '--minimization', action='store_true', help='Run minimization sweep')
    # parser.add_argument('-d', '--should_output_deltas', action='store_true', help='Output the deltas of each model state')
    # parser.add_argument('-g', '--generate_graph', action='store_true', help='Generate a graph of models connectivity')
    # parser.add_argument('-n', '--use_numba', action='store_true', help='Use generated numba code for faster subsequent runs')

    args = parser.parse_args()
    main(args)
