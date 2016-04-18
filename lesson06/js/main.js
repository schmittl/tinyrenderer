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

  var tga = new TGA({width: canvas.width, height: canvas.height, imageType: TGA.Type.RLE_RGB, flags: 8});
  var renderer = new TR.TinyRenderer(canvas, imageData);

  var camera = vec3.fromValues(1, 1, 3);
  var center = vec3.fromValues(0, 0, 0);
  var up = vec3.fromValues(0, 1, 0);
  var light = vec3.fromValues(1, 1, 1);
  vec3.normalize(light, light);

  var viewport = renderer.getViewport(mat4.create(), 0, 0, canvas.width, canvas.height);
  var projection = renderer.getProjection(mat4.create(), camera, center);
  var modelView = mat4.lookAt(mat4.create(), camera, center, up);

  var model = new TR.Model();
  model.load('head', '../models/head.obj', onLoad);

  function onLoad(mesh) {
    model.loadTextures({diffuseMap: "../models/head_diffuse.tga"}, mesh, function (model) {
      var shader = TR.Shader.GouraudTexture(model);
      shader.setUniforms(modelView, projection, viewport, light);

      renderer.renderModel(model, shader);
      ctx.putImageData(imageData, 0, 0);
      tga.setImageData(imageData);

      renderer.addLink(pngLink);
      tga.addLink(tgaLink);
    });
  }

})();
