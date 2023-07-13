export class SoundMeter {
    context: AudioContext;
    instant: number;
    slow: number;
    clip: number;
    script: ScriptProcessorNode;

    constructor(context: AudioContext) {
        this.context = context;
        this.instant = 0.0;
        this.slow = 0.0;
        this.clip = 0.0;
        this.script = this.context.createScriptProcessor(2048, 1, 1);
        this.script.onaudioprocess = (event: AudioProcessingEvent) => {
            const input = event.inputBuffer.getChannelData(0);
            let i;
            let sum = 0.0;
            let clipcount = 0;
            for (i = 0; i < input.length; ++i) {
                sum += input[i] * input[i];
                if (Math.abs(input[i]) > 0.99) {
                    clipcount += 1;
                }
            }
            this.instant = Math.sqrt(sum / input.length);
            this.slow = 0.95 * this.slow + 0.05 * this.instant;
            this.clip = clipcount / input.length;
        };
    }
}