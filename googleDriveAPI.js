/*******************************************************************************
 * Google Drive FileSystem for Eclipse Orion
 * Author: Maciej Bendkowski <maciej.bendkowski@gmail.com>
 *******************************************************************************/
/*global window eclipse:true orion FileReader console gapi XMLHttpRequest btoa */
var _CLIENT_ID_ = '46990236932.apps.googleusercontent.com';
var _SCOPES_ = ['https://www.googleapis.com/auth/drive'];

/**
 * Google Drive API which communicates with the Drive.
 */
var GoogleDriveAPI = function(){
	gapi.client.load('drive', 'v2');
	this._authenticated = false;
};

GoogleDriveAPI.prototype = {
	_auth : function(immediate, callback){
		if(immediate === undefined){
			immediate = true;
		}
		
		var self = this;
		function handleAuthResult(authResult){
			if (authResult && !authResult.error) {
				/* Access token has been successfully retrieved, requests can be sent to the API. */
				this._authenticated = true;
				callback(authResult);
			} 
			else {
				/* No access token could be retrieved, force the authorization flow. */
				self._authenticated = false;
				self._auth(false, callback);
	        }
		}
		
		gapi.auth.authorize({
			'client_id': _CLIENT_ID_,
			'scope': _SCOPES_.join(' '),
			'immediate': immediate}, handleAuthResult);
	},
	
	getRootFolderID : function(callback){
		this._auth(true, function(){
			var request = gapi.client.drive.about.get();
			request.execute(function(resp) {
			  callback(resp.rootFolderId);
			});
		});
	},
	
	getChildrenReferences : function(folderId, callback){
		this._auth(true, function(){
			var request = gapi.client.drive.children.list({
	           'folderId' : folderId
	        });
	        
	        request.execute(function(resp){
	        	callback(resp);
	        });
		});
	},
	
	getChildren : function(folderId, callback){
		var self = this;
		this._auth(true, function(){
			self.getChildrenReferences(folderId, function(references){
				/* empty children list */
				if(references.items === undefined) { return callback({ items : [] }); }
			
				var request = gapi.client.drive.files.list();
		        request.execute(function(resp){
		        	var children = { items : [] };
		        	
		        	for(var i=0; i<resp.items.length; ++i){
		        		for(var j=0; j<references.items.length; ++j){
		        			if(resp.items[i].id === references.items[j].id){
		        				children.items.push(resp.items[i]);
		        			}
		        		}
		        	}
		        	callback(children);
		        });
			});
		});
	},
	
	getFileMetadata : function(fileId, callback){
		this._auth(true, function(){
			var request = gapi.client.drive.files.get({
	           'fileId' : fileId
	        });
	        
	        request.execute(function(resp){
	        	callback(resp);
	        });
		});
	},
	
	createFile : function(parentId, name, isFile, callback){
		this._auth(true, function(){
			var request = gapi.client.request({
				'path' : 'drive/v2/files',
				'method' : 'POST',
				'body' : {
		           'title' : name,
		           'mimeType' : isFile ? 'text/plain' : "application/vnd.google-apps.folder",
		           'parents' : [{'id' : parentId}]
		        }
	        });
	        
	        request.execute(function(resp){
	        	callback(resp);
	        });
		});
	},
	
	deleteFile : function(fileId, callback) {
	    this._auth(true, function(){
			var request = gapi.client.drive.files.delete({
		       'fileId' : fileId
		    });
		        
		    request.execute(function(resp){
		      	callback(resp);
		    });
		});
	},
	
	copyFile : function(fileId, targetParentId, callback) {
	    this._auth(true, function(){
			var request = gapi.client.drive.files.copy({
		       'fileId' : fileId,
		       'resource' : {
		       		'parents' : [{'id' : targetParentId}]
		       }
		    });
		        
		    request.execute(function(resp){
		      	callback(resp);
		    });
		});
	},
	
	moveFile : function(fileId, targetParentId, name, callback) {
	    this._auth(true, function(){
			var request = gapi.client.drive.files.patch({
		       'fileId' : fileId,
		       'resource' : {
		       		'title' : name,
		       		'parents' : [{'id' : targetParentId}]
		       }
		    });
		        
		    request.execute(function(resp){
		      	callback(resp);
		    });
		});
	},
	
	retrieveFile : function(downloadUrl, callback){
		this._auth(true, function(){
			var accessToken = gapi.auth.getToken().access_token;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', downloadUrl);
			xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
			xhr.onload = function() {
				callback(xhr.responseText);
			};
			
			xhr.onerror = function() {
			    callback(null);
			};
			
			xhr.send();
		});
	},
	
	updateFile : function(fileId, fileMetadata, fileData, callback) {
		this._auth(true, function(){
			var boundary = '-------314159265358979323846';
			var delimiter = "\r\n--" + boundary + "\r\n";
			var close_delim = "\r\n--" + boundary + "--";
		
			var contentType = fileData.type || 'application/octet-stream';
    		var base64Data = btoa(fileData);			

			var multipartRequestBody =
		        delimiter +
		        'Content-Type: application/json\r\n\r\n' +
		        JSON.stringify(fileMetadata) +
		        delimiter +
		        'Content-Type: ' + contentType + '\r\n' +
		        'Content-Transfer-Encoding: base64\r\n' +
		        '\r\n' +
		        base64Data +
		        close_delim;
		        
		    var request = gapi.client.request({
		        'path': '/upload/drive/v2/files/' + fileId,
		        'method': 'PUT',
		        'params': {'uploadType': 'multipart', 'alt': 'json'},
		        'headers': {
		          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
		        },
		        'body': multipartRequestBody});
		    
		    request.execute(function(resp){
		      	callback(resp);
		    });
		});
	},
	
	about : function(callback){
		this._auth(true, function(){
			var request = gapi.client.drive.about.get();
			request.execute(function(resp) {
			  callback(resp);
			});
		});
	}
};