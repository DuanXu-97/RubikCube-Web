import os
import pickle
from settings import *
from calculate_states.main import *


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
    state_by_face = 'RDULUFLFRBDFFLBBLFLUDRFBUUDBRFURLRDDLRLRBFBLFUUDDDBUBR'
    state_by_id = calculate_states(state_by_face)
    is_legal = simple_check_input(state_by_face)

    print('state_by_face', state_by_face)
    print('state_by_id', state_by_id)
    print('is_legal', is_legal)


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


if __name__ == '__main__':
    get_si_by_sf_in_pkl(sys.argv[1])



