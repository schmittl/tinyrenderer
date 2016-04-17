(function (scope) {
  'use strict';

  var Shader = {};

  Shader.Gouraud = function (model) {
    var modelView, projection, viewport, light;
    var varying_intensity = vec3.create();
    var position = vec3.create(), normal = vec3.create();
    var intensity;

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec3.trunc(vec3.transformMat4(vec3.transformMat4(vec3.transformMat4(position, position, modelView), position, projection), position, viewport));
        varying_intensity[nthvert] = Math.max(0, vec3.dot(model.getNormal(normal, index), light));
        return position;
      },
      fragment: function (bary, color) {
        intensity = vec3.dot(varying_intensity, bary);
        color[0] = color[1] = color[2] = intensity * 255;
        return false;
      },
      setUniforms: function (m, p, v, l) {
        modelView = m;
        projection = p;
        viewport = v;
        light = l;
      }
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = Shader;
  } else {
    scope.TR = scope.TR || {};
    scope.TR.Shader = Shader;
  }
})(this);