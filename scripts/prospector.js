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
var sieve, pickActivity, path, multiple, filter = [], sieveSelection = [];

// Misc
var deviceType;
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var fileArea, docList, currentDirectory, currentDirectoryDisplay;
var editState, editSelection = [];
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
  // Initialize Bugsense
  var bugsense = new Bugsense( { appversion: '0.1', apiKey: '' } );
  
  // Detect sieve
  if (window.location.pathname == '/sieve.html') {
    sieve = true;
  }
   
  // Find device type
  checkDevice();
  
  // Select important elements
  fileArea = document.getElementById('file-area');
  currentDirectory = document.getElementById('current-directory');
  if (sieve != true) {
    // Select Prospector-only elements
    docList = document.querySelectorAll('[data-type="list"]');
    currentDirectoryDisplay = document.getElementById('current-directory-display');
  }
  
  // Initialize IO
  io.start(null, function(error, storage) {
    if (!error) {
      // Navigate to the main screen
      nav('welcome');
    
      // Open root
      prospector.openDirectory('/', 'none');
      
      // Add listener
      storage.onchange = function (change) {
        prospector.openDirectory(currentDirectory.textContent, 'none');
      }
      
      // Dispatch initialized event
      window.dispatchEvent(prospector.initialized);
      isInitialized = true;
    } else {
      // Navigate to the main screen
      nav('welcome');
    }
  });
  
  // Find user's list style preference, and apply
  var listStyle = prospector.settings.get('list.style');
  if (listStyle == 'list') {
    list();
  } else {
    grid();
  }
  
  if (sieve != true) {
    // Add event listeners
    fileArea.addEventListener(
      'contextmenu', function contextmenu(event) {
        editMode();
      }
    );
  }
  /*var pic,sdc,vid,mus,app;
  var marr = [
      pic = navigator.getDeviceStorage('pictures'),
      sdc = navigator.getDeviceStorage('sdcard'),
      vid = navigator.getDeviceStorage('videos'),
      mus = navigator.getDeviceStorage('music'),
      app = navigator.getDeviceStorage('apps')
      ];
  var compl;
  for (var i = 0; i < marr.length; i++) {
    for (var b = 0; b < marr[i].length; b++) {
      compl += marr[i][b];
    }
  }*/
}

/* Edit Mode
------------------------*/
function editMode() {
  // Clear file list
  var children = fileArea.childNodes;
  for (var i = 0; i < children.length; i++) {
    children[i].innerHTML = '';
  }
  
  // Change mode
  if (editState == true) {
    editState = false;
    editSelection = [];
    prospector.openDirectory(currentDirectory.textContent, 'none');
    navBack();
    document.querySelector('#welcome [role="main"]').classList.remove('edit-mode');
  } else {
    editState = true;
    prospector.openDirectory(currentDirectory.textContent, 'none');
    nav('edit-mode');
    document.querySelector('#welcome [role="main"]').classList.add('edit-mode');
  }
}


