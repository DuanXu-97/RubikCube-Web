import os
import pickle
from settings import *
from calculate_states.main import *
from .solver.cfop.cfop_solver import CFOPSolver



def gen_states_by_face():

    with open(os.path.join(BASE_DIR, 'RubikCubeWebApp/solver/deepcubea/states_by_id.pkl'), "rb") as f:
        inputData = pickle.load(f)
        deepcubea_states = inputData['states']

    state_by_face_list = []
    for state in deepcubea_states:
        state_by_face = convert_states_to_str(state)
        print(state_by_face)
        state_by_face_list.append(state_by_face)

    print(state_by_face_list)

    with open(os.path.join(BASE_DIR, 'RubikCubeWebApp/solver/deepcubea/states_by_face.pkl'), 'wb') as f_w:
        pickle.dump(state_by_face_list, f_w)


def states_id_to_face():
    state_by_face = 'UDUUUULRDRFDRLDFRRFDLLFFUFDBBLLRURRLFBFLBFBBDBDBBDURLU'
    state_by_id = [8, 52, 17, 19, 4, 7, 53, 3, 11, 33, 30, 20, 41, 13, 25, 42, 10, 47, 15, 23, 51, 16, 22, 28,
     44, 34, 35, 0, 12, 6, 21, 31, 50, 18, 14, 45, 9, 48, 24, 5, 40, 32, 36, 1, 27, 2, 37, 38,
     46, 49, 43, 26, 39, 29]
    is_legal = simple_check_input(state_by_face)
    conv_state_by_face = convert_states_to_str(state_by_id)

    print('state_by_face', state_by_face)
    print('state_by_id', state_by_id)
    print('is_legal', is_legal)
    print('conv_state_by_face', conv_state_by_face)
    print(conv_state_by_face == state_by_face)


def get_si_by_sf_in_pkl(sf):
    with open(os.path.join(BASE_DIR, 'RubikCubeWebApp/solver/deepcubea/states_by_face.pkl'), 'rb') as f:
        states_by_face = pickle.load(f)

    with open(os.path.join(BASE_DIR, 'RubikCubeWebApp/solver/deepcubea/states_by_id.pkl'), "rb") as f:
        inputData = pickle.load(f)
        states_by_id = inputData['states']

    for i, state in enumerate(states_by_face):
        if state == sf:
            break

    print(states_by_id[i])


def cfop_test():
    state_str = 'LLLBUUUBBDRFRLFBFBRDRUFRRUFDLDDRBRLLFDBLBFUULUBDDDFURF'
    solver = CFOPSolver(state_str)
    moves = solver.solve()
    return moves


if __name__ == '__main__':
    moves = cfop_test()
    print(moves)



