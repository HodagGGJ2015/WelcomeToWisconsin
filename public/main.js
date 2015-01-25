(function() {

  var inputEl = document.querySelector('.input');
  var imageEl = document.querySelector('.image');
  var descriptionEl = document.querySelector('.description');
  var locationEl = document.querySelector('.location');
  var responseEl = document.querySelector('.response');

  var engine = new Engine(Stuff, Actions);
  var history = [''];
  var history_index = 0;
  var MAX_HISTORY = 100;
  var IS_DEBUG = true;

  var minTextDelay = 30;
  var textDelay = 100;
  var textTimeoutID = -1;

  function printText(el, text, callback) {
    clearTimeout(textTimeoutID);

    if (el.innerHTML != '') {
      return;
    }

    function recur(positionIndex) {
      return function() {
        if (positionIndex <= text.length) {
          el.innerHTML = text.slice(0, positionIndex);
          textTimeoutID = setTimeout(recur(positionIndex + 1), minTextDelay + (textDelay * Math.random()));
        } else if (callback) {
          callback();
        }
      };
    }

    textTimeoutID = setTimeout(recur(0, 0), textDelay);
  }

  // set the description and image src
  function renderOutput(output, printDelay) {
    if (output.image) {
      imageEl.style.backgroundImage = 'url(' + output.image + ')';
    }

    if (printDelay) {
      // check and clear outputs that need to be updated
      var updateLocation = locationEl.innerHTML != output.location;
      var updateDescription = descriptionEl.innerHTML != output.description;
      var updateResponse = responseEl.innerHTML != output.response;

      if (updateLocation) locationEl.innerHTML = '';
      if (updateDescription) descriptionEl.innerHTML = '';
      if (updateResponse) responseEl.innerHTML = '';

      // PYRAMID OF DOOM! (for animation...)
      printText(locationEl, output.location, function() {
        printText(descriptionEl, output.description, function() {
          printText(responseEl, output.response);
        });
      });
    } else {
      descriptionEl.innerHTML = output.description;
      responseEl.innerHTML = output.response;
      locationEl.innerHTML = output.location;
    }
  }

  // prevent blur
  inputEl.addEventListener('blur', function(e) {
    e.preventDefault();
    e.target.focus();
  });

  // handle enter
  inputEl.addEventListener('keydown', function(e) {
    if (history_index + 1 == history.length) {
      history[history_index] = inputEl.value;
    }

    if (e.keyCode == 13) {
      e.preventDefault();

      // update the engine and render its output
      var value = inputEl.value.trim();

      if (!value) {
        clearTimeout(textTimeoutID);
        renderOutput(engine.getOutput(), false);
        return;
      }

      var output = engine.act(value);
      if (history.length == MAX_HISTORY) {
        history = history.slice(1);
      }
      history_index = history.push('') - 1;

      renderOutput(output, true);

      // serialize state
      localStorage.setItem('state', engine.serialize());

  	  // play audio
  	  if (output.success) {
    	if (!audio['textEnterFalse'].isLoaded) {
    	  loadSound('textEnterFalse', audio['textEnterFalse'], true);
        } else {
    	  audio['textEnterFalse'].play();
        }
  	  } else {
    	if (!audio['textEnter'].isLoaded) {
    	  loadSound('textEnter', audio['textEnter'], true);
        } else {
    	  audio['textEnter'].play();
        }
  	  }

      // clear input
      inputEl.value = '';

    } else if (e.keyCode == 38) {
      e.preventDefault();
      // scroll back in history
      if (history_index > 0) {
        history_index -= 1;
        inputEl.value = history[history_index];
      }
    } else if (e.keyCode == 40) {
      e.preventDefault();
      // scroll forward in history
      if (history_index + 1 < history.length) {
        history_index += 1;
        inputEl.value = history[history_index];
      }
    }
  });

  if (!IS_DEBUG) {
    engine.deserialize(localStorage.getItem('state'));
  }
  renderOutput(engine.act('look'), true);

}).call(this);
