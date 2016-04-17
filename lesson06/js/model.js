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
    vec3.set(out, vertices[index], vertices[index + 1], vertices[index + 2]);
    return out;
  };

  Model.prototype.getNormal = function (out, index) {
    var normals = this.mesh.vertexNormals;
    index *= 3;
    vec3.set(out, normals[index], normals[index + 1], normals[index + 2]);
    return out;
  };

  Model.prototype.getTexture = function (out, index) {
    var textures = this.mesh.textures;
    index *= 2;
    vec3.set(out, textures[index], textures[index + 1], textures[index + 2]);
    return out;
  };

  if (typeof module !== 'undefined') {
    module.exports = Model;
  } else {
    scope.TR = scope.TR || {};
    scope.TR.Model = Model;
  }
})(this);