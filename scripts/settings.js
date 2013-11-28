/*
* Settings
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Namespace Container
------------------------*/ 
prospector.settings = {};


/* Settings
------------------------*/
prospector.settings.get = function (name) {
  name = ("prospector.settings."+name);
  return localStorage.getItem(name);
};

prospector.settings.save = function (name, value) {
  name = ("prospector.settings."+name);
  localStorage.setItem(name, value);
};
