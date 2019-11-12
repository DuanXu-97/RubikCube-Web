import sys
sys.path.append('./')

from solveStartingStates import *

state = [9, 39, 20, 30, 4, 46, 0, 43, 27, 36, 32, 53, 48, 13, 21, 8, 52, 45, 42, 16, 26, 41, 22, 37, 35, 14, 15, 17, 25, 2, 50, 31, 23, 29, 10, 11, 38, 28, 24, 5, 40, 1, 18, 12, 44, 47, 19, 51, 34, 49, 3, 33, 7, 6]
soln, _, _ = runMethods(state)
print soln

