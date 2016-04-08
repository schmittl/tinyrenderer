(function (scope) {
  'use strict';

  function TinyRenderer(canvas, imageData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.imageData = imageData;
  }

  TinyRenderer.prototype.setPixel = function (x, y, imageData, color) {
    var bytesPerPixel = color.length;
    var offset = (Math.trunc(x) + imageData.width * Math.trunc(y)) * bytesPerPixel;
    for (var i = 0; i < bytesPerPixel; i++) {
      imageData.data[offset + i] = color[i];
    }
  };

  TinyRenderer.prototype.line = function (x0, y0, x1, y1, imageData, color) {
    x0 = Math.trunc(x0); // use integer values
    y0 = Math.trunc(y0);
    x1 = Math.trunc(x1);
    y1 = Math.trunc(y1);

    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;
    var e2;
    /* error value e_xy */
    var x = x0, y = y0;

    while (true) {
      this.setPixel(x, y, imageData, color);
      if (x == x1 && y == y1) break;
      e2 = 2 * err; // calculate error for next diagonal pixel

      if (e2 >= -dy) {
        err -= dy;
        x += sx;
      }

      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  };

  TinyRenderer.prototype.flipVertically = function (imageData) {
    var newImageData = this.ctx.createImageData(imageData);
    var n = newImageData.data;
    var d = imageData.data;

    // loop through over row of pixels
    for (var row = 0; row < imageData.height; row++) {
      // loop over every column
      for (var col = 0; col < imageData.width; col++) {
        var si, di, sp, dp;

        // source pixel
        sp = (imageData.width * row) + col;

        // destination pixel
        dp = (imageData.width * ((imageData.height - 1) - row)) + col;

        // source and destination indexes, will always reference the red pixel
        si = sp * 4;
        di = dp * 4;

        n[di] = d[si];     // red
        n[di + 1] = d[si + 1]; // green
        n[di + 2] = d[si + 2]; // blue
        n[di + 3] = d[si + 3]; // alpha
      }
    }

    return newImageData;
  };

  TinyRenderer.prototype.getCanvasCoordinate = function (index, vertices) {
    var p = {};
    // x, y are normalized device coordinates between [-1,1]
    var x = vertices[index + 0];
    var y = vertices[index + 1];

    // add 1 to make coordinates be between [0,2]
    // divide by 2 so coordinates are between [0,1]
    // multiply width / height to scale object
    // offset or scale could be added here by addition / multiplication
    p.x = (x + 1) / 2 * this.canvas.width;
    p.y = (y + 1) / 2 * this.canvas.height;

    return p;
  };

  TinyRenderer.prototype.addLink = function (el) {
    el.href = this.canvas.toDataURL('image/png');
    el.download = "generated.png";
  };

  TinyRenderer.prototype.renderOBJ = function (mesh, color) {
    var length = mesh.indices.length;

    for (var i = 0; i < length; i += 3) {
      var indices = mesh.indices.slice(i, i + 3); // get indices of three vertices e.g. [0, 1, 2]
      for (var j = 0; j < 3; j++) { // use indices to draw 3 lines per face (triangles)
        var vertex0 = indices[j] * 3; // first vertex index. here vertices have 3 components x, y, z and we start always on x, so multiply by 3
        var vertex1 = indices[(j + 1) % 3] * 3; // second vertex index. wrap to first vertex on last iteration

        var p0 = this.getCanvasCoordinate(vertex0, mesh.vertices); // get coordinate of first vertex
        var p1 = this.getCanvasCoordinate(vertex1, mesh.vertices); // get coordinate of second vertex

        this.line(p0.x, p0.y, p1.x, p1.y, this.imageData, color);
      }
    }

  };

  if (typeof module !== 'undefined') {
    module.exports = TinyRenderer;
  } else {
    scope.TinyRenderer = TinyRenderer;
  }

})(this);