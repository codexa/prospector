/* Globals
------------------------*/
// IO Namespace
var io = {};

// Misc
var storage, deviceAPI, locationDevice, docxeditor;


/* Init
------------------------*/
io.start = function (api, callback) {
  if (window.navigator.getDeviceStorage) {
    // Use deviceStorage API
    deviceAPI = 'deviceStorage';
    storage = navigator.getDeviceStorage('sdcard');
    if (!storage) {
      startIO('file', callback);
      return;
    }
    
    // Check for SD card
    var request = storage.available();

    request.onsuccess = function () {
      // The result is a string
      if (this.result != "available") {
        deviceAPI = null;
        storage = null;
        alert("The SDCard on your device is not available.");
        return;
      } else {
        callback(null, storage);  
        return;    
      }
    };

    request.onerror = function () {
      deviceAPI = null;
      storage = null;
      alert("Unable to get the space used by the SDCard: " + this.error);
      return;
    };
  } else {
      // If nonexistent, disable internal storage
      deviceAPI = 'none';
      callback('Storage method is unavailable');
      return;
  }
};


/* Directory IO
------------------------*/
io.enumerate = function (directory, callback) {
  if (directory) {
    // List of files
    var FILES = [];
    
    // Put directory in proper form
//    if (directory.length > 1 && directory[0] == '/') {
//      directory = directory.slice(1);
//    }
    if (directory[directory.length - 1] != '/') {
      directory = (directory + '/');
    }
  
    if (deviceAPI == 'deviceStorage') {
      // Get all the files in the specified directory
      if (directory == '/') {
        var cursor = storage.enumerate();
      } else {
        var cursor = storage.enumerate(directory.substring(0, -1));
      }
    
      cursor.onerror = function() {
        if (cursor.error.name == 'TypeMismatchError') {
          return;
        } else if (cursor.error.name == 'SecurityError') {
          alert('Please allow Prospector to access your SD card.');
        } else {
          alert('Load unsuccessful :\'( \n\nInfo for gurus:\n"' + cursor.error.name + '"');
        }
      };
      cursor.onsuccess = function() {
        // Get file
        var file = cursor.result;
      
        // Base case
        if (!cursor.result) {            
          // Finish
          callback(FILES);
          return FILES;
        }
        
        // Split name into parts
        var thisFile = io.split(file.name);
        thisFile[3] = file.type;
        
        // Don't get system files or root directories
        if (!thisFile[1] |
             thisFile[1] == '' |
             thisFile[2] == '.DS_STORE' |
             thisFile[0].contains(directory) != true) {
          cursor.continue();
          return;        
        }
        
        // Only get files in the current folder
        if (thisFile[0] != directory) {          
          // Split directory into current directory and folder
          if (thisFile[0].contains(directory) && directory != '/') {
            var regRemove = new RegExp(directory);
            thisFile[1] = thisFile[0].replace(regRemove, '');
            thisFile[0] = directory;
          } else {
            thisFile[1] = thisFile[0];
            thisFile[0] = directory;
          } 
          
          //TungBS: added this to fix error
          if (thisFile[1].length > 1 && thisFile[1][0] == '/') {
            thisFile[1] = thisFile[1].slice(1);
          }
          
          // Remove descendants of descendants
          while (thisFile[1].contains('/')) {
            thisFile[1] = thisFile[1].substring(0, thisFile[1].lastIndexOf('/'));
          }
          
          // Remove duplicates
          for (var i = 0; i < FILES.length; i++) {
            if (FILES[i][0] == directory && FILES[i][1] == thisFile[1] && FILES[i][2] == 'folder') {
	          FILES.splice(i, 1);
	          break;
	        }
          }
          
          // Add folder to the list
          FILES.push([directory, thisFile[1], 'folder']);
          
          cursor.continue();
          return; 
        }
        
        // Remove duplicates
        for (var i = 0; i < FILES.length; i++) {
          if (FILES[i][0] == thisFile[0] && FILES[i][1] == thisFile[1] && FILES[i][2] == thisFile[2]) {
	        FILES.splice(i, 1);
	        break;
	      }
        }
        
        // Add to list of files
        FILES.push(thisFile);
      
        // Check next file
        cursor.continue();
      };
    }
    
    return FILES;
  }
};


/* File IO
------------------------*/
io.delete = function (name, callback) {
  var path = name;
  if (deviceAPI == 'deviceStorage') {
    var req = storage.delete(path);
    req.onsuccess = function () {
      callback();
    }
    req.onerror = function () {
      callback(this.error.name);
    }
  }
};

io.rename = function (directory, name, type, newname, newtype) {
  io.load(directory, name, type, function(result) {
    var fullName = (directory + name + type);
    io.save(directory, newname, newtype, result, function(){});
    io.delete(fullName);
  });
};

io.load = function (directory, filename, filetype, callback) {
  var filePath = (directory + filename + filetype);
  if (deviceAPI == 'deviceStorage') {
    var req = storage.get(filePath);
    req.onsuccess = function () {
      callback(req.result);
    };
    
    req.onerror = function () {
      if (this.error.name == "NotFoundError") {
        // New file, leave user to edit and save it
      }
      else {
        alert('Load unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
      }
    };
  }
}

io.split = function (path) {
  var file = new Array();
  file[0] = path.substring(0, (path.lastIndexOf('/') + 1));
  file[1] = path.substring((path.lastIndexOf('/') + 1), path.lastIndexOf('.')).replace(/\//, '');
  file[2] = path.substring(path.lastIndexOf('.'), path.length).replace(/\//, '');
  if (file[1] == '' && file[2] == '') {
    file[0] = (file[0] + file[2]);
    if (file[0][file[0].length - 1] != '/') {
      file[0] = (file[0] + '/');
    }
    file[1] = '';
    file[2] = '';
  }
  return [file[0], file[1], file[2]];
};
