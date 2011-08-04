if (window==top) {
  var elements=[];
  var unread=[];
  var googleReader;
  var googleReaderParent;
  var shareButton;

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
  var referenceShareButton = $("span[role|='button'].d-k.yl").first()[0];

  function updateReferences() {
    reference = $("a[href^='/sparks/']").first();
    referenceTitle = $("a[href^='/sparks']").first();
    referenceBreak = referenceTitle.prev();
    referenceMenu = $('#content a[href|="/notifications/all"]');
    middle = $("#contentPane").find("div[aria-live|='polite']");
    referenceContent = middle.first("div");
  }

  function start() {
    elements = [];
    unread = [];
    updateReferences();
    getUnread();
    middle.parent().bind('DOMSubtreeModified',updateReferences);
    updater();
  };

  function updater() {
    setTimeout(function() {
      update();
      updater();
    },5000);
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
      var li = $("<a>");
      var txt =elements[i].name;
      if (elements[i].count!=undefined) {
        txt += " ("+elements[i].count+")";
        li.css('font-weight','bold');
      }
      li.text(txt)
        .addClass(reference.attr('class'));
      var id = elements[i].id;
      li.click((function(id) {
        return function() {
          chrome.extension.sendRequest({
            method:"GET",
            dataType:'xml',
            url:"http://www.google.com/reader/atom/"+id},
            function(data) {
              show(data);
            }
          );
        };
      })(id));
      elementList.append(li);
    }
    googleReader = $("<div>")
      .addClass("googleplusreader");
    var separator = $("<div>")
      .addClass(referenceBreak.attr('class'));
    var title = $("<div>") 
      .text("Google Reader")
      .addClass(referenceTitle.attr('class'));
    googleReader.append(separator,title,elementList);
    //injectFunctions();
    writeElements();
  };

  function injectFunctions() {
    var script   = document.createElement("script");
    script.type  = "text/javascript";
    script.text  = "";
    document.body.appendChild(script);
  };

  function writeElements() {
    googleReader.insertAfter(referenceMenu);
    googleReaderParent=googleReader.parent();
    googleReaderParent.bind("DOMSubtreeModified",update);
  };
  function update() {
    if (googleReader!=undefined) {
      updateReferences();
      googleReaderParent.unbind('DOMSubtreeModified',update);
      googleReader.insertAfter(referenceMenu);
      googleReaderParent.bind("DOMSubtreeModified",update);
    }
  };

  function show(data) {
    var entries = data.feed.entry;
    var count = entries.length;
    var content = $("<div>").addClass(referenceContent.attr('class'));
    for (var i=0; i<count; i++) {
      var entry = $("<div>").addClass(referenceEntry);
      if (entries[i].link.length!=undefined) {
        entries[i].link=entries[i].link[0];
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
      content.append(entry);
    }
    console.log(middle.attr('class'));
    middle.empty();
    middle.append(content);
  }
  start();

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
