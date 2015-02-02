﻿(function(){
    var UseWebAudio = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext);
    if (UseWebAudio) {
        return;
    }
    var AudioContext = {};

    Fire.AudioClipLoader = function (url, callback, onProgress) {
        var audio = document.createElement("audio");
        audio.addEventListener("canplaythrough", function () {
            callback(audio);
        }, false);
        audio.addEventListener('error', function (e) {
            callback(null, 'LoadAudioClip: "' + url +
                    '" seems to be unreachable or the file is empty. InnerMessage: ' + this.error);
        }, false);

        audio.src = url;
        audio.load();
    };

    AudioContext.initSource = function (target) {
        target._audio = null;
    };

    // 靜音
    AudioContext.updateMute = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.muted = target.mute;
    };

    // 设置音量，音量范围是[0, 1]
    AudioContext.updateVolume = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.volume = target.volume;
    };

    // 设置循环
    AudioContext.updateLoop = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.loop = target.loop;
    };

    // 将音乐源节点绑定具体的音频buffer
    AudioContext.updateAudioClip = function (target) {
        if (!target || !target.clip) { return; }
        target._audio = target.clip.rawData;
    };

    // 设置音乐播放完后的回调
    AudioContext.setOnEnd = function (target) {
        if (!target || !target._audio) { return; }
        audio.addEventListener('ended', function () {
            target.onPlayEnd.bind(target)
        }, false);
    };

    // 暫停
    AudioContext.pause = function (target) {
        if (!target._audio) { return; }
        target._audio.pause();
    };

    // 停止
    AudioContext.stop = function (target) {
        if (!target._audio) { return; }
        target._audio.pause();
        target._audio.currentTime = 0;
    };

    // 播放
    AudioContext.play = function (target) {
        if (!target || !target.clip || !target.clip.rawData) { return; }
        if (target._play) { return; }
        this.updateAudioClip(target);
        this.updateVolume(target);
        this.updateLoop(target);
        this.updateMute(target);
        this.setOnEnd(target);
        target._audio.play();
    };

    // 获得音频剪辑的 buffer
    AudioContext.getClipBuffer = function (clip) {
        Fire.error("Audio does not contain the attribute!");
        return null;
    };

    // 以秒为单位 获取音频剪辑的 长度
    AudioContext.getClipLength = function (clip) {
        return target.clip.rawData.duration;
    };

    // 音频剪辑的长度
    AudioContext.getClipSamples = function (target) {
        Fire.error("Audio does not contain the attribute!");
        return null;
    };

    // 音频剪辑的声道数
    AudioContext.getClipChannels = function (target) {
        Fire.error("Audio does not contain the attribute!");
        return null;
    };

    // 音频剪辑的采样频率
    AudioContext.getClipFrequency = function (target) {
        Fire.error("Audio does not contain the attribute!");
        return null;
    };


    Fire.AudioContext = AudioContext;
})();
