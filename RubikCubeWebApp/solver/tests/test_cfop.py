# -*- coding: utf-8 -*-
from unittest import TestCase
from RubikCubeWebApp.solver.cfop.cfop_solver import CFOPSolver


class TestCFOPSolver(TestCase):
    """测试CFOP公式法能否正确解魔方"""

    def test_solve(self):
        strings = [
            'RFLDUUFBLURRFLRFURUUUBFLBLLBRFBRDFDBURBFBLLLDDUDFDBRDD',
            'ULBBUDULFLDRFLFUUBBDDLFFLDDRRRRRBLLRDBBRBUFULDFFBDUFRU',
            'FBRRUBDFBUDFULDLDBLRDFFFRRBLRFLRBUBRDURDBLBFFUULLDLUUD',
            'LBUFULLRDFDBDLULBRDBRFFUFDBFBRLRFDRFBUDRBLLLUURRDDUBFU'
        ]
        solutions = [
            "U' R2 F2 D F' R B' R' U F' U F U R U' R' U B U' B' U2 B U B' U' B' U' B L U2 L' B' U' B U2 F U' F' U2 F R' F R F2 U2 L F' L' F U F2 B2 D F2 B2 U F' B L2 F2 B2 R2 F' B U2",
            "F' R' U2 D' R' D2 F2 R' F' D2 L U L' F' U F U B' U B U B U B' U B' U2 B U B' U2 B U' F U' F' U F U F' U2 B L F' L F L' F' L F L2 B' U' L' U' B' L U L' U' L' B L2 U' L' U' L U L' U L",
            "U2 R D F' D B' D R' D2 U F' U2 F U F' U' F B U B' R' U' R U2 L U2 L' U2 L U' L' F U' F' U F U' F' U' L F U F' U L' U2 L' B L B' U2 L' U2 L U2 L' B L U L' U' L' B' L2 U'",
            "F B' U2 R' F2 D' R' F' B U B' U2 B U2 B' U2 F' U' F U' B U' B' U2 R' U' R B' U B U2 B' U' B U' L' U' L U L' U2 L U B2 U' B R B' U B2 U' B' R' B U2 F2 D' L U' L U L' D F2 R U' R'"
        ]
        for i in range(len(strings)):
            self.assertEqual(CFOPSolver(strings[i]).solve(), solutions[i])
