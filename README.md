Orion Google Drive File System Plugin
======================================

Information
-----------------------
This plugin was originated during the http://wiki.eclipse.org/Orion_Hackaton_Krakow_2012.
 Please raport any bugs and/or suggestions directly to the author.
 
 Overview
 ------------------------
 This plugin provides a fully functional Orion Filesystem ("orion.file.core" service) for Google Drive (https://drive.google.com/#my-drive).
 With this plugin you may now view, edit, create, delete, copy, move and rename any files in your Google Drive using Eclipse Orion.
 
 Basic instalation
 -----------------------
 First of all, you need to host the plugin. Clone this repository in any public domain and install it in your Orion instance.
 One possibility would be OrionHub (see: http://wiki.eclipse.org/Orion/How_Tos/Setup_Orion_Client_Hosted_Site_on_OrionHub).
 Go to Settings->plugins and install the plugin. Now, you have to obtain API access for the plugin. Create an API project in the Google API Console
 (https://code.google.com/apis/console/). Select the Services tab in your API project, and enable the Drive API. Select the API Access tab in your API project,
 and click Create an OAuth 2.0 client ID. In the Branding Information section, provide a name for your application (e.g. "Orion Google Drive"),
 and click Next. Providing a product logo is optional. In the Client ID Settings section, do the following:
 * Select Web application for the Application type
 * Click the more options link next to the heading, Your site or hostname.
 * List your hostname in the Authorized Redirect URIs and JavaScript Origins fields.
 * Click Create Client ID.
 
 In the API Access page, locate the section Client ID for Web applications and note the Client ID value.
 List your hostname in JavaScript origins in the Client ID settings.
 
 Now you've got your CLIENT_ID. Go to the plugin page. Paste your CLIENT_ID in the text field and click 'Authorize Google Drive File System Plugin for Orion'.
 Provide your google credentials. Congratulations, you may go now to the Orion Navigator and connect to your Google Drive.
 
 Note
 ---------------------------
Each time your google credentials expire you need to go to the plugin page and authorize again.
Be aware, your CLIENT_ID is saved in to browser localStorage.