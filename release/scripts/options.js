/*
 Copyright 2011 Sebastian Ventura
 This file is part of Google+Reader.

 Google+Reader is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Foobar is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Google+Reader.  If not, see <http://www.gnu.org/licenses/>.
*/
function loadOptions() {
	$("#read").click(saveOptionsRead);
	$("#tagsread").click(saveOptionsReadTags);
	$("#view").click(saveOptionsView);
	var showRead = localStorage["showRead"];
	if (showRead==undefined) {
		showRead = "true";
		localStorage["showRead"] = "true";
	}
	if (showRead=="true") {
		document.getElementById("read").checked=true;
	}
	var showReadTags = localStorage["showReadTags"];
	if (showReadTags==undefined) {
		showReadTags = "true";
		localStorage["showReadTags"] = "true";
	}
	var listView = localStorage["listView"];
	if (listView==undefined) {
		listView = "true";
		localStorage["listView"] = "true";
	}
	if (listView=="true") {
		document.getElementById("view").checked=true;
	}
	if (showReadTags=="true") {
		document.getElementById("tagsread").checked=true;
	}
}
function saveOptionsRead() {
	if (document.getElementById("read").checked)
		localStorage["showRead"]=true;
	else 
		localStorage["showRead"]=false;
}
function saveOptionsReadTags() {
	if (document.getElementById("tagsread").checked)
		localStorage["showReadTags"]=true;
	else 
		localStorage["showReadTags"]=false;
}
function saveOptionsView() {
	if (document.getElementById("view").checked)
		localStorage["listView"]=true;
	else 
		localStorage["listView"]=false;
}
$(document).ready(loadOptions);
