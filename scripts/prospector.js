/*
 * Prospector
 * Copyright (C) Codexa Organization 2013.
 * Licenced released under the GPLv3. 
 * See LICENSE in "resources/license/gpl.txt"
 * or at http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict';


/* Globals
------------------------*/
// Global Namespace
var prospector = {};

// Files Namespace
prospector.files = {};

// Misc
var deviceType;
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var fileArea, fileList;


/* Start
------------------------*/
window.addEventListener('DOMContentLoaded', function () { prospector.init(); });

function checkDevice() {
  var width, height;
  if (window.screen) {
    width = window.screen.availWidth;
    height = window.screen.availHeight;
  } else if (window.innerWidth && window.innerHeight) {
    width = window.innerWidth;
    height = window.innerHeight;
  } else if (document.body) {
    width = document.body.clientWidth;
    height = document.body.clientHeight;
  }  
  if (width <= 766) {      
    deviceType = 'mobile';  
  } else {
    deviceType = 'desktop';
  }
  
  if (window.opera) {
    alert('Warning: Your browser does not support some vital Prospector technology.  Please download Firefox from https://mozilla.org/firefox');
  }
}


/* Initalize
------------------------*/
prospector.init = function () {    
  // Find device type
  checkDevice();
  
  // Select important elements
  fileArea = document.getElementById('file-area');
  fileList = document.getElementById('file-list');
  
  // Initialize IO
  io.start(null, function(error) {
    if (!error) {
      // Navigate to the main screen
      nav('welcome');
    
      // Update File Lists
      prospector.files.update();
    } else {
      // Navigate to the main screen
      nav('welcome');
    }
  });
};


/* File lists
------------------------*/
prospector.files.update = function () {
  io.enumerate('/', function(FILES) {
    buildFileList(FILES, [fileList], 'Files Found');
  });
};

function buildFileList(FILES, listElms, display) {  
  if (listElms && FILES) {
    var output = '';  
  
    // Make sure list is not an edit list
    for (var i = 0; i < listElms.length; i++) {
      if (listElms[i].getAttribute('data-type') != 'list') {
        listElms[i].setAttribute('data-type', 'list');
      }
    }
        
    // Listify files!
    if (FILES.length > 0) {
      for (var f = 0; f < FILES.length; f++) {
        // Create item
        output += fileItem(FILES[f][0], FILES[f][1], FILES[f][2]);
      }
    } else {
      // No docs message
      output = '<li style="margin-top: 1rem;" class="noLink">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
      output += '</li>';      
    }
    
    // Display output HTML
    for (var i = 0; i < listElms.length; i++) {
      listElms[i].innerHTML = output;
    }
  }
}

function fileItem(directory, name, type) {
  var output, shownDirectory, iconGroup, icon;
  if (directory && name && type) {
    // Directory refinements
    if (directory.charAt(0) == '/') {
      shownDirectory = directory;
    } else {
      shownDirectory = directory;
    }
    
    // Find type extension (TBD)
    
    // Icon
    if (iconGroup == 'folder') {
      icon = 'folder';
    } else if (iconGroup == 'image') {
      // TBD code to generate icon from image
    } else {
      // TBD code to generate icon with filetype.
    }
    
    // Generate item
    output = '<li class="file-list-item" data-click="open" data-click-directory="'+directory+'" data-click-filename="'+name+'" data-click-filetype="'+type+'">';
    output += '<a href="#">';
    output += '<div class="file-item-info">';
    if (icon) {
      output += '<aside class="file-item-icon" data-icon="'+icon+'"></aside>';
    }
    output += '<p class="file-item-name">'+name+type+'</p>'; 
    output += '<p class="file-item-type">'+shownDirectory+name+type+'</p>';
    output += '</div>'; 
    output += '</a></li>';  
  }
  return output;
}
