/*******************************************************************************
 * Google Drive FileSystem for Eclipse Orion
 * Author: Maciej Bendkowski <maciej.bendkowski@gmail.com>
 *******************************************************************************/
/*global window eclipse:true orion FileReader console GoogleDriveAPI */

/** @namespace The global container for eclipse APIs. */
var eclipse = eclipse || {};

/**
 * Orion File interface used to translate Drive files into Orion ones.
 */
var OrionFile = function(name, directory){
	this.Name = name;
	this.Directory = directory;
	this.Parents = [];
	this.Children = [];
	this.Attributes = {
        ReadOnly: false,
        Executable: false,
        Hidden: false,
        Archive: false,
        SymbolicLink: false
    };
};

OrionFile.prototype = {
	/**
	 * Imports information from a google drive file.
	 */
	importJSON : function(googleFile){
		this.Name = googleFile.title;
		this.Directory = (googleFile.mimeType === "application/vnd.google-apps.folder" ? true : false);
		this.ETag = googleFile.etag;
		this.Location = "drive.google.com/" + googleFile.id;
		this.LocalTimeStamp = googleFile.createdDate;
		this.ContentType = googleFile.mimeType || 'text/plain';
		this.ContentLength = (googleFile.fileSize === undefined ? 0 : googleFile.fileSize);
		this.ChildrenLocation = this.Location;
	
		for(var i in googleFile.parents){
			var f = new OrionFile();
			f.importJSON(googleFile.parents[i]);
			this.Parents.push(f);
		}
	},

	/**
	 * Exports clean Orion type file.
	 */
	exportJSON : function(){
		var parents = [];
		for(var i in this.Parents){
			parents.push(this.Parents[i].exportJSON());
		}
	
		return {
			'Name' : this.Name,
			'Directory' : this.Directory,
			'ETag' : this.ETag,
			'Location' : this.Location,
			'LocalTimeStamp' : this.LocalTimeStamp,
			'ContentType' : this.ContentType,
			'ContentLength' : this.ContentLength,
			'Parents' : parents,
			'Children' : this.Children,
			'ChildrenLocation' : this.ChildrenLocation,
			'Attributes' : this.Attributes
		};
	}
};