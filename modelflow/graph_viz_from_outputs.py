import pandas as pd
import argparse
import json
try:
    from graphviz import Digraph
except:
    print("Note: Optional graphviz not installed")


def generate_graph(df, graph_format='pdf'):
    g = Digraph('ModelFlow', filename='modelflow.gv', engine='neato', format=graph_format)
    g.attr(overlap='false')
    g.attr(splines='true')
    column_names = df.columns
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

    if graph_format == 'json':
        # TODO: THIS DOES NOT WORK FOR MULTIPLE MODELFLOWS
        with open('modelflow.gv.json', 'r') as f:
            return json.load(f)
    else:
        g.view()
        

def generate_react_flow_chart(outputs):
    df = pd.DataFrame()
    for key, value in outputs['output_states'].items():
        df[key] = value['data']

    return generate_react_flow_chart_from_df(df)
    

def generate_react_flow_chart_from_df(df):
    column_names = df.columns

    nodes = {}
    # Elipses
    for column_name in column_names:
        if column_name[:6] == 'state_':
            nodes[column_name[6:]] = dict(name=column_name[6:], kind='elipse')

    # Boxes
    for column_name in column_names:
        if column_name[:6] != 'state_':
            nodes[column_name.split('_')[0]] = dict(name=column_name.split('_')[0], kind='box')

    edges = []
    for column_name in column_names:
        if column_name[:6] != 'state_':
            parts = column_name.split('_')
            name1 = parts[0]
            state = '_'.join(parts[1:])[6:-7]
            # print(name1, state, df[column_name].min(),
            #       df[column_name].max())
            if df[column_name].min() < 0 and df[column_name].max() <= 0:
                edges.append([state, name1, 'one_way'])
            elif df[column_name].min() >= 0 and df[column_name].max() > 0:
                edges.append([name1, state, 'one_way'])
            else:
                edges.append([name1, state, 'both'])

    return dict(nodes=list(nodes.values()), edges=edges)


def main(args):
    df = pd.read_csv(args.output_file)
    # generate_graph(df)
    generate_react_flow_chart_from_df(df)



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate Graph Viz')
    parser.add_argument('-f', '--output_file', type=str,
                        help='The output file to generate a graph of', required=True)

    args = parser.parse_args()
    main(args)
