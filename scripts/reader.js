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
