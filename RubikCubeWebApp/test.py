import numpy as np
import pickle

# color = np.array([1,1,1])
# color.copy()
# print(color.shape)
# print(type(color))

filename = '../states.pkl'
inputData = pickle.load(open(filename,"rb"), encoding='utf-8')

states = inputData['states']

print(states)

