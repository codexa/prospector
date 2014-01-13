/*
* Regions
* Navigation handler
* Copyright (C) Codexa Organization 2013 - 2014.
*/

'use strict';


/* Namespace Container
------------------------*/ 
var regions = {};


/* Variables
------------------------*/
regions.history = new Array();
var tempLoc = '';


/* Navigation
------------------------*/
regions.nav = function (location) {
  tempLoc = '';
  if (document.getElementById(location)) {
    tempLoc = location;
    if (document.querySelector('.current') && document.querySelector('.current').getAttribute('data-state') == 'drawer') {
      regions.sidebar(document.querySelector('[data-type=sidebar].active').id.replace(/sidebar_/, ''));
      setTimeout(function() { nav2(); }, 500);
    } else {
      nav2();
    }
  }
};

function nav2() {   
  if (document.getElementById(tempLoc)) { 
    if (document.querySelector('.current')) {
      if (document.getElementById(tempLoc).getAttribute('role') != 'region') {
        document.querySelector('.current').classList.add('parent');
      } else {        
        document.querySelector('.current').classList.remove('parent');
      }
      document.querySelector('.current').classList.remove('current');
    }
    if (document.querySelector('.parent') && document.getElementById(tempLoc).getAttribute('role') == 'region') {
      document.querySelector('.parent').classList.remove('parent');
    }
    regions.history.push(tempLoc);
    document.getElementById(tempLoc).classList.add('current');
    
    /* Remove this section when porting to other projects */   
    /* End of customized section */
  }
}

regions.navBack = function () {
  document.querySelector('.current').classList.remove('parent');
  document.querySelector('.current').classList.remove('current');
  regions.history.pop();
  
  // This is a weird way to do this, but I couldn't figure out a better one.
  regions.nav(regions.history.pop());
}

regions.sidebar = function (name, state) {
  if (document.getElementById('sidebar_' + name) && document.querySelector('.current')) {
    if ((state && (state != 'open' || state == 'close')) || 
    	(!state && document.querySelector('.current').getAttribute('data-state') == 'drawer')) {
      document.getElementById('sidebar_' + name).classList.remove('active');
      document.querySelector('.current').setAttribute('data-state', 'none');
    } else {
      document.getElementById('sidebar_' + name).classList.add('active');
      document.querySelector('.current').setAttribute('data-state', 'drawer'); 
      if (document.getElementById('sidebar_' + name).getAttribute('data-position') == 'right') {
        document.querySelector('.current').setAttribute('data-position', 'right'); 
      }
    }
  }
};

regions.tab = function (list, name) {
  if (document.getElementById('tab-'+name)) {
    if (document.querySelector('.selected')) {
      document.querySelector('.selected').classList.remove('selected');
    }
    document.getElementById('tab-'+name).classList.add('selected');
    
    /* Remove this section when porting to other projects */
    /* End of customized section */
  }
};
