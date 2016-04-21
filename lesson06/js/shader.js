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
        position = vec3.transformMat4(vec3.transformMat4(vec3.transformMat4(position, position, modelView), position, projection), position, viewport);
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

  Shader.GouraudColor = function (model) {
    var modelView, projection, viewport, light;
    var varying_intensity = vec3.create();
    var position = vec3.create(), normal = vec3.create();
    var intensity;

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec3.transformMat4(vec3.transformMat4(vec3.transformMat4(position, position, modelView), position, projection), position, viewport);
        varying_intensity[nthvert] = Math.max(0, vec3.dot(model.getNormal(normal, index), light));
        return position;
      },
      fragment: function (bary, color) {
        intensity = vec3.dot(varying_intensity, bary);

        if (intensity > .85) intensity = 1;
        else if (intensity > .60) intensity = .80;
        else if (intensity > .45) intensity = .60;
        else if (intensity > .30) intensity = .45;
        else if (intensity > .15) intensity = .30;
        else intensity = 0;

        vec3.set(color, 255, 155, 0);
        vec3.scale(color, color, intensity);
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

  Shader.GouraudTexture = function (model) {
    var modelView, projection, viewport, light;
    var varying_intensity = vec3.create();
    var varying_uv = mat2d.createEmpty();
    var uv = vec2.create();
    var position = vec3.create(), normal = vec3.create(), texture = vec2.create();
    var intensity;

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec3.transformMat4(vec3.transformMat4(vec3.transformMat4(position, position, modelView), position, projection), position, viewport);
        varying_intensity[nthvert] = Math.max(0, vec3.dot(model.getNormal(normal, index), light));
        mat2d.setColumn(varying_uv, nthvert, model.getTexture(texture, index));
        return position;
      },
      fragment: function (bary, color) {
        intensity = vec3.dot(varying_intensity, bary);
        vec2.transformMat2dVec3(uv, bary, varying_uv);
        vec3.scale(color, model.getDiffuse(color, uv), intensity);
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

  Shader.NormalMap = function (model) {
    var modelView, projection, viewport, light;
    var uniform_M = mat4.create(), uniform_MIT = mat4.create();
    var varying_uv = mat2d.createEmpty();
    var uv = vec2.create();
    var position = vec3.create(), normal = vec4.create(), texture = vec2.create();
    var n = vec3.create(), l = vec3.create();
    var intensity;

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec3.transformMat4(vec3.transformMat4(vec3.transformMat4(position, position, modelView), position, projection), position, viewport);
        mat2d.setColumn(varying_uv, nthvert, model.getTexture(texture, index));
        return position;
      },
      fragment: function (bary, color) {
        vec2.transformMat2dVec3(uv, bary, varying_uv);
        // transform normal Vector
        model.getNormalMap(normal, uv);
        vec3.transformMat4(n, normal, uniform_MIT);
        vec3.normalize(n, n);
        // transform light vector
        vec3.transformMat4(l, light, uniform_M);
        vec3.normalize(l, l);
        // calculate intensity
        intensity = Math.max(0, vec3.dot(n, l));
        vec3.scale(color, model.getDiffuse(color, uv), intensity);

        return false;
      },
      setUniforms: function (m, p, v, l) {
        modelView = m;
        projection = p;
        viewport = v;
        light = l;
        uniform_M = mat4.multiply(uniform_M, p, m); // Projection * ModelView
        uniform_MIT = mat4.transpose(uniform_MIT, mat4.invert(uniform_MIT, uniform_M));
      }
    }
  };

  Shader.SpecularMap = function (model) {
    var modelView, projection, viewport, light;
    var uniform_M = mat4.create(), uniform_MIT = mat4.create();
    var varying_uv = mat2d.createEmpty();
    var uv = vec2.create();
    var position = vec3.create(), normal = vec4.create(), texture = vec2.create();
    var n = vec3.create(), l = vec3.create(), r = vec3.create();
    var intensity;
    var specular = vec4.create();

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec3.transformMat4(vec3.transformMat4(vec3.transformMat4(position, position, modelView), position, projection), position, viewport);
        mat2d.setColumn(varying_uv, nthvert, model.getTexture(texture, index));
        return position;
      },
      fragment: function (bary, color) {
        vec2.transformMat2dVec3(uv, bary, varying_uv);
        // transform normal Vector
        model.getNormalMap(normal, uv);
        vec3.transformMat4(n, normal, uniform_MIT);
        vec3.normalize(n, n);
        // transform light vector
        vec3.transformMat4(l, light, uniform_M);
        vec3.normalize(l, l);
        // reflected light vector
        vec3.subtract(r, vec3.scale(r, n, 2 * vec3.dot(n, l)), l);
        vec3.normalize(r, r);
        var spec = Math.pow(Math.max(r[2], 0.0), model.getSpecularMap(specular, uv));
        // calculate intensity
        intensity = Math.max(0, vec3.dot(n, l));
        model.getDiffuse(color, uv);
        for (var i = 0; i < 3; i++) {
          // 5 for the ambient component, 1 for the diffuse component and .6 for the specular component
          color[i] = Math.min(5 + color[i] * (intensity + .6 * spec), 255);
        }

        return false;
      },
      setUniforms: function (m, p, v, l) {
        modelView = m;
        projection = p;
        viewport = v;
        light = l;
        uniform_M = mat4.multiply(uniform_M, p, m);
        uniform_MIT = mat4.transpose(uniform_MIT, mat4.invert(uniform_MIT, uniform_M));
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