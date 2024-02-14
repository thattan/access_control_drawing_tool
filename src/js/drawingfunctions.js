import { fabric } from "../../node_modules/fabric";

fabric.Canvas.prototype.getItemByName = function (name) {
  var object = null,
      objects = this.getObjects();

  for (var i = 0, len = this.size(); i < len; i++) {
      if (objects[i].name && objects[i].name === name) {
          object = objects[i];
          break;
      }
  }

  return object;
};

function getLineCoords(line) {
  const points = line.calcLinePoints();
  const matrix = line.calcTransformMatrix();
  const point1 = fabric.util.transformPoint({ x: points.x1, y: points.y1 }, matrix);
  const point2 = fabric.util.transformPoint({ x: points.x2, y: points.y2 }, matrix);
  return { x1: point1.x, y1: point1.y, x2: point2.x, y2: point2.y };
}

function calcAngle(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const theta = Math.atan2(dy, dx);
  return theta * (180 / Math.PI);
}

function deleteCallout(groupName, _canvas) {
  _canvas.forEachObject(function (o) {
    if (typeof o !== 'undefined') {
      if (Object.prototype.hasOwnProperty.call(o, 'groupName') && o.groupName == groupName) {
        _canvas.remove(o);
      }
    }
  });
}

var drawingFunctions = {
  // Gets the size of the drawing to make the image the right size
  getDrawingBounds(_canvas, legendPadding) {
    let left = null;
    let top = null;
    let bottom = null;
    let right = null;
    const objects = _canvas.getObjects();
    console.log(objects);
    if (objects.length > 0) {
      // get bounds of fence
      objects.forEach(o => {
        const coords = o.aCoords;
        left = left ? Math.min(coords.tl.x, left) : coords.tl.x;
        top = top ? Math.min(coords.tl.y, top) : coords.tl.y;
        const boxRight = coords.br.x;
        const boxBottom = coords.br.y;
        bottom = bottom ? Math.max(boxBottom, bottom) : boxBottom;
        right = right ? Math.max(boxRight, right) : boxRight;
      });
    }
    else {
      left = 0;
      top = 0;
      bottom = _canvas.getHeight();
      right = _canvas.getWidth();
    }

    // legend padding is how much space we need at the bottom so that the legend does not override the fence
    legendPadding = legendPadding || 100;
    // guesstimate for legend
    left -= 35;
    top -= 35;
    bottom += legendPadding;
    right += 35;

    // make square
    const width = right - left;
    const height = bottom - top;
    if (width > height) {
      const adjustment = (width - height) / 2;
      top -= adjustment;
      bottom += adjustment;
    }
    else if (height > width) {
      const adjustment = (height - width) / 2;
      left -= adjustment;
      right += adjustment;
    }

    return {
      left,
      top,
      bottom,
      right
    }
  },

  exportBlob(_canvas, bounds) {
    bounds = bounds || this.getDrawingBounds(_canvas);
    // need to reset the viewport transform otherwise the zoom and pan messes with the export
    _canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    _canvas.renderAll();
    var dataURL = _canvas.toDataURL({
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
      left: bounds.left,
      top: bounds.top,
      format: 'png',
    });

    // convert the dataurl to a blob (to send back to the server)
    var bytestring = atob(dataURL.split(',')[1]);
    var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(bytestring.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < bytestring.length; i++) {
      ia[i] = bytestring.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  },

  //delete the selected objects
  deleteSelected(_canvas) {
    _canvas.getActiveObjects().forEach((obj) => {

      //there are lots of objects in a callout so remove them all
      if (Object.prototype.hasOwnProperty.call(obj, 'name') && obj.name.substring(0, 7) == 'callout') {
        deleteCallout(obj.groupName, _canvas);
      }

      //dont let user remove textbox that shows measurements for lines and gates
      if (obj.type === 'textbox' && Object.prototype.hasOwnProperty.call(obj, 'name')) {
        return;
      }

      _canvas.remove(obj);
    });

    //recalculate(_canvas);
    _canvas.discardActiveObject().renderAll();
  },

  //do this so you don't move objects while drawing
  makeObjectsNotSelectable(_canvas) {
    console.log('no select')
    _canvas.discardActiveObject(); //deselect any thing selected
    _canvas.hoverCursor = 'default'; //show the user they are ready to draw
    _canvas.selection = false;
    _canvas.forEachObject(function (o) {
      o.selectable = false;
    });
    _canvas.renderAll();
  },

  makeObjectsSelectable(_canvas) {
    _canvas.selection = true;
    _canvas.forEachObject(function (o) {
      o.selectable = true;
    });
    _canvas.renderAll();
  },

  finalize(_canvas) {
    //remove background grid image
    // _canvas.backgroundImage = 0;
    _canvas.backgroundColor = '#FFFFFF';

    _canvas.renderAll();
  }
}

export default drawingFunctions;