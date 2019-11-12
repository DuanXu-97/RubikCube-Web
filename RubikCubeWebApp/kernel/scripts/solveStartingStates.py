import os
import sys
import time
from .config import Config

sys.path.append('./')

import gc

def deleteIfExists(filename):
    if os.path.exists(filename):
        os.remove(filename)

def validSoln(state,soln,Environment):
    solnState = state
    for move in soln:
        solnState = Environment.next_state(solnState,move)

    return(Environment.checkSolved(solnState))


def runMethods(state, args=Config()):
    """
    the pretrained model is used, input the state, output the solution
    :param state: the state of the cube to be solved
    :param args: some configs of model
    :return:
    """
    from ..environments.cube_interactive_simple import Cube
    Environment = Cube(N=3, moveType="qtm")

    from ..solvers.cube3.solver_algs import Kociemba
    from ..solvers.cube3.solver_algs import Optimal

    useGPU = bool(args.use_gpu)

    from ..ml_utils import nnet_utils
    from ..ml_utils import search_utils

    def heuristicFn_nnet(x):
        gpuNum = 0
        nnet = nnet_utils.loadNnet(args.model_loc, args.model_name, useGPU, Environment, gpuNum=gpuNum)
        nnetResult = nnet(x)
        return nnetResult

    stateStr = " ".join([str(x) for x in state])
    print(stateStr)
    start_time = time.time()

    BestFS_solve = search_utils.BestFS_solve([state], heuristicFn_nnet, Environment, bfs=args.bfs)
    isSolved, solveSteps, nodesGenerated_num = BestFS_solve.run(numParallel=args.nnet_parallel,
                                                                depthPenalty=args.depth_penalty, verbose=args.verbose)
    BestFS_solve = []
    del BestFS_solve
    gc.collect()

    soln = solveSteps[0]
    nodesGenerated_num = nodesGenerated_num[0]
    elapsedTime = time.time() - start_time

    assert (validSoln(state, soln, Environment))

    refined_soln_str = refineSoln(soln)

    return refined_soln_str, elapsedTime, nodesGenerated_num


def refineSoln(soln):
    refined_soln = []
    for step in soln:
        if step[-1] == -1:
            refined_soln.append(step[0] + '\'')
        else:
            refined_soln.append(step[0])

    refined_soln_str = ' '.join(refined_soln)
    print(refined_soln_str)
    return refined_soln_str


if __name__ == '__main__':
    state = '[9, 39, 20, 30, 4, 46, 0, 43, 27, 36, 32, 53, 48, 13, 21, 8, 52, 45, 42, 16, 26, 41, 22, 37, 35, ' \
                 '14, 15, 17, 25, 2, 50, 31, 23, 29, 10, 11, 38, 28, 24, 5, 40, 1, 18, 12, 44, 47, 19, 51, 34, 49, 3, ' \
                 '33, 7, 6]'
    soln, _, _ = runMethods(state)
    print soln




