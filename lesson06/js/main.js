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

  var viewport = renderer.getViewport(mat4.create(), canvas.width / 8, canvas.width / 8, canvas.width * 3 / 4 , canvas.height * 3 / 4);
  var projection = renderer.getProjection(mat4.create(), camera, center);
  var modelView = mat4.lookAtCenter(mat4.create(), camera, center, up);

  var model = new TR.Model();
  model.load('head', '../models/head.obj', onLoad);

  var textures = {
    diffuseMap: "../models/head_diffuse.tga",
    normalMap: "../models/head_normal.tga",
    specularMap: "../models/head_specular.tga"
  };

  function onLoad(mesh) {
    model.loadTextures(textures, mesh, function (model) {
      var shader = TR.Shader.SpecularMap(model);
      shader.setUniforms(modelView, projection, viewport, light);

      renderer.renderModel(model, shader);
      ctx.putImageData(imageData, 0, 0);
      tga.setImageData(imageData);

      renderer.addLink(pngLink);
      tga.addLink(tgaLink);
    });
  }

})();
