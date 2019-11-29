import os
import pickle
from settings import *
from calculate_states.main import convert_states_to_str

with open(os.path.join(BASE_DIR, 'RubikCubeWebApp/solver/deepcubea/states.pkl'), "rb") as f:
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

