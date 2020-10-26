import pandas as pd
import argparse
try:
    from graphviz import Digraph
except:
    print("Note: Optional graphviz not installed")


def generate_graph(df=None):
    g = Digraph('ModelFlow', filename='modelflow.gv', engine='neato')
    g.attr(overlap='false')
    g.attr(splines='true')
    column_names = df.columns
    print(column_names)
    states = []
    g.attr('node', shape='ellipse')
    for column_name in column_names:
        if column_name[:6] == 'state_':
            states.append((column_name[6:], column_name))
            g.node(column_name[6:])

    models = []
    g.attr('node', shape='box')
    for column_name in column_names:
        if column_name[:6] != 'state_':
            models.append((column_name.split('_')[0], column_name))
            g.node(column_name.split('_')[0])

    for column_name in column_names:
        if column_name[:6] != 'state_':
            parts = column_name.split('_')
            state = '_'.join(parts[1:])[6:-7]
            print(parts[0], state, df[column_name].min(),
                  df[column_name].max())
            if df[column_name].min() < 0 and df[column_name].max() <= 0:
                g.edge(state, parts[0])
            elif df[column_name].min() >= 0 and df[column_name].max() > 0:
                g.edge(parts[0], state)
            else:
                g.edge(parts[0], state)
                g.edge(state, parts[0])

    g.view()


def main(args):
    df = pd.read_csv(args.output_file)
    generate_graph(input_df=df)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate Graph Viz')
    parser.add_argument('-f', '--output_file', type=str,
                        help='The output file to generate a graph of', required=True)

    args = parser.parse_args()
    main(args)
