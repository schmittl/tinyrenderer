(function (scope) {
  'use strict';

  function Model() {
  }

  Model.prototype.load = function ModelLoadTextures(name, path, success) {
    var self = this;
    self.name = name;

    OBJ.downloadMeshes({[name]: path}, function (meshes) {
      self.mesh = meshes[name];
      success(self.mesh);
    });
  };

  Model.prototype.loadTextures = function ModelLoadTextures(textures, obj, success) {
    var pending = Object.keys(textures).length;
    var self = this;

    for (var type in textures) {
      if (textures.hasOwnProperty(type)) {
        var texture = new TGA();
        texture.open(textures[type], (function (name) {
          return function () {
            self[name] = new ImageData(this.header.width, this.header.height);
            this.getImageData(self[name]);

            pending--;
            if (pending === 0) {
              // success callback
              success(self);
            }
          };
        })(type))
      }
    }
  };

  Model.prototype.getIndex = function (index) {
    return this.mesh.indices[index];
  };

  Model.prototype.getVertex = function (out, index) {
    var vertices = this.mesh.vertices;
    index *= 3;
    vec4.set(out, vertices[index], vertices[index + 1], vertices[index + 2], 1); // point so w = 1
    return out;
  };

  Model.prototype.getNormal = function (out, index) {
    var normals = this.mesh.vertexNormals;
    index *= 3;
    vec4.set(out, normals[index], normals[index + 1], normals[index + 2], 0); // vector so w = 0
    return out;
  };

  Model.prototype.getTexture = function (out, index) {
    var textures = this.mesh.textures;
    index *= 2;
    vec2.set(out, textures[index], textures[index + 1]);
    return out;
  };

  Model.prototype.getDiffuse = function (out, uv) {
    getPixel(uv[0] * this.diffuseMap.width, (1 - uv[1]) * this.diffuseMap.height, this.diffuseMap, out);
    return out;
  };

  Model.prototype.getNormalMap = function (out, uv) {
    getPixel(uv[0] * this.normalMap.width, (1 - uv[1]) * this.normalMap.height, this.normalMap, out);
    // convert rgb to xyz in ndc
    out[0] = out[0] / 255 * 2 - 1;
    out[1] = out[1] / 255 * 2 - 1;
    out[2] = out[2] / 255 * 2 - 1;
    return out;
  };

  Model.prototype.getSpecularMap = function (out, uv) {
    getPixel(uv[0] * this.specularMap.width, (1 - uv[1]) * this.specularMap.height, this.specularMap, out);
    return out[0];
  };

  var getPixel = function (x, y, imageData, color) {
    var bytesPerPixel = color.length;
    var offset = (Math.trunc(x) + imageData.width * Math.trunc(y)) * 4; // imageData is always rgba
    for (var i = 0; i < bytesPerPixel; i++) {
      color[i] = imageData.data[offset + i];
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = Model;
  } else {
    scope.TR = scope.TR || {};
    scope.TR.Model = Model;
  }
})(this);