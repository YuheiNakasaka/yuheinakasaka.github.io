var GifFactory = function() {
  var opts;

  var init = function(options) {
    opts = {
      type: options.type,
      inputFileElm: options.inputFileElm || "#gif-factory-file",
      inputTextElm: options.inputTextElm || "#gif-factory-text",
      imgLoaderOptions: options.imgLoaderOptions || {maxWidth: 300, maxHeight: 300},
      callbackAfterLoad: options.callbackAfterLoad || function(args) {console.log("callbackAfterLoad")},
      frameToGifOption: options.frameToGifOption,
      wordToGifOption: options.wordToGifOption
    }
  }

  var frameToGif = function(args) {
    //
    _loader("img+gif");
  }

  var _frameToGif = function(args) {
    // オプション
    var option = {
      delay: args.delay || 150,
      repeat: args.repeat || 0,  // default: auto loop
      width: args.width || 308,
      height: args.height || 548,
      uploadElm: args.uploadElm,
      images: args.images || "#frames",
      frameHandler: function(_args) { args.frameHandler(_args) },
      callbackAfterGeneration: function(_args) { args.callbackAfterGeneration(_args) }
    };

    // 生成GIFのメインcanvas
    _createTmpCanvas();
    var canvas = $("#gif-factory-tmpcanvas")[0];
    var context = canvas.getContext('2d');
    canvas.width = option.width;
    canvas.height = option.height;

    // gif生成オブジェクト
    var gif = new GIF({
      workers: 10,
      quality: 10,
      workerScript: "gif.worker.js"
    });
    gif.setOptions({width: canvas.width, height: canvas.height });

    // canvasデフォルト値
    context = _canvasDefaults(context,canvas);

    // 冗長だけどここにまとめたほうがわかりやすいから関数にしない
    if ((option.images).length < 1) return console.log("frameToGif requires frameToGifOption.images option");
    option.images.each(function (i,image) {
      // Workerにフレームのデータを送る
      option.frameHandler({ctx: context, img: image, option: option});
      gif.addFrame(context, {copy: true, delay: option.delay});
      context.fillRect(0, 0, canvas.width, canvas.height);
    });

    gif.on('finished', function(blob) {
      var url = window.URL || window.webkitURL;
      var blobURL = url.createObjectURL(blob);
      // up用セット
      var reader = new window.FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function() {
        base64data = reader.result;
        if (option.callbackAfterGeneration) {
          option.callbackAfterGeneration({b64data: base64data, blobUrl: blobURL});
        }
      }
    });
    gif.render();
  }

  var wordToGif = function(args) {
    //
    _loader("word+gif");
  }

  var _wordToGif = function(args) {
    // オプション
    var option = {
      delay: args.delay || 150,
      repeat: args.repeat || 0,  // default: auto loop
      width: args.width || 308,
      height: args.height || 548,
      uploadElm: args.uploadElm,
      text: args.text,
      motionList: args.motionList || [],
      frameHandler: function(_args) { args.frameHandler(_args) },
      callbackAfterGeneration: function(_args) { args.callbackAfterGeneration(_args) }
    };

    // 生成GIFのメインcanvas
    _createTmpCanvas();
    var canvas = $("#gif-factory-tmpcanvas")[0];
    var context = canvas.getContext('2d');
    canvas.width = option.width;
    canvas.height = option.height;

    // gif生成オブジェクト
    var gif = new GIF({
      workers: 10,
      quality: 10,
      workerScript: "gif.worker.js"
    });
    gif.setOptions({width: canvas.width, height: canvas.height });

    // canvasデフォルト値
    context = _canvasDefaults(context,canvas);

    // 冗長だけどここにまとめたほうがわかりやすいから関数にしない
    if ((option.motionList).length < 1) return console.log("wordToGif requires wordToGifOption.motionList option");
    $.each(option.motionList, function (i,motion) {
      // Workerにフレームのデータを送る
      option.frameHandler({ctx: context, motion: motion, option: option});
      gif.addFrame(context, {copy: true, delay: option.delay});
      context.fillRect(0, 0, canvas.width, canvas.height);
    });

    gif.on('finished', function(blob) {
      var url = window.URL || window.webkitURL;
      var blobURL = url.createObjectURL(blob);
      // up用セット
      var reader = new window.FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function() {
        base64data = reader.result;
        if (option.callbackAfterGeneration) {
          option.callbackAfterGeneration({b64data: base64data, blobUrl: blobURL});
        }
      }
    });
    gif.render();
  }

  var _canvasDefaults = function(ctx,cvs) {
    var width = cvs.width
    var height = cvs.height
    ctx.clearRect(0,0,width,height);
    ctx.font = "14pt HGS明朝E";
    ctx.strokeStyle = "rgba(255,255,255,1)"; // 枠線色
    ctx.fillStyle = "rgba(255,255,255,1)"; // 文字色
    ctx.textAlign = 'left';
    ctx.lineWidth = 5; // 枠線の太さ
    ctx.lineJoin = 'round'; // アンチエイリアスっぽい?
    ctx.fillRect(0, 0, width, height);
    return ctx;
  }

  var _createTmpCanvas = function() {
    var tmpCanvas = $("<canvas>").attr('id', 'gif-factory-tmpcanvas').css("display", "none");
    $("body").append(tmpCanvas);
  }

  var _loader = function(type) {
    var file = $(opts.inputFileElm)[0].files[0];
    loadImage(
      file,
      function(res) {
        if (type == 'img+gif') {
          opts.frameToGifOption.uploadElm = res;
          _frameToGif(opts.frameToGifOption);
        } else if (type == 'word+gif') {
          opts.wordToGifOption.uploadElm = res;
          opts.wordToGifOption.text = $(opts.inputTextElm).val();
          _wordToGif(opts.wordToGifOption);
        }
      },
      opts.imgLoaderOptions
    );
  }

  return {
    init: function(options) { return init(options); },
    frameToGif: function(){ return frameToGif(); },
    wordToGif: function(){ return wordToGif(); }
  }
}