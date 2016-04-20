(function (scope) {
  'use strict';

  var Shader = {};

  Shader.TangentMap = function (model) {
    var modelView, projection, light;
    var uniform_M = mat4.create(), uniform_MIT = mat4.create();
    var varying_uv = mat2d.createEmpty();
    var varying_nrm = mat3.create();
    var uv = vec2.create();
    var position = vec4.createPoint(), normal = vec4.create(), texture = vec2.create();
    var n = vec3.create();
    var intensity;

    return {
      vertex: function (index, nthvert) {
        mat2d.setColumn(varying_uv, nthvert, model.getTexture(texture, index));
        vec4.transformMat4(normal, model.getNormal(normal, index), uniform_MIT); // y is inverted
        mat3.setColumn(varying_nrm, nthvert, normal);
        position = model.getVertex(position, index);
        position = vec4.transformMat4(vec4.transformMat4(position, position, modelView), position, projection);
        return position;
      },
      fragment: function (bary, color) {
        n = vec3.transformMat3(n, bary, varying_nrm);
        vec3.normalize(n, n);
        uv = vec2.transformMat2dVec3(uv, bary, varying_uv);
        intensity = Math.max(0, vec3.dot(n, light));
        vec3.scale(color, model.getDiffuse(color, uv), intensity);

        return false;
      },
      setUniforms: function (m, p, l) {
        modelView = m;
        projection = p;
        uniform_M = mat4.multiply(uniform_M, p, m); // Projection * ModelView
        uniform_MIT = mat4.transpose(uniform_MIT, mat4.invert(uniform_MIT, uniform_M));
        light = vec3.create();
        light = vec3.multiplyMat4(light, l, uniform_M);
        vec3.normalize(light, light);
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