import React, { useEffect, useRef, useState } from "react";
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';

function App() {

  const videoRef = useRef(null);
  const photoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);

  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const w = window.innerWidth;
  const h = window.innerHeight;
  let recordingTimeMS = 60; // set default stop recording to 60 seconds 60000

  const getVideoStream = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: { width: w, height: h } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.width = w
        video.height = h
        setStream(stream)
        video.play();
      })
      .catch((err) => {
        alert('Unable to capture your camera. Please check console logs.');
        console.error(err);
      })
  }

  const takePhoto = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let video = videoRef.current;
    let photo = photoRef.current;

    photo.width = w;
    photo.height = h;

    let ctx = photo.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    setHasPhoto(true)

    var resultDiv = document.querySelector('.result')
    resultDiv.style.display = 'block';
    resultDiv.style.zIndex = '2';
    var takeVideoDiv = document.querySelector('#recordingBtn');
    takeVideoDiv.style.display = 'none';
  }

  const handleCloseSnapPhoto = () => {
    var resultDiv = document.querySelector('.result')
    resultDiv.style.display = 'none';
    resultDiv.style.zIndex = '-1';

    var takeVideoDiv = document.querySelector('#recordingBtn');
    takeVideoDiv.style.display = 'block';

    let photo = photoRef.current;

    let ctx = photo.getContext('2d');
    ctx.clearRect(0, 0, photo.width, photo.height);
    setHasPhoto(false)

    getVideoStream();
  }

  const handleCloseRecordingPreview = () => {
    var resultDiv = document.querySelector('.recorded')
    resultDiv.style.display = 'none';
    resultDiv.style.zIndex = '-1';
    document.querySelector('#stopBtn').style.display = "none";

    var takeVideoDiv = document.querySelector('#recordingBtn');
    takeVideoDiv.style.display = 'block';

    var recordedVideo = document.querySelector('video#recording');
    recordedVideo.src = null;
    setRecording(false);
    getVideoStream();
    document.querySelector('#log').innerHTML = "";
    document.querySelector('#recordedTime').innerHTML = "";
  }

  const startRecording = async () => {
    let data = []; // blob
    let recorder, dateStarted;

    if (stream) {
      recorder = new MediaRecorder(stream);
    }

      recorder.ondataavailable = event => data.push(event.data);
      recorder.start();
      setRecording(true);

      dateStarted = new Date().getTime();

      let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(event.name);
      });

      document.querySelector('#stopBtn').addEventListener('click', function() {
        wait(0).then(
          () => recorder.state === "recording" && recorder.stop()
        )
      })

      // let recorded = wait(recordingTimeMS).then(
      //   () => recorder.state === "recording" && recorder.stop()
      // );
      let recorded;
      
      let count = 0;
      (function looper() {
          
          if(recorder.state === "inactive") {
              return;
          }
          document.querySelector('#stopBtn').style.display = "block";
          document.querySelector('#recordedTime').innerHTML = calculateTimeDuration((new Date().getTime() - dateStarted) / 1000);
          setTimeout(looper, 1000);
          count++

          if (count === recordingTimeMS) {
            recorded = wait(0).then(
              () => recorder.state === "recording" && recorder.stop()
            );
          }
      })();

      return Promise.all([
        stopped,
        recorded
      ])
      .then(() => {
        if (data) {
          setHasRecorded(true);
          setRecording(false);

          let recordedBlob = new Blob(data, {
            type: "video/webm"
          });

          var takeVideoDiv = document.querySelector('#recordingBtn');
          takeVideoDiv.style.display = 'none';
          document.querySelector('#stopBtn').style.display = "none";

          var recordDiv = document.querySelector('.recorded');
          var recordedVideo = document.querySelector('video#recording');
          recordedVideo.src = window.URL.createObjectURL(recordedBlob);
          recordedVideo.controls = true;
          recordedVideo.loop = true;
          recordedVideo.controlsList = "nofullscreen";
          recordedVideo.width = w;
          recordedVideo.height = h;
          recordedVideo.play();

          log("Recorded: " + formatBytes(recordedBlob.size));

          recordDiv.style.display = 'block';
          recordDiv.style.zIndex = '2';
        }
      })
  }

  useEffect(() => {
    getVideoStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop(stream) {
    stream.getTracks().forEach((track) => {
      track.stop()
      setHasRecorded(true);
      setRecording(false);
    });
  }

  function log(msg) {
    let logElement = document.getElementById("log");
    logElement.innerHTML += msg + "\n";
  }

  function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  }

  function calculateTimeDuration(secs) {
    var hr = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600)) / 60);
    var sec = Math.floor(secs - (hr * 3600) - (min * 60));

    if (min < 10) {
        min = "0" + min;
    }

    if (sec < 10) {
        sec = "0" + sec;
    }

    if(hr <= 0) {
        return min + ':' + sec;
    }

    return hr + ':' + min + ':' + sec;
  }

  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  return (
    <div className="App">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
        <button id="stopBtn" onClick={() => stop(stream)}>
          <StopCircleOutlinedIcon />
        </button>
        <span id="recordedTime"></span>
        </div>
        <pre id="log"></pre>
      </div>
      <div className="camera">
        <video ref={videoRef}></video>
        <button className="cameraBtn" onClick={takePhoto}>
          <CameraAltOutlinedIcon />
        </button>
        <div id="recordingBtn" className="recordingBtn">
          <button className={ `record ${recording ? 'recording' : ''}` } onClick={startRecording} disabled={recording}></button>
        </div>
      </div>
      
      <div className={ `result ${hasPhoto ? 'hasPhoto' : ''}` }>
        <canvas ref={photoRef}></canvas>
        <button onClick={handleCloseSnapPhoto}>
          <CloseOutlinedIcon />
        </button>
        <button className="save">
          <CloudUploadOutlinedIcon />
        </button>
      </div>

      <div className={ `recorded ${hasRecorded ? 'hasRecorded' : ''}` }>
        <video id="recording" controls autoPlay playsInline></video>
        <button onClick={handleCloseRecordingPreview}>
          <CloseOutlinedIcon />
        </button>
        <button className="save">
          <CloudUploadOutlinedIcon />
        </button>
      </div>
    </div>
  );
}

export default App;
