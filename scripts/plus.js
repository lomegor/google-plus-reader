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

/**
 * GOOGLE+ GOOGLE READER INTEGRATION 
 **/
(function($) {

if (window==top) {
  //should we show read items?
  var showRead=false;
  //ask backgroudn to give me options and start add google reader if set
  chrome.extension.sendRequest({
    method:"status"},
    function(data) {
      showRead=data.showRead;
      if (data.useGooglePlus)
        addGoogleReader();
    }
  );


  //main closure 
  function addGoogleReader() {

    /** OBJECTS **/
    //Feed element
    function Feed(data) {

      this.id = data.id;
      this.name = data.title;
      this.unreadCount = 0;
      this.tags = [];
      this.DOM;
      this.DOMtagname;

      //keep reference
      var that = this;

      var list = data.categories;
      var count = list.length
      for (var i=0; i<count; i++) {
        if (all[list[i].id]!=undefined) {
          all[list[i].id].addFeed(that);
          that.tags.push(all[list[i].id]);
        }
      }

      this.init = function() {
        that.DOM = $("<div>");
        //see the reference for classes, if its red, remove last
        //class. Reset attributes we wont be using
        var classes = referenceRoot.attr('class').split(' ');
        //we dont want no red
        if (referenceRoot.css('color')==referenceRedColor)
          classes.pop();
        that.DOM.addClass(classes.join(' '));
        that.DOM.css('background-image','none');

        var txt;
        txt = that.name;
        that.DOMtagname = $("<div>");
        if (that.unreadCount>0) {
          txt += " ("+that.unreadCount+")";
          tagname.css('font-weight','bold');
        }
        that.DOMtagname.text(txt);
        that.DOM.append(that.DOMtagname);

        that.DOMtagname.click(function() {
          showItems(that);
        });
      }
      this.updateCount = function(unread) {
        if (unread!=that.unreadCount) {
          that.unreadCount=unread;
          var txt = that.name;
          that.DOMtagname.css('font-weight','');
          if (that.unreadCount>0) {
            txt += " ("+that.unreadCount+")";
            that.DOMtagname.css('font-weight','bold');
          }
          that.DOMtagname.text(txt);
        }
      }

      this.isRoot = function() {
        return that.tags.length==0;
      }
      this.turnRedOn = function(){
        //red ALL the things!
        that.DOM.addClass(referenceRedClass);
      }
      this.turnRedOff = function(){
        that.DOM.removeClass(referenceRedClass);
      }
    }
    //Tag element, contains Feed elements
    function Tag(rcvdid,rcvdname) {
      //feeds in this tag
      this.feeds = [];
      this.id = rcvdid;
      this.name = rcvdname;
      this.unreadCount = 0;
      this.DOM;
      this.DOMmain;
      this.DOMopen;
      this.DOMtagname;
      this.DOMfeeds;

      var that = this;

      this.addFeed = function(feed) {
        that.feeds.push(feed);
      }
      this.isRoot = function() {
        return true;
      }


      this.init = function() {
        that.DOM = $("<div>");
        that.DOMmain = $("<div>");
        //see the reference for classes, if its red, remove last
        //class. Reset attributes we wont be using
        var classes = referenceRoot.attr('class').split(' ');
        //we dont want no red
        if (referenceRoot.css('color')==referenceRedColor)
          classes.pop();
        that.DOMmain.addClass(classes.join(' '));
        that.DOMmain.css('background-image','none');
        that.DOMmain.css('margin-left','0');
        that.DOMmain.css('padding-left','0');

        //add plus button to open tag
        that.DOMopen = $("<span>")
          .text('+')
          .addClass(referenceOpen);
        //add click function for open
        that.DOMopen.click(function() {
          showTree(that);
        });

        that.DOMmain.append(that.DOMopen);


        var txt;
        txt = that.name;
        that.DOMtagname = $("<div>");
        if (that.unreadCount>0) {
          txt += " ("+that.unreadCount+")";
          that.DOMtagname.css('font-weight','bold');
        }
        that.DOMtagname.text(txt);
        that.DOMmain.append(that.DOMtagname);

        that.DOM.append(that.DOMmain);

        that.DOMtagname.click(function() {
          showItems(that);
        });

        that.DOMfeeds = $("<div>").addClass(referenceSubTagClass);
        for (var h in that.feeds) {
          if (that.feeds[h].DOM==undefined)
            that.feeds[h].init();
          that.DOMfeeds.append(that.feeds[h].DOM.css('display','block'));
        }
        that.DOMfeeds.css('display','none');
        that.DOM.append(that.DOMfeeds);
      }
      this.updateCount = function(unread) {
        if (unread!=that.unreadCount) {
          that.unreadCount=unread;
          var txt = that.name;
          that.DOMtagname.css('font-weight','');
          if (that.unreadCount>0) {
            txt += " ("+that.unreadCount+")";
            that.DOMtagname.css('font-weight','bold');
          }
          that.DOMtagname.text(txt);
        }
      }

      this.turnRedOn = function(){
        //red ALL the things!
        that.DOMopen.css('color',referenceRedColor);
        that.DOMmain.addClass(referenceRedClass);
      }
      this.turnRedOff = function() {
        that.DOMopen.css('color','#CCC');
        that.DOMmain.removeClass(referenceRedClass);
      }
    }

    function showTree(element) {
      if (element.DOMfeeds.css('display')=='none') {
        element.DOMopen.text('-');
        element.DOMfeeds.css('display','block');
      } else {
        element.DOMopen.text('+');
        element.DOMfeeds.css('display','none');
      }
    }

    function showItems(element) {
      updateReferences(); //just in case
      //remove red from all items
      $("."+referenceRedClass).removeClass(referenceRedClass);
      currentTag = element; //set current tag
      currentUnreadCount = element.unreadCount;

      currentMax=0;

      //get top before modifying
      var titleTop = referenceTitle1.offset().top;

      //add this to middle if it doesnt have it
      middle.attr('aria-live','polite');
      middle.empty();

      //Set new title
      referenceTitle1.empty().text("Google Reader - " + currentTag.name);
      //remove titles that we are not using
      if (referenceTitle2!=undefined)
        referenceTitle2.removeClass().empty();
      if (referenceTitle3!=undefined)
        referenceTitle3.empty();


      element.turnRedOn();


      //if someone touches our DOM, we will remove our red
      referenceTitle1.parent().bind("DOMNodeRemoved",function() {
        element.turnRedOff();
        referenceTitle1.unbind("DOMNodeRemoved",this);
      });

      //if we are not showing read items and the current unread count is 0
      //not requesting anything
      if (!showRead && currentTag.unreadCount==0) {
        middle.append($("<div>").addClass("noitems").text("No new items"));
      } else {
        //add loading text and request feeds
        middle.append($("<div>").addClass("noitems").text("Loading..."));
        //if not showing read, not requestin read
        var xt="";
        if (!showRead) {
          xt="?xt=user/-/state/com.google/read";
        }
        chrome.extension.sendRequest({
          method:"GET",
          dataType:'xml',
          url:"http://www.google.com/reader/atom/"+currentTag.id+xt},
          function(data) {
            //not going to fall into infinite loop, thanks
            referenceTitle1.parent().unbind("DOMNodeRemoved");

            //remove loading
            middle.empty();
            //lets add our new found data!
            var list = show(data);
            var count = list.length;
            for (var i=0;i<count;i++)
              middle.append(list[i]);
            //fix images
            middle.find("img").css('max-width',middle.find(".summary").width());
            referenceTitle1.parent().bind("DOMNodeRemoved",function() {
              element.turnRedOff();
              referenceTitle1.unbind("DOMNodeRemoved",this);
            });
          }
        );
      }
      //scroll to the top <==> we are not at the top already!
      if (titleTop<$("body").scrollTop())
        $("body").scrollTop(titleTop-10);
    }


    //all elements
    var all = {};

    var elements=[];
    var unread=[];
    var tags = [];
    var googleReader;
    var googleReaderParent;
    var shareButton;
    var currentEntry=0;
    var currentMax=0;
    var continuation;
    var showButton;

    //references to copy classes
    var referenceRoot;
    var referenceTitle;
    var referenceBreak;
    var referenceMenu;
    var referenceRedClass;
    var middle;
    var referenceContent;
    var referenceRedColor = "rgb(221, 75, 57)";
    var referenceEntry = "entry";
    var referenceEntryTitle = "title";
    var referenceSummary = "summary";
    var referenceShare = "share";
    var referenceMarkUnread = "markunread";
    var referenceMarkedUnread = "markedunread";
    var referenceUnread = "unread";
    var referenceOpen = "open";
    var referenceSubTagClass = "subtag";
    var referenceShareButton = $("span[role|='button'].d-k.yl").first()[0];
    var referenceTitle1;
    var referenceTitle2;
    var referenceTitle3;

    var token;
    var currentTag;
    //save unread count vefore modifying it
    var currentUnreadCount;
    var fetching=false;

    function updateReferences() {
      referenceRoot = $("a[href^='/stream/']").first();
      referenceTitle = $("a[href^='/welcome']").first();
      referenceBreak = referenceTitle.prev();
      referenceMenu = $('#content a[href|="/notifications/all"]');


      var page = window.location.pathname;
      var isSparks=page.indexOf("sparks");
      var isSparksSub = page.indexOf("sparks/");
      var isWelcome=page.indexOf("welcome");
      var isNotifications=page.indexOf("notifications");
      var isStream=page.indexOf("stream");
      var isReader= $("#contentPane").find("*:contains('Google Reader -')").length;
      if (isStream>0) {
        middle = $("#contentPane").find("div[aria-live|='polite'][tabindex!='0']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().find("div").eq(0);
        referenceTitle2 = middle.parent().find("div").eq(1);
        referenceTitle3 = undefined;
      } else if (isSparksSub>0) {
        middle = $("#contentPane").find("div[aria-live|='polite'][tabindex!='0']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().parent().find("div").eq(0);
        referenceTitle2 = middle.parent().parent().children("div").eq(1);
        referenceTitle3 = undefined;
      } else if (isSparks>0) {
        middle = $("#contentPane").find("div[aria-live|='polite'][tabindex!='0']").first();
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
        middle = $("#contentPane").find("div[aria-live|='polite'][tabindex!='0']").first();
        referenceContent = middle.first("div");
        referenceTitle1 = middle.parent().find("div").eq(0);
        referenceTitle2 = middle.parent().find("div").eq(1);
        referenceTitle3 = undefined;
      }
    }

    function update() {
      if (googleReader!=undefined) {
        googleReaderParent.unbind('DOMSubtreeModified',update);
        updateReferences();
        googleReader.insertAfter(referenceMenu);
        googleReaderParent.bind("DOMSubtreeModified",update);
      }
    };

    function getAllTagsAndFeeds() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'json',
        url:"http://www.google.com/reader/api/0/tag/list?output=json"},
        function(data) {
          var rcvdtags = data.tags;
          var count = rcvdtags.length;
          for (var i=0;i<count;i++) {
            var matches = /user\/.*\/label\/(.*)/.exec(rcvdtags[i].id);
            if (matches!==null) {
              var tag = new Tag(matches[0],matches[1]);
              all[rcvdtags[i].id]=tag;
            } else {
              //add exception for following bloggers and other exceptions
              //as I see fit
              matches = /state\/com.blogger\/blogger-following/.exec(rcvdtags[i].id);
              if (matches!==null) {
                var tag = new Tag(rcvdtags[i].id,"Blogs I'm following");
                all[rcvdtags[i].id]=tag;
              }
            }
          }
          chrome.extension.sendRequest({
            method:"GET",
            dataType:'json',
            url:"http://www.google.com/reader/api/0/subscription/list?output=json"},
            function(data) {
              var rcvdfeeds = data.subscriptions;
              var count = rcvdfeeds.length;
              for (var i=0;i<count;i++) {
                var feed = new Feed(rcvdfeeds[i]);
                all[rcvdfeeds[i].id]=feed;
              }
              createAll();
            }
          );
        }
      );
    };

    function start() {
      updateReferences();
      if (referenceRoot.length==0) {
        setTimeout(start,1000);
        return;
      }
      var newReferenceRed = referenceMenu.parent().find("*").filter(function() {
         return $(this).css('color')==referenceRedColor;
      });
      if (newReferenceRed.length!=0)
        referenceRedClass = newReferenceRed.attr('class').split(' ').pop();

      getAllTagsAndFeeds();
      updaterUnread();
      updateToken();
      updaterToken();
    };

    function updateToken() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'text',
        url:"http://www.google.com/reader/api/0/token?ck="+Math.round(Date.now()/1000)+"&client=googleplusereader"},
        function(data) {
          token=data;
        }
      );
    }

    function updaterToken() {
      setTimeout(function() {
        updateToken();
        updaterToken();
      },10*60*1000)
    }

    function updaterUnread() {
      setTimeout(function() {
        getUnreadCount();
        updaterUnread();
      },60000);
    }

    function getUnreadCount() {
      chrome.extension.sendRequest({
        method:"GET",
        dataType:'json',
        url:"http://www.google.com/reader/api/0/unread-count?all=true&output=json"},
        function(data) {
          var rcvdunread = data.unreadcounts;
          var count = rcvdunread.length;
          for (var i=0; i<count; i++) {
            if (all[rcvdunread[i].id]!=undefined)
              all[rcvdunread[i].id].updateCount(rcvdunread[i].count);
          }
          update();
        }
      );
    }

    function createAll() {
      for (var el in all) {
        if (all[el].DOM==undefined)
          all[el].init();
      }
      getUnreadCount();
      writeAll();
    }

    function writeAll() {
      var elementList = $("<div>");
      for (var el in all) {
        if (all[el].isRoot())
          elementList.append(all[el].DOM);
      }

      //create our content
      googleReader = $("<div>")
        .addClass("googleplusreader");

      //separator used for nice touch
      var separator = $("<div>")
        .addClass(referenceBreak.attr('class'));

      //no red class please!!
      var classes = referenceTitle.attr('class').split(' ');
      if (referenceTitle.css('color')==referenceRedColor)
        classes.pop();

      //nice title, if click, update my unread
      var title = $("<div>") 
        .text("Reader")
        .addClass(classes.join(' '))
        .click(function() {
          getUnreadCount();
        });

      //append ALL the things!
      googleReader.append(separator,title,elementList);

      //little button for changin preference
      showButton = $("<a>");
      if (!showRead) {
        showButton.text("Show Read");
        showButton.click(function(){showAll()});
      } else {
        showButton.text("Hide Read");
        showButton.click(function(){hideRead()});
      }
      googleReader.append(showButton);
      write();
    }

    function write() {
      //insert in menu
      googleReader.insertAfter(referenceMenu);
      //set parent for reference now that we've inserted it
      googleReaderParent=googleReader.parent();
      //bind update if anything changes
      //google+ has a thing for refreshing everything and removing
      //my things...
      googleReaderParent.bind("DOMSubtreeModified",update);
    };


    //change preference in reading
    //simple requests
    function showAll() {
      chrome.extension.sendRequest({
        method:"changeShowRead"},
        function() {
          //change button
          showRead=true;
          showButton.unbind('click');
          showButton.text("Hide Read");
          showButton.click(function(){hideRead()});
          //refresh view
          currentTag.DOMtagname.click();
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
          //refresh view
          currentTag.DOMtagname.click();
        }
      );
    }



    function show(data) {
      var returnList = [];
      //save our precious continuation key for updating content
      if (data.feed["gr:continuation"]!=undefined)
        continuation = data.feed["gr:continuation"]["#text"];
      else
        continuation = undefined;
      var maxElements=20;
      var entries = data.feed.entry;
      var count = entries.length;
      //when its only onew entry, greader give us the gift of changing everything
      if (count==undefined) {
        entries=[entries];
        count=1;
      }
      //var content = $("<div>").addClass(referenceContent.attr('class'));
      if (!showRead && currentTag.unreadCount>maxElements)
        maxElements=currentTag.unreadCount;

      //ok, iterate on entries
      //not saving them because they change too much, not worth it
      for (var i=0; i<count; i++) {
        var count2 = entries[i].category.length;
        var read=false;
        for (var j=0;j<count2 && !read;j++) {
          if (entries[i].category[j]["@attributes"].label==="read")
            read=true;
        }

        //only show if entry is not read or read items should be shown
        if (!read || showRead) {
          var entry = $("<div>").addClass(referenceEntry);
          if (entries[i].link!=undefined && entries[i].link.length!=undefined) {
            entries[i].link=entries[i].link[0];
          } else if (entries[i].link===undefined) {
            var text;
            if (entries[i].summary!=undefined) {
              text =$(entries[i].summary['#text']);
            } else {
              text =$(entries[i].content['#text']);
            }
            var link = text.attr('href');
            if (link === undefined) link = text.attr('src');
            if (link === undefined) link = text.find("a").attr('href');
            if (link === undefined) link = text.find("img").attr('src');
            entries[i].link={};
            entries[i].link["@attributes"]={};
            entries[i].link["@attributes"].href=link;
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
            .attr('target','_blank')
            .addClass(referenceEntryTitle)
            .attr("href",entries[i].link["@attributes"].href)
            .html(entries[i].title["#text"]);
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
          returnList.push(entry);
          currentMax++;
        }
      }
      //WARNING: Do not return notReturnList!!!!
      return returnList;
    }

    //start the engine!
    start();

    //mark entry read... blah!
    //should add a way of removing keep unread if it has it
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
            currentTag.updateCount(currentTag.unreadCount-1);
            update();
          }
        }
      );
    }
    //guess for yourself
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
            currentTag.updateCount(currentTag.unreadCount+1);
            update();
          }
        }
      );
    }

    //when someone scrolls, mark everything to the top as read
    //unless is marked unread
    $(window).scroll(function(evt){
      var scroll = $(this).scrollTop();
      currentEntry=0;
      var vieweditems = $('.'+referenceEntry).filter(function(){
        return scroll>$(this).offset().top;
      }).each(function() {
        markReadAndFetch($(this));
      });
      evt.stopImmediatePropagation();
      evt.stopPropagation();
      evt.preventDefault();
    });

    //mark element as read if its not marked unread and fetch next batch
    //of items if at middle of content
    function markReadAndFetch(el) {
      currentEntry++;
      if (!fetching && currentMax-currentEntry<10 && (showRead || currentMax<currentUnreadCount)) {
        fetching=true;
        chrome.extension.sendRequest({
          method:"GET",
          dataType:'xml',
          url:"http://www.google.com/reader/atom/"+currentTag.id+"?c="+continuation},
          function(data) {
            var list = show(data);
            var count = list.length;
            for (var i=0;i<count;i++)
              middle.append(list[i]);
            middle.find("img").css('max-width',middle.find(".summary").width());
            fetching=false;
          }
          );
      }
      //click to mark read... if its read, click unbinded
      if (!el.hasClass(referenceMarkedUnread))
        el.click();
    }

    //cancel j k movements in google+ if they are directed to us
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
    var referenceShareBox = $("#gbi3");
    var referenceIframe = $("#gbsf");
    //same as reader mostly
    function share(evt,url) {
      referenceIframe = $("#gbsf");
      if (firstTime || !referenceIframe.is(':visible')) {
        var topScroll = $("body").scrollTop()
        firstTime=false;
        var evt2 = document.createEvent("MouseEvents");
        evt2.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
        referenceShareBox[0].dispatchEvent(evt2);
        //absoluting box so it doesnt scroll to top
        referenceIframe.parent().css('position','fixed');
        referenceIframe.parent().css('background-color','white');
        referenceIframe.parent().css('border','1px solid #BEBEBE');
        $("body").scrollTop(topScroll);
      }
      chrome.extension.sendRequest({reader:true,href:url});
    }
  }


