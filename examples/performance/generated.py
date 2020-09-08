# Generated Code
import numpy as np
import math
from numba import jit

# @jit(nopython=True, cache=True)
# def producer(state_pmoney, state_widgets, Producer_params_max_widgets_per_hour_created, Producer_params_cost_per_widget):
#     # Producer ######
#     if state_pmoney <= 0:
#         return state_pmoney, state_widgets

#     widgets_per_hr = min(Producer_params_max_widgets_per_hour_created, state_pmoney // Producer_params_cost_per_widget)
#     state_pmoney -= Producer_params_cost_per_widget * widgets_per_hr
#     state_widgets += Producer_params_max_widgets_per_hour_created
#     return state_pmoney, state_widgets

@jit(nopython=True, cache=True)
def rstep(num_steps,Consumer_params_max_widgets_per_hour_consumed,Consumer_params_paid_per_widget,Producer_params_cost_per_widget,Producer_params_max_widgets_per_hour_created,initial_state_cmoney,initial_state_pmoney,initial_state_widgets):
    state_pmoney_out = np.zeros(num_steps + 1)
    state_pmoney_out[0] = initial_state_pmoney
    state_pmoney = initial_state_pmoney
    state_widgets_out = np.zeros(num_steps + 1)
    state_widgets_out[0] = initial_state_widgets
    state_widgets = initial_state_widgets
    state_cmoney_out = np.zeros(num_steps + 1)
    state_cmoney_out[0] = initial_state_cmoney
    state_cmoney = initial_state_cmoney

    for _i_ in range(num_steps):
        if state_pmoney > 0:
            widgets_per_hr = min(Producer_params_max_widgets_per_hour_created, state_pmoney // Producer_params_cost_per_widget)
            state_pmoney -= Producer_params_cost_per_widget * widgets_per_hr
            state_widgets += Producer_params_max_widgets_per_hour_created

        # state_pmoney, state_widgets = producer(state_pmoney, state_widgets, Producer_params_max_widgets_per_hour_created, Producer_params_cost_per_widget)
        # # Consumer ######
        # if state_cmoney <= 0:
        #     return
        # consumed = min(Consumer_params_max_widgets_per_hour_consumed, state_cmoney // Consumer_params_paid_per_widget)
        # state_widgets -= consumed
        # state_pmoney += Consumer_params_paid_per_widget * consumed
        # state_cmoney -= Consumer_params_paid_per_widget * consumed

        # ###### Store outputs ######
        # state_cmoney_out[_i_ + 1] = state_cmoney
        # state_pmoney_out[_i_ + 1] = state_pmoney
        # state_widgets_out[_i_ + 1] = state_widgets

    return state_cmoney_out, state_pmoney_out, state_widgets_out
