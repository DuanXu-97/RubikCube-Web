# -*- coding: utf-8 -*-
import kociemba

from RubikCubeWebApp.calculate_states.cube_string import CubeString


class KociembaSolver:
    """Herbert Kociemba's two-phase 算法求解三阶魔方"""

    solved_state = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'

    def __init__(self, string):
        self.string = CubeString(string, ordering='ULFRBD').reorder(ordering='URFDLB')

    def solve(self):
        return kociemba.solve(self.string)

    def get_moves_to_random_state(self):
        """获得从魔方的初始状态到任意状态的解法步骤"""
        return kociemba.solve(self.solved_state, self.string)