/* File lists
------------------------*/
prospector.openDirectory = function (directory, animation) {
  var fileList;
  
  // Show activity bar
  document.getElementById('progress').classList.remove('hidden');

  // Generate file list
  io.enumerate((directory), function(FILES) {
    // Select file list
    if (animation == 'none') {
      fileList = fileArea.children[1];    
    } else if (animation == 'reverse') {
      fileList = fileArea.firstElementChild;
    } else {
      fileList = fileArea.lastElementChild;
    }
    
    // Build file list
    prospector.buildFileList(FILES, [fileList], 'No files found, does this directory even exist?');
    
    // Animate
    if (animation == 'reverse') {
      var removedNode = fileArea.removeChild(fileArea.lastElementChild);
      fileArea.insertBefore(removedNode, fileArea.children[0]);
    } else if (animation != 'none') {
      var removedNode = fileArea.removeChild(fileArea.firstElementChild);
      fileArea.appendChild(removedNode);
    }
    
    // Hide activity bar
    document.getElementById('progress').classList.add('hidden');
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
  if (sieve == true && path) {
    var pathRegExp = new RegExp(path);
    folderTree = folderTree.replace(pathRegExp, '');
  }
  
  // Enable/disable back button
  if (folderTree.length > 0 && folderTree != '/') {
    document.getElementById('back-button').classList.remove('disabled');
  } else {
    document.getElementById('back-button').classList.add('disabled');  
  }
};

prospector.buildFileList = function (FILES, listElms, display) {  
  if (listElms && FILES) {
    var output = '<ul>';  
  
    // Make sure list is the right type of list
    for (var i = 0; i < listElms.length; i++) {
      if (editState == true) {
        if (listElms[i].getAttribute('data-edit') != 'true') {
          listElms[i].setAttribute('data-edit', 'true');
        }      
      } else {
        if (listElms[i].getAttribute('data-edit') != 'false') {
          listElms[i].setAttribute('data-edit', 'false');
        }
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
      output = '<p style="text-align: center; font-size: 1.8rem; padding: 1rem;">' + display + '</p>';
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
      icon = 'file';
      shownType = type;
    }
    
    // Generate item
    if (editState == true) {
      output = '<li class="file-list-item" data-click="select" data-click-directory="'+directory+'" data-click-name="'+name+'" data-click-extension="'+type+'" data-click-mime="'+mime+'">';
      output += '<a href="#">';
      output += '<div class="file-item-info">';
      if (icon) {
        output += '<aside class="file-item-icon" data-icon="'+icon+'"></aside>';
      }
      output += '<p><span class="file-item-name">'+name+'</span>';
      output += '<span class="file-item-extension">'+shownType+'</span></p>'; 
      output += '<p class="file-item-path">'+shownDirectory+name+shownType+'</p>';
      output += '</div>'; 
      output += '</a></li>';  
    
    } else {
      if (sieve == true) {
        output = '<li class="file-list-item" data-click="sieve-select" data-click-directory="'+directory+'" data-click-name="'+name+'" data-click-extension="'+type+'" data-click-mime="'+mime+'">';
        output += '<a href="#">';
        output += '<div class="file-item-info">';
      } else {
        output = '<li class="file-list-item" data-click="open" data-click-directory="'+directory+'" data-click-name="'+name+'" data-click-extension="'+type+'" data-click-mime="'+mime+'">';
        output += '<a href="#">';
        output += '<div class="file-item-info">';
      }
      if (icon) {
        output += '<aside class="file-item-icon" data-icon="'+icon+'"></aside>';
      }
      output += '<p><span class="file-item-name">'+name+'</span>';
      output += '<span class="file-item-extension">'+shownType+'</span></p>'; 
      output += '<p class="file-item-path">'+shownDirectory+name+shownType+'</p>';
      output += '</div>'; 
      output += '</a></li>';  
    }
  }
  
  return output;
}


/* File actions
------------------------*/
prospector.open = function (dir, name, type, mime) {
  if (dir && name && type && mime) {
  
    io.load(dir, name, type, function (result) {
      // Open with Web Activities
      var activity = new MozActivity({  
        // Ask for the "open" activity
        name: "open",

        // Provide the data required by the filters of the activity
        data: {
          url: (dir + name + type),
          blob: result,
          type: mime
        }
      });

      activity.onsuccess = function() {
        console.log('File has been closed.');
      };

      activity.onerror = function() {
        alert(this.error.name);
      };
    });
  }
};


/* Web Activities
------------------------*/ 
if (navigator && navigator.mozSetMessageHandler) {
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
        multiple = activity.data.multiple;
        if (activity.data.path) {
          path = activity.data.path;
          prospector.openDirectory(path);      
        }
      }
    });
    if (isInitialized == true && sieve != true) {
      window.dispatchEvent(prospector.initialized);
    }
  });
}


/* Lists
------------------------*/ 
function grid() {
  // Change to grid display
  if (document.getElementById("list-button") != null) {
	var gridy = document.getElementById('list-button');
	fileArea.setAttribute('data-type', 'grid');
	gridy.setAttribute("data-click", "list");
	gridy.childNodes[0].setAttribute("data-icon", "list");
  
    // Save preference
    prospector.settings.save('list.style', 'grid');
  }
}

