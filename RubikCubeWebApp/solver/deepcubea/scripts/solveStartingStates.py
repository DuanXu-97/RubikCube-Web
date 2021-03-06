import os
import time
import gc
import sys
sys.path.append('../../../../')
from RubikCubeWebApp.solver.deepcubea.scripts.config import Config


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
    from RubikCubeWebApp.solver.deepcubea.environments.cube_interactive_simple import Cube

    Environment = Cube(N=3, moveType="qtm")

    useGPU = bool(args.use_gpu)

    from RubikCubeWebApp.solver.deepcubea.ml_utils import nnet_utils
    from RubikCubeWebApp.solver.deepcubea.ml_utils import search_utils

    gpuNum = 0
    nnet = nnet_utils.loadNnet(args.model_loc, args.model_name, useGPU, Environment, gpuNum=gpuNum)

    def heuristicFn_nnet(x):
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

    print(soln)

    assert (validSoln(state, soln, Environment))

    return soln, elapsedTime, nodesGenerated_num









