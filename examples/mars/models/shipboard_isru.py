

class SabatierReactor:
    def run_step(io, params, states, data, utils, events):
        if io.stored_co2 > 0 and io.stored_h2o > 0:

        else:
            utils.log("Not running due to no inputs")