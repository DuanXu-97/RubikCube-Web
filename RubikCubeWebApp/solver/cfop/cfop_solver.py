# -*- coding: utf-8 -*-
from RubikCubeWebApp.solver.kociemba.kociemba_solver import KociembaSolver
from RubikCubeWebApp.solver.model.cube import Cube
from RubikCubeWebApp.solver.model.formula import Formula
from RubikCubeWebApp.solver.cfop.cross import CrossSolver
from RubikCubeWebApp.solver.cfop.f2l import F2LSolver
from RubikCubeWebApp.solver.cfop.oll import OLLSolver
from RubikCubeWebApp.solver.cfop.pll import PLLSolver


class CFOPSolver(object):
    """CFOP公式法求解三阶魔方"""

    def __init__(self, string):
        """
        初始化魔方

        :param string: 传入前端表示当前魔方状态的字符串，顺序为 ULFRBD
        """
        # 利用Kociemba库，获得从还原状态到当前状态的操作
        moves_to_random_state = KociembaSolver(string).get_moves_to_random_state()
        print(moves_to_random_state)
        print(type(moves_to_random_state))
        moves = Formula(moves_to_random_state)
        # 执行上一步得到的操作，得到待解的魔方
        self.cube = Cube().perform_algo(moves)

    def solve(self):
        """
        CFOP公式法解魔方，平均耗时：15.9455s

        :return: 返回步骤字符串
        """
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
    s = 'LLLBUUUBBDRFRLFBFBRDRUFRRUFDLDDRBRLLFDBLBFUULUBDDDFURF'
    print(CFOPSolver(s).solve())
