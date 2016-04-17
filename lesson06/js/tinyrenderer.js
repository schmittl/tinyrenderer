(function (scope) {
  'use strict';

  function TinyRenderer(canvas, imageData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.imageData = imageData;
    this.zbuffer = new Int16Array(canvas.width * canvas.height);
    this.zbuffer.fill(-32768);
    this.zdepth = 32767;
  }

  TinyRenderer.prototype.setPixel = function (x, y, imageData, color) {
    var bytesPerPixel = color.length;
    var offset = (Math.trunc(x) + imageData.width * Math.trunc(y)) * bytesPerPixel;
    for (var i = 0; i < bytesPerPixel; i++) {
      imageData.data[offset + i] = color[i];
    }
  };

  TinyRenderer.prototype.getPixel = function (x, y, imageData, color) {
    var bytesPerPixel = color.length;
    var offset = (Math.trunc(x) + imageData.width * Math.trunc(y)) * bytesPerPixel;
    for (var i = 0; i < bytesPerPixel; i++) {
      color[i] = imageData.data[offset + i];
    }
  };

  TinyRenderer.prototype.addLink = function (el) {
    el.href = this.canvas.toDataURL('image/png');
    el.download = "generated.png";
  };

  TinyRenderer.prototype.getViewport = function (out, x, y, w, h) {
    // The translation components occupy the 13th, 14th, and 15th elements of the 16-element matrix
    return mat4.set(out, w / 2, 0, 0, 0, 0, h / 2, 0, 0, 0, 0, this.zdepth / 2, 0, x + w /2, y + h / 2, this.zdepth / 2, 1);
  };

  TinyRenderer.prototype.getProjection = function(out, eye, center) {
    // eye - center
    var distance = vec3.length(vec3.sub(vec3.create(), eye, center));
    out[0]  = 1.5;
    out[5]  = -1.5; // flip y axis
    out[10]  = 1.5;
    out[11] = -1 / distance; // coefficient for perspective division
    return out;
  };

  TinyRenderer.prototype.triangle = function(screenCoords, shader) {
    var a = screenCoords[0], b = screenCoords[1], c = screenCoords[2];
    var v0 = vec3.subtract(vec3.create(), b, a);
    var v1 = vec3.subtract(vec3.create(), c, a);
    var v2 = vec3.create();

    var denom = v0[0] * v1[1] - v1[0] * v0[1];

    if (Math.abs(denom) <= glMatrix.EPSILON) {
      return;
    }

    var getBarycentric = function (P, out) {
      var u, v, w;
      vec3.subtract(v2, P, a);

      v = (v2[0] * v1[1] - v1[0] * v2[1]) / denom;
      w = (v0[0] * v2[1] - v2[0] * v0[1]) / denom;
      u = 1.0 - (v + w); // parenthesis seem to help against rounding issues

      if (glMatrix.equals(u, 0)) {
        u = 0;
      }

      vec3.set(out, u, v, w);
    };

    var maxX = Math.max(a[0], b[0], c[0]);
    var minX = Math.min(a[0], b[0], c[0]);
    var maxY = Math.max(a[1], b[1], c[1]);
    var minY = Math.min(a[1], b[1], c[1]);
    var P = vec3.create();
    var B = vec3.create();
    var z, zOffset;
    var color = vec4.fromValues(0, 0, 0, 255);

    for (var x = minX; x < maxX; x++) { // using < seems to help against z-fighting along edges
      for (var y = minY; y < maxY; y++) { // using < seems to help against z-fighting along edges
        vec3.set(P, x, y, 0);
        getBarycentric(P, B);

        if (B[0] < 0 || B[1] < 0 || B[2] < 0) {
          continue;
        }

        z = (a[2] * B[0]) + (b[2] * B[1]) + (c[2] * B[2]);
        zOffset = x + y * this.canvas.width;

        if (z >= this.zbuffer[zOffset]) {
          if (shader.fragment(B, color)) {
            continue;
          }
          this.zbuffer[zOffset] = z;
          this.setPixel(x, y, this.imageData, color);
        }
      }
    }
  };

  TinyRenderer.prototype.renderModel = function(model, shader) {
    var length = model.mesh.indices.length;
    var screenCoords = [vec3.create(), vec3.create(), vec3.create()];
    var index;
    for (var i = 0; i < length; i += 3) {
      for (var j = 0; j < 3; j++) {
        index = model.getIndex(i + j);
        vec3.copy(screenCoords[j], shader.vertex(index, j));
      }
      this.triangle(screenCoords, shader);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = TinyRenderer;
  } else {
    scope.TR = scope.TR || {};
    scope.TR.TinyRenderer = TinyRenderer;
  }

})(this);