/**
 * SHARE BOX OPENING FOR IFRAME
 **/
} else {

  //reference Selectors... may change when google+ changes
  var referenceAddLinkSelector ="#nw-content span:nth-child(3)";
  var referenceLinkSelector = "#summary-view input:eq(0)";
  var referenceAddSelector = "div[role|='button']:eq(0)";
  var referenceCloseLink = "#summary-view div[tabindex|='0']:eq(1)";

  //listen on request to use share box
  chrome.extension.onRequest.addListener(
      function (request,sender,sendResponse) {
        //let bacground know we received the request
        sendResponse();
        loopAddLink(request.href);
      });

  //loop that checks continously checks if the page is loaded
  //and add the link if it is
  function loopAddLink(url) {
    try {
      var evt;
      //if close link exist, first close the last link added
      //to start anew
      var closeLink = $(referenceCloseLink);
      if (closeLink.length>0) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
        closeLink[0].dispatchEvent(evt);
      }

      //if add link exist, click it to add the new link
      //if it doesnt, throw exception to keep it in loop
      //until loaded
      evt = document.createEvent("HTMLEvents");
      evt.initEvent("click","true","true");
      var addlink = $(referenceAddLinkSelector)[0];
      addlink.dispatchEvent(evt);
      var link = $(referenceLinkSelector);
      if (link.length==0)
        throw "not loaded";

      //Do a keypress event so it enables the add button
      //next to the textbox and copy url
      evt = document.createEvent("HTMLEvents");
      evt.initEvent("keypress","true","true");
      link[0].dispatchEvent(evt);
      link.val(url);

      //find add button and create a mousedown, mouseup and click event
      //only a click event wont work...
      var add = $(referenceAddSelector);
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("mousedown","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
      add[0].dispatchEvent(evt);
      evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("mouseup","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
      add[0].dispatchEvent(evt);
      evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
      add[0].dispatchEvent(evt);

    } catch (error) {
      //if there was an error, try to run this function again
      setTimeout(function(){loopAddLink(url)},500);
    }
  }
}
})(jQuery);
