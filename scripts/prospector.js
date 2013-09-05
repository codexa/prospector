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

// Sieve
var sieve, pickActivity;

// Misc
var deviceType;
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var fileArea, fileBox, fileEdit, docList, editState, currentDirectory, currentDirectoryDisplay;
var folderTree, isInitialized;
prospector.initialized = new CustomEvent('prospector.initialized');


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
  if (window.location.pathname == '/sieve.html') {
    sieve = true;
  }
   
  // Find device type
  checkDevice();
  
  // Select important elements
  fileArea = document.getElementById('file-area')
  fileBox = document.getElementById('file-box');
  currentDirectory = document.getElementById('current-directory');
  if (sieve != true) {
    currentDirectoryDisplay = document.getElementById('current-directory-display');
  }
  
  // Initialize IO
  io.start(null, function(error, storage) {
    if (!error) {
      // Navigate to the main screen
      nav('welcome');
    
      // Open root
      prospector.openDirectory('/');
      
      // Add listener
      storage.onchange = function (change) {
        prospector.openDirectory(currentDirectory.textContent);
      }
      
      // Dispatch initialized event
      window.dispatchEvent(prospector.initialized);
      isInitialized = true;
    } else {
      // Navigate to the main screen
      nav('welcome');
    }
  });
  
  // Add event listeners
  fileArea.addEventListener(
    'contextmenu', function contextmenu(event) {
      editDocs();
    }
  );
};

function editDocs() {
  fileArea = document.getElementById('file-area'),
  fileEdit = document.getElementById('edit-mode'),
  docList = document.querySelectorAll('[data-type="list"]');
  if (editState == true) {
    editState = false;
    fileEdit.className="";
    fileArea.style.display = 'block';
  } else {
    fileEdit.className="current";
    for(var i=0; i<docList.length; i++){
      docList[i].className="danger";
    }
    fileArea.style.display = 'block';
    editState = true;
  }
}

/* File lists
------------------------*/
prospector.openDirectory = function (directory, backwards) {
  // Generate file list
  io.enumerate((directory), function(FILES) {
    if (backwards == true) {
      prospector.buildFileList(FILES, [fileArea.firstElementChild], 'Files Found');
      
      // Animation!
      var removedNode = fileArea.removeChild(fileArea.lastElementChild);
      fileArea.insertBefore(removedNode, fileArea.children[0]);
    } else {
      prospector.buildFileList(FILES, [fileArea.lastElementChild], 'Files Found');
      
      // Animation!
      var removedNode = fileArea.removeChild(fileArea.firstElementChild);
      fileArea.appendChild(removedNode);
    }
  });
  
  // Update displays
  if (sieve != true) {
    if (directory == '/') {
      currentDirectoryDisplay.textContent = '/';
    } else {
      currentDirectoryDisplay.textContent = directory.substring((directory.lastIndexOf('/') + 1));
    }
  }
  currentDirectory.textContent = directory;
  window.title = (directory + ' - Prospector');
  
  // Add to folderTree
  folderTree = directory;
  
  // Different actions for Prospector and Sieve
  if (sieve == true) {
    // Change function of back button
    if (folderTree != '/') {
      document.querySelector('#back-button .icon').setAttribute('data-icon', 'back');
    } else {
      document.querySelector('#back-button .icon').setAttribute('data-icon', 'close');  
    }
  } else {
    // Enable/disable back button
    if (folderTree != '/') {
      document.getElementById('back-button').classList.remove('disabled');
    } else {
      document.getElementById('back-button').classList.add('disabled');  
    }
  }
};

prospector.buildFileList = function (FILES, listElms, display) {  
  if (listElms && FILES) {
    var output = '<ul>';  
  
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
        output += fileItem(FILES[f][0], FILES[f][1], FILES[f][2], FILES[f][3]);
      }
    } else {
      // No docs message
      output = '<ul><li style="margin-top: 1rem;" class="noLink">';
      output += '<p>No ' + display + '</p>';
      output += '</li></ul>';      
    }
    
    // Display output HTML
    for (var i = 0; i < listElms.length; i++) {
      listElms[i].innerHTML = (output + '</ul>');
    }
  }
};

