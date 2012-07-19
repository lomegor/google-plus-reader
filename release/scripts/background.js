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
var ok=false;
function checkOk() {
  if(!ok) {
    setTimeout
  } else {
  }
}
function postUrlGetOk(url,tab) {
  if (!ok) {
    chrome.tabs.sendRequest(tab.id, {href:url}, function() {
      ok=true;
    });
    setTimeout(function(){postUrlGetOk(url,tab)},1000);
  } else {
    ok=false;
  }
}

chrome.extension.onRequest.addListener(
  function (request,sender,sendResponse) {
    if (request.method=="status") {
      data = {};
      data.showRead=localStorage["showRead"]=="true"?true:false;
      data.showReadTags=localStorage["showReadTags"]=="true"?true:false;
      data.listView=localStorage["listView"]=="true"?true:false;
      sendResponse(data);
    } else if (request.method=="changeShowRead"){
      if (localStorage["showRead"]=="true")
        localStorage["showRead"]="false"
      else
        localStorage["showRead"]="true"
      sendResponse("ok");
    } else if (request.method=="changeShowReadTags"){
      if (localStorage["showReadTags"]=="true")
        localStorage["showReadTags"]="false"
      else
        localStorage["showReadTags"]="true"
      sendResponse("ok");
    } else if (request.method=="changeListView"){
      if (localStorage["listView"]=="true")
        localStorage["listView"]="false"
      else
        localStorage["listView"]="true"
      sendResponse("ok");
    } else if (request.reader) {
      chrome.tabs.getSelected(null, function(tab) {
        postUrlGetOk(request.href,tab);
      });
    } else if (request.method=="GET") {
      $.ajax({
        url:request.url,
        dataType:request.dataType,
        success:function(data) {
          if (request.dataType=="xml") {
            data = xml2json(data); 
          }
          sendResponse(data);
        },
        error:function(jqXHR,text,error) {
        }
        });
    } else if (request.method=="POST") {
      $.ajax({
        type:"POST",
        url:request.url,
        data:request.data,
        success:function(data) {
          sendResponse(data);
        },
        error:function(jqXHR,text,error) {
          sendResponse("ERROR");
        }
        });
    }
  }
);
/**
 * Convert XML to JSON Object
 * @param {Object} XML DOM Document
 */
function xml2json(xml) {
 var obj = {};
 
 if (xml.nodeType == 1) { // element
  // do attributes
  if (xml.attributes.length > 0) {
   obj['@attributes'] = {};
   for (var j = 0; j < xml.attributes.length; j++) {
    obj['@attributes'][xml.attributes[j].nodeName] = xml.attributes[j].nodeValue;
   }
  }
  
 } else if (xml.nodeType == 3) { // text
  obj = xml.nodeValue;
 }
 
 // do children
 if (xml.hasChildNodes()) {
  for(var i = 0; i < xml.childNodes.length; i++) {
   if (typeof(obj[xml.childNodes[i].nodeName]) == 'undefined') {
    obj[xml.childNodes[i].nodeName] = xml2json(xml.childNodes[i]);
   } else {
    if (typeof(obj[xml.childNodes[i].nodeName].length) == 'undefined') {
     var old = obj[xml.childNodes[i].nodeName];
     obj[xml.childNodes[i].nodeName] = [];
     obj[xml.childNodes[i].nodeName].push(old);
    }
    obj[xml.childNodes[i].nodeName].push(xml2json(xml.childNodes[i]));
   }
   
  }
 }

 return obj;
};
function firstTime() {
      if (localStorage["showRead"]==undefined)
        localStorage["showRead"] = "true";
      if (localStorage["showReadTags"]==undefined)
        localStorage["showReadTags"] = "true";
      if (localStorage["listView"]==undefined)
        localStorage["listView"] = "true";
};
firstTime();
