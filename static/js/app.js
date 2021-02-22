const socketio = io();
let canvas = document.querySelector('canvas');
let canvasCtx = canvas.getContext("2d");
let analyser = null;
const socket = socketio.on("connect", function () {
  // reset the recorder
  startRecording.disabled = false;
});

const startRecording = document.getElementById("start-recording");
const stopRecording = document.getElementById("stop-recording");
let recordAudio;

// on start button handler
startRecording.onclick = function () {
  // recording started
  startRecording.disabled = true;

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
      visualize();
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
  transcriptID.readOnly = "true";

  translateID.value = text[1];
  translateID.readOnly = "true";
});
socket.on("errorMessage", () => {
  alert("Sorry retry");
});

function visualize() {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  CENTERX = canvas.width / 2;
  CENTERY = canvas.height / 2;

  recordAudio.fftSize = 32;
  let bufferLength = recordAudio.frequencyBinCount;
  console.log(bufferLength);
  let dataArray = new Uint8Array(bufferLength);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  let draw = () => {
    drawVisual = requestAnimationFrame(draw);

    recordAudio.getByteFrequencyData(dataArray);
    canvasCtx.fillStyle = "rgb(0, 0, 0)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    // let radius = dataArray.reduce((a,b) => a + b) / bufferLength;
    let radius = dataArray[2] / 2;
    if (radius < 20) radius = 20;
    if (radius > 100) radius = 100;
    // console.log('Radius ', radius)
    canvasCtx.beginPath();
    canvasCtx.arc(CENTERX, CENTERY, radius, 0, 2 * Math.PI, false);
    // canvasCtx.fillStyle = 'rgb(50,50,' + (radius+100) +')';
    // canvasCtx.fill();
    canvasCtx.lineWidth = 6;
    canvasCtx.strokeStyle = "rgb(50,50," + (radius + 100) + ")";
    canvasCtx.stroke();
  };
  draw();
}
