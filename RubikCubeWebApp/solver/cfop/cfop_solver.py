# -*- coding: utf-8 -*-
import sys
import io

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

    def solve(self, suppress_progress_messages=False):
        if suppress_progress_messages:
            save_stdout = sys.stdout
            sys.stdout = io.StringIO()
        if not self.cube.is_valid():
            raise ValueError("Invalid Cube.")
        result = Formula()
        sys.stdout.write("Solver starts....")

        sys.stdout.write("\rSolving Cross ......")
        solver = CrossSolver(self.cube)
        cross = solver.solve()
        result += cross
        sys.stdout.write("\x1b[2K\rCross: {0}\n".format(cross))

        solver = F2LSolver(self.cube)
        for i, f2l_single in enumerate(solver.solve(), 1):
            sys.stdout.write("Solving F2L#{0} ......".format(i))
            result += f2l_single[1]
            sys.stdout.write("\x1b[2K\rF2L{0}: {1}\n".format(*f2l_single))

        solver = OLLSolver(self.cube)
        sys.stdout.write("Solving OLL ......")
        oll = solver.solve()
        result += oll
        sys.stdout.write("\x1b[2K\rOLL:  {0}\n".format(oll))

        solver = PLLSolver(self.cube)
        sys.stdout.write("\rSolving PLL ......")
        pll = solver.solve()
        result += pll
        sys.stdout.write("\x1b[2K\rPLL:  {0}\n".format(pll))

        sys.stdout.write("\nFULL: {0}\n".format(result.optimise()))

        if suppress_progress_messages:
            sys.stdout = save_stdout
        return result


if __name__ == '__main__':
    c = Cube()
    alg = Formula()
    random_alg = alg.random()
    c(random_alg)
    solver = CFOPSolver(c)
    solution = solver.solve(suppress_progress_messages=True)
    print(solution)