function fileItem(directory, name, type, mime) {
  var output = '', shownDirectory, shownType, iconGroup, icon;
  if (directory && name && type) {
    // Display refinements
    if (directory.charAt(0) == '/') {
      shownDirectory = directory;
    } else {
      shownDirectory = directory;
    }
    name = name.replace(/\//gi, '');
    
    // Type handling
    if (type == 'folder') {
      icon = 'folder';
      shownType = '';
    } else {
      shownType = type;
    }
    
    // Generate item
    if (sieve == true) {
      output = '<li class="file-list-item" data-click="sieve-select" data-click-directory="'+directory+'" data-click-name="'+name+'" data-click-extension="'+type+'" data-click-mime="'+mime+'">';
      output += '<a href="#">';
      output += '<div class="file-item-info">';
      if (type != 'folder') {
        output += '<aside class="pack-end"><input type="checkbox" /></aside>';
      }
    } else {
      output = '<li class="file-list-item" data-click="open" data-click-directory="'+directory+'" data-click-name="'+name+'" data-click-extension="'+type+'" data-click-mime="'+mime+'">';
      output += '<a href="#">';
      output += '<div class="file-item-info">';
    }
    if (icon) {
      output += '<aside class="file-item-icon" data-icon="'+icon+'"></aside>';
    }
    output += '<p class="file-item-name">'+name+shownType+'</p>'; 
    output += '<p class="file-item-type">'+shownDirectory+name+shownType+'</p>';
    output += '</div>'; 
    output += '</a></li>';  
  }
  return output;
}


/* File actions
------------------------*/
prospector.open = function (dir, name, type, mime) {
  if (dir && name && type && mime) {
    // Open with Web Activities
    var activity = new MozActivity({  
      // Ask for the "open" activity
      name: "open",

      // Provide the data required by the filters of the activity
      data: {
        path: (dir + name + type),
        type: mime
      }
    });

    activity.onsuccess = function() {
      console.log('File has been closed.');
    };

    activity.onerror = function() {
      console.log(this.error);
    };
  }
};


/* Web Activities
------------------------*/ 
navigator.mozSetMessageHandler('activity', function(activityRequest) {
  var activity = activityRequest.source;
  
  // Wait for Prospector to be initialized
  window.addEventListener('prospector.initialized', function () {
    // Handle activities
    if (activity.name === "open") {
      // Open folder
      prospector.openDirectory(activity.data.path);
    } else if (activity.name === "pick") {
      // Sieve
      pickActivity = activityRequest;
    }
  });
  if (isInitialized == true && sieve != true) {
    window.dispatchEvent(prospector.initialized);
  }
});


/* Actions
------------------------*/ 
document.addEventListener('click', function(event) {
  processActions('data-click', event.target);
});

document.addEventListener('submit', function(event) {
  processActions('data-submit', event.target);
});

document.addEventListener('keypress', function(event) {
  if (event.key == 13 | event.keyCode == 13) {
    processActions('data-enter', event.target);
  }
});

document.addEventListener('mousedown', function(event) {
  processActions('data-mouse-down', event.target);
});

document.addEventListener('change', function(event) {
  processActions('data-change', event.target);
});

document.addEventListener('focus', function(event) {
  processActions('data-focus', event.target);
});

document.addEventListener('blur', function(event) {
  processActions('data-blur', event.target);
});

function processActions(eventAttribute, target) {
  if (target && target.getAttribute) {
    if (target.hasAttribute(eventAttribute) != true) {
      while (target.parentNode && target.parentNode.getAttribute) {
        target = target.parentNode;
        if (target.hasAttribute(eventAttribute)) {
          break;
        }
      }
    }
    var calledFunction = target.getAttribute(eventAttribute);
    if (calledFunction == 'open') {
      // Special folder action
      if (target.getAttribute(eventAttribute+'-extension') == 'folder') {
        prospector.openDirectory(target.getAttribute(eventAttribute+'-directory') + target.getAttribute(eventAttribute+'-name'));
      } else {
        prospector.open(target.getAttribute(eventAttribute+'-directory'), target.getAttribute(eventAttribute+'-name'), target.getAttribute(eventAttribute+'-extension'), target.getAttribute(eventAttribute+'-mime'));
      }
    } else if (calledFunction == 'previous') {
      if (folderTree.length > 0) {
        // Take out current folder
        var tempDir = folderTree.substring(0, folderTree.lastIndexOf('/'));
        if (!tempDir | tempDir == '') {
          tempDir = '/';
        }
              
        // Open parent folder
        prospector.openDirectory(tempDir, true);
      }
    } else if (calledFunction == 'close') {
      // Clear file box
      fileBox.innerHTML = '<span style="color: red;">Not supported...</span>';
      fileBox.setAttribute('style', '');
      fileBox.setAttribute('data-file-type', '');
      document.getElementById('current-file-display').textContent = 'No file open';
      navBack();
    } else if (calledFunction == 'sieve-select') {
      // Special folder action
      if (target.getAttribute(eventAttribute+'-extension') == 'folder') {
        prospector.openDirectory(target.getAttribute(eventAttribute+'-directory') + target.getAttribute(eventAttribute+'-name'));
      } else {
        // Select item (TBD)
        // Close Sieve
        pickActivity.postResult(target.getAttribute(eventAttribute+'-directory') + target.getAttribute(eventAttribute+'-name') + target.getAttribute(eventAttribute+'-extension'));
        pickActivity = null;
      }
    } else if (calledFunction == 'sieve-back') {
      if (folderTree != '/') {
        // Take out current folder
        var tempDir = folderTree.substring(0, folderTree.lastIndexOf('/'));
        if (!tempDir | tempDir == '') {
          tempDir = '/';
        }
              
        // Open parent folder
        prospector.openDirectory(tempDir, true);
      } else {
        // Close Sieve
        pickActivity.postResult(null);
        pickActivity = null;
      }
    }
  }
}
