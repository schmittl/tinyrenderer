(function (scope) {
  'use strict';

  function TinyRenderer(canvas, imageData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.imageData = imageData;
    this.zbuffer = new Int16Array(canvas.width * canvas.height);
    this.zbuffer.fill(-32768);
    this.zdepth = 32767;
    this.camera = vec3.fromValues(0, 0, 3);
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
  
  TinyRenderer.prototype.triangle = function (a, b, c, t0, t1, t2, intensity, textureData) {
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
    var u, v, textureColor = new Uint8Array(4);
    textureColor[3] = 255;

    for (var x = minX; x < maxX; x++) { // using < seems to help against z-fighting along edges
      for (var y = minY; y < maxY; y++) { // using < seems to help against z-fighting along edges
        vec3.set(P, x, y, 0);
        getBarycentric(P, B);

        if (B[0] < 0 || B[1] < 0 || B[2] < 0) {
          continue;
        }

        // calculate u by multiplying Barycenter weights with x values of texture coordinates
        u = (t0[0] * B[0]) + (t1[0] * B[1]) + (t2[0] * B[2]);
        // calculate v by multiplying Barycenter weights with y values of texture coordinates
        v = (t0[1] * B[0]) + (t1[1] * B[1]) + (t2[1] * B[2]);
        // get textureColor for Pixel, flip y axis because obj assumes top left origin
        this.getPixel(u * textureData.width, (1 - v) * textureData.height, textureData, textureColor);
        // multiply textureColor by lighting intensity, use vec3 so alpha is unaffected
        vec3.scale(textureColor, textureColor, intensity);

        z = (a[2] * B[0]) + (b[2] * B[1]) + (c[2] * B[2]);
        zOffset = x + y * this.canvas.width;

        if (z > this.zbuffer[zOffset]) {
          this.zbuffer[zOffset] = z;
          this.setPixel(x, y, this.imageData, textureColor);
        }
      }
    }
  };

  TinyRenderer.prototype.addLink = function (el) {
    el.href = this.canvas.toDataURL('image/png');
    el.download = "generated.png";
  };

  TinyRenderer.prototype.setViewport = function (out, x, y, w, h, depth) {
    // The translation components occupy the 13th, 14th, and 15th elements of the 16-element matrix
    return mat4.set(out, w / 2, 0, 0, 0, 0, h / 2, 0, 0, 0, 0, depth / 2, 0, x + w /2, y + h / 2, depth / 2, 1);
  };

  TinyRenderer.prototype.setProjection = function(out, camera) {
    out[5]  = -1; // flip y axis
    out[11] = -1 / camera[2]; // coefficient for perspective division  r = - 1 / camera.z
    return out;
  };

  TinyRenderer.prototype.renderOBJ = function (mesh, textureData) {
    var length = mesh.indices.length;
    var indices = mesh.indices, vertices = mesh.vertices, textures = mesh.textures;
    var vindex0, vindex1, vindex2, tindex0, tindex1, tindex2;
    var screen0 = vec3.create(), screen1 = vec3.create(), screen2 = vec3.create();
    var world0 = vec3.create(), world1 = vec3.create(), world2 = vec3.create();
    var texture0 = vec2.create(), texture1 = vec2.create(), texture2 = vec2.create();
    var light = vec3.fromValues(0, 0, -1), normal = vec3.create(), intensity;
    var viewport = this.setViewport(mat4.create(), 100, 100, 600, 600, this.zdepth);
    var projection = this.setProjection(mat4.create(), this.camera);

    for (var i = 0; i < length; i += 3) {
      vindex0 = indices[i] * 3; // here vertices have 3 components x, y, z and we start always on x, so multiply by 3
      vindex1 = indices[i + 1] * 3;
      vindex2 = indices[i + 2] * 3;

      tindex0 = indices[i] * 2; // only u, v for textures so multiply by 2
      tindex1 = indices[i + 1] * 2;
      tindex2 = indices[i + 2] * 2;

      // world coordinates for vertices
      vec3.set(world0, vertices[vindex0], vertices[vindex0 + 1], vertices[vindex0 + 2]);
      vec3.set(world1, vertices[vindex1], vertices[vindex1 + 1], vertices[vindex1 + 2]);
      vec3.set(world2, vertices[vindex2], vertices[vindex2 + 1], vertices[vindex2 + 2]);

      // screen coordinates vertices (viewport * projection * world)
      screen0 = vec3.trunc(vec3.transformMat4(vec3.transformMat4(screen0, world0, projection), screen0, viewport));
      screen1 = vec3.trunc(vec3.transformMat4(vec3.transformMat4(screen1, world1, projection), screen1, viewport));
      screen2 = vec3.trunc(vec3.transformMat4(vec3.transformMat4(screen2, world2, projection), screen2, viewport));

      // texture coordinates for vertices
      vec2.set(texture0, textures[tindex0], textures[tindex0 + 1]);
      vec2.set(texture1, textures[tindex1], textures[tindex1 + 1]);
      vec2.set(texture2, textures[tindex2], textures[tindex2 + 1]);

      // calculate normal of triangle
      world0 = vec3.cross(world0, vec3.subtract(world2, world2, world0), vec3.subtract(world1, world1, world0));

      vec3.normalize(normal, world0);

      intensity = vec3.dot(normal, light);

      // backface culling
      if (intensity > 0) {
        this.triangle(screen0, screen1, screen2, texture0, texture1, texture2, intensity, textureData);
      }

    }
  };

  if (typeof module !== 'undefined') {
    module.exports = TinyRenderer;
  } else {
    scope.TinyRenderer = TinyRenderer;
  }

})(this);