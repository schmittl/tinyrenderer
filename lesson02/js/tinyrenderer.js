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

  TinyRenderer.prototype.triangle = function (v0, v1, v2, color) {
    if(v0[1] === v1[1] && v1[1] === v2[1]) return;

    // sort v0 <= v1 <= v2
    var tmp;
    if (v0[1] > v1[1]) {
      tmp = v1;
      v1 = v0;
      v0 = tmp;
    }
    if (v0[1] > v2[1]) {
      tmp = v2;
      v2 = v0;
      v0 = tmp;
    }
    if (v1[1] > v2[1]) {
      tmp = v2;
      v2 = v1;
      v1 = tmp;
    }

    // draw flat top triangle
    if (v1[1] === v2[1]) {
      fillFlatTopTriangle.call(this, v0, v1, v2, color);
    } else if (v0[1] === v1[1]) { // draw flat bottom
      fillFlatBottomTriangle.call(this, v0, v1, v2, color);
    } else { // general case
      var v3 = vec2.fromValues((v0[0] + ((v1[1] - v0[1]) / (v2[1] - v0[1])) * (v2[0] - v0[0])), v1[1]);
      fillFlatTopTriangle.call(this, v0, v1, v3, color);
      fillFlatBottomTriangle.call(this, v1, v3, v2, color);
    }
  };

  function fillFlatBottomTriangle (v0, v1, v2, color) {
    var invslope1 = (v2[0] - v0[0]) / (v2[1] - v0[1]);
    var invslope2 = (v2[0] - v1[0]) / (v2[1] - v1[1]);

    var x1 = v2[0];
    var x2 = v2[0];

    for (var y = v2[1]; y >= v0[1]; y--) {
      this.line(x1, y, x2, y, this.imageData, color);
      x1 -= invslope1;
      x2 -= invslope2;
    }
  }

  function fillFlatTopTriangle(v0, v1, v2, color) {
    var invslope1 = (v0[0] - v1[0]) / (v0[1] - v1[1]); // flat top
    var invslope2 = (v0[0] - v2[0]) / (v0[1] - v2[1]);

    var x1 = v0[0];
    var x2 = v0[0];

    for (var y = v0[1]; y <= v1[1]; y++) {
      this.line(x1, y, x2, y, this.imageData, color);
      x1 += invslope1;
      x2 += invslope2;
    }
  }

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
    var p = out || {};
    // x, y are normalized device coordinates between [-1,1]
    var x = vertices[index + 0];
    var y = vertices[index + 1];

    // add 1 to make coordinates be between [0,2]
    // divide by 2 so coordinates are between [0,1]
    // multiply width / height to scale object
    // offset or scale could be added here by addition / multiplication
    p.x = Math.trunc((x + 1) / 2 * this.canvas.width);
    p.y = Math.trunc((y + 1) / 2 * this.canvas.height);

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

  TinyRenderer.prototype.getScreenCoordinate = function (world, out) {
    // world coords are normalized device coordinates between [-1,1]
    // add 1 to make coordinates be between [0,2]
    // divide by 2 so coordinates are between [0,1]
    // multiply width / height to scale object
    // offset or scale could be added here by addition / multiplication
    out[0] = Math.trunc((world[0] + 1) / 2 * this.canvas.width);
    out[1] = Math.trunc((world[1] + 1) / 2 * this.canvas.height);
  };

  TinyRenderer.prototype.fillOBJ = function (mesh) {
    var length = mesh.indices.length;
    var indices = mesh.indices, vertices = mesh.vertices;
    var index0, index1, index2;
    var screen0 = vec2.create(), screen1 = vec2.create(), screen2 = vec2.create();
    var world0 = vec3.create(), world1 = vec3.create(), world2 = vec3.create();
    var light = vec3.fromValues(0, 0, -1), normal = vec3.create(), intensity;
    var color = new Uint8Array(4);
    color[3] = 255;

    for (var i = 0; i < length; i += 3) {
      index0 = indices[i    ] * 3; // here vertices have 3 components x, y, z and we start always on x, so multiply by 3
      index1 = indices[i + 1] * 3;
      index2 = indices[i + 2] * 3;

      // world coordinates for vertices
      vec3.set(world0, vertices[index0], vertices[index0 + 1], vertices[index0 + 2]);
      vec3.set(world1, vertices[index1], vertices[index1 + 1], vertices[index1 + 2]);
      vec3.set(world2, vertices[index2], vertices[index2 + 1], vertices[index2 + 2]);

      // screen coordinates for vertices
      this.getScreenCoordinate(world0, screen0);
      this.getScreenCoordinate(world1, screen1);
      this.getScreenCoordinate(world2, screen2);

      world0 = vec3.cross(world0, vec3.subtract(world2, world2, world0), vec3.subtract(world1, world1, world0));

      vec3.normalize(normal, world0);

      intensity = vec3.dot(normal, light);

      if (intensity > 0) {
        color[0] = color[1] = color[2] = 255 * intensity;
        this.triangle(screen0, screen1, screen2, color);
      }

    }
  };

  if (typeof module !== 'undefined') {
    module.exports = TinyRenderer;
  } else {
    scope.TinyRenderer = TinyRenderer;
  }

})(this);