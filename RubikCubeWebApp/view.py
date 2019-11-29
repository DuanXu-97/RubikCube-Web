# -*- coding: utf-8 -*-
import sys
sys.path.append('./')
import os
from .settings import BASE_DIR
from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import View
from .calculate_states.main import calculate_states, simple_check_input
from .solver.deepcubea.scripts.solveStartingStates import runMethods as deepcubea
from .solver.kociemba.kociemba_solver import KociembaSolver
from .solver.cfop.cfop_solver import CFOPSolver
import logging
import json

try:
    import cPickle as pickle
except:
    import pickle


# logging.basicConfig(level=logging.DEBUG,
#                     format='%(asctime)s  %(filename)s : %(levelname)s  %(message)s',
#                     datefmt='%a, %d %b %Y %H:%M:%S',
#                     filename="/var/www/RubikCubeWebApp/log.log",
#                     filemode='w')

with open(os.path.join(BASE_DIR, 'RubikCubeWebApp/solver/deepcubea/states_by_id.pkl'), "rb") as f:
    inputData = pickle.load(f)
    deepcubea_states = inputData['states']


class IndexView(View):
    def get(self, request):
        context = dict()
        return render(request, 'index.html', context)


class SolveCubeView(View):
    def post(self, request):
        state_str = request.POST.get('state_str')
        method_type = int(request.POST.get('method_type'))

        # CFOP
        if method_type == 1:
            try:
                solver = CFOPSolver(state_str)
                moves = solver.solve()
            except Exception as e:
                print(e)
                return HttpResponse('{"code": -1, "message":"求解失败请重试"}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"成功", "moves":"' + moves + '"}', content_type='application/json')


        # Kociemba
        elif method_type == 2:
            try:
                solver = KociembaSolver(state_str)
                moves = solver.solve()
            except Exception as e:
                print(e)
                return HttpResponse('{"code": -1, "message":"求解失败请重试"}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"成功", "moves":"' + moves + '"}', content_type='application/json')


        # DeepCubeA
        elif method_type == 3:

            id_seq = calculate_states(state_str)

            try:
                moves, _, _ = deepcubea(id_seq)
            except AssertionError:
                return HttpResponse('{"code": -1, "message":"解法不合法"}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"成功", "moves":"' + moves + '"}', content_type='application/json')

        # Formula
        elif method_type == 0:
            state_str = request.POST.get('state_str')
            pass

        else:
            return HttpResponse('{"code": -1, "message":"方法不存在"}', content_type='application/json')


class VerifyLegality(View):
    def post(self, request):
        state_str = request.POST.get('state_str')
        method_type = int(request.POST.get('method_type'))

        is_legal = simple_check_input(state_str)
        if is_legal is False:
            return HttpResponse('{"code": -1, "message":"魔方状态不合法"}', content_type='application/json')
        else:
            if method_type == 3:

                id_seq = calculate_states(state_str)
                if id_seq is None:
                    return HttpResponse('{"code": -1, "message":"魔方状态不合法"}', content_type='application/json')

                is_solvable = False
                for state in deepcubea_states:
                    if id_seq == state.tolist():
                        is_solvable = True
                if is_solvable is False:
                    return HttpResponse('{"code": 2, "message":"该状态搜索时间较长，已转为公式法"}', content_type='application/json')

                else:
                    return HttpResponse('{"code": 1, "message":"可采用DeepCubeA求解", "id_seq":"' + str(id_seq) + '"}', content_type='application/json')
            else:
                return HttpResponse('{"code": 1, "message":"魔方状态合法"}', content_type='application/json')

                




