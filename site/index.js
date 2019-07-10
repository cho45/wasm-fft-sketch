
(async () => {
	const lib = await import("../pkg/wa_dsp.js");

	const targetReal = new Float32Array([ 6, -10, 8, -6, 11, 13, 6, 5, 1, -5, 1, 3, -14, -14, 4, 7 ]);
	const targetComplex = new Float32Array(Array.from(targetReal).flatMap( i => [i, 0]));

	const input_  = new Float32Array(32);
	const output_ = new Float32Array(32);

	const fftinstance = new lib.FFT(16);
	{
		start = performance.now();
		let [input, output] = [input_, output_];
		input.set(targetComplex, 0);
		fftinstance.fft(input, output);
		console.log(output.join());

		[input, output] = [output, input];
		fftinstance.ifft(input, output);
		console.log(output.map(Math.round).filter( (_, i) => i % 2 === 0));
		console.log(performance.now() - start, 'ms');
	}
	{
		start = performance.now();
		let [input, output] = [input_, output_];
		input.set(targetComplex, 0);
		fftinstance.fft(input, output);

		[input, output] = [output, input];
		fftinstance.ifft(input, output);
		console.log(output.map(Math.round).filter( (_, i) => i % 2 === 0));
		console.log(performance.now() - start, 'ms');
	}
})();

