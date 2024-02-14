<template>
  <div class="header">
    <div class="float-left">
      <div class="float-left" id="logo">
        <img :src="require('../../assets/logo.svg')" width="125" height="61">
      </div>

      <div class="float-right view-type-container">
        <div class="view-type">
          equpiment
        </div>
        <div class="view-type">
          planview
        </div>
        <div class="view-type">
          electrical
        </div>
      </div>
      <div class="float-right border-left" style="height: 61px;">
        <h1 id="header-text"></h1>
      </div>
    </div>
    <div class="float-right">
      <button id="homeBtn" @click="saveDrawing()">Save</button>
    </div>
  </div>
  <div v-show="showDrawing == false"
    style="border: solid 1px #ccc; height: 360px; margin: 1em 0; text-align: center; border-radius: 4px;" id="map"
    class="map"></div>

  <div id="container" v-show="showDrawing">
    <div class="drawing">
      <canvas id="c"></canvas>
    </div>
    <div id="toolbar-container">
      <div id="toolbar">
        <div class="tool">
          <div class="tool-item" :class="{ 'selected-tool': inDrawingMode === 'none' }" id="select" @click="selectMode()">
            <img :src="require('../../assets/select.svg')" width="24" height="24">
            <div>Select</div>
          </div>
        </div>
        <div class="tool" data-tg-tour='The final step<br> <img src="b6e5ff47724ef4eb6a69.svg" height="500" width="500">'
          data-tg-order="99">
          <div class="tool-item" :class="{ 'selected-tool': inDrawingMode === 'pan' }" id="pan" @click="panMode($event)">
            <img :src="require('../../assets/pan.svg')" width="24" height="24">
            <div>Pan</div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-item" :class="{ 'selected-tool': inDrawingMode === 'connect' }" id="connect"
            @click="changeDrawingMode('CONNECT')">
            <img :src="require('../../assets/diagonal-line.svg')" width="24" height="24">
            <div>Line</div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-item" id="delete" @click="deleteItem()">
            <img :src="require('../../assets/trash.svg')" width="24" height="24">
            <div>Delete</div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-item" id="notes" @click="addNote()">
            <img :src="require('../../assets/note.svg')" width="24" height="24">
            <div>Note</div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-item" id="compass" @click="addCompass()">
            <img :src="require('../../assets/compass.svg')" width="24" height="24">
            <div>Compass</div>
          </div>
        </div>
        <!-- <div class="tool">
          <div class="tool-item" id="callout">
            <img :src="require('../../assets/callout.svg')" width="24" height="24">
            <div>Callout</div>
          </div>
        </div> -->
        <div class="tool">
          <div class="tool-item" id="undo" @click="undo()">
            <img :src="require('../../assets/undo.svg')" width="24" height="24">
            <div>Undo</div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-item" id="redo">
            <img :src="require('../../assets/redo.svg')" width="24" height="24" @click="freeDraw()">
            <div>Redo</div>
          </div>
        </div>
      </div>
    </div>

    <div id="right-sidebar">
      <div class="library" data-dropdown="landscape">
        <div id="right-sidebar-header">Add To Drawing</div>
        <img :src="require('../../assets/arrow_drop_down.svg')" width="24" height="24">
      </div>
      <div class="library-items-container" id="landscape-items">
        <div class="library-item" v-for="item in imageList" @click="addImage(item.name)"
          @dragstart="dragStartImage(item)">
          <img class="float-left" :src="item.src" width="45" height="45">
          <div class="float-right library-item-text">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import drawingFunctions from '.././js/drawingfunctions.js';
import type from '.././js/types.js';
import { fabric } from "fabric";
import imageList from '.././js/images.js';

