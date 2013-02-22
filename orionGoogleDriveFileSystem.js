/*******************************************************************************
 * Google Drive FileSystem for Eclipse Orion
 * Author: Maciej Bendkowski <maciej.bendkowski@gmail.com>
 *******************************************************************************/
/*global window eclipse:true orion FileReader console GoogleDriveAPI OrionFile */

/** @namespace The global container for eclipse APIs. */
var eclipse = eclipse || {};

eclipse.OrionGoogleDriveFileSystem = (function() {
	/**
	 * @class Provides operations on files, folders, and projects.
	 * @name FileServiceImpl
	 */
	function OrionGoogleDriveFileSystem() {
		this._googleDriveAPI = new GoogleDriveAPI();
	}

	/**
	 * An implementation of the file service that understands the Orion 
	 * server file API. This implementation is suitable for invocation by a remote plugin.
	 */
	OrionGoogleDriveFileSystem.prototype = /**@lends eclipse.OrionGoogleDriveFileSystem.prototype */
	{
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @return A deferred that will provide the array of child objects when complete
		 */
		fetchChildren : function(location){
			console.log("Executing fetchChildren", location);
			var d = new orion.Deferred();
			var self = this;
			
			var rootFolder = new OrionFile();
			var fetchedChildren = [];

			/* load children */
			//TODO Load whole subtree at this point.
			self._googleDriveAPI.getChildren(location.split("/")[1], function(children){
				for(var i=0; i<children.items.length; ++i){
					var f = new OrionFile();
					f.importJSON(children.items[i]);
					fetchedChildren.push(f.exportJSON());
				}

				d.resolve(fetchedChildren);
			});		
			
			return d;
		},

		/**
		 * Loads the workspace with the given id and sets it to be the current
		 * workspace for the IDE. The workspace is created if none already exists.
		 * @param {String} location the location of the workspace to load
		 */
		loadWorkspace : function(location){
			console.log("Executing loadWorkspace", location);
			var d = new orion.Deferred();
			var self = this;
			
			var rootFolder = new OrionFile();
		
			/* load root metadata */
			if(location === "drive.google.com/"){
				this._googleDriveAPI.getRootFolderID(function(rootFolderID){
					self._googleDriveAPI.getFileMetadata(rootFolderID, function(fileMetadata){
						var f = new OrionFile();
						f.importJSON(fileMetadata);
						var df = self.fetchChildren(location + rootFolderID);
						df.then(function(children){
							f.Children = children;
							d.resolve(f);
						});
					});	
				});
			} else {
				this._googleDriveAPI.getFileMetadata(location.split("/")[1], function(fileMetadata){
					var f = new OrionFile();
					f.importJSON(fileMetadata);
					var df = self.fetchChildren(location);
					df.then(function(children){
						f.Children = children;
						d.resolve(f);
					});
				});	
			}
			
			return d;
		},

		/**
		 * Creates a folder.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} folderName The name of the folder to create
		 * @return {Object} JSON representation of the created folder
		 */
		createFolder : function(parentLocation, folderName){
			console.log("Executing createFolder");
			var d = new orion.Deferred();
			
			this._googleDriveAPI.createFile(parentLocation, folderName, false, function(folder){
				var f = new OrionFile();
				f.importJSON(folder);
				d.resolve(f.exportJSON());
			});
			
			return d;
		},

		/**
		 * Create a new file in a specified location. Returns a deferred that will provide
		 * The new file object when ready.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} fileName The name of the file to create
		 * @return {Object} A deferred that will provide the new file object
		 */
		createFile : function(parentLocation, fileName){
			console.log("Executing createFile", parentLocation, fileName);
			var d = new orion.Deferred();
			
			this._googleDriveAPI.createFile(parentLocation.split("/")[1], fileName, true, function(file){
				var f = new OrionFile();
				f.importJSON(file);
				d.resolve(f.exportJSON());
			});
			
			return d;
		},

		/**
		 * Deletes a file or directory.
		 * @param {String} location The location of the file or directory to delete.
		 */
		deleteFile : function(location){
			console.log("Executing deleteFile");
			var d = new orion.Deferred();
			
			this._googleDriveAPI.deleteFile(location.split("/")[1], function(resp){
				d.resolve();
			});
			
			return d;
		},

		/**
		 * Moves a file or directory.
		 * @param {String} sourceLocation The location of the file or directory to move.
		 * @param {String} targetLocation The location of the target folder.
		 * @param {String} [name] The name of the destination file or directory in the case of a rename
		 */
		moveFile : function(sourceLocation, targetLocation, name){
			console.log("Executing moveFile", sourceLocation, targetLocation, name);
			var d = new orion.Deferred();
			
			//TODO find out why I need this
			if(targetLocation.indexOf("drive.google.com/") !== 0){
				targetLocation = "drive.google.com/" + targetLocation;
			}
			
			this._googleDriveAPI.moveFile(sourceLocation.split("/")[1], targetLocation.split("/")[1], name, function(resp){
				d.resolve(resp);
			});
			
			return d;
		},

		/**
		 * Copies a file or directory.
		 * @param {String} sourceLocation The location of the file or directory to copy.
		 * @param {String} targetLocation The location of the target folder.
		 * @param {String} [name] The name of the destination file or directory in the case of a rename
		 */
		copyFile : function(sourceLocation, targetLocation){
			console.log("Executing copyFile", sourceLocation, targetLocation);
			var d = new orion.Deferred();
			
			this._googleDriveAPI.copyFile(sourceLocation.split("/")[1], targetLocation.split("/")[1], function(resp){
				d.resolve(resp);
			});
			
			return d;
		},

		/**
		 * Returns the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to get contents for
		 * @param {Boolean} [isMetadata] If defined and true, returns the file metadata, 
		 *   otherwise file contents are returned
		 * @return A deferred that will be provided with the contents or metadata when available
		 */
		read : function(location, isMetadata){
			console.log("Executing read", location, isMetadata);
			var self = this;
			var d = new orion.Deferred();
			
			this._googleDriveAPI.getFileMetadata(location.split("/")[1], function(file){
				if(isMetadata){
					var f = new OrionFile();
					f.importJSON(file);
					d.resolve(f.exportJSON());
				} else {
					if(file.downloadUrl){
						self._googleDriveAPI.retrieveFile(file.downloadUrl, function(fileContent){
							d.resolve(fileContent);
						});
					} else {
						d.resolve("");
					}
				}
			});
			
			return d;
		},

		/**
		 * Writes the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to set contents for
		 * @param {String|Object} contents The content string, or metadata object to write
		 * @param {String|Object} args Additional arguments used during write operation (i.e. ETag)
		 * @return A deferred for chaining events after the write completes
		 */
		write : function (location, contents, args){
			console.log("Executing write");
			var self = this;
			var d = new orion.Deferred();
			
			this._googleDriveAPI.getFileMetadata(location.split("/")[1], function(file){
				self._googleDriveAPI.updateFile(location.split("/")[1], file, contents, function(resp){
					d.resolve(resp);
				});
			});
			
			return d;
		},

		/**
		 * Writes the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to set contents for
		 * @param {String|Object} contents The content string, or metadata object to write
		 * @return A deferred for chaining events after the write completes
		 */
		search : function(location, query){
			throw 'Not supported: search';
		},

		/**
		 * Not implemented yet.
		 */
		remoteImport : function(targetLocation, options){
			throw 'Not supported: remoteImport';
		},

		/**
		 * Not implemented yet.
		 */
		remoteExport : function(sourceLocation, options){
			throw 'Not supported: remoteExport';
		},

		/**
		 * TODO -- this is never called by the Orion IDE.
		 */
		createWorkspace : function(name){
			console.log("Executing createWorkspace");
			var d = new orion.Deferred();
			d.resolve({});
			return d;
		},

		/**
		 * TODO -- this is never called by the Orion IDE.
		 */
		loadWorkspaces: function() {
			console.log("Executing loadWorkspaces");
			return this.loadWorkspace("drive.google.com/");
		},

		/**
		 * TODO -- the Orion IDE never calls this function for third-party file systems.
		 */
		createProject : function(url, projectName, serverPath, create){
			console.log("Executing createProject");
			var d = new orion.Deferred();
			d.resolve({});
			return d;
		}
	};

	return OrionGoogleDriveFileSystem;
}());