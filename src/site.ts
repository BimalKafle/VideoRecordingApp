let localStream: MediaStream;
let mediaRecorder: MediaRecorder;
let soundMeter: any;

const constraints: MediaStreamConstraints = {
    audio: true,
    video: {
        width: { min: 640, /*ideal: 800,*/ max: 1280 },
        height: { min: 480, /*ideal: 480,*/ max: 720 },
        facingMode: "environment" 

    },
};


interface VideoDeviceInfo {
    text: string;
    value: string;
}

function closeLocalStream(): void {
    if (localStream && localStream.getTracks) {
        localStream.getTracks().forEach((track) => {
            track.stop();
        });
    }
}

export async function getDevices(): Promise<VideoDeviceInfo[]> {
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });
    closeLocalStream();
    const videos: VideoDeviceInfo[] = [];
    const deviceInfos = await navigator.mediaDevices.enumerateDevices();
    deviceInfos
        .filter((deviceInfo) => deviceInfo.kind === 'videoinput')
        .forEach((video) => {
            videos.push({
                text: video.label || `Camera ${videos.length - 1}`,
                value: video.deviceId,
            });
        });
    return videos;
}


export async function isSupported(): Promise<boolean> {
    if (!navigator.mediaDevices.getUserMedia) {
        alert(
            'navigator.mediaDevices.getUserMedia not supported on your browser, use the latest version of Firefox or Chrome'
        );
        return false;
    } else if (typeof MediaRecorder === 'undefined') {
        alert(
            'MediaRecorder not supported on your browser, use the latest version of Firefox or Chrome'
        );
        return false;
    }
    return true;
}

export async function connectDevice(
): Promise<MediaStream> {
    if (localStream) {

        closeLocalStream();
    }
 

    
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('connectDevice checking localStream', localStream);
    localStream.getTracks().forEach((track) => {
        if (track.kind === 'audio' || track.kind === 'video') {
            track.onended = () => {
                console.log(
                    `${track.kind}, track.onended track.readyState=${track.readyState}, track.muted=${track.muted}`
                );
            };
        }
    });

    try {
        window.AudioContext = window.AudioContext ;
    } catch (e) {
        console.log('Web Audio API not supported.');
    }
    return localStream;
}

export async function startRecording(callback: (data: any) => void): Promise<Blob> {
    let options: MediaRecorderOptions = {};
  
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        options = { mimeType: 'video/webm;codecs=h264' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = {
          mimeType: 'video/mp4',
          videoBitsPerSecond: 2500000,
        };
      }
  
      mediaRecorder = new MediaRecorder(localStream, options);
    } else {
      console.log('isTypeSupported is not supported, using default codecs for the browser');
      mediaRecorder = new MediaRecorder(localStream);
    }
  
    const chunks: Blob[] = [];
    let recordingTime = 0;
    let recordingTimer: number = 0;
  
    function startTimer() {
      console.log('start timer');
      callback({ recordingTime });
      recordingTimer = setInterval(() => {
        recordingTime += 0.1;
        callback({ recordingTime });
      }, 100);
    }
  
    function stopTimer() {
      console.log('stop timer');
      clearInterval(recordingTimer);
    }
  
    return new Promise<Blob>((resolve, reject) => {
      mediaRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
  
      mediaRecorder.onerror = function (e) {
        console.log('mediaRecorder.onerror: ' + e);
        stopTimer();
        reject(e);
      };
  
      mediaRecorder.onstop = function () {
        console.log('mediaRecorder.onstop, mediaRecorder.state = ' + mediaRecorder.state);
        const recordedBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
        resolve(recordedBlob);
        stopTimer();
      };
  
      mediaRecorder.onstart = function () {
        console.log('mediaRecorder.onstart, mediaRecorder.state = ' + mediaRecorder.state);
        localStream.getTracks().forEach(function (track) {
          if (track.kind === 'audio' || track.kind === 'video') {
            console.log('onstart - ' + track.kind + ', track.readyState=' + track.readyState + ', track.muted=' + track.muted);
          }
        });
        if (mediaRecorder.state == 'recording') {
          startTimer();
        }
      };
  
      mediaRecorder.onpause = function () {
        console.log('mediaRecorder.onpause, mediaRecorder.state = ' + mediaRecorder.state);
        stopTimer();
      };
  
      mediaRecorder.onresume = function () {
        console.log('mediaRecorder.onresume, mediaRecorder.state = ' + mediaRecorder.state);
        startTimer();
      };
  
      mediaRecorder.start(200);
  
      console.log('Here is where');
      localStream.getTracks().forEach(function (track) {
        console.log(track.kind + ':' + JSON.stringify(track.getSettings()));
        console.log(track.getSettings());
      });
    });
  }
  
export function stopRecording() {
    if (mediaRecorder) {
        console.log('Stop?');
        mediaRecorder.stop();
    }
}

export function pauseRecording() {
    if (mediaRecorder) {
        mediaRecorder.pause();
    }
}

export function resumeRecording() {
    console.log('Origin resumeRecording!!!!!!! mediaRecorder:', mediaRecorder);
    if (mediaRecorder) {
        mediaRecorder.resume();
    }
}
