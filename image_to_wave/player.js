/********** Forked from https://github.com/yanagia/jsaudio **********/
/********** In detail, read http://d.hatena.ne.jp/yanagia/20100323/1269334226 **********/

var Score, Player;
var minlen = 16;

window.onload = function(){
  init();
};

function parseInput(){
  init();

  var mml = document.getElementById("mml");
  // var track = parseMML(mml.value);
  var track = parseImage();
  var note;

  for(var i = 0; i < track.notes.length; i++){
    note = track.notes[i];
    addNote(note.key, note.start, note.length);
  }
  Score.bpm = track.bpm;
}

function init(){
  Score = {
    bpm : 320,
    bpb : 4, 			// bar per beat
    notes : []
  };

  Player = {
    currentBar : 0,
    timer : null,
    renderBuffer : [],
    renderStream : document.getElementById("audioStream")
  };

  Player.pitchList = createPitchList();

  // img load
  var bimgUrl = "http://img.gifmagazine.net/gifmagazine/000thumbnail/images/4/thumb.png";
  loadImage(bimgUrl);
  document.getElementById('inputImg').addEventListener('change', function(){
    var file = this.files[0];
    var fileReader = new FileReader();

    fileReader.onload = function(e) {
      document.getElementById('imgDiv').setAttribute('src', e.target.result);
      loadImage(e.target.result);
    };
    fileReader.readAsDataURL(file);
  });
}

function createPitchList(){
  var base = {
    "Cd" : 261.6/4, "Cd#" : 277.2/4, "Dd" : 293.7/4, "Dd#" : 311.1/4,
    "Ed" : 329.6/4, "Fd" : 349.2/4, "Fd#" : 370.0/4, "Gd" : 392.0/4,
    "Gd#" : 415.3/4, "Ad" : 440.0/8, "Ad#" : 466.2/8, "Bd" : 493.9/8
  };

  var pitchList = {
    "A1" :  440.0/8 , "A1#" : 466.2/8 , "B1" : 493.9/8,
    "C1" : 261.6/4, "C1#" : 277.2/4, "D1" : 293.7/4, "D1#" : 311.1/4,
    "E1" : 329.6/4, "F1" : 349.2/4, "F1#" : 370.0/4, "G1" : 392.0/4,
    "G1#" : 415.3/4
  };

  var h;
  for(h = 2; h < 8; h++){
    for(var i in base){
      pitchList[i.replace("d", h.toString(10))] =
	pitchList[i.replace("d", (h-1).toString(10))] * 2;
    }
  }
  return pitchList;
}

function addNote(key, sb, eb){
  var arr = Score.notes;

  arr.push({
	     start : sb,
	     end : eb+sb,
	     key : key
	   });
}

function convertToPitch(key){
  var f = Player.pitchList[key];

  if(f) return f;
  else return 220.0;
}

function setUserCode(){
  try{
    Player.userCode = userCode;
    return true;
  }catch(e){
    alert(e);
    console.log(e);
    return false;
  }
};

function createSignal(duration, pitch){
  try{
    var signal = Player.userCode(duration, pitch);
  }catch(e){
    stop();
    alert("波形を生成する関数に誤りがあります。");
    console.log(e);
  }
  return signal;
}

function stop(){
  clearInterval(Player.timer);

  var ndlist = Player.renderStream.childNodes;
  var i, len;
  len = ndlist.length;
  for(i = 0; i < ndlist.length; i++){
    ndlist[i].pause();
    Player.renderStream.removeChild(ndlist[i]);
  }
}

function renderingStart(){
  parseInput();
  if(! setUserCode()) return;
  setTimeout(renderingAll, 1);
}

function renderingAll(){
  var i, len, notes, currentBar;
  var signal, audio, url, baseSignal, totalFrame;

  Score.notes.sort(
    function (a, b){
      return a.start - b.start;
    });

  var lastNote = Score.notes[Score.notes.length-1];
  Player.endTime = lastNote.end + minlen;

  notes = Score.notes;
  len = notes.length;
  totalFrame = Player.endTime * ((60.0 / Score.bpm) / (minlen / 4)) * 44100;
  baseSignal = new Array(Math.round(totalFrame));
  for(i = 0; i < totalFrame; i++){
    baseSignal[i] = 0;
  }

  for(i = 0; i < len; i++){
    signal = createSignal(
      ((60.0 / Score.bpm) / (minlen / 4)) *
	(notes[i].end - notes[i].start),
      convertToPitch(notes[i].key));
    signal = signal.map(function(item){ return item * 0.3; });
    mixSignal(baseSignal, signal, ((60.0 / Score.bpm) / (minlen / 4)) * notes[i].start * 44100);
  }

  var binary;
  binary = convertToBinary(baseSignal);
  url = convertToURL(binary);
  audio = new Audio(url);
  Player.renderStream.appendChild(audio);
  audio.volume = 0.30;
  Player.renderBuffer = [audio];

  audio.play();
}

