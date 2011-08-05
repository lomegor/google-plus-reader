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

if (window==top) {
  var showRead=false;
  chrome.extension.sendRequest({
    method:"status"},
    function(data) {
      showRead=data.showRead;
      if (data.useGooglePlus)
        addGoogleReader();
    }
  );
  function addGoogleReader() {
    var elements=[];
    var unread=[];
    var tags = [];
    var googleReader;
    var googleReaderParent;
    var shareButton;
    var currentEntry=0;
    var currentMax=0;
    var continuation;
    var showingEverything=false;
    var showButton;

    //references to copy classes
    var reference;
    var referenceTitle;
    var referenceBreak;
    var referenceMenu;
    var middle;
    var referenceContent;
    var referenceEntry = "entry";
    var referenceEntryTitle = "title";
    var referenceSummary = "summary";
    var referenceShare = "share";
    var referenceMarkUnread = "markunread";
    var referenceMarkedUnread = "markedunread";
    var referenceUnread = "unread";
    var referenceOpen = "open";
    var referenceShareButton = $("span[role|='button'].d-k.yl").first()[0];
    var referenceTitle1;
    var referenceTitle2;
    var referenceTitle3;

    var token;
    var currentTag;
    var fetching=false;

    function updateReferences() {
      reference = $("a[href^='/sparks/']").first();
      referenceTitle = $("a[href^='/sparks']").first();
      referenceBreak = referenceTitle.prev();
      referenceMenu = $('#content a[href|="/notifications/all"]');
      var page = window.location.pathname;
      var isSparks=page.indexOf("sparks");
      var isSparksSub = page.indexOf("sparks/");
      var isWelcome=page.indexOf("welcome");
      var isNotifications=page.indexOf("notifications");
      var isStream=page.indexOf("stream");
      if (isStream>0) {
        middle = $("#contentPane").find("div[aria-live|='polite']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().find("div").eq(0);
        referenceTitle2 = middle.parent().find("div").eq(1);
        referenceTitle3 = undefined;
      } else if (isSparksSub>0) {
        middle = $("#contentPane").find("div[aria-live|='polite']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().parent().find("div").eq(0);
        referenceTitle2 = middle.parent().parent().children("div").eq(1);
        referenceTitle3 = undefined;
      } else if (isSparks>0) {
        middle = $("#contentPane").find("div[aria-live|='polite']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().parent().find("div").eq(0);
        referenceTitle2 = middle.parent().parent().children("div").eq(1);
        referenceTitle3 = middle.parent().parent().children("div").eq(2);
      } else if (isNotifications>0) {
        middle = $("#contentPane>div>div").children("div").eq(1);
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().find("div").eq(0);
        referenceTitle2 = undefined;
        referenceTitle3 = undefined;
      } else {
        middle = $("#contentPane").find("div[aria-live|='polite']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().find("div").eq(0);
        referenceTitle2 = middle.parent().find("div").eq(1);
        referenceTitle3 = undefined;
      }
    }

    function start() {
      updateReferences();
      if (reference.length==0) {
        setTimeout(start,1000);
        return;
      }
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'text',
        url:"http://www.google.com/reader/api/0/token?ck="+Math.round(Date.now()/1000)+"&client=googleplusereader"},
        function(data) {
          token=data;
        }
      );
      elements = [];
      unread = [];
      getUnread();
      middle.parent().bind('DOMSubtreeModified',updateReferences);
      updater();
      updaterUnread();
    };

    function updater() {
      setTimeout(function() {
        update();
        updater();
      },5000);
    }

    function updaterUnread() {
      setTimeout(function() {
        updateUnread();
        updaterUnread();
      },60000);
    }

    function updateUnread() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'json',
        url:"http://www.google.com/reader/api/0/unread-count?all=true&output=json"},
        function(data) {
          var rcvdunread = data.unreadcounts;
          var count = rcvdunread.length;
          var count2 = elements.length;
          for (var j=0; j<count2 && !found; j++) {
            elements[j].count=undefined;
          }
          for (var i=0; i<count; i++) {
            var found=false;
            for (var j=0; j<count2 && !found; j++) {
              if (elements[j].id==rcvdunread[i].id) {
                found=true;
                elements[j].count=rcvdunread[i].count;
              }
            }
          }
          update();
        }
      );
    }


    function getUnread() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'json',
        url:"http://www.google.com/reader/api/0/unread-count?all=true&output=json"},
        function(data) {
          var rcvdunread = data.unreadcounts;
          var count = rcvdunread.length;
          for (var i=0; i<count; i++) {
            unread[rcvdunread[i].id]=rcvdunread[i].count;
          }
          getTags();
        }
      );
    };

    function getTags() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'json',
        url:"http://www.google.com/reader/api/0/tag/list?output=json"},
        function(data) {
          var rcvdtags=data.tags;
          var count = rcvdtags.length;
          for (var i=0;i<count;i++) {
            var matches = /user\/.*\/label\/(.*)/.exec(rcvdtags[i].id);
            if (matches!==null) {
              elements.push({id:matches[0],name:matches[1],count:unread[rcvdtags[i].id]});
            }
          }
          getFeeds();
        }
      );
    };

    function getFeeds() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'json',
        url:"http://www.google.com/reader/api/0/subscription/list?output=json"},
        function(data) {
          var rcvdfeeds = data.subscriptions;
          var count = rcvdfeeds.length;
          for (var i=0;i<count;i++) {
            var cats = rcvdfeeds[i].categories;
            //If it's not in any category
            if (cats.length==0) {
              elements.push({id:rcvdfeeds[i].id,name:rcvdfeeds[i].title,count:unread[rcvdfeeds[i].id]});
            }
          }
          createElements();
        }
      );
    };

    function createElements() {
      var elementList = $("<div>");
      var count = elements.length;
      for (var i=0;i<count;i++) {
        var li = $("<div>");
        var classes = reference.attr('class').split(' ');
        if (reference.css('color')=="rgb(221, 75, 57)")
          classes.pop();
        li.addClass(classes.join(' '));
        li.css('background-image','none');
        li.css('margin-left','0');
        li.css('padding-left','0');
        var open = $("<span>")
            .text('+')
            .addClass(referenceOpen);
        li.append(open);
        var txt =elements[i].name;
        var tagname = $("<span>");
        if (elements[i].count!=undefined) {
          txt += " ("+elements[i].count+")";
          tagname.css('font-weight','bold');
        }
        tagname.text(txt);
        li.append(tagname);
        var id = elements[i].id;
        tagname.click((function(id,i) {
          return function() {
            var newClass = $(this).parent().parent().parent().parent().find("*").filter(function() {
              return $(this).css('color')=="rgb(221, 75, 57)";
            }).attr('class').split(' ').pop();
            $("."+newClass).removeClass(newClass);
            updateReferences();
            currentTag = elements[i];
            currentMax=0;
            var middleTop = middle.offset().top;
            middle.empty();
            showingEverything=false;
            referenceTitle1.empty().text("Google Reader - " + currentTag.name);
            if (referenceTitle2!=undefined)
              referenceTitle2.removeClass().empty();
            if (referenceTitle3!=undefined)
              referenceTitle3.remove();
            tags[i].parent().addClass(newClass);
            tags[i].parent().children().eq(0).css('color','#DD4B39');
            if (!showRead && (currentTag.count==undefined || currentTag.count==0)) {
              showingEverything=true;
              middle.append($("<div>").addClass("noitems").text("No new items"));
            } else {
              middle.text("Loading...");
              chrome.extension.sendRequest({
                method:"GET",
                dataType:'xml',
                url:"http://www.google.com/reader/atom/"+id},
                function(data) {
                  referenceTitle1.parent().unbind("DOMNodeRemoved");
                  middle.empty();
                  referenceTitle1.parent().bind("DOMNodeRemoved",(function(el) {
                    return function() {
                      if (newClass!=undefined && newClass!="") {
                        el.parent().children().eq(0).css('color','#CCC');
                        el.parent().removeClass(newClass);
                      }
                    }
                  })(tags[i]));
                  middle.append(show(data));
                  middle.find("img").css('max-width',middle.find(".summary").width());
                }
              );
            }
            if (middleTop<$("body").scrollTop())
              $("body").scrollTop(middleTop);
          };
        })(id,i));
        elementList.append(li);
        tags.push(tagname);
      }
      googleReader = $("<div>")
        .addClass("googleplusreader");
      var separator = $("<div>")
        .addClass(referenceBreak.attr('class'));
      var classes = referenceTitle.attr('class').split(' ');
      if (referenceTitle.css('color')=="rgb(221, 75, 57)")
        classes.pop();
      var title = $("<div>") 
        .text("Reader")
        .addClass(classes.join(' '))
        .click(function() {
          updateUnread();
        });
      googleReader.append(separator,title,elementList);
      showButton = $("<a>");
      if (!showRead) {
        showButton.text("Show Read");
        showButton.click(function(){showAll()});
      } else {
        showButton.text("Hide Read");
        showButton.click(function(){hideRead()});
      }
      googleReader.append(showButton);
      writeElements();
    };

    function showAll() {
      chrome.extension.sendRequest({
        method:"changeShowRead"},
        function() {
          showRead=true;
          showButton.unbind('click');
          showButton.text("Hide Read");
          showButton.click(function(){hideRead()});
          var count = elements.length;
          var found = false;
          for (var i=0;i<count && !found;i++) {
            if (elements[i]==currentTag) {
              found=true;
              tags[i].click();
            }
          }
        }
      );
    }
    function hideRead() {
      chrome.extension.sendRequest({
        method:"changeShowRead"},
        function() {
          showRead=false;
          showButton.unbind('click');
          showButton.text("Show Read");
          showButton.click(function(){showAll()});
          var count = elements.length;
          var found = false;
          for (var i=0;i<count && !found;i++) {
            if (elements[i]==currentTag) {
              found=true;
              tags[i].click();
            }
          }
        }
      );
    }

    function writeElements() {
      googleReader.insertAfter(referenceMenu);
      googleReaderParent=googleReader.parent();
      googleReaderParent.bind("DOMSubtreeModified",update);
    };

    function update() {
      if (googleReader!=undefined) {
        updateReferences();
        googleReaderParent.unbind('DOMSubtreeModified',update);
        var count = tags.length;
        for (var i=0;i<count;i++) {
          tags[i].css('font-weight','');
          var txt = elements[i].name;
          if (elements[i].count!=undefined && elements[i].count!=0) {
            txt += " ("+elements[i].count+")";
            tags[i].css('font-weight','bold');
          }
          tags[i].text(txt);
        }
        googleReader.insertAfter(referenceMenu);
        googleReaderParent.bind("DOMSubtreeModified",update);
      }
    };

    function show(data) {
      continuation = data.feed["gr:continuation"]["#text"];
      var maxElements=20;
      var entries = data.feed.entry;
      var count = entries.length;
      var content = $("<div>").addClass(referenceContent.attr('class'));
      var added = false;
      if (currentTag.count==undefined)
        currentTag.count=0;
      if (!showRead && currentTag.count==0)
        return;
      if (!showRead && currentTag.count<maxElements)
        maxElements=currentTag.count;
      for (var i=0; i<count; i++) {
        var count2 = entries[i].category.length;
        var read=false;
        for (var j=0;j<count2 && !read;j++) {
          if (entries[i].category[j]["@attributes"].label==="read")
            read=true;
        }
        if (!read || showRead) {
          added=true;
          var entry = $("<div>").addClass(referenceEntry);
          if (entries[i].link.length!=undefined) {
            entries[i].link=entries[i].link[0];
          }
          if (!read) {
            entry.addClass(referenceUnread);
            entry.click((function(id,entry) {
                return function() {
                  markRead(id,entry);
                }
            })(entries[i].id["#text"],entry));
          }
          var title = $("<a>")
            .addClass(referenceEntryTitle)
            .attr("href",entries[i].link["@attributes"].href)
            .text(entries[i].title["#text"]);
          entry.append(title);
          if (entries[i].summary!=undefined) {
            var summary = $("<div>")
              .addClass(referenceSummary)
              .html(entries[i].summary["#text"])
              .css('overflow','auto');
            entry.append(summary);
          } else if (entries[i].content!=undefined) {
            var summary = $("<div>")
              .addClass(referenceSummary)
              .html(entries[i].content["#text"])
              .css('overflow','auto');
            entry.append(summary);
          }
          var shareButton = $("<a>")
            .addClass(referenceShare)
            .attr("role","button")
            .attr("tabindex","0")
            .text("Share");
          shareButton.click(function(evt) {
            share(evt,$(this).parent().find("."+referenceEntryTitle).attr('href'));
            evt.stopImmediatePropagation();
          });
          entry.append(shareButton);
          var markButton = $("<a>")
            .addClass(referenceMarkUnread)
            .attr("role","button")
            .attr("tabindex","0")
            .text("Mark Unread");
          markButton.click((function(id,entry) {
            return function() {
              markUnread(id,entry);
            }
          })(entries[i].id["#text"],entry));
          entry.append(markButton);
          content.append(entry);
          currentMax++;
        }
      }
      if (currentMax<maxElements) {
        chrome.extension.sendRequest({
          method:"GET",
          dataType:'xml',
          url:"http://www.google.com/reader/atom/"+currentTag.id+"?c="+continuation},
          function(data) {
            if (currentTag.count!=0) {
              middle.append(show(data));
              middle.find("img").css('max-width',middle.find(".summary").width());
            }
          }
        );
      } else if (!showRead) {
        showingEverything=true;
      }
      if (!added) {
        return;
      } else {
        return content;
      }
    }
    start();

    function markRead(id,entry) {
      entry.unbind('click');
      chrome.extension.sendRequest({
        method:"POST",
        url:"http://www.google.com/reader/api/0/edit-tag?client=googleplusreader",
        data:{"i":id,"a":"user/-/state/com.google/read","ac":"edit","T":token}},
        function(data) {
          if (data=="ERROR") {
            entry.click(function(){markRead(id,entry)});
          } else {
            entry.removeClass(referenceUnread);
            currentTag.count--;
            update();
          }
        }
      );
    }

    function markUnread(id,entry) {
      chrome.extension.sendRequest({
        method:"POST",
        url:"http://www.google.com/reader/api/0/edit-tag?client=googleplusreader",
        data:{"i":id,"r":"user/-/state/com.google/read","ac":"edit","T":token}},
        function(data) {
          if (data!="ERROR") {
            entry.addClass(referenceUnread);
            entry.addClass(referenceMarkedUnread);
            entry.click(function() {
              markRead(id,entry);
            });
            if (currentTag.count==undefined)
              currentTag.count=1;
            else
              currentTag.count++;
            update();
          }
        }
      );
    }

    $(window).scroll(function(evt){
      var scroll = $(this).scrollTop();
      currentEntry=0;
      var vieweditems = $('.'+referenceEntry).filter(function(){
        return scroll>$(this).offset().top;
      }).each(function() {
        markedTopRead($(this));
      });
      evt.stopImmediatePropagation();
      evt.stopPropagation();
      evt.preventDefault();
    });

    function markedTopRead(el) {
      currentEntry++;
      if (!fetching && currentMax-currentEntry<10 && !showingEverything) {
        fetching=true;
        chrome.extension.sendRequest({
          method:"GET",
          dataType:'xml',
          url:"http://www.google.com/reader/atom/"+currentTag.id+"?c="+continuation},
          function(data) {
            middle.append(show(data));
            middle.find("img").css('max-width',middle.find(".summary").width());
            fetching=false;
          }
          );
      }
      if (!el.hasClass(referenceMarkedUnread))
        el.click();
    }

    function cancelOtherMove(evt) {
      if ($("."+referenceEntry).length>0) {
        if (evt.target==$("body")[0]) {
          if (evt.which==74 || evt.which==75) {
            if (evt.type=="keyup") {
              if (evt.which==74) {
                var lastEntry = $("."+referenceEntry).eq(currentEntry+1);
                $("body").scrollTop(lastEntry.offset().top-10);
              } else if (currentEntry>=1) {
                var lastEntry = $("."+referenceEntry).eq(currentEntry-1);
                $("body").scrollTop(lastEntry.offset().top-10);
              }
            }
            evt.stopImmediatePropagation();
            evt.stopPropagation();
            evt.preventDefault();
          }
        }
      }
    }

    $(window).keydown(cancelOtherMove);
    $(window).keyup(cancelOtherMove);


    //sharing functions
    var firstTime=true;
    var referenceShareBox = $("#gbi3")[0];
    var referenceIframe = $("#gbsf");
    function share(evt,url) {
      referenceIframe = $("#gbsf");
      if (firstTime || !referenceIframe.is(':visible')) {
        var topScroll = $("body").scrollTop()
        firstTime=false;
        referenceShareBox.dispatchEvent(evt.originalEvent);
        referenceIframe.parent().css('position','fixed');
        referenceIframe.parent().css('background-color','white');
        referenceIframe.parent().css('border','1px solid #BEBEBE');
        $("body").scrollTop(topScroll);
      }
      if (url!=undefined) {
        chrome.extension.sendRequest({reader:true,href:url});
      }
    }
  }
} else {
  var referenceAddLinkSelector ='#nw-content span[title|="Add link"]';
  var referenceLinkSelector = "#summary-view input"; //first
  //var referenceAddSelector = referenceLink.parent().parent().parent().find("div[role|='button']")
  var referenceCloseLink = "#summary-view div[tabindex|='0']"; //second

  chrome.extension.onRequest.addListener(
      function (request,sender,sendResponse) {
        sendResponse();
        loopAddLink(request.href);
      });

  function loopAddLink(url) {
    try {
      var evt;
      var closeLink = $(referenceCloseLink).eq(1);
      if (closeLink.length>0) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
        closeLink[0].dispatchEvent(evt);
      }
      evt = document.createEvent("HTMLEvents");
      evt.initEvent("click","true","true");
      var addlink = $(referenceAddLinkSelector)[0];
      addlink.dispatchEvent(evt);
      var link = $(referenceLinkSelector).first();
      if (link.length==0)
        throw "not loaded";

      evt = document.createEvent("HTMLEvents");
      evt.initEvent("keypress","true","true");
      link[0].dispatchEvent(evt);
      link.val(url);

      var add = link.parent().parent().parent().find("div[role|='button']");
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("mousedown","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
      add[0].dispatchEvent(evt);
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("mouseup","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
      add[0].dispatchEvent(evt);
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
      add[0].dispatchEvent(evt);
    } catch (error) {
      setTimeout(function(){loopAddLink(url)},500);
    }
  }
}
