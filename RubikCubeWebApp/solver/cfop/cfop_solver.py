# -*- coding: utf-8 -*-
import sys
import io
import time

from RubikCubeWebApp.calculate_states.cube_string import CubeString
from RubikCubeWebApp.solver.kociemba.kociemba_solver import KociembaSolver
from RubikCubeWebApp.solver.model.cube import Cube
from RubikCubeWebApp.solver.model.formula import Formula
from RubikCubeWebApp.solver.cfop.cross import CrossSolver
from RubikCubeWebApp.solver.cfop.f2l import F2LSolver
from RubikCubeWebApp.solver.cfop.oll import OLLSolver
from RubikCubeWebApp.solver.cfop.pll import PLLSolver


class CFOPSolver(object):
    def __init__(self, cube=None):
        self.cube = cube

    def feed(self, cube):
        self.cube = cube

    def solve(self):
        if not self.cube.is_valid():
            raise ValueError("Invalid Cube.")
        result = Formula()

        solver = CrossSolver(self.cube)
        cross = solver.solve()
        result += cross

        solver = F2LSolver(self.cube)
        for i, f2l_single in enumerate(solver.solve(), 1):
            result += f2l_single[1]

        solver = OLLSolver(self.cube)
        oll = solver.solve()
        result += oll

        solver = PLLSolver(self.cube)
        pll = solver.solve()
        result += pll
        return result


if __name__ == '__main__':
    # cs = CubeString('DBLRUFUBRBDLBLBRDDFLFRFURUUDLUFRLRDDBDLUBULRBBRFFDLUFF', ordering='ULFRBD').re
    # k = KociembaSolver('BDRDURFFFLRLULLBFUDDDBFUFDDRBBFRLRBUUBDUBRRFLLLBRDUULF')
    # print(k.solve())
    a = time.time()
    moves = Formula(
        KociembaSolver('BDRDURFFFLRLULLBFUDDDBFUFDDRBBFRLRBUUBDUBRRFLLLBRDUULF').get_moves_to_random_state())
    print(time.time() - a)

    b = time.time()
    c = Cube().perform_algo(moves)
    print(time.time() - b)

    d = time.time()
    solution = CFOPSolver(c).solve()
    print(time.time() - d)
    # print(solution)
