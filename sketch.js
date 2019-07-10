//#!/usr/bin/env node
"use strict";

const { performance } = require('perf_hooks');

{ // polyfill
	if (!Array.prototype.flat) {
		Array.prototype.flat = function(depth) {
			var flattend = [];
			(function flat(array, depth) {
				for (let el of array) {
					if (Array.isArray(el) && depth > 0) {
						flat(el, depth - 1); 
					} else {
						flattend.push(el);
					}
				}
			})(this, Math.floor(depth) || 1);
			return flattend;
		};
	}

	if (!Array.prototype.flatMap) {
		Array.prototype.flatMap = function() {
			return Array.prototype.map.apply(this, arguments).flat(1);
		};
	}
}

(async (start) => {
	const lib = require("./node/wa_dsp.js");
	const wasm = require('./node/wa_dsp_bg');
	console.log(wasm);
	console.log(wasm.memory.buffer.byteLength / 1024, 'KB');
	wasm.memory.grow(100); // memory grow cause Cannot perform %TypedArray%.prototype.set on a
	console.log(wasm.memory.buffer.byteLength / 1024, 'KB');

	lib.init();

	//const targetReal = new Float32Array([ 6, -10, 8, -6, 11, 13, 6, 5, 1, -5, 1, 3, -14, -14, 4, 7 ]);
	const targetReal = new Float32Array(Array.from(new Array(4096)).map(_ => Math.round(Math.random() * 128 - 64)));
	// complex is interleaved array. memory layout must be matched with wasm
	const targetComplex = new Float32Array(Array.from(targetReal).flatMap( i => [i, 0]));

	// memory buffer on JS world
	const input_  = new Float32Array(targetComplex.length);
	const output_ = new Float32Array(targetComplex.length);

	console.log('call wasm_bindgen functions'); {
		{
			let [input, output] = [input_, output_];
			start = performance.now();
			input.set(targetComplex, 0);
			lib.fft(input, output, targetReal.length);
			console.log(output.slice(0, 16).join());

			[input, output] = [output, input];
			lib.ifft(input, output, targetReal.length);
			console.log(output.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}
		{
			let [input, output] = [input_, output_];
			start = performance.now();
			input.set(targetComplex, 0);
			lib.fft(input, output, targetReal.length);

			[input, output] = [output, input];
			lib.ifft(input, output, targetReal.length);
			console.log(output.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}
	}

	console.log('call class instance'); {
		const fftinstance = new lib.FFT(targetReal.length);
		{
			start = performance.now();
			let [input, output] = [input_, output_];
			input.set(targetComplex, 0);
			fftinstance.fft(input, output);
			console.log(output.slice(0, 16).join());

			[input, output] = [output, input];
			fftinstance.ifft(input, output);
			console.log(output.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}
		{
			start = performance.now();
			let [input, output] = [input_, output_];
			input.set(targetComplex, 0);
			fftinstance.fft(input, output);

			[input, output] = [output, input];
			fftinstance.ifft(input, output);
			console.log(output.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}
		fftinstance.free();
	}

	// allocate memory buffer from wasm world
	const inputPtr_  = wasm.__wbindgen_malloc(input_.length * 4);
	const outputPtr_ = wasm.__wbindgen_malloc(output_.length * 4);
	const inputZ_  = new Float32Array(wasm.memory.buffer, inputPtr_, input_.length);
	const outputZ_ = new Float32Array(wasm.memory.buffer, outputPtr_, output_.length);

	console.log('call wasm functions directly'); {
		{
			let [inputZ, inputPtr, outputZ, outputPtr] = [inputZ_, inputPtr_, outputZ_, outputPtr_];
			start = performance.now();
			inputZ.set(targetComplex, 0);
			wasm.fft(inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4, targetReal.length);
			console.log(outputZ.slice(0, 16).join());

			[inputZ, inputPtr, outputZ, outputPtr] = [outputZ, outputPtr, inputZ, inputPtr];
			wasm.ifft(inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4, targetReal.length);
			console.log(outputZ.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}

		{
			let [inputZ, inputPtr, outputZ, outputPtr] = [inputZ_, inputPtr_, outputZ_, outputPtr_];
			start = performance.now();
			inputZ.set(targetComplex, 0);
			wasm.fft(inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4, targetReal.length);

			[inputZ, inputPtr, outputZ, outputPtr] = [outputZ, outputPtr, inputZ, inputPtr];
			wasm.ifft(inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4, targetReal.length);
			console.log(outputZ.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}
	}

	console.log('call instance'); {
		let fftPtr = wasm.fft_new(targetReal.length);
		{
			let [inputZ, inputPtr, outputZ, outputPtr] = [inputZ_, inputPtr_, outputZ_, outputPtr_];
			start = performance.now();
			inputZ.set(targetComplex, 0);
			wasm.fft_fft(fftPtr, inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4);
			console.log(outputZ.slice(0, 16).join());

			[inputZ, inputPtr, outputZ, outputPtr] = [outputZ, outputPtr, inputZ, inputPtr];
			wasm.fft_ifft(fftPtr, inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4);
			console.log(outputZ.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}

		{
			let [inputZ, inputPtr, outputZ, outputPtr] = [inputZ_, inputPtr_, outputZ_, outputPtr_];
			start = performance.now();
			inputZ.set(targetComplex, 0);
			wasm.fft_fft(fftPtr, inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4);

			[inputZ, inputPtr, outputZ, outputPtr] = [outputZ, outputPtr, inputZ, inputPtr];
			wasm.fft_ifft(fftPtr, inputPtr, inputZ.length * 4, outputPtr, outputZ.length * 4);
			console.log(outputZ.slice(0, 16).map(Math.round).filter( (_, i) => i % 2 === 0));
			console.log(performance.now() - start, 'ms');
		}

		wasm.__wbg_fft_free(fftPtr);
		// wasm.__wbindgen_free(inputPtr, inputZ.length * 4);
		// wasm.__wbindgen_free(outputPtr, outputZ.length * 4);
	}


	const Benchmark = require('benchmark');
	const DSPJS = require('./assets/dsp.js');

	const fftDspJs = new DSPJS.FFT(targetReal.length, 2000);
	const fftPtr = wasm.fft_new(targetReal.length);
	const fftinstance = new lib.FFT(targetReal.length);
	new Benchmark.Suite().
		add('[wasm] rust no copy with instance', () => {
			// create new Float32Array view for pointer to avoid detached ArrayBuffer
			const inputZ_  = new Float32Array(wasm.memory.buffer, inputPtr_, input_.length);
			const outputZ_ = new Float32Array(wasm.memory.buffer, outputPtr_, output_.length);
			let [inputZ, inputPtr, outputZ, outputPtr] = [inputZ_, inputPtr_, outputZ_, outputPtr_];
			inputZ.set(targetComplex, 0);
			wasm.fft_fft(fftPtr, inputPtr, inputZ.length, outputPtr, outputZ.length);
			[inputZ, inputPtr, outputZ, outputPtr] = [outputZ, outputPtr, inputZ, inputPtr];
			wasm.fft_ifft(fftPtr, inputPtr, inputZ.length, outputPtr, outputZ.length);
			return outputZ;
		}).
		add('[wasm] rust copy with instance', () => {
			let [input, output] = [input_, output_];
			input.set(targetComplex, 0);
			fftinstance.fft(input, output);
			[input, output] = [output, input];
			fftinstance.ifft(input, output);
			return output;
		}).
		add('[wasm] rust no copy', () => {
			// create new Float32Array view for pointer to avoid detached ArrayBuffer
			const inputZ_  = new Float32Array(wasm.memory.buffer, inputPtr_, input_.length);
			const outputZ_ = new Float32Array(wasm.memory.buffer, outputPtr_, output_.length);
			let [inputZ, inputPtr, outputZ, outputPtr] = [inputZ_, inputPtr_, outputZ_, outputPtr_];
			inputZ.set(targetComplex, 0);
			wasm.fft(inputPtr, inputZ.length, outputPtr, outputZ.length, targetReal.length);
			[inputZ, inputPtr, outputZ, outputPtr] = [outputZ, outputPtr, inputZ, inputPtr];
			wasm.ifft(inputPtr, inputZ.length, outputPtr, outputZ.length, targetReal.length);
			return outputZ;
		}).
		add('[wasm] rust copy', () => {
			let [input, output] = [input_, output_];
			input.set(targetComplex, 0);
			lib.fft(input, output, targetReal.length);
			[input, output] = [output, input];
			lib.ifft(input, output, targetReal.length);
			return output;
		}).
		add('[js native] dsp.js', () => {
			fftDspJs.forward(targetReal);
			return fftDspJs.inverse(fftDspJs.real, fftDspJs.imag);
		}).
		on('cycle', function(event) {
			console.log(String(event.target));
		}).
		on('error', function(event) {
			console.log(event.target);
		}).
		on('complete', function() {
			console.log('Fastest is ' + this.filter('fastest').map('name'));
		}).
		run({ 'async': true });
})();