function convertToBinary(signal){
  var binary = "", i, len;
  len = signal.length;
  for(i = 0; i < len; i++){
    if(signal[i] > 255){
      binary += String.fromCharCode(255);
    }
    else binary += String.fromCharCode(signal[i]);
  }
  return binary;
}

// *(s1+offset)++ = *s2++
function mixSignal(s1, s2, offset){
  var i, len;
  len = s2.length;
  for(i = 0; i < len; i++){
    s1[i+offset] = s1[i+offset] + s2[i];
  }
}

function userCode() {
  var duration, f;
  var i, t;
  var signals, sig, phase, hz, freq;

  duration = arguments[0];  // 生成すべき波形の長さ（秒）
  f = arguments[1];  // 生成すべき波形の周波数

  hz = 44100;  // サンプリングレート44.1kHzの波形を生成（変更しないこと）。
  phase = 0;
  t = Math.round(duration*hz); // 生成する波形の長さ（フレーム数）
  freq = f * 2.0 * Math.PI / hz;
  signals = new Array(t);  // 波形を収めておく配列

  for(i = 0; i < t; i++){
    sig = Math.sin(phase);  // サイン波(32bit float)を生成
    sig = (sig + 1) / 2 * 255;   // 0 〜 255 (8bit unsigned char) の範囲に変換
  //    sig = sig > 128 ? 180 : 75;  // (この行を有効にすると矩形波になる)
    signals[i] = Math.floor(sig);  // 浮動小数点から整数へ型変換

    phase += freq;
  }

  // ぶちぶち音対策
  sig = signals[signals.length-1];
  if(sig > 128){
    for(; sig >= 128; sig--){
      signals.push(sig);
    }
  }else if(sig < 128){
    for(; sig <= 128; sig++){
      signals.push(sig);
    }
  }

  return signals;
}

/************ I wrote only below codes ************/
/* loadImage loads a given image and render to canvas
 * convertToKey converts splited image pixels in which rgba is included to keycode.
 * parseImage split a image to pixel array
 */
function loadImage(imgUrl) {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  img.src = imgUrl;
  img.crossOrigin = "Anonymous";
  img.onload = function() {
    var scaleW = 10/img.width;
    var scaleH = 10/img.height;
    var dstW = img.width * scaleW;
    var dstH = img.height * scaleH;
    canvas.width = dstW;
    canvas.height = dstH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, this.width, this.height, 0, 0, dstW, dstH);
  };
}

function convertToKey(key) {
  var keycode;
  switch(key){
    case 0:
      keycode = "C";
      break;
    case 1:
      keycode = "C#";
      break;
    case 2:
      keycode = "D";
      break;
    case 3:
      keycode = "D#";
      break;
    case 4:
      keycode = "E";
      break;
    case 5:
      keycode = "F";
      break;
    case 6:
      keycode = "F#";
      break;
    case 7:
      keycode = "G";
      break;
    case 8:
      keycode = "G#";
      break;
    case 9:
      keycode = "A";
      break;
    case 10:
      keycode = "A#";
      break;
    case 11:
      keycode = "B";
      break;
    case 12:
      keycode = "C";
      break;
  }
  return keycode;
}

function parseImage() {
  var track = {};
  track.notes = [];
  track.bpm = parseInt(document.getElementById("inputBpm").value) || 60;

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (var i = 0;i < imgData.length/4;i++) {
    // pixelあたりのrgb平均
    var avg = Math.abs(Math.round((imgData[i]+imgData[i+1]+imgData[i+2]+imgData[i+3])/4) - 135);
    var oct = Math.round(avg / 13)+"";
    if (oct > 7) oct = Math.abs(7 - oct);
    if (oct < 3) oct = (parseInt(oct) + 3) + "";
    var keybase = avg % 13;
    var keycode = convertToKey(keybase);
    var spkeycode = keycode.split("");
    if (spkeycode.length == 1) {
      var keycodewithoct = spkeycode + oct;
    } else {
      var keycodewithoct = spkeycode.join(oct);
    }
    track.notes.push(
      {
        key : keycodewithoct,
        volume : 8,
        length : 1,
        start : i
      });
  };
  return track;
}