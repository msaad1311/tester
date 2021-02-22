const socketio = io();
let analyser = null;
const startRecording = document.getElementById("start-recording");
const stopRecording = document.getElementById("stop-recording");
let recordAudio;
const video = document.querySelector("#videoElement");
const socket = socketio.on("connect", function () {
  console.log("Connected...!", socket.connected);
});

// Video portion
video.width = 500;
video.height = 375;

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function (err0r) {
      console.log(err0r);
      console.log("Something went wrong!");
    });
}

// let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
// let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
// let cap = new cv.VideoCapture(video);

const FPS = 22;
function capture(video, scaleFactor) {
  if (scaleFactor == null) {
    scaleFactor = 1;
  }
  var w = video.videoWidth * scaleFactor;
  var h = video.videoHeight * scaleFactor;
  var canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

setInterval(() => {
  // cap.read(src);

  var type = "image/png";
  // var data = document.getElementById("canvasOutput").toDataURL(type);
  var video_element = document.getElementById("videoElement");
  var frame = capture(video_element, 1);
  var data = frame.toDataURL(type);
  data = data.replace("data:" + type + ";base64,", ""); //split off junk at the beginning
  // console.log('hi',data)
  socket.emit("image", data);
}, 10000 / FPS);

socket.on("response_back", function (image) {
  const image_id = document.getElementById("image");
  image_id.src = image;
});


// on start button handler
startRecording.onclick = function () {
  console.log("started recording");
  // recording started
  startRecording.disabled = true;
  document.querySelector("#msg").style.visibility = "visible";

  // make use of HTML 5/WebRTC, JavaScript getUserMedia()
  // to capture the browser microphone stream
  navigator.getUserMedia(
    {
      audio: true,
    },
    function (stream) {
      recordAudio = RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
        sampleRate: 44100, // this sampleRate should be the same in your server code

        // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
        // CanvasRecorder, GifRecorder, WhammyRecorder
        recorderType: StereoAudioRecorder,

        // Dialogflow / STT requires mono audio
        numberOfAudioChannels: 1,

        // get intervals based blobs
        // value in milliseconds
        // as you might not want to make detect calls every seconds
        timeSlice: 4000,

        // only for audio track
        // audioBitsPerSecond: 128000,

        // used by StereoAudioRecorder
        // the range 22050 to 96000.
        // let us force 16khz recording:
        desiredSampRate: 16000,
      });

      recordAudio.startRecording();
      stopRecording.disabled = false;
    },
    function (error) {
      console.error(JSON.stringify(error));
    }
  );
};

// on stop button handler
stopRecording.onclick = function () {
  // recording stopped
  startRecording.disabled = false;
  stopRecording.disabled = true;
  document.querySelector("#msg").style.visibility = "hidden";

  // stop audio recorder
  recordAudio.stopRecording(function () {
    // after stopping the audio, get the audio data
    recordAudio.getDataURL(function (audioDataURL) {
      var files = {
        audio: {
          type: recordAudio.getBlob().type || "audio/wav",
          dataURL: audioDataURL,
        },
      };
      socketio.emit("speech", files);
    });
  });
};
socket.on("messageBack", function (text) {
  console.log("hi", text);
  const transcriptID = document.getElementById("transcript");
  const translateID = document.getElementById("translate");

  transcriptID.value = text[0];
  // transcriptID.readOnly = "true";

  translateID.value = text[1];
  // translateID.readOnly = "true";
});
socket.on("errorMessage", () => {
  alert("Sorry retry");
});

