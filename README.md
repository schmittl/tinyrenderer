# tinyrenderer

Based on the lessons from https://github.com/ssloy/tinyrenderer but implemented in JavaScript with the canvas element.

The goal is to write a small software renderer from scratch to gain a better understanding of computer graphics concepts.

## Directory Contents

The `lesson` directories are each self contained, only requiring the files frome the `lib` and `model` directories.

The `lib` directory contains the used libraries. Each file contains the license for the library.
I slightly modified or added some missing functionality needed for this project to the libraries.

  * [gl-matrix.js](https://github.com/toji/gl-matrix) vector and matrix math library
  * [obj-loader.js](https://github.com/frenchtoast747/webgl-obj-loader) OBJ file parser
  * [tga.js](https://github.com/schmittl/tgajs) for loading and displaying .tga images

The `models` directory contains models and textures from https://github.com/ssloy/tinyrenderer and
all copyrights belong to their respective owners.