import sys
sys.path.append('../../../')
from RubikCubeWebApp.solver.deepcubea.scripts.solveStartingStates import runMethods as deepcubea
from RubikCubeWebApp.calculate_states.main import refine_soln
from RubikCubeWebApp.solver.kociemba.kociemba_solver import KociembaSolver
from RubikCubeWebApp.solver.cfop.cfop_solver import CFOPSolver
import time
try:
    import pickle
except Exception:
    import cPickle as pickle


def cal_mean_moves_length(moves_list):
    total_length = 0
    for moves in moves_list:
        move_list = moves.split(' ')
        for move in moves:
            if move[-1] == '2':
                total_length += 1
        total_length += len(move_list)

    mean_moves_length = total_length / len(moves_list)

    return mean_moves_length


def test_deepcubea(state_list):
    time_list = []
    moves_list = []
    error_state_list = []
    for state in state_list:
        try:
            start_time = time.time()
            temp_moves, _, _ = deepcubea(state)
            moves = refine_soln(temp_moves)
            end_time = time.time()
            solve_time = end_time - start_time
            time_list.append(solve_time)
            moves_list.append(moves)
            print('==============')
            print('state: ', state)
            print('solve_time: ', solve_time)
            print('moves: ', moves)
            print('==============')
        except Exception as e:
            print(e)
            error_state_list.append(state)

    mean_time = sum(time_list) / len(state_list)
    mean_length = cal_mean_moves_length(moves_list)

    return mean_time, mean_length, time_list, moves_list, error_state_list


def test_kociemba(state_list):
    time_list = []
    moves_list = []
    error_state_list = []

    for state in state_list:
        try:
            start_time = time.time()
            solver = KociembaSolver(state)
            moves = solver.solve()
            end_time = time.time()
            solve_time = end_time - start_time
            time_list.append(solve_time)
            moves_list.append(moves)
            print('==============')
            print('state: ', state)
            print('solve_time: ', solve_time)
            print('moves: ', moves)
            print('==============')
        except Exception as e:
            print(e)
            error_state_list.append(state)

    mean_time = sum(time_list) / len(state_list)
    mean_length = cal_mean_moves_length(moves_list)

    return mean_time, mean_length, time_list, moves_list, error_state_list


def test_cfop(state_list):
    time_list = []
    moves_list = []
    error_state_list = []

    for state in state_list:
        try:
            start_time = time.time()
            solver = CFOPSolver(state)
            moves = str(solver.solve())
            end_time = time.time()
            solve_time = end_time - start_time
            time_list.append(solve_time)
            moves_list.append(moves)
            print('==============')
            print('state: ', state)
            print('solve_time: ', solve_time)
            print('moves: ', moves)
            print('==============')
        except Exception as e:
            print(e)
            error_state_list.append(state)

    mean_time = sum(time_list) / len(state_list)
    mean_length = cal_mean_moves_length(moves_list)

    return mean_time, mean_length, time_list, moves_list, error_state_list


if __name__ == '__main__':
    with open('test_states_by_converted_id_py2.pkl', 'rb') as f:
        states_by_id_list = pickle.load(f)[:100]

    with open('test_states_by_face_py2.pkl', 'rb') as f:
        states_by_face_list = pickle.load(f)[:100]

    mean_time = dict()
    mean_length = dict()
    time_list = dict()
    moves_list = dict()
    error_state_list = dict()
    mean_time['cfop'], mean_length['cfop'], time_list['cfop'], moves_list['cfop'], error_state_list['cfop'] = test_cfop(states_by_face_list)
    mean_time['kociemba'], mean_length['kociemba'], time_list['kociemba'], moves_list['kociemba'], error_state_list['kociemba'] = test_kociemba(states_by_face_list)
    mean_time['deepcubea'], mean_length['deepcubea'], time_list['deepcubea'], moves_list['deepcubea'], error_state_list['deepcubea'] = test_deepcubea(states_by_id_list)

    result = dict()
    result['mean_time'] = mean_time
    result['mean_length'] = mean_time
    result['time_list'] = mean_time
    result['moves_list'] = mean_time
    result['error_state_list'] = mean_time

    print(mean_time)
    print(mean_length)

    with open('test_performance_result.pkl', 'wb') as f:
        pickle.dump(result, f)










