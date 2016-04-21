(function (scope) {
  'use strict';

  var Shader = {};

   Shader.SpecularMap = function (model, shadowbuffer) {
    var modelView, projection, viewport, light, width;
    var uniform_M = mat4.create(), uniform_MIT = mat4.create(), uniform_Mshadow = mat4.create();
    var varying_uv = mat2d.createEmpty();
    var varying_tri = mat3.create();
    var uv = vec2.create();
    var position = vec4.createPoint(), normal = vec4.create(), texture = vec2.create();
    var n = vec3.create(), l = vec3.create(), r = vec3.create();
    var intensity;
    var specular = vec4.create();
    var tmp = vec3.create();

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec4.transformMat4(vec4.transformMat4(vec4.transformMat4(position, position, modelView), position, projection), position, viewport);
        mat2d.setColumn(varying_uv, nthvert, model.getTexture(texture, index));
        mat3.setColumn(varying_tri, nthvert, vec3.scale(tmp, position, 1 / position[3]));
        return position;
      },
      fragment: function (bary, color) {
        var sb_P = vec4.createPoint();
        vec3.transformMat3(sb_P, bary, varying_tri);
        vec3.transformMat4(sb_P, sb_P, uniform_Mshadow);
        var idx = Math.trunc(sb_P[0]) + Math.trunc(sb_P[1]) * width;
        var shadow = .3 + .7 * (shadowbuffer[idx] < sb_P[2] + 43.34);

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
          // 20 for the ambient component, 1.2 for the diffuse component and .6 for the specular component
          color[i] = Math.min(20 + color[i] * shadow * (1.2 * intensity + .6 * spec), 255);
        }

        return false;
      },
      setUniforms: function (m, p, v, l, M, w) {
        modelView = m;
        projection = p;
        viewport = v;
        light = l;
        uniform_M = mat4.multiply(uniform_M, p, m);
        uniform_MIT = mat4.transpose(uniform_MIT, mat4.invert(uniform_MIT, uniform_M));
        mat4.invert(uniform_Mshadow, mat4.multiply(uniform_Mshadow, viewport, uniform_M));
        mat4.multiply(uniform_Mshadow, M, uniform_Mshadow);
        width = w;
      }
    }
  };

  Shader.Depth = function (model) {
    var modelView, projection, viewport, depth;
    var position = vec4.createPoint();
    var varying_tri = mat3.create();
    var tmp = vec3.create();
    var P = vec3.create();

    return {
      vertex: function (index, nthvert) {
        position = model.getVertex(position, index);
        position = vec4.transformMat4(vec4.transformMat4(vec4.transformMat4(position, position, modelView), position, projection), position, viewport);
        mat3.setColumn(varying_tri, nthvert, vec3.scale(tmp, position, 1 / position[3]));
        return position;
      },
      fragment: function (bary, color) {
        vec3.transformMat3(P, bary, varying_tri); // interpolate vertex positions
        //color = TGAColor(255, 255, 255)*(p.z/depth);
        color[0] = color[1] = color[2] = 255 * (P[2] / depth);
        return false;
      },
      setUniforms: function (m, p, v, d) {
        modelView = m;
        projection = p;
        viewport = v;
        depth = d;
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