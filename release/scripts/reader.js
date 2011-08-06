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
var referenceWindow;
var referenceShare;
var referenceIframe;
var firstTime = true;

var referenceEntryActionsSelector ="div.entry-actions";

function updateReferences() {
  referenceWindow = $("#chrome");
  referenceShare = $("#gbi3")[0];
  referenceIframe = $("body>div>div>div").eq(1).children().eq(3).find('iframe');
}

var referenceClass = "googleplusreader";
var referenceSpan = $("<span>")
      .addClass("broadcast-inactive broadcast link unselectable "+referenceClass)
      .text("Share on Google+")
      .click(function(evt) {
        share(evt,$(this).parent().parent().parent().find(".entry-title-link").attr('href'));
        evt.stopImmediatePropagation();
      });

function update() {
  referenceWindow.unbind('DOMSubtreeModified',update);
  $(referenceEntryActionsSelector).each(function() {
    if ($(this).find("."+referenceClass).length==0) {
      $(this).append(referenceSpan.clone(true,true));
    };
  });
  referenceWindow.bind('DOMSubtreeModified',update);
};


function share(evt,url) {
  if (firstTime || !referenceIframe.is(':visible')) {
      firstTime=false;
      referenceShare.dispatchEvent(evt.originalEvent);
  }
  updateReferences();
  if (url!=undefined) {
    chrome.extension.sendRequest({reader:true,href:url});
  }
};

updateReferences();
update();
