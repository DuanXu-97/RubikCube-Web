# -*- coding: utf-8 -*-
from unittest import TestCase

from RubikCubeWebApp.solver.kociemba.kociemba_solver import KociembaSolver


class TestKociembaSolver(TestCase):
    """测试Kociemba算法能否正确解魔方"""

    def test_solve(self):
        strings = [
            'RFLDUUFBLURRFLRFURUUUBFLBLLBRFBRDFDBURBFBLLLDDUDFDBRDD',
            'ULBBUDULFLDRFLFUUBBDDLFFLDDRRRRRBLLRDBBRBUFULDFFBDUFRU',
            'FBRRUBDFBUDFULDLDBLRDFFFRRBLRFLRBUBRDURDBLBFFUULLDLUUD',
            'LBUFULLRDFDBDLULBRDBRFFUFDBFBRLRFDRFBUDRBLLLUURRDDUBFU',
            'BLFLUFDLRRFFDLFLDRLBDRFFFRDBUDDRUBBURUUBBLFUUUBLRDDBRL'
        ]
        solutions = [
            "U2 R' B2 R U D' B U2 R L2 U F' U F2 D R2 U' B2 R2 U2 R2 D'",
            "U F' L' B2 R B U' R2 D' R' F' L' U2 D' F2 L2 B2 R2 U2 B2 U' L2",
            "R2 U F B R L D F' B R F L2 U2 R2 B2 R2 D B2 U2 D",
            "D' R2 U2 F D' R' F R2 F2 B' L U L2 U' R2 U' R2 F2 D L2 U'",
            "U' F' B' D R' L' F D' L2 F' L F2 D2 F2 R2 U' D2 F2 D F2 L2"
        ]
        for i in range(len(strings)):
            self.assertEqual(KociembaSolver(strings[i]).solve(), solutions[i])
