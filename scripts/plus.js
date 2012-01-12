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

function debug(text) {
  console.log("[+] RSS Share - "+text);
}

if (window==top) {
  //CONSTANTS
  var TICK=10000;
  var TICK_REFERENCES=1;
  var TICK_UNREAD=30;
  var TICK_TOKEN=60;
  //reference classes
  var CLASS_REFERENCE_READER = "googleplusreader";
  var CLASS_REFERENCE_ENTRY = "entry";
  var CLASS_REFERENCE_ENTRY_SELECTED = "entryselected";
  var CLASS_REFERENCE_ENTRY_TITLE = "title";
  var CLASS_REFERENCE_SUMMARY = "summary";
  var CLASS_REFERENCE_SHARE_BUTTON = "share";
  var CLASS_REFERENCE_MARK_ALL_READ_BUTTON = "markallread";
  var CLASS_REFERENCE_MARK_UNREAD_BUTTON = "markunread";
  var CLASS_REFERENCE_MARKED_UNREAD = "markedunread";
  var CLASS_REFERENCE_UNREAD = "unread";
  var CLASS_REFERENCE_OPEN_BUTTON = "open";
  var CLASS_REFERENCE_SUBTREE = "subtag";
  var CLASS_REFERENCE_TAGNAME = "tagname";
  var CLASS_REFERENCE_TITLE = "feedtitle";
  var CLASS_REFERENCE_FEEDS = "feedsContent";
  var CLASS_REFERENCE_RED_CLASS = "selectedTag";
  var CLASS_REFERENCE_ENTRY_FEED_TITLE = "entryFeedTitle";
  var CLASS_REFERENCE_ENTRY_FEED_DATE = "entryFeedDate";
  var CLASS_REFERENCE_ENTRY_FEED_META = "entryFeedMeta";
  var COLOR_REFERENCE_RED = "rgb(221, 75, 57)";
  var ID_REFERENCE_READER_MENU_TITLE = "googleplusreadertitle";
  var ID_REFERENCE_ICON = "readerIcon";
  var ID_REFERENCE_BELOW_YOUTUBE = "readerMenuIcon";
  var SELECTOR_CLASS_REFERENCE_ENTRY = 'div.'+CLASS_REFERENCE_ENTRY;
  var SELECTOR_CLASS_REFERENCE_TAGNAME = 'div.'+CLASS_REFERENCE_TAGNAME;
  var SELECTOR_CLASS_REFERENCE_OPEN_BUTTON = 'span.'+CLASS_REFERENCE_OPEN_BUTTON;
  var SELECTOR_CLASS_REFERENCE_UNREAD = 'div.'+CLASS_REFERENCE_UNREAD;
  var SELECTOR_CLASS_REFERENCE_SHARE_BUTTON = 'a.'+CLASS_REFERENCE_SHARE_BUTTON;
  var SELECTOR_CLASS_REFERENCE_MARK_UNREAD_BUTTON = 'a.'+CLASS_REFERENCE_MARK_UNREAD_BUTTON;

  //all elements
  var all = {};

  //reference to our new menu
  var googleReaderMenu;
  //reference to the parent of our menu
  var googleReaderMenuParent;
  //reference to the "Show Read" button
  var showButton;
  //reference to the feeds part
  var referenceMiddle;

  //current tag being shown
  var currentTag;
  //selected rss item
  var currentEntry=0;
  //amount of items being shown
  var currentMax=0;
  //continuation key for google reader requests
  var continuation;
  //token key for google reader api
  var token;


  //references to google+ objects
  var referenceIconParent
  var referenceRoot;
  var referenceTitle;
  var referenceBreak;
  var referenceMenu;
  var referenceContent;

  //save unread count before modifying it
  var currentUnreadCount;
  //variable to see if we are fetching new items
  //so we dont ask again
  var fetching=false;
  //should we show read items?
  var showRead=false;
  var belowCircles=false;

  var tick=0;

  function updateReferences() {
    referenceRoot = $("#content a[href*='/stream']").first();
    referenceIconParent = referenceRoot.parent().parent().parent().parent();
    referenceTitle = $("#content a[href$='/stream']").first();
    //referenceBreak = referenceTitle.prev();
    referenceMenu = $('#content a[href$="/notifications/all"]');
    referenceContent = $("#contentPane");
    var page = window.location.pathname;
        var page = window.location.pathname;
    var isSparks=page.indexOf("sparks");
    var isSparksSub = page.indexOf("sparks/");
    var isWelcome=page.indexOf("welcome");
    var isNotifications=page.indexOf("notifications");
    var isStream=page.indexOf("stream");
    var isReader= $("#contentPane").find("*:contains('Google Reader -')").length;
  }

  function update() {
    if (!belowCircles && googleReaderMenu!=undefined && googleReaderMenuParent.find("."+CLASS_REFERENCE_READER).length==0) {
      googleReaderMenuParent.unbind('DOMSubtreeModified',update);
      updateReferences();
      googleReaderMenu.insertAfter(referenceMenu);
      googleReaderMenuParent.bind("DOMSubtreeModified",update);
    }
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
  function updateUnreadCount() {
    chrome.extension.sendRequest({
      method:"GET",
      dataType:'json',
      url:"http://www.google.com/reader/api/0/unread-count?all=true&output=json"},
      function(data) {
        var rcvdunread = data.unreadcounts;
        var count = rcvdunread.length;
        for (var i=0; i<count; i++) {
          if (all[rcvdunread[i].id]!=undefined) {
            all[rcvdunread[i].id].updateCount(rcvdunread[i].count);
          }
        }
        update();
      }
    );
  }

  function updater() {
    tick++;
    if (tick%TICK_REFERENCES==0) {
      update();
    }
    if (tick%TICK_UNREAD==0) {
      updateUnreadCount();
    }
    if (tick%TICK_TOKEN==0) {
      updateToken();
      tick=0;
    }
    setTimeout(updater,TICK);
  }



  //ask background to give me options and start add google reader if set
  chrome.extension.sendRequest({
    method:"status"},
    function(data) {
      showRead=data.showRead;
      belowCircles=data.belowCircles
      if (data.useGooglePlus) {
        addGoogleReader();
      }
    });

  function addGoogleReader() {
    /** OBJECTS **/
    //Feed element
    function Feed(data) {

      this.id = data.id;
      this.name = data.title;
      this.unreadCount = 0;
      this.tags = [];
      this.DOMtext="";
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
        //see the reference for classes, if its red, remove last
        //class. Reset attributes we wont be using
        var classes = referenceRoot.attr('class').split(' ');
        //we dont want no red
        if (referenceRoot.css('color')==COLOR_REFERENCE_RED)
          classes.pop();

        var DOM = '<div title="'+that.id+'"';
        DOM+= ' class="'+classes.join(' ')+'"';
        DOM+= ' style="background-image:none">';

        var txt;
        txt = that.name;
        var DOMtagname = '<div class="'+CLASS_REFERENCE_TAGNAME+'"';
        if (that.unreadCount>0) {
          txt += " ("+that.unreadCount+")";
          DOMtagname+= ' style="font-weight:bold"';
        }
        DOMtagname+='>';
        DOMtagname+=txt;
        DOMtagname+='</div>';
        DOM+=DOMtagname;
        DOM+='</div>';
        that.DOMtext=DOM;
      }

      this.setObjects = function() {
        that.DOM=$("div[title|='"+that.id+"']");
        that.DOMtagname=that.DOM.find("div."+CLASS_REFERENCE_TAGNAME);
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
      this.hasElements = function() {
        return true;
      }
      this.select = function(){
        //red ALL the things!
        that.DOMtagname.addClass(CLASS_REFERENCE_RED_CLASS);
      }
      this.unselect = function(){
        that.DOMtagname.removeClass(CLASS_REFERENCE_RED_CLASS);
      }
      this.decreaseCount = function() {
        that.updateCount(that.unreadCount-1);
        var count = that.tags.length;
        for (var i=0; i<count; i++) {
          that.tags[i].decreaseCount();
        }
      }
      this.increaseCount = function() {
        that.updateCount(that.unreadCount+1);
        var count = that.tags.length;
        for (var i=0; i<count; i++) {
          that.tags[i].increaseCount();
        }
      }
    }
    //Tag element, contains Feed elements
    function Tag(rcvdid,rcvdname) {
      //feeds in this tag
      this.feeds = [];
      this.id = rcvdid;
      this.name = rcvdname;
      this.unreadCount = 0;
      this.DOMtext="";
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
      this.hasElements = function() {
        return that.feeds.length!=0;
      }


      this.init = function() {
        //see the reference for classes, if its red, remove last
        //class. Reset attributes we wont be using
        var classes = referenceRoot.attr('class').split(' ');
        //we dont want no red
        if (referenceRoot.css('color')==COLOR_REFERENCE_RED)
          classes.pop();

        var DOM = '<div>';
        var DOMmain = '<div title="'+that.id+'"';
        DOMmain+= ' class="'+classes.join(' ')+'"';
        DOMmain+= ' style="background-image:none;margin-left:0;padding-left:0;">';

        //add plus button to open tag
        var DOMopen = '<span class="'+CLASS_REFERENCE_OPEN_BUTTON+'">+</span>';
        DOMmain+= DOMopen;

        var DOMtagname = '<div class="'+CLASS_REFERENCE_TAGNAME+'"';
        var txt;
        txt = that.name;
        if (that.unreadCount>0) {
          txt += " ("+that.unreadCount+")";
          DOMtagname+= ' style="font-weight:bold"';
        }
        DOMtagname+='>';
        DOMtagname+= txt;
        DOMtagname+= '</div>';
        DOMmain+= DOMtagname;
        DOMmain+= '</div>';
        DOM+= DOMmain;

        var DOMfeeds = '<div class="'+CLASS_REFERENCE_SUBTREE+'" style="display:none">';
        for (var h in that.feeds) {
          if (that.feeds[h].DOMtext=="")
            that.feeds[h].init();
          DOMfeeds+=that.feeds[h].DOMtext;
        }
        DOMfeeds+='</div>';
        DOM+=DOMfeeds;
        DOM+='</div>';
        that.DOMtext = DOM;
      }

      this.setObjects = function() {
        that.DOMmain=$("div[title|='"+that.id+"']");
        that.DOMtagname=that.DOMmain.find("div."+CLASS_REFERENCE_TAGNAME);
        that.DOM=that.DOMmain.parent();
        that.DOMopen=that.DOMmain.find('span.'+CLASS_REFERENCE_OPEN_BUTTON);
        that.DOMfeeds=that.DOM.find('div.'+CLASS_REFERENCE_SUBTREE);
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

      this.select = function(){
        //red ALL the things!
        that.DOMopen.css('color',COLOR_REFERENCE_RED);
        that.DOMtagname.addClass(CLASS_REFERENCE_RED_CLASS);
      }
      this.unselect = function() {
        that.DOMopen.css('color','#CCC');
        that.DOMtagname.removeClass(CLASS_REFERENCE_RED_CLASS);
      }
      this.decreaseCount = function() {
        that.updateCount(that.unreadCount-1);
      }
      this.increaseCount = function() {
        that.updateCount(that.unreadCount+1);
      }
    }

    function start() {
      updateReferences();
      if ((belowCircles && referenceRoot.length==0) || (!belowCircles && referenceIconParent.length==0)) {
        setTimeout(start,1000);
        return;
      }
      debug("Starting...");
      addLiveFunctions();

      getAllTagsAndFeeds();
      updateToken();
      updater();
    };

    function addLiveFunctions() {
      //click on tagname opens tag
      $(SELECTOR_CLASS_REFERENCE_TAGNAME).live('click',function() {
        showItems(this.parentNode.title);
      });
      //add open for + button
      $(SELECTOR_CLASS_REFERENCE_OPEN_BUTTON).live('click',function() {
        showTree(this.parentNode.title);
      });
      //add markRead
      $(SELECTOR_CLASS_REFERENCE_UNREAD).live('click',function() {
        var tmp = this.title.split('-');
        markRead(tmp[0],$(this),all[tmp[1]]);
      });
      //add mark unread
      $(SELECTOR_CLASS_REFERENCE_MARK_UNREAD_BUTTON).live('click',function() {
        var tmp = this.parentNode.title.split('-');
        markUnread(tmp[0],$(this.parentNode),all[tmp[1]]);
      })
      //add share
      $("#contentPane").delegate(SELECTOR_CLASS_REFERENCE_SHARE_BUTTON,'click',function(evt) {
        share(evt,$(this).parent().find("."+CLASS_REFERENCE_ENTRY_TITLE).attr('href'));
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
        return false;
      });
      $(window).keydown(cancelOtherMove);
      $(window).keyup(cancelOtherMove);
    }


    function getAllTagsAndFeeds() {
      debug("Getting tags...");
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
          debug("Tags Done. Getting feeds...");
          //get feeds
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
              debug("Feeds Done");
              createAll();
            }
          );
        }
      );
    };


    function createAll() {
      for (var el in all) {
        if (all[el].DOMtext=="")
          all[el].init();
      }
      writeAll();
    }

    function writeAll() {
      debug("Writing Menu");
      var elementList = "<div>";
      for (var el in all) {
        if (all[el].isRoot() && all[el].hasElements()) {
          elementList+=all[el].DOMtext;
        } else if (!all[el].hasElements()) {
          delete all[el];
        }
      }
      elementList+='</div>';

      //create our content
      googleReaderMenu = $("<div>").addClass(CLASS_REFERENCE_READER);

      //separator used for nice touch
      //var separator = '<div class="'+referenceBreak.attr('class')+'"></div>';

      //no red class please!!
      var classes = referenceTitle.attr('class').split(' ');
      if (referenceTitle.css('color')==COLOR_REFERENCE_RED)
        classes.pop();

      //nice title, if click, update my unread
      var title = '<div id="'+ID_REFERENCE_READER_MENU_TITLE+'" class="'+classes.join(' ')+'">Reader</div>';

      //append ALL the things!
      //googleReaderMenu.append(separator);
      googleReaderMenu.append(title);
      googleReaderMenu.append(elementList);

      //little button for changin preference
      showButton = $("<a>");
      if (!showRead) {
        showButton.text("Show Read");
        showButton.click(function(){showAll()});
      } else {
        showButton.text("Hide Read");
        showButton.click(function(){hideRead()});
      }
      googleReaderMenu.append(showButton);
      debug("Created");
      write();
      debug("Written");
      updateUnreadCount();
      //add functions
      $("div#"+ID_REFERENCE_READER_MENU_TITLE).click(function() {updateUnreadCount()});
      for (var el in all) {
        all[el].setObjects();
      }
    }

    function write() {
      //insert in menu
      if (!belowCircles) {
        var icon = $("<div>")
          .attr('id',ID_REFERENCE_ICON)
          .css('background-image','url('+chrome.extension.getURL("images/icon.png")+')')
          .css('background-size','100%')
          .css('background-repeat','no-repeat');
        var menuParent = $("<div>")
          .attr('id',ID_REFERENCE_BELOW_YOUTUBE);
        menuParent.hover(function() {
          $(this).stop().animate({'right':0});
        },function() {
          $(this).stop().animate({'right':'-168px'});
        });
        menuParent.css('top',$("#content div div").eq(3).offset().top+70);
        menuParent.append(icon);
        googleReaderMenu.css('margin-top','0');
        googleReaderMenu.css('background-color','#f5f5f5');
        googleReaderMenu.css('border','1px solid #D2D2D2');
        googleReaderMenu.css('border-right-width','0');
        googleReaderMenu.css('border-top-left-radius','2px');
        googleReaderMenu.css('border-bottom-left-radius','2px');
	      googleReaderMenu.css('box-shadow','0 0 5px rgba(0,0,0,0.1)');
	      googleReaderMenu.css('max-height','300px');
	      googleReaderMenu.css('overflow','auto');
        menuParent.append(googleReaderMenu);
        referenceIconParent.append(menuParent);
      } else {
        googleReaderMenu.insertAfter(referenceMenu);
      }
      //set parent for reference now that we've inserted it
      googleReaderMenuParent=googleReaderMenu.parent();
      //bind update if anything changes
      //google+ has a thing for refreshing everything and removing
      //my things...
      googleReaderMenuParent.bind("DOMSubtreeModified",update);
    };

    function showTree(id) {
      var element = all[id];
      if (element.DOMfeeds.css('display')=='none') {
        element.DOMopen.text('-');
        element.DOMfeeds.css('display','block');
      } else {
        element.DOMopen.text('+');
        element.DOMfeeds.css('display','none');
      }
    }

    function showItems(id) {
      debug("Showing items");
      var element = all[id];
      updateReferences(); //just in case
      //remove red from all items
      $("."+CLASS_REFERENCE_RED_CLASS).removeClass(CLASS_REFERENCE_RED_CLASS);
      if (currentTag)
        currentTag.unselect();
      currentTag = element; //set current tag
      currentUnreadCount = element.unreadCount;

      currentMax=0;

      //get top before modifying
      var titleTop = referenceContent.offset().top;

      referenceContent.unbind("DOMNodeInserted");
      referenceContent.empty();

      //Set new title
      var markAllReadButton = $('<a>')
        .addClass(CLASS_REFERENCE_MARK_ALL_READ_BUTTON)
        .text('Mark All Read');
      markAllReadButton.click(function(){markAllAsRead(currentTag)});
      var title = $("<div>").addClass(CLASS_REFERENCE_TITLE).text("Google Reader - " + currentTag.name).append(markAllReadButton);
      referenceMiddle = $("<div>").addClass(CLASS_REFERENCE_FEEDS).append(title);
      referenceMiddle.css('width',referenceContent.css('width'));
      referenceMiddle.css('height',referenceContent.css('height'));
      referenceContent.append(referenceMiddle);

      element.select();



      //if someone touches the title DOM, we will remove our red
      referenceContent.bind("DOMNodeInserted",function(evt) {
        if (evt.relatedNode.id && evt.relatedNode.id=="contentPane" && (evt.srcElement.className || evt.srcElement.className != CLASS_REFERENCE_FEEDS)) {
          referenceMiddle.remove();
          element.unselect();
          referenceContent.unbind("DOMNodeInserted",this);
        }
      });

      debug("Requesting...");

      //if we are not showing read items and the current unread count is 0
      //not requesting anything
      if (!showRead && currentTag.unreadCount==0) {
        referenceMiddle.append('<div class="noitems">No new items</div>');
      } else {
        //add loading text and request feeds
        referenceMiddle.append('<div class="noitems">Loading...</div>');
        //if not showing read, not requestin read
        var xt="";
        if (!showRead) {
          xt="?xt=user/-/state/com.google/read";
        }
        chrome.extension.sendRequest({
          method:"GET",
          dataType:'xml',
          url:"http://www.google.com/reader/atom/"+escape(currentTag.id)+xt},
          function(data) {
            console.log(data);
            debug("Data received");
            //remove loading
            referenceMiddle.find(".noitems").remove();
            //lets add our new found data!
            var list = show(data);
            if (list=="") {
              referenceMiddle.append('<div class="noitems">No new items</div>');
            } else {
              referenceMiddle.append(list);
              currentEntry=0;
              $(SELECTOR_CLASS_REFERENCE_ENTRY).eq(0).addClass(CLASS_REFERENCE_ENTRY_SELECTED);
            }
            debug("Data added");
          }
        );
      }
      //scroll to the top <==> we are not at the top already!
      if (titleTop<$("body").scrollTop())
        $("body").scrollTop(titleTop-70);
    }

    function show(data) {
      debug("Parsing items");
      var returnList = "";
      //save our precious continuation key for updating content
      if (data.feed["gr:continuation"]!=undefined)
        continuation = data.feed["gr:continuation"]["#text"];
      else
        continuation = undefined;
      var maxElements=20;
      var entries = data.feed.entry;
      if (entries==undefined)
        return [];
      var count = entries.length;
      //when its only one entry, greader gives us the gift of changing everything
      if (count==undefined) {
        entries=[entries];
        count=1;
      }
      if (!showRead && currentTag.unreadCount>maxElements)
        maxElements=currentTag.unreadCount;

      debug("Iterating entries");
      //ok, iterate on entries
      //not saving them because they change too much, not worth it
      for (var i=0; i<count; i++) {
        var count2 = entries[i].category.length;
        var read=false;
        debug("Iterating Categories");
        for (var j=0;j<count2 && !read;j++) {
          if (entries[i].category[j]["@attributes"].label==="read")
            read=true;
        }

        //only show if entry is not read or read items should be shown
        if (!read || showRead) {
          debug("Creating entry");
          //get attributes
          var text_title=entries[i].title["#text"];
          var text_url="";
          if (entries[i].link!=undefined && entries[i].link.length!=undefined) {
            text_link=entries[i].link[0]["@attributes"].href;
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
            text_link=link;
          } else {
            text_link=entries[i].link["@attributes"].href;
          }
          var text_meta = "";
          if (entries[i].source !== undefined && entries[i].source.title !== undefined) {
            text_meta = "<div class=\""+CLASS_REFERENCE_ENTRY_FEED_TITLE+"\">"+entries[i].source.title["#text"]+" </div>";
          }
          if (entries[i].published !== undefined) {
            text_meta += "<div class=\""+CLASS_REFERENCE_ENTRY_FEED_DATE+"\">"+entries[i].published["#text"].replace("T"," ").replace("Z","")+"</div>";
          }
          text_meta = "<div class=\""+CLASS_REFERENCE_ENTRY_FEED_META+"\">"+text_meta+"</div>";
          var text_summary="";
          if (entries[i].summary!=undefined) {
            text_summary=entries[i].summary["#text"];
          } else if (entries[i].content!=undefined) {
            text_summary=entries[i].content["#text"];
          }

          var entry = '<div class="'+CLASS_REFERENCE_ENTRY;
          if (!read) {
            entry+= ' '+CLASS_REFERENCE_UNREAD;
          }
          entry+='" title="'+entries[i].id["#text"]+'-'+currentTag.id+'">';

          var title = '<a target="_blank" class="'+CLASS_REFERENCE_ENTRY_TITLE+'"';
          title+=' href="'+text_link+'">';
          title+=text_title+"</a>";
          entry+=title;
          entry+=text_meta;

          var summary = '<div class="'+CLASS_REFERENCE_SUMMARY+'" style="overflow:auto">';
          summary+=text_summary+'</div>';
          entry+=summary;

          var shareButton = '<a class="'+CLASS_REFERENCE_SHARE_BUTTON+'" role="button" tabindex="0">';
          shareButton+="Share</a>";
          entry+=shareButton;

          var markButton = '<a class="'+CLASS_REFERENCE_MARK_UNREAD_BUTTON+'" role="button" tabindex="0">';
          markButton+="Mark Unread</a>";
          entry+=markButton;

          entry+='</div>';

          returnList+=entry;
          currentMax++;
        }
      }
      debug("Finished parsing");
      //WARNING: Do not return notReturnList!!!!
      return returnList;
    }

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
          if ($("#contentPane").find("*:contains('Google Reader -')").length>0) {
            currentTag.DOMtagname.click();
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
          //refresh view
          if ($("#contentPane").find("*:contains('Google Reader -')").length>0) {
            currentTag.DOMtagname.click();
          }
        }
      );
    }

    //mark entry read... blah!
    //should add a way of removing keep unread if it has it
    function markRead(id,entry,tag) {
      entry.removeClass(CLASS_REFERENCE_UNREAD);
      chrome.extension.sendRequest({
        method:"POST",
        url:"http://www.google.com/reader/api/0/edit-tag?client=googleplusreader",
        data:{"i":id,"a":"user/-/state/com.google/read","ac":"edit","T":token}},
        function(data) {
          if (data=="ERROR") {
            entry.addClass(CLASS_REFERENCE_UNREAD);
          } else {
            tag.decreaseCount();
            update();
          }
        }
      );
    }
    //guess for yourself
    function markUnread(id,entry,tag) {
      if (!entry.hasClass(CLASS_REFERENCE_UNREAD)) {
        entry.addClass(CLASS_REFERENCE_UNREAD);
        chrome.extension.sendRequest({
          method:"POST",
          url:"http://www.google.com/reader/api/0/edit-tag?client=googleplusreader",
          data:{"i":id,"r":"user/-/state/com.google/read","ac":"edit","T":token}},
          function(data) {
            if (data=="ERROR") {
              entry.removeClass(CLASS_REFERENCE_UNREAD);
            } else {
              entry.addClass(CLASS_REFERENCE_MARKED_UNREAD);
              tag.increaseCount();
              update();
            }
          }
        );
      }
    }

    //when someone scrolls, mark everything to the top as read
    //unless is marked unread
    $(window).scroll(function(evt){
      if ($(SELECTOR_CLASS_REFERENCE_ENTRY).length>0) {
        var scroll = $(this).scrollTop();
        currentEntry=0;
        var entries = $(SELECTOR_CLASS_REFERENCE_ENTRY);
        entries.filter(function(){
          return scroll>$(this).offset().top;
        }).each(function() {
          markReadAndFetch($(this));
        });
        $('.'+CLASS_REFERENCE_ENTRY_SELECTED).removeClass(CLASS_REFERENCE_ENTRY_SELECTED);
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
        var lastEntry = entries.eq(currentEntry-1);
        if (currentEntry>0 && lastEntry.offset().top+lastEntry.height()>scroll+$(window).height()) {
          currentEntry--;
        } else {
          lastEntry = entries.eq(currentEntry);
        }
        if (!lastEntry.hasClass(CLASS_REFERENCE_MARKED_UNREAD)) {
          lastEntry.click();
        }
        lastEntry.addClass(CLASS_REFERENCE_ENTRY_SELECTED);
      }
    });

    

    //mark element as read if its not marked unread and fetch next batch
    //of items if at referenceMiddle of content
    function markReadAndFetch(el) {
      currentEntry++;
      if (!fetching && currentMax-currentEntry<10 && (showRead || currentMax<currentUnreadCount)) {
        fetching=true;
        chrome.extension.sendRequest({
          method:"GET",
          dataType:'xml',
          url:"http://www.google.com/reader/atom/"+currentTag.id+"?c="+continuation},
          function(data) {
            referenceMiddle.append(show(data));
            fetching=false;
          }
        );
      }
      //click to mark read... if its read, click unbinded
      if (!el.hasClass(CLASS_REFERENCE_MARKED_UNREAD))
        el.click();
    }

    function markAllAsRead(tag) {
      chrome.extension.sendRequest({
        method:"POST",
        url:"http://www.google.com/reader/api/0/mark-all-as-read?client=googleplusreader",
        data:{"s":tag.id,"t":tag.name,"T":token}},
        function () {
          updateUnreadCount();
          currentTag.DOMtagname.click();
        }
      );
    }

    //cancel j k movements in google+ if they are directed to us
    function cancelOtherMove(evt) {
      if ($(SELECTOR_CLASS_REFERENCE_ENTRY).length>0
          && evt.target==$("body")[0]
          && (evt.which==74 || evt.which==75 || evt.which==83)) {
        if (evt.type=="keyup") {
          var toppix = 70;
          if (evt.which==74) {
            var lastEntry = $(SELECTOR_CLASS_REFERENCE_ENTRY).eq(currentEntry+1);
            $("body").scrollTop(lastEntry.offset().top-toppix);
            if (lastEntry.offset().top-toppix>$("body").scrollTop()) {
              $('.'+CLASS_REFERENCE_ENTRY).removeClass(CLASS_REFERENCE_ENTRY_SELECTED);
              lastEntry.addClass(CLASS_REFERENCE_ENTRY_SELECTED);
              currentEntry++;
              if (!lastEntry.hasClass(CLASS_REFERENCE_MARKED_UNREAD)) {
                lastEntry.click();
              }
            }
          } else if (evt.which==75 && currentEntry>=1) {
            var lastEntry = $(SELECTOR_CLASS_REFERENCE_ENTRY).eq(currentEntry-1);
            $("body").scrollTop(lastEntry.offset().top-toppix);
            if (lastEntry.offset().top-toppix>$("body").scrollTop()) {
              $('.'+CLASS_REFERENCE_ENTRY).removeClass(CLASS_REFERENCE_ENTRY_SELECTED);
              lastEntry.addClass(CLASS_REFERENCE_ENTRY_SELECTED);
              currentEntry--;
            }
          } else if (evt.which==83) {
            $(SELECTOR_CLASS_REFERENCE_ENTRY).eq(currentEntry).find(SELECTOR_CLASS_REFERENCE_SHARE_BUTTON).click();
          }
        }
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
      }
    }

    //start the engine!
    start();



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
} else if (location.href.indexOf("apps-static")==-1) {

  //reference Selectors... may change when google+ changes
  var referenceAddLinkSelector ="#nw-content span:nth-child(3)";
  var referenceLinkSelector = "#summary-view input:eq(0)";
  var referenceAddSelector = "div[role|='button']:eq(0)";
  var referenceCloseLink = "#summary-view div[tabindex|='0']";

  //listen on request to use share box
  chrome.extension.onRequest.addListener(
      function (request,sender,sendResponse) {
        //let bacground know we received the request
        sendResponse();
        loopAddLink(request.href,0);
      });

  //loop that checks continously checks if the page is loaded
  //and add the link if it is
  function loopAddLink(url,count) {
    console.log(location.href);
    if (count>10)
      return;
    try {
      var evt;
      //if close link exist, first close the last link added
      //to start anew
      var closeLink = $(referenceCloseLink);
      if (closeLink.length>1) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
        closeLink[0].dispatchEvent(evt);
        evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click","true","true",window,0,0,0,0,0,false,false,false,false,0,document.body.parentNode);
        closeLink[1].dispatchEvent(evt);
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
      setTimeout(function(){loopAddLink(url,count+1)},500);
    }
  }
}
})(jQuery);