export default {
  name: 'DrawingPage',
  data() {
    return {
      // base tool
      canvas: null,
      showDrawing: true,

      imageList: [],

      drawingMode: '',
      lineOrientation: '',

      calloutNumber: 1,

      // temp variable for objects being drawn
      line: new fabric.Line(),
      rectangle: new fabric.Rect(),
      circle: new fabric.Circle(),

      inDrawingMode: '',
      isDrawing: false,

      connectCircles: [],
      connectLines: [],

      lineCircle: {
        x: 0,
        y: 0,
        isInCircle: false
      },

      // constants
      lineCircleSize: 16,
      canvasWidth: 5000,
      canvasHeight: 5000,

      dontDrawStartCircle: false,
      dontDrawEndCircle: false,

      currentLineTextbox: null,

      currentDragImg: null
    }
  },

  async mounted() {

    this.canvas = new fabric.Canvas('c', {
      selection: true,
      preserveObjectStacking: true
    });

    fabric.Object.prototype.transparentCorners = false;

    this.resizeCanvas();
    //window.addEventListener('resize', this.resizeCanvas());

    this.lineOrientation = type.lineOrientations.NONE;

    this.imageList = imageList;
    console.log('image list', imageList)

    const that = this;

    fabric.Image.fromURL(require('../../assets/grid.png'), function (Image) {
      that.canvas.setBackgroundImage(Image);
      that.canvas.renderAll();
    })

    this.canvas.on('mouse:move', function (e) {
      that.mouseMove(e, this);
    });

    this.canvas.on('mouse:down', function (e) {
      that.mouseDown(e, this);
    });

    this.canvas.on('mouse:up', function () {
      that.mouseUp(this);
    });

    // drag and drop http://jsfiddle.net/Ahammadalipk/w8kkc/185/
    this.canvas.on('dragenter', function () {
      console.log('dragenter');
    });

    this.canvas.on('dragover', function (e) {
      that.dragover(e);
    });

    this.canvas.on('dragleave', function () {
      console.log('dragleave');
    });

    this.canvas.on('drop', function (e) {
      that.drop(e);
    });
  },

  created() {

  },

  methods: {
    addCanvasResize() {
      // try this? or kms
      //https://www.nightprogrammer.com/vue-js/how-to-detect-screen-width-and-update-it-on-resize-in-vue-js-example/
    },

    resizeCanvas() {
      console.log('resize', document.getElementsByClassName('drawing'));

      if (document.getElementsByClassName('drawing').length > 0) {
        const container = document.getElementsByClassName('drawing')[0];
        const canvasContainer = container.getElementsByClassName('canvas-container')[0];
        canvasContainer.style.width = 'unset';
        canvasContainer.style.height = 'unset';
        this.canvas.setDimensions({ width: container.offsetWidth, height: container.offsetHeight });
      }
    },

    mouseMove(e, that) {
      if (that.isDragging) {
        var event = e.e;
        var vpt = that.viewportTransform;
        vpt[4] += event.clientX - that.lastPosX;
        vpt[5] += event.clientY - that.lastPosY;
        this.enforceBounds();
        that.requestRenderAll();
        that.lastPosX = event.clientX;
        that.lastPosY = event.clientY;
      }

      if (this.isDrawing) {

        if (this.inDrawingMode == type.drawingMode.LINE || this.inDrawingMode == type.drawingMode.CONNECT) {
          var pointer = this.canvas.getPointer(e.e);
          var x;
          var y;

          switch (this.lineOrientation) {
            case type.lineOrientations.NONE:
              x = pointer.x;
              y = pointer.y;
              break;
          }

          let autoLock = false;
          let autoLockX = 0;
          let autoLockY = 0;

          if (this.inDrawingMode == type.drawingMode.CONNECT) {
            for (let circle of this.connectCircles) {
              const cords = circle._getLeftTopCoords();

              //var isCenter = pointer.x == cords.x + this.lineCircleSize && pointer.y == cords.y + this.lineCircleSize;

              // if (isCenter) {
              //   // circle.set('selectable', false);
              // } else {

              if (circle.containsPoint(pointer)) {
                autoLock = true;
                autoLockX = cords.x + this.lineCircleSize;
                autoLockY = cords.y + this.lineCircleSize;
                break;
              }

              //   circle.set('selectable', false);
              // }

              this.canvas.renderAll();
            }
          }

          this.dontDrawEndCircle = false;
          if (autoLock == true) {
            this.dontDrawEndCircle = true;
            // auto lock to center of circle
            this.line.set({
              x2: autoLockX,
              y2: autoLockY
            });
          } else {
            this.line.set({
              x2: x,
              y2: y
            });
          }
        } else if (this.inDrawingMode == type.drawingMode.RECTANGLE) {
          // TODO delete pointer?
          pointer = this.canvas.getPointer(e.e);
          var origX = this.rectangle.left;
          var origY = this.rectangle.top;

          if (origX > pointer.x) {
            this.rectangle.set({
              left: Math.abs(pointer.x)
            });
          }
          if (origY > pointer.y) {
            this.rectangle.set({
              top: Math.abs(pointer.y)
            });
          }

          this.rectangle.set({
            width: Math.abs(origX - pointer.x)
          });

          this.rectangle.set({
            height: Math.abs(origY - pointer.y)
          });
        } else if (this.inDrawingMode == type.drawingMode.CIRCLE) {
          // TODO delete pointer?
          pointer = this.canvas.getPointer(e.e);

          // TODO delete origX?
          origX = this.circle.left;

          this.circle.set({
            radius: Math.abs(origX - pointer.x)
          })
        }

        // drawingFunctions.recalculate(this.canvas, this.line);
      } else {
        if (this.inDrawingMode == type.drawingMode.CONNECT) {
          // TODO delete pointer?
          pointer = this.canvas.getPointer(e.e);

          let isInCircle = false;
          let inCircleX = 0;
          let inCircleY = 0;

          // loop over cirlces to see if cursor is over it
          for (let circle of this.connectCircles) {
            var cords = circle._getLeftTopCoords();
            const isCenter = pointer.x == cords.x + this.lineCircleSize && pointer.y == cords.y + this.lineCircleSize;

            if (isCenter) {
              circle.set('opacity', 1.0);
              circle.set('selectable', false);
              this.canvas.renderAll();
            } else {

              if (circle.containsPoint(pointer)) {
                isInCircle = true;
                inCircleX = cords.x;
                inCircleY = cords.y;
              }

              circle.set('opacity', 0.5);
              circle.set('selectable', false);
              this.canvas.renderAll();
            }

            // if hovering circle then auto connect line to circle
            if (isInCircle == true) {
              this.lineCircle.isInCircle = true;
              this.lineCircle.x = inCircleX + this.lineCircleSize;
              this.lineCircle.y = inCircleY + this.lineCircleSize;
            } else {
              this.lineCircle.isInCircle = false;
              this.lineCircle.x = 0;
              this.lineCircle.y = 0;
            }
          }
        }
      }

      this.canvas.renderAll();
    },

    mouseUp(that) {
      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      that.setViewportTransform(that.viewportTransform);
      that.isDragging = false;
      that.selection = true;

      if (this.inDrawingMode == type.drawingMode.LINE || this.inDrawingMode == type.drawingMode.DASH) {
        this.line.setCoords();
        this.isDrawing = false;
        this.makeObjectsNotSelectable(this.canvas);
        //this.canvas.saveState();
      }

      if (this.inDrawingMode == type.drawingMode.CONNECT) {

        const line = this.line;
        if (line.x1 !== line.x3 && line.y1 !== line.y2) {
          if (this.dontDrawEndCircle === false) {
            const x = this.line.x2 - this.lineCircleSize;
            const y = this.line.y2 - this.lineCircleSize;

            this.createConnectCircle(x, y);
          }

          if (this.dontDrawStartCircle === false) {
            const x = this.line.x1 - this.lineCircleSize;
            const y = this.line.y1 - this.lineCircleSize;

            this.createConnectCircle(x, y);
          }
        }

        this.line.setCoords();
        this.isDrawing = false;
        this.makeObjectsNotSelectable(this.canvas);

        if (this.currentLineTextbox) {
          this.canvas.remove(this.currentLineTextbox);
        }

        //this.canvas.saveState();
      }

      if (this.inDrawingMode == type.drawingMode.RECTANGLE) {
        this.rectangle.setCoords();
        this.isDrawing = false;
        this.makeObjectsNotSelectable(this.canvas);
        //this.canvas.saveState();
      } else if (this.inDrawingMode == type.drawingMode.CIRCLE) {
        this.circle.setCoords();
        this.isDrawing = false;
        this.makeObjectsNotSelectable(this.canvas);
        //this.canvas.saveState();
      }
    },

    mouseDown(e, that) {
      var evt = e.e;

      if (this.inDrawingMode === type.drawingMode.PAN) {
        that.isDragging = true;
        that.selection = false;
        that.lastPosX = evt.clientX;
        that.lastPosY = evt.clientY;
      }

      if (this.inDrawingMode == type.drawingMode.LINE || this.inDrawingMode == type.drawingMode.CONNECT) {
        this.dontDrawStartCircle = false;
        this.isDrawing = true;
        var pointer = this.canvas.getPointer(e.e);
        var points = [pointer.x, pointer.y, pointer.x, pointer.y];

        if (this.inDrawingMode == type.drawingMode.CONNECT && this.lineCircle.isInCircle == true) {
          points[0] = this.lineCircle.x;
          points[1] = this.lineCircle.y;
          this.dontDrawStartCircle = true;
        }


        if (this.inDrawingMode == type.drawingMode.CONNECT) {
          this.createConnectLine(points);
        }
      }

      if (this.inDrawingMode == type.drawingMode.DASH) {

        this.isDrawing = true;
        const pointer = this.canvas.getPointer(e.e);
        const points = [pointer.x, pointer.y, pointer.x, pointer.y];

        //make the dash line
        this.line = new fabric.Line(points, {
          isDash: true,
          orientation: this.lineOrientation,
          perPixelTargetFind: true,
          stroke: 'black',
          strokeWidth: 5,
          strokeDashArray: [15, 5],
          //hasBorders: false,
          //lockScalingX: true,
          //lockScalingY: true,
          strokeUniform: true,
          lockSkewingX: true,
          lockSkewingY: true,
          hoverCursor: 'crosshair',
        });

        this.line.set('toObjectType', 'dashLine');
        this.canvas.add(this.line);
      }

      if (this.inDrawingMode == type.drawingMode.RECTANGLE) {

        this.isDrawing = true;
        const pointer = this.canvas.getPointer(e.e);
        var origX = pointer.x;
        var origY = pointer.y;

        this.rectangle = new fabric.Rect({
          isRectangle: true,
          left: origX,
          top: origY,
          originX: 'left',
          originY: 'top',
          width: pointer.x - origX,
          height: pointer.y - origY,
          radius: 5,
          angle: 0,
          stroke: 'black',
          strokeWidth: 5,
          fill: '',
          transparentCorners: false,
          hoverCursor: 'crosshair',
          selectable: true
        });

        this.rectangle.set('toObjectType', 'rectangle');
        this.canvas.add(this.rectangle);
      }

      if (this.inDrawingMode == type.drawingMode.CIRCLE) {

        this.isDrawing = true;
        const pointer = this.canvas.getPointer(e.e);
        const origX = pointer.x;
        const origY = pointer.y;

        this.circle = new fabric.Circle({
          isCircle: true,
          left: origX,
          top: origY,
          originX: 'center',
          originY: 'center',
          radius: 1,
          stroke: 'black',
          strokeWidth: 5,
          fill: '',
          hoverCursor: 'crosshair',
          selectable: true
        });

        this.circle.set('toObjectType', 'circle');
        this.canvas.add(this.circle);
      }
    },

    enforceBounds() {
      var vpt = this.canvas.viewportTransform;
      const minX = this.canvas.getWidth() - (this.canvasWidth * this.canvas.getZoom());
      const minY = this.canvas.getHeight() - (this.canvasHeight * this.canvas.getZoom());
      vpt[4] = Math.min(Math.max(vpt[4], minX), 0);
      vpt[5] = Math.min(Math.max(vpt[5], minY), 0);
    },

    makeObjectsNotSelectable() {
      this.canvas.discardActiveObject();
      this.canvas.hoverCursor = 'default';
      this.canvas.selection = false;
      this.canvas.forEachObject(function (o) {
        o.selectable = false;
      });
      this.canvas.renderAll();
    },

    makeObjectsSelectable() {
      this.canvas.selection = true;
      this.canvas.forEachObject(function (o) {
        o.selectable = true;
      });
      this.canvas.renderAll();
    },

    getLineCoords(line) {
      const points = line.calcLinePoints();
      const matrix = line.calcTransformMatrix();
      const point1 = fabric.util.transformPoint({ x: points.x1, y: points.y1 }, matrix);
      const point2 = fabric.util.transformPoint({ x: points.x2, y: points.y2 }, matrix);
      return { x1: point1.x, y1: point1.y, x2: point2.x, y2: point2.y };
    },

    calcAngle(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const theta = Math.atan2(dy, dx);
      return theta * (180 / Math.PI);
    },

    createConnectLine(points) {
      this.line = new fabric.Line(points, {
        stroke: 'black',
        drawnDirection: 'none',
        perPixelTargetFind: true,
        strokeWidth: 5,
        //hasBorders: false,
        //lockScalingX: true,
        //lockScalingY: true,
        strokeUniform: true,
        lockSkewingX: true,
        lockSkewingY: true,
        hoverCursor: 'crosshair'
      });

      this.line.set('toObjectType', 'line');

      this.canvas.add(this.line);

      this.connectLines.push(this.line);
    },

    changeDrawingMode(drawingMode) {
      this.inDrawingMode = type.drawingMode[drawingMode];
      this.makeObjectsNotSelectable();
    },

    deleteItem() {
      this.inDrawingMode = type.drawingMode.NONE;
      drawingFunctions.deleteSelected(this.canvas);
    },

    addNote() {
      this.inDrawingMode = type.drawingMode.NONE;

      var note = new fabric.Textbox('', {
        fill: 'black',
        fontSize: 16,
        fontFamily: 'Arial',
        lineHeight: 1,
        borderColor: 'black',
        padding: 1,
        textBackgroundColor: 'white',
        hoverCursor: 'default',
        width: 200,
        height: 100,
        lockScalingX: false,
        lockScalingY: false,
        lockUniScaling: false,
        lockSkewingX: true,
        lockSkewingY: true,
        top: 30,
        left: 30,
        backgroundColor: 'white',
        text: 'Note:'
      });

      this.canvas.add(note);
      //this.canvas.saveState();
    },

    selectMode() {
      this.inDrawingMode = type.drawingMode.NONE;
      this.makeObjectsSelectable();
    },

    panMode(e) {
      e.preventDefault();
      this.inDrawingMode = type.drawingMode.PAN;
      this.canvas.discardActiveObject();
      this.makeObjectsNotSelectable(this.canvas);
    },

    addCompass() {

    },

    dragover(e) {
      if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
      }

      return false;
    },

    drop(e) {
      if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
      }

      // center the dropped image on cursor
      const x = e.e.layerX - (this.currentDragImg.width / 2);
      const y = e.e.layerY - (this.currentDragImg.height / 2);
      const that = this;

      fabric.Image.fromURL(this.currentDragImg.src, function (oImg) {
        oImg.set({
          left: x,
          top: y,
          readOut: {
            imagetype: that.currentDragImg.name
          }
        });

        that.canvas.add(oImg);
        that.allowRotateAndResize();
        that.canvas.setActiveObject(oImg);

        console.log(oImg.width);
      });

      this.inDrawingMode = type.drawingMode.NONE;

      return false;
    },

    dragStartImage(img) {
      this.currentDragImg = img;
    },

    addImage(name) {
      const image = imageList.find(x => x.name === name);
      this.canvas.selection = true;
      this.canvas.set("selection", true);

      this.inDrawingMode = type.drawingMode.NONE;

      const that = this;

      fabric.Image.fromURL(image.src, function (oImg) {
        oImg.set({
          left: (200),
          top: (100),
          readOut: {
            imagetype: image.name
          },
          selectable: true,
          resizable: true,
          lockRotation: false,
          lockScaling: false
        });

        that.canvas.add(oImg);
        that.allowRotateAndResize();
        that.canvas.setActiveObject(oImg);
        //that.canvas.saveState();
      });
    },

    freeDraw() {
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.width = 5;
    },

    async finalize() {
      this.inDrawingMode = type.NONE;
      //const rawData = _canvas.toDatalessJSON();

      const bounds = drawingFunctions.getDrawingBounds(this.canvas);
      drawingFunctions.finalize(this.canvas);
      const blob = drawingFunctions.exportBlob(this.canvas, bounds);
      const aTag = document.createElement('a');
      aTag.href = URL.createObjectURL(blob);
      aTag.download = 'drawing.png';
      aTag.click();
    },

    // TODO move to functions file
    fileToDataURI(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const dataURI = reader.result;
          resolve(dataURI);
        };

        reader.onerror = error => {
          reject(error);
        };

        reader.readAsDataURL(file);
      });
    },

    allowRotateAndResize() {
      // for some reason the default resize and rotate are not selectable unless I select all
      this.canvas.discardActiveObject();
      var sel = new fabric.ActiveSelection(this.canvas.getObjects(), {
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(sel);
      this.canvas.requestRenderAll();
      this.canvas.discardActiveObject();
    },

    undo() {

    },

    createConnectCircle(x, y) {
      let circle = new fabric.Circle({
        left: x,
        top: y,
        strokeWidth: 5,
        opacity: 0.5,
        radius: this.lineCircleSize,
        fill: 'transparent',
        // stroke: '#666',
        perPixelTargetFind: true,
        selectable: false
      });

      circle.position = "left";
      circle.hasControls = false;
      circle.selectable = false;

      this.canvas.add(circle);
      this.connectCircles.push(circle);
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../app.scss";
</style>