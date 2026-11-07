// Web Audio API Synthesizer for SipCraft Drinking Game
// 100% self-contained, 0 external asset latency, works offline on iPhone Safari & Android Chrome

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // 1. Âm thanh bốc & lật thẻ bài 3D (3D Spatial Card Flip Whoosh & Snap)
  public playCardFlip() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // 1. Gió rít khi lá bài bay vút trong không gian 3D (Aerodynamic Whoosh)
      const whooshSize = Math.floor(ctx.sampleRate * 0.18);
      const whooshBuffer = ctx.createBuffer(1, whooshSize, ctx.sampleRate);
      const whooshData = whooshBuffer.getChannelData(0);
      for (let i = 0; i < whooshSize; i++) {
        whooshData[i] = (Math.random() * 2 - 1) * Math.sin((i / whooshSize) * Math.PI);
      }
      const whoosh = ctx.createBufferSource();
      whoosh.buffer = whooshBuffer;

      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = "bandpass";
      whooshFilter.frequency.setValueAtTime(600, now);
      whooshFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
      whooshFilter.frequency.exponentialRampToValueAtTime(450, now + 0.18);
      whooshFilter.Q.setValueAtTime(3.5, now);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.01, now);
      whooshGain.gain.linearRampToValueAtTime(0.35, now + 0.07);
      whooshGain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);

      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whoosh.start(now);

      // 2. Tiếng đập nảy dứt khoát khi lá bài 3D lật tiếp đất (Crisp Card Snap / Table Thud)
      const snapTime = now + 0.09;
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = "sine";
      snapOsc.frequency.setValueAtTime(420, snapTime);
      snapOsc.frequency.exponentialRampToValueAtTime(80, snapTime + 0.06);

      snapGain.gain.setValueAtTime(0.28, snapTime);
      snapGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.06);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(snapTime);
      snapOsc.stop(snapTime + 0.07);

      // 3. Tiếng ma sát bề mặt lá bài (Paper Rustle)
      const rustleSize = Math.floor(ctx.sampleRate * 0.08);
      const rustleBuffer = ctx.createBuffer(1, rustleSize, ctx.sampleRate);
      const rustleData = rustleBuffer.getChannelData(0);
      for (let i = 0; i < rustleSize; i++) {
        rustleData[i] = Math.random() * 2 - 1;
      }
      const rustle = ctx.createBufferSource();
      rustle.buffer = rustleBuffer;

      const rustleFilter = ctx.createBiquadFilter();
      rustleFilter.type = "highpass";
      rustleFilter.frequency.setValueAtTime(3200, snapTime);

      const rustleGain = ctx.createGain();
      rustleGain.gain.setValueAtTime(0.15, snapTime);
      rustleGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.08);

      rustle.connect(rustleFilter);
      rustleFilter.connect(rustleGain);
      rustleGain.connect(ctx.destination);
      rustle.start(snapTime);
    } catch (e) {}
  }

  // 2. Âm thanh cụng ly / chạm lon bia (Clinking Beer Glasses "Keng! 🍻")
  public playBeerClink() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High glass ping frequencies: 2100Hz and 2800Hz
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(2250, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(3400, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {}
  }

  // 3. Âm thanh nuốt ngụm bia ừng ực (Beer Gulp)
  public playBeerGulp() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // 4. Âm thanh vỗ tay / chúc mừng vượt qua thử thách (Cheer / Success Chime)
  public playSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Happy ascending C major chord: C5 (523), E5 (659), G5 (784), C6 (1046)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }

  // 5. Âm thanh đổi câu / xáo bài (Shuffle / Reroll)
  public playShuffle() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.05;

        osc.type = "sine";
        osc.frequency.setValueAtTime(300 + Math.random() * 200, startTime);
        osc.frequency.exponentialRampToValueAtTime(180, startTime + 0.04);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.05);
      }
    } catch (e) {}
  }

  // 6. Âm thanh cười / trêu đùa (Laugh / Funny wobble)
  public playLaughWobble() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [350, 420, 320, 400, 280];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.08);
      });
    } catch (e) {}
  }

  // 7. Âm thanh Kèn Trống Chúc Mừng Rút Bài (Brass Trumpet Fanfare & Drum Celebration)
  public playFanfareCelebration() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Drum beat roll (tiếng trống tùng tùng)
      const drumTimes = [0, 0.08, 0.16, 0.24, 0.32];
      drumTimes.forEach((dt) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + dt;
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.07);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      });

      // 2. Brass Trumpet Fanfare: G4 (392), C5 (523), E5 (659), G5 (784)
      const fanfareNotes = [
        { note: 392.0, start: 0.35, dur: 0.12 },
        { note: 523.25, start: 0.48, dur: 0.12 },
        { note: 659.25, start: 0.61, dur: 0.14 },
        { note: 783.99, start: 0.76, dur: 0.45 },
      ];

      fanfareNotes.forEach(({ note, start, dur }) => {
        const t = now + start;

        // Lead Trumpet (Sawtooth filtered for rich brass timbre)
        const osc1 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(note, t);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(900, t + dur);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        osc1.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(t);
        osc1.stop(t + dur + 0.05);

        // Harmonics (Triangle layer for warmth)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(note * 0.5, t); // Octave lower body
        gain2.gain.setValueAtTime(0.12, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + dur);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t);
        osc2.stop(t + dur + 0.05);
      });

      // 3. Final Crash Cymbal
      const crashStart = now + 0.76;
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const crashFilter = ctx.createBiquadFilter();
      crashFilter.type = "highpass";
      crashFilter.frequency.setValueAtTime(5000, crashStart);

      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(0.15, crashStart);
      crashGain.gain.exponentialRampToValueAtTime(0.001, crashStart + 0.35);

      noise.connect(crashFilter);
      crashFilter.connect(crashGain);
      crashGain.connect(ctx.destination);
      noise.start(crashStart);
    } catch (e) {}
  }

  // 8. Âm thanh Cười Haha (Laugh "Ha Ha Ha Ha! 😂")
  public playHahaLaugh() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // 5 chuỗi tiếng cười "Hắc hắc hắc ha ha"
      const laughPitches = [420, 500, 460, 520, 410, 360];
      laughPitches.forEach((pitch, i) => {
        const t = now + i * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(pitch, t);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, t + 0.09);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(900, t);
        filter.Q.setValueAtTime(2.5, t);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch (e) {}
  }

  // 9. Âm thanh Vỗ Tay Đám Đông (Crowd Applause / Clapping 👏)
  public playApplause() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const totalClaps = 16;
      for (let i = 0; i < totalClaps; i++) {
        const t = now + i * 0.06 + Math.random() * 0.03;
        const bufferSize = Math.floor(ctx.sampleRate * 0.04);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1100 + Math.random() * 500, t);
        filter.Q.setValueAtTime(1.5, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15 + Math.random() * 0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(t);
      }
    } catch (e) {}
  }

  // 10. Khẩu lệnh AI Giọng Đọc "Uống đi! Uống đi! Uống đi! 🍻" (AI Voice Chant)
  public playChantDrink() {
    if (this.isMuted) return;
    // Cụng ly bia kèm theo
    this.playBeerClink();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const chant = new SpeechSynthesisUtterance("Uống đi! Uống đi! Uống đi!");
        chant.lang = "vi-VN";
        chant.rate = 1.15;
        chant.pitch = 1.25;
        chant.volume = 1.0;
        window.speechSynthesis.speak(chant);
      } catch (e) {}
    }
  }

  // 11. Âm thanh Hóng Biến Drama Giật Gân "Dun Dun Dunnn! 👀" (Drama Sting)
  public playDramaSting() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // 3 nốt kịch tính chấn động: Dun (D3 - 146Hz) - Dun (C#3 - 138Hz) - Dunnn (Bb2 - 116Hz)
      const stings = [
        { freq: 146.8, time: 0, dur: 0.16 },
        { freq: 138.6, time: 0.22, dur: 0.16 },
        { freq: 116.5, time: 0.44, dur: 0.75 },
      ];

      stings.forEach(({ freq, time, dur }) => {
        const t = now + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + dur);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + dur + 0.05);
      });
    } catch (e) {}
  }
}

export const sounds = new SoundManager();
