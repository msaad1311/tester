////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// CONSTANT  ///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const socketio = io();
const socket = socketio.on("connect", function () {
  console.log("Connected...!", socket.connected);
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// AUDIO PORTION //////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const startRecording = document.getElementById("start-recording");
const stopRecording = document.getElementById("stop-recording");
let recordAudio;
console.log('into audio html')

startRecording.disabled = false;

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

  transcriptID.innerHTML = text[0];
  // transcriptID.readOnly = "true";

  translateID.innerHTML = text[1];
  // translateID.readOnly = "true";
});
socket.on("errorMessage", () => {
  alert("Sorry retry");
});
