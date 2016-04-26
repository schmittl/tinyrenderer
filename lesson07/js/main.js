(function () {
  'use strict';

  var pngLink = document.getElementById("png");
  var tgaLink = document.getElementById("tga");
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 800;
  canvas.style.background = '#000';
  var imageData = ctx.createImageData(canvas.width, canvas.height);
  var depthData = ctx.createImageData(canvas.width, canvas.height);

  var tga = new TGA({width: canvas.width, height: canvas.height, imageType: TGA.Type.RLE_RGB, flags: 8});

  var camera = vec3.fromValues(1, 1, 4);
  var center = vec3.fromValues(0, 0, 0);
  var up = vec3.fromValues(0, 1, 0);
  var light = vec3.fromValues(1, 1, 0);
  vec3.normalize(light, light);

  var renderer = new TR.TinyRenderer(canvas);
  var projection = renderer.getProjection(mat4.create(), 0);
  var modelView = mat4.lookAtCenter(mat4.create(), light, center, up);


  var model = new TR.Model();
  model.load('head', '../models/head.obj', onLoad);

  var textures = {
    diffuseMap: "../models/head_diffuse.tga",
    normalMap: "../models/head_normal.tga",
    specularMap: "../models/head_specular.tga"
  };

  function onLoad(mesh) {
    model.loadTextures(textures, mesh, function (model) {
      // depth
      var depthShader = TR.Shader.Depth(model);
      depthShader.setUniforms(modelView, projection, renderer.viewport, renderer.zdepth);
      renderer.renderModel(model, depthShader, depthData, renderer.shadowBuffer);

      // save transformation matrix
      var M = mat4.create();
      M = mat4.multiply(M, renderer.viewport, mat4.multiply(M, projection, modelView));

      // change transformation matrices
      projection = renderer.getProjection(mat4.create(), - 1 / vec3.length(vec3.sub(vec3.create(), camera, center)));
      modelView = mat4.lookAtCenter(mat4.create(), camera, center, up);

      var shader = TR.Shader.SpecularMap(model, renderer.shadowBuffer);
      shader.setUniforms(modelView, projection, renderer.viewport, light, M, canvas.width);
      renderer.renderModel(model, shader, imageData, renderer.zbuffer);

      ctx.putImageData(imageData, 0, 0);
      tga.setImageData(imageData);

      // for debugging
      //ctx.putImageData(depthData, 0, 0);

      renderer.addLink(pngLink);
      tga.addLink(tgaLink);
    });
  }

})();
