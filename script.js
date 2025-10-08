// elements
var btnGet = document.getElementById('f');
var elQuote = document.getElementById('q');
var elAuthor = document.getElementById('a');
var elStatus = document.getElementById('p');
var btnCopy = document.getElementById('c');
var listHistory = document.getElementById('hs');
var btnClear = document.getElementById('cl');
var btnDark = document.getElementById('d');
var elBody = document.getElementById('bd');

// keys and limits
var KEY_HISTORY = 'qh';
var KEY_DARK = 'dm';
var MAX_HISTORY = 2;

// local fallback
if (!window.localQuotes) {
  window.localQuotes = [
    { c: "Be yourself; everyone else is already taken.", a: "Oscar Wilde" },
    { c: "Do what you can, with what you have, where you are.", a: "Theodore Roosevelt" },
    { c: "The only limit to our realization of tomorrow is our doubts of today.", a: "Franklin D. Roosevelt" }
  ];
}

var historyArr = [];
var revealTimer = null;
var abortController = null;

// load saved state
try {
  var saved = localStorage.getItem(KEY_HISTORY);
  if (saved) {
    historyArr = JSON.parse(saved);
  }
} catch (ex) {
  // ignore
}

try {
  var darkSaved = localStorage.getItem(KEY_DARK);
  if (darkSaved === '1') {
    enableInvertDark();
  }
} catch (ex) {
  // ignore
}

// render history
function renderHistory() {
  if (!listHistory) {
    return;
  }
  listHistory.innerHTML = '';
  if (!historyArr || historyArr.length === 0) {
    var liEmpty = document.createElement('li');
    liEmpty.textContent = 'No history yet.';
    listHistory.appendChild(liEmpty);
    return;
  }
  for (var i = historyArr.length - 1; i >= 0; i--) {
    var item = historyArr[i];
    var li = document.createElement('li');
    var textPreview = '';
    if (item && item.c) {
      if (item.c.length > 120) {
        textPreview = item.c.slice(0, 120) + '...';
      } else {
        textPreview = item.c;
      }
    }
    li.textContent = textPreview;
    var small = document.createElement('small');
    var authorText = 'Unknown';
    if (item && item.a) {
      authorText = item.a;
    }
    small.textContent = '— ' + authorText;
    li.appendChild(small);
    listHistory.appendChild(li);
  }
}

// save history
function saveHistory(entry) {
  historyArr.push(entry);
  while (historyArr.length > MAX_HISTORY) {
    historyArr.shift();
  }
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(historyArr));
  } catch (ex) {
    // ignore
  }
  renderHistory();
}

// show author then clear quote
function showAuthorFirst(author) {
  if (!elAuthor) {
    return;
  }
  var name = author || 'Unknown';
  elAuthor.textContent = '— ' + name;
  if (elQuote) {
    elQuote.textContent = '';
  }
}

// reveal text
function revealQuote(text) {
  if (!elQuote) {
    return;
  }
  var content = text || 'No quote';
  elQuote.textContent = '"' + content + '"';
}

// loading state
function setLoading(on) {
  if (btnGet) {
    btnGet.disabled = on;
  }
  if (on) {
    if (elStatus) {
      elStatus.textContent = 'Loading...';
    }
  } else {
    setTimeout(function () {
      if (elStatus && elStatus.textContent === 'Loading...') {
        elStatus.textContent = '';
      }
    }, 700);
  }
}

// fetch a quote
function getQuote() {
  if (revealTimer) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }
  if (abortController) {
    try {
      abortController.abort();
    } catch (ex) {
      // ignore
    }
    abortController = null;
  }
  setLoading(true);
  try {
    abortController = new AbortController();
    var timeoutId = setTimeout(function () {
      try {
        if (abortController) {
          abortController.abort();
        }
      } catch (ex) {
        // ignore
      }
    }, 7000);
    fetch('https://random-quotes-freeapi.vercel.app/api/random', { signal: abortController.signal })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (res && res.ok) {
          return res.json().catch(function () { return null; });
        }
        return null;
      })
      .then(function (data) {
        var content = '';
        var author = 'Unknown';
        if (data) {
          if (data.quote) {
            content = String(data.quote).trim();
            if (data.author) {
              author = String(data.author).trim();
            }
          } else if (data.content) {
            content = String(data.content).trim();
            if (data.author) {
              author = String(data.author).trim();
            }
          } else if (data.text) {
            content = String(data.text).trim();
            if (data.author) {
              author = String(data.author).trim();
            }
          } else if (data.en) {
            content = String(data.en).trim();
            if (data.author) {
              author = String(data.author).trim();
            }
          }
        }
        if (content) {
          showAuthorFirst(author);
          revealTimer = setTimeout(function () {
            revealQuote(content);
            revealTimer = null;
          }, 900);
          saveHistory({ c: content, a: author });
          setLoading(false);
          if (elStatus) {
            elStatus.textContent = '';
          }
          abortController = null;
          return;
        }
        // fallback
        var pickIndex = Math.floor(Math.random() * window.localQuotes.length);
        var pick = window.localQuotes[pickIndex];
        showAuthorFirst(pick.a);
        revealTimer = setTimeout(function () {
          revealQuote(pick.c);
          revealTimer = null;
        }, 700);
        saveHistory({ c: pick.c, a: pick.a });
        setLoading(false);
        if (elStatus) {
          elStatus.textContent = 'Using local fallback.';
        }
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') {
          if (elStatus) {
            elStatus.textContent = 'Request cancelled.';
          }
        } else {
          var idx = Math.floor(Math.random() * window.localQuotes.length);
          var fallback = window.localQuotes[idx];
          showAuthorFirst(fallback.a);
          revealTimer = setTimeout(function () {
            revealQuote(fallback.c);
            revealTimer = null;
          }, 700);
          saveHistory({ c: fallback.c, a: fallback.a });
          if (elStatus) {
            elStatus.textContent = 'Using local fallback.';
          }
        }
        setLoading(false);
        abortController = null;
      });
  } catch (ex) {
    var rnd = Math.floor(Math.random() * window.localQuotes.length);
    var fb = window.localQuotes[rnd];
    showAuthorFirst(fb.a);
    revealTimer = setTimeout(function () {
      revealQuote(fb.c);
      revealTimer = null;
    }, 700);
    saveHistory({ c: fb.c, a: fb.a });
    setLoading(false);
    if (elStatus) {
      elStatus.textContent = 'Using local fallback.';
    }
    abortController = null;
  }
}