function list() {
  // Change to list display
  if (document.getElementById("list-button") != null) {
	var listy = document.getElementById('list-button');
	fileArea.setAttribute('data-type', 'list');
	listy.setAttribute("data-click", "grid");
	listy.childNodes[0].setAttribute("data-icon", "grid");
  
    // Save preference
    prospector.settings.save('list.style', 'list');
  }
}


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
        prospector.openDirectory(tempDir, 'reverse');
      }
    } else if (calledFunction == 'back') {
      // Navigate to the previous region
      navBack();
    } else if (calledFunction == 'edit-mode') {
      // Change the edit mode
      editMode();
    } else if (calledFunction == 'select') {
	  // Get URI
	  if (target.getAttribute(eventAttribute+'-extension') == 'folder') {
	  	var selection = (target.getAttribute(eventAttribute+'-directory') + target.getAttribute(eventAttribute+'-name'));
	  } else {
	    var selection = (target.getAttribute(eventAttribute+'-directory') + target.getAttribute(eventAttribute+'-name') + target.getAttribute(eventAttribute+'-extension'));
	  }
	
	  if (target.classList.contains('selected')) {
	    // Deselect item
	    target.classList.remove('selected');
	  
	    // Remove from selection
	    for (var i = 0; i < editSelection.length; i++) {
	   	  if (editSelection[i] == selection) {
	  	    editSelection.splice(i, 1);
		    break;
		  }
	    }
	  } else {	
	    // Select item   
	    target.classList.add('selected');
	  
	    // Remove duplicates
	    for (var i = 0; i < editSelection.length; i++) {
		  if (editSelection[i] == selection) {
		    editSelection.splice(i, 1);
		    break;
		  }
	    }
	
	    // Add to selection
	    editSelection.push(selection);
	  }
    } else if (calledFunction == 'grid') {
      grid();
    } else if (calledFunction == 'list') {
      list();
    } else if (calledFunction == 'delete') {
      if (editSelection.length > 0) {
        // Confirm
        if (editSelection.length == 1) {
          var confirmDeletion = confirm('Do you want to delete this file?');
        } else {
          var confirmDeletion = confirm('Do you want to delete these files?');      
        }
        if (confirmDeletion == true) {
          // Delete files
          for (var i = 0; i < editSelection.length; i++) {
            io.delete(editSelection[i], function (error) {
              if (!error) {
                // Refresh
                prospector.openDirectory(currentDirectory.textContent, 'none');                
              } else {
                alert('There was an error in deleting '+editSelection[i]+'\n\nInfo:\n'+error);
              }
            });
          }
          
          // Empty selection
          editSelection = [];
        } else {
          // Cancel
          return;
        }        
      } else {
        alert('No files are selected.');
      }
    } else if (sieve == true && calledFunction == 'sieve-select') {
      // Special folder action
      if (target.getAttribute(eventAttribute+'-extension') == 'folder') {
        prospector.openDirectory(target.getAttribute(eventAttribute+'-directory') + target.getAttribute(eventAttribute+'-name'));
      } else {
        // Get URI     
        var selection = [target.getAttribute(eventAttribute+'-directory'), target.getAttribute(eventAttribute+'-name'), target.getAttribute(eventAttribute+'-extension')];

        if (target.classList.contains('selected')) {
          // Deselect item
          target.classList.remove('selected');
          
          // Remove from sieveSelection
          for (var i = 0; i < sieveSelection.length; i++) {
            if (sieveSelection[i][0] == selection[0] &&
                sieveSelection[i][1] == selection[1] &&
                sieveSelection[i][2] == selection[2]) {
	          sieveSelection.splice(i, 1);
	          break;
	          return;
	        }
          }
        } else {
          // If single file select, then remove other selections
          if (multiple != true) {
            sieveSelection = [];
            if (document.querySelector('.selected')) {
              document.querySelector('.selected').classList.remove('selected');
            }
          }
        
          // Select item   
          target.classList.add('selected');
          
          // Remove duplicates
          for (var i = 0; i < sieveSelection.length; i++) {
            if (sieveSelection[i][0] == selection[0] &&
                sieveSelection[i][1] == selection[1] &&
                sieveSelection[i][2] == selection[2]) {
	          sieveSelection.splice(i, 1);
	          break;
	        }
          }
        
          // Add to sieveSelection
          sieveSelection.push(selection);
        }
        
        // Toggle done/cancel button
        if (sieveSelection.length > 0) {
          document.querySelector('#done-button .icon').setAttribute('data-icon', 'checkmark');
        } else {
          document.querySelector('#done-button .icon').setAttribute('data-icon', 'close');        
        }
      }
    } else if (sieve == true && calledFunction == 'sieve-done') {
      if (sieveSelection && sieveSelection != '') {
        // Load blobs
        var files = [];
        for (var i = 0; i < sieveSelection.length; i++) {
          io.load(sieveSelection[i][0], sieveSelection[i][1], sieveSelection[i][2], function (blob) {
			// Return selection
			var file= {
				blob : blob,
				name : blob.name.substring(blob.name.lastIndexOf('/')+1)
				}   
            files.push(file);
            
            // Finish 
            if (i == sieveSelection.length) {
              // If single selection, convert blobs array to string
              if (files.length == 1) {
                files = files[0];
              }
        
              // Post result
              pickActivity.postResult(files);
              pickActivity = null; 
              sieveSelection = [];
              return;       
            }
          });

        }        
      } else {
        // Close Sieve
        pickActivity.postResult('ActivityCanceled');
        pickActivity = null;
        sieveSelection = [];
      }
    }
  }
}
