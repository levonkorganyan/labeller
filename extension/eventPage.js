const API_URL = 'http://localhost:3002';

const addModal = (elem, callback) => {
  elem.innerHTML += '<dialog><form id="classForm"><input id="classText" type="text"></form><br><button class="close">Close</button></dialog>';
  const dialog = document.querySelector("dialog");
  const button = dialog.querySelector("button");
  button.addEventListener('click', () => {
    dialog.close();
  });

  dialog.addEventListener('keypress', (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      callback($("#classText").val());
      dialog.close();
    }
  });
  dialog.showModal();
}

// TODO abstract to util module?
const _translateX = (x) => {
  return x - $(window).scrollLeft();
};

const _translateY = (y) => {
  return y - $(window).scrollTop();
};

const getRelativePoint = (img, pageX, pageY) => {
  const results = {
    x: 0, y: 0
  };

  const imgOffsetLeft = _translateX(img.offsetLeft);
  const translatedX = _translateX(pageX);
  const relativeX = translatedX - imgOffsetLeft;
  results.x = translatedX < imgOffsetLeft ? 0 : relativeX;
  results.x = translatedX > imgOffsetLeft + img.naturalWidth ? img.naturalWidth : relativeX;

  const imgOffsetTop = _translateY(img.offsetTop);
  const translatedY = _translateY(pageY);
  const relativeY = translatedY - imgOffsetTop;
  results.y = translatedY < imgOffsetTop ? 0 : relativeY;
  results.y = translatedY > imgOffsetTop + img.naturalHeight ? img.naturalHeight : relativeY;

  return results;
};

const submit = (image, rect, className) => {
  console.log(className);
  $.ajax({
    url: API_URL,
    type: 'PUT',
    data: JSON.stringify({
      url: image.src,
      rect: rect,
      class: className
    }),
    contentType: 'application/json',
    success: () => {
      console.log('Successfully shipped!');
    }
  });
}

const draw = (element) => {
  const mouse = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  };

  updatePosition = (ev) => {
    mouse.x = ev.clientX + window.pageXOffset;
    mouse.y = ev.clientY + window.pageYOffset;
  };

  let boundingElement = null;

  element.onmousemove = (ev) => {
    updatePosition(ev);
    if (boundingElement !== null) {
      boundingElement.style.width = Math.abs(mouse.x - mouse.startX) + 'px';
      boundingElement.style.height = Math.abs(mouse.y - mouse.startY) + 'px';
      boundingElement.style.left = (mouse.x - mouse.startX < 0) ? mouse.x + 'px' : mouse.startX + 'px';
      boundingElement.style.top = (mouse.y - mouse.startY < 0) ? mouse.y + 'px' : mouse.startY + 'px';
    }
  };

  let image = null;

  element.onmousedown = (ev) => {
    // Check key combo
    if (!ev.ctrlKey || !(ev.target instanceof HTMLImageElement)) {
      return;
    }
    ev.preventDefault();

    if (boundingElement == null) {
      image = ev.target;

      mouse.startX = mouse.x;
      mouse.startY = mouse.y;

      boundingElement = document.createElement('div');
      boundingElement.className = 'boundingRectangle';
      boundingElement.style.left = mouse.x + 'px';
      boundingElement.style.top = mouse.y + 'px';
      boundingElement.style.border = '1px solid #FF0000';
      boundingElement.style.position = 'absolute';

      element.appendChild(boundingElement);
    }
  };

  element.onmouseup = (ev) => {
    if (image !== null) {
      startPoint = getRelativePoint(image, mouse.startX, mouse.startY);
      endPoint = getRelativePoint(image, mouse.x, mouse.y);
      console.log('Start point: ' + JSON.stringify(startPoint));
      console.log('End point: ' + JSON.stringify(endPoint));

      const offsets = {
        left: Math.min(startPoint.x, endPoint.x),
        top: Math.min(startPoint.y, endPoint.y),
      };
      const dim = {
        width: Math.max(startPoint.x, endPoint.x) - offsets.left,
        height: Math.max(startPoint.y, endPoint.y) - offsets.top
      };
      const rect = Object.assign({}, offsets, dim);

      addModal(element, (className) => {
        submit(image, rect, className);
        image = null;

        // Remove bounding box UI element
        if (boundingElement !== null) {
          console.log($('.boundingRectangle'));
          $('.boundingRectangle').remove();
        }
        boundingElement = null;
      });
    }
  };
};

draw(document.body);