// copy
function copyText() {
  var txt = '';
  if (elQuote && elQuote.textContent) {
    txt += elQuote.textContent + ' ';
  }
  if (elAuthor && elAuthor.textContent) {
    txt += elAuthor.textContent;
  }
  if (!txt.trim()) {
    if (elStatus) {
      elStatus.textContent = 'Nothing to copy.';
    }
    return;
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (elStatus) {
          elStatus.textContent = 'Copied to clipboard.';
        }
      }).catch(function () {
        fallbackCopy(txt);
      });
    } else {
      fallbackCopy(txt);
    }
  } catch (ex) {
    fallbackCopy(txt);
  }
  function fallbackCopy(value) {
    var ta = document.createElement('textarea');
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (elStatus) {
        elStatus.textContent = 'Copied (fallback).';
      }
    } catch (ex2) {
      if (elStatus) {
        elStatus.textContent = 'Copy failed.';
      }
    }
    ta.remove();
  }
}

// clear history
function clearHistory() {
  historyArr = [];
  try {
    localStorage.removeItem(KEY_HISTORY);
  } catch (ex) {
    // ignore
  }
  renderHistory();
  if (elStatus) {
    elStatus.textContent = 'History cleared.';
  }
}

/* DARK MODE: invert the whole page, then invert media so media keep original look.
   This keeps text/background contrast consistent without touching many CSS rules. */

function enableInvertDark() {
  var root = document.documentElement;
  if (!root) {
    return;
  }
  if (root.dataset.invertDark === '1') {
    return;
  }
  // store original root filter
  root.dataset.origFilter = root.style.filter || '';
  // apply invert to page
  root.style.filter = (root.style.filter ? root.style.filter + ' ' : '') + 'invert(1) hue-rotate(180deg)';
  // find media and images and invert them back (so they appear normal)
  var media = document.querySelectorAll('img, picture, video, svg, canvas');
  for (var i = 0; i < media.length; i++) {
    var el = media[i];
    el.dataset.origFilter = el.style.filter || '';
    el.style.filter = (el.style.filter ? el.style.filter + ' ' : '') + 'invert(1) hue-rotate(180deg)';
  }
  root.dataset.invertDark = '1';
  try {
    localStorage.setItem(KEY_DARK, '1');
  } catch (ex) {
    // ignore
  }
  if (btnDark) {
    btnDark.setAttribute('aria-pressed', 'true');
  }
}

function disableInvertDark() {
  var root = document.documentElement;
  if (!root) {
    return;
  }
  if (root.dataset.invertDark !== '1') {
    return;
  }
  // restore root filter
  if (root.dataset.origFilter !== undefined) {
    root.style.filter = root.dataset.origFilter;
    delete root.dataset.origFilter;
  } else {
    root.style.filter = '';
  }
  // restore media filters
  var media = document.querySelectorAll('img, picture, video, svg, canvas');
  for (var i = 0; i < media.length; i++) {
    var el = media[i];
    if (el.dataset.origFilter !== undefined) {
      el.style.filter = el.dataset.origFilter;
      delete el.dataset.origFilter;
    } else {
      el.style.filter = '';
    }
  }
  delete root.dataset.invertDark;
  try {
    localStorage.setItem(KEY_DARK, '0');
  } catch (ex) {
    // ignore
  }
  if (btnDark) {
    btnDark.setAttribute('aria-pressed', 'false');
  }
}

function toggleDark() {
  var root = document.documentElement;
  if (!root) {
    return;
  }
  if (root.dataset.invertDark === '1') {
    disableInvertDark();
  } else {
    enableInvertDark();
  }
}

// wire events
if (btnGet) {
  btnGet.addEventListener('click', getQuote);
}
if (btnCopy) {
  btnCopy.addEventListener('click', copyText);
}
if (btnClear) {
  btnClear.addEventListener('click', clearHistory);
}
if (btnDark) {
  btnDark.addEventListener('click', toggleDark);
}

// initial render
renderHistory();
