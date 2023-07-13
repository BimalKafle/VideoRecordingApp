var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let localStream;
let mediaRecorder;
let soundMeter;
const constraints = {
    audio: true,
    video: {
        width: { min: 640, /*ideal: 800,*/ max: 1280 },
        height: { min: 480, /*ideal: 480,*/ max: 720 },
        facingMode: "environment"
    },
};
function closeLocalStream() {
    if (localStream && localStream.getTracks) {
        localStream.getTracks().forEach((track) => {
            track.stop();
        });
    }
}
export function getDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        localStream = yield navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        closeLocalStream();
        const videos = [];
        const deviceInfos = yield navigator.mediaDevices.enumerateDevices();
        deviceInfos
            .filter((deviceInfo) => deviceInfo.kind === 'videoinput')
            .forEach((video) => {
            videos.push({
                text: video.label || `Camera ${videos.length - 1}`,
                value: video.deviceId,
            });
        });
        return videos;
    });
}
export function isSupported() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!navigator.mediaDevices.getUserMedia) {
            alert('navigator.mediaDevices.getUserMedia not supported on your browser, use the latest version of Firefox or Chrome');
            return false;
        }
        else if (typeof MediaRecorder === 'undefined') {
            alert('MediaRecorder not supported on your browser, use the latest version of Firefox or Chrome');
            return false;
        }
        return true;
    });
}
export function connectDevice() {
    return __awaiter(this, void 0, void 0, function* () {
        if (localStream) {
            closeLocalStream();
        }
        localStream = yield navigator.mediaDevices.getUserMedia(constraints);
        console.log('connectDevice checking localStream', localStream);
        localStream.getTracks().forEach((track) => {
            if (track.kind === 'audio' || track.kind === 'video') {
                track.onended = () => {
                    console.log(`${track.kind}, track.onended track.readyState=${track.readyState}, track.muted=${track.muted}`);
                };
            }
        });
        try {
            window.AudioContext = window.AudioContext;
        }
        catch (e) {
            console.log('Web Audio API not supported.');
        }
        return localStream;
    });
}
export function startRecording(callback) {
    return __awaiter(this, void 0, void 0, function* () {
        let options = {};
        if (typeof MediaRecorder.isTypeSupported === 'function') {
            if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                options = { mimeType: 'video/webm;codecs=h264' };
            }
            else if (MediaRecorder.isTypeSupported('video/webm')) {
                options = { mimeType: 'video/webm' };
            }
            else if (MediaRecorder.isTypeSupported('video/mp4')) {
                options = {
                    mimeType: 'video/mp4',
                    videoBitsPerSecond: 2500000,
                };
            }
            mediaRecorder = new MediaRecorder(localStream, options);
        }
        else {
            console.log('isTypeSupported is not supported, using default codecs for the browser');
            mediaRecorder = new MediaRecorder(localStream);
        }
        const chunks = [];
        let recordingTime = 0;
        let recordingTimer = 0;
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
        return new Promise((resolve, reject) => {
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
