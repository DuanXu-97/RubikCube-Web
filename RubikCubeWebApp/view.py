# -*- coding: utf-8 -*-
import sys
sys.path.append('./')
import os
from .settings import BASE_DIR
from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import View
from .calculate_states.main import calculate_states, simple_check_input, refine_soln
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

class IndexView(View):
    def get(self, request):
        context = dict()
        return render(request, 'index.html', context)


class SolveCubeView(View):
    def post(self, request):
        state_str = str(request.POST.get('state_str'))
        method_type = int(request.POST.get('method_type'))

        # CFOP
        if method_type == 1:
            try:
                solver = CFOPSolver(state_str)
                moves = str(solver.solve())
            except Exception as e:
                print(e)
                return HttpResponse('{"code": -1, "message":"Solve failed, please try again."}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"Solve succeed.", "moves":"' + moves + '"}', content_type='application/json')


        # Kociemba
        elif method_type == 2:
            try:
                solver = KociembaSolver(state_str)
                moves = solver.solve()
            except Exception as e:
                print(e)
                return HttpResponse('{"code": -1, "message":"Solve failed, please try again."}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"Solve succeed.", "moves":"' + moves + '"}', content_type='application/json')


        # DeepCubeA
        elif method_type == 3:
            state_by_id = calculate_states(state_str)
            try:
                temp_moves, _, _ = deepcubea(state_by_id)
                moves = refine_soln(temp_moves)
            except AssertionError:
                return HttpResponse('{"code": -1, "message":"Illegal solution."}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"Solve succeed.", "moves":"' + moves + '"}', content_type='application/json')

        # Formula
        elif method_type == 0:
            state_str = request.POST.get('state_str')
            pass

        else:
            return HttpResponse('{"code": -1, "message":"Method not exists"}', content_type='application/json')


class VerifyLegality(View):
    def post(self, request):
        state_str = request.POST.get('state_str')
        method_type = int(request.POST.get('method_type'))

        is_legal = simple_check_input(state_str)
        if is_legal is False:
            return HttpResponse('{"code": -1, "message":"Illegal Rubik cube status"}', content_type='application/json')
        else:
            return HttpResponse('{"code": 1, "message":"legal Rubik cube status"}', content_type='application/json')






