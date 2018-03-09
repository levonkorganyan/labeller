const API_URL = 'http://localhost:3002';

const addModal = (elem, callback) => {
  elem.innerHTML += '<dialog><form id="classForm"><input id="classText" type="text"></form></dialog>';
  const dialog = document.querySelector("dialog");
  /*
  const button = dialog.querySelector("button");
  button.addEventListener('click', () => {
    console.log($(dialog))
    dialog.close();
  });*/

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

  const rect = img.getBoundingClientRect();

  // Handle x
  const imgOffsetLeft = rect.left + window.scrollX;
  const translatedX = _translateX(pageX);
  const scaleX = img.width / img.naturalWidth;
  const relativeX = Math.floor((translatedX - imgOffsetLeft) / scaleX);

  results.x = translatedX < imgOffsetLeft ? 0 : relativeX;
  results.x = translatedX > imgOffsetLeft + img.width ? img.naturalWidth : relativeX;

  // Handle y
  const imgOffsetTop = rect.top + window.scrollY;
  const translatedY = _translateY(pageY);
  const scaleY = img.height / img.naturalHeight;
  const relativeY = Math.floor((translatedY - imgOffsetTop) / scaleY);

  results.y = translatedY < imgOffsetTop ? 0 : relativeY;
  results.y = translatedY > imgOffsetTop + img.height ? img.naturalHeight : relativeY;

  return results;
};

const submit = (image, rect, className) => {
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
      });

      // Remove bounding box UI element
      if (boundingElement !== null) {
        $('.boundingRectangle').remove();
      }
      boundingElement = null;
    }
  };
};

draw(document.body);
