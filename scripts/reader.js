/**
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
**/

//reference Selectors... may change when google+ changes
var referenceWindowSelector = "#chrome";
var referenceShareSelector = "#gbi3";
var referenceIframeSelector = "#gbsf";
var referenceEntryActionsSelector ="div.entry-actions";

//reference items, using selectors defined
var referenceWindow;
var referenceShare;
var referenceIframe;

//name of class of the button
var classLink = "googleplusreader";

//reference span which will be cloned to add the link to Share on google+
var referenceSpan = $("<span>")
      .addClass("broadcast-inactive broadcast link unselectable "+classLink)
      .text("Share on Google+")
      .click(function(evt) {
        share(evt,getUrlEntry($(this)));
        evt.stopImmediatePropagation();
      });


//is this the first time we open the share box?
var firstTime = true;


//update the references of google+, because the objects may change
function updateReferences() {
  referenceWindow = $(referenceWindowSelector);
  referenceShare = $(referenceShareSelector);
  referenceIframe = $(referenceIframeSelector);
}

//If the chrome window is updated, check all entry and add our link
function update() {
  //unbind to avoid call stack overflow
  referenceWindow.unbind('DOMSubtreeModified',update);
  //add the link on all entry actions which do not have the link
  $(referenceEntryActionsSelector).each(function() {
    if ($(this).find("."+classLink).length==0) {
      $(this).append(referenceSpan.clone(true,true));
    };
  });
  //bind the handler again
  referenceWindow.bind('DOMSubtreeModified',update);
};

//Get url of entry from a link to share on google+
function getUrlEntry(el) {
  return el.parent().parent().parent().find(".entry-title-link").attr('href');
}

//share event on google+
function share(evt,url) {
  //update references to reflect any change
  updateReferences();
  //if its the first time or the sharebox is not visible,
  //click on share button of black bar
  if (firstTime || !referenceIframe.is(':visible')) {
      firstTime=false;
      referenceShare[0].dispatchEvent(evt.originalEvent);
  }
  //send request to background page to connect to iframe 
  //on share box
  chrome.extension.sendRequest({reader:true,href:url});
};

//update references on start
updateReferences();
//update google reader to add our button
update();
