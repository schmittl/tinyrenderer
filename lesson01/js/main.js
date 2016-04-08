(function () {
  'use strict';

  var pngLink = document.getElementById("png");
  var tgaLink = document.getElementById("tga");
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 800;
  canvas.style.background = '#ddd';
  var imageData = ctx.createImageData(canvas.width, canvas.height);

  var black = [16, 16, 16, 255];

  var tga = new TGA({width: canvas.width, height: canvas.height, imageType: TGA.Type.RLE_RGB, flags: 8});
  var TR = new TinyRenderer(canvas, imageData);

  OBJ.downloadMeshes({'head': 'models/head.obj'}, onLoad);

  function onLoad(meshes) {
    TR.renderOBJ(meshes.head, black);

    var data = TR.flipVertically(imageData); // flip vertically to set origin to bottom left
    ctx.putImageData(data, 0, 0);
    tga.setImageData(data);

    TR.addLink(pngLink);
    tga.addLink(tgaLink);
  }

})();
