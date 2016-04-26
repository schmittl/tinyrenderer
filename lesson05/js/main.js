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
  var TR = new TinyRenderer(canvas, imageData);

  var texture = new TGA();
  var textureData;

  texture.open("../models/head_diffuse.tga", function() {
    textureData = ctx.createImageData(this.header.width, this.header.height);
    this.getImageData(textureData);

    OBJ.downloadMeshes({'head': '../models/head.obj'}, function onLoad(meshes) {
      TR.renderOBJ(meshes.head, textureData);

      ctx.putImageData(imageData, 0, 0);
      tga.setImageData(imageData);

      TR.addLink(pngLink);
      tga.addLink(tgaLink);
    });
  });

})();
