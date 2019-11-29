# -*- coding: utf-8 -*-
from unittest import TestCase

from RubikCubeWebApp.calculate_states.cube_string import CubeString


class TestCubeString(TestCase):
    """CubeString类单元测试"""

    def test_reorder(self):
        input_str = 'UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'
        test_cases = {
            'UDLRBF': 'UUUUUUUUUDDDDDDDDDLLLLLLLLLRRRRRRRRRBBBBBBBBBFFFFFFFFF',
            'UDLBFR': 'UUUUUUUUUDDDDDDDDDLLLLLLLLLBBBBBBBBBFFFFFFFFFRRRRRRRRR',
            'DLBFRU': 'DDDDDDDDDLLLLLLLLLBBBBBBBBBFFFFFFFFFRRRRRRRRRUUUUUUUUU',
            'BFRUDL': 'BBBBBBBBBFFFFFFFFFRRRRRRRRRUUUUUUUUUDDDDDDDDDLLLLLLLLL'
        }
        for order, expect in test_cases.items():
            self.assertEqual(CubeString(input_str).reorder(ordering=order), expect)
