var Player = {};
var time = 0.0;
var bpm = 60;

function audioExec(track) {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  var context = new AudioContext();
  var oscillator = context.createOscillator();
  var gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);

  // set params
  gain.gain.value = 0.2;
  oscillator.type = 2;
  oscillator.frequency.value = -1;
  var bpb = 60/bpm;

  var i = 0;
  var res = "";
  while(i < 100) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.value = 0.2;
    oscillator.frequency.value = track.notes[i].pitch;
    oscillator.start(time);
    oscillator.stop(time+bpb*2);
    res += "Time: " + time + ", key: " + track.notes[i].key + ", RGBA(" + track.notes[i].rgba + ")\n";
    time += bpb;
    i++;
  }
  setTimeout(function(){
    document.getElementById("detail").innerText = res;
  }, 1000);

  document.getElementById('stop').addEventListener('click', function(){
    location.href = '/image_to_wave/web_audio_demo.html';
  });

}

window.onload = function(){
  init();
};

function init(){
  // crate pitch
  createPitchList();
  // img load
  var bimgUrl = "http://img.gifmagazine.net/gifmagazine/000thumbnail/images/4/thumb.png";
  loadImage(bimgUrl);
  loadBpm();
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

function parseInput() {
  init();
  var track = parseImage();
  audioExec(track);
}

function renderingStart() {
  parseInput();
}

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

function loadBpm() {
  bpm = parseInt(document.getElementById('inputBpm').value);
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
    var pitch = convertToPitch(keycodewithoct);
    track.notes.push(
      {
        key : keycodewithoct,
        pitch: pitch,
        length : 1,
        rgba: imgData[i]+ "," + imgData[i+1] + "," + imgData[i+2] + "," + imgData[i+3]
      });
  };
  return track;
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
  Player.pitchList = pitchList;
}

function convertToPitch(key){
  var f = Player.pitchList[key];
  if(f) return f;
  else return 220.0;
}