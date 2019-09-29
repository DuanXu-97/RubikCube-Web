from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import View
import logging
import json

# logging.basicConfig(level=logging.DEBUG,
#                     format='%(asctime)s  %(filename)s : %(levelname)s  %(message)s',
#                     datefmt='%a, %d %b %Y %H:%M:%S',
#                     filename="/var/www/RubikCubeWebApp/log.log",
#                     filemode='w')


class IndexView(View):
    def get(self, request):
        context = dict()
        return render(request, 'index.html', context)

