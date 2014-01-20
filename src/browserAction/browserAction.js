'use strict';

var eventHistory;

var tabId = parseInt(window.location.search.substring(1), 10);
console.log(tabId);

var $ = document;

function scriptNameFromUrl (url) {

  var parts = url.split('/');
  return parts[parts.length - 1];
}

function renderStackTraceFrag (stackTrace) {

  var $stackTraceFrag = $.createDocumentFragment();

  var $ul = $.createElement('ul');

  stackTrace.forEach(function (trace) {

    var $li = $.createElement('li');
    var scriptName = scriptNameFromUrl(trace.url);
    var functionName = trace.functionName ? trace.functionName + ' in ' : '';
    $li.textContent = functionName + scriptName + ':' + trace.lineNumber + ',' + trace.columnNumber;

    $ul.appendChild($li);
  });

  $stackTraceFrag.appendChild($ul);

  return $stackTraceFrag;
}

function render () {

  if (!eventHistory[tabId]) {

    $.querySelector('.header .runtime-info').textContent = 'Errator is not debugging this tab.';
    return;
  }

  var $tableInnerFrag = $.createDocumentFragment();

  // clone messages into own array, sort newest to oldest
  var errors = eventHistory[tabId].errors.slice(0);
  errors = errors.sort(function (a, b) {

    return b.timestamp - a.timestamp;
  });

  console.dir(errors);

  var isOdd = false;

  errors.forEach(function (thisError) {

    isOdd = !isOdd;

    var $rowFrag = $.createDocumentFragment();

    var $tr = $.createElement('tr');
    $tr.className = isOdd ? 'odd' : '';
    var $error = $.createElement('td');
    $error.className = 'error';
    $error.textContent = thisError.text;
    $tr.appendChild($error);

    var $info = $.createElement('td');
    $info.className = 'info';

    var $url = $.createElement('div');
    $url.className = 'error';
    $url.textContent = scriptNameFromUrl(thisError.url) + ':' + thisError.line + ',' + thisError.column;
    $info.appendChild($url);

    var stackTrace = thisError.stackTrace;
    if (stackTrace && stackTrace.length) {
      var $stackTrace = renderStackTraceFrag(stackTrace);
      $info.appendChild($stackTrace);
    }

    $tr.appendChild($info);
    $rowFrag.appendChild($tr);

    $tableInnerFrag.appendChild($rowFrag);
  });

  var $log = $.getElementById('log');
  $log.innerHTML = '';
  $log.appendChild($tableInnerFrag);
}

function onClickOptions () {

  var optionsUrl = chrome.extension.getURL('src/options/options.html');
  chrome.tabs.query({'url': optionsUrl}, function (tabs) {

    if (tabs.length) {
      chrome.tabs.update(tabs[0].id, {'active': true});
    }
    else {
      chrome.tabs.create({'url': optionsUrl});
    }
  });
}

function start () {

  $.querySelector('button.options').addEventListener('click', onClickOptions);
  render();
}

window.addEventListener('load', function () {

  chrome.runtime.getBackgroundPage(function (backgroundWindow) {

    eventHistory = backgroundWindow.eventHistory;

    start();
  });
});