////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// VIDEO PORTION ///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
var socket = io("http://127.0.0.1:5000");

socket.on("connect", function () {
  console.log("Connected...!", socket.connected);
});

const video = document.querySelector("#videoElement");
backImages = document.getElementsByClassName("backgrounds");
let bgs = null;

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

setInterval(()=>{
  // cap.read(src);

  var type = "image/png";
  // var data = document.getElementById("canvasOutput").toDataURL(type);
  var video_element = document.getElementById("videoElement");
  var frame = capture(video_element, 1);
  var data = frame.toDataURL(type);
  data = data.replace("data:" + type + ";base64,", ""); //split off junk at the beginning
  for (backgroundImages of backImages) {
    backgroundImages.addEventListener("click", function (e) {
      console.log(e.target.id);
      bgs = document.getElementById(e.target.id);
      bgs.style.opacity = "1";
    });
  }
  socket.emit("image", {data:bgs,bg:bgs});
}, 10000 / FPS);

socket.on("response_back", function (image) {
  const image_id = document.getElementById("image");
  image_id.src = image;
});


